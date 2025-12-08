<script lang="ts">
	import { setContext, onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
	import { PUBLIC_PARQUET_URL } from '$env/static/public';
	import { initDuckDB } from '$lib/db/duckdb';
	import { loadParquetFromUrl, validateSchema } from '$lib/db/loader';
	import type { DataState, DataError } from '$lib/db/types';
	import { DATA_PROVIDER_KEY } from '$lib/db/context';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	let db: AsyncDuckDB | null = $state(null);
	let dataState: DataState = $state({
		loading: true,
		error: null,
		initialized: false,
		lastRefresh: null
	});

	async function loadData() {
		dataState.loading = true;
		dataState.error = null;

		try {
			// Initialize DuckDB if not already done
			if (!db) {
				db = await initDuckDB();
			}

			// Load parquet data
			await loadParquetFromUrl(db, PUBLIC_PARQUET_URL);

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
			dataState.lastRefresh = new Date();
		} catch (e) {
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
		await loadData();
	}

	// Set context for child components
	setContext(DATA_PROVIDER_KEY, {
		get db() {
			return db;
		},
		get state() {
			return dataState;
		},
		refresh
	});

	onMount(() => {
		loadData();
	});
</script>

{@render children()}
