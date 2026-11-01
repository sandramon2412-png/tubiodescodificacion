import { readDb, writeDb, ConflictError } from '../lib/db.js';
import { requireAuth } from '../lib/auth.js';

// GET → { version, data }   PUT { baseVersion, data } → { version }
export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  res.setHeader('Cache-Control', 'no-store');
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'Conecta un Blob Store en Vercel → Storage para guardar el inventario.' });
  }
  try {
    if (req.method === 'GET') return res.status(200).json(await readDb());
    if (req.method === 'PUT') {
      const { data, baseVersion } = req.body || {};
      if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Datos no válidos.' });
      return res.status(200).json(await writeDb(data, baseVersion));
    }
    res.setHeader('Allow', 'GET, PUT');
    res.status(405).json({ error: 'Usa GET o PUT.' });
  } catch (e) {
    res.status(e instanceof ConflictError ? 409 : 500).json({ error: e.message });
  }
}
