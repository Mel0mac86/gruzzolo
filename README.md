# Gruzzolo

App di finanza personale per iPhone (Expo + React Native + TypeScript), costruita con il metodo
delle skill [replica-skill](https://github.com/Jakeschincariol/replica-skill).

Quattro aree in un'unica app, tutti i dati restano sul telefono:

- **Budget e spese**: movimenti con categorie, saldo del mese, spese per categoria, budget mensili con avvisi all'80% e al 100%
- **Abbonamenti**: costo mensile e annuale, rinnovi dei prossimi 7 giorni, pausa
- **Obiettivi di risparmio**: versamenti e prelievi, quanto mettere da parte al mese per arrivare in tempo
- **Investimenti**: valore del portafoglio, guadagno/perdita, allocazione per tipo, prezzi aggiornati a mano

## Provarla sul tuo iPhone (senza Mac)

1. Installa **Node.js 20+** sul computer e l'app **Expo Go** dall'App Store sull'iPhone.
2. Nella cartella del progetto:
   ```bash
   npm install
   npx expo start
   ```
3. Inquadra il QR code con la fotocamera dell'iPhone (computer e telefono sulla stessa rete Wi-Fi).

Al primo avvio l'app mostra dati di esempio; da Impostazioni (⚙️) puoi cancellarli.

## Comandi

```bash
npm test            # 13 test sulla logica finanziaria
npm run typecheck   # TypeScript
npx expo start --web
```

## Pubblicarla sull'App Store

Serve un account Apple Developer (99 $/anno) creato da te. Poi:
```bash
npm i -g eas-cli && eas build -p ios && eas submit -p ios
```
Cambia `ios.bundleIdentifier` in `app.json` con un identificativo tuo.

## Cartella replica/

Output delle skill: `recon.md`, `features.csv`, `architecture.md`, `design/tokens*.json`,
`parity.md` (91,3/100, tutte le 14 funzioni essenziali fatte), `brand.json`.

Prossimi passi (fase 2): Face ID, notifiche per i rinnovi, prezzi di mercato in tempo reale, sincronizzazione cloud.
