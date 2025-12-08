import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import type { UnifiedOrder } from '$lib/types/orders';

/**
 * Export options for CSV download
 */
export interface ExportOptions {
	type: 'all' | 'date-range';
	startDate?: string;
	endDate?: string;
}

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
 * Sort configuration for orders query
 */
export interface SortConfig {
	column: string;
	direction: 'asc' | 'desc';
}

/**
 * Map from camelCase column names to snake_case DB columns
 */
const COLUMN_MAP: Record<string, string> = {
	reference: 'reference',
	fxOrderType: 'fx_order_type',
	marketDirection: 'market_direction',
	buyCurrency: 'buy_currency',
	sellCurrency: 'sell_currency',
	rate: 'rate',
	valueDate: 'value_date',
	status: 'status',
	liquidityProvider: 'liquidity_provider',
	creationDate: 'creation_date'
};

/**
 * Query paginated orders from the database
 * Supports custom sorting via sortConfig parameter
 * Supports reference search via referenceSearch parameter (SQL ILIKE)
 */
export async function getPaginatedOrders(
	db: AsyncDuckDB,
	limit: number,
	offset: number,
	sortConfig?: SortConfig,
	referenceSearch?: string
): Promise<UnifiedOrder[]> {
	const conn = await db.connect();
	try {
		// Build ORDER BY clause
		let orderBy = 'creation_date DESC, id DESC'; // default
		if (sortConfig) {
			const dbColumn = COLUMN_MAP[sortConfig.column];
			if (dbColumn) {
				const direction = sortConfig.direction.toUpperCase();
				orderBy = `${dbColumn} ${direction}, id ${direction}`;
			}
		}

		// Build WHERE clause for reference search
		let whereClause = '';
		if (referenceSearch && referenceSearch.trim()) {
			// Escape single quotes in search term to prevent SQL injection
			const sanitized = referenceSearch.trim().replace(/'/g, "''");
			whereClause = `WHERE reference ILIKE '%${sanitized}%'`;
		}

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
			${whereClause}
			ORDER BY ${orderBy}
			LIMIT ${limit} OFFSET ${offset}
		`);

		return result.toArray().map(mapRowToOrder);
	} finally {
		await conn.close();
	}
}

/**
 * Get total count of orders for pagination
 * Supports reference search filter to get accurate count for filtered results
 */
export async function getTotalOrderCount(db: AsyncDuckDB, referenceSearch?: string): Promise<number> {
	const conn = await db.connect();
	try {
		// Build WHERE clause for reference search
		let whereClause = '';
		if (referenceSearch && referenceSearch.trim()) {
			const sanitized = referenceSearch.trim().replace(/'/g, "''");
			whereClause = `WHERE reference ILIKE '%${sanitized}%'`;
		}

		const result = await conn.query(`SELECT COUNT(*) as total_count FROM orders ${whereClause}`);
		const row = result.toArray()[0];
		return Number(row.total_count);
	} finally {
		await conn.close();
	}
}

/**
 * Get all orders from the database without pagination
 * Used with TanStack Table for client-side sorting/filtering/pagination
 */
export async function getAllOrders(db: AsyncDuckDB): Promise<UnifiedOrder[]> {
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
		`);

		return result.toArray().map(mapRowToOrder);
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

/**
 * Get the count of orders that would be exported based on options
 * Used to preview export size before downloading
 */
export async function getExportOrderCount(
	db: AsyncDuckDB,
	options: ExportOptions
): Promise<number> {
	const conn = await db.connect();
	try {
		let whereClause = '';
		if (options.type === 'date-range' && options.startDate && options.endDate) {
			whereClause = `WHERE creation_date >= DATE '${options.startDate}' AND creation_date <= DATE '${options.endDate}'`;
		}

		const result = await conn.query(`
			SELECT COUNT(*)::BIGINT as count FROM orders ${whereClause}
		`);
		return toSafeNumber(result.toArray()[0].count);
	} finally {
		await conn.close();
	}
}

/**
 * Export orders to CSV format
 * Returns the CSV content as a string
 */
export async function exportOrdersToCsv(
	db: AsyncDuckDB,
	options: ExportOptions
): Promise<{ csv: string; rowCount: number }> {
	const conn = await db.connect();
	try {
		// Build the WHERE clause based on options
		// creation_date is stored as DATE type in the parquet file
		let whereClause = '';
		if (options.type === 'date-range' && options.startDate && options.endDate) {
			// Compare dates directly using DATE literals
			whereClause = `WHERE creation_date >= DATE '${options.startDate}' AND creation_date <= DATE '${options.endDate}'`;
		}

		// First get the count
		const countResult = await conn.query(`
			SELECT COUNT(*)::BIGINT as count FROM orders ${whereClause}
		`);
		const rowCount = toSafeNumber(countResult.toArray()[0].count);

		// Query data - dates are timestamps, format them in JavaScript
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
			${whereClause}
			ORDER BY creation_date DESC, id DESC
		`);

		const rows = result.toArray();

		// Build CSV
		const headers = [
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

		// Date fields that need formatting
		const dateFields = ['value_date', 'creation_date', 'execution_date'];

		const csvLines = [headers.join(',')];

		for (const row of rows) {
			const values = headers.map((header) => {
				let value = row[header];

				if (value === null || value === undefined) {
					return '';
				}

				// Format date fields from timestamps
				if (dateFields.includes(header) && typeof value === 'number') {
					const date = new Date(value);
					if (!isNaN(date.getTime())) {
						value = date.toISOString().split('T')[0];
					}
				}

				// Escape quotes and wrap in quotes if contains comma or quote
				const strValue = String(value);
				if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
					return `"${strValue.replace(/"/g, '""')}"`;
				}
				return strValue;
			});
			csvLines.push(values.join(','));
		}

		return {
			csv: csvLines.join('\n'),
			rowCount
		};
	} finally {
		await conn.close();
	}
}

/**
 * Trigger a CSV file download in the browser
 */
export function downloadCsv(content: string, filename: string): void {
	const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
