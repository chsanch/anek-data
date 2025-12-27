import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import type { Currency, CurrencyMap, CurrencyApiResponse } from '$lib/types/currency';
import type { DataError } from './types';

/**
 * Fetch currencies from API and load into DuckDB
 * Returns a CurrencyMap for fast JavaScript lookups
 *
 * @param db - DuckDB instance
 * @param endpoint - URL to fetch currencies from
 * @returns CurrencyMap for use in formatting functions
 */
export async function loadCurrencies(db: AsyncDuckDB, endpoint: string): Promise<CurrencyMap> {
	// Fetch from API
	const response = await fetch(endpoint);

	if (!response.ok) {
		const error: DataError = {
			type: 'network',
			message: `Failed to fetch currencies: ${response.status} ${response.statusText}`,
			details: endpoint
		};
		throw error;
	}

	const data: CurrencyApiResponse[] = await response.json();

	// Transform to internal format
	const currencies: Currency[] = data.map((c) => ({
		code: c.code,
		minorUnits: c.minor_units
	}));

	// Store in DuckDB for SQL JOINs
	const conn = await db.connect();
	try {
		await conn.query(`
			CREATE TABLE IF NOT EXISTS currencies (
				code VARCHAR PRIMARY KEY,
				minor_units INTEGER NOT NULL
			)
		`);

		// Clear existing data and reload
		await conn.query(`DELETE FROM currencies`);

		// Insert all currencies
		for (const c of currencies) {
			await conn.query(`INSERT INTO currencies VALUES ('${c.code}', ${c.minorUnits})`);
		}
	} finally {
		await conn.close();
	}

	// Return map for fast JS lookups
	return new Map(currencies.map((c) => [c.code, c]));
}

/**
 * Create an empty CurrencyMap (used when currencies endpoint is unavailable)
 */
export function createEmptyCurrencyMap(): CurrencyMap {
	return new Map();
}

/**
 * Get minor units for a currency code
 * Falls back to 2 if currency is unknown
 */
export function getMinorUnits(currencyMap: CurrencyMap, currencyCode: string): number {
	return currencyMap.get(currencyCode)?.minorUnits ?? 2;
}
