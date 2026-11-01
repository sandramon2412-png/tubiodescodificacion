import { respondToOffer } from '../../lib/ebay-trading.js';
import { readDb, updateDb } from '../../lib/db.js';
import { missingEbayConfig } from '../../lib/ebay.js';
import { requireAuth, methodOnly } from '../../lib/auth.js';

const STATUS = { Accept: 'aceptada', Decline: 'rechazada', Counter: 'contraoferta' };

/** Responde a una oferta de eBay y lo apunta. Lo usan la app y el webhook de Telegram. */
export async function answerOffer({ listingId, offerId, action, price }) {
  const { data } = await readDb();
  const currency = data.offers.find((o) => o.offerId === String(offerId))?.currency || 'USD';
  await respondToOffer({ listingId, offerId, action, counterPrice: Number(price), currency });
  await updateDb((db) => {
    const o = db.offers.find((x) => x.offerId === String(offerId));
    if (o) Object.assign(o, { status: STATUS[action], decidedBy: 'tú', counterPrice: action === 'Counter' ? Number(price) : undefined, decidedAt: new Date().toISOString() });
  });
  return { status: STATUS[action] };
}

// POST { listingId, offerId, action: Accept|Decline|Counter, price? }
export default async function handler(req, res) {
  if (!methodOnly(req, res, 'POST') || !requireAuth(req, res)) return;
  if (missingEbayConfig().length) return res.status(500).json({ error: 'eBay no está configurado.' });
  const { listingId, offerId, action, price } = req.body || {};
  if (!/^\d+$/.test(String(listingId)) || !/^\d+$/.test(String(offerId)) || !STATUS[action]) {
    return res.status(400).json({ error: 'Datos de la oferta no válidos.' });
  }
  try {
    res.status(200).json(await answerOffer({ listingId, offerId, action, price }));
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
