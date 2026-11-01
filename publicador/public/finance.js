import { state, subscribe, mutate, esc, money, uid, today } from './store.js';
import { PLATFORMS, EXPENSE_CATEGORIES, DEFAULT_FEES, feeRules, summarize, rangeFor, inventoryStats, financeCsv } from './finance-calc.js';

const $ = (id) => document.getElementById(id);
let last = null;

export function initFinance() {
  $('finPeriod').addEventListener('change', render);
  for (const c of EXPENSE_CATEGORIES) $('expCategory').add(new Option(c, c));
  $('expDate').value = today();
  $('expenseForm').addEventListener('submit', addExpense);
  $('finSales').addEventListener('click', onSalesClick);
  $('finExpenses').addEventListener('click', onExpenseClick);
  $('feesForm').addEventListener('submit', saveFees);
  $('finExport').addEventListener('click', exportCsv);
  subscribe(render);
}

const tile = (label, value, cls = '', sub = '') =>
  `<div class="kpi ${cls}"><b>${value}</b><span>${label}</span>${sub ? `<small>${sub}</small>` : ''}</div>`;

function render() {
  if (!state.db) {
    $('finKpis').innerHTML = `<p class="err">${esc(state.error || 'Cargando…')}</p>`;
    return;
  }
  const s = (last = summarize(state.db, rangeFor($('finPeriod').value)));
  const inv = inventoryStats(state.db.items);
  $('finKpis').innerHTML = [
    tile('Ingresos por ventas', money(s.revenue), '', `${s.count} ventas · media ${money(s.avgSale)}`),
    tile('Comisiones', `−${money(s.fees)}`),
    tile('Envíos pagados', `−${money(s.shipping)}`),
    tile('Costo de lo vendido', `−${money(s.cogs)}`),
    tile('Otros gastos', `−${money(s.otherExpenses)}`),
    tile('Ganancia neta', money(s.profit), s.profit >= 0 ? 'good' : 'bad', `margen ${s.margin.toLocaleString('es')} %`),
    tile('Inventario disponible', money(inv.costValue), '', `vale ${money(inv.listValue)} a precio de venta`),
  ].join('');

  const plat = Object.entries(s.byPlatform);
  $('finPlatforms').innerHTML = plat.length
    ? table(['Plataforma', 'Ventas', 'Ingresos', 'Comisiones', 'Ganancia'],
      plat.map(([p, v]) => [PLATFORMS[p] || p, v.count, money(v.revenue), money(v.fees), money(v.profit)]))
    : '<p class="hint">Sin ventas en este periodo.</p>';

  $('finMonths').innerHTML = s.byMonth.length
    ? table(['Mes', 'Ventas', 'Ingresos', 'Ganancia neta'], s.byMonth.map((m) => [m.month, m.sales, money(m.revenue), money(m.profit)]))
    : '<p class="hint">Sin movimientos.</p>';

  $('finSales').innerHTML = s.sales.length
    ? table(['Fecha', 'Artículo', 'Plataforma', 'Precio', 'Comisión', 'Envío', 'Ganancia', ''],
      s.sales.map((x) => [x.date, x.item.title, PLATFORMS[x.platform] || x.platform, money(x.price), money(x.fees), money(x.shipping), money(x.profit),
        { html: `<button type="button" class="ghost small" data-undo="${esc(x.id)}" data-item="${esc(x.item.id)}">Deshacer</button>` }]))
    : '<p class="hint">Marca un artículo como «Vendido» en Inventario para verlo aquí.</p>';

  $('finExpenses').innerHTML = s.expenses.length
    ? table(['Fecha', 'Concepto', 'Categoría', 'Monto', ''],
      [...s.expenses].sort((a, b) => (a.date < b.date ? 1 : -1)).map((x) => [x.date, x.concept, x.category, money(x.amount),
        { html: `<button type="button" class="ghost small" data-del="${esc(x.id)}">Borrar</button>` }]))
    : '<p class="hint">Sin gastos en este periodo.</p>';

  const rules = feeRules(state.db.settings);
  $('feesFields').innerHTML = Object.keys(DEFAULT_FEES).map((p) => `
    <div class="feeRow"><b>${esc(PLATFORMS[p])}</b>
      <label>%<input type="number" step="0.01" min="0" name="${p}.pct" value="${rules[p].pct}"></label>
      <label>+ fijo<input type="number" step="0.01" min="0" name="${p}.fixed" value="${rules[p].fixed}"></label>
    </div>`).join('');
  $('finCurrency').value = state.db.settings.currency || 'USD';
}

function table(head, rows) {
  const cell = (c) => (c && typeof c === 'object' ? c.html : esc(c));
  return `<div class="tableWrap"><table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${cell(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function addExpense(e) {
  e.preventDefault();
  const amount = Number($('expAmount').value);
  if (!(amount > 0)) return;
  mutate((db) => {
    db.expenses.push({ id: uid(), date: $('expDate').value || today(), concept: $('expConcept').value.trim(), category: $('expCategory').value, amount });
  });
  $('expConcept').value = '';
  $('expAmount').value = '';
}

function onExpenseClick(e) {
  const id = e.target.dataset.del;
  if (id && confirm('¿Borrar este gasto?')) mutate((db) => { db.expenses = db.expenses.filter((x) => x.id !== id); });
}

function onSalesClick(e) {
  const { undo, item } = e.target.dataset;
  if (!undo || !confirm('¿Deshacer esta venta? El artículo vuelve a estar disponible.')) return;
  mutate((db) => {
    const it = db.items.find((x) => x.id === item);
    if (!it) return;
    it.sales = it.sales.filter((s) => s.id !== undo);
    it.quantity += 1;
    if (it.status === 'vendido') it.status = 'disponible';
  });
}

function saveFees(e) {
  e.preventDefault();
  const fees = {};
  for (const [k, v] of new FormData($('feesForm'))) {
    const [p, field] = k.split('.');
    if (field) (fees[p] ||= {})[field] = Number(v) || 0;
  }
  const currency = $('finCurrency').value.trim().toUpperCase() || 'USD';
  mutate((db) => { db.settings = { ...db.settings, fees, currency }; });
}

function exportCsv() {
  if (!last) return;
  const blob = new Blob(['﻿' + financeCsv(last)], { type: 'text/csv;charset=utf-8' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `finanzas-${$('finPeriod').value}-${today()}.csv` });
  a.click();
  URL.revokeObjectURL(a.href);
}
