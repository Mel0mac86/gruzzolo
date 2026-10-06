import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { emptyData, sampleData } from './seed';
import type { AppData, Budget, Goal, Holding, Subscription, Transaction } from './types';

const KEY = 'gruzzolo:data:v1';

type Action =
  | { type: 'load'; data: AppData }
  | { type: 'upsertTx'; tx: Transaction }
  | { type: 'deleteTx'; id: string }
  | { type: 'setBudget'; budget: Budget }
  | { type: 'deleteBudget'; categoryId: string }
  | { type: 'upsertSub'; sub: Subscription }
  | { type: 'deleteSub'; id: string }
  | { type: 'upsertGoal'; goal: Goal }
  | { type: 'deleteGoal'; id: string }
  | { type: 'depositGoal'; id: string; amount: number }
  | { type: 'upsertHolding'; holding: Holding }
  | { type: 'deleteHolding'; id: string }
  | { type: 'setCurrency'; currency: string }
  | { type: 'reset'; sample: boolean };

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [item, ...list];
  const copy = list.slice();
  copy[i] = item;
  return copy;
}

export function reducer(state: AppData, a: Action): AppData {
  switch (a.type) {
    case 'load': return a.data;
    case 'upsertTx': return { ...state, transactions: upsert(state.transactions, a.tx) };
    case 'deleteTx': return { ...state, transactions: state.transactions.filter((t) => t.id !== a.id) };
    case 'setBudget':
      return {
        ...state,
        budgets: [...state.budgets.filter((b) => b.categoryId !== a.budget.categoryId), a.budget],
      };
    case 'deleteBudget': return { ...state, budgets: state.budgets.filter((b) => b.categoryId !== a.categoryId) };
    case 'upsertSub': return { ...state, subscriptions: upsert(state.subscriptions, a.sub) };
    case 'deleteSub': return { ...state, subscriptions: state.subscriptions.filter((s) => s.id !== a.id) };
    case 'upsertGoal': return { ...state, goals: upsert(state.goals, a.goal) };
    case 'deleteGoal': return { ...state, goals: state.goals.filter((g) => g.id !== a.id) };
    case 'depositGoal':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === a.id ? { ...g, saved: Math.max(0, Math.round((g.saved + a.amount) * 100) / 100) } : g),
      };
    case 'upsertHolding': return { ...state, holdings: upsert(state.holdings, a.holding) };
    case 'deleteHolding': return { ...state, holdings: state.holdings.filter((h) => h.id !== a.id) };
    case 'setCurrency': return { ...state, currency: a.currency };
    case 'reset': return a.sample ? sampleData() : emptyData();
  }
}

interface Store {
  data: AppData;
  dispatch: React.Dispatch<Action>;
  ready: boolean;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, dispatch] = useReducer(reducer, undefined, emptyData);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        // First launch shows example data so every screen has something to explore.
        const parsed = raw ? (JSON.parse(raw) as AppData) : sampleData();
        dispatch({ type: 'load', data: { ...emptyData(), ...parsed } });
      })
      .catch(() => dispatch({ type: 'load', data: sampleData() }))
      .finally(() => {
        loaded.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    AsyncStorage.setItem(KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  return <Ctx.Provider value={{ data, dispatch, ready }}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
