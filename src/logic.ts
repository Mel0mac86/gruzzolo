import type {
  AppData, AssetType, Budget, Category, Cycle, Goal, Holding, Subscription, Transaction,
} from './types';

export const pad = (n: number) => String(n).padStart(2, '0');

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = parseISODate(s);
  return toISODate(d) === s;
}

/** "12,50" or "1.234,5" or "12.5" -> number; NaN when not a positive amount. */
export function parseAmount(input: string): number {
  let s = input.trim().replace(/\s|€/g, '');
  if (!s) return NaN;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return NaN;
  const n = Math.round(Number(s) * 100) / 100;
  return n > 0 ? n : NaN;
}

export function formatMoney(n: number, currency = 'EUR'): string {
  try {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

/** Month key "YYYY-MM". */
export const monthKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

export function shiftMonth(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + delta, 1));
}

const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio',
  'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function dayLabel(iso: string, today = new Date()): string {
  const t = toISODate(today);
  const y = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (iso === t) return 'Oggi';
  if (iso === toISODate(y)) return 'Ieri';
  const d = parseISODate(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()} ${d.getFullYear()}`;
}

export const inMonth = (tx: Transaction, key: string) => tx.date.startsWith(key);

export function monthTotals(txs: Transaction[], key: string) {
  let income = 0;
  let expense = 0;
  for (const t of txs) {
    if (!inMonth(t, key)) continue;
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  return { income: round2(income), expense: round2(expense), net: round2(income - expense) };
}

export function spendingByCategory(txs: Transaction[], cats: Category[], key: string) {
  const map = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== 'expense' || !inMonth(t, key)) continue;
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  }
  const total = [...map.values()].reduce((a, b) => a + b, 0);
  return [...map.entries()]
    .map(([categoryId, amount]) => ({
      category: cats.find((c) => c.id === categoryId) ?? fallbackCategory(categoryId),
      amount: round2(amount),
      share: total > 0 ? amount / total : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function fallbackCategory(id: string): Category {
  return { id, name: 'Altro', icon: '❔', color: '#8a8f87', kind: 'expense' };
}

export type BudgetState = 'ok' | 'warning' | 'over';

export function budgetStatus(b: Budget, txs: Transaction[], key: string) {
  const spent = round2(txs
    .filter((t) => t.type === 'expense' && t.categoryId === b.categoryId && inMonth(t, key))
    .reduce((a, t) => a + t.amount, 0));
  const ratio = b.limit > 0 ? spent / b.limit : 0;
  const state: BudgetState = ratio >= 1 ? 'over' : ratio >= 0.8 ? 'warning' : 'ok';
  return { spent, remaining: round2(b.limit - spent), ratio, state };
}

export function groupByDay(txs: Transaction[]) {
  const sorted = [...txs].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  const groups: { date: string; items: Transaction[]; net: number }[] = [];
  for (const t of sorted) {
    let g = groups[groups.length - 1];
    if (!g || g.date !== t.date) {
      g = { date: t.date, items: [], net: 0 };
      groups.push(g);
    }
    g.items.push(t);
    g.net = round2(g.net + (t.type === 'income' ? t.amount : -t.amount));
  }
  return groups;
}

export function searchTransactions(txs: Transaction[], cats: Category[], q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return txs;
  return txs.filter((t) => {
    const c = cats.find((x) => x.id === t.categoryId);
    return t.note.toLowerCase().includes(s) || (c?.name.toLowerCase().includes(s) ?? false);
  });
}

// Subscriptions

const CYCLE_PER_YEAR: Record<Cycle, number> = { weekly: 52, monthly: 12, yearly: 1 };

export const yearlyCost = (s: Subscription) => round2(s.amount * CYCLE_PER_YEAR[s.cycle]);
export const monthlyCost = (s: Subscription) => round2(yearlyCost(s) / 12);

export function subscriptionTotals(subs: Subscription[]) {
  const active = subs.filter((s) => s.active);
  const yearly = round2(active.reduce((a, s) => a + yearlyCost(s), 0));
  return { monthly: round2(yearly / 12), yearly, count: active.length };
}

/** Move a renewal date forward by whole cycles until it is today or later. */
export function nextRenewal(s: Subscription, today = new Date()): string {
  const t = toISODate(today);
  let d = parseISODate(s.nextDate);
  const day = d.getDate();
  let guard = 0;
  while (toISODate(d) < t && guard++ < 1000) {
    if (s.cycle === 'weekly') d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7);
    else {
      const months = s.cycle === 'monthly' ? 1 : 12;
      const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
      const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
      d = new Date(target.getFullYear(), target.getMonth(), Math.min(day, last));
    }
  }
  return toISODate(d);
}

export function daysUntil(iso: string, today = new Date()): number {
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((parseISODate(iso).getTime() - a.getTime()) / 86400000);
}

export function upcomingRenewals(subs: Subscription[], within = 7, today = new Date()) {
  return subs
    .filter((s) => s.active)
    .map((s) => ({ sub: s, date: nextRenewal(s, today) }))
    .map((r) => ({ ...r, days: daysUntil(r.date, today) }))
    .filter((r) => r.days >= 0 && r.days <= within)
    .sort((a, b) => a.days - b.days);
}

// Goals

export function goalProgress(g: Goal, today = new Date()) {
  const ratio = g.target > 0 ? Math.min(g.saved / g.target, 1) : 0;
  const remaining = round2(Math.max(g.target - g.saved, 0));
  let monthlyNeeded: number | null = null;
  let monthsLeft: number | null = null;
  if (g.deadline && remaining > 0) {
    const d = parseISODate(g.deadline);
    monthsLeft = (d.getFullYear() - today.getFullYear()) * 12 + (d.getMonth() - today.getMonth());
    if (d.getDate() < today.getDate()) monthsLeft -= 1;
    monthsLeft = Math.max(monthsLeft, 0);
    monthlyNeeded = monthsLeft > 0 ? round2(remaining / monthsLeft) : remaining;
  }
  return { ratio, remaining, monthlyNeeded, monthsLeft, done: remaining === 0 };
}

// Investments

export function holdingStats(h: Holding) {
  const value = round2(h.quantity * h.currentPrice);
  const cost = round2(h.quantity * h.avgPrice);
  const gain = round2(value - cost);
  return { value, cost, gain, gainPct: cost > 0 ? gain / cost : 0 };
}

export function portfolioStats(hs: Holding[]) {
  let value = 0;
  let cost = 0;
  const byType = new Map<AssetType, number>();
  for (const h of hs) {
    const s = holdingStats(h);
    value += s.value;
    cost += s.cost;
    byType.set(h.type, (byType.get(h.type) ?? 0) + s.value);
  }
  const allocation = [...byType.entries()]
    .map(([type, v]) => ({ type, value: round2(v), share: value > 0 ? v / value : 0 }))
    .sort((a, b) => b.value - a.value);
  const gain = round2(value - cost);
  return { value: round2(value), cost: round2(cost), gain, gainPct: cost > 0 ? gain / cost : 0, allocation };
}

// Export

export function toCSV(data: AppData): string {
  const esc = (v: string) => (/[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const rows = [['data', 'tipo', 'importo', 'categoria', 'nota']];
  const sorted = [...data.transactions].sort((a, b) => (a.date < b.date ? -1 : 1));
  for (const t of sorted) {
    const c = data.categories.find((x) => x.id === t.categoryId)?.name ?? 'Altro';
    rows.push([t.date, t.type === 'income' ? 'entrata' : 'uscita', t.amount.toFixed(2), c, t.note]);
  }
  return rows.map((r) => r.map(esc).join(',')).join('\n');
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
