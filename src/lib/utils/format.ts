/**
 * Format cents to currency string with 2 decimal places
 */
export function formatCurrency(cents: number): string {
	return new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(cents / 100);
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
