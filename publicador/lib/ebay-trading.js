// Ofertas ("Best Offer") de eBay. Solo existen en la Trading API (XML); se autentica con el
// mismo token OAuth del vendedor en la cabecera X-EBAY-API-IAF-TOKEN.
import { env, userToken } from './ebay.js';

const SITE_IDS = { EBAY_US: 0, EBAY_CA: 2, EBAY_GB: 3, EBAY_AU: 15, EBAY_FR: 71, EBAY_DE: 77, EBAY_IT: 101, EBAY_ES: 186 };
const xmlEsc = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
const tag = (xml, name) => {
  const m = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`).exec(xml);
  return m ? m[1].trim() : '';
};
const decode = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&');

async function trading(call, inner) {
  const token = await userToken();
  const r = await fetch(`${env().api}/ws/api.dll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml',
      'X-EBAY-API-CALL-NAME': call,
      'X-EBAY-API-SITEID': String(SITE_IDS[process.env.EBAY_MARKETPLACE_ID || 'EBAY_US'] ?? 0),
      'X-EBAY-API-COMPATIBILITY-LEVEL': '1349',
      'X-EBAY-API-IAF-TOKEN': token,
    },
    body: `<?xml version="1.0" encoding="utf-8"?><${call}Request xmlns="urn:ebay:apis:eBLBaseComponents">${inner}</${call}Request>`,
  });
  const xml = await r.text();
  const ack = tag(xml, 'Ack');
  if (!r.ok || ack === 'Failure' || ack === 'PartialFailure') {
    const msg = decode(tag(xml, 'LongMessage') || tag(xml, 'ShortMessage') || `HTTP ${r.status}`);
    throw new Error(`eBay (${call}): ${msg}`);
  }
  return xml;
}

/** Convierte la respuesta XML de GetBestOffers en ofertas. Exportada para los tests. */
export function parseBestOffers(xml, listingId) {
  const blocks = xml.match(/<BestOffer>[\s\S]*?<\/BestOffer>/g) || [];
  return blocks.map((b) => {
    const price = /<Price[^>]*currencyID="([A-Z]{3})"[^>]*>([\d.]+)<\/Price>/.exec(b);
    return {
      offerId: tag(b, 'BestOfferID'),
      listingId: String(listingId),
      price: price ? Number(price[2]) : 0,
      currency: price ? price[1] : '',
      quantity: Number(tag(b, 'Quantity')) || 1,
      status: tag(b, 'Status'),
      type: tag(b, 'BestOfferCodeType'),
      buyer: decode(tag(tag(b, 'Buyer'), 'UserID')),
      message: decode(tag(b, 'BuyerMessage')),
      expires: tag(b, 'ExpirationTime'),
    };
  }).filter((o) => o.offerId);
}

/** Ofertas pendientes de un anuncio. */
export async function getPendingOffers(listingId) {
  const xml = await trading('GetBestOffers',
    `<ItemID>${xmlEsc(listingId)}</ItemID><BestOfferStatus>Active</BestOfferStatus><DetailLevel>ReturnAll</DetailLevel>`);
  return parseBestOffers(xml, listingId).filter((o) => o.status === 'Pending' && o.type !== 'SellerCounterOffer');
}

/** action: Accept | Decline | Counter. counterPrice obligatorio para Counter. */
export async function respondToOffer({ listingId, offerId, action, counterPrice, message, currency = 'USD' }) {
  if (!['Accept', 'Decline', 'Counter'].includes(action)) throw new Error('Acción no válida.');
  let inner = `<ItemID>${xmlEsc(listingId)}</ItemID><BestOfferID>${xmlEsc(offerId)}</BestOfferID><Action>${action}</Action>`;
  if (action === 'Counter') {
    if (!(counterPrice > 0)) throw new Error('Falta el precio de la contraoferta.');
    inner += `<CounterOfferPrice currencyID="${xmlEsc(currency)}">${Number(counterPrice).toFixed(2)}</CounterOfferPrice><CounterOfferQuantity>1</CounterOfferQuantity>`;
  }
  if (message) inner += `<SellerResponse>${xmlEsc(String(message).slice(0, 250))}</SellerResponse>`;
  const xml = await trading('RespondToBestOffer', inner);
  if (tag(xml, 'CallStatus') === 'Failure') throw new Error('eBay no aceptó la respuesta a la oferta.');
  return { ok: true };
}
