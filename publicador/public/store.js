// Estado compartido del inventario/finanzas, guardado en /api/data (Vercel Blob).
export const state = { db: null, version: null, error: '' };
const listeners = new Set();
let api;
let queue = Promise.resolve();

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
export const today = () => new Date().toISOString().slice(0, 10);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function initStore(apiFn) { api = apiFn; }
export function subscribe(fn) { listeners.add(fn); }
const emit = () => listeners.forEach((fn) => fn(state));

export async function load() {
  try {
    const r = await api('/api/data');
    state.db = r.data;
    state.version = r.version;
    state.error = '';
  } catch (e) {
    state.db = null;
    state.error = e.message;
  }
  emit();
}

/**
 * Aplica un cambio en memoria, refresca la pantalla y lo guarda en orden.
 * fn debe cambiar solo el `db` que recibe: si el servidor cambió entretanto (p. ej. la revisión
 * automática apuntó una venta), se recargan los datos y se vuelve a aplicar fn sobre ellos.
 */
export function mutate(fn) {
  if (!state.db) { alert(state.error || 'El inventario no está disponible.'); return Promise.resolve(false); }
  fn(state.db);
  emit();
  queue = queue.then(async () => {
    for (let attempt = 0; ; attempt++) {
      try {
        const r = await api('/api/data', { method: 'PUT', body: { data: state.db, baseVersion: state.version } });
        state.version = r.version;
        return true;
      } catch (e) {
        if (e.status !== 409 || attempt >= 2) throw e;
        const fresh = await api('/api/data');
        state.db = fresh.data;
        state.version = fresh.version;
        fn(state.db);
        emit();
      }
    }
  }).catch((e) => {
    alert(`No se pudo guardar: ${e.message}`);
    return false;
  });
  return queue;
}

export const findItem = (id) => state.db?.items.find((i) => i.id === id);

export function money(n) {
  const currency = state.db?.settings?.currency || 'USD';
  try { return new Intl.NumberFormat('es', { style: 'currency', currency }).format(Number(n) || 0); }
  catch { return `${(Number(n) || 0).toFixed(2)} ${currency}`; }
}
