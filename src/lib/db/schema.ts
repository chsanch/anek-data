import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';

/**
 * Expected columns in the orders table
 * Used for schema validation after data loading
 */
export const EXPECTED_COLUMNS = [
	'id',
	'reference',
	'fx_order_type',
	'market_direction',
	'buy_amount_cents',
	'sell_amount_cents',
	'normalised_amount_cents',
	'buy_currency',
	'sell_currency',
	'rate',
	'value_date',
	'creation_date',
	'execution_date',
	'status',
	'liquidity_provider',
	'external_reference',
	'notes'
];

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
