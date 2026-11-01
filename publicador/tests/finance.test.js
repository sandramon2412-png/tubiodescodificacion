import { test } from 'node:test';
import assert from 'node:assert/strict';
import { estimateFee, summarize, applySale, inventoryStats, rangeFor, feeRules, financeCsv, DEFAULT_FEES } from '../public/finance-calc.js';
import { normalizeDb } from '../lib/db.js';

test('comisiones estimadas', () => {
  assert.equal(estimateFee('poshmark', 10), 2.95);   // tarifa plana bajo $15
  assert.equal(estimateFee('poshmark', 50), 10);     // 20 %
  assert.equal(estimateFee('ebay', 100), 14);        // 13.6 % + 0.40
  assert.equal(estimateFee('depop', 20), 1.11);      // 3.3 % + 0.45
  assert.equal(estimateFee('otro', 20), 0);
  assert.equal(estimateFee('ebay', 0), 0);
});

test('comisiones personalizadas se mezclan con las de por defecto', () => {
  const r = feeRules({ fees: { ebay: { pct: 10 } } });
  assert.equal(r.ebay.pct, 10);
  assert.equal(r.ebay.fixed, DEFAULT_FEES.ebay.fixed);
  assert.equal(estimateFee('ebay', 100, r), 10.4);
});

test('applySale descuenta unidades y marca vendido al llegar a 0', () => {
  const item = { id: 'a', quantity: 2, status: 'disponible', sales: [] };
  const once = applySale(item, { id: 's1' });
  assert.equal(once.quantity, 1);
  assert.equal(once.status, 'disponible');
  assert.equal(item.quantity, 2, 'no muta el original');
  const twice = applySale(once, { id: 's2' });
  assert.equal(twice.status, 'vendido');
  assert.equal(twice.sales.length, 2);
});

const db = {
  items: [
    { id: 'a', title: 'Vestido, "floral"', cost: 5, price: 30, quantity: 0, status: 'vendido',
      sales: [{ id: 's1', platform: 'poshmark', price: 30, fees: 6, shipping: 0, date: '2026-10-05' }] },
    { id: 'b', title: 'Tenis', cost: 20, price: 60, quantity: 1, status: 'disponible',
      sales: [{ id: 's2', platform: 'ebay', price: 60, fees: 8.56, shipping: 9, date: '2026-11-01' }] },
    { id: 'c', title: 'Bolso', cost: 10, price: 45, quantity: 2, status: 'disponible', sales: [] },
    { id: 'd', title: 'Retirado', cost: 3, price: 9, quantity: 1, status: 'retirado', sales: [] },
  ],
  expenses: [
    { id: 'e1', date: '2026-10-10', concept: 'Cajas', category: 'Embalaje', amount: 12 },
    { id: 'e2', date: '2026-11-01', concept: 'Cinta', category: 'Embalaje', amount: 3 },
  ],
  settings: {},
};

test('resumen total', () => {
  const s = summarize(db);
  assert.equal(s.count, 2);
  assert.equal(s.revenue, 90);
  assert.equal(s.fees, 14.56);
  assert.equal(s.shipping, 9);
  assert.equal(s.cogs, 25);
  assert.equal(s.otherExpenses, 15);
  assert.equal(s.profit, 26.44);
  assert.equal(s.byPlatform.poshmark.profit, 19);
  assert.equal(s.byPlatform.ebay.profit, 22.44);
  assert.deepEqual(s.byMonth.map((m) => [m.month, m.profit]), [['2026-10', 7], ['2026-11', 19.44]]);
  assert.equal(s.expenseByCategory.Embalaje, 15);
});

test('resumen filtrado por mes', () => {
  const s = summarize(db, rangeFor('month', new Date('2026-11-01T12:00:00Z')));
  assert.equal(s.count, 1);
  assert.equal(s.profit, 19.44);
  const last = rangeFor('lastMonth', new Date('2026-11-01T12:00:00Z'));
  assert.deepEqual(last, { from: '2026-10-01', to: '2026-10-31' });
});

test('valor del inventario solo cuenta lo disponible', () => {
  assert.deepEqual(inventoryStats(db.items), { articles: 2, units: 3, costValue: 40, listValue: 150 });
});

test('CSV escapa comillas y comas', () => {
  const csv = financeCsv(summarize(db));
  assert.ok(csv.includes('"Vestido, ""floral"""'));
  assert.equal(csv.split('\n').length, 5);
});

test('normalizeDb repara datos incompletos', () => {
  const empty = { items: [], expenses: [], settings: {}, offers: [], notifications: [] };
  assert.deepEqual(normalizeDb(null), empty);
  assert.deepEqual(normalizeDb({ items: 'x', settings: [] }), empty);
});
