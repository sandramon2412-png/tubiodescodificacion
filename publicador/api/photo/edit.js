import { editPhoto, photoConfigured, KINDS } from '../../lib/photo.js';
import { requireAuth, methodOnly } from '../../lib/auth.js';

// POST { url, kind, style, look?, modelName?, prompt?, backgroundUrl?, iron?, seed? } → { url } de la foto editada.
// kind: background (foto real con fondo nuevo) | hanger (colgada) | flatlay (en el piso) | model (en modelo).
export default async function handler(req, res) {
  if (!methodOnly(req, res, 'POST') || !requireAuth(req, res)) return;
  if (!photoConfigured()) return res.status(500).json({ error: 'Falta PHOTOROOM_API_KEY en Vercel para editar fotos.' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return res.status(500).json({ error: 'Conecta un Blob Store en Vercel.' });
  const b = req.body || {};
  if (!/^https:\/\//.test(b.url || '')) return res.status(400).json({ error: 'Foto no válida.' });
  try {
    res.status(200).json(await editPhoto({
      imageUrl: b.url, kind: KINDS[b.kind] ? b.kind : 'background', style: b.style, prompt: b.prompt,
      backgroundUrl: b.backgroundUrl, iron: Boolean(b.iron), seed: Number.parseInt(b.seed, 10) || undefined,
      look: b.look, modelName: b.modelName,
    }));
  } catch (e) {
    res.status(e.status && e.status < 500 ? 400 : 502).json({ error: e.message });
  }
}
