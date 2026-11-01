import { put } from '@vercel/blob';
import { requireAuth, methodOnly } from '../lib/auth.js';

// Recibe una foto (ya reducida en el navegador) como data URL y la guarda en Vercel Blob.
// Devuelve una URL https pública que eBay puede descargar.
export default async function handler(req, res) {
  if (!methodOnly(req, res, 'POST') || !requireAuth(req, res)) return;
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'Conecta un Blob Store en Vercel → Storage para subir fotos.' });
  }
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(req.body?.dataUrl || '');
  if (!m) return res.status(400).json({ error: 'Imagen no válida.' });
  const buffer = Buffer.from(m[2], 'base64');
  if (buffer.length > 4 * 1024 * 1024) return res.status(413).json({ error: 'La foto pesa más de 4 MB.' });
  const ext = m[1].split('/')[1].replace('jpeg', 'jpg');
  try {
    const blob = await put(`fotos/foto.${ext}`, buffer, { access: 'public', contentType: m[1], addRandomSuffix: true });
    res.status(200).json({ url: blob.url });
  } catch (e) {
    res.status(500).json({ error: `No se pudo guardar la foto: ${e.message}` });
  }
}
