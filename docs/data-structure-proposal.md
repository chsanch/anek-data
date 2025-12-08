# FX Orders Data Structure & Analytics Proposal

## Overview

This document outlines the data structure from the Kantox FX Orders system and proposes a DuckDB schema for local analytics in a Svelte web application.

---

## Data Structure Summary

### Entity Hierarchy

```
unified-orders (summary view)
├── forwards (individual FX forward contracts)
├── chains (group of related orders)
│   ├── original order (forward)
│   └── kaas-swaps[] (rolls and draws)
│       ├── near-leg
│       └── far-leg
├── spots (immediate FX trades)
└── swaps (standalone swaps)
```

### Key Entities & Fields

#### 1. unified-orders (main list/summary)

| Field                            | Type    | Description                              |
| -------------------------------- | ------- | ---------------------------------------- |
| `id` / `reference`               | string  | K-xxx (order), KCH-xxx (chain)           |
| `fx-order-type`                  | string  | "forward", "chain", "spot"               |
| `market-direction`               | string  | "buy" or "sell"                          |
| `buy-amount` / `sell-amount`     | integer | Amounts in **cents**                     |
| `buy-currency` / `sell-currency` | string  | EUR, USD, CHF, DKK                       |
| `rate`                           | decimal | Exchange rate                            |
| `value-date`                     | date    | Settlement date                          |
| `creation-date`                  | date    | Order creation                           |
| `execution-date`                 | date    | When executed (nullable)                 |
| `status`                         | string  | "open", "closed_to_trading", "completed" |
| `liquidity-provider`             | string  | LP code (e.g., "SIVB")                   |

#### 2. orders (detailed forward order)

Additional fields beyond unified-orders:

| Field                      | Type    | Description                    |
| -------------------------- | ------- | ------------------------------ |
| `commission-amount-cents`  | integer | Commission in cents            |
| `commission-rate`          | decimal | Commission rate (e.g., 0.0034) |
| `currency-pair`            | string  | e.g., "EURUSD"                 |
| `normalized-currency-pair` | string  | Standardized pair format       |
| `order-type`               | string  | "forward"                      |
| `selected-lp`              | string  | Selected liquidity provider    |
| `inverse-rate`             | decimal | Inverse of the rate            |

#### 3. kaas-swaps (rolls and draws within chains)

| Field                                          | Type    | Description                             |
| ---------------------------------------------- | ------- | --------------------------------------- |
| `swap-type`                                    | string  | "roll" or "early-draw"                  |
| `near-value-date` / `far-value-date`           | date    | Swap dates                              |
| `near-direction` / `far-direction`             | string  | "buy" or "sell"                         |
| `swap-points`                                  | string  | Points difference (e.g., "-3395.1 CHF") |
| `spot-rate`, `rate`                            | decimal | Rates                                   |
| `chain-rate`, `parent-order-rate`              | decimal | Reference rates                         |
| `near-leg-delta-cents` / `far-leg-delta-cents` | integer | Delta amounts                           |
| `parent-reference`                             | string  | Reference to parent chain               |

#### 4. legs (swap legs)

| Field                                   | Type    | Description     |
| --------------------------------------- | ------- | --------------- |
| `leg-type`                              | string  | "near" or "far" |
| `sell-amount-cents`, `buy-amount-cents` | integer | Leg amounts     |
| `sell-currency`, `buy-currency`         | string  | Currencies      |
| `rate`                                  | decimal | Leg rate        |
| `value-date`                            | date    | Leg settlement  |

---

## Proposed DuckDB Schema

For analytics, we recommend a **denormalized approach** with these tables:

### Main Orders Table

```sql
CREATE TABLE orders (
    id VARCHAR PRIMARY KEY,
    reference VARCHAR,
    fx_order_type VARCHAR,           -- 'forward', 'chain', 'spot'
    market_direction VARCHAR,        -- 'buy', 'sell'
    buy_amount_cents BIGINT,
    sell_amount_cents BIGINT,
    buy_currency VARCHAR,
    sell_currency VARCHAR,
    rate DECIMAL(18,8),
    value_date DATE,
    creation_date DATE,
    execution_date DATE,
    status VARCHAR,
    liquidity_provider VARCHAR
);
```

### Swaps Table (rolls and draws)

```sql
CREATE TABLE swaps (
    id VARCHAR PRIMARY KEY,
    parent_chain_id VARCHAR,         -- FK to orders
    swap_type VARCHAR,               -- 'roll', 'early-draw'
    status VARCHAR,
    near_value_date DATE,
    far_value_date DATE,
    notional_market_direction VARCHAR,
    amount_cents BIGINT,
    currency VARCHAR,
    counter_currency VARCHAR,
    near_direction VARCHAR,
    far_direction VARCHAR,
    buy_amount_cents BIGINT,
    sell_amount_cents BIGINT,
    buy_currency VARCHAR,
    sell_currency VARCHAR,
    rate DECIMAL(18,8),
    spot_rate DECIMAL(18,8),
    swap_points DECIMAL(18,4),
    swap_points_currency VARCHAR,
    chain_rate DECIMAL(18,8),
    executed_date TIMESTAMP,
    created TIMESTAMP
);
```

### Legs Table (optional, for detailed swap analysis)

```sql
CREATE TABLE legs (
    id VARCHAR PRIMARY KEY,
    swap_id VARCHAR,                 -- FK to swaps
    leg_type VARCHAR,                -- 'near', 'far'
    sell_amount_cents BIGINT,
    sell_currency VARCHAR,
    buy_amount_cents BIGINT,
    buy_currency VARCHAR,
    rate DECIMAL(18,8),
    value_date DATE,
    status VARCHAR
);
```

---

## Proposed Aggregations & Queries

### Simple Aggregations

#### 1. Total Volume by Currency (Buy/Sell)

```sql
-- Total EUR bought
SELECT SUM(buy_amount_cents)/100.0 as total_eur_bought
FROM orders
WHERE buy_currency = 'EUR';

-- Total EUR sold
SELECT SUM(sell_amount_cents)/100.0 as total_eur_sold
FROM orders
WHERE sell_currency = 'EUR';
```

#### 2. Volume by Date Range

```sql
SELECT
    SUM(CASE WHEN market_direction = 'buy' THEN buy_amount_cents ELSE 0 END)/100.0 as total_bought,
    SUM(CASE WHEN market_direction = 'sell' THEN sell_amount_cents ELSE 0 END)/100.0 as total_sold
FROM orders
WHERE creation_date BETWEEN '2025-12-01' AND '2025-12-31';
```

#### 3. Volume by Currency Pair

```sql
SELECT
    buy_currency || '/' || sell_currency as pair,
    COUNT(*) as trade_count,
    SUM(buy_amount_cents)/100.0 as total_buy_amount,
    SUM(sell_amount_cents)/100.0 as total_sell_amount
FROM orders
GROUP BY buy_currency, sell_currency;
```

#### 4. Volume by Order Type

```sql
SELECT
    fx_order_type,
    COUNT(*) as count,
    SUM(buy_amount_cents)/100.0 as total_volume
FROM orders
GROUP BY fx_order_type;
```

#### 5. Average Rate by Currency Pair

```sql
SELECT
    buy_currency || '/' || sell_currency as pair,
    AVG(rate) as avg_rate,
    MIN(rate) as min_rate,
    MAX(rate) as max_rate
FROM orders
GROUP BY buy_currency, sell_currency;
```

### Chart-Ready Aggregations

#### 6. Daily Volume Trend (for line/bar chart)

```sql
SELECT
    creation_date,
    SUM(buy_amount_cents)/100.0 as daily_volume,
    COUNT(*) as trade_count
FROM orders
GROUP BY creation_date
ORDER BY creation_date;
```

#### 7. Volume Distribution by Status (for pie chart)

```sql
SELECT
    status,
    COUNT(*) as count,
    SUM(buy_amount_cents)/100.0 as volume
FROM orders
GROUP BY status;
```

#### 8. Buy vs Sell Breakdown (for stacked bar)

```sql
SELECT
    creation_date,
    SUM(CASE WHEN market_direction = 'buy' THEN buy_amount_cents ELSE 0 END)/100.0 as buys,
    SUM(CASE WHEN market_direction = 'sell' THEN sell_amount_cents ELSE 0 END)/100.0 as sells
FROM orders
GROUP BY creation_date;
```

#### 9. EUR-Normalized Volume

```sql
-- Convert all volumes to EUR equivalent using rates
SELECT
    creation_date,
    SUM(CASE
        WHEN buy_currency = 'EUR' THEN buy_amount_cents
        WHEN sell_currency = 'EUR' THEN sell_amount_cents
        ELSE buy_amount_cents / rate  -- approximate conversion
    END)/100.0 as eur_equivalent_volume
FROM orders
GROUP BY creation_date;
```

#### 10. Swap Activity Analysis (for chains)

```sql
SELECT
    parent_chain_id,
    COUNT(*) as swap_count,
    SUM(CASE WHEN swap_type = 'roll' THEN 1 ELSE 0 END) as rolls,
    SUM(CASE WHEN swap_type = 'early-draw' THEN 1 ELSE 0 END) as draws,
    SUM(amount_cents)/100.0 as total_swapped_amount
FROM swaps
GROUP BY parent_chain_id;
```

#### 11. Liquidity Provider Analysis

```sql
SELECT
    liquidity_provider,
    COUNT(*) as trade_count,
    SUM(buy_amount_cents)/100.0 as total_volume
FROM orders
GROUP BY liquidity_provider;
```

#### 12. Settlement Date Distribution (upcoming settlements)

```sql
SELECT
    value_date,
    COUNT(*) as orders_settling,
    SUM(buy_amount_cents)/100.0 as amount_settling
FROM orders
WHERE status = 'open' AND value_date >= CURRENT_DATE
GROUP BY value_date
ORDER BY value_date;
```

---

## Chart Recommendations for Svelte App

| Chart Type           | Aggregation             | Use Case                        |
| -------------------- | ----------------------- | ------------------------------- |
| **Bar Chart**        | Volume by currency pair | See which pairs are most traded |
| **Line Chart**       | Daily volume trend      | Spot patterns over time         |
| **Pie Chart**        | Volume by status        | Open vs completed breakdown     |
| **Stacked Bar**      | Buy vs sell by date     | Direction analysis              |
| **Table**            | Top N largest orders    | Quick overview                  |
| **Calendar Heatmap** | Settlement dates        | Cash flow planning              |
| **Donut Chart**      | Order type distribution | Forward vs chain vs spot        |

---

## Charting Library Comparison

### Libraries Under Consideration

| Library                | Bundle Size | Focus                 | Svelte Support |
| ---------------------- | ----------- | --------------------- | -------------- |
| **Lightweight Charts** | ~40KB       | Financial/Time-series | Direct         |
| **Chart.js**           | ~60KB       | General purpose       | svelte-chartjs |
| **Apache ECharts**     | ~300KB\*    | Full-featured         | svelte-echarts |

\*ECharts is tree-shakeable, can be reduced significantly

### Lightweight Charts (TradingView)

**GitHub:** https://github.com/tradingview/lightweight-charts

**What it does well:**

| Chart Type  | Support   | Quality                       |
| ----------- | --------- | ----------------------------- |
| Line Chart  | Excellent | Smooth, performant            |
| Area Chart  | Excellent | Great for cumulative data     |
| Candlestick | Excellent | Professional TradingView look |
| Histogram   | Good      | Time-based bars               |
| Baseline    | Good      | Above/below threshold         |

**What it doesn't support:**

| Chart Type  | Support | Impact on Our Needs                       |
| ----------- | ------- | ----------------------------------------- |
| Pie/Donut   | No      | Can't show status/type distribution       |
| Stacked Bar | No      | Can't show buy vs sell breakdown          |
| Grouped Bar | No      | Can't compare currency pairs side-by-side |
| Heatmap     | No      | Can't show settlement calendar            |
| Radar       | No      | N/A for our use case                      |

**Pros:**

- TradingView professional look (fits FX domain)
- Very fast (handles 100K+ data points)
- Small bundle size (~40KB)
- Built for financial data
- Active maintenance

**Cons:**

- Limited to time-series visualizations
- No categorical comparisons
- Would need to redesign some visualizations

### Chart.js

**What it does well:**

| Chart Type      | Support   | Quality                      |
| --------------- | --------- | ---------------------------- |
| Line/Area       | Good      | Standard quality             |
| Bar (all types) | Excellent | Stacked, grouped, horizontal |
| Pie/Donut       | Excellent | With labels and legends      |
| Radar           | Good      | N/A for us                   |
| Scatter         | Good      | N/A for us                   |

**Pros:**

- All chart types we need
- Well-documented
- Large ecosystem
- Easy to learn

**Cons:**

- Generic look (not financial-focused)
- Performance degrades with large datasets (>10K points)
- Canvas-based (less crisp on retina)

### Apache ECharts

**What it does well:**

| Chart Type      | Support   | Quality                     |
| --------------- | --------- | --------------------------- |
| Line/Area       | Excellent | Highly customizable         |
| Bar (all types) | Excellent | All variations              |
| Pie/Donut       | Excellent | Rich interactions           |
| Candlestick     | Excellent | Professional quality        |
| Heatmap         | Excellent | Calendar heatmaps supported |
| TreeMap         | Excellent | For hierarchical data       |

**Pros:**

- Every chart type imaginable
- Handles large datasets well
- Can look professional/financial with theming
- Rich interactions (zoom, brush, tooltips)
- Good for dashboards

**Cons:**

- Larger bundle (but tree-shakeable)
- Steeper learning curve
- Configuration can be verbose

### Comparison Matrix for Our Needs

| Our Requirement                 | Lightweight Charts | Chart.js  | ECharts   |
| ------------------------------- | ------------------ | --------- | --------- |
| Daily volume trend (line)       | Excellent          | Good      | Excellent |
| Volume by currency pair (bar)   | Limited\*          | Good      | Excellent |
| Status distribution (pie)       | No                 | Excellent | Excellent |
| Buy vs sell (stacked bar)       | No                 | Excellent | Excellent |
| Settlement calendar (heatmap)   | No                 | No        | Excellent |
| Order type distribution (donut) | No                 | Excellent | Excellent |
| Large dataset performance       | Excellent          | Poor      | Good      |
| Financial/Trading look          | Excellent          | Poor      | Good      |
| Bundle size                     | Excellent          | Good      | Fair      |

\*Lightweight Charts can do time-based histograms but not categorical bars

### Recommendation

#### Option A: Lightweight Charts Only (Trading-Focused Dashboard)

Choose this if:

- Time-series charts are 80%+ of the dashboard
- Team prefers TradingView aesthetic
- Willing to adapt visualizations

**Adaptations needed:**

| Original Chart         | Lightweight Alternative                       |
| ---------------------- | --------------------------------------------- |
| Pie (status)           | Stacked area over time showing status changes |
| Donut (order types)    | Multiple line series (one per type)           |
| Stacked bar (buy/sell) | Histogram with two series or baseline chart   |
| Heatmap (settlements)  | Display as data table instead                 |

#### Option B: ECharts (Full-Featured Dashboard)

Choose this if:

- Need all chart types from the proposal
- Want flexibility for future requirements
- Can accept larger bundle size

**Best for:** Business analytics style dashboard with mixed visualizations

#### Option C: Lightweight Charts + Tables (Hybrid)

Choose this if:

- Want TradingView look for main charts
- Okay with showing categorical data in tables instead of charts

```
┌─────────────────────────────────────────────────────────┐
│  DASHBOARD LAYOUT                                        │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐    │
│  │  Volume Over Time (Lightweight Charts - Line)   │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Buy/Sell Trend (Lightweight Charts - Baseline) │    │
│  └─────────────────────────────────────────────────┘    │
│  ┌───────────────────┐  ┌───────────────────┐          │
│  │ Status Breakdown  │  │ Order Types       │          │
│  │ (HTML Table)      │  │ (HTML Table)      │          │
│  └───────────────────┘  └───────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

### Team Decision Guide

Ask yourselves:

1. **"What's our primary use case?"**
   - Monitoring trends over time → Lightweight Charts
   - Comparing categories/breakdowns → ECharts or Chart.js

2. **"How important is the TradingView look?"**
   - Very important → Lightweight Charts
   - Nice to have → ECharts (can be themed)
   - Not important → Chart.js

3. **"How much data will we display at once?"**
   - 10K+ points frequently → Lightweight Charts or ECharts
   - Usually < 5K points → Any library works

4. **"Do we need pie/donut charts?"**
   - Yes, definitely → ECharts or Chart.js
   - Can live without them → Lightweight Charts

### Final Recommendation

For an **FX trading analytics dashboard**, we recommend:

**Primary: Lightweight Charts** for the main time-series visualizations (volume trends, rate history, buy/sell over time)

**Secondary: HTML/CSS tables** for categorical breakdowns (status, order types, currency pairs)

This gives the professional TradingView look while keeping the bundle small. If pie/donut charts become essential later, ECharts can be added for specific components.

---

## Technical Considerations

### Understanding Parquet and Arrow Formats

**The key distinction:** Parquet is for storage, Arrow is for processing.

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA JOURNEY                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   STORAGE (Files)              MEMORY (RAM)         ANALYTICS   │
│   ┌───────────┐               ┌───────────┐       ┌───────────┐ │
│   │  PARQUET  │  ──────────►  │   ARROW   │  ───► │  QUERY    │ │
│   │  ~2 MB    │   download    │  ~10 MB   │       │  RESULTS  │ │
│   │ compressed│   & load      │  ready to │       │           │ │
│   └───────────┘               │  query    │       └───────────┘ │
│                               └───────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Parquet Format (Apache Parquet)**

- Columnar storage format designed for efficient storage and retrieval
- Highly compressed (5-10x smaller than JSON)
- Ideal for transferring data over the network
- Schema is embedded in the file
- _Used in this proposal for:_ Initial bulk data download

**Arrow Format (Apache Arrow)**

- Columnar memory format designed for fast analytics
- Zero-copy reads (no serialization overhead)
- Standardized format that multiple tools can share
- _Used in this proposal for:_ In-memory processing within DuckDB WASM

**Why both?**

| Format  | Optimized For       | Size   | Speed            |
| ------- | ------------------- | ------ | ---------------- |
| Parquet | Storage & Transfer  | Small  | Fast to download |
| Arrow   | In-Memory Analytics | Larger | Instant queries  |

**How DuckDB uses them:**

1. You download a Parquet file (small, compressed)
2. DuckDB loads it into memory as Arrow format (fast to query)
3. All queries run against Arrow data (instant results)

**You don't need to manage Arrow directly** - DuckDB handles the Parquet → Arrow conversion automatically when loading data.

### DuckDB WASM Integration

- DuckDB WASM runs entirely in the browser
- Supports full SQL syntax for complex aggregations
- Efficient for datasets up to several million rows
- Native Parquet support for fast bulk loading
- Uses Arrow internally for high-performance queries

### Recommended Initial Data Volume

**Target: ~20,000 orders** for initial load

| Format      | Estimated Size (20K orders) | Load Speed  | Recommendation           |
| ----------- | --------------------------- | ----------- | ------------------------ |
| JSON        | ~10-15 MB                   | Slowest     | Not recommended for bulk |
| CSV         | ~5-8 MB                     | Medium      | Fallback option          |
| **Parquet** | **~1-3 MB**                 | **Fastest** | **Recommended**          |

**Why Parquet?**

- Columnar format with excellent compression (5-10x smaller than JSON)
- Native DuckDB support = very fast loading
- Schema embedded in file (type-safe)
- Supports predicate pushdown for filtered queries

---

## Data Loading & Synchronization Strategy

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          BACKEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  1. Generate Parquet files periodically (daily/hourly)          │
│  2. Store on CDN/S3 for fast download                           │
│  3. JSON API for incremental updates (new/modified orders)      │
│  4. Endpoint: GET /orders?updated_since={timestamp}             │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          CLIENT                                  │
├─────────────────────────────────────────────────────────────────┤
│  1. First visit: Download Parquet → Load into DuckDB WASM       │
│  2. Store last_sync_timestamp in localStorage                   │
│  3. On subsequent visits: Fetch delta via JSON API              │
│  4. UPSERT changes into local DuckDB                            │
│  5. Persist DuckDB to IndexedDB for offline access              │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 1: Initial Load (First Visit)

```
User opens app
      │
      ▼
┌─────────────────┐     No      ┌──────────────────────┐
│ Local DB exists?│ ──────────► │ Download Parquet     │
└─────────────────┘             │ from CDN (~1-3 MB)   │
      │ Yes                     └──────────────────────┘
      ▼                                   │
┌─────────────────┐                       ▼
│ Load from       │             ┌──────────────────────┐
│ IndexedDB       │             │ Load into DuckDB     │
└─────────────────┘             │ WASM                 │
      │                         └──────────────────────┘
      ▼                                   │
┌─────────────────┐                       ▼
│ Fetch delta     │◄──────────────────────┘
│ updates         │
└─────────────────┘
```

### Phase 2: Incremental Sync

**On each app load or periodic interval:**

1. Read `last_sync_timestamp` from localStorage
2. Call JSON API: `GET /unified-orders?filter[updated_since]={timestamp}`
3. For each returned order:
   - If exists in local DB → UPDATE
   - If new → INSERT
4. Update `last_sync_timestamp` to current time
5. Persist DuckDB to IndexedDB

**SQL for UPSERT in DuckDB:**

```sql
-- Using INSERT OR REPLACE (requires PRIMARY KEY)
INSERT OR REPLACE INTO orders VALUES (?, ?, ?, ...);

-- Or using explicit UPSERT
INSERT INTO orders (id, reference, fx_order_type, ...)
VALUES (?, ?, ?, ...)
ON CONFLICT (id) DO UPDATE SET
    reference = EXCLUDED.reference,
    fx_order_type = EXCLUDED.fx_order_type,
    status = EXCLUDED.status,
    -- ... other fields
    ;
```

### Phase 3: Real-time Updates (Optional)

For near real-time sync, consider:

| Approach                     | Pros                      | Cons                |
| ---------------------------- | ------------------------- | ------------------- |
| **Polling** (every 30s-60s)  | Simple to implement       | Not truly real-time |
| **Server-Sent Events (SSE)** | Real-time, simple         | One-way only        |
| **WebSocket**                | Bi-directional, real-time | More complex        |

**Recommended: Start with polling**, upgrade to SSE if needed.

### Backend Requirements

1. **Parquet Generation Job**
   - Run daily (or hourly for high-volume)
   - Generate file with last N months of orders
   - Upload to CDN/S3 with cache headers
   - Keep previous versions for rollback

2. **Delta API Endpoint**

   ```
   GET /unified-orders?filter[updated_since]=2025-12-01T00:00:00Z
   ```

   - Returns orders created or modified since timestamp
   - Include `updated_at` field in response
   - Paginate if > 1000 results

3. **Manifest File** (optional but recommended)
   ```json
   {
   	"latest_parquet": "orders-2025-12-08.parquet",
   	"generated_at": "2025-12-08T06:00:00Z",
   	"record_count": 20000,
   	"checksum": "sha256:abc123..."
   }
   ```

### Client-Side Storage

**IndexedDB for persistence:**

```javascript
// Persist DuckDB database to IndexedDB
async function persistDatabase(db) {
	const data = await db.export();
	const idb = await openDB('fx-analytics', 1);
	await idb.put('duckdb', data, 'database');
}

// Load from IndexedDB on startup
async function loadDatabase() {
	const idb = await openDB('fx-analytics', 1);
	const data = await idb.get('duckdb', 'database');
	if (data) {
		await db.import(data);
		return true;
	}
	return false;
}
```

### Sync Metadata Table

Add a metadata table to track sync state:

```sql
CREATE TABLE sync_metadata (
    key VARCHAR PRIMARY KEY,
    value VARCHAR,
    updated_at TIMESTAMP
);

-- Store sync timestamp
INSERT INTO sync_metadata VALUES ('last_sync', '2025-12-08T10:30:00Z', NOW());

-- Store parquet file info
INSERT INTO sync_metadata VALUES ('parquet_file', 'orders-2025-12-08.parquet', NOW());
```

---

## File Generation (Backend)

### Generating Parquet from JSON API Data

**Option A: Server-side script (Python)**

```python
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

# Fetch from JSON API
orders = fetch_all_orders_from_api()

# Convert to DataFrame
df = pd.DataFrame([flatten_order(o) for o in orders])

# Write Parquet with compression
pq.write_table(
    pa.Table.from_pandas(df),
    'orders.parquet',
    compression='snappy'  # Good balance of speed/size
)
```

**Option B: DuckDB on server**

```sql
-- Export directly to Parquet
COPY (SELECT * FROM orders) TO 'orders.parquet' (FORMAT PARQUET);
```

### Suggested Libraries for Svelte

- **@duckdb/duckdb-wasm**: DuckDB WASM bindings
- **idb**: IndexedDB wrapper for persistence
- **lightweight-charts**: TradingView charting (recommended for time-series)
- **Apache ECharts** (optional): If pie/donut/heatmap charts are needed

---

## Performance Considerations

### Expected Performance (20K orders)

| Operation                | Expected Time |
| ------------------------ | ------------- |
| Load Parquet (1-3 MB)    | < 500ms       |
| Simple aggregation query | < 50ms        |
| Complex GROUP BY query   | < 200ms       |
| Full table scan          | < 100ms       |

### Scaling Guidelines

| Order Count | Parquet Size | Recommended Approach                 |
| ----------- | ------------ | ------------------------------------ |
| < 50K       | ~5 MB        | Single Parquet file                  |
| 50K - 200K  | ~20 MB       | Single file, consider lazy loading   |
| 200K - 1M   | ~100 MB      | Split by time period (monthly files) |
| > 1M        | > 500 MB     | Server-side aggregation recommended  |

---

## Discussion Points

1. **Schema Design**: Should we use normalized or denormalized tables?
2. **Parquet Generation**: How often should we regenerate the bulk file?
3. **Currency Normalization**: Should all amounts be converted to EUR for comparison?
4. **Historical Data**: How far back should the initial load go? (6 months? 1 year?)
5. **Offline Support**: How important is offline functionality?
6. **Real-time Updates**: Is polling sufficient, or do we need SSE/WebSocket?
7. **Data Retention**: Should we prune old data from local DB?
8. **Additional Aggregations**: What other metrics would be valuable?
9. **Charting Library**: Which option fits best?
   - Option A: Lightweight Charts only (trading look, limited chart types)
   - Option B: ECharts (all chart types, larger bundle)
   - Option C: Lightweight Charts + HTML tables (hybrid approach)

---

## Next Steps

1. **Decisions Required**
   - [ ] Choose charting library (Lightweight Charts vs ECharts vs Hybrid)
   - [ ] Define which visualizations are must-have vs nice-to-have
   - [ ] Decide on historical data range for initial load

2. **Backend**
   - [ ] Add `updated_at` field to orders if not present
   - [ ] Create Parquet generation job
   - [ ] Set up CDN/S3 for file hosting
   - [ ] Create delta API endpoint with `updated_since` filter

3. **Frontend**
   - [ ] Set up Svelte project with DuckDB WASM
   - [ ] Implement Parquet loading from CDN
   - [ ] Implement IndexedDB persistence
   - [ ] Build sync service for delta updates
   - [ ] Create initial aggregation queries
   - [ ] Build chart components with chosen library

4. **Testing**
   - [ ] Load test with 20K, 50K, 100K orders
   - [ ] Measure query performance
   - [ ] Test sync reliability
   - [ ] Benchmark charting performance with large datasets
