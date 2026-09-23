# LMR Terminology — full content

73 built-in terms in 10 sections. A term can appear in more than one section (e.g. Order Block is in PD arrays and Entry models).

## 1. Mechanics of the market fluctuations

_Chapter one of the LMR reference: what actually moves price before any array forms. Rates set the cost of money, bonds and yields reprice against it, and the ripple reaches the DXY and equity futures — read in that order, the macro tells you which side of the book to be on._

### Engine of Change

**What moves interest rates?**

Interest rates are the price of borrowing money. They move on shifts in the supply and demand for credit, driven by two forces. Central bank policy: institutions like the Federal Reserve or the RBA raise rates to cool high inflation and lower them to stimulate growth in a slowdown. Inflationary pressures: when prices rise too fast, lenders demand higher rates to protect the purchasing power of money they will be repaid in later. Rising rates are the cause of a hot economy with high spending — the central bank must brake by making borrowing expensive. Declining rates follow a cooling economy with rising unemployment or falling demand — the bank accelerates by making money cheaper so businesses expand.

### Bond Price vs Yield

**The core inverse relationship**

Bonds are fixed-income instruments whose value is dictated by the current rate environment. When rates rise, new bonds are issued with higher payments, so existing lower-coupon bonds become less valuable and their market price must fall to attract buyers. As the price falls, the yield — the actual percentage return for a new buyer — rises until it matches the new market rate. Bond futures are contracts on that price: if you expect rates to rise, you expect bond prices to fall, so you short bond futures. Rising rates → falling bond prices → bond futures decline. Falling rates → rising bond prices → bond futures rise.

### Yield Futures

**Tracking the rate directly**

Bond futures track the price of the bond; yield futures track the interest rate itself. Yield is the return earned on a bond and moves in the SAME direction as interest rates — the opposite of bond prices. If the market expects the central bank to hike, yield futures increase in value. Traders use them to bet directly on where rates will be in coming months without the complex pricing of physical bonds. Expected rate hikes → yield futures increase. Expected cuts → yield futures decrease.

### Treasury Futures

**T-Notes and T-Bonds by maturity**

Treasury futures are categorised by the length of the debt, and each maturity is sensitive to a different kind of news. T-Note futures, 2-year to 10-year, are most sensitive to immediate central bank policy: if the Fed signals a hike next month, T-Note prices fall and futures drop almost instantly. T-Bond futures, 20-year to 30-year, are more sensitive to long-term inflation expectations: if the market believes inflation will stay high for a decade, T-Bond prices drop significantly as investors demand higher long-term protection.

### The Global Ripple

**DXY and equity futures**

Rate changes act as a global signal for currency and stocks, creating a domino effect. U.S. Dollar Index: higher U.S. rates are a magnet for global capital — international investors buy dollars to access high-yielding U.S. assets, strengthening the DXY. As rates fall the magnet weakens, money moves abroad, and the dollar weakens. Equity futures: stocks generally fall when rates rise, because borrowing to grow becomes expensive and investors rotate out of risk into safe high-yielding bonds. Stocks generally rise when rates fall as borrowing costs drop, profits are expected to grow, and low bond yields force investors back into equities to find returns.

### Rising Rates Protocol

**The brake signal — expensive money**

When the central bank raises rates, usually to fight inflation, it creates a cycle of expensive money. Interest rate RISES — borrowing cost raised to slow inflation and overheating. Treasury note yield 2Y–10Y RISES — repricing higher to reflect tighter policy expectations. Bond price FALLS — existing lower-coupon bonds lose value as new bonds offer more. Bond yield RISES — falling prices mechanically increase yield for new buyers. Yield futures RISE — they track rates directly, so higher expectations lift them. T-Note and T-Bond futures FALL — futures track bond prices, which are declining. DXY RISES — higher yields attract global capital into USD assets. Equity futures FALL — higher financing costs reduce growth and risk appetite.

### Declining Rates Protocol

**The accelerator signal — cheap money**

When the central bank lowers rates, usually to boost a weak economy, it creates a cycle of cheap money. Interest rate FALLS — borrowing costs lowered to stimulate demand and investment. Treasury note yield 2Y–10Y FALLS — declining as markets price in easier policy. Bond price RISES — higher-coupon bonds become more valuable in a low-rate environment. Bond yield FALLS — rising prices reduce the effective yield for new buyers. Yield futures FALL — falling rate expectations reduce their price. T-Note and T-Bond futures RISE — futures rise as underlying bond prices increase. DXY FALLS — lower yields weaken USD demand relative to other currencies. Equity futures RISE — cheap capital encourages borrowing, expansion and risk-on behaviour.

### Why T-Note Yield Matters

**The market’s real-time vote on policy**

Treasury note yields are the market’s real-time vote on central bank policy, which is why ICT focuses on T-Note yields rather than generic bond yields. The 2Y yield reads immediate policy expectations. The 5Y and 10Y yields read the policy path plus growth expectations. The 30Y yield reads long-term inflation credibility. Read together they tell you what the market believes the central bank will actually do, ahead of the announcement.

### DXY / Yield SMT

**Front-running equity futures**

Watch for SMT between the DXY and yields. If one makes a higher high while the other fails to confirm, it signals a potential reversal in the correlation. Because both feed into equity valuation through the same rate channel, that divergence can front-run moves in equity futures — the correlation breaking is the tell, before price in the index confirms it.

## 2. Market maker models

_How the algorithm delivers a whole move — the phases and the bias behind them._

### AMD

**Accumulation · Manipulation · Distribution**

The three-phase cycle underneath every market maker model. Accumulation builds the position sideways, manipulation raids the opposite side to fill it, distribution delivers to the draw. Name the phase you are in before naming the setup — the same array means different things in each.

### MMBM

**Market Maker Buy Model**

Accumulation below an old low, manipulation through it to engineer sell-side liquidity, then distribution to the buy side. The model only counts when all three phases are visible on the timeframe you traded.

### MMSM

**Market Maker Sell Model**

The mirror of MMBM: accumulation above an old high, manipulation up through it to engineer buy-side liquidity, then distribution down. Look for the same three phases before calling it.

### Power of 3

**Open · manipulation · expansion**

Every candle on every timeframe opens, manipulates against the intended direction, then expands. On a bullish day the open is near the high of the manipulation leg, not the low of the range.

### Judas Swing

**False open move**

The first move after an open runs the wrong way to trap early entries, then reverses into the true direction. Most visible at the London and New York opens.

### SMT

**Smart Money Technique**

Divergence between correlated indices. NQ makes the low, ES confirms, YM fails — the failure is the tell that the low is real.

### Premium

**Above equilibrium**

The upper half of the dealing range. You only sell here — buying at a premium means paying above the range midpoint and giving the algorithm room to reprice against you.

### Discount

**Below equilibrium**

The lower half of the dealing range. You only buy here — the discount is where the market maker accumulates before repricing to premium.

## 3. Named & time assets

_The sessions and windows the day is divided into, each with its own behaviour._

### Asian Open

**20:00–22:00 ET**

The Asian session opens and builds the overnight range. Low volume, tight delivery — its high and low become the range London manipulates through.

### Midnight Open

**00:00 ET**

The true day open. Price above it puts the session in premium, below it in discount — the single most useful reference for whether the day is bullish or bearish.

### London Open

**01:30–02:00 ET**

The London open expansion. Usually delivers the Judas leg against the daily bias before turning — the first real displacement of the day.

### London Kill-zone

**02:00–05:00 ET**

The London killzone. Where the session high or low most often forms, and where the FVG that New York later respects gets left behind.

### NY Pre-market

**07:00–09:30 ET**

Pre-market positioning into the cash open. Sets up the RTH gap and often runs the overnight extremes before 09:30.

### NY AM Session

**09:30–11:00 ET**

The highest-probability window of the day. The RTH open, the 09:30 purge, and the AM Silver Bullet all sit inside it.

### NY Lunch

**11:30–13:30 ET**

Lunch-hour consolidation. Delivery slows and ranges tighten — the arrays formed here are for the PM session, not for trading during it.

### NY PM Session

**13:30–16:00 ET**

The afternoon drive. Either continues the AM direction or reverses it — the PM Silver Bullet and the final-hour run both live here.

### Final Hour

**16:00–17:00 ET**

The last hour before the close. Positions get squared and the close prints, which sets the daily candle and the next day’s reference.

## 4. PD arrays

_Premium and discount arrays — the price levels the algorithm leaves behind and returns to._

### Order Block

**Last opposing candle**

The final down-close candle before an up-move (or up-close before a down-move). Valid only when the move away from it displaced and left an imbalance.

### Rejection Block

**Wick-based array**

Built from the wicks, not the bodies — a cluster of failed highs or lows where price was rejected. Trades as a level when price returns to the wick zone with displacement behind it.

### Propulsion Block

**Order block on an order block**

Price returns to an existing order block and forms a new one inside its upper or lower half. The nested block propels the next leg — a continuation array, not a reversal one.

### Breaker Block

**Failed order block**

An order block that price traded fully through. On the retest from the other side it flips polarity — the failure is what makes it tradeable.

### Mitigation Block

**Loss-mitigation array**

Formed where a prior position was underwater: price returns to the origin of the failed leg to mitigate before continuing in the original direction.

### Suspension Block

**Consolidation array**

A tight band where price suspends before continuing. Not an entry on its own — it marks where the algorithm paused, and its edges become reference on the return.

### FVG

**Fair Value Gap**

A three-candle imbalance left behind by a displacement leg. Price returns to rebalance it — the entry is the first touch of the gap in the direction of the higher-timeframe draw.

### IFVG

**Inversion Fair Value Gap**

An FVG that price closed decisively through. It inverts — a bullish gap becomes resistance, a bearish gap becomes support, on the retest.

### Reclaimed FVG

**Gap retaken in the original direction**

An FVG price traded through and then reclaimed — the close back inside restores it as a valid array. The reclaim is the confirmation; the retest of the reclaimed edge is the entry.

### BISI

**Buyside Imbalance · Sellside Inefficiency**

An up-side gap: buying pressure left inefficiency below. Treated as a discount array — support on the first revisit while the draw stays higher.

### SIBI

**Sellside Imbalance · Buyside Inefficiency**

The inverse of BISI: a down-side gap leaving inefficiency above. A premium array — resistance on the first revisit while the draw stays lower.

## 5. Entry models

_The same arrays read as triggers: what has to happen before you click._

### Turtle Soup

**Failed breakout**

A run past an obvious old high or low that immediately fails and closes back inside. The stops above the level were the liquidity the move was after.

### Rejection Block

**Wick-based array**

Built from the wicks, not the bodies — a cluster of failed highs or lows where price was rejected. Trades as a level when price returns to the wick zone with displacement behind it.

### Order Block

**Last opposing candle**

The final down-close candle before an up-move (or up-close before a down-move). Valid only when the move away from it displaced and left an imbalance.

### IFVG

**Inversion Fair Value Gap**

An FVG that price closed decisively through. It inverts — a bullish gap becomes resistance, a bearish gap becomes support, on the retest.

### FVG

**Fair Value Gap**

A three-candle imbalance left behind by a displacement leg. Price returns to rebalance it — the entry is the first touch of the gap in the direction of the higher-timeframe draw.

### Suspension Block

**Consolidation array**

A tight band where price suspends before continuing. Not an entry on its own — it marks where the algorithm paused, and its edges become reference on the return.

### Breaker Block

**Failed order block**

An order block that price traded fully through. On the retest from the other side it flips polarity — the failure is what makes it tradeable.

### Mitigation Block

**Loss-mitigation array**

Formed where a prior position was underwater: price returns to the origin of the failed leg to mitigate before continuing in the original direction.

### Reclaimed FVG

**Gap retaken in the original direction**

An FVG price traded through and then reclaimed — the close back inside restores it as a valid array. The reclaim is the confirmation; the retest of the reclaimed edge is the entry.

### OTE

**Optimal Trade Entry**

The 62–79% retracement of a displacement leg. Deepest discount that still respects the leg, usually taken at the 70.5% level with the FVG confluent.

## 6. Time-based entry

_Setups defined by the clock rather than the level — the window is the edge._

### 18:00 Opening Price

**Futures session open**

Where the new futures day actually begins. Price relative to the 18:00 open frames the whole overnight session, and the gap it leaves against the 16:00 close is the NDOG.

### Midnight Open

**00:00 ET**

The true day open. Price above it puts the session in premium, below it in discount — the single most useful reference for whether the day is bullish or bearish.

### London Silver Bullet

**03:00–04:00 ET**

The London window. Runs into the London open expansion, so the displacement is often steeper and the gap smaller — size accordingly.

### AM Silver Bullet

**10:00–11:00 ET**

The New York AM window. Requires a displacement leg into the hour and an FVG left behind. Strongest of the three — it runs with the RTH open still in play.

### PM Silver Bullet

**14:00–15:00 ET**

The afternoon window. Same rules as the AM setup, but the draw is usually the session extreme rather than a new one — takes what the morning left unfinished.

## 7. Draws / run on liquidity

_Where price is being delivered to, and the stops it raids on the way._

### Equal H/L

**Equal highs and lows**

Two or more highs or lows sitting at the same price. The flat edge is where stops pool, which makes it the cleanest draw on the chart — price reaches for it before reversing or continuing.

### 3-Day High / Low

**Three-session extremes**

The highest high and lowest low of the last three sessions. Short-term liquidity pools that the algorithm reaches for before committing to the weekly draw — a 3-day low taken in a bullish week is the setup, not the warning.

### LRLR

**Low Resistance Liquidity Run**

A clean path with no arrays in the way — price runs freely to the draw. Low resistance means little to slow delivery, so the move is fast and the target is the pooled liquidity at the end of it.

### HRLR

**High Resistance Liquidity Run**

The opposite of LRLR: the path to the draw is littered with arrays and old levels, so delivery is slow and choppy. Trading into high resistance is how a good idea still loses.

### 1st Presented FVG

**First gap after the open**

The first fair value gap presented after the session open. Taken on its first touch, in line with the higher-timeframe draw, before any later gap in the same leg.

### NWOG

**New Week Opening Gap**

The gap between Friday’s 16:00 close and Sunday’s 18:00 open. Its upper edge, lower edge and midpoint act as reference all week.

### NDOG

**New Day Opening Gap**

The same idea daily: the gap between the 16:00 close and the 18:00 open. A short-term array that most often gets rebalanced inside the session.

### ERL / IRL

**External · Internal Range Liquidity**

ERL is the old high or low; IRL is the arrays inside the range (FVGs, order blocks). Delivery alternates between them — ERL to IRL, then IRL back to ERL.

## 8. LMR macro times

_The named :50–:10 windows the day is tracked by, from the Asian open through to the close. Each trade carries the macro it was taken in, so the log can grade the windows as well as the models._

### ASIAN 1

**20:50 – 21:10 ET (8:50 – 9:10 PM)**

First Asian macro, shortly after the 20:00 open. Where the Asian range starts being built — the raid here usually defines one edge of the range London later manipulates.

### ASIAN 2

**21:50 – 22:10 ET (9:50 – 10:10 PM)**

Second Asian macro, closing the session. Completes the Asian range: the high and low set across these two windows are the levels the London open trades away from.

### LONDON 1

**01:30 – 02:00 ET**

The London open macro. Price is repriced away from the Asian range before the session proper — the first raid of the day and the one that sets London’s direction.

### LONDON 2

**02:50 – 03:10 ET**

Mid-session London macro. Continuation window: it extends the leg London 1 established rather than starting a new one.

### LONDON 3

**04:30 – 05:00 ET**

The London close macro. Positions are unwound into the close, which often reverses the session leg and leaves the high or low of the London range.

### NY AM

**08:50 – 09:10 ET**

Pre-open macro, before the cash open. Sets the opening imbalance and frequently prints the level the 09:30 open then trades away from.

### NY AM1

**09:50 – 10:10 ET**

First post-open macro. The 09:30 push is either confirmed or reversed here — the highest-probability AM window when the daily bias is clear.

### NY AM2

**10:50 – 11:10 ET**

Second AM macro, overlapping the Silver Bullet hour. Late continuation or the AM session’s final raid before lunch.

### LUNCH

**11:50 – 12:10 ET**

Lunch macro. Thin liquidity, so moves are sharp but rarely hold — treat it as a rebalancing window, not a trend one.

### PM

**13:50 – 14:10 ET**

The PM session macro. Where the afternoon leg begins, typically delivering toward the level the AM session left unfinished.

### CLOSE

**15:15 – 15:45 ET**

Closing macro. The last real repricing window — algorithmic delivery into the settlement, often the day’s cleanest expansion.

### FINAL

**15:50 – 16:00 ET**

The final ten minutes. Settlement print only: positioning and imbalance, not a window to enter on.

## 9. Gaps

_Price left untraded between one session’s close and the next one’s open. Nothing changed hands inside the gap, so its upper edge, lower edge and midpoint stay live as reference until price returns and rebalances them._

### NWOG

**New Week Opening Gap**

The gap between Friday’s 16:00 close and Sunday’s 18:00 open. Its upper edge, lower edge and midpoint act as reference all week.

### NDOG

**New Day Opening Gap**

The same idea daily: the gap between the 16:00 close and the 18:00 open. A short-term array that most often gets rebalanced inside the session.

### RTH

**Regular Trading Hours**

The 09:30–16:00 ET cash session. Its open, high, low and close form their own dealing range, and the RTH gap against the overnight session is where the delivery profile is read.

## 10. Range & levels

_Subdivisions and projections of a dealing range — where inside it price is trading, and where it goes once the range breaks._

### Equilibrium

**50% of the dealing range**

The midpoint that splits premium from discount. Above it you are buying at a premium; below it you are selling at a discount.

### Premium

**Above equilibrium**

The upper half of the dealing range. You only sell here — buying at a premium means paying above the range midpoint and giving the algorithm room to reprice against you.

### Discount

**Below equilibrium**

The lower half of the dealing range. You only buy here — the discount is where the market maker accumulates before repricing to premium.

### OTE

**Optimal Trade Entry**

The 62–79% retracement of a displacement leg. Deepest discount that still respects the leg, usually taken at the 70.5% level with the FVG confluent.

### Consequent Encroachment

**Midpoint of a gap or wick**

The 50% of an FVG, order block or wick — the level inside the array where price most often turns. When a gap only fills halfway, this is the line it respected.

### Quadrant Levels

**Range split into quarters**

The dealing range split into quarters. The 25% and 75% quadrants are where retracements stall inside premium and discount, and the quadrant a candle opens in tells you which half the algorithm is working.

### Octants Levels

**Range split into eighths**

The dealing range divided into eight — 12.5%, 25%, 37.5%, 50%, 62.5%, 75%, 87.5%. Finer than quadrants, and useful when price is delivering inside a tight range where the 0.5 does not give enough resolution.

### Hexadecant Levels

**Range split into sixteenths**

The dealing range divided into sixteen — 6.25% increments. The finest subdivision in use: reach for it when price is delivering in a compressed range and the octants are too wide to read.

### Protraction Range

**Fib 2 – 2.5 and 4.5 – 5 of the manipulation leg**

Measure the manipulation leg and project it: the 2 – 2.5 band is where the first protraction exhausts, the 4.5 – 5 band where an extended one does. Price runs past the obvious level into these zones before the real leg begins — the raid is the point, so treat them as where the manipulation ends, not as targets.

### Range Projection

**0.5 levels beyond the range**

Once a range is taken, project it in 0.5 increments from the breach — 0.5, 1.0, 1.5, 2.0 of the original leg. Standard deviation targets for where expansion terminates.

### RTH −0.5 Levels

**Half-range projections off RTH**

The RTH range projected in 0.5 increments below its low and above its high — −0.5, −1.0, +0.5, +1.0. Where the cash session terminates once it trades outside its own range.

### OHLC

**Open · High · Low · Close**

The four prices that define any candle. Which of the high or low forms first is the read — a bullish day tends to set the low before the high.
