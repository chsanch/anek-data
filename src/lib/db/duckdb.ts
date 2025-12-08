import * as duckdb from '@duckdb/duckdb-wasm';
import duckdb_wasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import duckdb_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import duckdb_worker_eh from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

let db: duckdb.AsyncDuckDB | null = null;
let initPromise: Promise<duckdb.AsyncDuckDB> | null = null;

// Manual bundle configuration for Vite compatibility
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

/**
 * Initialize DuckDB WASM singleton
 * Uses local bundles for Vite compatibility (avoids CORS issues with CDN)
 * Returns existing instance if already initialized
 */
export async function initDuckDB(): Promise<duckdb.AsyncDuckDB> {
	// Return existing instance if available
	if (db) return db;

	// Return pending initialization if in progress
	if (initPromise) return initPromise;

	// Start initialization
	initPromise = (async () => {
		// Select the best bundle for the current browser
		const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);

		const worker = new Worker(bundle.mainWorker!);
		const logger = new duckdb.ConsoleLogger();

		const instance = new duckdb.AsyncDuckDB(logger, worker);
		await instance.instantiate(bundle.mainModule, bundle.pthreadWorker);

		db = instance;
		return instance;
	})();

	return initPromise;
}

/**
 * Get the current DuckDB instance
 * Returns null if not yet initialized
 */
export function getDB(): duckdb.AsyncDuckDB | null {
	return db;
}

/**
 * Reset DuckDB instance (useful for testing or cleanup)
 */
export async function resetDB(): Promise<void> {
	if (db) {
		await db.terminate();
		db = null;
		initPromise = null;
	}
}
