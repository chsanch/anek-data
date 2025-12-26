<script lang="ts">
	import { setContext, onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
	import {
		PUBLIC_PARQUET_URL,
		PUBLIC_CACHE_TTL,
		PUBLIC_ARROW_URL,
		PUBLIC_DATA_SOURCE
	} from '$env/static/public';
	import { initDuckDB } from '$lib/db/duckdb';
	import { loadParquetWithCache, validateSchema } from '$lib/db/loader';
	import { loadArrowFromUrl } from '$lib/db/arrow-loader';
	import type { DataState, DataError } from '$lib/db/types';
	import { DATA_PROVIDER_KEY } from '$lib/db/context';
	import { ParquetCacheService } from '$lib/db/cache';
	import { INITIAL_CACHE_STATUS } from '$lib/db/cache-types';
	import type { CacheStatus } from '$lib/db/cache-types';

	const dataSource = PUBLIC_DATA_SOURCE || 'parquet';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Parse TTL from environment variable
	const cacheTtl = parseInt(PUBLIC_CACHE_TTL || '', 10) || 60 * 60 * 1000;

	let db: AsyncDuckDB | null = $state(null);
	let cacheService: ParquetCacheService | null = $state(null);
	let cacheStatus: CacheStatus = $state({ ...INITIAL_CACHE_STATUS });
	let dataState: DataState = $state({
		loading: true,
		error: null,
		initialized: false,
		lastRefresh: null
	});

	async function loadData(forceRefresh: boolean = false) {
		dataState.loading = true;
		dataState.error = null;

		try {
			// Initialize DuckDB if not already done
			if (!db) {
				db = await initDuckDB();
			}

			if (dataSource === 'arrow') {
				// Load from Arrow endpoint (Rust server)
				await loadArrowFromUrl(db, PUBLIC_ARROW_URL);

				// Validate schema
				const missingColumns = await validateSchema(db);
				if (missingColumns.length > 0) {
					const error: DataError = {
						type: 'parse',
						message: 'Arrow data is missing required columns',
						details: `Missing: ${missingColumns.join(', ')}`
					};
					throw error;
				}

				dataState.initialized = true;
				dataState.lastRefresh = new Date();
			} else {
				// Load from Parquet with cache (original behavior)
				// Initialize cache service if not already done
				if (!cacheService) {
					cacheService = new ParquetCacheService({ ttl: cacheTtl });
					await cacheService.init();
				}

				// Load parquet data with cache
				const result = await loadParquetWithCache(db, PUBLIC_PARQUET_URL, cacheService, {
					forceRefresh
				});

				// Update cache status from service
				cacheStatus = cacheService.getStatus();

				// Validate schema
				const missingColumns = await validateSchema(db);
				if (missingColumns.length > 0) {
					const error: DataError = {
						type: 'parse',
						message: 'Parquet file is missing required columns',
						details: `Missing: ${missingColumns.join(', ')}`
					};
					throw error;
				}

				dataState.initialized = true;
				dataState.lastRefresh = new Date(result.metadata.timestamp);
			}
		} catch (e) {
			// Update cache status on error
			if (cacheService) {
				cacheStatus = cacheService.getStatus();
			}

			// Check if it's already a DataError
			if (e && typeof e === 'object' && 'type' in e) {
				dataState.error = e as DataError;
			} else {
				dataState.error = {
					type: 'network',
					message: 'Failed to load data',
					details: e instanceof Error ? e.message : String(e)
				};
			}
		} finally {
			dataState.loading = false;
		}
	}

	async function refresh() {
		await loadData(false);
	}

	async function forceRefresh() {
		await loadData(true);
	}

	// Set context for child components
	setContext(DATA_PROVIDER_KEY, {
		get db() {
			return db;
		},
		get state() {
			return dataState;
		},
		get cacheStatus() {
			return cacheStatus;
		},
		refresh,
		forceRefresh
	});

	onMount(() => {
		loadData();
	});
</script>

{@render children()}
