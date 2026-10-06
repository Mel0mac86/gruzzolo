import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BudgetScreen } from './src/screens/BudgetScreen';
import { GoalsScreen } from './src/screens/GoalsScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { InvestmentsScreen } from './src/screens/InvestmentsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SubscriptionsScreen } from './src/screens/SubscriptionsScreen';
import { TransactionsScreen } from './src/screens/TransactionsScreen';
import { StoreProvider, useStore } from './src/store';
import { useColors } from './src/theme';

const TABS = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'tx', label: 'Movimenti', icon: '📒' },
  { key: 'budget', label: 'Budget', icon: '🎯' },
  { key: 'subs', label: 'Abbonam.', icon: '🔁' },
  { key: 'goals', label: 'Obiettivi', icon: '🐷' },
  { key: 'invest', label: 'Investim.', icon: '📈' },
] as const;

type Tab = (typeof TABS)[number]['key'];

function Main() {
  const { ready } = useStore();
  const c = useColors();
  const [tab, setTab] = useState<Tab>('home');
  const [settings, setSettings] = useState(false);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  let screen: React.ReactNode;
  if (settings) screen = <SettingsScreen onBack={() => setSettings(false)} />;
  else if (tab === 'home') screen = <HomeScreen onOpenSettings={() => setSettings(true)} onGo={(t) => setTab(t as Tab)} />;
  else if (tab === 'tx') screen = <TransactionsScreen />;
  else if (tab === 'budget') screen = <BudgetScreen />;
  else if (tab === 'subs') screen = <SubscriptionsScreen />;
  else if (tab === 'goals') screen = <GoalsScreen />;
  else screen = <InvestmentsScreen />;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flex: 1 }}>{screen}</View>
      <SafeAreaView edges={['bottom']} style={{ backgroundColor: c.surface, borderTopWidth: 1, borderColor: c.border }}>
        <View style={{ flexDirection: 'row' }} accessibilityRole="tablist">
          {TABS.map((t) => {
            const on = t.key === tab && !settings;
            return (
              <Pressable
                key={t.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={t.label}
                onPress={() => { setSettings(false); setTab(t.key); }}
                style={{ flex: 1, alignItems: 'center', paddingTop: 8, paddingBottom: 6 }}
              >
                <Text style={{ fontSize: 20, opacity: on ? 1 : 0.55 }}>{t.icon}</Text>
                <Text style={{ fontSize: 10, marginTop: 2, color: on ? c.accent : c.textMuted, fontWeight: on ? '700' : '500' }}>{t.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="auto" />
        <Main />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
