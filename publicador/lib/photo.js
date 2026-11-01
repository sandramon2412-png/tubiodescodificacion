// Edición de fotos con la Image Editing API de Photoroom (plan Plus).
// Docs: https://docs.photoroom.com — GET /v2/edit con la foto como URL pública (imageUrl).
import { put } from '@vercel/blob';

// Estilos de fondo. Los prompts van en inglés porque el modelo de fondos los entiende mejor.
export const STYLES = {
  boutique: {
    label: 'Boutique vintage',
    prompt: 'cozy vintage boutique interior, antique wooden dresser, brass details, dried flowers in a vase, cream plaster wall, warm soft afternoon light, elegant, photorealistic',
  },
  madera: {
    label: 'Madera y alfombra',
    prompt: 'rustic wooden floorboards with a faded persian rug, warm natural window light, vintage home, photorealistic',
  },
  ladrillo: {
    label: 'Ladrillo y perchero',
    prompt: 'exposed red brick wall, vintage brass clothing rack in the background, warm edison bulb light, thrift store aesthetic, photorealistic',
  },
  floral: {
    label: 'Papel floral',
    prompt: 'pastel vintage floral wallpaper, antique rattan chair, soft diffused daylight, romantic cottagecore, photorealistic',
  },
  blanco: { label: 'Blanco limpio (ideal para eBay)', color: 'FFFFFF' },
  propio: { label: 'Mi propio fondo (foto)' },
  personalizado: { label: 'Describir mi fondo' },
};

export const photoConfigured = () => Boolean(process.env.PHOTOROOM_API_KEY);

/** Construye la URL de Photoroom para una foto. Exportada para los tests. */
export function buildEditUrl({ imageUrl, style = 'boutique', prompt, backgroundUrl, iron = false, seed }) {
  const u = new URL('https://image-api.photoroom.com/v2/edit');
  const q = u.searchParams;
  q.set('imageUrl', imageUrl);
  q.set('outputSize', '1600x1600');
  q.set('padding', '0.1');
  q.set('export.format', 'jpeg');
  q.set('shadow.mode', 'ai.auto-with-overrides');
  q.set('lighting.mode', 'ai.preserve-hue-and-saturation'); // ilumina sin cambiar el color real de la prenda
  const s = STYLES[style] || STYLES.boutique;
  if (style === 'propio') {
    if (!/^https:\/\//.test(backgroundUrl || '')) throw new Error('Sube primero la foto de tu fondo.');
    q.set('background.imageUrl', backgroundUrl);
  } else if (s.color) {
    q.set('background.color', s.color);
  } else {
    const text = style === 'personalizado' ? String(prompt || '').trim() : s.prompt;
    if (!text) throw new Error('Describe el fondo que quieres.');
    q.set('background.prompt', text.slice(0, 500));
    // Misma "semilla" en todas las fotos de un artículo = fondos coherentes entre sí.
    if (Number.isInteger(seed) && seed > 0) q.set('background.seed', String(seed));
  }
  if (iron) q.set('ironing.mode', 'ai.auto');
  return u.toString();
}

export async function editPhoto(opts) {
  const url = buildEditUrl(opts);
  const headers = {
    'x-api-key': process.env.PHOTOROOM_API_KEY,
    'pr-ai-background-model-version': 'background-studio-beta-2025-03-17',
    'pr-ai-shadows-model-version': '2026-04-15',
  };
  if (opts.iron) headers['pr-ironing-model-version'] = 'v2';
  const r = await fetch(url, { headers });
  if (!r.ok) {
    const body = await r.json().catch(() => ({}));
    const msg = body?.error?.message || body?.detail || `error ${r.status}`;
    const hint = r.status === 401 ? ' (revisa PHOTOROOM_API_KEY)' : r.status === 403 ? ' (sin créditos o tu plan no es Plus)' : '';
    const err = new Error(`Photoroom: ${msg}${hint}`);
    err.status = r.status;
    throw err;
  }
  const buffer = Buffer.from(await r.arrayBuffer());
  const blob = await put('fotos/editada.jpg', buffer, { access: 'public', contentType: 'image/jpeg', addRandomSuffix: true });
  return { url: blob.url };
}
