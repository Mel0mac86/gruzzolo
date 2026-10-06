import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { confirm } from '../components/TransactionSheet';
import { Button, Card, Empty, Field, Row, Screen, Segmented, Sheet, T } from '../components/ui';
import { formatMoney, holdingStats, parseAmount, portfolioStats, uid } from '../logic';
import { useStore } from '../store';
import { radius, useColors } from '../theme';
import type { AssetType, Holding } from '../types';

const TYPE_LABEL: Record<AssetType, string> = { stock: 'Azioni', etf: 'ETF', crypto: 'Cripto', bond: 'Obbligazioni', cash: 'Liquidità' };
const TYPE_COLOR: Record<AssetType, string> = { stock: '#5b6ad0', etf: '#0e6b4f', crypto: '#d9822b', bond: '#2b8fb3', cash: '#8a8f87' };

const pct = (n: number) => `${n >= 0 ? '+' : ''}${(n * 100).toFixed(2).replace('.', ',')}%`;

/** Like parseAmount but allows any positive number of decimals (crypto quantities, prices). */
function parsePositive(s: string): number {
  const v = Number(s.trim().replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(v) && v > 0 ? v : NaN;
}

export function InvestmentsScreen() {
  const { data, dispatch } = useStore();
  const c = useColors();
  const cur = data.currency;
  const [sheet, setSheet] = useState(false);
  const [edit, setEdit] = useState<Holding | null>(null);
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [assetType, setAssetType] = useState<AssetType>('etf');
  const [qty, setQty] = useState('');
  const [avg, setAvg] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');

  const p = portfolioStats(data.holdings);
  const gainColor = (g: number) => (g >= 0 ? c.success : c.danger);

  const open = (h: Holding | null) => {
    setEdit(h);
    setSymbol(h?.symbol ?? '');
    setName(h?.name ?? '');
    setAssetType(h?.type ?? 'etf');
    setQty(h ? String(h.quantity).replace('.', ',') : '');
    setAvg(h ? String(h.avgPrice).replace('.', ',') : '');
    setPrice(h ? String(h.currentPrice).replace('.', ',') : '');
    setError('');
    setSheet(true);
  };

  const save = () => {
    const q = parsePositive(qty);
    const a = parsePositive(avg);
    const cp = price.trim() ? parsePositive(price) : a;
    if (!symbol.trim()) return setError('Inserisci un simbolo, ad esempio VWCE');
    if ([q, a, cp].some(Number.isNaN)) return setError('Quantità e prezzi devono essere numeri positivi');
    dispatch({
      type: 'upsertHolding',
      holding: { id: edit?.id ?? uid(), symbol: symbol.trim().toUpperCase(), name: name.trim(), type: assetType, quantity: q, avgPrice: a, currentPrice: cp },
    });
    setSheet(false);
  };

  return (
    <Screen title="Investimenti" right={<Button label="＋ Titolo" small onPress={() => open(null)} />}>
      <Card>
        <T size="sm" muted>Valore del portafoglio</T>
        <T size="display">{formatMoney(p.value, cur)}</T>
        <T color={gainColor(p.gain)}>{p.gain >= 0 ? '+' : ''}{formatMoney(p.gain, cur)} ({pct(p.gainPct)})</T>
        <T size="xs" muted>Investiti {formatMoney(p.cost, cur)}</T>
      </Card>

      {p.allocation.length > 0 && (
        <Card>
          <T size="lg">Allocazione</T>
          <View style={{ flexDirection: 'row', height: 14, borderRadius: radius.pill, overflow: 'hidden' }}>
            {p.allocation.map((x) => <View key={x.type} style={{ width: `${x.share * 100}%`, backgroundColor: TYPE_COLOR[x.type] }} />)}
          </View>
          {p.allocation.map((x) => (
            <Row key={x.type} style={{ justifyContent: 'space-between' }}>
              <Row style={{ gap: 8 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: TYPE_COLOR[x.type] }} />
                <T>{TYPE_LABEL[x.type]}</T>
              </Row>
              <T>{Math.round(x.share * 100)}%</T>
            </Row>
          ))}
        </Card>
      )}

      {data.holdings.length === 0 ? <Empty text="Aggiungi ETF, azioni o cripto che possiedi per seguire valore e rendimento." /> : data.holdings.map((h) => {
        const s = holdingStats(h);
        return (
          <Pressable key={h.id} onPress={() => open(h)} accessibilityRole="button">
            <Card>
              <Row>
                <View style={{ flex: 1 }}>
                  <T size="lg">{h.symbol}</T>
                  <T size="sm" muted numberOfLines={1}>{h.name || TYPE_LABEL[h.type]} · {h.quantity} × {formatMoney(h.currentPrice, cur)}</T>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <T style={{ fontWeight: '600' }}>{formatMoney(s.value, cur)}</T>
                  <T size="sm" color={gainColor(s.gain)}>{pct(s.gainPct)}</T>
                </View>
              </Row>
            </Card>
          </Pressable>
        );
      })}
      <T size="xs" muted>I prezzi si aggiornano a mano: tocca un titolo e modifica il prezzo attuale.</T>

      <Sheet visible={sheet} title={edit ? 'Modifica titolo' : 'Nuovo titolo'} onClose={() => setSheet(false)}>
        <Segmented value={assetType} onChange={setAssetType} options={[
          { value: 'etf', label: 'ETF' }, { value: 'stock', label: 'Azioni' }, { value: 'crypto', label: 'Cripto' }, { value: 'bond', label: 'Obblig.' },
        ]} />
        <Field label="Simbolo" value={symbol} onChangeText={setSymbol} autoCapitalize="characters" placeholder="Es. VWCE" maxLength={12} />
        <Field label="Nome (facoltativo)" value={name} onChangeText={setName} maxLength={40} />
        <Field label="Quantità" value={qty} onChangeText={setQty} keyboardType="decimal-pad" />
        <Field label="Prezzo medio di carico" value={avg} onChangeText={setAvg} keyboardType="decimal-pad" />
        <Field label="Prezzo attuale" value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="Uguale al prezzo di carico se vuoto" />
        {error ? <T size="sm" color={c.danger}>{error}</T> : null}
        <Button label="Salva" onPress={save} />
        {edit ? <Button label="Elimina" variant="danger" onPress={() => confirm('Eliminare questo titolo?', () => { dispatch({ type: 'deleteHolding', id: edit.id }); setSheet(false); })} /> : null}
      </Sheet>
    </Screen>
  );
}
