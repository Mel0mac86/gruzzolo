import React, { useState } from 'react';
import { Platform, Share } from 'react-native';
import { confirm } from '../components/TransactionSheet';
import { Button, Card, Chip, Row, Screen, T } from '../components/ui';
import { toCSV } from '../logic';
import { useStore } from '../store';
import { space } from '../theme';

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { data, dispatch } = useStore();
  const [csv, setCsv] = useState('');

  const exportCsv = async () => {
    const text = toCSV(data);
    if (Platform.OS === 'web') return setCsv(text);
    try {
      await Share.share({ message: text, title: 'gruzzolo-movimenti.csv' });
    } catch {
      setCsv(text);
    }
  };

  return (
    <Screen title="Impostazioni" right={<Button label="Fine" small variant="ghost" onPress={onBack} />}>
      <Card>
        <T size="lg">Valuta</T>
        <Row style={{ gap: space[2], flexWrap: 'wrap' }}>
          {CURRENCIES.map((c) => (
            <Chip key={c} label={c} selected={data.currency === c} onPress={() => dispatch({ type: 'setCurrency', currency: c })} />
          ))}
        </Row>
      </Card>
      <Card>
        <T size="lg">I tuoi dati</T>
        <T size="sm" muted>Tutto resta su questo iPhone. Nessun account, nessun server.</T>
        <Button label="Esporta movimenti in CSV" variant="ghost" onPress={exportCsv} />
        {csv ? <T size="xs" muted selectable>{csv}</T> : null}
        <Button label="Carica dati di esempio" variant="ghost" onPress={() => confirm('Sostituire i tuoi dati con quelli di esempio?', () => dispatch({ type: 'reset', sample: true }), 'Sostituisci')} />
        <Button label="Cancella tutti i dati" variant="danger" onPress={() => confirm('Cancellare tutti i dati? Non si può annullare.', () => dispatch({ type: 'reset', sample: false }), 'Cancella')} />
      </Card>
      <T size="xs" muted style={{ textAlign: 'center' }}>Gruzzolo 1.0</T>
    </Screen>
  );
}
