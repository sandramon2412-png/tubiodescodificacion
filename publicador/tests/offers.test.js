import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideOffer, breakEven, bestOfferTerms } from '../public/finance-calc.js';
import { parseBestOffers } from '../lib/ebay-trading.js';

const item = { price: 50, cost: 10 };
const off = (price, quantity = 1) => ({ price, quantity });

test('break-even con comisión de eBay', () => {
  assert.equal(breakEven(10), 12.04); // (10 + 0.40) / (1 - 0.136)
  assert.equal(breakEven(0), 0);
});

test('reglas por defecto: aceptar ≥90 %, rechazar <60 %, contraofertar al 90 % en medio', () => {
  assert.equal(decideOffer(off(46), item).action, 'accept');
  assert.equal(decideOffer(off(25), item).action, 'decline');
  assert.deepEqual([decideOffer(off(38), item).action, decideOffer(off(38), item).price], ['counter', 45]);
});

test('modo preguntar y protección de costo', () => {
  const ask = { offers: { between: 'ask' } };
  const d = decideOffer(off(38), item, ask);
  assert.equal(d.action, 'ask');
  assert.equal(d.suggest, 45);
  const caro = { price: 20, cost: 18 }; // break-even 21.30 > precio → nunca acepta con pérdida
  assert.equal(decideOffer(off(19), caro, ask).action, 'ask');
  assert.match(decideOffer(off(19), caro, ask).reason, /perderías/);
  assert.equal(decideOffer(off(19), caro, { offers: { protectCost: false } }).action, 'accept');
});

test('ofertas por varias unidades usan el precio unitario', () => {
  assert.equal(decideOffer(off(92, 2), item).action, 'accept');
  assert.deepEqual(decideOffer(off(76, 2), item).price, 90);
});

test('sin precio en el inventario, pregunta', () => {
  assert.equal(decideOffer(off(10), {}).action, 'ask');
});

test('límites automáticos para eBay', () => {
  assert.deepEqual(bestOfferTerms(50, 10), { bestOfferEnabled: true, autoAcceptPrice: 45, autoDeclinePrice: 30 });
  assert.deepEqual(bestOfferTerms(20, 18), { bestOfferEnabled: true }, 'si el mínimo sin pérdida ≥ precio, no auto-acepta');
  assert.equal(bestOfferTerms(50, 10, { offers: { enabled: false } }), null);
});

test('lee ofertas del XML de eBay', () => {
  const xml = `<GetBestOffersResponse><Ack>Success</Ack><BestOfferArray>
    <BestOffer><BestOfferID>555</BestOfferID><ExpirationTime>2026-11-03T10:00:00.000Z</ExpirationTime>
      <Buyer><UserID>ana_b</UserID></Buyer><Price currencyID="USD">38.0</Price><Status>Pending</Status>
      <Quantity>1</Quantity><BuyerMessage>¿Lo dejas en 38? &amp; gracias</BuyerMessage><BestOfferCodeType>BuyerBestOffer</BestOfferCodeType></BestOffer>
  </BestOfferArray></GetBestOffersResponse>`;
  assert.deepEqual(parseBestOffers(xml, 123), [{
    offerId: '555', listingId: '123', price: 38, currency: 'USD', quantity: 1, status: 'Pending', type: 'BuyerBestOffer',
    buyer: 'ana_b', message: '¿Lo dejas en 38? & gracias', expires: '2026-11-03T10:00:00.000Z',
  }]);
});
