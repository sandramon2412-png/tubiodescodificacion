// Cálculos de inventario y finanzas. Módulo puro (navegador + tests).

export const PLATFORMS = { ebay: 'eBay', poshmark: 'Poshmark', depop: 'Depop', otro: 'Otro / en persona' };

// Comisiones ESTIMADAS (EE. UU.). Cambian a menudo: se pueden editar en Finanzas → Comisiones.
// pct = % sobre el precio de venta, fixed = cargo fijo por venta,
// under/flat = si la venta es menor que "under", se cobra "flat" en lugar del %.
export const DEFAULT_FEES = {
  ebay: { pct: 13.6, fixed: 0.4 },
  poshmark: { pct: 20, fixed: 0, under: 15, flat: 2.95 },
  depop: { pct: 3.3, fixed: 0.45 },
  otro: { pct: 0, fixed: 0 },
};

export const EXPENSE_CATEGORIES = ['Embalaje', 'Envíos', 'Suscripciones', 'Publicidad', 'Transporte', 'Otros'];

export const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export function feeRules(settings) {
  const custom = settings?.fees || {};
  return Object.fromEntries(Object.keys(DEFAULT_FEES).map((k) => [k, { ...DEFAULT_FEES[k], ...(custom[k] || {}) }]));
}

export function estimateFee(platform, price, rules = DEFAULT_FEES) {
  const f = rules[platform] || { pct: 0, fixed: 0 };
  const p = Number(price) || 0;
  if (p <= 0) return 0;
  if (f.under && p < f.under) return round2(f.flat);
  return round2((p * (Number(f.pct) || 0)) / 100 + (Number(f.fixed) || 0));
}

/** Ganancia neta de una venta concreta. */
export const saleProfit = (sale, unitCost) =>
  round2((Number(sale.price) || 0) - (Number(sale.fees) || 0) - (Number(sale.shipping) || 0) - (Number(unitCost) || 0));

const inRange = (date, { from, to } = {}) => (!from || date >= from) && (!to || date <= to);

/** Lista plana de ventas con su artículo. */
export function allSales(items, range) {
  const out = [];
  for (const item of items) {
    for (const s of item.sales || []) {
      if (inRange(s.date, range)) out.push({ ...s, item, profit: saleProfit(s, item.cost) });
    }
  }
  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function inventoryStats(items) {
  const avail = items.filter((i) => i.status === 'disponible' && i.quantity > 0);
  return {
    articles: avail.length,
    units: avail.reduce((s, i) => s + i.quantity, 0),
    costValue: round2(avail.reduce((s, i) => s + (Number(i.cost) || 0) * i.quantity, 0)),
    listValue: round2(avail.reduce((s, i) => s + (Number(i.price) || 0) * i.quantity, 0)),
  };
}

export function summarize(db, range = {}) {
  const sales = allSales(db.items, range);
  const expenses = db.expenses.filter((e) => inRange(e.date, range));
  const sum = (arr, f) => round2(arr.reduce((s, x) => s + (Number(f(x)) || 0), 0));

  const revenue = sum(sales, (s) => s.price);
  const fees = sum(sales, (s) => s.fees);
  const shipping = sum(sales, (s) => s.shipping);
  const cogs = sum(sales, (s) => s.item.cost);
  const otherExpenses = sum(expenses, (e) => e.amount);
  const profit = round2(revenue - fees - shipping - cogs - otherExpenses);

  const byPlatform = {};
  for (const s of sales) {
    const p = (byPlatform[s.platform] ||= { count: 0, revenue: 0, fees: 0, profit: 0 });
    p.count += 1;
    p.revenue = round2(p.revenue + (Number(s.price) || 0));
    p.fees = round2(p.fees + (Number(s.fees) || 0));
    p.profit = round2(p.profit + s.profit);
  }

  const months = {};
  const month = (d) => (months[d.slice(0, 7)] ||= { month: d.slice(0, 7), revenue: 0, profit: 0, sales: 0 });
  for (const s of sales) {
    const m = month(s.date);
    m.sales += 1;
    m.revenue = round2(m.revenue + (Number(s.price) || 0));
    m.profit = round2(m.profit + s.profit);
  }
  for (const e of expenses) {
    const m = month(e.date);
    m.profit = round2(m.profit - (Number(e.amount) || 0));
  }

  const expenseByCategory = {};
  for (const e of expenses) expenseByCategory[e.category] = round2((expenseByCategory[e.category] || 0) + (Number(e.amount) || 0));

  return {
    count: sales.length,
    revenue, fees, shipping, cogs, otherExpenses, profit,
    margin: revenue ? round2((profit / revenue) * 100) : 0,
    avgSale: sales.length ? round2(revenue / sales.length) : 0,
    byPlatform,
    byMonth: Object.values(months).sort((a, b) => (a.month < b.month ? -1 : 1)),
    expenseByCategory,
    sales,
    expenses,
  };
}

/** Rango de fechas (YYYY-MM-DD) para los filtros de Finanzas. */
export function rangeFor(key, today = new Date()) {
  const iso = (d) => d.toISOString().slice(0, 10);
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  switch (key) {
    case 'month': return { from: iso(new Date(Date.UTC(y, m, 1))), to: iso(today) };
    case 'lastMonth': return { from: iso(new Date(Date.UTC(y, m - 1, 1))), to: iso(new Date(Date.UTC(y, m, 0))) };
    case 'year': return { from: `${y}-01-01`, to: iso(today) };
    default: return {};
  }
}

/** Registra la venta de 1 unidad. Devuelve el artículo actualizado (no muta el original). */
export function applySale(item, sale) {
  const quantity = Math.max(0, (item.quantity || 0) - 1);
  return {
    ...item,
    quantity,
    status: quantity === 0 ? 'vendido' : item.status,
    sales: [...(item.sales || []), sale],
  };
}

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
export const toCsv = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\n');

export function financeCsv(summary) {
  const rows = [['Tipo', 'Fecha', 'Concepto', 'Plataforma/Categoría', 'Ingreso', 'Comisión', 'Envío', 'Costo', 'Ganancia']];
  for (const s of summary.sales) {
    rows.push(['Venta', s.date, s.item.title, PLATFORMS[s.platform] || s.platform, s.price, s.fees, s.shipping, s.item.cost || 0, s.profit]);
  }
  for (const e of summary.expenses) {
    rows.push(['Gasto', e.date, e.concept, e.category, 0, 0, 0, e.amount, -e.amount]);
  }
  return toCsv(rows);
}
