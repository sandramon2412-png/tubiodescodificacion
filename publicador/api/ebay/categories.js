import { suggestCategories, missingEbayConfig } from '../../lib/ebay.js';
import { requireAuth } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.status(400).json({ error: 'Escribe al menos 2 letras.' });
  if (missingEbayConfig({ forPublish: false }).length) {
    return res.status(500).json({ error: 'Configura EBAY_CLIENT_ID y EBAY_CLIENT_SECRET para buscar categorías.' });
  }
  try {
    res.status(200).json({ categories: await suggestCategories(q) });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
