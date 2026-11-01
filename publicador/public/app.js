import { CONDITIONS, forPoshmark, forDepop, asCopyText } from './formatters.js';
import { initStore, load, mutate, findItem } from './store.js';
import { initInventory, newItem } from './inventory.js';
import { initFinance } from './finance.js';
import { syncEbay } from './ebay-sync.js';
import { uploadImage, runStudio, describe, listingToFields, PROPS_NOTE } from './studio-api.js';
import { initLote, studioOptions } from './lote.js';

const $ = (id) => document.getElementById(id);
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* modo privado */ } },
  del(k) { try { localStorage.removeItem(k); } catch { /* modo privado */ } },
};
let password = store.get('pw', '');
let config = null;
const uploaded = []; // URLs de fotos subidas (o ya editadas)
const originals = []; // fotos antes de editarlas: la IA las usa para leer etiquetas
let currentItemId = null; // artículo del inventario que se está publicando
let started = false;

async function api(path, { method = 'GET', body } = {}) {
  const r = await fetch(path, {
    method,
    headers: { 'x-app-password': password, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({ error: `Error ${r.status}` }));
  if (!r.ok) throw Object.assign(new Error(data.error || `Error ${r.status}`), { status: r.status });
  return data;
}

// ── Acceso ────────────────────────────────────────────────
async function boot() {
  for (const [value, c] of Object.entries(CONDITIONS)) $('condition').add(new Option(c.label, value));
  $('condition').value = 'like_new';
  if (!password) return showLogin();
  try {
    config = await api('/api/config');
    showApp();
  } catch (e) {
    showLogin(e.status === 401 ? '' : e.message);
  }
}

function showLogin(msg = '') {
  $('login').hidden = false; $('app').hidden = true; $('logout').hidden = true;
  $('loginMsg').textContent = msg; $('loginMsg').className = 'msg err';
  $('pw').focus();
}

$('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  password = $('pw').value;
  try {
    config = await api('/api/config');
    store.set('pw', password);
    showApp();
  } catch (err) {
    showLogin(err.message);
  }
});

$('logout').addEventListener('click', () => { store.del('pw'); password = ''; showLogin(); });

function showApp() {
  $('login').hidden = true; $('app').hidden = false; $('logout').hidden = false;
  renderStatus();
  if (!started) {
    started = true;
    initStore(api);
    initInventory({ api, loadIntoForm });
    initFinance();
    initLote({ api, config, loadIntoForm });
    restoreDraft();
    document.querySelectorAll('.ebaySync').forEach((b) => b.addEventListener('click', () => syncEbay(api)));
  }
  document.querySelectorAll('.ebaySync').forEach((b) => { b.hidden = !config.ebay.ready; });
  $('editPhotosBtn').disabled = !config.photos;
  $('aiBtn').disabled = !config.ai;
  $('assistHint').textContent = [!config.photos && 'Para editar fotos añade PHOTOROOM_API_KEY en Vercel.', !config.ai && 'Para escribir con IA añade ANTHROPIC_API_KEY en Vercel.'].filter(Boolean).join(' ');
  load().then(() => { if (config.ebay.ready) syncEbay(api, { silent: true }); });
}

// ── Pestañas ──────────────────────────────────────────────
function showTab(name) {
  document.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === name)));
  document.querySelectorAll('.tab').forEach((t) => { t.hidden = t.id !== `tab-${name}`; });
  store.set('tab', name);
  const slot = $(`studioSlot-${name}`);
  (slot || $('studioParking')).append($('studioOptions'));
  window.scrollTo({ top: 0 });
}
document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
showTab(store.get('tab', 'publicar'));

function renderStatus() {
  const { ebay, uploads } = config;
  const el = $('status');
  el.innerHTML = '';
  const pill = (txt, cls) => Object.assign(document.createElement('span'), { className: `pill ${cls || ''}`, textContent: txt });
  el.append(pill(ebay.ready ? `eBay listo (${ebay.env})` : `eBay sin terminar (${ebay.env})`, ebay.ready ? 'ok' : 'err'));
  el.append(pill(uploads ? 'Fotos e inventario activos' : 'Falta Blob Store (fotos e inventario)', uploads ? 'ok' : 'err'));
  if (ebay.canConnect) {
    const b = Object.assign(document.createElement('button'), { className: 'ghost', type: 'button', textContent: ebay.missing.includes('EBAY_REFRESH_TOKEN') ? 'Conectar eBay' : 'Reconectar eBay' });
    b.onclick = async () => {
      try { location.href = (await api('/api/ebay/connect')).url; } catch (e) { alert(e.message); }
    };
    el.append(b);
  }
  if (!ebay.missing.includes('EBAY_REFRESH_TOKEN') && ebay.missing.length) {
    const b = Object.assign(document.createElement('button'), { className: 'ghost', type: 'button', textContent: 'Ver mis IDs de eBay' });
    b.onclick = showSetup;
    el.append(b);
  }
  if (ebay.missing.length) {
    el.append(Object.assign(document.createElement('small'), { className: 'hint', textContent: `Faltan en Vercel: ${ebay.missing.join(', ')}` }));
  }
}

async function showSetup() {
  const box = $('setup');
  box.hidden = false;
  box.textContent = 'Consultando eBay…';
  try {
    const data = await api('/api/ebay/setup');
    box.innerHTML = '<p class="hint">Copia cada ID en Vercel → Settings → Environment Variables y haz Redeploy.</p>';
    for (const [variable, items] of Object.entries(data)) {
      const h = Object.assign(document.createElement('h3'), { textContent: variable });
      const ul = document.createElement('ul');
      for (const it of items) ul.append(Object.assign(document.createElement('li'), { textContent: `${it.id} — ${it.name || ''}` }));
      if (!items.length) ul.append(Object.assign(document.createElement('li'), { className: 'err', textContent: 'Ninguno todavía.' }));
      box.append(h, ul);
    }
    if (!data.EBAY_MERCHANT_LOCATION_KEY.length) {
      const f = document.createElement('form');
      f.className = 'row wrap';
      f.innerHTML = '<input name="postalCode" placeholder="Código postal desde donde envías" required style="flex:1"><input name="country" value="US" maxlength="2" style="width:70px"><button>Crear ubicación</button>';
      f.onsubmit = async (e) => {
        e.preventDefault();
        try {
          const r = await api('/api/ebay/setup', { method: 'POST', body: Object.fromEntries(new FormData(f)) });
          alert(`Ubicación creada. Pon EBAY_MERCHANT_LOCATION_KEY=${r.key} en Vercel.`);
          showSetup();
        } catch (err) { alert(err.message); }
      };
      box.append(f);
    }
    if (!data.EBAY_FULFILLMENT_POLICY_ID.length) {
      box.append(Object.assign(document.createElement('p'), { className: 'hint', textContent: 'Sin políticas: actívalas en eBay Seller Hub → Account → Business policies y crea envío, pago y devoluciones.' }));
    }
  } catch (e) {
    box.textContent = e.message;
  }
}

// ── Fotos ─────────────────────────────────────────────────
$('photos').addEventListener('change', async (e) => {
  const files = [...e.target.files];
  e.target.value = '';
  for (const file of files) {
    const fig = addThumb(URL.createObjectURL(file), true);
    try {
      const url = await uploadImage(api, file);
      uploaded.push(url);
      originals.push(url);
      fig.remove();
      renderThumbs();
    } catch (err) {
      fig.remove();
      alert(err.message);
    }
  }
});

function addThumb(src, loading) {
  const fig = document.createElement('figure');
  fig.innerHTML = `<img alt="" class="${loading ? 'loading' : ''}">`;
  fig.firstChild.src = src;
  $('thumbs').append(fig);
  return fig;
}

function renderThumbs() {
  $('thumbs').querySelectorAll('figure:not(:has(.loading))').forEach((f) => f.remove());
  uploaded.forEach((url, i) => {
    const fig = addThumb(url);
    const x = Object.assign(document.createElement('button'), { type: 'button', textContent: '×', title: 'Quitar' });
    x.onclick = () => { uploaded.splice(i, 1); originals.splice(i, 1); renderThumbs(); saveDraft(); };
    fig.append(x);
  });
  saveDraft();
}

const allImages = () => [
  ...uploaded,
  ...$('photoUrls').value.split('\n').map((s) => s.trim()).filter((s) => /^https:\/\//.test(s)),
];

/** Fija las fotos del formulario. originals = las fotos reales (sin editar) que lee la IA. */
function setPhotos(images = [], orig = []) {
  uploaded.splice(0, uploaded.length, ...images);
  originals.splice(0, originals.length, ...(orig.length ? orig : images));
}

// ── Asistente: fotos e IA ─────────────────────────────────
let lastAi = null; // última respuesta de la IA para este artículo (su "look" sirve para las fotos)

function showComps(result) {
  if (result?.comps?.count) {
    $('aiNotes').textContent += `\n📊 eBay: ${result.comps.count} anuncios parecidos entre ${result.comps.low} y ${result.comps.high} (mediana ${result.comps.median}).`;
  }
}

$('editPhotosBtn').addEventListener('click', async () => {
  if (!originals.length) return alert('Sube primero tus fotos.');
  const opts = studioOptions();
  if (!opts.style) return alert('Elige un fondo para las fotos.');
  if (!opts.kinds.length) return alert('Marca al menos un tipo de foto (gancho, piso, modelo o fondo nuevo).');
  const btn = $('editPhotosBtn');
  btn.disabled = true;
  try {
    const r = await runStudio(api, {
      urls: [...originals], notes: $('aiNotesInput').value, opts, ai: lastAi,
      onProgress: (t) => { btn.textContent = t; },
    });
    if (r.ai && r.ai !== lastAi) { lastAi = r.ai; applyFields(listingToFields(r.ai, { usedFlatlay: r.usedFlatlay, language: opts.language })); showComps(r.ai); }
    else if (r.usedFlatlay) addPropsNote(opts.language);
    setPhotos(r.images, [...originals]);
    renderThumbs();
    $('undoEditBtn').hidden = false;
    if (r.failures.length) alert(`${r.failures.length} foto(s) no se pudieron crear: ${[...new Set(r.failures)].join(' · ')}`);
  } catch (e) {
    alert(e.message);
  } finally {
    btn.disabled = !config.photos;
    btn.textContent = '🎨 Crear fotos';
  }
});

function addPropsNote(language) {
  const note = PROPS_NOTE[language] || PROPS_NOTE.en;
  if (!$('description').value.includes(note)) $('description').value = `${$('description').value.trim()}\n\n${note}`.trim();
  saveDraft();
}

$('undoEditBtn').addEventListener('click', () => {
  setPhotos([...originals], [...originals]);
  renderThumbs();
  $('undoEditBtn').hidden = true;
});

$('aiBtn').addEventListener('click', async () => {
  const images = originals.length ? [...originals] : allImages();
  if (!images.length) return alert('Sube primero tus fotos (incluye una de la etiqueta si puedes).');
  const btn = $('aiBtn');
  btn.disabled = true;
  btn.textContent = 'La IA está escribiendo… (hasta 1 min)';
  try {
    lastAi = await describe(api, images, $('aiNotesInput').value, studioOptions().language);
    applyFields(listingToFields(lastAi, { language: studioOptions().language }));
    showComps(lastAi);
  } catch (e) {
    alert(e.message);
  } finally {
    btn.disabled = !config.ai;
    btn.textContent = '✨ Escribir anuncio con IA';
  }
});

function applyFields(f) {
  for (const k of ['title', 'description', 'brand', 'size', 'color', 'condition', 'price', 'keywords', 'extraAspects', 'catSearch']) {
    if (f[k] !== undefined && f[k] !== '') $(k).value = f[k];
  }
  const sel = $('ebayCategoryId');
  if (f.categories?.length) {
    sel.length = 1;
    for (const c of f.categories) sel.add(new Option(`${c.path} (${c.id})`, c.id));
    sel.value = f.ebayCategoryId;
  }
  $('aiNotes').textContent = f.aiNotes || '';
  $('aiNotes').hidden = !f.aiNotes;
  updateCount();
  saveDraft();
}

// ── Categorías eBay ───────────────────────────────────────
async function searchCategories() {
  const q = $('catSearch').value.trim() || $('title').value.trim();
  if (!q) return;
  const sel = $('ebayCategoryId');
  $('catBtn').disabled = true;
  try {
    const { categories } = await api(`/api/ebay/categories?q=${encodeURIComponent(q)}`);
    sel.length = 1;
    for (const c of categories) sel.add(new Option(`${c.path} (${c.id})`, c.id));
    sel.options[0].textContent = categories.length ? '— elige una categoría —' : 'Sin resultados, prueba en inglés';
    if (categories.length) sel.selectedIndex = 1;
  } catch (e) {
    alert(e.message);
  } finally {
    $('catBtn').disabled = false;
  }
}
$('catBtn').addEventListener('click', searchCategories);
$('catSearch').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); searchCategories(); } });
$('toEbay').addEventListener('change', (e) => { $('ebayFields').hidden = !e.target.checked; });

// ── Borrador ──────────────────────────────────────────────
const FIELDS = ['title', 'description', 'price', 'quantity', 'condition', 'brand', 'size', 'color', 'cost', 'location', 'keywords', 'extraAspects', 'photoUrls', 'catSearch'];
function saveDraft() {
  store.set('draft', { ...Object.fromEntries(FIELDS.map((f) => [f, $(f).value])), uploaded, originals, currentItemId });
}
function restoreDraft() {
  const d = store.get('draft', null);
  if (!d) return;
  FIELDS.forEach((f) => { if (d[f] != null) $(f).value = d[f]; });
  setPhotos(d.uploaded, d.originals);
  setEditing(d.currentItemId || null);
  renderThumbs(); updateCount();
}

function setEditing(id) {
  currentItemId = id;
  $('editingBanner').hidden = !id;
}

/** Carga un artículo del inventario en el formulario para publicarlo (o republicarlo). */
function loadIntoForm(item) {
  lastAi = null;
  const values = { ...item, price: item.price || '', cost: item.cost || '', quantity: item.quantity || 1, photoUrls: '', catSearch: '' };
  FIELDS.forEach((f) => { $(f).value = values[f] ?? ''; });
  if (item.ebayCategoryId) {
    const sel = $('ebayCategoryId');
    if (![...sel.options].some((o) => o.value === item.ebayCategoryId)) sel.add(new Option(`Categoría ${item.ebayCategoryId}`, item.ebayCategoryId));
    sel.value = item.ebayCategoryId;
  }
  setPhotos(item.images, item.originalImages);
  $('aiNotes').hidden = !item.aiNotes; $('aiNotes').textContent = item.aiNotes || '';
  setEditing(item.id);
  renderThumbs(); updateCount();
  $('results').hidden = true;
  showTab('publicar');
}

function clearForm() {
  lastAi = null;
  $('listingForm').reset();
  $('condition').value = 'like_new';
  setPhotos([], []);
  $('aiNotes').hidden = true;
  setEditing(null);
  renderThumbs(); updateCount();
}
$('newListing').addEventListener('click', clearForm);
$('listingForm').addEventListener('input', saveDraft);

function updateCount() {
  const el = document.querySelector('.count[data-for="title"]');
  el.textContent = `${$('title').value.length}/80`;
}
$('title').addEventListener('input', updateCount);

// ── Publicar ──────────────────────────────────────────────
function readListing() {
  return {
    title: $('title').value.trim(),
    description: $('description').value.trim(),
    price: Number($('price').value),
    quantity: Number($('quantity').value) || 1,
    condition: $('condition').value,
    brand: $('brand').value.trim(),
    size: $('size').value.trim(),
    color: $('color').value.trim(),
    keywords: $('keywords').value,
    extraAspects: $('extraAspects').value,
    ebayCategoryId: $('ebayCategoryId').value,
    cost: Number($('cost').value) || 0,
    location: $('location').value.trim(),
    images: allImages(),
  };
}

/** Guarda (o actualiza) el artículo del formulario en el inventario. Devuelve su id. */
function saveToInventory(listing, listings = {}) {
  const { title, description, price, quantity, condition, brand, size, color, keywords, extraAspects, ebayCategoryId, cost, location, images } = listing;
  const data = { title, description, price, quantity, condition, brand, size, color, keywords, extraAspects, ebayCategoryId, cost, location, images, originalImages: [...originals] };
  const existing = currentItemId && findItem(currentItemId);
  let id = existing?.id;
  mutate((db) => {
    const item = existing && db.items.find((x) => x.id === existing.id);
    if (item) {
      Object.assign(item, data);
      item.listings = { ...item.listings, ...listings };
      if (['retirado', 'borrador'].includes(item.status) && Object.keys(listings).length) item.status = 'disponible';
    } else {
      const created = newItem({ ...data, listings });
      id = created.id;
      db.items.push(created);
    }
  });
  setEditing(id);
  saveDraft();
  return id;
}

$('saveOnlyBtn').addEventListener('click', () => {
  const listing = readListing();
  if (!listing.title) return alert('Escribe al menos el título.');
  saveToInventory(listing);
  alert('Guardado en el inventario.');
});

$('listingForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const listing = readListing();
  const targets = { ebay: $('toEbay').checked, poshmark: $('toPoshmark').checked, depop: $('toDepop').checked };
  if (!Object.values(targets).some(Boolean)) return alert('Elige al menos una plataforma.');

  const listings = {};
  const out = $('resultList');
  out.innerHTML = '';
  $('results').hidden = false;
  $('publishBtn').disabled = true;

  if (targets.ebay) {
    const line = Object.assign(document.createElement('p'), { textContent: 'eBay: publicando…' });
    out.append(line);
    try {
      const r = await api('/api/ebay/publish', { method: 'POST', body: listing });
      line.className = 'ok';
      line.innerHTML = 'eBay: ✓ publicado — ';
      line.append(Object.assign(document.createElement('a'), { href: r.url, target: '_blank', rel: 'noopener', textContent: `ver anuncio ${r.listingId}` }));
      listings.ebay = { status: 'publicado', url: r.url, listingId: r.listingId, offerId: r.offerId, sku: r.sku };
    } catch (err) {
      line.className = 'err';
      line.textContent = `eBay: ✗ ${err.message}`;
      listings.ebay = { status: 'error' };
    }
  }

  if (targets.poshmark) {
    out.append(assistCard('poshmark', 'Poshmark', 'https://poshmark.com/create-listing',
      'Poshmark no tiene API pública para publicar. Copia los datos, abre el formulario y sube las fotos (guárdalas desde aquí abajo).',
      forPoshmark(listing),
      { title: 'Título', description: 'Descripción', brand: 'Marca', size: 'Talla', color: 'Color', condition: 'Condición', price: 'Precio', styleTags: 'Estilos' },
      listing.images));
    listings.poshmark = { status: 'pendiente' };
  }
  if (targets.depop) {
    out.append(assistCard('depop', 'Depop', 'https://www.depop.com/products/create/',
      'La API de Depop es solo para socios aprobados. Copia los datos, abre el formulario y sube las fotos.',
      forDepop(listing),
      { description: 'Descripción', brand: 'Marca', size: 'Talla', condition: 'Condición', price: 'Precio' },
      listing.images));
    listings.depop = { status: 'pendiente' };
  }

  const itemId = saveToInventory(listing, listings);
  out.querySelectorAll('.assist').forEach((n) => { n.dataset.item = itemId; });
  $('publishBtn').disabled = false;
  $('results').scrollIntoView({ behavior: 'smooth' });
});

function copy(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const old = btn.textContent; btn.textContent = '¡Copiado!';
    setTimeout(() => { btn.textContent = old; }, 1200);
  }, () => prompt('Copia el texto:', text));
}

function assistCard(key, name, url, hint, fields, labels, images) {
  const node = $('assistTpl').content.firstElementChild.cloneNode(true);
  node.querySelector('h3').textContent = name;
  node.querySelector('.hint').textContent = hint;
  const dl = node.querySelector('dl');
  for (const [k, v] of Object.entries(fields)) {
    if (!v) continue;
    const dt = Object.assign(document.createElement('dt'), { textContent: labels[k] || k });
    const dd = Object.assign(document.createElement('dd'), { textContent: v });
    const b = Object.assign(document.createElement('button'), { type: 'button', className: 'ghost', textContent: 'Copiar' });
    b.onclick = () => copy(v, b);
    dd.append(b);
    dl.append(dt, dd);
  }
  node.querySelector('.copyAll').onclick = (e) => copy(asCopyText(fields, labels), e.target);
  node.querySelector('.open').href = url;
  node.querySelector('.markDone').onclick = (e) => {
    const id = node.dataset.item;
    mutate((db) => {
      const item = db.items.find((x) => x.id === id);
      if (item) item.listings[key] = { ...item.listings[key], status: 'publicado' };
    });
    e.target.textContent = '✓ Marcado'; e.target.disabled = true;
  };
  const photos = node.querySelector('.photoLinks');
  images.forEach((src) => {
    const a = Object.assign(document.createElement('a'), { href: src, target: '_blank', rel: 'noopener', title: 'Abrir para guardar' });
    a.append(Object.assign(document.createElement('img'), { src, alt: 'Foto' }));
    photos.append(a);
  });
  return node;
}

boot();
