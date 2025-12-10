/**
 * Analytics type definitions for chart data
 * Based on data-model.md specifications
 */

/**
 * Represents aggregated trading volume for a single day
 * Used by VolumeChart (AreaSeries)
 */
export interface DailyVolume {
	/** Date in YYYY-MM-DD format (Lightweight Charts time format) */
	time: string;
	/** Total volume in currency units (cents / 100) */
	value: number;
	/** Number of trades on this day */
	tradeCount: number;
}

/**
 * Represents buy/sell volume breakdown for a single day
 * Used by DirectionChart (HistogramSeries)
 */
export interface DailyDirectionVolume {
	/** Date in YYYY-MM-DD format */
	time: string;
	/** Total buy volume in currency units */
	buyVolume: number;
	/** Total sell volume in currency units */
	sellVolume: number;
}

/**
 * Represents count and percentage of orders by status
 * Used by StatusDistribution (HTML/CSS bars)
 */
export interface StatusDistribution {
	/** Order status */
	status: 'open' | 'closed_to_trading' | 'completed';
	/** Number of orders with this status */
	count: number;
	/** Percentage of total orders (0-100) */
	percentage: number;
}

/**
 * Time range preset options
 */
export type TimeRangePreset = '7d' | '30d' | '90d' | 'all';

/**
 * Calculated time range with start and end dates
 */
export interface TimeRange {
	/** Start date (inclusive) in YYYY-MM-DD format */
	start: string;
	/** End date (inclusive) in YYYY-MM-DD format */
	end: string;
}

/**
 * Preset configuration for time range selector
 */
export interface TimeRangeOption {
	/** Preset identifier */
	value: TimeRangePreset;
	/** Display label */
	label: string;
}

/**
 * Available time range presets
 */
export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
	{ value: '7d', label: '7 Days' },
	{ value: '30d', label: '30 Days' },
	{ value: '90d', label: '90 Days' },
	{ value: 'all', label: 'All Time' }
];

/**
 * Default time range preset (30 days per spec)
 */
export const DEFAULT_TIME_RANGE: TimeRangePreset = '30d';
