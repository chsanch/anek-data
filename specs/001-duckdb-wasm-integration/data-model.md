# Data Model: DuckDB WASM Integration

**Feature**: 001-duckdb-wasm-integration
**Date**: 2025-12-08

## Entity Definitions

### Order (Primary Entity)

The Order entity represents a unified FX transaction record. This entity is loaded from Parquet files into DuckDB WASM for local querying.

**Source**: Remote Parquet file (configured via `PUBLIC_PARQUET_URL`)
**Storage**: DuckDB WASM in-memory table

#### Attributes

| Field | Type | Nullable | Description | Validation |
|-------|------|----------|-------------|------------|
| id | VARCHAR | No | Unique identifier (K-xxxxxx format) | Primary key |
| reference | VARCHAR | No | Reference number | Non-empty string |
| fx_order_type | VARCHAR | No | Order type | 'forward', 'chain', 'spot' |
| market_direction | VARCHAR | No | Trade direction | 'buy', 'sell' |
| buy_amount_cents | BIGINT | No | Buy amount in cents | >= 0 |
| sell_amount_cents | BIGINT | No | Sell amount in cents | >= 0 |
| buy_currency | VARCHAR | No | Buy currency code | 3-letter ISO code |
| sell_currency | VARCHAR | No | Sell currency code | 3-letter ISO code |
| rate | DECIMAL(18,8) | No | Exchange rate | > 0 |
| value_date | DATE | No | Settlement date | Valid date |
| creation_date | DATE | No | Order creation date | Valid date |
| execution_date | DATE | Yes | Execution date | Valid date or NULL |
| status | VARCHAR | No | Order status | 'open', 'closed_to_trading', 'completed' |
| liquidity_provider | VARCHAR | No | LP code | Non-empty string |

#### DuckDB Schema

```sql
CREATE TABLE orders (
    id VARCHAR PRIMARY KEY,
    reference VARCHAR NOT NULL,
    fx_order_type VARCHAR NOT NULL,
    market_direction VARCHAR NOT NULL,
    buy_amount_cents BIGINT NOT NULL,
    sell_amount_cents BIGINT NOT NULL,
    buy_currency VARCHAR NOT NULL,
    sell_currency VARCHAR NOT NULL,
    rate DECIMAL(18,8) NOT NULL,
    value_date DATE NOT NULL,
    creation_date DATE NOT NULL,
    execution_date DATE,
    status VARCHAR NOT NULL,
    liquidity_provider VARCHAR NOT NULL,

    -- Constraints
    CHECK (fx_order_type IN ('forward', 'chain', 'spot')),
    CHECK (market_direction IN ('buy', 'sell')),
    CHECK (status IN ('open', 'closed_to_trading', 'completed')),
    CHECK (buy_amount_cents >= 0),
    CHECK (sell_amount_cents >= 0),
    CHECK (rate > 0)
);
```

#### TypeScript Interface

```typescript
// src/lib/types/orders.ts (existing)
export interface UnifiedOrder {
  id: string;
  reference: string;
  fxOrderType: 'forward' | 'chain' | 'spot';
  marketDirection: 'buy' | 'sell';
  buyAmountCents: number;
  sellAmountCents: number;
  buyCurrency: string;
  sellCurrency: string;
  rate: number;
  valueDate: string;
  creationDate: string;
  executionDate: string | null;
  status: 'open' | 'closed_to_trading' | 'completed';
  liquidityProvider: string;
}
```

### DashboardStats (Derived Entity)

Aggregated statistics derived from Order data via SQL queries.

**Storage**: Svelte 5 reactive state (`$state`)
**Calculation**: On data load and manual refresh

#### Attributes

| Field | Type | Description | Calculation |
|-------|------|-------------|-------------|
| totalTrades | number | Total order count | `COUNT(*)` |
| totalVolume | number | Total trading volume in cents | `SUM(sell_amount_cents)` |
| openOrders | number | Count of open orders | `COUNT(*) WHERE status = 'open'` |
| volumeByCurrency | CurrencyVolume[] | Volume breakdown by sell currency | `GROUP BY sell_currency` |

#### TypeScript Interface

```typescript
// src/lib/db/stats.svelte.ts (new)
export interface CurrencyVolume {
  currency: string;
  volume: number;
  change?: number; // Optional: percentage change (future feature)
}

export interface DashboardStats {
  totalTrades: number;
  totalVolume: number;
  openOrders: number;
  volumeByCurrency: CurrencyVolume[];
}
```

### DataState (Application State Entity)

Tracks the loading and error state of the data layer.

**Storage**: Svelte 5 reactive state (`$state`)

#### Attributes

| Field | Type | Description |
|-------|------|-------------|
| loading | boolean | Data operation in progress |
| error | DataError \| null | Current error state |
| initialized | boolean | DuckDB initialized successfully |
| lastRefresh | Date \| null | Last successful data refresh |

#### TypeScript Interface

```typescript
// src/lib/db/types.ts (new)
export type DataError =
  | { type: 'network'; message: string; details?: string }
  | { type: 'parse'; message: string; details?: string }
  | { type: 'memory'; message: string; details?: string }
  | { type: 'query'; message: string; details?: string };

export interface DataState {
  loading: boolean;
  error: DataError | null;
  initialized: boolean;
  lastRefresh: Date | null;
}
```

## Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                      DATA FLOW                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Remote Server              Browser (DuckDB WASM)           │
│   ┌───────────┐             ┌───────────────────────────┐   │
│   │  Parquet  │ ─────────►  │  orders table             │   │
│   │  File     │   fetch     │  (in-memory)              │   │
│   └───────────┘             └───────────────────────────┘   │
│                                       │                      │
│                                       │ SQL queries          │
│                                       ▼                      │
│                             ┌───────────────────────────┐   │
│                             │  DashboardStats           │   │
│                             │  (derived via $derived)   │   │
│                             └───────────────────────────┘   │
│                                       │                      │
│                                       │ reactive binding     │
│                                       ▼                      │
│                             ┌───────────────────────────┐   │
│                             │  UI Components            │   │
│                             │  (StatCard, OrdersTable)  │   │
│                             └───────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## State Transitions

### DataState Lifecycle

```
                    ┌──────────────┐
                    │   INITIAL    │
                    │  loading: F  │
                    │  init: F     │
                    └──────┬───────┘
                           │ app mount
                           ▼
                    ┌──────────────┐
                    │  LOADING     │
                    │  loading: T  │
                    │  init: F     │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
       ┌──────────────┐         ┌──────────────┐
       │    READY     │         │    ERROR     │
       │  loading: F  │         │  loading: F  │
       │  init: T     │         │  error: {...}│
       └──────┬───────┘         └──────┬───────┘
              │                         │
              │ refresh                 │ retry
              ▼                         │
       ┌──────────────┐                 │
       │  REFRESHING  │ ◄───────────────┘
       │  loading: T  │
       │  init: T     │
       └──────────────┘
```

### Order Status Values

| Status | Description | Transitions From |
|--------|-------------|------------------|
| open | Active order | (initial state) |
| closed_to_trading | No further trading | open |
| completed | Fully settled | open, closed_to_trading |

## Column Name Mapping

Parquet files use snake_case column names. TypeScript uses camelCase. The mapping is handled during query result processing.

| Parquet (snake_case) | TypeScript (camelCase) |
|---------------------|------------------------|
| id | id |
| reference | reference |
| fx_order_type | fxOrderType |
| market_direction | marketDirection |
| buy_amount_cents | buyAmountCents |
| sell_amount_cents | sellAmountCents |
| buy_currency | buyCurrency |
| sell_currency | sellCurrency |
| rate | rate |
| value_date | valueDate |
| creation_date | creationDate |
| execution_date | executionDate |
| status | status |
| liquidity_provider | liquidityProvider |

## Data Volumes

| Metric | Target | Notes |
|--------|--------|-------|
| Max orders | 100,000 | SC-003 requirement |
| Typical orders | 20,000 | Per data-structure-proposal.md |
| Parquet size (20K) | ~1-3 MB | Compressed |
| Memory (20K) | ~10 MB | Arrow format in memory |
| Memory (100K) | ~50 MB | Estimate |

## Validation Rules

### Order Validation

1. **id**: Must be unique, non-empty string
2. **fx_order_type**: Must be one of: 'forward', 'chain', 'spot'
3. **market_direction**: Must be one of: 'buy', 'sell'
4. **status**: Must be one of: 'open', 'closed_to_trading', 'completed'
5. **amounts**: Must be non-negative integers (cents)
6. **rate**: Must be positive decimal
7. **currencies**: Should be valid 3-letter ISO currency codes
8. **dates**: Must be valid date strings (YYYY-MM-DD format)

### Schema Validation (on load)

If Parquet schema doesn't match expected structure:
1. Log detailed error with missing/extra columns
2. Set error state with user-friendly message
3. Prevent data loading to avoid inconsistent state
