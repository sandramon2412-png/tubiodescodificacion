import { accountSetup, createLocation } from '../../lib/ebay.js';
import { requireAuth } from '../../lib/auth.js';

// GET  → muestra tus políticas de negocio y ubicaciones (IDs para las variables de entorno).
// POST {postalCode, country} → crea la ubicación "principal".
// Requiere EBAY_REFRESH_TOKEN ya configurado.
export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (!process.env.EBAY_REFRESH_TOKEN) return res.status(400).json({ error: 'Primero conecta eBay (EBAY_REFRESH_TOKEN).' });
  try {
    if (req.method === 'POST') {
      const postalCode = String(req.body?.postalCode || '').trim();
      const country = String(req.body?.country || 'US').trim().toUpperCase();
      if (!postalCode) return res.status(400).json({ error: 'Falta el código postal.' });
      return res.status(200).json(await createLocation({ key: 'principal', name: 'Principal', postalCode, country }));
    }
    res.status(200).json(await accountSetup());
  } catch (e) {
    res.status(e.status && e.status < 500 ? 400 : 502).json({ error: e.message });
  }
}
