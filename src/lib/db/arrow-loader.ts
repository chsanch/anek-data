import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import type { DataError } from './types';
import type { DataCacheService } from './cache';
import type { LoadResult } from './cache-types';

/**
 * Load Arrow IPC stream data from a URL into DuckDB
 * Fetches Arrow data, converts to rows, and inserts into DuckDB table
 *
 * @note This is a low-level loader without caching or schema validation.
 * For production use, prefer {@link loadArrowWithCache} via DataProvider,
 * which handles caching and validates the schema after loading.
 */
export async function loadArrowFromUrl(
	db: AsyncDuckDB,
	url: string
): Promise<{ rowCount: number }> {
	// Fetch the Arrow IPC stream (browser will auto-decompress brotli/gzip)
	const response = await fetch(url, {
		headers: {
			Accept: 'application/vnd.apache.arrow.stream'
		}
	});

	if (!response.ok) {
		const error: DataError = {
			type: 'network',
			message: `Failed to fetch Arrow data: ${response.status} ${response.statusText}`,
			details: url
		};
		throw error;
	}

	const buffer = await response.arrayBuffer();

	if (buffer.byteLength === 0) {
		const error: DataError = {
			type: 'parse',
			message: 'Arrow data is empty',
			details: url
		};
		throw error;
	}

	// Load buffer into DuckDB using shared helper
	const rowCount = await loadArrowBuffer(db, buffer);

	if (rowCount === 0) {
		const error: DataError = {
			type: 'parse',
			message: 'Arrow table has no rows',
			details: url
		};
		throw error;
	}

	return { rowCount };
}

/**
 * Load Arrow buffer into DuckDB (internal helper)
 */
async function loadArrowBuffer(db: AsyncDuckDB, buffer: ArrayBuffer): Promise<number> {
	const conn = await db.connect();
	let rowCount = 0;

	try {
		await conn.query('DROP TABLE IF EXISTS orders');
		await conn.insertArrowFromIPCStream(new Uint8Array(buffer), {
			name: 'orders',
			create: true
		});

		const result = await conn.query('SELECT count(*) as count FROM orders');
		const row = result.toArray()[0];
		rowCount = Number(row.count);
	} finally {
		await conn.close();
	}

	return rowCount;
}

/**
 * Load Arrow IPC stream data using cache service
 * Uses IndexedDB cache when available, falls back to network
 *
 * @param db - DuckDB instance
 * @param url - URL to fetch Arrow data from
 * @param cacheService - Cache service instance for IndexedDB persistence
 * @param options - Load options
 * @returns LoadResult with cache metadata
 */
export async function loadArrowWithCache(
	db: AsyncDuckDB,
	url: string,
	cacheService: DataCacheService,
	options?: { forceRefresh?: boolean }
): Promise<LoadResult> {
	// Load data from cache or network using the cache service
	const result = await cacheService.loadData(url, {
		forceRefresh: options?.forceRefresh,
		fetchOptions: {
			headers: {
				Accept: 'application/vnd.apache.arrow.stream'
			}
		}
	});

	if (result.data.byteLength === 0) {
		const error: DataError = {
			type: 'parse',
			message: 'Arrow data is empty',
			details: url
		};
		throw error;
	}

	// Load the Arrow buffer into DuckDB
	const rowCount = await loadArrowBuffer(db, result.data);

	if (rowCount === 0) {
		const error: DataError = {
			type: 'parse',
			message: 'Arrow table has no rows',
			details: url
		};
		throw error;
	}

	return result;
}
