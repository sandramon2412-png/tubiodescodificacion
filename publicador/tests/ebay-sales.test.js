import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orderLines } from '../lib/ebay.js';
import { mergeEbaySales, summarize } from '../public/finance-calc.js';

const order = {
  orderId: '12-345', creationDate: '2026-10-20T15:00:00.000Z', orderPaymentStatus: 'PAID',
  cancelStatus: { cancelState: 'NONE_REQUESTED' },
  pricingSummary: { deliveryCost: { value: '10.00' } },
  totalMarketplaceFee: { value: '12.00', currency: 'USD' },
  lineItems: [
    { lineItemId: 'L1', sku: 'VESTIDO-1', legacyItemId: '111', title: 'Vestido', quantity: 1, lineItemCost: { value: '30.00' } },
    { lineItemId: 'L2', sku: '', legacyItemId: '222', title: 'Bolso viejo', quantity: 2, lineItemCost: { value: '90.00' } },
  ],
};

test('orderLines reparte envío y comisión según el precio', () => {
  const [a, b] = orderLines(order);
  assert.deepEqual([a.price, a.fees, b.price, b.fees], [32.5, 3, 97.5, 9]);
  assert.equal(a.externalId, 'ebay:12-345:L1');
  assert.equal(a.date, '2026-10-20');
  assert.equal(b.quantity, 2);
});

test('orderLines ignora cancelados y no pagados', () => {
  assert.deepEqual(orderLines({ ...order, cancelStatus: { cancelState: 'CANCELED' } }), []);
  assert.deepEqual(orderLines({ ...order, orderPaymentStatus: 'FULLY_REFUNDED' }), []);
});

test('mergeEbaySales: empareja por SKU, crea los desconocidos y no duplica', () => {
  const db = {
    items: [{ id: 'v', title: 'Vestido', cost: 5, price: 30, quantity: 1, status: 'disponible', sales: [],
      listings: { ebay: { status: 'publicado', sku: 'VESTIDO-1' }, poshmark: { status: 'publicado' } } }],
    expenses: [], settings: {},
  };
  let n = 0;
  const id = () => `id${++n}`;
  const lines = orderLines(order);
  const r = mergeEbaySales(db, lines, id);
  assert.deepEqual([r.added, r.created], [2, 1]);
  assert.deepEqual(r.remind, [{ title: 'Vestido', platforms: ['Poshmark'] }]);
  const v = db.items.find((i) => i.id === 'v');
  assert.equal(v.status, 'vendido');
  assert.equal(v.listings.ebay.status, 'vendido');
  const bolso = db.items.find((i) => i.title === 'Bolso viejo');
  assert.equal(bolso.needsCost, true);
  assert.equal(bolso.quantity, 0);

  const again = mergeEbaySales(db, lines, id);
  assert.equal(again.added, 0, 'no duplica ventas ya importadas');

  bolso.cost = 10; // costo por unidad × 2 unidades
  const s = summarize(db);
  assert.equal(s.cogs, 25);
  assert.equal(s.profit, 130 - 12 - 25);
});
