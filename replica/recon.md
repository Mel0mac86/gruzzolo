# Recon map: personal finance apps (category level)

Melo asked for one iPhone app that covers all four areas: budget and expenses,
subscriptions, savings goals and investments. Instead of cloning one product,
this map captures the patterns shared by the most common apps in the category
(budget trackers, subscription trackers, savings goal apps, portfolio trackers).
Only functions and UX patterns; no code, copy, logos or assets from any app.

## Screens
| id | screen | purpose |
| --- | --- | --- |
| S01 | Home | Balance of the month, income vs expenses, top categories, upcoming renewals, budget alerts |
| S02 | Movements | Transactions grouped by day, search, filter income/expense |
| S03 | Add/edit transaction | Sheet: amount keypad, type, category grid, date, note |
| S04 | Budget | Per-category monthly limits with progress |
| S05 | Subscriptions | Active list, monthly/yearly total, next renewals |
| S06 | Goals | Goal cards with progress, deposit action, suggested monthly saving |
| S07 | Investments | Portfolio value, P/L, allocation, holdings list |
| S08 | Settings | Currency, export, reset, sample data |

## Flows
- F01 Add an expense from Home in under 5 taps
- F02 Set a budget for a category and see it fill as expenses come in
- F03 Add a subscription and see its yearly cost and next renewal
- F04 Create a goal, deposit money, see progress and the monthly suggestion
- F05 Add a holding, update its price, see gain/loss and allocation
- F06 Change month on Home and Budget
- F07 Export or reset data

## Data model
- Transaction(id, type income|expense, amount, categoryId, date, note)
- Category(id, name, icon, color, kind)
- Budget(categoryId, monthlyLimit)
- Subscription(id, name, amount, cycle weekly|monthly|yearly, nextDate, categoryId, active)
- Goal(id, name, target, saved, deadline?, emoji)
- Holding(id, symbol, name, type stock|etf|crypto|bond|cash, quantity, avgPrice, currentPrice)
- Settings(currency)

## Out of scope for v1
Bank sync (needs a licensed PSD2 provider), live prices (needs an API key), cloud sync.
