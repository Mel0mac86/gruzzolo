import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { TransactionSheet } from '../components/TransactionSheet';
import { TxRow } from '../components/TxRow';
import { Button, Card, Empty, Screen, Segmented, T, Row } from '../components/ui';
import { dayLabel, formatMoney, groupByDay, searchTransactions } from '../logic';
import { useStore } from '../store';
import { radius, space, type, useColors } from '../theme';
import type { Transaction } from '../types';

type Filter = 'all' | 'expense' | 'income';

export function TransactionsScreen() {
  const { data } = useStore();
  const c = useColors();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sheet, setSheet] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const list = searchTransactions(data.transactions, data.categories, q)
    .filter((t) => filter === 'all' || t.type === filter);
  const groups = groupByDay(list);
  const open = (t: Transaction | null) => { setEditing(t); setSheet(true); };

  return (
    <Screen title="Movimenti" right={<Button label="＋ Nuovo" small onPress={() => open(null)} />}>
      <TextInput
        value={q}
        onChangeText={setQ}
        placeholder="Cerca per nota o categoria"
        placeholderTextColor={c.textMuted}
        accessibilityLabel="Cerca movimenti"
        style={[type.base, { color: c.text, backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: space[4], paddingVertical: space[2] + 2 }]}
      />
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[{ value: 'all', label: 'Tutti' }, { value: 'expense', label: 'Uscite' }, { value: 'income', label: 'Entrate' }]}
      />
      {groups.length === 0 ? (
        <Empty text={q ? 'Nessun movimento trovato.' : 'Aggiungi il tuo primo movimento con il tasto Nuovo.'} />
      ) : groups.map((g) => (
        <View key={g.date} style={{ gap: space[2] }}>
          <Row style={{ justifyContent: 'space-between', paddingHorizontal: space[1] }}>
            <T size="sm" muted style={{ fontWeight: '600' }}>{dayLabel(g.date)}</T>
            <T size="sm" muted>{g.net >= 0 ? '+' : ''}{formatMoney(g.net, data.currency)}</T>
          </Row>
          <Card style={{ gap: 0, paddingVertical: space[2] }}>
            {g.items.map((t) => <TxRow key={t.id} tx={t} onPress={() => open(t)} />)}
          </Card>
        </View>
      ))}
      <TransactionSheet visible={sheet} editing={editing} onClose={() => setSheet(false)} />
    </Screen>
  );
}
