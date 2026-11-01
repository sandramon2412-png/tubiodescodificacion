import { randomBytes } from 'node:crypto';
import { consentUrl, missingEbayConfig } from '../../lib/ebay.js';
import { requireAuth } from '../../lib/auth.js';

// Paso 1 del OAuth: manda a la vendedora a la pantalla de permiso de eBay.
export default function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const missing = missingEbayConfig({ forPublish: false });
  if (missing.length) return res.status(500).json({ error: `Faltan variables: ${missing.join(', ')}` });
  const state = randomBytes(16).toString('hex');
  res.setHeader('Set-Cookie', `ebay_state=${state}; Path=/api/ebay; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  // Se devuelve la URL (en vez de redirigir) para que la contraseña viaje en una cabecera, no en la URL.
  res.status(200).json({ url: consentUrl(state) });
}
