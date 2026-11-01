import { timingSafeEqual, createHash } from 'node:crypto';

const digest = (s) => createHash('sha256').update(String(s)).digest();

/** Compara la contraseña recibida con APP_PASSWORD sin filtrar tiempos. */
export function passwordOk(candidate) {
  const expected = process.env.APP_PASSWORD;
  if (!expected || !candidate) return false;
  return timingSafeEqual(digest(candidate), digest(expected));
}

/**
 * Corta la petición con 401 si no trae la contraseña correcta.
 * Devuelve true si la petición puede continuar.
 */
export function requireAuth(req, res) {
  if (!process.env.APP_PASSWORD) {
    res.status(500).json({ error: 'Falta configurar APP_PASSWORD en Vercel.' });
    return false;
  }
  const candidate = req.headers['x-app-password'];
  if (!passwordOk(candidate)) {
    res.status(401).json({ error: 'Contraseña incorrecta.' });
    return false;
  }
  return true;
}

export function methodOnly(req, res, method) {
  if (req.method !== method) {
    res.setHeader('Allow', method);
    res.status(405).json({ error: `Usa ${method}.` });
    return false;
  }
  return true;
}
