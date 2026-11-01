import { withdrawOffer, missingEbayConfig } from '../../lib/ebay.js';
import { requireAuth, methodOnly } from '../../lib/auth.js';

// Retira (finaliza) un anuncio de eBay, p. ej. cuando el artículo se vendió en otra plataforma.
export default async function handler(req, res) {
  if (!methodOnly(req, res, 'POST') || !requireAuth(req, res)) return;
  if (missingEbayConfig().length) return res.status(500).json({ error: 'eBay no está configurado.' });
  const offerId = String(req.body?.offerId || '');
  if (!/^\d+$/.test(offerId)) return res.status(400).json({ error: 'offerId no válido.' });
  try {
    res.status(200).json(await withdrawOffer(offerId));
  } catch (e) {
    res.status(e.status && e.status < 500 ? 400 : 502).json({ error: e.message });
  }
}
