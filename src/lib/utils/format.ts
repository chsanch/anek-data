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
