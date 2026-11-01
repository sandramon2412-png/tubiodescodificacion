// Revisión periódica (cron, botón "Revisar ahora" o al abrir la app):
//  1) importa las ventas nuevas de eBay y avisa; si se agotó algo publicado en Poshmark/Depop, avisa urgente;
//  2) mira las ofertas pendientes de eBay y las acepta/rechaza/contraoferta según tus reglas, o te pregunta.
import { randomUUID } from 'node:crypto';
import { readDb, updateDb } from './db.js';
import { fetchSales, missingEbayConfig } from './ebay.js';
import { getPendingOffers, respondToOffer } from './ebay-trading.js';
import { addNotification, deliver, escHtml } from './notify.js';
import { mergeEbaySales, decideOffer, offerRules, PLATFORMS } from '../public/finance-calc.js';

const money = (n, cur = 'USD') => `${cur === 'USD' ? '$' : ''}${Number(n).toFixed(2)}${cur === 'USD' ? '' : ` ${cur}`}`;
const ACTION = { accept: 'Accept', decline: 'Decline', counter: 'Counter' };
const SUGGEST = {
  accept: () => 'Te sugiero aceptar.',
  decline: () => 'Te sugiero rechazar.',
  counter: (p, cur) => `Te sugiero contraofertar ${money(p, cur)}.`,
  ask: (p, cur) => (p ? `Podrías contraofertar ${money(p, cur)}.` : ''),
};
const DONE_LABEL = { accept: '✅ Aceptada', decline: '❌ Rechazada', counter: '↩️ Contraoferta enviada' };

export function offerButtons(o, suggest) {
  const row = [{ text: `✅ Aceptar ${money(o.price, o.currency)}`, data: `oa:${o.listingId}:${o.offerId}` }, { text: '❌ Rechazar', data: `od:${o.listingId}:${o.offerId}` }];
  return suggest ? [row, [{ text: `↩️ Contraoferta ${money(suggest, o.currency)}`, data: `oc:${o.listingId}:${o.offerId}:${suggest}` }]] : [row];
}

export function delistButtons(itemId, platforms) {
  return [platforms.map((p) => ({ text: `✅ Ya lo borré de ${PLATFORMS[p] || p}`, data: `dl:${itemId}:${p}` }))];
}

export async function runSync() {
  const summary = { sales: 0, offersAuto: 0, offersAsk: 0, sent: 0, errors: [] };
  if (missingEbayConfig().length) return { ...summary, skipped: 'eBay no está configurado' };

  const { data } = await readDb();
  const last = data.settings.ebayLastSync;
  const since = new Date(last ? Date.parse(last) - 3 * 86400000 : Date.now() - 90 * 86400000);
  const lines = await fetchSales(since.toISOString()).catch((e) => { summary.errors.push(e.message); return []; });

  // Ofertas: solo de artículos disponibles publicados en eBay.
  const known = new Set(data.offers.map((o) => o.offerId));
  const live = data.items.filter((i) => i.status === 'disponible' && i.listings?.ebay?.status === 'publicado' && i.listings.ebay.listingId);
  const fresh = [];
  for (const item of live.slice(0, 60)) {
    try {
      for (const o of await getPendingOffers(item.listings.ebay.listingId)) if (!known.has(o.offerId)) fresh.push({ o, item });
    } catch (e) { summary.errors.push(e.message); break; } // p. ej. sin permiso: no insistir con cada artículo
  }

  // Respuestas automáticas (fuera de la base de datos: son llamadas a eBay).
  const rules = offerRules(data.settings);
  const handled = [];
  for (const { o, item } of fresh) {
    const d = decideOffer(o, item, data.settings);
    let status = 'pendiente';
    let error;
    if (rules.auto && d.action !== 'ask') {
      try {
        await respondToOffer({ listingId: o.listingId, offerId: o.offerId, action: ACTION[d.action], counterPrice: d.price, currency: o.currency || 'USD' });
        status = d.action === 'accept' ? 'aceptada' : d.action === 'decline' ? 'rechazada' : 'contraoferta';
        summary.offersAuto += 1;
      } catch (e) { error = e.message; }
    }
    if (status === 'pendiente') summary.offersAsk += 1;
    handled.push({ o, item, d, status, error });
  }

  const outbox = [];
  await updateDb((db) => {
    outbox.length = 0;
    const r = mergeEbaySales(db, lines, randomUUID);
    summary.sales = r.added;
    for (const s of r.sold) {
      outbox.push(addNotification(db, { kind: 'sale', itemId: s.itemId, text: `💰 <b>¡Vendido en eBay!</b> «${escHtml(s.title)}» por ${money(s.price)}.` }));
    }
    for (const x of r.remind) {
      const ps = x.platformKeys;
      outbox.push(addNotification(db, {
        kind: 'delist', urgent: true, itemId: x.itemId, buttons: delistButtons(x.itemId, ps),
        text: `⚠️ <b>Bórralo ya de ${ps.map((p) => PLATFORMS[p]).join(' y ')}</b>: «${escHtml(x.title)}» se vendió en eBay y no quedan unidades.`,
      }));
    }
    for (const h of handled) {
      if (db.offers.some((x) => x.offerId === h.o.offerId)) continue;
      db.offers.push({ ...h.o, itemId: h.item.id, title: h.item.title, listPrice: h.item.price, status: h.status,
        decidedBy: h.status === 'pendiente' ? null : 'auto', suggest: h.d.price || h.d.suggest, reason: h.d.reason, at: new Date().toISOString() });
      const head = `🤝 Oferta de ${money(h.o.price, h.o.currency)} por «${escHtml(h.item.title)}» (precio ${money(h.item.price, h.o.currency)})${h.o.buyer ? ` de ${escHtml(h.o.buyer)}` : ''}.`;
      const msg = h.o.message ? `\n💬 «${escHtml(h.o.message)}»` : '';
      if (h.status === 'pendiente') {
        outbox.push(addNotification(db, { kind: 'offer', itemId: h.item.id, buttons: offerButtons(h.o, h.d.price || h.d.suggest),
          text: `${head}${msg}\n💡 ${SUGGEST[h.d.action](h.d.price || h.d.suggest, h.o.currency)} ${escHtml(h.d.reason)}${h.error ? `\n⚠️ No pude responder sola: ${escHtml(h.error)}` : ''}` }));
      } else {
        outbox.push(addNotification(db, { kind: 'offer', itemId: h.item.id,
          text: `${head}${msg}\n${DONE_LABEL[h.d.action]} automáticamente${h.d.price ? ` en ${money(h.d.price, h.o.currency)}` : ''}. ${escHtml(h.d.reason)}` }));
      }
    }
    db.settings.ebayLastSync = new Date().toISOString().slice(0, 10);
  });
  summary.sent = await deliver(outbox, data.settings.telegramChatId);
  summary.notifications = outbox.length;
  return summary;
}
