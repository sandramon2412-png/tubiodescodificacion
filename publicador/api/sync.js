import { runSync } from '../lib/sync.js';
import { requireAuth, methodOnly } from '../lib/auth.js';

// Botón "Revisar ahora" y revisión al abrir la app.
export default async function handler(req, res) {
  if (!methodOnly(req, res, 'POST') || !requireAuth(req, res)) return;
  try {
    res.status(200).json(await runSync());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
