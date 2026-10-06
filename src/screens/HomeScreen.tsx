import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { TransactionSheet } from '../components/TransactionSheet';
import { TxRow } from '../components/TxRow';
import { Button, Card, MonthSwitcher, Progress, Row, Screen, T } from '../components/ui';
import {
  budgetStatus, dayLabel, formatMoney, monthKey, monthLabel, monthTotals, portfolioStats,
  shiftMonth, spendingByCategory, subscriptionTotals, upcomingRenewals,
} from '../logic';
import { useStore } from '../store';
import { radius, space, useColors } from '../theme';
import type { Transaction } from '../types';

export function HomeScreen({ onOpenSettings, onGo }: { onOpenSettings: () => void; onGo: (tab: string) => void }) {
  const { data } = useStore();
  const c = useColors();
  const [month, setMonth] = useState(monthKey(new Date()));
  const [sheet, setSheet] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const cur = data.currency;

  const totals = monthTotals(data.transactions, month);
  const byCat = spendingByCategory(data.transactions, data.categories, month);
  const alerts = data.budgets
    .map((b) => ({ b, s: budgetStatus(b, data.transactions, month) }))
    .filter((x) => x.s.state !== 'ok');
  const renewals = upcomingRenewals(data.subscriptions, 7);
  const subs = subscriptionTotals(data.subscriptions);
  const portfolio = portfolioStats(data.holdings);
  const saved = data.goals.reduce((a, g) => a + g.saved, 0);
  const recent = data.transactions
    .filter((t) => t.date.startsWith(month))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  const open = (t: Transaction | null) => { setEditing(t); setSheet(true); };

  return (
    <Screen
      title="Gruzzolo"
      right={
        <Pressable accessibilityLabel="Impostazioni" onPress={onOpenSettings} hitSlop={12}>
          <T size="lg">⚙️</T>
        </Pressable>
      }
    >
      <MonthSwitcher label={monthLabel(month)} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} />

      <Card style={{ backgroundColor: c.accent, borderColor: c.accent }}>
        <T size="sm" color={c.onAccent}>Saldo del mese</T>
        <T size="display" color={c.onAccent}>{formatMoney(totals.net, cur)}</T>
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <T size="xs" color={c.onAccent}>Entrate</T>
            <T size="lg" color={c.onAccent}>{formatMoney(totals.income, cur)}</T>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <T size="xs" color={c.onAccent}>Uscite</T>
            <T size="lg" color={c.onAccent}>{formatMoney(totals.expense, cur)}</T>
          </View>
        </Row>
      </Card>

      <Button label="＋ Aggiungi movimento" onPress={() => open(null)} />

      {alerts.length > 0 && (
        <Card>
          <T size="lg">Attenzione al budget</T>
          {alerts.map(({ b, s }) => {
            const cat = data.categories.find((x) => x.id === b.categoryId);
            return (
              <View key={b.categoryId} style={{ gap: space[1] }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T>{cat?.icon} {cat?.name}</T>
                  <T size="sm" color={s.state === 'over' ? c.danger : c.warning}>
                    {s.state === 'over' ? `Superato di ${formatMoney(-s.remaining, cur)}` : `${Math.round(s.ratio * 100)}% usato`}
                  </T>
                </Row>
                <Progress ratio={s.ratio} color={s.state === 'over' ? c.danger : c.warning} />
              </View>
            );
          })}
        </Card>
      )}

      <Card>
        <T size="lg">Spese per categoria</T>
        {byCat.length === 0 ? (
          <T muted>Nessuna spesa in questo mese.</T>
        ) : (
          <>
            <View style={{ flexDirection: 'row', height: 14, borderRadius: radius.pill, overflow: 'hidden', backgroundColor: c.track }}>
              {byCat.map((x) => (
                <View key={x.category.id} style={{ width: `${x.share * 100}%`, backgroundColor: x.category.color }} />
              ))}
            </View>
            {byCat.slice(0, 5).map((x) => (
              <Row key={x.category.id} style={{ justifyContent: 'space-between' }}>
                <Row style={{ gap: space[2] }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: x.category.color }} />
                  <T>{x.category.icon} {x.category.name}</T>
                </Row>
                <T>{formatMoney(x.amount, cur)} <T size="xs" muted>{Math.round(x.share * 100)}%</T></T>
              </Row>
            ))}
          </>
        )}
      </Card>

      <Row style={{ alignItems: 'stretch' }}>
        <Pressable style={{ flex: 1 }} onPress={() => onGo('goals')} accessibilityRole="button">
          <Card style={{ flex: 1 }}>
            <T size="xs" muted>Risparmi negli obiettivi</T>
            <T size="lg">{formatMoney(saved, cur)}</T>
          </Card>
        </Pressable>
        <Pressable style={{ flex: 1 }} onPress={() => onGo('invest')} accessibilityRole="button">
          <Card style={{ flex: 1 }}>
            <T size="xs" muted>Portafoglio</T>
            <T size="lg">{formatMoney(portfolio.value, cur)}</T>
            <T size="xs" color={portfolio.gain >= 0 ? c.success : c.danger}>
              {portfolio.gain >= 0 ? '+' : ''}{(portfolio.gainPct * 100).toFixed(1).replace('.', ',')}%
            </T>
          </Card>
        </Pressable>
      </Row>

      <Pressable onPress={() => onGo('subs')} accessibilityRole="button">
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <T size="lg">Rinnovi in arrivo</T>
            <T size="sm" muted>{formatMoney(subs.monthly, cur)}/mese</T>
          </Row>
          {renewals.length === 0 ? (
            <T muted>Nessun rinnovo nei prossimi 7 giorni.</T>
          ) : renewals.map((r) => (
            <Row key={r.sub.id} style={{ justifyContent: 'space-between' }}>
              <T>{r.sub.icon} {r.sub.name}</T>
              <T size="sm" muted>{r.days === 0 ? 'oggi' : r.days === 1 ? 'domani' : `tra ${r.days} giorni`} · {formatMoney(r.sub.amount, cur)}</T>
            </Row>
          ))}
        </Card>
      </Pressable>

      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <T size="lg">Ultimi movimenti</T>
          <Button label="Tutti" variant="ghost" small onPress={() => onGo('tx')} />
        </Row>
        {recent.length === 0 ? <T muted>Ancora nessun movimento.</T> : recent.map((t) => (
          <View key={t.id}>
            <T size="xs" muted>{dayLabel(t.date)}</T>
            <TxRow tx={t} onPress={() => open(t)} />
          </View>
        ))}
      </Card>

      <TransactionSheet visible={sheet} editing={editing} onClose={() => setSheet(false)} />
    </Screen>
  );
}
