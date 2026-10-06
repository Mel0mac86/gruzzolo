export type TxType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: TxType;
}

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  categoryId: string;
  date: string; // YYYY-MM-DD
  note: string;
}

export interface Budget {
  categoryId: string;
  limit: number;
}

export type Cycle = 'weekly' | 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  cycle: Cycle;
  nextDate: string; // YYYY-MM-DD
  icon: string;
  active: boolean;
}

export interface Goal {
  id: string;
  name: string;
  icon: string;
  target: number;
  saved: number;
  deadline: string | null; // YYYY-MM-DD
}

export type AssetType = 'stock' | 'etf' | 'crypto' | 'bond' | 'cash';

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

export interface AppData {
  version: 1;
  currency: string;
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  subscriptions: Subscription[];
  goals: Goal[];
  holdings: Holding[];
}
