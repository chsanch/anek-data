import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import type { DataError } from './types';

const EXPECTED_COLUMNS = [
	'id',
	'reference',
	'fx_order_type',
	'market_direction',
	'buy_amount_cents',
	'sell_amount_cents',
	'buy_currency',
	'sell_currency',
	'rate',
	'value_date',
	'creation_date',
	'execution_date',
	'status',
	'liquidity_provider'
];

/**
 * Load a Parquet file from a URL into DuckDB
 * Creates or replaces the 'orders' table with the data
 */
export async function loadParquetFromUrl(db: AsyncDuckDB, url: string): Promise<void> {
	// Fetch the parquet file
	const response = await fetch(url);

	if (!response.ok) {
		const error: DataError = {
			type: 'network',
			message: `Failed to fetch parquet file: ${response.status} ${response.statusText}`,
			details: url
		};
		throw error;
	}

	// Get the file buffer
	const buffer = await response.arrayBuffer();

	if (buffer.byteLength === 0) {
		const error: DataError = {
			type: 'parse',
			message: 'Parquet file is empty',
			details: url
		};
		throw error;
	}

	// Register the file buffer with DuckDB
	await db.registerFileBuffer('orders.parquet', new Uint8Array(buffer));

	// Create the table from the parquet file
	const conn = await db.connect();
	try {
		await conn.query(`
			CREATE OR REPLACE TABLE orders AS
			SELECT * FROM read_parquet('orders.parquet')
		`);
	} catch (e) {
		const error: DataError = {
			type: 'parse',
			message: 'Failed to parse parquet file',
			details: e instanceof Error ? e.message : String(e)
		};
		throw error;
	} finally {
		await conn.close();
	}
}

/**
 * Validate that the loaded schema has all expected columns
 * Returns missing columns if any, otherwise empty array
 */
export async function validateSchema(db: AsyncDuckDB): Promise<string[]> {
	const conn = await db.connect();
	try {
		const result = await conn.query(`
			SELECT column_name
			FROM information_schema.columns
			WHERE table_name = 'orders'
		`);

		const columns = result.toArray().map((row) => String(row.column_name));
		const missingColumns = EXPECTED_COLUMNS.filter((col) => !columns.includes(col));

		return missingColumns;
	} finally {
		await conn.close();
	}
}

/**
 * Get the count of rows in the orders table
 */
export async function getOrderCount(db: AsyncDuckDB): Promise<number> {
	const conn = await db.connect();
	try {
		const result = await conn.query('SELECT COUNT(*) as count FROM orders');
		const row = result.toArray()[0];
		return Number(row.count);
	} finally {
		await conn.close();
	}
}
