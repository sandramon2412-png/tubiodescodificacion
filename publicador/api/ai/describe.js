import Anthropic from '@anthropic-ai/sdk';
import { describeItem, aiConfigured } from '../../lib/ai.js';
import { marketComps, suggestCategories, missingEbayConfig } from '../../lib/ebay.js';
import { requireAuth, methodOnly } from '../../lib/auth.js';

// POST { images: [url], notes, language } → { listing, comps, categories }
export default async function handler(req, res) {
  if (!methodOnly(req, res, 'POST') || !requireAuth(req, res)) return;
  if (!aiConfigured()) return res.status(500).json({ error: 'Falta ANTHROPIC_API_KEY en Vercel para usar la IA.' });
  const { images = [], notes = '', language = 'en' } = req.body || {};
  const urls = images.filter((u) => /^https:\/\//.test(u));
  if (!urls.length) return res.status(400).json({ error: 'Sube al menos una foto.' });

  const ebayOk = missingEbayConfig({ forPublish: false }).length === 0;
  try {
    // La IA escribe el anuncio; con su búsqueda pedimos a eBay precios y categorías parecidas.
    let listing = await describeItem({ imageUrls: urls, notes, language, currency: process.env.EBAY_CURRENCY || 'USD' });
    let comps = null;
    let categories = [];
    if (ebayOk) {
      const q = [listing.brand, listing.ebayCategoryQuery].filter(Boolean).join(' ');
      [comps, categories] = await Promise.all([
        marketComps(q).catch(() => null),
        suggestCategories(listing.ebayCategoryQuery).catch(() => []),
      ]);
      if (comps?.count >= 5) {
        // Ajusta solo el precio con los datos reales del mercado, sin reescribir el anuncio.
        listing.suggestedPrice = Math.round(Math.min(Math.max(listing.suggestedPrice, comps.low), comps.median) * 100) / 100;
        listing.priceReason = `${listing.priceReason} Referencia eBay: ${comps.count} anuncios parecidos, mediana ${comps.median}.`;
      }
    }
    res.status(200).json({ listing, comps, categories });
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return res.status(500).json({ error: 'ANTHROPIC_API_KEY no es válida.' });
    if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'La IA está saturada, espera un minuto.' });
    if (e instanceof Anthropic.APIError) return res.status(502).json({ error: `Error de la IA: ${e.message}` });
    res.status(500).json({ error: e.message });
  }
}
