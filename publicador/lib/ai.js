// Redacta anuncios a partir de las fotos con Claude (visión + salida estructurada).
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import * as z from 'zod/v4';
import { MODEL_SCENES } from './photo.js';

export const aiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';

// Los valores cerrados se piden como texto y se validan en cleanListing(): así una
// respuesta fuera de la lista no tumba todo el anuncio.
const CONDITIONS = ['new_tags', 'new_no_tags', 'like_new', 'good', 'fair'];

export const ListingSchema = z.object({
  title: z.string().describe('SEO title, max 80 characters'),
  description: z.string().describe('Full listing description'),
  brand: z.string().describe('Brand exactly as on the label, or empty if not visible'),
  size: z.string().describe('Size as on the label, or empty'),
  color: z.string(),
  material: z.string().describe('Material from the care label, or empty'),
  condition: z.string().describe(`Exactly one of: ${CONDITIONS.join(', ')}`),
  flaws: z.string().describe('Visible flaws, or empty if none seen'),
  keywords: z.array(z.string()).describe('Up to 10 search keywords / hashtags, most important first'),
  ebayCategoryQuery: z.string().describe('2-5 English words to search the eBay category, e.g. "women midi dress"'),
  itemSpecifics: z.array(z.object({ name: z.string(), value: z.string() }))
    .describe('eBay item specifics in English, e.g. Department, Type, Style, Sleeve Length, Pattern, Material, Occasion, Era'),
  suggestedPrice: z.number().describe('Suggested fixed price in the listing currency'),
  priceReason: z.string().describe('One short sentence explaining the price, in the seller language'),
  checkBeforePublishing: z.array(z.string()).describe('Things the seller should verify or add (measurements, unreadable label...), in the seller language'),
  aesthetic: z.string().describe('The garment style in 1-4 English words, e.g. "bohemian vintage", "sporty activewear", "90s streetwear"'),
  look: z.object({
    backdrop: z.string().describe('Background scene for the real product photos, in English'),
    hanger: z.string().describe('Where the garment hangs on its hanger, completing "hanging on a wooden hanger against ...", in English'),
    flatlay: z.string().describe('Surface plus 3-4 styling accessories for a top-down flat lay, completing "laid flat on ...", in English'),
    modelScene: z.string().describe(`Exactly one of: ${MODEL_SCENES.join(', ')}`),
    modelVibe: z.string().describe('Short styling direction for the virtual model shoot, in English'),
  }),
  detailPhotoIndexes: z.array(z.number().int()).describe('0-based indexes of photos that are close-ups of labels, tags, fabric or flaws'),
});

const LANG = { en: 'English', es: 'Spanish' };

export function buildSystemPrompt(language = 'en') {
  const lang = LANG[language] || 'English';
  return `You write resale listings for a small vintage and secondhand clothing seller who cross-lists on eBay, Poshmark and Depop.

Write the title, description, keywords and color in ${lang}. Write itemSpecifics and ebayCategoryQuery in English (eBay requires it). Write priceReason and checkBeforePublishing in Spanish, because the seller reads them.

Accuracy comes first. Buyers return items that differ from the listing, so only state what the photos or the seller's notes show. Read brand, size and material from labels when a label photo is included. If something is not visible, leave the field empty and add it to checkBeforePublishing instead of guessing. Describe visible flaws honestly in the description; never call an item "new" or "mint" unless the photos show tags or no wear.

Title (eBay search ranks the title heavily): Brand + item type + the 2-4 attributes shoppers filter by (style, era, material, pattern, color) + size + department (Women's/Men's). Put the most-searched words first, use up to 80 characters, no ALL CAPS, no symbols or filler like "L@@K", "wow" or "rare" unless it truly is.

Description: a warm one-sentence hook in a boutique voice, then short lines for details (brand, size, material, color, measurements if given), condition with any flaws, and styling ideas. No HTML. Under 1,200 characters so it also fits Poshmark and Depop.

Keywords: what a shopper would type, including style and era terms (e.g. "y2k", "70s", "cottagecore", "boho") only when they fit the item.

Photo look: choose the scene from the garment's own style so the photos sell it. Bohemian, hippie or vintage pieces go with warm vintage settings (an old weathered wooden door, aged wooden floors, dried flowers, straw hats, turquoise or gold jewelry). Sportswear goes with gym, track or clean concrete settings and sneakers, water bottles, earbuds. Streetwear goes with brick, concrete and urban props. Elegant or formal pieces go with marble, cream walls and fine jewelry. Kids' clothes go with soft, playful nursery settings. Accessories must be clearly separate styling props that suit the item and never look like part of it. Keep scenes realistic and uncluttered so the garment stays the focus. Pick modelScene from the allowed list to match the same mood.

Price: if comparable active eBay prices are provided, price a little under the median for the condition; otherwise estimate from brand, type and condition. Keep it realistic for secondhand.`;
}

/**
 * imageUrls: URLs https de las fotos (originales, para leer bien las etiquetas).
 * notes: lo que la vendedora quiera añadir ("talla M, mide 90 cm de largo").
 * comps: { median, low, high, count } de eBay, opcional.
 */
export async function describeItem({ imageUrls, notes = '', language = 'en', comps = null, currency = 'USD' }) {
  const client = new Anthropic();
  const content = [
    ...imageUrls.slice(0, 8).map((url) => ({ type: 'image', source: { type: 'url', url } })),
    {
      type: 'text',
      text: [
        'Write the listing for the item in these photos.',
        `Currency: ${currency}.`,
        notes.trim() ? `Seller notes (trust these over the photos):\n${notes.trim()}` : 'No seller notes.',
        comps?.count ? `Comparable active eBay listings for "${comps.query}": ${comps.count} results, 25th percentile ${comps.low}, median ${comps.median}, 75th percentile ${comps.high}.` : '',
      ].filter(Boolean).join('\n\n'),
    },
  ];

  const response = await client.beta.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default', // si el modelo rechaza la petición, la API la reintenta con otro modelo
    output_config: { effort: 'medium', format: betaZodOutputFormat(ListingSchema) },
    system: buildSystemPrompt(language),
    messages: [{ role: 'user', content }],
  });

  if (response.stop_reason === 'refusal') throw new Error('La IA no pudo describir estas fotos. Prueba con otras fotos.');
  if (response.stop_reason === 'max_tokens' || !response.parsed_output) throw new Error('La IA no terminó la respuesta. Inténtalo de nuevo.');
  return cleanListing(response.parsed_output);
}

/** Ajusta la salida a los límites de las plataformas. */
export function cleanListing(l) {
  const title = l.title.trim().replace(/\s+/g, ' ');
  return {
    ...l,
    title: title.length > 80 ? title.slice(0, 80).replace(/\s+\S*$/, '') : title,
    keywords: l.keywords.map((k) => k.trim()).filter((k, i, all) => k && all.findIndex((x) => x.toLowerCase() === k.toLowerCase()) === i).slice(0, 10),
    suggestedPrice: Math.max(0, Math.round(l.suggestedPrice * 100) / 100),
    condition: CONDITIONS.includes(l.condition) ? l.condition : 'good',
    look: l.look ? { ...l.look, modelScene: MODEL_SCENES.includes(l.look.modelScene) ? l.look.modelScene : 'goldenlight' } : l.look,
    detailPhotoIndexes: (l.detailPhotoIndexes || []).filter((i) => Number.isInteger(i) && i >= 0),
  };
}
