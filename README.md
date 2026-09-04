# MarketPulse — Smart Market Watchlist

> **“Know what changed. Know what matters.”**  
> Built for the **Code, by Groww 2026** Engineering Challenge.

---

## 1. Executive Summary & Core Problem

Traditional stock watchlists treat market data uniformly—presenting users with green and red percentage blinks across dozens of tickers. When an active investor or retail trader opens their app after 3 hours away, they are forced to mentally scan every quote, calculate relative moves from where they last left off, check sector benchmarks, and search filings to figure out: **"Did anything meaningful actually happen?"**

**MarketPulse** solves this fundamental cognitive load problem. 

Instead of demanding continuous human surveillance, MarketPulse introduces:
1. **The Snapshot System**: Records market baselines at distinct user visits or checkpoints.
2. **The Meaningful Change Engine**: A multi-factor quantitative heuristic engine that calculates a composite **0–100 Change Score** factoring price velocity, institutional volume abnormalities, sector decoupling, index beta, intraday volatility, and corporate disclosures.
3. **"Why This Matters" Explanations**: Plain-English narratives explaining the exact numerical triggers (e.g., *"Reliance fell 3.2%, above your 2.0% threshold, while volume is 1.85× its 20-day baseline"*).
4. **Dual-Feed Arbitration & Data Resilience**: Handles stale feeds, network timeouts, and conflicting cross-exchange data gracefully.
5. **AI Executive Briefing**: Grounded Gemini 3.8 Flash intelligence summaries that only process verified backend JSON facts and fall back to deterministic templates when offline.

---

## 2. Architecture Overview

MarketPulse is architected as a layered, resilient full-stack system:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        REACT + TAILWIND FRONTEND                       │
│  - Dashboard & Hero Section (Snapshot comparison metrics)              │
│  - What Changed Timeline / Feed (Sorted by Attention Score)            │
│  - Interactive SVG Charts (1D, 1W, 1M, 1Y crosshairs + Volume bars)    │
│  - Meaningful Change Factor Scorecards                                 │
│  - Watchlist Portfolio Management (Multi-list, reordering, search)     │
│  - Judge Demo Walkthrough Controller & Simulation Panel                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST (/api/*)
┌───────────────────────────────────▼────────────────────────────────────┐
│                       EXPRESS BACKEND SERVER                           │
│  - API Router (/api/watchlists, /api/changes, /api/snapshots, etc.)    │
│  - Gemini AI Fact-Grounded Executive Briefing Service                  │
└──────────────────┬───────────────────────────────┬─────────────────────┘
                   │                               │
┌──────────────────▼───────────────┐ ┌─────────────▼─────────────────────┐
│    MEANINGFUL CHANGE ENGINE      │ │   DATA PROVIDER MANAGER (CACHE)   │
│  - Composite Heuristic Scoring   │ │  - In-memory 15s TTL Quote Cache  │
│  - Severity Classifier           │ │  - 60s News & Index Cache         │
│  - Explainability Generator      │ │  - Provider Switcher (Demo / Live)│
└──────────────────┬───────────────┘ └─────────────┬─────────────────────┘
                   │                               │
┌──────────────────▼───────────────┐ ┌─────────────▼─────────────────────┐
│       PERSISTENCE LAYER          │ │     MARKET DATA PROVIDERS         │
│  - FileDatabaseRepository (JSON) │ │  - MockMarketDataProvider         │
│  - Prisma Schema (PostgreSQL)    │ │  - LiveMarketDataProvider (Dual)  │
│  - Snapshots & User Preferences  │ │  - Cross-Feed Arbitration Engine  │
└──────────────────────────────────┘ └───────────────────────────────────┘
```

---

## 3. The Meaningful Change Algorithm

The engine evaluates stocks against a prior checkpoint baseline rather than raw previous close alone.

### Scoring Formula:
$$\text{Change Score} = \min(100, (\text{PriceScore} + \text{VolumeScore} + \text{SectorScore} + \text{MarketScore} + \text{NewsScore} + \text{VolatilityScore}) \times \text{PreferenceMultiplier})$$

| Component | Max Points | Evaluation Logic |
| :--- | :---: | :--- |
| **Price Factor** | **35** | Evaluates $\frac{|\Delta \text{Price \%}|}{\text{Threshold}}$. If move exceeds configured threshold (default 2%), awards 20 base pts + up to 15 scaling pts. |
| **Volume Factor** | **25** | Compares $\frac{\text{Current Volume}}{\text{20-Day Avg Volume}}$ against threshold (default 1.5×). Surges award 14 base pts + up to 11 pts for institutional spikes. |
| **Sector Factor** | **15** | Detects sector divergence (e.g., Stock $-3\%$ while Sector $+1\%$). Decoupling signals stock-specific news. |
| **Market Factor** | **10** | Measures alpha divergence relative to broad benchmark (NIFTY 50). |
| **News / Filing** | **15** | Analyzes regulatory filings and exchange disclosures. Weighted by user news sensitivity (Low: 0.6×, Med: 1.0×, High: 1.2×). |
| **Volatility** | **10** | Intraday high-low expansion relative to historical trading band. |

### Severity Classification:
- **0–30: NORMAL** — Within standard volatility noise.
- **30–60: WATCH** — Minor threshold approach or moderate volume pickup.
- **60–80: IMPORTANT** — Actionable move with confirmed volume or sector divergence.
- **80–100: HIGH ATTENTION** — Major threshold breach combined with institutional volume and catalysts.

### Personalization Tuning:
- **Attention Preference**:
  - `Conservative` (Multiplier: **0.88×**) — Demands higher confluence before alerting.
  - `Balanced` (Multiplier: **1.0×**) — Standard quantitative weighting.
  - `Sensitive` (Multiplier: **1.15×**) — Early warning detection for active day traders.

---

## 4. Dual-Feed Arbitration & Fault Tolerance

In financial markets, single upstream feeds suffer from outages, delayed prints, or packet drops. MarketPulse's `LiveMarketDataProvider` implements **Dual-Feed Arbitration**:

1. **Simultaneous Ingestion**: Queries Primary (e.g. NSE feed) and Secondary (e.g. BSE feed).
2. **Variance Arbitration**:
   - If price delta between feeds is $\le 0.5\%$: Uses the most recently timestamped feed.
   - If price delta exceeds $0.5\%$: Triggers arbitration flag, records the discrepancy in metadata (`discrepancyWarning`), and averages or prioritizes the primary exchange.
3. **Data Freshness Indicators**:
   - `Fresh`: Received within last 60 seconds.
   - `Recently Updated`: Received within 5 minutes.
   - `Stale`: Older than 5 minutes (displays amber warning pill).
   - `Unavailable`: Automatic fallback to last known good snapshot.

---

## 5. API Reference

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/watchlists` | `GET` | List all user watchlists |
| `/api/watchlists` | `POST` | Create a new named watchlist |
| `/api/watchlists/:id/stocks` | `GET` | Fetch live quotes for stocks in watchlist |
| `/api/watchlists/:id/stocks` | `POST` | Add a stock symbol to watchlist |
| `/api/watchlists/:id/stocks/:sym` | `DELETE` | Remove a stock from watchlist |
| `/api/watchlists/:id/reorder` | `PUT` | Reorder symbols in watchlist |
| `/api/market/overview` | `GET` | Broad market indices (NIFTY, SENSEX, etc.) |
| `/api/stocks/:symbol` | `GET` | Institutional quote for a symbol |
| `/api/stocks/:symbol/history` | `GET` | Historical candles (`?range=1D\|1W\|1M\|1Y`) |
| `/api/changes` | `GET` | Evaluated Meaningful Changes against latest snapshot |
| `/api/changes/:symbol` | `GET` | Factor breakdown and scorecard for single stock |
| `/api/snapshots` | `POST` | Save current market prices as a baseline checkpoint |
| `/api/snapshots/latest` | `GET` | Retrieve latest saved checkpoint |
| `/api/news` | `GET` | Corporate filings and exchange news |
| `/api/settings` | `GET / PUT` | User thresholds and engine configuration |
| `/api/search?q=...` | `GET` | Instant debounced symbol and company search |
| `/api/demo/simulate` | `POST` | Simulate market changes for presentation walkthrough |
| `/api/demo/reset` | `POST` | Reset simulated market changes to baseline |
| `/api/summary/ai` | `GET` | Gemini 3.8 Flash executive briefing with factual grounding |

---

## 6. Judge Demo Flow Walkthrough

The application includes an interactive **Judge Walkthrough Bar** on the dashboard:

1. **Step 1: Baseline Loaded**  
   The application displays the default NIFTY watchlist (TCS, Reliance, Infosys, HDFC Bank, ICICI Bank) with a baseline snapshot from 9:30 AM. All stocks show **NORMAL** severity.
2. **Step 2: Simulate Volatility**  
   Click **"Simulate Market Changes"**. The backend simulates realistic volatility:
   - **TCS**: $+2.4\%$ with $1.9\times$ volume on a $\$1.2\text{B}$ deal announcement.
   - **RELIANCE**: $-3.2\%$ with $1.85\times$ volume on refining margin drops.
   - **INFY**: $+0.8\%$ with steady volume.
   - **HDFCBANK**: $+1.8\%$ with $1.6\times$ volume.
3. **Step 3: Inspect "What Changed"**  
   Click **"What Changed"**. TCS and Reliance immediately jump to the top as **HIGH ATTENTION / IMPORTANT** events.
4. **Step 4: Drill Down on Reliance**  
   Click on the **RELIANCE** card. The modal displays:
   - The interactive SVG price chart showing the downward trend.
   - The volume bar highlighting $1.85\times$ institutional participation.
   - The **"Why This Matters"** narrative explaining the exact numbers without fluff.
   - The factor scorecard detailing the point breakdown.
5. **Step 5: Test Personalization**  
   Open **Settings** (slider icon) and change the price threshold from $2.0\%$ to $4.0\%$. Notice how Reliance's score dynamically recalibrates down from **HIGH ATTENTION** to **WATCH**, proving the engine's real-time adaptability!

---

## 7. Testing & Verification

Automated unit tests verify the heuristic scoring engine:

```bash
npm run test
```

Test coverage includes:
- Sub-threshold movements correctly receiving `NORMAL` classification ($< 30$ pts).
- Compounded price and volume spikes correctly triggering `HIGH ATTENTION` ($> 80$ pts).
- Factually grounded narrative generation containing exact percentages and volume multipliers.
- Attention preference tuning (`Sensitive` vs `Conservative`).

---

## 8. Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Custom SVG Charting.
- **Backend**: Node.js, Express, TypeScript (`tsx` runtime / `esbuild` production bundler).
- **Persistence**: Hybrid File Database repository (`/data/marketpulse_db.json`) + Prisma schema ready for PostgreSQL / Cloud SQL.
- **AI Intelligence**: Google Gemini 3.8 Flash (`@google/genai`) with deterministic fallback.
- **Build**: Vite + esbuild (zero bundling overhead, strict CJS bundling for server).
