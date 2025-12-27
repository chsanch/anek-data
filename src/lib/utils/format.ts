import type { CurrencyMap } from '$lib/types/currency';
import { DEFAULT_MINOR_UNITS } from '$lib/types/currency';

/**
 * Format cents to currency string using the correct minor units for the currency.
 *
 * @param cents - The amount in cents (smallest currency unit)
 * @param currencyCode - ISO 4217 currency code (e.g., 'EUR', 'JPY')
 * @param currencyMap - Map of currency codes to their metadata
 * @param locale - Optional locale for number formatting (default: 'en-US')
 * @returns Formatted currency string (e.g., "12,345.67" or "1,000")
 *
 * @example
 * // EUR (2 minor units): 1000 cents → "10.00"
 * formatCurrency(1000, 'EUR', currencyMap)
 *
 * // JPY (0 minor units): 1000 cents → "1,000"
 * formatCurrency(1000, 'JPY', currencyMap)
 *
 * // KWD (3 minor units): 1000 cents → "1.000"
 * formatCurrency(1000, 'KWD', currencyMap)
 */
export function formatCurrency(
	cents: number,
	currencyCode: string,
	currencyMap: CurrencyMap,
	locale: string = 'en-US'
): string {
	const currency = currencyMap.get(currencyCode);
	const minorUnits = currency?.minorUnits ?? DEFAULT_MINOR_UNITS;

	const value = cents / Math.pow(10, minorUnits);

	return new Intl.NumberFormat(locale, {
		minimumFractionDigits: minorUnits,
		maximumFractionDigits: minorUnits
	}).format(value);
}

/**
 * Convert cents to actual currency value.
 * Useful for calculations or passing to charting libraries.
 *
 * @param cents - The amount in cents
 * @param currencyCode - ISO 4217 currency code
 * @param currencyMap - Map of currency codes to their metadata
 * @returns The actual currency value as a number
 */
export function centsToValue(cents: number, currencyCode: string, currencyMap: CurrencyMap): number {
	const currency = currencyMap.get(currencyCode);
	const minorUnits = currency?.minorUnits ?? DEFAULT_MINOR_UNITS;
	return cents / Math.pow(10, minorUnits);
}

/**
 * Format large numbers in compact notation (K, M, B)
 */
export function formatCompact(value: number): string {
	if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)}B`;
	if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
	if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
	return value.toString();
}

/**
 * Format a date string to a human-readable format using the user's locale
 * Accepts ISO date strings (YYYY-MM-DD) or Date objects
 */
export function formatDate(value: string | Date | null | undefined): string {
	if (!value) return '—';

	const date = value instanceof Date ? value : new Date(value);

	// Check for invalid date
	if (isNaN(date.getTime())) return String(value);

	return new Intl.DateTimeFormat(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	}).format(date);
}

/**
 * Format a date string to a short format (e.g., "Dec 8" or "8 Dec" depending on locale)
 */
export function formatDateShort(value: string | Date | null | undefined): string {
	if (!value) return '—';

	const date = value instanceof Date ? value : new Date(value);

	if (isNaN(date.getTime())) return String(value);

	return new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric'
	}).format(date);
}
