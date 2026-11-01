// Edición de fotos con la Image Editing API de Photoroom (plan Plus).
// Docs: https://docs.photoroom.com — GET /v2/edit con la foto como URL pública (imageUrl).
import { put } from '@vercel/blob';

// Escenarios y modelos predefinidos de "Virtual Model" (docs de Photoroom).
export const MODEL_SCENES = ['street', 'bedroom', 'sunset', 'factory', 'studio', 'coloredstudio', 'concretestudio', 'beach', 'tropical',
  'library', 'forest', 'businessdistrict', 'countryside', 'flowers', 'goldenlight', 'mountain', 'pool', 'latincity', 'cafe',
  'asiancity', 'nightlights', 'desert'];
export const MODELS = ['avery', 'sam', 'taylor', 'kendall', 'jordan', 'casey', 'maya', 'reece', 'lena', 'julia', 'jackson',
  'sophia', 'emma', 'ava', 'zoe', 'fiona'];

// Un "look" describe la escena de cada presentación. Los textos van en inglés porque
// los modelos de imagen los entienden mejor.
//   backdrop:  fondo para las fotos reales (se quita el fondo y se pone este)
//   hanger:    dónde cuelga la prenda con su gancho
//   flatlay:   superficie y accesorios para la foto desde arriba
//   modelScene / modelVibe: escenario y estilo de la modelo virtual
export const STYLES = {
  auto: { label: '✨ Automático según la prenda (IA)' },
  boutique: {
    label: 'Boutique vintage',
    backdrop: 'cozy vintage boutique interior, antique wooden dresser, brass details, dried flowers in a vase, cream plaster wall, warm soft afternoon light, elegant, photorealistic',
    hanger: 'an old weathered wooden door with peeling cream paint and a vintage brass hook, warm afternoon light',
    flatlay: 'aged wooden floorboards with a vintage lace doily, dried flowers, a straw hat and delicate gold jewelry',
    modelScene: 'goldenlight', modelVibe: 'romantic vintage boutique style',
  },
  boho: {
    label: 'Bohemio / hippie',
    backdrop: 'bohemian room with macrame wall hanging, rattan furniture, pampas grass and warm golden sunlight, photorealistic',
    hanger: 'a rustic old wooden door with a woven macrame hanging and a wrought iron hook, warm golden light',
    flatlay: 'a faded persian rug with turquoise jewelry, a woven straw bag, leather sandals and pampas grass',
    modelScene: 'countryside', modelVibe: 'free-spirited bohemian festival style',
  },
  deportivo: {
    label: 'Deportivo',
    backdrop: 'bright modern gym with clean concrete, wooden accents and green plants, soft daylight, photorealistic',
    hanger: 'a clean white locker-room wall with a matte black metal hook, bright daylight',
    flatlay: 'a light concrete floor with running sneakers, a water bottle, wireless earbuds and a rolled yoga mat',
    modelScene: 'concretestudio', modelVibe: 'athletic sporty activewear look',
  },
  urbano: {
    label: 'Urbano / streetwear',
    backdrop: 'exposed red brick wall with graffiti accents and a vintage clothing rack, warm edison bulb light, photorealistic',
    hanger: 'an exposed red brick wall with a black industrial metal hook',
    flatlay: 'a concrete floor with chunky sneakers, a beanie, a skateboard and a film camera',
    modelScene: 'street', modelVibe: 'casual urban streetwear style',
  },
  elegante: {
    label: 'Elegante',
    backdrop: 'luxury minimalist boutique, white marble floor, soft beige walls, gold accents, soft diffused light, photorealistic',
    hanger: 'a cream paneled wall with a gold hook, soft elegant light',
    flatlay: 'white marble with a gold watch, pearl earrings, a small clutch and a perfume bottle',
    modelScene: 'businessdistrict', modelVibe: 'elegant chic evening style',
  },
  floral: {
    label: 'Romántico floral',
    backdrop: 'pastel vintage floral wallpaper, antique rattan chair, soft diffused daylight, romantic cottagecore, photorealistic',
    hanger: 'a pastel floral wallpaper wall with a white vintage porcelain hook',
    flatlay: 'a pink linen sheet with pearls, a satin ribbon and fresh peonies',
    modelScene: 'flowers', modelVibe: 'soft feminine cottagecore style',
  },
  blanco: {
    label: 'Blanco limpio (ideal para eBay)', color: 'FFFFFF',
    hanger: 'a plain white wall with a simple white hook, bright even light',
    flatlay: 'a clean white surface with a few minimal neutral accessories',
    modelScene: 'studio', modelVibe: 'clean minimal e-commerce look',
  },
  propio: { label: 'Mi propio fondo (foto)' },
  personalizado: { label: 'Describir mi fondo' },
};

export const KINDS = { background: 'Fondo nuevo', hanger: 'Colgada en gancho', flatlay: 'En el piso con accesorios', model: 'En modelo' };

export const photoConfigured = () => Boolean(process.env.PHOTOROOM_API_KEY);

const text = (v, max = 400) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, max);

/** Decide la escena de cada presentación: el look de la IA (modo automático) o un estilo fijo. */
export function resolveLook(style, aiLook) {
  const base = STYLES.boutique;
  const fixed = STYLES[style];
  const ai = aiLook && typeof aiLook === 'object' ? aiLook : null;
  const pick = (k) => text((style === 'auto' || !fixed?.[k] ? ai?.[k] : null) || fixed?.[k] || ai?.[k] || base[k]);
  const scene = (style === 'auto' || !fixed?.modelScene ? ai?.modelScene : null) || fixed?.modelScene || ai?.modelScene;
  return {
    backdrop: pick('backdrop'),
    hanger: pick('hanger'),
    flatlay: pick('flatlay'),
    modelScene: MODEL_SCENES.includes(scene) ? scene : base.modelScene,
    modelVibe: pick('modelVibe'),
  };
}

/** Construye la URL de Photoroom para una foto. Exportada para los tests. */
export function buildEditUrl({ imageUrl, kind = 'background', style = 'boutique', prompt, backgroundUrl, iron = false, seed, look, modelName }) {
  const u = new URL('https://image-api.photoroom.com/v2/edit');
  const q = u.searchParams;
  q.set('imageUrl', imageUrl);
  q.set('export.format', 'jpeg');
  const L = resolveLook(style, look);

  if (kind === 'hanger') {
    q.set('removeBackground', 'false');
    q.set('referenceBox', 'originalImage');
    q.set('editWithAI.mode', 'ai.auto');
    q.set('editWithAI.prompt', `Show this exact garment hanging on a wooden clothes hanger against ${L.hanger}. `
      + 'Keep the garment exactly as it is: same color, pattern, fabric, shape, length, buttons, prints and any signs of wear. '
      + 'Do not add text, logos or extra clothing. Professional boutique product photo, natural soft light, the whole garment visible.');
    return u.toString();
  }
  if (kind === 'flatlay') {
    q.set('removeBackground', 'false');
    q.set('flatLay.mode', 'ai.auto');
    q.set('flatLay.prompt', `top-down flat lay of this exact garment, neatly arranged, on ${L.flatlay}. `
      + 'Accessories stay beside the garment and never cover it. Keep the garment colors, pattern and details unchanged.');
    q.set('flatLay.size', 'SQUARE_HD');
    return u.toString();
  }
  if (kind === 'model') {
    q.set('removeBackground', 'false');
    q.set('referenceBox', 'originalImage');
    q.set('virtualModel.mode', 'ai.auto');
    q.set('virtualModel.model.preset.name', MODELS.includes(modelName) ? modelName : 'avery');
    q.set('virtualModel.scene.preset.name', L.modelScene);
    q.set('virtualModel.pose', 'random');
    q.set('virtualModel.prompt', L.modelVibe);
    q.set('virtualModel.size', 'SQUARE_HD');
    return u.toString();
  }

  // kind === 'background': la foto real con fondo nuevo, sombra y luz.
  q.set('outputSize', '1600x1600');
  q.set('padding', '0.1');
  q.set('shadow.mode', 'ai.auto-with-overrides');
  q.set('lighting.mode', 'ai.preserve-hue-and-saturation'); // ilumina sin cambiar el color real de la prenda
  if (style === 'propio') {
    if (!/^https:\/\//.test(backgroundUrl || '')) throw new Error('Sube primero la foto de tu fondo.');
    q.set('background.imageUrl', backgroundUrl);
  } else if (STYLES[style]?.color) {
    q.set('background.color', STYLES[style].color);
  } else {
    const bg = style === 'personalizado' ? text(prompt, 500) : L.backdrop;
    if (!bg) throw new Error('Describe el fondo que quieres.');
    q.set('background.prompt', bg);
    // Misma "semilla" en todas las fotos de un artículo = fondos coherentes entre sí.
    if (Number.isInteger(seed) && seed > 0) q.set('background.seed', String(seed));
  }
  if (iron) q.set('ironing.mode', 'ai.auto');
  return u.toString();
}

export async function editPhoto(opts) {
  const url = buildEditUrl(opts);
  const headers = { 'x-api-key': process.env.PHOTOROOM_API_KEY };
  if (!opts.kind || opts.kind === 'background') {
    headers['pr-ai-background-model-version'] = 'background-studio-beta-2025-03-17';
    headers['pr-ai-shadows-model-version'] = '2026-04-15';
    if (opts.iron) headers['pr-ironing-model-version'] = 'v2';
  }
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
