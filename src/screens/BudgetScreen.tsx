import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { confirm } from '../components/TransactionSheet';
import { Button, Card, Chip, Empty, Field, MonthSwitcher, Progress, Row, Screen, Sheet, T } from '../components/ui';
import { budgetStatus, formatMoney, monthKey, monthLabel, parseAmount, shiftMonth } from '../logic';
import { useStore } from '../store';
import { space, useColors } from '../theme';

export function BudgetScreen() {
  const { data, dispatch } = useStore();
  const c = useColors();
  const [month, setMonth] = useState(monthKey(new Date()));
  const [sheet, setSheet] = useState(false);
  const [catId, setCatId] = useState('food');
  const [limit, setLimit] = useState('');
  const [error, setError] = useState('');
  const [isEdit, setIsEdit] = useState(false);
  const cur = data.currency;

  const rows = data.budgets.map((b) => ({ b, s: budgetStatus(b, data.transactions, month) }));
  const totLimit = rows.reduce((a, r) => a + r.b.limit, 0);
  const totSpent = rows.reduce((a, r) => a + r.s.spent, 0);
  const expenseCats = data.categories.filter((k) => k.kind === 'expense');

  const open = (categoryId?: string) => {
    const existing = data.budgets.find((b) => b.categoryId === categoryId);
    const firstFree = expenseCats.find((k) => !data.budgets.some((b) => b.categoryId === k.id));
    setCatId(categoryId ?? firstFree?.id ?? 'other');
    setLimit(existing ? String(existing.limit).replace('.', ',') : '');
    setIsEdit(!!existing);
    setError('');
    setSheet(true);
  };

  const save = () => {
    const n = parseAmount(limit);
    if (Number.isNaN(n)) return setError('Inserisci un limite valido');
    dispatch({ type: 'setBudget', budget: { categoryId: catId, limit: n } });
    setSheet(false);
  };

  return (
    <Screen title="Budget" right={<Button label="＋ Budget" small onPress={() => open()} />}>
      <MonthSwitcher label={monthLabel(month)} onPrev={() => setMonth(shiftMonth(month, -1))} onNext={() => setMonth(shiftMonth(month, 1))} />
      {rows.length === 0 ? (
        <Empty text="Imposta un limite mensile per le categorie dove vuoi spendere meno." />
      ) : (
        <>
          <Card>
            <T size="sm" muted>Speso su budget totale</T>
            <T size="xl">{formatMoney(totSpent, cur)} <T muted>/ {formatMoney(totLimit, cur)}</T></T>
            <Progress ratio={totLimit ? totSpent / totLimit : 0} color={totSpent > totLimit ? c.danger : c.accent} />
          </Card>
          {rows.map(({ b, s }) => {
            const cat = data.categories.find((k) => k.id === b.categoryId);
            const col = s.state === 'over' ? c.danger : s.state === 'warning' ? c.warning : c.accent;
            return (
              <Pressable key={b.categoryId} onPress={() => open(b.categoryId)} accessibilityRole="button">
                <Card>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <T size="lg">{cat?.icon} {cat?.name ?? 'Altro'}</T>
                    <T size="sm" color={col}>{Math.round(s.ratio * 100)}%</T>
                  </Row>
                  <Progress ratio={s.ratio} color={col} />
                  <Row style={{ justifyContent: 'space-between' }}>
                    <T size="sm" muted>Spesi {formatMoney(s.spent, cur)} di {formatMoney(b.limit, cur)}</T>
                    <T size="sm" color={s.remaining < 0 ? c.danger : c.textMuted}>
                      {s.remaining >= 0 ? `Restano ${formatMoney(s.remaining, cur)}` : `Oltre di ${formatMoney(-s.remaining, cur)}`}
                    </T>
                  </Row>
                </Card>
              </Pressable>
            );
          })}
        </>
      )}
      <Sheet visible={sheet} title={isEdit ? 'Modifica budget' : 'Nuovo budget'} onClose={() => setSheet(false)}>
        <View style={{ gap: space[2] }}>
          <T size="xs" muted>Categoria</T>
          <Row style={{ flexWrap: 'wrap', gap: space[2] }}>
            {expenseCats.map((k) => (
              <Chip key={k.id} label={`${k.icon} ${k.name}`} color={k.color} selected={k.id === catId} onPress={() => setCatId(k.id)} />
            ))}
          </Row>
        </View>
        <Field label="Limite mensile" value={limit} onChangeText={setLimit} keyboardType="decimal-pad" placeholder="0,00" />
        {error ? <T size="sm" color={c.danger}>{error}</T> : null}
        <Button label="Salva" onPress={save} />
        {isEdit ? (
          <Button label="Elimina budget" variant="danger" onPress={() => confirm('Eliminare questo budget?', () => { dispatch({ type: 'deleteBudget', categoryId: catId }); setSheet(false); })} />
        ) : null}
      </Sheet>
    </Screen>
  );
}
