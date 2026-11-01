// "Base de datos" sencilla en Vercel Blob: cada guardado crea un archivo JSON nuevo e inmutable
// (datos/db-<timestamp>-<aleatorio>.json). Leer = tomar el más reciente. Así nunca se lee una
// versión cacheada y quedan copias de seguridad de los últimos guardados.
import { put, list, del } from '@vercel/blob';

const PREFIX = 'datos/db-';
const KEEP = 10; // copias anteriores que se conservan

export const emptyDb = () => ({ items: [], expenses: [], settings: {}, offers: [], notifications: [] });

export function normalizeDb(data) {
  const d = data && typeof data === 'object' ? data : {};
  return {
    items: Array.isArray(d.items) ? d.items : [],
    expenses: Array.isArray(d.expenses) ? d.expenses : [],
    settings: d.settings && typeof d.settings === 'object' && !Array.isArray(d.settings) ? d.settings : {},
    offers: Array.isArray(d.offers) ? d.offers.slice(-300) : [],
    notifications: Array.isArray(d.notifications) ? d.notifications.slice(-150) : [],
  };
}

async function versions() {
  const all = [];
  let cursor;
  do {
    const page = await list({ prefix: PREFIX, limit: 1000, cursor });
    all.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  // El timestamp va con ancho fijo en el nombre, así que el orden alfabético es cronológico.
  return all.sort((a, b) => (a.pathname < b.pathname ? 1 : -1));
}

export async function readDb() {
  const [latest] = await versions();
  if (!latest) return { version: null, data: emptyDb() };
  const r = await fetch(latest.url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`No se pudo leer el inventario (${r.status}).`);
  return { version: latest.pathname, data: normalizeDb(await r.json()) };
}

export class ConflictError extends Error {}

export async function writeDb(data, baseVersion) {
  const current = await versions();
  const currentVersion = current[0]?.pathname ?? null;
  if (currentVersion !== (baseVersion ?? null)) {
    throw new ConflictError('Los datos cambiaron en otro dispositivo. Recarga la página.');
  }
  const ts = String(Date.now()).padStart(15, '0');
  const blob = await put(`${PREFIX}${ts}.json`, JSON.stringify(normalizeDb(data)), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: true,
  });
  const old = current.slice(KEEP - 1).map((b) => b.url);
  if (old.length) await del(old).catch(() => {});
  return { version: blob.pathname };
}

/**
 * Lee, aplica fn(data) y guarda; si otro proceso guardó a la vez, vuelve a leer y reintenta.
 * fn debe trabajar solo sobre el `data` que recibe. Devuelve lo que devuelva fn.
 */
export async function updateDb(fn, tries = 4) {
  for (let i = 0; i < tries; i++) {
    const { version, data } = await readDb();
    const result = await fn(data);
    try {
      await writeDb(data, version);
      return result;
    } catch (e) {
      if (!(e instanceof ConflictError) || i === tries - 1) throw e;
    }
  }
}
