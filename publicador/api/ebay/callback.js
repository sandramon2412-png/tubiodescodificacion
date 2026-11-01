import { exchangeCode, env } from '../../lib/ebay.js';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const page = (title, body) => `<!doctype html><html lang="es"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>body{font:16px/1.5 system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;color:#1d1b20;background:#faf7f5}
textarea{width:100%;height:140px;font:13px monospace;padding:8px;box-sizing:border-box}code{background:#eee;padding:2px 4px;border-radius:4px}
a{color:#7a3e9d}</style><h1>${esc(title)}</h1>${body}<p><a href="/">← Volver a la app</a></p></html>`;

// Paso 2 del OAuth: eBay vuelve aquí con ?code=... y lo cambiamos por un refresh token.
export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const { code, state, error } = req.query;
  const cookieState = /(?:^|;\s*)ebay_state=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1];

  if (error) return res.status(400).send(page('eBay canceló la conexión', `<p>${esc(error)}</p>`));
  if (!code || !state || state !== cookieState) {
    return res.status(400).send(page('Enlace no válido', '<p>Vuelve a pulsar «Conectar eBay» desde la app.</p>'));
  }
  res.setHeader('Set-Cookie', 'ebay_state=; Path=/api/ebay; Max-Age=0');
  try {
    const t = await exchangeCode(code);
    const days = Math.round((t.refresh_token_expires_in || 0) / 86400);
    res.status(200).send(page('¡eBay conectado!', `
      <p>Copia este <b>refresh token</b> y pégalo en Vercel → tu proyecto → Settings → Environment Variables
      con el nombre <code>EBAY_REFRESH_TOKEN</code>. Después pulsa <b>Redeploy</b>.</p>
      <textarea readonly onclick="this.select()">${esc(t.refresh_token)}</textarea>
      <p>Entorno: <b>${esc(env().name)}</b>. Caduca en unos ${days} días; entonces repite este paso.</p>
      <p><b>No compartas este token</b>: permite publicar en tu cuenta de eBay.</p>`));
  } catch (e) {
    res.status(500).send(page('No se pudo conectar', `<p>${esc(e.message)}</p>`));
  }
}
