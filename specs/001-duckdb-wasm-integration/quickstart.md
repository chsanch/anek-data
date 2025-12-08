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
pnpm install @duckdb/duckdb-wasm
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

// Import local bundles to avoid CORS issues with CDN
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import duckdb_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_worker_eh from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
	mvp: {
		mainModule: duckdb_wasm,
		mainWorker: duckdb_worker
	},
	eh: {
		mainModule: duckdb_wasm_eh,
		mainWorker: duckdb_worker_eh
	}
};

let db: duckdb.AsyncDuckDB | null = null;

export async function initDuckDB(): Promise<duckdb.AsyncDuckDB> {
	if (db) return db;

	const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
	const worker = new Worker(bundle.mainWorker!);
	const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);

	db = new duckdb.AsyncDuckDB(logger, worker);
	await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

	return db;
}

export function getDB(): duckdb.AsyncDuckDB | null {
	return db;
}
```

> **Note**: We use local bundles via Vite's `?url` imports to avoid CORS issues when loading DuckDB workers from CDN.

### Load Parquet Data

```typescript
// src/lib/db/loader.ts
import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';

export async function loadParquetFromUrl(db: AsyncDuckDB, url: string): Promise<void> {
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
	activeCurrencies: number;
	openOrders: number;
	avgRate: number;
	totalChains: number;
}

/**
 * Safely convert BigInt or number to JavaScript number
 * DuckDB returns BigInt for large aggregations which can overflow Number
 */
function toSafeNumber(value: unknown): number {
	if (typeof value === 'bigint') {
		return Number(value.toString());
	}
	return Number(value);
}

export async function getDashboardStats(db: AsyncDuckDB): Promise<DashboardStats> {
	const conn = await db.connect();

	try {
		// Cast large aggregations to DOUBLE to avoid BigInt overflow issues
		const result = await conn.query(`
      SELECT
        COUNT(*)::BIGINT as total_trades,
        (SUM(sell_amount_cents)::DOUBLE / 100.0) as total_volume,
        COUNT(*) FILTER (WHERE status = 'open')::BIGINT as open_orders,
        AVG(rate)::DOUBLE as avg_rate,
        COUNT(*) FILTER (WHERE fx_order_type = 'chain')::BIGINT as total_chains
      FROM orders
    `);

		const row = result.toArray()[0];

		// Get unique currencies count
		const currencyResult = await conn.query(`
      SELECT COUNT(DISTINCT currency)::BIGINT as unique_currencies
      FROM (
        SELECT buy_currency as currency FROM orders
        UNION
        SELECT sell_currency as currency FROM orders
      )
    `);
		const uniqueCurrencies = toSafeNumber(currencyResult.toArray()[0].unique_currencies);

		return {
			totalTrades: toSafeNumber(row.total_trades),
			totalVolume: toSafeNumber(row.total_volume),
			activeCurrencies: uniqueCurrencies,
			openOrders: toSafeNumber(row.open_orders),
			avgRate: toSafeNumber(row.avg_rate),
			totalChains: toSafeNumber(row.total_chains)
		};
	} finally {
		await conn.close();
	}
}
```

> **Important**: Use `toSafeNumber()` helper to handle BigInt values from DuckDB aggregations that may exceed JavaScript's `Number.MAX_SAFE_INTEGER`.

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
		get stats() {
			return stats;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
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
		<StatCard label="Total Trades" value={statsService.stats.totalTrades.toLocaleString()} />
		<StatCard
			label="Total Volume"
			value={(statsService.stats.totalVolume / 100).toLocaleString()}
			suffix="EUR"
		/>
		<StatCard label="Open Orders" value={statsService.stats.openOrders.toLocaleString()} />
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
3. Run type check with `pnpm check`
4. Run tests with `pnpm test`
5. Build and deploy with `pnpm build`

## Serving Parquet Files Locally

For local development, you need a CORS-enabled server to serve the Parquet file:

```python
# sample-data/serve.py
from http.server import HTTPServer, SimpleHTTPRequestHandler

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8080), CORSRequestHandler)
    print('Serving on http://localhost:8080 with CORS enabled')
    server.serve_forever()
```

Run with: `python sample-data/serve.py`
