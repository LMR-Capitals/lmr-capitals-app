# LMR Capitals — TradingView Indicators (Pine Script v6)

## LMR — Monthly Key Reference (`LMR_Monthly_Key_Reference.pine`)

A single indicator that **floats on the right edge of the chart** (as a panel,
not on the price scale) and lists the key higher-timeframe reference points at a
glance:

| Section | What it shows |
| --- | --- |
| **Last 3 months** | Month name + **High · Low · Open · Close/Settle · EQ** for each of the 3 most recent *completed* months |
| **Prev Month EQ** | The previous month's equilibrium `(High + Low) / 2`, highlighted in gold |
| **Last 3 weeks (PW)** | **High · Low · Open · Close/Settle · EQ** for each of the 3 most recent *completed* weeks |

### Notes
- **Settle = Close.** On TradingView data a period's settlement is its official
  close, so Close and Settle are the same number — they are **merged** into one
  `Settle` column.
- **Pin-point accurate & non-repainting.** Values are read with
  `request.security(..., lookahead = barmerge.lookahead_off)` using
  completed-bar offsets (`[1]`, `[2]`, `[3]`), and prices are formatted to the
  instrument's tick size (`format.mintick`).
- **Works on every chart timeframe from 1 second up to 1 Month.**
- Up/down close is color-coded; highs are green, lows are red.

### Install
1. Open **TradingView → Pine Editor**.
2. Paste the contents of `LMR_Monthly_Key_Reference.pine`.
3. **Add to chart.**

### Settings
- **Panel position** — Top / Middle / Bottom Right.
- **Text size**, colors, and an optional toggle to hide the weekly (PW) section.
