import React, { useEffect, useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { isValidISODate, parseAmount, toISODate, uid } from '../logic';
import { useStore } from '../store';
import { space, useColors } from '../theme';
import type { Transaction, TxType } from '../types';
import { Button, Chip, Field, Row, Segmented, Sheet, T } from './ui';

export function confirm(message: string, onYes: () => void, actionLabel = 'Elimina') {
  // Web is only a preview (and the embedded viewer blocks confirm dialogs), so act directly.
  if (Platform.OS === 'web') return onYes();
  Alert.alert(message, undefined, [
    { text: 'Annulla', style: 'cancel' },
    { text: actionLabel, style: 'destructive', onPress: onYes },
  ]);
}

export function TransactionSheet({ visible, onClose, editing }: {
  visible: boolean; onClose: () => void; editing?: Transaction | null;
}) {
  const { data, dispatch } = useStore();
  const c = useColors();
  const [txType, setTxType] = useState<TxType>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('food');
  const [date, setDate] = useState(toISODate(new Date()));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setError('');
    if (editing) {
      setTxType(editing.type);
      setAmount(String(editing.amount).replace('.', ','));
      setCategoryId(editing.categoryId);
      setDate(editing.date);
      setNote(editing.note);
    } else {
      setTxType('expense');
      setAmount('');
      setCategoryId('food');
      setDate(toISODate(new Date()));
      setNote('');
    }
  }, [visible, editing]);

  const cats = data.categories.filter((k) => k.kind === txType);

  const changeType = (t: TxType) => {
    setTxType(t);
    const first = data.categories.find((k) => k.kind === t);
    if (first) setCategoryId(first.id);
  };

  const save = () => {
    const n = parseAmount(amount);
    if (Number.isNaN(n)) return setError('Inserisci un importo valido, ad esempio 12,50');
    if (!isValidISODate(date)) return setError('Data non valida: usa il formato AAAA-MM-GG');
    if (!cats.some((k) => k.id === categoryId)) return setError('Scegli una categoria');
    dispatch({
      type: 'upsertTx',
      tx: { id: editing?.id ?? uid(), type: txType, amount: n, categoryId, date, note: note.trim() },
    });
    onClose();
  };

  return (
    <Sheet visible={visible} title={editing ? 'Modifica movimento' : 'Nuovo movimento'} onClose={onClose}>
      <Segmented
        value={txType}
        onChange={changeType}
        options={[{ value: 'expense', label: 'Uscita' }, { value: 'income', label: 'Entrata' }]}
      />
      <Field label="Importo" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0,00" autoFocus={!editing} />
      <View style={{ gap: space[2] }}>
        <T size="xs" muted>Categoria</T>
        <Row style={{ flexWrap: 'wrap', gap: space[2] }}>
          {cats.map((k) => (
            <Chip key={k.id} label={`${k.icon} ${k.name}`} color={k.color} selected={k.id === categoryId} onPress={() => setCategoryId(k.id)} />
          ))}
        </Row>
      </View>
      <Field label="Data (AAAA-MM-GG)" value={date} onChangeText={setDate} autoCapitalize="none" />
      <Field label="Nota" value={note} onChangeText={setNote} placeholder="Facoltativa" maxLength={80} />
      {error ? <T size="sm" color={c.danger}>{error}</T> : null}
      <Button label="Salva" onPress={save} />
      {editing ? (
        <Button
          label="Elimina movimento"
          variant="danger"
          onPress={() => confirm('Eliminare questo movimento?', () => { dispatch({ type: 'deleteTx', id: editing.id }); onClose(); })}
        />
      ) : null}
    </Sheet>
  );
}
