// Cliente mínimo de las APIs REST oficiales de eBay (Sell Inventory + Taxonomy).
// Docs: https://developer.ebay.com/api-docs/sell/inventory/overview.html

const HOSTS = {
  production: { api: 'https://api.ebay.com', auth: 'https://auth.ebay.com', web: 'https://www.ebay.com' },
  sandbox: { api: 'https://api.sandbox.ebay.com', auth: 'https://auth.sandbox.ebay.com', web: 'https://sandbox.ebay.com' },
};

// Permisos para publicar. Las ventas (fulfillment) se piden aparte para que un token
// antiguo, conectado sin ese permiso, siga pudiendo publicar.
export const SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.account',
];
export const ORDERS_SCOPE = 'https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly';
const CONSENT_SCOPES = [...SCOPES, ORDERS_SCOPE];

// Mapeo de las condiciones de la app a los enums de eBay.
export const CONDITION_MAP = {
  new_tags: 'NEW',
  new_no_tags: 'NEW_OTHER',
  like_new: 'USED_EXCELLENT',
  good: 'USED_GOOD',
  fair: 'USED_ACCEPTABLE',
};

export function env() {
  const name = process.env.EBAY_ENV === 'production' ? 'production' : 'sandbox';
  return { name, ...HOSTS[name] };
}

export function missingEbayConfig({ forPublish = true } = {}) {
  const required = ['EBAY_CLIENT_ID', 'EBAY_CLIENT_SECRET', 'EBAY_RUNAME'];
  if (forPublish) {
    required.push(
      'EBAY_REFRESH_TOKEN',
      'EBAY_FULFILLMENT_POLICY_ID',
      'EBAY_PAYMENT_POLICY_ID',
      'EBAY_RETURN_POLICY_ID',
      'EBAY_MERCHANT_LOCATION_KEY',
    );
  }
  return required.filter((k) => !process.env[k]);
}

const basicAuth = () =>
  'Basic ' + Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString('base64');

export function consentUrl(state) {
  const u = new URL('/oauth2/authorize', env().auth);
  u.searchParams.set('client_id', process.env.EBAY_CLIENT_ID);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('redirect_uri', process.env.EBAY_RUNAME);
  u.searchParams.set('scope', CONSENT_SCOPES.join(' '));
  u.searchParams.set('state', state);
  return u.toString();
}

async function tokenRequest(params) {
  const r = await fetch(`${env().api}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: basicAuth(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new EbayError(r.status, data, 'No se pudo obtener el token de eBay');
  return data;
}

export const exchangeCode = (code) =>
  tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: process.env.EBAY_RUNAME });

// Caché en memoria mientras la función siga "caliente".
const cache = {};

async function cachedToken(slot, params) {
  const now = Date.now();
  if (cache[slot] && cache[slot].expires > now + 60_000) return cache[slot].token;
  const data = await tokenRequest(params);
  cache[slot] = { token: data.access_token, expires: now + data.expires_in * 1000 };
  return data.access_token;
}

export const userToken = (scopes = SCOPES) =>
  cachedToken(`user:${scopes.join(' ')}`, {
    grant_type: 'refresh_token',
    refresh_token: process.env.EBAY_REFRESH_TOKEN,
    scope: scopes.join(' '),
  });

export const appToken = () =>
  cachedToken('app', { grant_type: 'client_credentials', scope: SCOPES[0] });

export class EbayError extends Error {
  constructor(status, body, prefix = 'Error de eBay') {
    const details = (body?.errors || [])
      .map((e) => [e.longMessage || e.message, e.parameters?.map((p) => `${p.name}=${p.value}`).join(', ')]
        .filter(Boolean).join(' — '))
      .join(' | ');
    super(`${prefix} (${status})${details ? `: ${details}` : body?.error_description ? `: ${body.error_description}` : ''}`);
    this.status = status;
    this.body = body;
  }
}

async function call(method, path, { body, token, headers = {} } = {}) {
  const r = await fetch(`${env().api}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Language': process.env.EBAY_CONTENT_LANGUAGE || 'en-US',
      Accept: 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  const data = text ? JSON.parse(text) : {};
  if (!r.ok) throw new EbayError(r.status, data);
  return data;
}

/** Convierte "Clave: valor" (una por línea) + campos sueltos en aspects de eBay. */
export function buildAspects(listing) {
  const aspects = {};
  const add = (k, v) => {
    if (!k || !v) return;
    aspects[k] = String(v).split(',').map((s) => s.trim()).filter(Boolean);
  };
  add('Brand', listing.brand);
  add('Size', listing.size);
  add('Color', listing.color);
  for (const line of String(listing.extraAspects || '').split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) add(line.slice(0, i).trim(), line.slice(i + 1).trim());
  }
  return aspects;
}

export function makeSku(title) {
  const slug = String(title || 'item').normalize('NFD').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
  return `${slug || 'item'}-${Date.now().toString(36)}`.toUpperCase();
}

/** Valida y normaliza un anuncio. Devuelve { errors, listing }. */
export function validateListing(raw = {}) {
  const errors = [];
  const listing = {
    title: String(raw.title || '').trim(),
    description: String(raw.description || '').trim(),
    price: Number(raw.price),
    quantity: Math.max(1, parseInt(raw.quantity, 10) || 1),
    condition: raw.condition,
    brand: String(raw.brand || '').trim(),
    size: String(raw.size || '').trim(),
    color: String(raw.color || '').trim(),
    extraAspects: String(raw.extraAspects || ''),
    ebayCategoryId: String(raw.ebayCategoryId || '').trim(),
    images: Array.isArray(raw.images) ? raw.images.filter((u) => /^https:\/\//.test(u)).slice(0, 24) : [],
  };
  if (!listing.title) errors.push('Falta el título.');
  if (listing.title.length > 80) errors.push('eBay admite títulos de 80 caracteres como máximo.');
  if (!listing.description) errors.push('Falta la descripción.');
  if (!(listing.price > 0)) errors.push('El precio debe ser mayor que 0.');
  if (!CONDITION_MAP[listing.condition]) errors.push('Condición no válida.');
  if (!/^\d+$/.test(listing.ebayCategoryId)) errors.push('Elige una categoría de eBay.');
  if (!listing.images.length) errors.push('eBay necesita al menos una foto (URL https).');
  return { errors, listing };
}

/** Crea el inventory item, la oferta y la publica. Devuelve { sku, offerId, listingId, url }. */
export async function publishListing(listing) {
  const token = await userToken();
  const sku = makeSku(listing.title);
  const marketplaceId = process.env.EBAY_MARKETPLACE_ID || 'EBAY_US';

  await call('PUT', `/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`, {
    token,
    body: {
      availability: { shipToLocationAvailability: { quantity: listing.quantity } },
      condition: CONDITION_MAP[listing.condition],
      product: {
        title: listing.title,
        description: listing.description,
        aspects: buildAspects(listing),
        imageUrls: listing.images,
      },
    },
  });

  const offer = await call('POST', '/sell/inventory/v1/offer', {
    token,
    body: {
      sku,
      marketplaceId,
      format: 'FIXED_PRICE',
      availableQuantity: listing.quantity,
      categoryId: listing.ebayCategoryId,
      listingDescription: listing.description,
      merchantLocationKey: process.env.EBAY_MERCHANT_LOCATION_KEY,
      listingPolicies: {
        fulfillmentPolicyId: process.env.EBAY_FULFILLMENT_POLICY_ID,
        paymentPolicyId: process.env.EBAY_PAYMENT_POLICY_ID,
        returnPolicyId: process.env.EBAY_RETURN_POLICY_ID,
      },
      pricingSummary: {
        price: { value: listing.price.toFixed(2), currency: process.env.EBAY_CURRENCY || 'USD' },
      },
    },
  });

  const published = await call('POST', `/sell/inventory/v1/offer/${offer.offerId}/publish`, { token });
  return {
    sku,
    offerId: offer.offerId,
    listingId: published.listingId,
    url: `${env().web}/itm/${published.listingId}`,
  };
}

const TREE_IDS = { EBAY_US: '0', EBAY_GB: '3', EBAY_ES: '186', EBAY_CA: '2', EBAY_AU: '15', EBAY_DE: '77', EBAY_FR: '71', EBAY_IT: '101' };

export async function suggestCategories(q) {
  const token = await appToken();
  const tree = TREE_IDS[process.env.EBAY_MARKETPLACE_ID || 'EBAY_US'] ?? '0';
  const data = await call('GET', `/commerce/taxonomy/v1/category_tree/${tree}/get_category_suggestions?q=${encodeURIComponent(q)}`, { token });
  return (data.categorySuggestions || []).slice(0, 10).map((s) => ({
    id: s.category.categoryId,
    name: s.category.categoryName,
    path: [...(s.categoryTreeNodeAncestors || [])].reverse().map((a) => a.categoryName).concat(s.category.categoryName).join(' › '),
  }));
}

/** Lista tus políticas de negocio y ubicaciones, para rellenar las variables de entorno. */
export async function accountSetup() {
  const token = await userToken();
  const mp = process.env.EBAY_MARKETPLACE_ID || 'EBAY_US';
  const pick = (list, idKey) => (list || []).map((p) => ({ id: p[idKey], name: p.name }));
  const [f, pay, ret, loc] = await Promise.all([
    call('GET', `/sell/account/v1/fulfillment_policy?marketplace_id=${mp}`, { token }),
    call('GET', `/sell/account/v1/payment_policy?marketplace_id=${mp}`, { token }),
    call('GET', `/sell/account/v1/return_policy?marketplace_id=${mp}`, { token }),
    call('GET', '/sell/inventory/v1/location?limit=100', { token }),
  ]);
  return {
    EBAY_FULFILLMENT_POLICY_ID: pick(f.fulfillmentPolicies, 'fulfillmentPolicyId'),
    EBAY_PAYMENT_POLICY_ID: pick(pay.paymentPolicies, 'paymentPolicyId'),
    EBAY_RETURN_POLICY_ID: pick(ret.returnPolicies, 'returnPolicyId'),
    EBAY_MERCHANT_LOCATION_KEY: (loc.locations || []).map((l) => ({ id: l.merchantLocationKey, name: l.name })),
  };
}

/** Crea una ubicación de inventario (desde donde envías). */
export async function createLocation({ key, name, postalCode, country }) {
  const token = await userToken();
  await call('POST', `/sell/inventory/v1/location/${encodeURIComponent(key)}`, {
    token,
    body: {
      name,
      location: { address: { postalCode, country } },
      locationTypes: ['WAREHOUSE'],
      merchantLocationStatus: 'ENABLED',
    },
  });
  return { key };
}

/** Finaliza el anuncio publicado de una oferta (el artículo sigue en tu inventario de eBay). */
export async function withdrawOffer(offerId) {
  const token = await userToken();
  return call('POST', `/sell/inventory/v1/offer/${encodeURIComponent(offerId)}/withdraw`, { token });
}

const money = (m) => Number(m?.value) || 0;

/**
 * Ventas de eBay desde una fecha (ISO). Devuelve una línea por artículo vendido, ya
 * normalizada: { externalId, orderId, date, sku, listingId, title, quantity, price, fees }.
 * price = lo que pagó el comprador por el artículo + su parte del envío.
 * fees = parte proporcional de la comisión real de eBay (totalMarketplaceFee).
 * Se omiten pedidos cancelados, sin pagar o reembolsados por completo.
 */
export async function fetchSales(sinceIso) {
  let token;
  try {
    token = await userToken([SCOPES[0], ORDERS_SCOPE]);
  } catch (e) {
    const err = new Error('Tu conexión con eBay no tiene permiso para leer ventas. Pulsa «Reconectar eBay» y actualiza EBAY_REFRESH_TOKEN.');
    err.status = 403;
    err.needsReconnect = true;
    throw err;
  }
  const filter = `creationdate:[${sinceIso}..]`;
  const lines = [];
  for (let offset = 0; offset < 5000; offset += 200) {
    const page = await call('GET', `/sell/fulfillment/v1/order?limit=200&offset=${offset}&filter=${encodeURIComponent(filter)}`, { token });
    for (const o of page.orders || []) lines.push(...orderLines(o));
    if (!page.next || !(page.orders || []).length) break;
  }
  return lines;
}

export function orderLines(o) {
  if (o.cancelStatus?.cancelState === 'CANCELED') return [];
  if (!['PAID', 'PARTIALLY_REFUNDED'].includes(o.orderPaymentStatus)) return [];
  const items = o.lineItems || [];
  const subtotal = items.reduce((s, li) => s + money(li.lineItemCost), 0);
  const delivery = money(o.pricingSummary?.deliveryCost) - money(o.pricingSummary?.deliveryDiscount);
  const fee = money(o.totalMarketplaceFee);
  const round = (n) => Math.round(n * 100) / 100;
  return items.map((li) => {
    const share = subtotal ? money(li.lineItemCost) / subtotal : 1 / items.length;
    return {
      externalId: `ebay:${o.orderId}:${li.lineItemId}`,
      orderId: o.orderId,
      date: String(o.creationDate || '').slice(0, 10),
      sku: li.sku || '',
      listingId: li.legacyItemId || '',
      title: li.title || '',
      quantity: Number(li.quantity) || 1,
      price: round(money(li.lineItemCost) + delivery * share),
      fees: round(fee * share),
      feesExact: o.totalMarketplaceFee != null,
    };
  });
}
