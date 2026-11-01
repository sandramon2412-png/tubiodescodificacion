// Pestaña "Avisos": notificaciones, ofertas de eBay, reglas automáticas y conexión con Telegram.
import { state, subscribe, mutate, esc, money, load } from './store.js';
import { offerRules, DEFAULT_OFFER_RULES, PLATFORMS } from './finance-calc.js';

const $ = (id) => document.getElementById(id);
let deps;
const OFFER_LABEL = { pendiente: '⏳ Pendiente', aceptada: '✅ Aceptada', rechazada: '❌ Rechazada', contraoferta: '↩️ Contraoferta' };

export function initAvisos(d) {
  deps = d;
  subscribe(render);
  $('rulesForm').addEventListener('submit', saveRules);
  $('rulesForm').addEventListener('change', syncRulesUi);
  $('avisosList').addEventListener('click', onNotificationClick);
  $('offersPending').addEventListener('click', onOfferClick);
  $('markRead').addEventListener('click', () => mutate((db) => { (db.notifications || []).forEach((n) => { n.read = true; }); }));
  $('tgLink').addEventListener('click', linkTelegram);
  $('tgTest').addEventListener('click', async () => {
    try { await deps.api('/api/notify', { method: 'POST', body: { action: 'test' } }); alert('Enviado. Mira tu Telegram.'); } catch (e) { alert(e.message); }
  });
  refreshTelegram();
}

async function refreshTelegram() {
  let s = { configured: false };
  try { s = await deps.api('/api/notify'); } catch { /* sin Blob o sin red */ }
  $('tgMissing').hidden = s.configured;
  $('tgLink').hidden = !s.configured;
  $('tgLink').textContent = s.linked ? 'Volver a conectar' : '📲 Conectar Telegram';
  $('tgTest').hidden = !s.linked;
  $('tgState').textContent = !s.configured ? '' : s.linked ? '✅ Telegram conectado: los avisos llegan a tu móvil.' : 'Falta vincular tu chat de Telegram.';
}

async function linkTelegram() {
  try {
    const { link } = await deps.api('/api/notify', { method: 'POST', body: { action: 'link' } });
    window.open(link, '_blank', 'noopener');
    $('tgState').textContent = 'En Telegram pulsa «Iniciar». Luego vuelve aquí.';
    setTimeout(refreshTelegram, 15000);
  } catch (e) { alert(e.message); }
}

export const unread = () => (state.db?.notifications || []).filter((n) => !n.read).length;

function render() {
  const db = state.db;
  const badge = document.querySelector('[data-tab="avisos"] .count');
  if (badge) { const n = unread(); badge.textContent = n ? String(n) : ''; badge.hidden = !n; }
  if (!db) return;
  db.offers ||= []; // datos guardados antes de existir ofertas y avisos
  db.notifications ||= [];

  const pending = db.offers.filter((o) => o.status === 'pendiente').reverse();
  $('offersPending').innerHTML = pending.length ? pending.map((o) => `
    <div class="offer">
      <p><b>${money(o.price)}</b> por «${esc(o.title)}» <span class="hint">(precio ${money(o.listPrice)}${o.buyer ? ` · ${esc(o.buyer)}` : ''})</span></p>
      ${o.message ? `<p class="hint">💬 «${esc(o.message)}»</p>` : ''}
      ${o.reason ? `<p class="hint">${esc(o.reason)}</p>` : ''}
      <div class="row wrap">
        <button type="button" data-offer="Accept" data-l="${esc(o.listingId)}" data-o="${esc(o.offerId)}">Aceptar</button>
        <button type="button" class="ghost danger" data-offer="Decline" data-l="${esc(o.listingId)}" data-o="${esc(o.offerId)}">Rechazar</button>
        <input type="number" step="0.01" min="0" value="${esc(o.suggest || '')}" placeholder="Precio" class="counterInput" id="c-${esc(o.offerId)}">
        <button type="button" class="ghost" data-offer="Counter" data-l="${esc(o.listingId)}" data-o="${esc(o.offerId)}">Contraofertar</button>
      </div>
    </div>`).join('') : '<p class="hint">No hay ofertas esperando tu decisión.</p>';

  const done = db.offers.filter((o) => o.status !== 'pendiente').slice(-15).reverse();
  $('offersDone').innerHTML = done.length ? done.map((o) => `<li>${OFFER_LABEL[o.status] || esc(o.status)} ${money(o.counterPrice || o.price)} · «${esc(o.title)}» <span class="hint">${o.decidedBy === 'auto' ? 'automática' : 'por ti'}</span></li>`).join('') : '<li class="hint">Todavía no hay ofertas.</li>';

  const notes = [...db.notifications].reverse().slice(0, 60);
  $('avisosList').innerHTML = notes.length ? notes.map((n) => {
    const delist = (n.buttons || []).flat().filter((b) => b.data.startsWith('dl:'))
      .filter((b) => { const [, id, p] = b.data.split(':'); return db.items.find((i) => i.id === id)?.listings?.[p]?.status === 'publicado'; });
    return `<div class="aviso ${n.read ? '' : 'unread'} ${n.urgent ? 'urgent' : ''}">
      <p>${n.text.replace(/\n/g, '<br>')}</p>
      <div class="row wrap"><span class="hint">${new Date(n.at).toLocaleString()}</span>
      ${delist.map((b) => `<button type="button" class="small" data-dl="${esc(b.data)}">${esc(b.text)}</button>`).join('')}</div>
    </div>`;
  }).join('') : '<p class="hint">Sin avisos todavía.</p>';

  fillRules(offerRules(db.settings), db.settings.autoDelist !== false);
}

// El texto de los avisos lo genera el servidor, ya escapado (lib/sync.js usa escHtml).

async function onOfferClick(e) {
  const b = e.target.closest('[data-offer]');
  if (!b) return;
  const action = b.dataset.offer;
  const price = action === 'Counter' ? Number($(`c-${b.dataset.o}`).value) : undefined;
  if (action === 'Counter' && !(price > 0)) return alert('Escribe el precio de la contraoferta.');
  b.disabled = true;
  try {
    await deps.api('/api/ebay/offers', { method: 'POST', body: { listingId: b.dataset.l, offerId: b.dataset.o, action, price } });
    await load();
  } catch (err) {
    alert(err.message);
    b.disabled = false;
  }
}

function onNotificationClick(e) {
  const data = e.target.dataset.dl;
  if (!data) return;
  const [, id, p] = data.split(':');
  mutate((db) => {
    const it = db.items.find((i) => i.id === id);
    if (it?.listings?.[p]) it.listings[p] = { ...it.listings[p], status: 'retirado' };
  });
}

// ── Reglas ────────────────────────────────────────────────
let filled = false;
function fillRules(r, autoDelist) {
  if (filled && document.activeElement?.closest?.('#rulesForm')) return; // no pisar lo que estás escribiendo
  filled = true;
  const f = $('rulesForm');
  f.enabled.checked = r.enabled;
  f.auto.checked = r.auto;
  f.acceptPct.value = r.acceptPct;
  f.declinePct.value = r.declinePct;
  f.between.value = r.between;
  f.counterPct.value = r.counterPct;
  f.protectCost.checked = r.protectCost;
  f.autoDelist.checked = autoDelist;
  syncRulesUi();
}

function syncRulesUi() {
  const f = $('rulesForm');
  $('counterWrap').hidden = f.between.value !== 'counter';
}

function saveRules(e) {
  e.preventDefault();
  const f = $('rulesForm');
  const num = (v, d) => (Number.isFinite(Number(v)) && v !== '' ? Math.min(100, Math.max(0, Number(v))) : d);
  const offers = {
    enabled: f.enabled.checked,
    auto: f.auto.checked,
    acceptPct: num(f.acceptPct.value, DEFAULT_OFFER_RULES.acceptPct),
    declinePct: num(f.declinePct.value, DEFAULT_OFFER_RULES.declinePct),
    between: f.between.value === 'ask' ? 'ask' : 'counter',
    counterPct: num(f.counterPct.value, DEFAULT_OFFER_RULES.counterPct),
    protectCost: f.protectCost.checked,
  };
  if (offers.declinePct >= offers.acceptPct) return alert('El % para rechazar tiene que ser menor que el % para aceptar.');
  const autoDelist = f.autoDelist.checked;
  mutate((db) => { db.settings = { ...db.settings, offers, autoDelist }; });
  alert('Reglas guardadas. Se aplican a las ofertas nuevas y a los anuncios que publiques a partir de ahora.');
}

export { PLATFORMS };
