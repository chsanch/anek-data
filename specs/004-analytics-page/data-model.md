# Data Model: Analytics Page

**Date**: 2025-12-10
**Feature**: 004-analytics-page

## Overview

This feature adds analytics visualizations that aggregate existing order data. No new database tables are required - all data is derived from the existing `orders` table via DuckDB SQL queries.

## Source Entity (Existing)

### orders (existing table)

The analytics queries aggregate data from the existing orders table:

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
    status VARCHAR,                  -- 'open', 'closed_to_trading', 'completed'
    liquidity_provider VARCHAR
);
```

## Derived Types (TypeScript)

### DailyVolume

Represents aggregated trading volume for a single day.

```typescript
interface DailyVolume {
	/** Date in YYYY-MM-DD format (Lightweight Charts time format) */
	time: string;
	/** Total volume in currency units (cents / 100) */
	value: number;
	/** Number of trades on this day */
	tradeCount: number;
}
```

**Source Query**:

```sql
SELECT
  strftime(creation_date, '%Y-%m-%d') as time,
  SUM(sell_amount_cents)::DOUBLE / 100.0 as value,
  COUNT(*)::BIGINT as trade_count
FROM orders
WHERE creation_date >= ? AND creation_date <= ?
GROUP BY creation_date
ORDER BY creation_date
```

**Validation Rules**:

- `time` must be valid ISO date string
- `value` must be >= 0
- `tradeCount` must be >= 1

---

### DailyDirectionVolume

Represents buy/sell volume breakdown for a single day.

```typescript
interface DailyDirectionVolume {
	/** Date in YYYY-MM-DD format */
	time: string;
	/** Total buy volume in currency units */
	buyVolume: number;
	/** Total sell volume in currency units */
	sellVolume: number;
}
```

**Source Query**:

```sql
SELECT
  strftime(creation_date, '%Y-%m-%d') as time,
  SUM(CASE WHEN market_direction = 'buy' THEN buy_amount_cents ELSE 0 END)::DOUBLE / 100.0 as buy_volume,
  SUM(CASE WHEN market_direction = 'sell' THEN sell_amount_cents ELSE 0 END)::DOUBLE / 100.0 as sell_volume
FROM orders
WHERE creation_date >= ? AND creation_date <= ?
GROUP BY creation_date
ORDER BY creation_date
```

**Validation Rules**:

- `time` must be valid ISO date string
- `buyVolume` must be >= 0
- `sellVolume` must be >= 0

---

### StatusDistribution

Represents count and percentage of orders by status.

```typescript
interface StatusDistribution {
	/** Order status: 'open', 'closed_to_trading', 'completed' */
	status: 'open' | 'closed_to_trading' | 'completed';
	/** Number of orders with this status */
	count: number;
	/** Percentage of total orders (0-100) */
	percentage: number;
}
```

**Source Query**:

```sql
SELECT
  status,
  COUNT(*)::BIGINT as count,
  (COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ())::DOUBLE as percentage
FROM orders
GROUP BY status
ORDER BY count DESC
```

**Validation Rules**:

- `status` must be one of: 'open', 'closed_to_trading', 'completed'
- `count` must be >= 0
- `percentage` must be >= 0 and <= 100
- Sum of all percentages must equal 100 (within floating point tolerance)

---

### TimeRangePreset

Represents available time range options.

```typescript
type TimeRangePreset = '7d' | '30d' | '90d' | 'all';

interface TimeRange {
	/** Start date (inclusive) in YYYY-MM-DD format */
	start: string;
	/** End date (inclusive) in YYYY-MM-DD format */
	end: string;
}
```

**Preset Calculations**:
| Preset | Start | End |
|--------|-------|-----|
| `7d` | Today - 7 days | Today |
| `30d` | Today - 30 days | Today |
| `90d` | Today - 90 days | Today |
| `all` | Earliest order date | Today |

---

## Lightweight Charts Data Formats

### Area Series Data (Volume Chart)

```typescript
// Lightweight Charts AreaSeries expects:
interface AreaData {
	time: string; // YYYY-MM-DD format
	value: number;
}

// Direct mapping from DailyVolume
const areaData: AreaData[] = dailyVolumes.map((d) => ({
	time: d.time,
	value: d.value
}));
```

### Histogram Series Data (Buy/Sell Chart)

```typescript
// Lightweight Charts HistogramSeries expects:
interface HistogramData {
	time: string;
	value: number;
	color?: string;
}

// Two series needed for buy vs sell
const buyData: HistogramData[] = directionVolumes.map((d) => ({
	time: d.time,
	value: d.buyVolume,
	color: '#26a69a' // Green for buy
}));

const sellData: HistogramData[] = directionVolumes.map((d) => ({
	time: d.time,
	value: -d.sellVolume, // Negative to show below axis
	color: '#ef5350' // Red for sell
}));
```

---

## State Transitions

### Time Range Selection

```
[Initial Load] → preset='30d' → [Calculate Range] → [Fetch Data] → [Render Charts]
     ↓                                                    ↓
[User Changes Preset] ←──────────────────────────────────────
```

### Data Loading States

```
idle → loading → ready
         ↓
       error → (retry) → loading
```

Each chart component independently manages its loading state.

---

## Relationships

```
orders (source)
    │
    ├── [GROUP BY creation_date] → DailyVolume[]
    │
    ├── [GROUP BY creation_date, market_direction] → DailyDirectionVolume[]
    │
    └── [GROUP BY status] → StatusDistribution[]
```

All derived types are read-only views of the orders data, computed on-demand when the time range changes.
