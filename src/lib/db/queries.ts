import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import type { UnifiedOrder } from '$lib/types/orders';

/**
 * Query paginated orders from the database
 * Orders are sorted by creation_date DESC, then id DESC
 */
export async function getPaginatedOrders(
	db: AsyncDuckDB,
	limit: number,
	offset: number
): Promise<UnifiedOrder[]> {
	const conn = await db.connect();
	try {
		const result = await conn.query(`
			SELECT
				id,
				reference,
				fx_order_type,
				market_direction,
				buy_amount_cents,
				sell_amount_cents,
				buy_currency,
				sell_currency,
				rate,
				value_date,
				creation_date,
				execution_date,
				status,
				liquidity_provider
			FROM orders
			ORDER BY creation_date DESC, id DESC
			LIMIT ${limit} OFFSET ${offset}
		`);

		return result.toArray().map(mapRowToOrder);
	} finally {
		await conn.close();
	}
}

/**
 * Get total count of orders for pagination
 */
export async function getTotalOrderCount(db: AsyncDuckDB): Promise<number> {
	const conn = await db.connect();
	try {
		const result = await conn.query('SELECT COUNT(*) as total_count FROM orders');
		const row = result.toArray()[0];
		return Number(row.total_count);
	} finally {
		await conn.close();
	}
}

/**
 * Map a DuckDB result row to UnifiedOrder interface
 * Handles snake_case to camelCase conversion
 */
function mapRowToOrder(row: Record<string, unknown>): UnifiedOrder {
	return {
		id: String(row.id),
		reference: String(row.reference),
		fxOrderType: String(row.fx_order_type) as UnifiedOrder['fxOrderType'],
		marketDirection: String(row.market_direction) as UnifiedOrder['marketDirection'],
		buyAmountCents: Number(row.buy_amount_cents),
		sellAmountCents: Number(row.sell_amount_cents),
		buyCurrency: String(row.buy_currency),
		sellCurrency: String(row.sell_currency),
		rate: Number(row.rate),
		valueDate: formatDate(row.value_date),
		creationDate: formatDate(row.creation_date),
		executionDate: row.execution_date ? formatDate(row.execution_date) : null,
		status: String(row.status) as UnifiedOrder['status'],
		liquidityProvider: String(row.liquidity_provider)
	};
}

/**
 * Format date value from DuckDB to ISO string
 */
function formatDate(value: unknown): string {
	if (value instanceof Date) {
		return value.toISOString().split('T')[0];
	}
	return String(value);
}
