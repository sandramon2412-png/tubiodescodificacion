import { timingSafeEqual, createHash } from 'node:crypto';
import { runSync } from '../../lib/sync.js';

// Revisión automática. La llaman Vercel Cron y/o GitHub Actions con
// "Authorization: Bearer <CRON_SECRET>" (Vercel la añade sola si existe la variable CRON_SECRET).
const same = (a, b) => timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const auth = String(req.headers.authorization || '');
  if (!secret || !same(auth, `Bearer ${secret}`)) return res.status(401).json({ error: 'No autorizado.' });
  try {
    res.status(200).json(await runSync());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
