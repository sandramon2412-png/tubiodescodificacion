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

/** Edita varias fotos (máx. 3 a la vez). onDone(i, url|null, error) se llama por cada una. */
export async function editImages(api, urls, opts, onDone = () => {}) {
  const out = new Array(urls.length);
  let next = 0;
  const worker = async () => {
    while (next < urls.length) {
      const i = next++;
      try {
        out[i] = (await api('/api/photo/edit', { method: 'POST', body: { ...opts, url: urls[i] } })).url;
        onDone(i, out[i]);
      } catch (e) {
        out[i] = null;
        onDone(i, null, e);
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  return out;
}

export const describe = (api, images, notes, language) =>
  api('/api/ai/describe', { method: 'POST', body: { images, notes, language } });

/** Convierte la respuesta de la IA en los campos del formulario / inventario. */
export function listingToFields({ listing, categories = [] }) {
  const specifics = [...listing.itemSpecifics];
  if (listing.material && !specifics.some((s) => s.name.toLowerCase() === 'material')) specifics.push({ name: 'Material', value: listing.material });
  return {
    title: listing.title,
    description: listing.description,
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
      listing.priceReason && `💲 ${listing.priceReason}`,
      ...listing.checkBeforePublishing.map((c) => `☐ ${c}`),
    ].filter(Boolean).join('\n'),
  };
}
