/**
 * Currency metadata from the currencies API endpoint
 */
export interface Currency {
	code: string;
	minorUnits: number;
}

/**
 * Map of currency codes to their metadata for fast lookups
 */
export type CurrencyMap = Map<string, Currency>;

/**
 * Raw API response shape from /currencies endpoint
 */
export interface CurrencyApiResponse {
	code: string;
	minor_units: number;
}

/**
 * Default minor units for unknown currencies
 */
export const DEFAULT_MINOR_UNITS = 2;
