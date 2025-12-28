import type { DBSchema } from 'idb';

/**
 * Stored cache entry in IndexedDB
 */
export interface CachedData {
	/** Source URL of the data file (primary key) */
	url: string;
	/** Raw binary data (Arrow IPC stream) */
	data: ArrayBuffer;
	/** Unix timestamp (ms) when cached */
	timestamp: number;
	/** Unix timestamp (ms) when cache expires */
	expiresAt: number;
	/** Size of data in bytes */
	fileSize: number;
	/** Server ETag header value, if available */
	etag: string | null;
}

/**
 * Cache metadata without the binary data (for status checks)
 */
export interface CacheMetadata {
	url: string;
	timestamp: number;
	expiresAt: number;
	fileSize: number;
	etag: string | null;
}

/**
 * Current cache state
 */
export type CacheState = 'idle' | 'checking' | 'loading' | 'ready' | 'error';

/**
 * Runtime cache status for UI consumption
 */
export interface CacheStatus {
	/** Current cache state */
	state: CacheState;
	/** When data was last downloaded (null if never) */
	timestamp: number | null;
	/** True if using expired cache as fallback */
	isStale: boolean;
	/** Where current data came from */
	source: 'cache' | 'network' | null;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
	/** Time-to-live in milliseconds (default: 3600000 = 1 hour) */
	ttl?: number;
	/** IndexedDB database name (default: 'anec-data-cache') */
	dbName?: string;
	/** Object store name (default: 'data-cache') */
	storeName?: string;
}

/**
 * Result of loading data (either from cache or network)
 */
export interface LoadResult {
	/** The data buffer (Arrow IPC stream) */
	data: ArrayBuffer;
	/** Whether data came from cache */
	fromCache: boolean;
	/** Cache metadata */
	metadata: CacheMetadata;
}

/**
 * IndexedDB schema for data cache
 */
export interface DataCacheDB extends DBSchema {
	'data-cache': {
		key: string;
		value: CachedData;
	};
}

/**
 * Default cache configuration values
 */
export const DEFAULT_CACHE_CONFIG = {
	ttl: 60 * 60 * 1000, // 1 hour
	dbName: 'anec-data-cache',
	storeName: 'data-cache'
} as const;

/**
 * Initial cache status
 */
export const INITIAL_CACHE_STATUS: CacheStatus = {
	state: 'idle',
	timestamp: null,
	isStale: false,
	source: null
};
