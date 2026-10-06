import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { confirm } from '../components/TransactionSheet';
import { Button, Card, Chip, Empty, Field, Row, Screen, Segmented, Sheet, T } from '../components/ui';
import {
  daysUntil, formatMoney, isValidISODate, monthlyCost, nextRenewal, parseAmount, subscriptionTotals,
  toISODate, uid, yearlyCost,
} from '../logic';
import { useStore } from '../store';
import { space, useColors } from '../theme';
import type { Cycle, Subscription } from '../types';

const ICONS = ['📺', '🎵', '🏋️', '☁️', '📰', '🎮', '📱', '🌐', '🚗', '📦'];
const CYCLE_LABEL: Record<Cycle, string> = { weekly: 'settimana', monthly: 'mese', yearly: 'anno' };

export function SubscriptionsScreen() {
  const { data, dispatch } = useStore();
  const c = useColors();
  const cur = data.currency;
  const [sheet, setSheet] = useState(false);
  const [edit, setEdit] = useState<Subscription | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [nextDate, setNextDate] = useState(toISODate(new Date()));
  const [icon, setIcon] = useState(ICONS[0]);
  const [error, setError] = useState('');

  const totals = subscriptionTotals(data.subscriptions);
  const sorted = [...data.subscriptions]
    .map((s) => ({ s, next: nextRenewal(s) }))
    .sort((a, b) => Number(b.s.active) - Number(a.s.active) || (a.next < b.next ? -1 : 1));

  const open = (s: Subscription | null) => {
    setEdit(s);
    setName(s?.name ?? '');
    setAmount(s ? String(s.amount).replace('.', ',') : '');
    setCycle(s?.cycle ?? 'monthly');
    setNextDate(s ? nextRenewal(s) : toISODate(new Date()));
    setIcon(s?.icon ?? ICONS[0]);
    setError('');
    setSheet(true);
  };

  const save = () => {
    const n = parseAmount(amount);
    if (!name.trim()) return setError('Dai un nome all\'abbonamento');
    if (Number.isNaN(n)) return setError('Inserisci un importo valido');
    if (!isValidISODate(nextDate)) return setError('Data non valida: usa AAAA-MM-GG');
    dispatch({
      type: 'upsertSub',
      sub: { id: edit?.id ?? uid(), name: name.trim(), amount: n, cycle, nextDate, icon, active: edit?.active ?? true },
    });
    setSheet(false);
  };

  return (
    <Screen title="Abbonamenti" right={<Button label="＋ Nuovo" small onPress={() => open(null)} />}>
      <Card>
        <T size="sm" muted>{totals.count} abbonamenti attivi</T>
        <T size="xl">{formatMoney(totals.monthly, cur)} <T muted>al mese</T></T>
        <T size="sm" muted>{formatMoney(totals.yearly, cur)} all'anno</T>
      </Card>
      {sorted.length === 0 ? <Empty text="Aggiungi i tuoi abbonamenti per vedere quanto ti costano davvero in un anno." /> : sorted.map(({ s, next }) => {
        const days = daysUntil(next);
        return (
          <Pressable key={s.id} onPress={() => open(s)} accessibilityRole="button">
            <Card style={{ opacity: s.active ? 1 : 0.6 }}>
              <Row>
                <T size="xl">{s.icon}</T>
                <View style={{ flex: 1 }}>
                  <T size="lg" numberOfLines={1}>{s.name}</T>
                  <T size="sm" muted>
                    {s.active ? `Rinnovo ${days === 0 ? 'oggi' : days === 1 ? 'domani' : `tra ${days} giorni`} (${next})` : 'In pausa'}
                  </T>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <T style={{ fontWeight: '600' }}>{formatMoney(s.amount, cur)}</T>
                  <T size="xs" muted>/{CYCLE_LABEL[s.cycle]}</T>
                </View>
              </Row>
              {s.cycle !== 'monthly' ? <T size="xs" muted>≈ {formatMoney(monthlyCost(s), cur)} al mese · {formatMoney(yearlyCost(s), cur)} all'anno</T> : null}
            </Card>
          </Pressable>
        );
      })}
      <Sheet visible={sheet} title={edit ? 'Modifica abbonamento' : 'Nuovo abbonamento'} onClose={() => setSheet(false)}>
        <Row style={{ flexWrap: 'wrap', gap: space[2] }}>
          {ICONS.map((i) => <Chip key={i} label={i} selected={i === icon} onPress={() => setIcon(i)} />)}
        </Row>
        <Field label="Nome" value={name} onChangeText={setName} placeholder="Es. Streaming" maxLength={40} />
        <Field label="Importo" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0,00" />
        <Segmented value={cycle} onChange={setCycle} options={[
          { value: 'weekly', label: 'Settimanale' }, { value: 'monthly', label: 'Mensile' }, { value: 'yearly', label: 'Annuale' },
        ]} />
        <Field label="Prossimo rinnovo (AAAA-MM-GG)" value={nextDate} onChangeText={setNextDate} autoCapitalize="none" />
        {error ? <T size="sm" color={c.danger}>{error}</T> : null}
        <Button label="Salva" onPress={save} />
        {edit ? (
          <>
            <Button
              label={edit.active ? 'Metti in pausa' : 'Riattiva'}
              variant="ghost"
              onPress={() => { dispatch({ type: 'upsertSub', sub: { ...edit, active: !edit.active } }); setSheet(false); }}
            />
            <Button label="Elimina" variant="danger" onPress={() => confirm('Eliminare questo abbonamento?', () => { dispatch({ type: 'deleteSub', id: edit.id }); setSheet(false); })} />
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}
