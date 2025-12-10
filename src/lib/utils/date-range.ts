import type { TimeRangePreset, TimeRange } from '$lib/types/analytics';

/**
 * Calculate start and end dates from a time range preset
 * Returns dates in YYYY-MM-DD format for SQL queries
 */
export function calculateDateRange(preset: TimeRangePreset): TimeRange {
	const end = new Date();
	const start = new Date();

	switch (preset) {
		case '7d':
			start.setDate(end.getDate() - 7);
			break;
		case '30d':
			start.setDate(end.getDate() - 30);
			break;
		case '90d':
			start.setDate(end.getDate() - 90);
			break;
		case 'all':
			// Use a very early date to capture all data
			start.setFullYear(2000, 0, 1);
			break;
	}

	return {
		start: formatDate(start),
		end: formatDate(end)
	};
}

/**
 * Format a Date object to YYYY-MM-DD string
 */
function formatDate(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}
