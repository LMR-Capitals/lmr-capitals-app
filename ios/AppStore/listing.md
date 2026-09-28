# App Store listing — LMR Capitals

Copy-paste source for App Store Connect. Character limits are Apple's.

## App information

| Field | Value |
|---|---|
| Name (30) | LMR Capitals |
| Subtitle (30) | The Chain · Trading Journal |
| Bundle ID | com.lmrcapitals.app |
| Primary category | Finance |
| Secondary category | Productivity |
| Age rating | 4+ — answer "None" to every content question (no real-money trading happens in the app) |
| Privacy Policy URL | https://lmrcapitals.com/privacy |
| Support URL | https://lmrcapitals.com/support |
| Marketing URL | https://lmrcapitals.com |
| Copyright | 2026 LMR Capitals Pty. Ltd. |

## Promotional text (170)

Trade with a system. Plan every session with The Chain — Monthly → Weekly → Daily → Session → Trade — and review it all in one journal, synced live across your devices.

## Description (4000)

LMR Capitals is the trading journal built around The Chain — the structured Monthly → Weekly → Daily → Session → Trade methodology used to trade NQ, ES and YM futures.

PLAN WITH THE CHAIN
• Monthly and weekly context: bias, market profile, key levels and draws on liquidity
• Daily plan: bias, higher-timeframe points of interest, session profile and PD arrays
• Session profiling for London and New York

JOURNAL EVERY TRADE
• Log trades with model, session, confirmations, emotions, grade and chart screenshots
• Track multiple prop-firm and personal accounts, deposits, fees and payouts
• Calendar, daily heatmap, equity curve and drawdown at a glance

METHODOLOGY · PSYCHOLOGY · OBSERVATION
• Methodology: the full LMR terminology and PD-array reference
• Psychology: score each session against your own rules
• Observation: capture market notes, setups and confluences with charts

LIVE SYNC
Sign in on iPhone, iPad and Mac — every change appears on your other devices in seconds.

PERFORMANCE & REVIEWS
• Performance by model, session, day and month
• Optional AI Coach and weekly reviews using your own Claude API key

Subscriptions include a 7-day free trial.

LMR Capitals is a journaling and education tool. It does not place trades or give financial advice. Trading futures involves substantial risk of loss.

## Keywords (100, comma-separated, no spaces needed)

trading journal,futures,NQ,ES,YM,ICT,prop firm,day trading,trade log,PD arrays,forex,journal,chain

## What's New (first version)

First release of LMR Capitals for iPhone, iPad and Mac.

## Screenshots

Required: iPhone 6.9" (1320 × 2868) and iPad 13" (2064 × 2752).
`screenshots/` has the sign-in / The Chain screen in both sizes. Add 3–5 more
of the signed-in app (Dashboard, Today / The Chain, Trades, Performance,
Psychology) — take them on a device or simulator at those sizes, or send them
to be framed.

## App Privacy ("nutrition label")

Tracking: **No** (no data is used to track users across apps/websites).

Data collected — all **linked to the user**, used for **App Functionality**, not for tracking:

| Category | Type |
|---|---|
| Contact Info | Email Address |
| User Content | Photos or Videos (attached charts/receipts), Other User Content (journal entries) |
| Identifiers | User ID |
| Purchases | Purchase History (subscription status) |

## App Review information

- **Demo account** (required — the app is sign-in only): create a dedicated
  reviewer account, grant it free access in the admin portal (Users & Access →
  comp access) so it skips the paywall, add some sample trades, and put the
  email/password here.
- Notes for the reviewer:
  > LMR Capitals is a trading journal. Sign in with the demo account above.
  > Journal data syncs live between devices via our backend. The app does not
  > execute trades or handle real money.

## Before submitting — open items

1. **In-app account deletion** (App Store Review Guideline 5.1.1(v)): apps that
   let users create an account must let them delete it from within the app.
   Today deletion is by email only (see /support). Needs a "Delete account"
   button in Settings backed by a server-side function.
2. **Subscriptions bought outside the app** (Guideline 3.1.1): the paywall
   sends users to Stripe checkout. Apple may require In-App Purchase for
   digital subscriptions, or allow an external link only in some regions
   (e.g. the US). Decide: add IAP, or hide purchasing in the iOS app
   ("reader"-style: sign in with an existing subscription only).
3. **Password-reset email template**: add `{{ .Token }}` to Supabase →
   Authentication → Email Templates → Reset Password.
