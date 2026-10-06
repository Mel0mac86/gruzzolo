import React from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput,
  TextInputProps, View, ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, space, type, useColors } from '../theme';

export function Screen({ title, right, children }: {
  title: string; right?: React.ReactNode; children: React.ReactNode;
}) {
  const c = useColors();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={styles.header}>
        <Text style={[type.xl, { color: c.text }]} accessibilityRole="header">{title}</Text>
        {right}
      </View>
      <ScrollView contentContainerStyle={{ padding: space[4], paddingBottom: space[8], gap: space[4] }}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const c = useColors();
  return (
    <View style={[{ backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: radius.lg, padding: space[4], gap: space[3] }, style]}>
      {children}
    </View>
  );
}

export function T({ children, size = 'base', muted, color, style, numberOfLines, selectable }: {
  children: React.ReactNode; size?: keyof typeof type; muted?: boolean; color?: string;
  style?: object; numberOfLines?: number; selectable?: boolean;
}) {
  const c = useColors();
  return (
    <Text selectable={selectable} numberOfLines={numberOfLines} style={[type[size], { color: color ?? (muted ? c.textMuted : c.text) }, style]}>
      {children}
    </Text>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: space[3] }, style]}>{children}</View>;
}

export function Button({ label, onPress, variant = 'primary', small }: {
  label: string; onPress: () => void; variant?: 'primary' | 'ghost' | 'danger'; small?: boolean;
}) {
  const c = useColors();
  const bg = variant === 'primary' ? c.accent : 'transparent';
  const fg = variant === 'primary' ? c.onAccent : variant === 'danger' ? c.danger : c.accent;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: bg, opacity: pressed ? 0.7 : 1, borderRadius: radius.pill,
        paddingVertical: small ? space[1] + 2 : space[3], paddingHorizontal: small ? space[3] : space[5],
        borderWidth: variant === 'primary' ? 0 : 1, borderColor: variant === 'danger' ? c.danger : c.accent,
        alignItems: 'center',
      })}
    >
      <Text style={[small ? type.sm : type.base, { color: fg, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

export function Progress({ ratio, color }: { ratio: number; color?: string }) {
  const c = useColors();
  const pct = Math.max(0, Math.min(ratio, 1)) * 100;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
      style={{ height: 8, borderRadius: radius.pill, backgroundColor: c.track, overflow: 'hidden' }}
    >
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color ?? c.accent, borderRadius: radius.pill }} />
    </View>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const c = useColors();
  return (
    <View style={{ gap: space[1] }}>
      <T size="xs" muted>{label}</T>
      <TextInput
        placeholderTextColor={c.textMuted}
        accessibilityLabel={label}
        {...props}
        style={[type.base, {
          color: c.text, borderColor: c.borderInput, borderWidth: 1, borderRadius: radius.md,
          paddingHorizontal: space[3], paddingVertical: space[2] + 2, backgroundColor: c.surface,
        }]}
      />
    </View>
  );
}

export function Chip({ label, selected, onPress, color }: {
  label: string; selected?: boolean; onPress: () => void; color?: string;
}) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        borderRadius: radius.pill, paddingVertical: space[1] + 2, paddingHorizontal: space[3],
        borderWidth: 1, borderColor: selected ? (color ?? c.accent) : c.border,
        backgroundColor: selected ? (color ?? c.accent) : c.surface,
      }}
    >
      <Text style={[type.sm, { color: selected ? '#ffffff' : c.text, fontWeight: selected ? '600' : '400' }]}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<V extends string>({ value, options, onChange }: {
  value: V; options: { value: V; label: string }[]; onChange: (v: V) => void;
}) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.track, borderRadius: radius.pill, padding: 3 }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={{ flex: 1, paddingVertical: space[2], borderRadius: radius.pill, alignItems: 'center', backgroundColor: on ? c.surface : 'transparent' }}
          >
            <Text style={[type.sm, { color: on ? c.text : c.textMuted, fontWeight: on ? '600' : '400' }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Sheet({ visible, title, onClose, children }: {
  visible: boolean; title: string; onClose: () => void; children: React.ReactNode;
}) {
  const c = useColors();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} transparent={Platform.OS === 'web'}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={[styles.header, { borderBottomWidth: 1, borderColor: c.border }]}>
          <T size="lg">{title}</T>
          <Button label="Chiudi" variant="ghost" small onPress={onClose} />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: space[4], gap: space[4], paddingBottom: space[8] }}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: space[6] }}>
      <T muted style={{ textAlign: 'center' }}>{text}</T>
    </Card>
  );
}

export function MonthSwitcher({ label, onPrev, onNext }: { label: string; onPrev: () => void; onNext: () => void }) {
  const c = useColors();
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      <Pressable accessibilityLabel="Mese precedente" onPress={onPrev} hitSlop={12}>
        <Text style={[type.lg, { color: c.accent }]}>‹</Text>
      </Pressable>
      <T size="base" style={{ fontWeight: '600' }}>{label}</T>
      <Pressable accessibilityLabel="Mese successivo" onPress={onNext} hitSlop={12}>
        <Text style={[type.lg, { color: c.accent }]}>›</Text>
      </Pressable>
    </Row>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: space[4], paddingTop: space[3], paddingBottom: space[2],
  },
});
