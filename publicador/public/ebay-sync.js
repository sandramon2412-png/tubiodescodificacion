import { state, load } from './store.js';

const $ = (id) => document.getElementById(id);
let running = false;

export function notice(text, cls = '') {
  const el = $('notice');
  el.textContent = text;
  el.className = `notice ${cls}`;
  el.hidden = !text;
}

/**
 * Pide al servidor que revise eBay (ventas nuevas y ofertas) y recarga los datos.
 * La misma revisión corre sola cada 15 min (GitHub Actions) y una vez al día (Vercel Cron).
 */
export async function syncEbay(api, { silent = false } = {}) {
  if (running || !state.db) return;
  running = true;
  document.querySelectorAll('.ebaySync').forEach((b) => { b.disabled = true; });
  if (!silent) notice('Revisando ventas y ofertas en eBay…');
  try {
    const r = await api('/api/sync', { method: 'POST' });
    await load();
    const parts = [];
    if (r.sales) parts.push(`${r.sales} venta(s) nueva(s) de eBay`);
    if (r.offersAuto) parts.push(`${r.offersAuto} oferta(s) respondida(s) sola(s)`);
    if (r.offersAsk) parts.push(`${r.offersAsk} oferta(s) esperan tu decisión`);
    if (r.errors?.length) parts.push(`⚠ ${r.errors[0]}`);
    if (parts.length) notice(`${parts.join(' · ')} — mira la pestaña Avisos.`, r.errors?.length ? 'err' : 'ok');
    else notice(silent ? '' : 'Todo al día: no hay ventas ni ofertas nuevas.', 'ok');
  } catch (e) {
    if (!silent || e.status === 403) notice(e.message, 'err');
  } finally {
    running = false;
    document.querySelectorAll('.ebaySync').forEach((b) => { b.disabled = false; });
  }
}
