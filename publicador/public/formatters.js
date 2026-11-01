// Formatea un anuncio para cada plataforma respetando sus límites.
// Módulo puro: lo usan el navegador y los tests.

export const CONDITIONS = {
  new_tags: { label: 'Nuevo con etiqueta', poshmark: 'New With Tags (NWT)', depop: 'Brand new' },
  new_no_tags: { label: 'Nuevo sin etiqueta', poshmark: 'Like New', depop: 'Like new' },
  like_new: { label: 'Como nuevo', poshmark: 'Like New', depop: 'Used - Excellent' },
  good: { label: 'Buen estado', poshmark: 'Good', depop: 'Used - Good' },
  fair: { label: 'Aceptable', poshmark: 'Fair', depop: 'Used - Fair' },
};

export const LIMITS = {
  ebayTitle: 80,
  poshmarkTitle: 80,
  poshmarkDescription: 1500,
  depopDescription: 1000,
  depopHashtags: 5,
};

export const clip = (s, n) => {
  const str = String(s ?? '');
  return str.length <= n ? str : str.slice(0, Math.max(0, n - 1)).trimEnd() + '…';
};

export function hashtags(keywords, max = LIMITS.depopHashtags) {
  const seen = new Set();
  return String(keywords || '')
    .split(/[,\n#]+/)
    .map((w) => w.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ''))
    .filter((w) => w && !seen.has(w) && seen.add(w))
    .slice(0, max)
    .map((w) => `#${w}`);
}

function details(l, conditionLabel) {
  return [
    l.brand && `Brand: ${l.brand}`,
    l.size && `Size: ${l.size}`,
    l.color && `Color: ${l.color}`,
    conditionLabel && `Condition: ${conditionLabel}`,
  ].filter(Boolean);
}

export function forPoshmark(l) {
  const cond = CONDITIONS[l.condition]?.poshmark || '';
  return {
    title: clip(l.title, LIMITS.poshmarkTitle),
    description: clip(l.description, LIMITS.poshmarkDescription),
    brand: l.brand || '',
    size: l.size || '',
    color: l.color || '',
    condition: cond,
    price: l.price ? String(l.price) : '',
    styleTags: hashtags(l.keywords, 3).map((t) => t.slice(1)).join(', '),
  };
}

export function forDepop(l) {
  const cond = CONDITIONS[l.condition]?.depop || '';
  const tags = hashtags(l.keywords).join(' ');
  const head = [l.title, '', l.description, '', ...details(l, '')].join('\n').trim();
  const room = LIMITS.depopDescription - (tags ? tags.length + 2 : 0);
  return {
    description: tags ? `${clip(head, room)}\n\n${tags}` : clip(head, LIMITS.depopDescription),
    brand: l.brand || '',
    size: l.size || '',
    condition: cond,
    price: l.price ? String(l.price) : '',
  };
}

export function asCopyText(fields, labels) {
  return Object.entries(fields)
    .filter(([, v]) => v)
    .map(([k, v]) => `${labels[k] || k}: ${v}`)
    .join('\n');
}
