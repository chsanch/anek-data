# Research: DuckDB WASM Integration

**Feature**: 001-duckdb-wasm-integration
**Date**: 2025-12-08

## Research Tasks

### 1. DuckDB WASM Integration with Svelte 5

**Decision**: Use `@duckdb/duckdb-wasm` package with a singleton pattern via Svelte context

**Rationale**:

- Official DuckDB WASM package provides full SQL support including Parquet loading
- Singleton pattern ensures single database instance across components
- Svelte context API allows safe sharing without global state (SSR-safe per Constitution)
- Aligns with Constitution Principle IV (Component Independence)

**Alternatives Considered**:

- Global module state: Rejected due to SSR risks and Constitution compliance
- Multiple instances: Rejected for memory efficiency and consistency
- sql.js: Rejected - DuckDB has better Parquet support and columnar performance

**Implementation Pattern**:

```typescript
// src/lib/db/duckdb.ts
import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;

export async function initDuckDB(): Promise<duckdb.AsyncDuckDB> {
	if (db) return db;

	const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
	const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

	const worker = new Worker(bundle.mainWorker!);
	const logger = new duckdb.ConsoleLogger();
	db = new duckdb.AsyncDuckDB(logger, worker);
	await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

	return db;
}
```

### 2. Parquet File Loading Strategy

**Decision**: Fetch parquet as ArrayBuffer, register with DuckDB, create table via COPY

**Rationale**:

- DuckDB WASM natively supports Parquet via `registerFileBuffer`
- Single fetch operation minimizes network calls
- COPY command efficiently loads data into queryable table
- Meets SC-001 performance target (< 10s for files under 10MB)

**Alternatives Considered**:

- Stream parsing: More complex, not needed for target file sizes (< 10MB)
- CSV format: Larger file sizes, slower parsing
- JSON format: 5-10x larger than Parquet, slower loading

**Implementation Pattern**:

```typescript
export async function loadParquetFromUrl(db: AsyncDuckDB, url: string): Promise<void> {
	const response = await fetch(url);
	const buffer = await response.arrayBuffer();

	await db.registerFileBuffer('orders.parquet', new Uint8Array(buffer));

	const conn = await db.connect();
	await conn.query(`
    CREATE OR REPLACE TABLE orders AS
    SELECT * FROM read_parquet('orders.parquet')
  `);
	await conn.close();
}
```

### 3. State Management for Dashboard Statistics

**Decision**: Use Svelte 5 `$state` and `$derived` runes with a reactive data service

**Rationale**:

- Constitution Principle IV requires Svelte 5 runes for reactive state
- `$derived` automatically recalculates when source data changes
- Clean separation between data layer (DuckDB) and UI layer (runes)
- No additional state management libraries needed (per Constitution)

**Alternatives Considered**:

- Svelte stores: Legacy pattern, Constitution specifies runes
- Global state module: SSR risks per Constitution
- Context with stores: Unnecessary complexity

**Implementation Pattern**:

```typescript
// src/lib/db/stats.svelte.ts
export function createDashboardStats() {
  let stats = $state({
    totalTrades: 0,
    totalVolume: 0,
    openOrders: 0,
    volumeByCurrency: [] as CurrencyVolume[]
  });

  async function refresh(db: AsyncDuckDB) {
    const conn = await db.connect();
    // Execute queries and update stats
    stats.totalTrades = /* query result */;
    await conn.close();
  }

  return {
    get stats() { return stats; },
    refresh
  };
}
```

### 4. Environment Variable Configuration

**Decision**: Use SvelteKit's `$env/static/public` for parquet URL

**Rationale**:

- Spec clarification: URL configured via environment variable at build/deploy time
- `PUBLIC_` prefix makes it available to client-side code
- Static import enables tree-shaking and build-time validation
- Standard SvelteKit pattern per documentation

**Implementation**:

```typescript
// .env
PUBLIC_PARQUET_URL=https://cdn.example.com/orders.parquet

// Usage in code
import { PUBLIC_PARQUET_URL } from '$env/static/public';
```

### 5. Error Handling Strategy

**Decision**: Typed error states with user-friendly messages

**Rationale**:

- FR-005 requires clear error messages for network/parsing failures
- SC-005 requires error display within 2 seconds
- Constitution Principle IV requires independent error handling per component

**Error Categories**:

1. **Network errors**: Failed to fetch, timeout, CORS
2. **Parse errors**: Invalid Parquet, schema mismatch
3. **Memory errors**: File too large for browser
4. **Query errors**: SQL execution failures

**Implementation Pattern**:

```typescript
type DataError =
	| { type: 'network'; message: string }
	| { type: 'parse'; message: string }
	| { type: 'memory'; message: string }
	| { type: 'query'; message: string };

let error = $state<DataError | null>(null);
let loading = $state(false);
```

### 6. Data Schema Mapping

**Decision**: Map Parquet columns to UnifiedOrder TypeScript interface

**Rationale**:

- Spec FR-012 defines exact schema requirements
- Data-structure-proposal.md confirms column naming convention
- Type safety ensures data integrity

**Schema Mapping** (Parquet → TypeScript):
| Parquet Column | TypeScript Field | Type |
|----------------|------------------|------|
| id | id | string |
| reference | reference | string |
| fx_order_type | fxOrderType | 'forward' \| 'chain' \| 'spot' |
| market_direction | marketDirection | 'buy' \| 'sell' |
| buy_amount_cents | buyAmountCents | number |
| sell_amount_cents | sellAmountCents | number |
| buy_currency | buyCurrency | string |
| sell_currency | sellCurrency | string |
| rate | rate | number |
| value_date | valueDate | string |
| creation_date | creationDate | string |
| execution_date | executionDate | string \| null |
| status | status | 'open' \| 'closed_to_trading' \| 'completed' |
| liquidity_provider | liquidityProvider | string |

### 7. Performance Optimization

**Decision**: Lazy initialization with loading states, query caching

**Rationale**:

- Constitution Principle III defines performance targets
- SC-004 requires loading visibility within 500ms
- SC-006 requires < 100ms pagination

**Optimizations**:

1. Initialize DuckDB asynchronously on app mount
2. Show loading indicator immediately (within 500ms)
3. Cache aggregation results until data refresh
4. Use SQL for pagination (`LIMIT/OFFSET`) instead of client-side slicing

## Dependencies

| Package             | Version | Purpose             |
| ------------------- | ------- | ------------------- |
| @duckdb/duckdb-wasm | ^1.29.0 | DuckDB WASM runtime |

## File Structure

```
src/lib/
├── db/
│   ├── duckdb.ts           # DuckDB initialization singleton
│   ├── queries.ts          # SQL query definitions
│   ├── loader.ts           # Parquet loading logic
│   └── stats.svelte.ts     # Reactive stats with runes
├── components/
│   ├── DataProvider.svelte # Context provider for DB
│   └── RefreshButton.svelte # Manual refresh UI
└── types/
    └── orders.ts           # Existing UnifiedOrder type
```

## Outstanding Questions

None - all research tasks resolved.
