# Quickstart: DuckDB WASM Integration

**Feature**: 001-duckdb-wasm-integration
**Date**: 2025-12-08

## Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- A Parquet file URL for testing (or use the mock data generator)

## Setup

### 1. Install Dependencies

```bash
npm install @duckdb/duckdb-wasm
```

### 2. Configure Environment

Create or update `.env` file:

```bash
# URL to the orders Parquet file
PUBLIC_PARQUET_URL=https://your-cdn.com/orders.parquet
```

For local development, you can use a local file server or the included test fixture.

### 3. TypeScript Configuration

Add to `src/app.d.ts`:

```typescript
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

// Ensure PUBLIC_PARQUET_URL is typed
declare module '$env/static/public' {
  export const PUBLIC_PARQUET_URL: string;
}

export {};
```

## Basic Usage

### Initialize DuckDB

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

export function getDB(): duckdb.AsyncDuckDB | null {
  return db;
}
```

### Load Parquet Data

```typescript
// src/lib/db/loader.ts
import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';

export async function loadParquetFromUrl(
  db: AsyncDuckDB,
  url: string
): Promise<void> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch parquet: ${response.status}`);
  }

  const buffer = await response.arrayBuffer();
  await db.registerFileBuffer('orders.parquet', new Uint8Array(buffer));

  const conn = await db.connect();
  try {
    await conn.query(`
      CREATE OR REPLACE TABLE orders AS
      SELECT * FROM read_parquet('orders.parquet')
    `);
  } finally {
    await conn.close();
  }
}
```

### Query Statistics

```typescript
// src/lib/db/queries.ts
import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';

export interface DashboardStats {
  totalTrades: number;
  totalVolume: number;
  openOrders: number;
}

export async function getDashboardStats(db: AsyncDuckDB): Promise<DashboardStats> {
  const conn = await db.connect();

  try {
    const result = await conn.query(`
      SELECT
        COUNT(*) as total_trades,
        COALESCE(SUM(sell_amount_cents), 0) as total_volume,
        COUNT(*) FILTER (WHERE status = 'open') as open_orders
      FROM orders
    `);

    const row = result.toArray()[0];

    return {
      totalTrades: Number(row.total_trades),
      totalVolume: Number(row.total_volume),
      openOrders: Number(row.open_orders)
    };
  } finally {
    await conn.close();
  }
}
```

### Create Reactive Stats Service

```typescript
// src/lib/db/stats.svelte.ts
import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import { getDashboardStats } from './queries';

export function createStatsService() {
  let stats = $state({
    totalTrades: 0,
    totalVolume: 0,
    openOrders: 0
  });

  let loading = $state(false);
  let error = $state<Error | null>(null);

  async function refresh(db: AsyncDuckDB) {
    loading = true;
    error = null;

    try {
      const result = await getDashboardStats(db);
      stats.totalTrades = result.totalTrades;
      stats.totalVolume = result.totalVolume;
      stats.openOrders = result.openOrders;
    } catch (e) {
      error = e instanceof Error ? e : new Error(String(e));
    } finally {
      loading = false;
    }
  }

  return {
    get stats() { return stats; },
    get loading() { return loading; },
    get error() { return error; },
    refresh
  };
}
```

### Use in Svelte Component

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { PUBLIC_PARQUET_URL } from '$env/static/public';
  import { initDuckDB } from '$lib/db/duckdb';
  import { loadParquetFromUrl } from '$lib/db/loader';
  import { createStatsService } from '$lib/db/stats.svelte';
  import StatCard from '$lib/components/StatCard.svelte';

  const statsService = createStatsService();

  let dbLoading = $state(true);
  let dbError = $state<Error | null>(null);

  onMount(async () => {
    try {
      const db = await initDuckDB();
      await loadParquetFromUrl(db, PUBLIC_PARQUET_URL);
      await statsService.refresh(db);
    } catch (e) {
      dbError = e instanceof Error ? e : new Error(String(e));
    } finally {
      dbLoading = false;
    }
  });
</script>

{#if dbLoading}
  <p>Loading data...</p>
{:else if dbError}
  <p>Error: {dbError.message}</p>
{:else}
  <div class="stats-grid">
    <StatCard
      label="Total Trades"
      value={statsService.stats.totalTrades.toLocaleString()}
    />
    <StatCard
      label="Total Volume"
      value={(statsService.stats.totalVolume / 100).toLocaleString()}
      suffix="EUR"
    />
    <StatCard
      label="Open Orders"
      value={statsService.stats.openOrders.toLocaleString()}
    />
  </div>
{/if}
```

## Testing

### Unit Test Example

```typescript
// tests/unit/db/queries.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as duckdb from '@duckdb/duckdb-wasm';
import { getDashboardStats } from '$lib/db/queries';

describe('getDashboardStats', () => {
  let db: duckdb.AsyncDuckDB;

  beforeAll(async () => {
    // Initialize DuckDB for tests
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    const worker = new Worker(bundle.mainWorker!);
    const logger = new duckdb.ConsoleLogger();
    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

    // Create test data
    const conn = await db.connect();
    await conn.query(`
      CREATE TABLE orders (
        id VARCHAR PRIMARY KEY,
        sell_amount_cents BIGINT,
        status VARCHAR
      )
    `);
    await conn.query(`
      INSERT INTO orders VALUES
        ('1', 100000, 'open'),
        ('2', 200000, 'completed'),
        ('3', 150000, 'open')
    `);
    await conn.close();
  });

  afterAll(async () => {
    await db.terminate();
  });

  it('should return correct stats', async () => {
    const stats = await getDashboardStats(db);

    expect(stats.totalTrades).toBe(3);
    expect(stats.totalVolume).toBe(450000);
    expect(stats.openOrders).toBe(2);
  });
});
```

## Common Issues

### CORS Errors

If you see CORS errors when fetching the Parquet file, ensure your server sends appropriate headers:

```
Access-Control-Allow-Origin: *
```

Or configure your CDN/server to allow your domain.

### Memory Issues

For large datasets (> 100K records), monitor browser memory. DuckDB WASM is efficient but has limits:

```typescript
// Check approximate memory usage
const conn = await db.connect();
const result = await conn.query(`
  SELECT COUNT(*) * 100 as approx_bytes FROM orders
`);
console.log('Approximate memory:', result.toArray()[0].approx_bytes);
```

### Worker Loading

DuckDB WASM requires web workers. Ensure your bundler is configured correctly:

```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    exclude: ['@duckdb/duckdb-wasm']
  }
});
```

## Next Steps

1. Run `/speckit.tasks` to generate the implementation task list
2. Implement tasks following the priority order (P1 first)
3. Run tests with `npm run test`
4. Build and deploy with `npm run build`
