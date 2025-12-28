/**
 * Error types for the data layer
 * Discriminated union for type-safe error handling
 */
export type DataError =
	| { type: 'network'; message: string; details?: string }
	| { type: 'parse'; message: string; details?: string }
	| { type: 'schema'; message: string; details?: string }
	| { type: 'memory'; message: string; details?: string }
	| { type: 'query'; message: string; details?: string };

/**
 * Application state for the data layer
 * Tracks loading, error, and initialization states
 */
export interface DataState {
	loading: boolean;
	error: DataError | null;
	initialized: boolean;
	lastRefresh: Date | null;
}

/**
 * Currency volume breakdown for dashboard statistics
 */
export interface CurrencyVolume {
	currency: string;
	volume: number;
}

/**
 * Dashboard statistics derived from order data
 */
export interface DashboardStats {
	totalTrades: number;
	totalVolume: number;
	openOrders: number;
	volumeByCurrency: CurrencyVolume[];
}
