/**
 * Cache Service Contract
 * Feature: 003-parquet-cache
 *
 * This file defines the public API contract for the ParquetCacheService.
 * Implementation should adhere to these interfaces.
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Stored cache entry in IndexedDB
 */
export interface CachedParquet {
	/** Source URL of the parquet file (primary key) */
	url: string;
	/** Raw parquet file binary data */
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
	/** Object store name (default: 'parquet-cache') */
	storeName?: string;
}

/**
 * Result of loading data (either from cache or network)
 */
export interface LoadResult {
	/** The parquet data buffer */
	data: ArrayBuffer;
	/** Whether data came from cache */
	fromCache: boolean;
	/** Cache metadata */
	metadata: CacheMetadata;
}

// =============================================================================
// Service Interface
// =============================================================================

/**
 * ParquetCacheService provides caching for parquet files using IndexedDB.
 *
 * Usage:
 * ```typescript
 * const cache = new ParquetCacheService({ ttl: 3600000 });
 * await cache.init();
 *
 * // Load data (from cache if valid, otherwise network)
 * const result = await cache.loadData(url);
 *
 * // Force refresh from network
 * const fresh = await cache.loadData(url, { forceRefresh: true });
 *
 * // Check cache status
 * const metadata = await cache.getMetadata(url);
 * ```
 */
export interface IParquetCacheService {
	/**
	 * Initialize the cache service (opens IndexedDB)
	 * Must be called before other methods
	 */
	init(): Promise<void>;

	/**
	 * Check if valid (non-expired) cache exists for URL
	 */
	isCacheValid(url: string): Promise<boolean>;

	/**
	 * Get cache metadata without loading binary data
	 * Returns null if no cache entry exists
	 */
	getMetadata(url: string): Promise<CacheMetadata | null>;

	/**
	 * Load parquet data from cache or network
	 *
	 * @param url - Source URL of the parquet file
	 * @param options.forceRefresh - Bypass cache and fetch from network
	 * @returns LoadResult with data buffer and metadata
	 * @throws Error if network fails and no usable cache exists
	 */
	loadData(url: string, options?: { forceRefresh?: boolean }): Promise<LoadResult>;

	/**
	 * Clear cache entry for a specific URL
	 */
	clearCache(url: string): Promise<void>;

	/**
	 * Clear all cache entries
	 */
	clearAllCache(): Promise<void>;

	/**
	 * Get current cache status for UI display
	 */
	getStatus(): CacheStatus;
}

// =============================================================================
// Context Interface (for Svelte)
// =============================================================================

/**
 * Extended data context with cache awareness
 */
export interface DataContextWithCache {
	/** DuckDB instance */
	db: unknown; // AsyncDuckDB
	/** Current data state */
	state: {
		loading: boolean;
		error: unknown | null;
		initialized: boolean;
		lastRefresh: Date | null;
	};
	/** Cache-specific status */
	cacheStatus: CacheStatus;
	/** Refresh data (respects cache) */
	refresh: () => Promise<void>;
	/** Force refresh (bypasses cache) */
	forceRefresh: () => Promise<void>;
}
