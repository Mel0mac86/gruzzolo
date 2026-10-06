# Architecture

| layer | choice | why |
| --- | --- | --- |
| mobile | Expo SDK 57 + React Native + TypeScript | Runs on iPhone through Expo Go with no Mac; same code builds for the App Store via EAS |
| state | React context + useReducer | Small app, one store, no extra library |
| storage | AsyncStorage (JSON, one key, versioned) | Data stays on the phone; private by default |
| navigation | Custom bottom tab bar | Six tabs, no deep links needed yet |
| charts | Plain Views (bars and stacked bar) | No native chart dependency, works in Expo Go and web |
| tests | Node test runner on the pure logic in src/logic.ts | Money math is where bugs hurt |

Build order: storage + transactions (F01) first, then dashboard, budget,
subscriptions, goals, investments, settings.

Phase 2 (replica-backend): Supabase auth + Postgres for sync, Face ID,
renewal notifications, a market data API with the user's own key.
