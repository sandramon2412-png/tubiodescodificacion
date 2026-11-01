import { state, mutate, uid, today } from './store.js';
import { mergeEbaySales } from './finance-calc.js';

const $ = (id) => document.getElementById(id);
let running = false;

export function notice(text, cls = '') {
  const el = $('notice');
  el.textContent = text;
  el.className = `notice ${cls}`;
  el.hidden = !text;
}

const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

/** Trae las ventas de eBay nuevas y las apunta en Inventario y Finanzas. */
export async function syncEbay(api, { silent = false } = {}) {
  if (running || !state.db) return;
  running = true;
  document.querySelectorAll('.ebaySync').forEach((b) => { b.disabled = true; });
  if (!silent) notice('Buscando ventas nuevas en eBay…');
  try {
    // Repasa desde unos días antes de la última vez, por si algún pago se confirmó tarde.
    const last = state.db.settings.ebayLastSync;
    const since = last ? new Date(Date.parse(last) - 3 * 86400000).toISOString().slice(0, 10) : daysAgo(90);
    const { lines } = await api(`/api/ebay/sales?since=${since}`);
    let r = { added: 0, created: 0, remind: [] };
    if (lines.length || last !== today()) {
      mutate((db) => {
        r = mergeEbaySales(db, lines, uid);
        db.settings.ebayLastSync = today();
      });
    }
    const parts = [];
    if (r.added) parts.push(`${r.added} venta(s) nueva(s) de eBay apuntada(s)`);
    if (r.created) parts.push(`${r.created} artículo(s) nuevo(s): añade su costo en Inventario`);
    for (const x of r.remind) parts.push(`«${x.title}» se agotó: bórralo de ${x.platforms.join(', ')}`);
    if (parts.length) notice(parts.join(' · '), 'ok');
    else notice(silent ? '' : 'No hay ventas nuevas en eBay.', 'ok');
  } catch (e) {
    if (!silent || e.status === 403) notice(e.message, 'err');
  } finally {
    running = false;
    document.querySelectorAll('.ebaySync').forEach((b) => { b.disabled = false; });
  }
}
