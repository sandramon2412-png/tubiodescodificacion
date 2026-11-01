import { missingEbayConfig, env } from '../lib/ebay.js';
import { requireAuth } from '../lib/auth.js';
import { aiConfigured } from '../lib/ai.js';
import { photoConfigured, STYLES, MODELS } from '../lib/photo.js';

// Le dice al navegador qué está configurado (sin revelar secretos).
export default function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const missing = missingEbayConfig();
  res.status(200).json({
    ebay: {
      env: env().name,
      ready: missing.length === 0,
      canConnect: missingEbayConfig({ forPublish: false }).length === 0,
      missing,
    },
    uploads: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    storage: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    ai: aiConfigured(),
    photos: photoConfigured(),
    models: MODELS,
    styles: Object.fromEntries(Object.entries(STYLES).map(([k, v]) => [k, v.label])),
  });
}
