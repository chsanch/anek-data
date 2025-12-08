import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import type { UnifiedOrder } from '$lib/types/orders';

/**
 * Dashboard statistics calculated from orders data
 */
export interface DashboardStats {
	totalTrades: number;
	totalVolume: number;
	activeCurrencies: number;
	openOrders: number;
	avgRate: number;
	totalChains: number;
}

/**
 * Volume breakdown by currency
 */
export interface VolumeByCurrency {
	currency: string;
	volume: number;
	orderCount: number;
}

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
		valueDate: formatDateFromDb(row.value_date),
		creationDate: formatDateFromDb(row.creation_date),
		executionDate: row.execution_date ? formatDateFromDb(row.execution_date) : null,
		status: String(row.status) as UnifiedOrder['status'],
		liquidityProvider: String(row.liquidity_provider)
	};
}

/**
 * Format date value from DuckDB to ISO string
 * DuckDB can return dates as Date objects, timestamps (numbers), or strings
 */
function formatDateFromDb(value: unknown): string {
	if (value === null || value === undefined) {
		return '';
	}

	// Handle Date objects
	if (value instanceof Date) {
		return value.toISOString().split('T')[0];
	}

	// Handle numeric timestamps (milliseconds from epoch)
	if (typeof value === 'number' || typeof value === 'bigint') {
		const timestamp = typeof value === 'bigint' ? Number(value) : value;
		const date = new Date(timestamp);
		if (!isNaN(date.getTime())) {
			return date.toISOString().split('T')[0];
		}
	}

	// Handle string dates (already formatted or ISO strings)
	const strValue = String(value);

	// If it looks like a numeric string (timestamp), convert it
	if (/^\d+$/.test(strValue)) {
		const date = new Date(Number(strValue));
		if (!isNaN(date.getTime())) {
			return date.toISOString().split('T')[0];
		}
	}

	return strValue;
}

/**
 * Safely convert BigInt or number to JavaScript number
 * DuckDB returns BigInt for large aggregations which can overflow Number
 */
function toSafeNumber(value: unknown): number {
	if (typeof value === 'bigint') {
		// For very large BigInts, convert to string first then parse
		return Number(value.toString());
	}
	return Number(value);
}

/**
 * Get dashboard statistics from orders data
 * Calculates: total trades, total volume, active currencies, open orders, avg rate, total chains
 */
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

/**
 * Get volume breakdown by sell currency
 * Returns top currencies by volume, sorted descending
 */
export async function getVolumeByCurrency(
	db: AsyncDuckDB,
	limit: number = 5
): Promise<VolumeByCurrency[]> {
	const conn = await db.connect();
	try {
		const result = await conn.query(`
			SELECT
				sell_currency as currency,
				(SUM(sell_amount_cents)::DOUBLE / 100.0) as volume,
				COUNT(*)::BIGINT as order_count
			FROM orders
			GROUP BY sell_currency
			ORDER BY volume DESC
			LIMIT ${limit}
		`);

		return result.toArray().map((row) => ({
			currency: String(row.currency),
			volume: toSafeNumber(row.volume),
			orderCount: toSafeNumber(row.order_count)
		}));
	} finally {
		await conn.close();
	}
}
