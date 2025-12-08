import type { ColumnDef } from '@tanstack/table-core';
import type { UnifiedOrder } from './orders';

/**
 * Sort direction for a column
 */
export interface SortingColumn {
	id: string;
	desc: boolean;
}

export type SortingState = SortingColumn[];

/**
 * Filter applied to a specific column
 */
export interface ColumnFilter {
	id: string;
	value: string | string[];
}

export type ColumnFiltersState = ColumnFilter[];

/**
 * Pagination state
 */
export interface PaginationState {
	pageIndex: number;
	pageSize: number;
}

/**
 * Complete table UI state
 */
export interface TableState {
	pageIndex: number;
	pageSize: 10 | 20 | 50 | 100;
	sorting: SortingState;
	globalFilter: string;
	columnFilters: ColumnFiltersState;
}

/**
 * Default table state
 */
export const DEFAULT_TABLE_STATE: TableState = {
	pageIndex: 0,
	pageSize: 20,
	sorting: [{ id: 'creationDate', desc: true }],
	globalFilter: '',
	columnFilters: []
};

/**
 * Available filter options derived from loaded data
 */
export interface FilterOptions {
	status: string[];
	fxOrderType: string[];
	marketDirection: string[];
	buyCurrency: string[];
	sellCurrency: string[];
	liquidityProvider: string[];
}

/**
 * Extract unique filter options from orders data
 */
export function extractFilterOptions(orders: UnifiedOrder[]): FilterOptions {
	return {
		status: [...new Set(orders.map((o) => o.status))].sort(),
		fxOrderType: [...new Set(orders.map((o) => o.fxOrderType))].sort(),
		marketDirection: [...new Set(orders.map((o) => o.marketDirection))].sort(),
		buyCurrency: [...new Set(orders.map((o) => o.buyCurrency))].sort(),
		sellCurrency: [...new Set(orders.map((o) => o.sellCurrency))].sort(),
		liquidityProvider: [...new Set(orders.map((o) => o.liquidityProvider))].sort()
	};
}

/**
 * Column definitions for the orders table
 * All columns are sortable, some are filterable
 */
export const ORDER_COLUMNS: ColumnDef<UnifiedOrder>[] = [
	{
		id: 'reference',
		accessorKey: 'reference',
		header: 'Reference',
		enableSorting: true,
		enableColumnFilter: false,
		sortUndefined: 'last'
	},
	{
		id: 'fxOrderType',
		accessorKey: 'fxOrderType',
		header: 'Type',
		enableSorting: true,
		enableColumnFilter: true,
		sortUndefined: 'last'
	},
	{
		id: 'marketDirection',
		accessorKey: 'marketDirection',
		header: 'Direction',
		enableSorting: true,
		enableColumnFilter: true,
		sortUndefined: 'last'
	},
	{
		id: 'buyCurrency',
		accessorKey: 'buyCurrency',
		header: 'Buy',
		enableSorting: true,
		enableColumnFilter: true,
		sortUndefined: 'last'
	},
	{
		id: 'sellCurrency',
		accessorKey: 'sellCurrency',
		header: 'Sell',
		enableSorting: true,
		enableColumnFilter: true,
		sortUndefined: 'last'
	},
	{
		id: 'rate',
		accessorKey: 'rate',
		header: 'Rate',
		enableSorting: true,
		enableColumnFilter: false,
		sortUndefined: 'last'
	},
	{
		id: 'valueDate',
		accessorKey: 'valueDate',
		header: 'Value Date',
		enableSorting: true,
		enableColumnFilter: false,
		sortUndefined: 'last'
	},
	{
		id: 'status',
		accessorKey: 'status',
		header: 'Status',
		enableSorting: true,
		enableColumnFilter: true,
		sortUndefined: 'last'
	},
	{
		id: 'liquidityProvider',
		accessorKey: 'liquidityProvider',
		header: 'LP',
		enableSorting: true,
		enableColumnFilter: true,
		sortUndefined: 'last'
	}
];
