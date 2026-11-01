// Funciones compartidas de fotos e IA (las usan Publicar y Lote).

/** Reduce la foto a 1600 px en el navegador y la devuelve como JPEG (data URL). */
export function resize(file, max = 1600) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = Object.assign(document.createElement('canvas'), { width: Math.round(img.width * k), height: Math.round(img.height * k) });
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error(`No se pudo leer ${file.name}`));
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadImage(api, file) {
  const { url } = await api('/api/upload', { method: 'POST', body: { dataUrl: await resize(file) } });
  return url;
}

export const newSeed = () => 1 + Math.floor(Math.random() * 2_000_000_000);

/** Ejecuta tareas asíncronas con un máximo de `n` a la vez. Devuelve [{ ok, value | error }]. */
export async function pool(tasks, n = 3, onDone = () => {}) {
  const out = new Array(tasks.length);
  let next = 0;
  const worker = async () => {
    while (next < tasks.length) {
      const i = next++;
      try { out[i] = { ok: true, value: await tasks[i]() }; } catch (error) { out[i] = { ok: false, error }; }
      onDone(i, out[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(n, tasks.length) }, worker));
  return out;
}

const SCENE_ORDER = ['hanger', 'model', 'flatlay']; // orden en que salen en el anuncio

export const PROPS_NOTE = {
  en: 'Accessories shown are for styling only and are not included.',
  es: 'Los accesorios de las fotos son solo decoración y no se incluyen.',
};

/**
 * Crea las fotos de un artículo y (si hace falta) escribe el anuncio.
 *  urls: fotos reales. La 1.ª es la principal: de ella salen gancho, piso y modelo.
 *  opts: studioOptions() → { style, kinds[], modelName, iron, language, prompt, backgroundUrl }.
 *  write: escribir el anuncio con IA. ai: resultado previo de la IA (para no repetirlo).
 * Devuelve { ai, images, failures, usedFlatlay }.
 */
export async function runStudio(api, { urls, notes = '', opts, write = false, ai = null, onProgress = () => {} }) {
  const kinds = opts.kinds || [];
  const needAi = !ai && (write || (opts.style === 'auto' && kinds.length && opts.aiAvailable));
  if (needAi) {
    onProgress('La IA está mirando la prenda…');
    ai = await describe(api, urls, notes, opts.language);
  }
  const look = ai?.listing?.look;
  const detail = new Set(ai?.listing?.detailPhotoIndexes || []);
  const base = { style: opts.style, look, modelName: opts.modelName, iron: opts.iron, prompt: opts.prompt, backgroundUrl: opts.backgroundUrl, seed: newSeed() };
  const edit = (url, kind) => () => api('/api/photo/edit', { method: 'POST', body: { ...base, url, kind } }).then((r) => r.url);

  const scenes = opts.style ? SCENE_ORDER.filter((k) => kinds.includes(k)) : [];
  const bg = Boolean(opts.style) && kinds.includes('background');
  const tasks = [
    ...scenes.map((k) => edit(urls[0], k)),
    ...urls.map((u, i) => (bg && !detail.has(i) ? edit(u, 'background') : async () => u)),
  ];
  let done = 0;
  const total = tasks.length;
  const results = await pool(tasks, 3, () => onProgress(`Creando fotos ${++done}/${total}…`));
  const failures = results.filter((r) => !r.ok).map((r) => r.error.message);
  const sceneImgs = results.slice(0, scenes.length).map((r, i) => (r.ok ? { kind: scenes[i], url: r.value } : null)).filter(Boolean);
  const real = results.slice(scenes.length).map((r, i) => (r.ok ? r.value : urls[i]));
  return {
    ai,
    images: [...sceneImgs.map((x) => x.url), ...real],
    failures,
    usedFlatlay: sceneImgs.some((x) => x.kind === 'flatlay'),
  };
}

export const describe = (api, images, notes, language) =>
  api('/api/ai/describe', { method: 'POST', body: { images, notes, language } });

/** Convierte la respuesta de la IA en los campos del formulario / inventario. */
export function listingToFields({ listing, categories = [] }, { usedFlatlay = false, language = 'en' } = {}) {
  const specifics = [...listing.itemSpecifics];
  if (listing.material && !specifics.some((s) => s.name.toLowerCase() === 'material')) specifics.push({ name: 'Material', value: listing.material });
  return {
    title: listing.title,
    description: usedFlatlay ? `${listing.description}\n\n${PROPS_NOTE[language] || PROPS_NOTE.en}` : listing.description,
    brand: listing.brand,
    size: listing.size,
    color: listing.color,
    condition: listing.condition,
    price: listing.suggestedPrice || '',
    keywords: listing.keywords.join(', '),
    extraAspects: specifics.filter((s) => s.name && s.value).map((s) => `${s.name}: ${s.value}`).join('\n'),
    catSearch: listing.ebayCategoryQuery,
    ebayCategoryId: categories[0]?.id || '',
    categories,
    aiNotes: [
      listing.aesthetic && `🎨 Estilo detectado: ${listing.aesthetic}`,
      listing.priceReason && `💲 ${listing.priceReason}`,
      ...listing.checkBeforePublishing.map((c) => `☐ ${c}`),
    ].filter(Boolean).join('\n'),
  };
}
