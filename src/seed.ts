import { toISODate, uid } from './logic';
import type { AppData, Category } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'food', name: 'Spesa', icon: '🛒', color: '#2f8f5b', kind: 'expense' },
  { id: 'eat', name: 'Ristoranti', icon: '🍝', color: '#d9822b', kind: 'expense' },
  { id: 'home', name: 'Casa', icon: '🏠', color: '#5b6ad0', kind: 'expense' },
  { id: 'transport', name: 'Trasporti', icon: '🚗', color: '#2b8fb3', kind: 'expense' },
  { id: 'bills', name: 'Bollette', icon: '💡', color: '#c9a227', kind: 'expense' },
  { id: 'health', name: 'Salute', icon: '💊', color: '#d1495b', kind: 'expense' },
  { id: 'fun', name: 'Svago', icon: '🎬', color: '#9b5de5', kind: 'expense' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#e56b9f', kind: 'expense' },
  { id: 'subs', name: 'Abbonamenti', icon: '🔁', color: '#4d908e', kind: 'expense' },
  { id: 'other', name: 'Altro', icon: '📦', color: '#8a8f87', kind: 'expense' },
  { id: 'salary', name: 'Stipendio', icon: '💼', color: '#17703f', kind: 'income' },
  { id: 'extra', name: 'Extra', icon: '✨', color: '#3a9d6a', kind: 'income' },
  { id: 'gift', name: 'Regali', icon: '🎁', color: '#57a773', kind: 'income' },
];

export function emptyData(): AppData {
  return {
    version: 1, currency: 'EUR', categories: DEFAULT_CATEGORIES,
    transactions: [], budgets: [], subscriptions: [], goals: [], holdings: [],
  };
}

export function sampleData(today = new Date()): AppData {
  const d = (offset: number) =>
    toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset));
  const plusDays = (n: number) =>
    toISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + n));
  const tx = (type: 'income' | 'expense', amount: number, categoryId: string, off: number, note: string) =>
    ({ id: uid(), type, amount, categoryId, date: d(off), note });
  return {
    ...emptyData(),
    transactions: [
      tx('income', 1850, 'salary', 3, 'Stipendio'),
      tx('expense', 62.4, 'food', 0, 'Supermercato'),
      tx('expense', 18, 'eat', 1, 'Pizza con amici'),
      tx('expense', 45, 'transport', 2, 'Benzina'),
      tx('expense', 650, 'home', 4, 'Affitto'),
      tx('expense', 74.9, 'bills', 5, 'Luce e gas'),
      tx('expense', 38.2, 'food', 6, 'Mercato'),
      tx('expense', 12.5, 'health', 7, 'Farmacia'),
      tx('expense', 29.99, 'shopping', 8, 'Maglione'),
      tx('income', 120, 'extra', 9, 'Vendita usato'),
      tx('expense', 9.5, 'fun', 10, 'Cinema'),
    ],
    budgets: [
      { categoryId: 'food', limit: 300 },
      { categoryId: 'eat', limit: 100 },
      { categoryId: 'transport', limit: 120 },
      { categoryId: 'shopping', limit: 30 },
    ],
    subscriptions: [
      { id: uid(), name: 'Streaming video', amount: 12.99, cycle: 'monthly', nextDate: plusDays(3), icon: '📺', active: true },
      { id: uid(), name: 'Musica', amount: 10.99, cycle: 'monthly', nextDate: plusDays(12), icon: '🎵', active: true },
      { id: uid(), name: 'Palestra', amount: 39, cycle: 'monthly', nextDate: plusDays(6), icon: '🏋️', active: true },
      { id: uid(), name: 'Cloud foto', amount: 29.99, cycle: 'yearly', nextDate: plusDays(80), icon: '☁️', active: true },
    ],
    goals: [
      { id: uid(), name: 'Fondo emergenze', icon: '🛟', target: 5000, saved: 2100, deadline: plusDays(365) },
      { id: uid(), name: 'Vacanza', icon: '🏖️', target: 1500, saved: 600, deadline: plusDays(200) },
    ],
    holdings: [
      { id: uid(), symbol: 'VWCE', name: 'ETF azionario globale', type: 'etf', quantity: 25, avgPrice: 98.4, currentPrice: 121.3 },
      { id: uid(), symbol: 'BTP', name: 'BTP Italia', type: 'bond', quantity: 10, avgPrice: 100, currentPrice: 101.2 },
      { id: uid(), symbol: 'BTC', name: 'Bitcoin', type: 'crypto', quantity: 0.02, avgPrice: 52000, currentPrice: 58000 },
    ],
  };
}
