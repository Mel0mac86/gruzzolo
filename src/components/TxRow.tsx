import React from 'react';
import { Pressable, View } from 'react-native';
import { fallbackCategory, formatMoney } from '../logic';
import { useStore } from '../store';
import { radius, useColors } from '../theme';
import type { Transaction } from '../types';
import { Row, T } from './ui';

export function TxRow({ tx, onPress }: { tx: Transaction; onPress: () => void }) {
  const { data } = useStore();
  const c = useColors();
  const cat = data.categories.find((x) => x.id === tx.categoryId) ?? fallbackCategory(tx.categoryId);
  const sign = tx.type === 'income' ? '+' : '−';
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${cat.name} ${sign}${formatMoney(tx.amount, data.currency)}`}>
      <Row style={{ paddingVertical: 6 }}>
        <View style={{ width: 38, height: 38, borderRadius: radius.md, backgroundColor: cat.color + '22', alignItems: 'center', justifyContent: 'center' }}>
          <T>{cat.icon}</T>
        </View>
        <View style={{ flex: 1 }}>
          <T numberOfLines={1}>{tx.note || cat.name}</T>
          <T size="xs" muted>{cat.name}</T>
        </View>
        <T style={{ fontWeight: '600' }} color={tx.type === 'income' ? c.success : c.text}>
          {sign}{formatMoney(tx.amount, data.currency)}
        </T>
      </Row>
    </Pressable>
  );
}
