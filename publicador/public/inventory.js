import { state, subscribe, mutate, findItem, esc, money, uid, today } from './store.js';
import { PLATFORMS, estimateFee, feeRules, applySale, inventoryStats } from './finance-calc.js';
import { CONDITIONS } from './formatters.js';

const $ = (id) => document.getElementById(id);
let deps; // { api, loadIntoForm }

const STATUS_LABEL = { borrador: 'Borrador', disponible: 'Disponible', vendido: 'Vendido', retirado: 'Retirado' };
const LISTING_LABEL = { publicado: 'publicado', pendiente: 'pendiente', retirado: 'retirado', vendido: 'vendido', error: 'error' };

export function initInventory(d) {
  deps = d;
  $('invSearch').addEventListener('input', render);
  $('invStatus').addEventListener('change', render);
  $('invAdd').addEventListener('click', () => openItemDialog(null));
  $('invList').addEventListener('click', onListClick);
  $('itemForm').addEventListener('submit', saveItem);
  $('saleForm').addEventListener('submit', saveSale);
  $('salePlatform').addEventListener('change', updateFeeEstimate);
  $('salePrice').addEventListener('input', updateFeeEstimate);
  for (const [k, v] of Object.entries(PLATFORMS)) $('salePlatform').add(new Option(v, k));
  for (const [k, c] of Object.entries(CONDITIONS)) $('itemCondition').add(new Option(c.label, k));
  document.querySelectorAll('dialog [data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
  subscribe(render);
}

function render() {
  const list = $('invList');
  if (!state.db) {
    $('invStats').textContent = '';
    list.innerHTML = `<p class="err">${esc(state.error || 'Cargando…')}</p>`;
    return;
  }
  const st = inventoryStats(state.db.items);
  $('invStats').innerHTML = `
    <div class="kpi"><b>${st.articles}</b><span>artículos disponibles</span></div>
    <div class="kpi"><b>${st.units}</b><span>unidades</span></div>
    <div class="kpi"><b>${money(st.costValue)}</b><span>invertido (costo)</span></div>
    <div class="kpi"><b>${money(st.listValue)}</b><span>valor a precio de venta</span></div>`;

  const q = $('invSearch').value.trim().toLowerCase();
  const status = $('invStatus').value;
  const items = state.db.items
    .filter((i) => status === 'todos' || i.status === status)
    .filter((i) => !q || [i.title, i.brand, i.size, i.location, i.sku].join(' ').toLowerCase().includes(q))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  list.innerHTML = items.length ? items.map(card).join('') : '<p class="hint">No hay artículos con este filtro.</p>';
}

function card(i) {
  const chips = Object.entries(i.listings || {}).map(([p, l]) => {
    const label = `${PLATFORMS[p] || p}: ${LISTING_LABEL[l.status] || l.status}`;
    const cls = l.status === 'publicado' || l.status === 'vendido' ? 'ok' : l.status === 'error' ? 'err' : '';
    return l.url && l.status === 'publicado'
      ? `<a class="chip ${cls}" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`
      : `<button type="button" class="chip ${cls}" data-act="toggleListing" data-id="${esc(i.id)}" data-p="${esc(p)}" title="Cambiar estado">${esc(label)}</button>`;
  }).join('');
  const sold = (i.sales || []).length;
  return `
  <article class="item ${esc(i.status)}">
    ${i.images?.[0] ? `<img src="${esc(i.images[0])}" alt="" loading="lazy">` : '<div class="noimg">Sin foto</div>'}
    <div class="body">
      <div class="itemHead">
        <h3>${esc(i.title)}</h3>
        <span class="badge ${esc(i.status)}">${STATUS_LABEL[i.status] || esc(i.status)}</span>
      </div>
      <p class="meta">${[i.brand, i.size && `Talla ${i.size}`, i.location && `📦 ${i.location}`, i.sku].filter(Boolean).map(esc).join(' · ')}</p>
      ${i.needsCost && !i.cost ? '<p class="meta err">⚠ Importado de eBay: pulsa Editar y añade lo que te costó.</p>' : ''}
      <p class="meta">Costo ${money(i.cost)} · Precio ${money(i.price)} · Quedan ${i.quantity}${sold ? ` · Vendidas ${sold}` : ''}</p>
      <div class="chips">${chips}</div>
      <div class="row wrap actions">
        ${i.status === 'disponible' && i.quantity > 0 ? `<button type="button" data-act="sell" data-id="${esc(i.id)}">Vendido</button>` : ''}
        <button type="button" class="ghost" data-act="edit" data-id="${esc(i.id)}">Editar</button>
        <button type="button" class="${i.status === 'borrador' ? '' : 'ghost'}" data-act="publish" data-id="${esc(i.id)}">${i.status === 'borrador' ? 'Revisar y publicar' : 'Publicar'}</button>
        <button type="button" class="ghost danger" data-act="delete" data-id="${esc(i.id)}">Borrar</button>
      </div>
    </div>
  </article>`;
}

function onListClick(e) {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const item = findItem(b.dataset.id);
  if (!item) return;
  switch (b.dataset.act) {
    case 'sell': return openSaleDialog(item);
    case 'edit': return openItemDialog(item);
    case 'publish': return deps.loadIntoForm(item);
    case 'delete':
      if (confirm(`¿Borrar «${item.title}»? También se borran sus ventas de Finanzas.`)) {
        mutate((db) => { db.items = db.items.filter((x) => x.id !== item.id); });
      }
      return;
    case 'toggleListing': {
      const order = ['pendiente', 'publicado', 'retirado'];
      const cur = item.listings[b.dataset.p]?.status;
      const next = order[(order.indexOf(cur) + 1) % order.length];
      return mutate((db) => {
        const it = db.items.find((x) => x.id === item.id);
        if (it) it.listings[b.dataset.p] = { ...it.listings[b.dataset.p], status: next };
      });
    }
  }
}

// ── Editar / añadir ───────────────────────────────────────
const ITEM_FIELDS = ['title', 'brand', 'size', 'color', 'condition', 'cost', 'price', 'quantity', 'location', 'notes', 'status'];
const fieldId = (f) => `item${f[0].toUpperCase()}${f.slice(1)}`;

function openItemDialog(item) {
  $('itemForm').dataset.id = item?.id || '';
  $('itemDialogTitle').textContent = item ? 'Editar artículo' : 'Añadir artículo';
  const defaults = { condition: 'like_new', quantity: 1, status: 'disponible' };
  for (const f of ITEM_FIELDS) $(fieldId(f)).value = item?.[f] ?? defaults[f] ?? '';
  $('itemDialog').showModal();
}

function saveItem(e) {
  e.preventDefault();
  const id = $('itemForm').dataset.id;
  const v = Object.fromEntries(ITEM_FIELDS.map((f) => [f, $(fieldId(f)).value.trim()]));
  const data = { ...v, cost: Number(v.cost) || 0, price: Number(v.price) || 0, quantity: Math.max(0, parseInt(v.quantity, 10) || 0) };
  mutate((db) => {
    const existing = db.items.find((x) => x.id === id);
    if (existing) Object.assign(existing, data, data.cost ? { needsCost: false } : {});
    else db.items.push(newItem(data));
  });
  $('itemDialog').close();
}

export function newItem(data) {
  return {
    id: uid(), createdAt: new Date().toISOString(), status: 'disponible', quantity: 1, cost: 0, price: 0,
    images: [], listings: {}, sales: [], ...data,
  };
}

// ── Registrar venta ───────────────────────────────────────
function openSaleDialog(item) {
  $('saleForm').dataset.id = item.id;
  $('saleItemName').textContent = item.title;
  const published = Object.entries(item.listings || {}).find(([, l]) => l.status === 'publicado');
  $('salePlatform').value = published?.[0] || 'ebay';
  $('salePrice').value = item.price || '';
  $('saleShipping').value = '0';
  $('saleDate').value = today();
  $('saleFees').dataset.touched = '';
  updateFeeEstimate();
  $('saleFees').oninput = () => { $('saleFees').dataset.touched = '1'; };
  $('saleDialog').showModal();
}

function updateFeeEstimate() {
  const fee = estimateFee($('salePlatform').value, $('salePrice').value, feeRules(state.db?.settings));
  if (!$('saleFees').dataset.touched) $('saleFees').value = fee.toFixed(2);
  $('saleFeeHint').textContent = `Estimación: ${money(fee)}. Cámbiala por la comisión real si la sabes.`;
}

async function saveSale(e) {
  e.preventDefault();
  const item = findItem($('saleForm').dataset.id);
  if (!item) return;
  const sale = {
    id: uid(),
    platform: $('salePlatform').value,
    price: Number($('salePrice').value) || 0,
    fees: Number($('saleFees').value) || 0,
    shipping: Number($('saleShipping').value) || 0,
    date: $('saleDate').value || today(),
  };
  const updated = applySale(item, sale);
  updated.listings = structuredClone(item.listings || {});
  $('saleDialog').close();

  // Si ya no quedan unidades, retirar de las demás plataformas.
  const others = updated.quantity === 0
    ? Object.entries(updated.listings || {}).filter(([p, l]) => p !== sale.platform && l.status === 'publicado')
    : [];
  const ebay = others.find(([p]) => p === 'ebay')?.[1];
  // Retirar de eBay automáticamente (se puede desactivar en Avisos → Ofertas y avisos).
  if (ebay?.offerId && (state.db.settings.autoDelist !== false || confirm('Se vendió la última unidad. ¿Retiro el anuncio de eBay?'))) {
    try {
      await deps.api('/api/ebay/withdraw', { method: 'POST', body: { offerId: ebay.offerId } });
      updated.listings.ebay = { ...ebay, status: 'retirado' };
    } catch (err) {
      alert(`No se pudo retirar de eBay: ${err.message}`);
    }
  }
  // Si se vendió la última unidad en eBay, eBay cierra el anuncio solo.
  if (sale.platform === 'ebay' && updated.quantity === 0 && updated.listings.ebay) {
    updated.listings.ebay = { ...updated.listings.ebay, status: 'vendido' };
  }
  const manual = others.filter(([p]) => p !== 'ebay').map(([p]) => PLATFORMS[p]);
  mutate((db) => {
    const it = db.items.find((x) => x.id === item.id);
    if (!it) return;
    // Sobre los datos más recientes: aplica la venta y el estado de los anuncios.
    const fresh = applySale(it, sale);
    fresh.listings = { ...structuredClone(it.listings || {}), ...(updated.listings.ebay ? { ebay: updated.listings.ebay } : {}) };
    Object.assign(it, fresh);
  });
  if (manual.length) alert(`Recuerda borrar el anuncio en: ${manual.join(', ')}. Luego toca su etiqueta para marcarlo como «retirado».`);
}
