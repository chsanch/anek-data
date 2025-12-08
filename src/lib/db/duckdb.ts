import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;
let initPromise: Promise<duckdb.AsyncDuckDB> | null = null;

/**
 * Initialize DuckDB WASM singleton
 * Uses jsdelivr bundles for loading the WASM modules
 * Returns existing instance if already initialized
 */
export async function initDuckDB(): Promise<duckdb.AsyncDuckDB> {
	// Return existing instance if available
	if (db) return db;

	// Return pending initialization if in progress
	if (initPromise) return initPromise;

	// Start initialization
	initPromise = (async () => {
		const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
		const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

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
