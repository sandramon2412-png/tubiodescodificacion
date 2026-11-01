import { fetchSales, missingEbayConfig } from '../../lib/ebay.js';
import { requireAuth } from '../../lib/auth.js';

// GET ?since=YYYY-MM-DD → { lines } con las ventas de eBay desde esa fecha (máx. 2 años).
export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (missingEbayConfig().length) return res.status(500).json({ error: 'eBay no está configurado.' });
  const min = new Date(Date.now() - 730 * 86400000);
  let since = new Date(`${req.query.since || ''}T00:00:00Z`);
  if (Number.isNaN(since.getTime()) || since < min) since = new Date(Date.now() - 90 * 86400000);
  try {
    res.status(200).json({ lines: await fetchSales(since.toISOString()) });
  } catch (e) {
    res.status(e.status && e.status < 500 ? e.status : 502).json({ error: e.message, needsReconnect: Boolean(e.needsReconnect) });
  }
}
