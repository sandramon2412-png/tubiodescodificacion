import { validateListing, publishListing, missingEbayConfig } from '../../lib/ebay.js';
import { requireAuth, methodOnly } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (!methodOnly(req, res, 'POST') || !requireAuth(req, res)) return;
  const missing = missingEbayConfig();
  if (missing.length) return res.status(500).json({ error: `eBay no está configurado. Faltan: ${missing.join(', ')}` });
  const { errors, listing } = validateListing(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(' ') });
  try {
    res.status(200).json(await publishListing(listing));
  } catch (e) {
    res.status(e.status && e.status < 500 ? 400 : 502).json({ error: e.message });
  }
}
