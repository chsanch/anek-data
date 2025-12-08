import { openDB, type IDBPDatabase } from 'idb';
import type {
	CacheConfig,
	CacheMetadata,
	CacheStatus,
	CachedParquet,
	LoadResult,
	ParquetCacheDB
} from './cache-types';
import { DEFAULT_CACHE_CONFIG, INITIAL_CACHE_STATUS } from './cache-types';

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
 * ```
 */
export class ParquetCacheService {
	private db: IDBPDatabase<ParquetCacheDB> | null = null;
	private config: Required<CacheConfig>;
	private status: CacheStatus = { ...INITIAL_CACHE_STATUS };

	constructor(config: CacheConfig = {}) {
		this.config = {
			ttl: config.ttl ?? DEFAULT_CACHE_CONFIG.ttl,
			dbName: config.dbName ?? DEFAULT_CACHE_CONFIG.dbName,
			storeName: config.storeName ?? DEFAULT_CACHE_CONFIG.storeName
		};
	}

	/**
	 * Initialize the cache service (opens IndexedDB)
	 * Must be called before other methods
	 */
	async init(): Promise<void> {
		if (this.db) return;

		try {
			this.db = await openDB<ParquetCacheDB>(this.config.dbName, 1, {
				upgrade(db) {
					if (!db.objectStoreNames.contains('parquet-cache')) {
						db.createObjectStore('parquet-cache', { keyPath: 'url' });
					}
				}
			});
		} catch (error) {
			console.warn('Failed to initialize IndexedDB cache:', error);
			// Graceful degradation - cache will be unavailable but app will work
		}
	}

	/**
	 * Check if valid (non-expired) cache exists for URL
	 */
	async isCacheValid(url: string): Promise<boolean> {
		if (!this.db) return false;

		try {
			const entry = await this.db.get('parquet-cache', url);
			if (!entry) return false;

			const now = Date.now();
			return entry.expiresAt > now;
		} catch (error) {
			console.warn('Failed to check cache validity:', error);
			return false;
		}
	}

	/**
	 * Get cache metadata without loading binary data
	 * Returns null if no cache entry exists
	 */
	async getMetadata(url: string): Promise<CacheMetadata | null> {
		if (!this.db) return null;

		try {
			const entry = await this.db.get('parquet-cache', url);
			if (!entry) return null;

			return {
				url: entry.url,
				timestamp: entry.timestamp,
				expiresAt: entry.expiresAt,
				fileSize: entry.fileSize,
				etag: entry.etag
			};
		} catch (error) {
			console.warn('Failed to get cache metadata:', error);
			return null;
		}
	}

	/**
	 * Load parquet data from cache or network
	 *
	 * @param url - Source URL of the parquet file
	 * @param options.forceRefresh - Bypass cache and fetch from network
	 * @returns LoadResult with data buffer and metadata
	 * @throws Error if network fails and no usable cache exists
	 */
	async loadData(url: string, options?: { forceRefresh?: boolean }): Promise<LoadResult> {
		const forceRefresh = options?.forceRefresh ?? false;

		this.updateStatus({ state: 'checking' });

		// Check cache first (unless force refresh)
		if (!forceRefresh && this.db) {
			try {
				const entry = await this.db.get('parquet-cache', url);
				if (entry) {
					const now = Date.now();
					const isValid = entry.expiresAt > now;

					if (isValid) {
						// Cache hit - return cached data
						this.updateStatus({
							state: 'ready',
							timestamp: entry.timestamp,
							isStale: false,
							source: 'cache'
						});

						return {
							data: entry.data,
							fromCache: true,
							metadata: {
								url: entry.url,
								timestamp: entry.timestamp,
								expiresAt: entry.expiresAt,
								fileSize: entry.fileSize,
								etag: entry.etag
							}
						};
					}
				}
			} catch (error) {
				console.warn('Failed to read from cache:', error);
				// Continue to network fetch
			}
		}

		// Cache miss or force refresh - fetch from network
		this.updateStatus({ state: 'loading' });

		try {
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
			}

			const data = await response.arrayBuffer();
			const etag = response.headers.get('etag');

			// Store in cache
			const metadata = await this.storeCache(url, data, etag);

			this.updateStatus({
				state: 'ready',
				timestamp: metadata.timestamp,
				isStale: false,
				source: 'network'
			});

			return {
				data,
				fromCache: false,
				metadata
			};
		} catch (error) {
			// Network failed - try to use stale cache as fallback
			if (this.db) {
				try {
					const entry = await this.db.get('parquet-cache', url);
					if (entry) {
						console.warn('Network failed, using stale cache:', error);
						this.updateStatus({
							state: 'ready',
							timestamp: entry.timestamp,
							isStale: true,
							source: 'cache'
						});

						return {
							data: entry.data,
							fromCache: true,
							metadata: {
								url: entry.url,
								timestamp: entry.timestamp,
								expiresAt: entry.expiresAt,
								fileSize: entry.fileSize,
								etag: entry.etag
							}
						};
					}
				} catch (cacheError) {
					console.warn('Failed to read stale cache:', cacheError);
				}
			}

			// No cache available - propagate error
			this.updateStatus({ state: 'error' });
			throw error;
		}
	}

	/**
	 * Clear cache entry for a specific URL
	 */
	async clearCache(url: string): Promise<void> {
		if (!this.db) return;

		try {
			await this.db.delete('parquet-cache', url);
		} catch (error) {
			console.warn('Failed to clear cache:', error);
		}
	}

	/**
	 * Clear all cache entries
	 */
	async clearAllCache(): Promise<void> {
		if (!this.db) return;

		try {
			await this.db.clear('parquet-cache');
		} catch (error) {
			console.warn('Failed to clear all cache:', error);
		}
	}

	/**
	 * Get current cache status for UI display
	 */
	getStatus(): CacheStatus {
		return { ...this.status };
	}

	/**
	 * Store parquet data in cache
	 * @internal
	 */
	private async storeCache(
		url: string,
		data: ArrayBuffer,
		etag: string | null = null
	): Promise<CacheMetadata> {
		const now = Date.now();
		const entry: CachedParquet = {
			url,
			data,
			timestamp: now,
			expiresAt: now + this.config.ttl,
			fileSize: data.byteLength,
			etag
		};

		if (this.db) {
			try {
				await this.db.put('parquet-cache', entry);
			} catch (error) {
				console.warn('Failed to store cache:', error);
			}
		}

		return {
			url: entry.url,
			timestamp: entry.timestamp,
			expiresAt: entry.expiresAt,
			fileSize: entry.fileSize,
			etag: entry.etag
		};
	}

	/**
	 * Update internal status
	 * @internal
	 */
	private updateStatus(updates: Partial<CacheStatus>): void {
		this.status = { ...this.status, ...updates };
	}
}
