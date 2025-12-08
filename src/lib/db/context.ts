import { getContext } from 'svelte';
import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import type { DataState } from './types';

export interface DataProviderContext {
	readonly db: AsyncDuckDB | null;
	readonly state: DataState;
	refresh: () => Promise<void>;
}

const CONTEXT_KEY = 'data-provider';

/**
 * Get the DataProvider context
 * Must be called from a component that is a child of DataProvider
 */
export function getDataContext(): DataProviderContext {
	const context = getContext<DataProviderContext>(CONTEXT_KEY);
	if (!context) {
		throw new Error('getDataContext must be called from a child of DataProvider');
	}
	return context;
}

/**
 * Context key for DataProvider
 * Exported for use in DataProvider.svelte
 */
export { CONTEXT_KEY as DATA_PROVIDER_KEY };
