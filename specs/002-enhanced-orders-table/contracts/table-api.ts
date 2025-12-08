/**
 * Table API Contracts
 * Feature: 002-enhanced-orders-table
 *
 * These types define the API contract for the enhanced orders table.
 * Implementation should conform to these interfaces.
 */

import type { UnifiedOrder } from '$lib/types/orders';

// ============================================================================
// Table State Types
// ============================================================================

/**
 * Sort direction for a column
 */
export interface SortingColumn {
	id: keyof UnifiedOrder;
	desc: boolean;
}

export type SortingState = SortingColumn[];

/**
 * Filter applied to a specific column
 */
export interface ColumnFilter {
	id: keyof UnifiedOrder;
	value: string | string[]; // string for single select, string[] for multi-select
}

export type ColumnFiltersState = ColumnFilter[];

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

// ============================================================================
// Column Definition Types
// ============================================================================

/**
 * Filter configuration for a column
 */
export interface FilterConfig {
	type: 'text' | 'select' | 'multi-select';
	options?: string[]; // For select types, populated from data
}

/**
 * Column definition for the orders table
 */
export interface OrderColumnDef {
	id: string;
	header: string;
	accessorKey: keyof UnifiedOrder;

	// Feature flags
	sortable: boolean;
	filterable: boolean;

	// Optional config
	filterConfig?: FilterConfig;
	align?: 'left' | 'right';
	width?: string;

	// Custom formatting
	format?: (value: unknown, row: UnifiedOrder) => string;
}

/**
 * Column definitions for the orders table
 */
export const ORDER_COLUMNS: OrderColumnDef[] = [
	{
		id: 'reference',
		header: 'Reference',
		accessorKey: 'reference',
		sortable: true,
		filterable: false
	},
	{
		id: 'fxOrderType',
		header: 'Type',
		accessorKey: 'fxOrderType',
		sortable: true,
		filterable: true,
		filterConfig: { type: 'select' }
	},
	{
		id: 'marketDirection',
		header: 'Direction',
		accessorKey: 'marketDirection',
		sortable: true,
		filterable: true,
		filterConfig: { type: 'select' }
	},
	{
		id: 'buyCurrency',
		header: 'Buy',
		accessorKey: 'buyCurrency',
		sortable: true,
		filterable: true,
		filterConfig: { type: 'select' }
	},
	{
		id: 'sellCurrency',
		header: 'Sell',
		accessorKey: 'sellCurrency',
		sortable: true,
		filterable: true,
		filterConfig: { type: 'select' }
	},
	{
		id: 'rate',
		header: 'Rate',
		accessorKey: 'rate',
		sortable: true,
		filterable: false,
		align: 'right'
	},
	{
		id: 'valueDate',
		header: 'Value Date',
		accessorKey: 'valueDate',
		sortable: true,
		filterable: false
	},
	{
		id: 'status',
		header: 'Status',
		accessorKey: 'status',
		sortable: true,
		filterable: true,
		filterConfig: { type: 'select' }
	},
	{
		id: 'liquidityProvider',
		header: 'LP',
		accessorKey: 'liquidityProvider',
		sortable: true,
		filterable: true,
		filterConfig: { type: 'select' }
	}
];

// ============================================================================
// Filter Options Types
// ============================================================================

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

// ============================================================================
// Export Types (Extended)
// ============================================================================

/**
 * Extended export options supporting filtered export
 */
export interface ExtendedExportOptions {
	type: 'all' | 'date-range' | 'filtered';

	// For date-range
	startDate?: string;
	endDate?: string;

	// For filtered export
	orderIds?: string[];
}

// ============================================================================
// Component Props Contracts
// ============================================================================

/**
 * Props for OrdersTable component
 */
export interface OrdersTableProps {
	orders: UnifiedOrder[];
	loading?: boolean;
	onExport?: (options: ExtendedExportOptions) => void;
}

/**
 * Props for TableToolbar component
 */
export interface TableToolbarProps {
	globalFilter: string;
	onGlobalFilterChange: (value: string) => void;
	columnFilters: ColumnFiltersState;
	onColumnFiltersChange: (filters: ColumnFiltersState) => void;
	filterOptions: FilterOptions;
	filteredCount: number;
	totalCount: number;
	onClearFilters: () => void;
	onExport: () => void;
}

/**
 * Props for FilterDropdown component
 */
export interface FilterDropdownProps {
	label: string;
	options: string[];
	value: string | null;
	onChange: (value: string | null) => void;
}

/**
 * Props for PageSizeSelector component
 */
export interface PageSizeSelectorProps {
	value: 10 | 20 | 50 | 100;
	onChange: (size: 10 | 20 | 50 | 100) => void;
}
