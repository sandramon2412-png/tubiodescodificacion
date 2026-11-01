import { validateListing, publishListing, missingEbayConfig } from '../../lib/ebay.js';
import { requireAuth, methodOnly } from '../../lib/auth.js';
import { readDb } from '../../lib/db.js';
import { bestOfferTerms } from '../../public/finance-calc.js';

export default async function handler(req, res) {
  if (!methodOnly(req, res, 'POST') || !requireAuth(req, res)) return;
  const missing = missingEbayConfig();
  if (missing.length) return res.status(500).json({ error: `eBay no está configurado. Faltan: ${missing.join(', ')}` });
  const { errors, listing } = validateListing(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });
  try {
    // "Mejor oferta" con aceptación/rechazo automáticos según tus reglas (Avisos → Ofertas).
    const settings = process.env.BLOB_READ_WRITE_TOKEN ? (await readDb().catch(() => ({ data: { settings: {} } }))).data.settings : {};
    const bestOffer = bestOfferTerms(listing.price, Number(req.body?.cost) || 0, settings);
    let result;
    try {
      result = await publishListing(listing, { bestOffer });
    } catch (e) {
      // Algunas categorías no admiten ofertas: se publica sin ellas.
      if (!bestOffer || !/best ?offer/i.test(e.message)) throw e;
      result = { ...(await publishListing(listing)), note: 'Esta categoría no admite ofertas.' };
    }
    res.status(200).json(result);
  } catch (e) {
    res.status(e.status && e.status < 500 ? 400 : 502).json({ error: e.message });
  }
}
