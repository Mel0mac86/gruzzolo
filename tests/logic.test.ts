import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  budgetStatus, goalProgress, groupByDay, isValidISODate, monthTotals, nextRenewal, parseAmount,
  portfolioStats, shiftMonth, spendingByCategory, subscriptionTotals, toCSV, upcomingRenewals,
} from '../src/logic.ts';
import type { AppData, Category, Subscription, Transaction } from '../src/types.ts';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Spesa', icon: '', color: '#000', kind: 'expense' },
  { id: 'home', name: 'Casa', icon: '', color: '#000', kind: 'expense' },
];
const emptyData = (): AppData => ({ version: 1, currency: 'EUR', categories: DEFAULT_CATEGORIES, transactions: [], budgets: [], subscriptions: [], goals: [], holdings: [] });

const tx = (p: Partial<Transaction>): Transaction =>
  ({ id: Math.random().toString(), type: 'expense', amount: 10, categoryId: 'food', date: '2026-10-05', note: '', ...p });
const sub = (p: Partial<Subscription>): Subscription =>
  ({ id: 's', name: 'X', amount: 10, cycle: 'monthly', nextDate: '2026-10-10', icon: '', active: true, ...p });
const day = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

test('parseAmount handles Italian and dot formats', () => {
  assert.equal(parseAmount('12,50'), 12.5);
  assert.equal(parseAmount('1.234,56'), 1234.56);
  assert.equal(parseAmount('12.5'), 12.5);
  assert.equal(parseAmount(' 7 € '), 7);
  assert.ok(Number.isNaN(parseAmount('')));
  assert.ok(Number.isNaN(parseAmount('0')));
  assert.ok(Number.isNaN(parseAmount('-3')));
  assert.ok(Number.isNaN(parseAmount('abc')));
});

test('isValidISODate rejects impossible dates', () => {
  assert.ok(isValidISODate('2024-02-29'));
  assert.ok(!isValidISODate('2026-02-30'));
  assert.ok(!isValidISODate('2026-1-5'));
});

test('shiftMonth crosses years', () => {
  assert.equal(shiftMonth('2026-01', -1), '2025-12');
  assert.equal(shiftMonth('2026-12', 1), '2027-01');
});

test('monthTotals only counts the given month and avoids float drift', () => {
  const txs = [tx({ amount: 0.1 }), tx({ amount: 0.2 }), tx({ type: 'income', amount: 100 }), tx({ date: '2026-09-30', amount: 50 })];
  assert.deepEqual(monthTotals(txs, '2026-10'), { income: 100, expense: 0.3, net: 99.7 });
});

test('spendingByCategory sorts and shares sum to 1', () => {
  const r = spendingByCategory([tx({ amount: 30 }), tx({ amount: 70, categoryId: 'home' }), tx({ type: 'income', amount: 999 })], DEFAULT_CATEGORIES, '2026-10');
  assert.equal(r[0].category.id, 'home');
  assert.equal(r.reduce((a, x) => a + x.share, 0), 1);
});

test('budgetStatus thresholds', () => {
  const b = { categoryId: 'food', limit: 100 };
  assert.equal(budgetStatus(b, [tx({ amount: 79 })], '2026-10').state, 'ok');
  assert.equal(budgetStatus(b, [tx({ amount: 80 })], '2026-10').state, 'warning');
  const over = budgetStatus(b, [tx({ amount: 120 })], '2026-10');
  assert.equal(over.state, 'over');
  assert.equal(over.remaining, -20);
});

test('groupByDay is newest first with daily net', () => {
  const g = groupByDay([tx({ date: '2026-10-01' }), tx({ date: '2026-10-03', type: 'income', amount: 50 }), tx({ date: '2026-10-03' })]);
  assert.deepEqual(g.map((x) => x.date), ['2026-10-03', '2026-10-01']);
  assert.equal(g[0].net, 40);
});

test('subscription totals normalise cycles and skip paused ones', () => {
  const t = subscriptionTotals([sub({ amount: 12 }), sub({ amount: 120, cycle: 'yearly' }), sub({ amount: 5, cycle: 'weekly' }), sub({ amount: 99, active: false })]);
  assert.equal(t.yearly, 144 + 120 + 260);
  assert.equal(t.monthly, 43.67);
  assert.equal(t.count, 3);
});

test('nextRenewal rolls past dates forward and clamps month ends', () => {
  assert.equal(nextRenewal(sub({ nextDate: '2026-01-31' }), day('2026-02-15')), '2026-02-28');
  assert.equal(nextRenewal(sub({ nextDate: '2026-09-01', cycle: 'weekly' }), day('2026-09-10')), '2026-09-15');
  assert.equal(nextRenewal(sub({ nextDate: '2025-03-01', cycle: 'yearly' }), day('2026-10-06')), '2027-03-01');
  assert.equal(nextRenewal(sub({ nextDate: '2026-10-20' }), day('2026-10-06')), '2026-10-20');
});

test('upcomingRenewals keeps the next 7 days, soonest first', () => {
  const r = upcomingRenewals([sub({ id: 'a', nextDate: '2026-10-12' }), sub({ id: 'b', nextDate: '2026-10-07' }), sub({ id: 'c', nextDate: '2026-10-30' })], 7, day('2026-10-06'));
  assert.deepEqual(r.map((x) => x.sub.id), ['b', 'a']);
  assert.equal(r[0].days, 1);
});

test('goalProgress suggests a monthly amount', () => {
  const p = goalProgress({ id: 'g', name: 'G', icon: '', target: 1200, saved: 200, deadline: '2027-08-06' }, day('2026-10-06'));
  assert.equal(p.monthsLeft, 10);
  assert.equal(p.monthlyNeeded, 100);
  assert.equal(goalProgress({ id: 'g', name: 'G', icon: '', target: 100, saved: 150, deadline: null }).done, true);
});

test('portfolioStats gain and allocation', () => {
  const p = portfolioStats([
    { id: '1', symbol: 'A', name: '', type: 'etf', quantity: 10, avgPrice: 100, currentPrice: 110 },
    { id: '2', symbol: 'B', name: '', type: 'crypto', quantity: 1, avgPrice: 1000, currentPrice: 900 },
  ]);
  assert.equal(p.value, 2000);
  assert.equal(p.gain, 0);
  assert.equal(p.allocation[0].share, 0.55);
});

test('toCSV escapes commas and quotes', () => {
  const d = { ...emptyData(), transactions: [tx({ note: 'Cena, "speciale"' })] };
  assert.equal(toCSV(d).split('\n')[1], '2026-10-05,uscita,10.00,Spesa,"Cena, ""speciale"""');
});
