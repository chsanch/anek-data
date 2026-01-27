import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import type { UnifiedOrder } from '$lib/types/orders';
import type { DailyVolume, DailyDirectionVolume, StatusDistribution } from '$lib/types/analytics';

/**
 * Export options for CSV download
 */
export interface ExportOptions {
	type: 'all' | 'date-range' | 'filtered';
	startDate?: string;
	endDate?: string;
	// For filtered exports
	referenceSearch?: string;
	columnFilters?: ColumnFilters;
	sortConfig?: SortConfig;
}

/**
 * Dashboard statistics calculated from orders data
 */
export interface DashboardStats {
	totalTrades: number;
	totalVolume: number;
	activeCurrencies: number;
	openOrders: number;
	completedOrders: number;
	closedToTradingOrders: number;
	completionRate: number;
	totalChains: number;
	ordersToday: number;
	buyCount: number;
	sellCount: number;
	topLpName: string;
	topLpOrderCount: number;
	topLpPercentage: number;
}

/**
 * Order type distribution (Forward/Chain/Spot)
 */
export interface OrderTypeDistribution {
	type: 'forward' | 'chain' | 'spot';
	count: number;
	percentage: number;
}

/**
 * Daily trend data point for sparkline visualization
 */
export interface DailyTrendPoint {
	date: string;
	value: number;
}

/**
 * Daily trends for key metrics (7-day history)
 */
export interface DailyTrends {
	trades: DailyTrendPoint[];
	volume: DailyTrendPoint[];
	openOrders: DailyTrendPoint[];
	completionRate: DailyTrendPoint[];
}

/**
 * Volume breakdown by currency
 */
export interface VolumeByCurrency {
	currency: string;
	volume: number; // Native currency volume (for display)
	volumeEur: number; // EUR-normalised volume (for comparison/percentages)
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
 * Column filters for orders query
 * Keys are column names (camelCase), values are the filter values
 */
export interface ColumnFilters {
	status?: string;
	fxOrderType?: string;
	buyCurrency?: string;
	sellCurrency?: string;
	liquidityProvider?: string;
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
 * Build WHERE clause conditions from reference search and column filters
 */
function buildWhereConditions(referenceSearch?: string, columnFilters?: ColumnFilters): string[] {
	const conditions: string[] = [];

	// Reference search (ILIKE for partial match)
	if (referenceSearch && referenceSearch.trim()) {
		const sanitized = referenceSearch.trim().replace(/'/g, "''");
		conditions.push(`reference ILIKE '%${sanitized}%'`);
	}

	// Column filters (exact match)
	if (columnFilters) {
		for (const [column, value] of Object.entries(columnFilters)) {
			if (value && value.trim()) {
				const dbColumn = COLUMN_MAP[column];
				if (dbColumn) {
					const sanitized = value.trim().replace(/'/g, "''");
					conditions.push(`${dbColumn} = '${sanitized}'`);
				}
			}
		}
	}

	return conditions;
}

/**
 * Query paginated orders from the database
 * Supports custom sorting via sortConfig parameter
 * Supports reference search via referenceSearch parameter (SQL ILIKE)
 * Supports column filters via columnFilters parameter (exact match)
 */
export async function getPaginatedOrders(
	db: AsyncDuckDB,
	limit: number,
	offset: number,
	sortConfig?: SortConfig,
	referenceSearch?: string,
	columnFilters?: ColumnFilters
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

		// Build WHERE clause from conditions
		const conditions = buildWhereConditions(referenceSearch, columnFilters);
		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

		const result = await conn.query(`
			SELECT
				id,
				reference,
				fx_order_type,
				market_direction,
				buy_amount_cents,
				sell_amount_cents,
				normalised_amount_cents,
				buy_currency,
				sell_currency,
				rate,
				value_date,
				creation_date,
				execution_date,
				status,
				liquidity_provider,
				external_reference,
				notes
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
 * Supports reference search and column filters to get accurate count for filtered results
 */
export async function getTotalOrderCount(
	db: AsyncDuckDB,
	referenceSearch?: string,
	columnFilters?: ColumnFilters
): Promise<number> {
	const conn = await db.connect();
	try {
		// Build WHERE clause from conditions
		const conditions = buildWhereConditions(referenceSearch, columnFilters);
		const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

		const result = await conn.query(`SELECT COUNT(*) as total_count FROM orders ${whereClause}`);
		const row = result.toArray()[0];
		return Number(row.total_count);
	} finally {
		await conn.close();
	}
}

/**
 * Filter options available for each filterable column
 */
export interface FilterOptions {
	status: string[];
	fxOrderType: string[];
	buyCurrency: string[];
	sellCurrency: string[];
	liquidityProvider: string[];
}

/**
 * Get unique values for all filterable columns
 * Used to populate filter dropdown options
 */
export async function getFilterOptions(db: AsyncDuckDB): Promise<FilterOptions> {
	const conn = await db.connect();
	try {
		// Query all unique values in parallel-ish (single connection, multiple queries)
		const [statusResult, typeResult, buyCurrResult, sellCurrResult, lpResult] = await Promise.all([
			conn.query('SELECT DISTINCT status FROM orders ORDER BY status'),
			conn.query('SELECT DISTINCT fx_order_type FROM orders ORDER BY fx_order_type'),
			conn.query('SELECT DISTINCT buy_currency FROM orders ORDER BY buy_currency'),
			conn.query('SELECT DISTINCT sell_currency FROM orders ORDER BY sell_currency'),
			conn.query('SELECT DISTINCT liquidity_provider FROM orders ORDER BY liquidity_provider')
		]);

		return {
			status: statusResult.toArray().map((r) => String(r.status)),
			fxOrderType: typeResult.toArray().map((r) => String(r.fx_order_type)),
			buyCurrency: buyCurrResult.toArray().map((r) => String(r.buy_currency)),
			sellCurrency: sellCurrResult.toArray().map((r) => String(r.sell_currency)),
			liquidityProvider: lpResult.toArray().map((r) => String(r.liquidity_provider))
		};
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
				normalised_amount_cents,
				buy_currency,
				sell_currency,
				rate,
				value_date,
				creation_date,
				execution_date,
				status,
				liquidity_provider,
				external_reference,
				notes
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
		normalisedAmountCents: Number(row.normalised_amount_cents),
		buyCurrency: String(row.buy_currency),
		sellCurrency: String(row.sell_currency),
		rate: Number(row.rate),
		valueDate: formatDateFromDb(row.value_date),
		creationDate: formatDateFromDb(row.creation_date),
		executionDate: row.execution_date ? formatDateFromDb(row.execution_date) : null,
		status: String(row.status) as UnifiedOrder['status'],
		liquidityProvider: String(row.liquidity_provider),
		externalReference: row.external_reference ? String(row.external_reference) : null,
		notes: row.notes ? String(row.notes) : null
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
 * Calculates: total trades, total volume, status counts, completion rate, total chains
 */
export async function getDashboardStats(db: AsyncDuckDB): Promise<DashboardStats> {
	const conn = await db.connect();
	try {
		// Cast large aggregations to DOUBLE to avoid BigInt overflow issues
		// Join with currencies to use correct minor_units per currency (default 2 if not found)
		const result = await conn.query(`
			SELECT
				COUNT(*)::BIGINT as total_trades,
				SUM(o.sell_amount_cents::DOUBLE / POWER(10, COALESCE(c.minor_units, 2))) as total_volume,
				COUNT(*) FILTER (WHERE o.status = 'open')::BIGINT as open_orders,
				COUNT(*) FILTER (WHERE o.status = 'completed')::BIGINT as completed_orders,
				COUNT(*) FILTER (WHERE o.status = 'closed_to_trading')::BIGINT as closed_to_trading_orders,
				(COUNT(*) FILTER (WHERE o.status = 'completed') * 100.0 / NULLIF(COUNT(*), 0))::DOUBLE as completion_rate,
				COUNT(*) FILTER (WHERE o.fx_order_type = 'chain')::BIGINT as total_chains,
				COUNT(*) FILTER (WHERE DATE_TRUNC('day', o.creation_date) = CURRENT_DATE)::BIGINT as orders_today,
				COUNT(*) FILTER (WHERE LOWER(o.market_direction) = 'buy')::BIGINT as buy_count,
				COUNT(*) FILTER (WHERE LOWER(o.market_direction) = 'sell')::BIGINT as sell_count
			FROM orders o
			LEFT JOIN currencies c ON o.sell_currency = c.code
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

		// Get top liquidity provider by order count
		// Calculate percentage against ALL orders (not just orders with LP) for accurate concentration measure
		const topLpResult = await conn.query(`
			SELECT
				liquidity_provider as lp_name,
				COUNT(*)::BIGINT as order_count
			FROM orders
			WHERE liquidity_provider IS NOT NULL
			GROUP BY liquidity_provider
			ORDER BY order_count DESC
			LIMIT 1
		`);
		const topLpRow = topLpResult.toArray()[0];
		const topLpName = topLpRow ? String(topLpRow.lp_name) : '';
		const topLpOrderCount = topLpRow ? toSafeNumber(topLpRow.order_count) : 0;
		const totalTrades = toSafeNumber(row.total_trades);
		// Percentage is against total orders, not just orders with LP
		const topLpPercentage = totalTrades > 0 ? (topLpOrderCount * 100.0) / totalTrades : 0;

		return {
			totalTrades: toSafeNumber(row.total_trades),
			totalVolume: toSafeNumber(row.total_volume),
			activeCurrencies: uniqueCurrencies,
			openOrders: toSafeNumber(row.open_orders),
			completedOrders: toSafeNumber(row.completed_orders),
			closedToTradingOrders: toSafeNumber(row.closed_to_trading_orders),
			completionRate: toSafeNumber(row.completion_rate) || 0,
			totalChains: toSafeNumber(row.total_chains),
			ordersToday: toSafeNumber(row.orders_today),
			buyCount: toSafeNumber(row.buy_count),
			sellCount: toSafeNumber(row.sell_count),
			topLpName,
			topLpOrderCount,
			topLpPercentage
		};
	} finally {
		await conn.close();
	}
}

/**
 * Get daily trends for key metrics (7-day history)
 * Used for sparkline visualizations in KPI cards
 * Always returns exactly 7 data points, padding missing days with zeros
 */
export async function getDailyTrends(db: AsyncDuckDB): Promise<DailyTrends> {
	const conn = await db.connect();
	try {
		// Generate a complete 7-day date series and left join actual data
		// This ensures we always get 7 points even if some days have no orders
		const result = await conn.query(`
			WITH date_series AS (
				SELECT CAST(d AS DATE) as order_date
				FROM generate_series(
					CURRENT_DATE - INTERVAL '6 days',
					CURRENT_DATE,
					INTERVAL '1 day'
				) AS t(d)
			),
			daily_stats AS (
				SELECT
					CAST(o.creation_date AS DATE) as order_date,
					COUNT(*)::BIGINT as trade_count,
					SUM(o.sell_amount_cents::DOUBLE / POWER(10, COALESCE(c.minor_units, 2))) as volume,
					COUNT(*) FILTER (WHERE o.status = 'open')::BIGINT as open_count,
					(COUNT(*) FILTER (WHERE o.status = 'completed') * 100.0 / NULLIF(COUNT(*), 0))::DOUBLE as completion_rate
				FROM orders o
				LEFT JOIN currencies c ON o.sell_currency = c.code
				WHERE o.creation_date >= CURRENT_DATE - INTERVAL '6 days'
				GROUP BY CAST(o.creation_date AS DATE)
			)
			SELECT
				ds.order_date,
				COALESCE(st.trade_count, 0) as trade_count,
				COALESCE(st.volume, 0) as volume,
				COALESCE(st.open_count, 0) as open_count,
				COALESCE(st.completion_rate, 0) as completion_rate
			FROM date_series ds
			LEFT JOIN daily_stats st ON ds.order_date = st.order_date
			ORDER BY ds.order_date ASC
		`);

		const rows = result.toArray();

		const trades: DailyTrendPoint[] = [];
		const volume: DailyTrendPoint[] = [];
		const openOrders: DailyTrendPoint[] = [];
		const completionRate: DailyTrendPoint[] = [];

		for (const row of rows) {
			const date = String(row.order_date);
			trades.push({ date, value: toSafeNumber(row.trade_count) });
			volume.push({ date, value: toSafeNumber(row.volume) });
			openOrders.push({ date, value: toSafeNumber(row.open_count) });
			completionRate.push({ date, value: toSafeNumber(row.completion_rate) });
		}

		return { trades, volume, openOrders, completionRate };
	} finally {
		await conn.close();
	}
}

/**
 * Get volume breakdown by sell currency
 * Returns top currencies by EUR-normalised volume, sorted descending
 */
export async function getVolumeByCurrency(
	db: AsyncDuckDB,
	limit: number = 5
): Promise<VolumeByCurrency[]> {
	const conn = await db.connect();
	try {
		// Use normalised_amount_cents for accurate EUR-equivalent comparison
		// Also calculate native volume for display purposes
		const result = await conn.query(`
			SELECT
				o.sell_currency as currency,
				SUM(o.sell_amount_cents::DOUBLE / POWER(10, COALESCE(c.minor_units, 2))) as volume,
				SUM(o.normalised_amount_cents::DOUBLE / 100.0) as volume_eur,
				COUNT(*)::BIGINT as order_count
			FROM orders o
			LEFT JOIN currencies c ON o.sell_currency = c.code
			GROUP BY o.sell_currency
			ORDER BY volume_eur DESC
			LIMIT ${limit}
		`);

		return result.toArray().map((row) => ({
			currency: String(row.currency),
			volume: toSafeNumber(row.volume),
			volumeEur: toSafeNumber(row.volume_eur),
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
		} else if (options.type === 'filtered') {
			// Use the same filter logic as getPaginatedOrders
			const conditions = buildWhereConditions(options.referenceSearch, options.columnFilters);
			whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
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
 * Supports: all orders, date-range filtered, or current view filters/sort
 */
export async function exportOrdersToCsv(
	db: AsyncDuckDB,
	options: ExportOptions
): Promise<{ csv: string; rowCount: number }> {
	const conn = await db.connect();
	try {
		// Build the WHERE clause based on options
		let whereClause = '';
		let orderBy = 'creation_date DESC, id DESC'; // default

		if (options.type === 'date-range' && options.startDate && options.endDate) {
			// Date range filter
			whereClause = `WHERE creation_date >= DATE '${options.startDate}' AND creation_date <= DATE '${options.endDate}'`;
		} else if (options.type === 'filtered') {
			// Current view filters (reference search + column filters)
			const conditions = buildWhereConditions(options.referenceSearch, options.columnFilters);
			whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

			// Apply current sort order if specified
			if (options.sortConfig) {
				const dbColumn = COLUMN_MAP[options.sortConfig.column];
				if (dbColumn) {
					const direction = options.sortConfig.direction.toUpperCase();
					orderBy = `${dbColumn} ${direction}, id ${direction}`;
				}
			}
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
				normalised_amount_cents,
				buy_currency,
				sell_currency,
				rate,
				value_date,
				creation_date,
				execution_date,
				status,
				liquidity_provider,
				external_reference,
				notes
			FROM orders
			${whereClause}
			ORDER BY ${orderBy}
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

// ============================================================================
// Analytics Query Functions
// ============================================================================

/**
 * Get daily aggregated volume for time-series chart
 * Returns data in Lightweight Charts format (time, value)
 */
export async function getDailyVolume(
	db: AsyncDuckDB,
	startDate: string,
	endDate: string
): Promise<DailyVolume[]> {
	const conn = await db.connect();
	try {
		// Join with currencies to use correct minor_units per currency (default 2 if not found)
		const result = await conn.query(`
			SELECT
				strftime(o.creation_date, '%Y-%m-%d') as time,
				SUM(o.sell_amount_cents::DOUBLE / POWER(10, COALESCE(c.minor_units, 2))) as value,
				COUNT(*)::BIGINT as trade_count
			FROM orders o
			LEFT JOIN currencies c ON o.sell_currency = c.code
			WHERE o.creation_date >= DATE '${startDate}' AND o.creation_date <= DATE '${endDate}'
			GROUP BY o.creation_date
			ORDER BY o.creation_date
		`);

		return result.toArray().map((row) => ({
			time: String(row.time),
			value: toSafeNumber(row.value),
			tradeCount: toSafeNumber(row.trade_count)
		}));
	} finally {
		await conn.close();
	}
}

/**
 * Get daily buy vs sell volume breakdown for histogram chart
 * Returns buy and sell volumes separately for each day
 */
export async function getDailyDirectionVolume(
	db: AsyncDuckDB,
	startDate: string,
	endDate: string
): Promise<DailyDirectionVolume[]> {
	const conn = await db.connect();
	try {
		// Join with currencies for both buy and sell currencies (default 2 minor units if not found)
		const result = await conn.query(`
			SELECT
				strftime(o.creation_date, '%Y-%m-%d') as time,
				SUM(CASE WHEN o.market_direction = 'buy'
					THEN o.buy_amount_cents::DOUBLE / POWER(10, COALESCE(bc.minor_units, 2))
					ELSE 0 END) as buy_volume,
				SUM(CASE WHEN o.market_direction = 'sell'
					THEN o.sell_amount_cents::DOUBLE / POWER(10, COALESCE(sc.minor_units, 2))
					ELSE 0 END) as sell_volume
			FROM orders o
			LEFT JOIN currencies bc ON o.buy_currency = bc.code
			LEFT JOIN currencies sc ON o.sell_currency = sc.code
			WHERE o.creation_date >= DATE '${startDate}' AND o.creation_date <= DATE '${endDate}'
			GROUP BY o.creation_date
			ORDER BY o.creation_date
		`);

		return result.toArray().map((row) => ({
			time: String(row.time),
			buyVolume: toSafeNumber(row.buy_volume),
			sellVolume: toSafeNumber(row.sell_volume)
		}));
	} finally {
		await conn.close();
	}
}

/**
 * Get order count and percentage breakdown by status
 * Returns data for HTML/CSS bar visualization
 */
export async function getStatusDistribution(db: AsyncDuckDB): Promise<StatusDistribution[]> {
	const conn = await db.connect();
	try {
		const result = await conn.query(`
			SELECT
				status,
				COUNT(*)::BIGINT as count,
				(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ())::DOUBLE as percentage
			FROM orders
			GROUP BY status
			ORDER BY count DESC
		`);

		return result.toArray().map((row) => ({
			status: String(row.status) as StatusDistribution['status'],
			count: toSafeNumber(row.count),
			percentage: toSafeNumber(row.percentage)
		}));
	} finally {
		await conn.close();
	}
}

/**
 * Get order count and percentage breakdown by order type (Forward/Chain/Spot)
 * Returns data for distribution visualization
 */
export async function getOrderTypeDistribution(db: AsyncDuckDB): Promise<OrderTypeDistribution[]> {
	const conn = await db.connect();
	try {
		// Filter to known types in SQL so percentages are computed correctly (sum to 100%)
		const result = await conn.query(`
			SELECT
				LOWER(fx_order_type) as type,
				COUNT(*)::BIGINT as count,
				(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ())::DOUBLE as percentage
			FROM orders
			WHERE LOWER(fx_order_type) IN ('forward', 'chain', 'spot')
			GROUP BY LOWER(fx_order_type)
			ORDER BY count DESC
		`);

		return result.toArray().map((row) => ({
			type: String(row.type) as OrderTypeDistribution['type'],
			count: toSafeNumber(row.count),
			percentage: toSafeNumber(row.percentage)
		}));
	} finally {
		await conn.close();
	}
}
