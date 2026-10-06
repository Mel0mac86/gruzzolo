import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { confirm } from '../components/TransactionSheet';
import { Button, Card, Chip, Empty, Field, Progress, Row, Screen, Sheet, T } from '../components/ui';
import { formatMoney, goalProgress, isValidISODate, parseAmount, uid } from '../logic';
import { useStore } from '../store';
import { space, useColors } from '../theme';
import type { Goal } from '../types';

const ICONS = ['🛟', '🏖️', '🏠', '🚗', '💍', '🎓', '💻', '👶', '🎁', '✈️'];

export function GoalsScreen() {
  const { data, dispatch } = useStore();
  const c = useColors();
  const cur = data.currency;
  const [sheet, setSheet] = useState(false);
  const [edit, setEdit] = useState<Goal | null>(null);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [error, setError] = useState('');
  const [depositFor, setDepositFor] = useState<Goal | null>(null);
  const [deposit, setDeposit] = useState('');
  const [withdraw, setWithdraw] = useState(false);

  const totalSaved = data.goals.reduce((a, g) => a + g.saved, 0);
  const totalTarget = data.goals.reduce((a, g) => a + g.target, 0);

  const open = (g: Goal | null) => {
    setEdit(g);
    setName(g?.name ?? '');
    setTarget(g ? String(g.target).replace('.', ',') : '');
    setDeadline(g?.deadline ?? '');
    setIcon(g?.icon ?? ICONS[0]);
    setError('');
    setSheet(true);
  };

  const save = () => {
    const n = parseAmount(target);
    if (!name.trim()) return setError('Dai un nome all\'obiettivo');
    if (Number.isNaN(n)) return setError('Inserisci una cifra obiettivo valida');
    if (deadline && !isValidISODate(deadline)) return setError('Scadenza non valida: usa AAAA-MM-GG o lascia vuoto');
    dispatch({
      type: 'upsertGoal',
      goal: { id: edit?.id ?? uid(), name: name.trim(), target: n, saved: edit?.saved ?? 0, deadline: deadline || null, icon },
    });
    setSheet(false);
  };

  const doDeposit = () => {
    const n = parseAmount(deposit);
    if (!depositFor || Number.isNaN(n)) return setError('Inserisci un importo valido');
    dispatch({ type: 'depositGoal', id: depositFor.id, amount: withdraw ? -n : n });
    setDepositFor(null);
  };

  return (
    <Screen title="Obiettivi" right={<Button label="＋ Nuovo" small onPress={() => open(null)} />}>
      {data.goals.length > 0 && (
        <Card>
          <T size="sm" muted>Risparmiati in totale</T>
          <T size="xl">{formatMoney(totalSaved, cur)} <T muted>/ {formatMoney(totalTarget, cur)}</T></T>
          <Progress ratio={totalTarget ? totalSaved / totalTarget : 0} />
        </Card>
      )}
      {data.goals.length === 0 ? <Empty text="Crea un obiettivo: un fondo emergenze, un viaggio, la casa." /> : data.goals.map((g) => {
        const p = goalProgress(g);
        return (
          <Card key={g.id}>
            <Pressable onPress={() => open(g)} accessibilityRole="button">
              <Row>
                <T size="xl">{g.icon}</T>
                <View style={{ flex: 1 }}>
                  <T size="lg" numberOfLines={1}>{g.name}</T>
                  <T size="sm" muted>{formatMoney(g.saved, cur)} di {formatMoney(g.target, cur)}</T>
                </View>
                <T size="lg" color={p.done ? c.success : c.accent}>{Math.round(p.ratio * 100)}%</T>
              </Row>
            </Pressable>
            <Progress ratio={p.ratio} color={p.done ? c.success : c.accent} />
            {p.done ? (
              <T size="sm" color={c.success}>Obiettivo raggiunto 🎉</T>
            ) : p.monthlyNeeded !== null ? (
              <T size="sm" muted>
                {p.monthsLeft && p.monthsLeft > 0
                  ? `Metti da parte ${formatMoney(p.monthlyNeeded, cur)} al mese per ${p.monthsLeft} mesi`
                  : `Mancano ${formatMoney(p.remaining, cur)} e la scadenza è questo mese`}
              </T>
            ) : (
              <T size="sm" muted>Mancano {formatMoney(p.remaining, cur)}</T>
            )}
            <Row>
              <View style={{ flex: 1 }}><Button label="＋ Versa" small onPress={() => { setDepositFor(g); setWithdraw(false); setDeposit(''); setError(''); }} /></View>
              <View style={{ flex: 1 }}><Button label="− Preleva" small variant="ghost" onPress={() => { setDepositFor(g); setWithdraw(true); setDeposit(''); setError(''); }} /></View>
            </Row>
          </Card>
        );
      })}

      <Sheet visible={sheet} title={edit ? 'Modifica obiettivo' : 'Nuovo obiettivo'} onClose={() => setSheet(false)}>
        <Row style={{ flexWrap: 'wrap', gap: space[2] }}>
          {ICONS.map((i) => <Chip key={i} label={i} selected={i === icon} onPress={() => setIcon(i)} />)}
        </Row>
        <Field label="Nome" value={name} onChangeText={setName} placeholder="Es. Vacanza" maxLength={40} />
        <Field label="Cifra da raggiungere" value={target} onChangeText={setTarget} keyboardType="decimal-pad" placeholder="0,00" />
        <Field label="Scadenza (AAAA-MM-GG, facoltativa)" value={deadline} onChangeText={setDeadline} autoCapitalize="none" />
        {error ? <T size="sm" color={c.danger}>{error}</T> : null}
        <Button label="Salva" onPress={save} />
        {edit ? <Button label="Elimina" variant="danger" onPress={() => confirm('Eliminare questo obiettivo?', () => { dispatch({ type: 'deleteGoal', id: edit.id }); setSheet(false); })} /> : null}
      </Sheet>

      <Sheet visible={!!depositFor} title={withdraw ? 'Preleva' : 'Versa'} onClose={() => setDepositFor(null)}>
        <T>{depositFor?.icon} {depositFor?.name}</T>
        <Field label="Importo" value={deposit} onChangeText={setDeposit} keyboardType="decimal-pad" placeholder="0,00" autoFocus />
        {error ? <T size="sm" color={c.danger}>{error}</T> : null}
        <Button label={withdraw ? 'Preleva' : 'Versa'} onPress={doDeposit} />
      </Sheet>
    </Screen>
  );
}
