import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import type { DataError } from './types';

/**
 * Load Arrow IPC stream data from a URL into DuckDB
 * Fetches Arrow data, converts to rows, and inserts into DuckDB table
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

	// Create the table schema in DuckDB
	const conn = await db.connect();
	let rowCount = 0;

	try {
		// Drop existing table if exists
		await conn.query('DROP TABLE IF EXISTS orders');

		// Efficiently insert Arrow IPC stream directly into DuckDB
		// This avoids parsing the table in JS and avoids version mismatches with apache-arrow
		await conn.insertArrowFromIPCStream(new Uint8Array(buffer), {
			name: 'orders',
			create: true
		});

		// Get the row count
		const result = await conn.query('SELECT count(*) as count FROM orders');
		const row = result.toArray()[0];
		rowCount = Number(row.count);
	} catch (e) {
		const error: DataError = {
			type: 'parse',
			message: 'Failed to load Arrow data into DuckDB',
			details: e instanceof Error ? e.message : String(e)
		};
		throw error;
	} finally {
		await conn.close();
	}

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
