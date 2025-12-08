# Data Model: Enhanced Orders Table

**Feature**: 002-enhanced-orders-table
**Date**: 2025-12-08

## Existing Entities (Unchanged)

### UnifiedOrder

Source: `src/lib/types/orders.ts`

The orders data structure remains unchanged. TanStack Table wraps this existing type.

```typescript
interface UnifiedOrder {
	id: string;
	reference: string;
	fxOrderType: 'spot' | 'forward' | 'chain';
	marketDirection: 'buy' | 'sell';
	buyAmountCents: number;
	sellAmountCents: number;
	buyCurrency: string;
	sellCurrency: string;
	rate: number;
	valueDate: string;
	creationDate: string;
	executionDate: string | null;
	status: 'open' | 'completed' | 'closed_to_trading';
	liquidityProvider: string;
}
```

## New Entities

### TableState

Manages the complete UI state for the enhanced orders table.

```typescript
interface TableState {
	// Pagination
	pageIndex: number; // Current page (0-based)
	pageSize: number; // Rows per page: 10 | 20 | 50 | 100

	// Sorting
	sorting: SortingState; // TanStack SortingState type

	// Filtering
	globalFilter: string; // Text search across all columns
	columnFilters: ColumnFiltersState; // TanStack column filters
}

// TanStack provided types
type SortingState = Array<{
	id: string; // Column ID
	desc: boolean; // Sort direction
}>;

type ColumnFiltersState = Array<{
	id: string; // Column ID
	value: unknown; // Filter value (string for select, string[] for multi-select)
}>;
```

### ColumnDefinition

Configuration for each table column. Extends TanStack's column definition.

```typescript
interface OrderColumnDefinition {
	id: string;
	header: string;
	accessorKey: keyof UnifiedOrder;

	// Sorting config
	sortable: boolean;
	sortUndefined?: 'first' | 'last'; // Where to place null values

	// Filter config
	filterable: boolean;
	filterType?: 'text' | 'select' | 'multi-select';
	filterOptions?: string[]; // For select types, populated dynamically

	// Display config
	cell?: (value: unknown) => string; // Custom cell renderer
	align?: 'left' | 'right';
}
```

### FilterOptions

Pre-computed unique values for dropdown filters.

```typescript
interface FilterOptions {
	status: string[]; // ['open', 'completed', 'closed_to_trading']
	fxOrderType: string[]; // ['spot', 'forward', 'chain']
	buyCurrency: string[]; // Dynamic from data
	sellCurrency: string[]; // Dynamic from data
}
```

### ExportOptions (Extended)

Extends existing export options to support filtered export.

```typescript
interface ExportOptions {
	type: 'all' | 'date-range' | 'filtered';

	// For date-range type
	startDate?: string;
	endDate?: string;

	// For filtered type (new)
	orderIds?: string[]; // IDs of orders to export
	sortColumn?: string; // Apply sort order to export
	sortDirection?: 'asc' | 'desc';
}
```

## State Relationships

```
┌─────────────────────────────────────────────────────┐
│                    +page.svelte                      │
│  ┌───────────────────────────────────────────────┐  │
│  │              DataProvider Context              │  │
│  │  - db: AsyncDuckDB                            │  │
│  │  - orders: UnifiedOrder[] (all loaded)        │  │
│  └───────────────────────────────────────────────┘  │
│                        │                             │
│                        ▼                             │
│  ┌───────────────────────────────────────────────┐  │
│  │              OrdersTable Component            │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │         TanStack Table Instance         │  │  │
│  │  │  - data: UnifiedOrder[]                 │  │  │
│  │  │  - state: TableState                    │  │  │
│  │  │  - columns: OrderColumnDefinition[]     │  │  │
│  │  └─────────────────────────────────────────┘  │  │
│  │                      │                        │  │
│  │      ┌───────────────┼───────────────┐       │  │
│  │      ▼               ▼               ▼       │  │
│  │  TableToolbar   Table Body    Pagination     │  │
│  │  - search       - sorted      - pageIndex    │  │
│  │  - filters      - filtered    - pageSize     │  │
│  │  - export btn   - paginated   - controls     │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Validation Rules

### Pagination

- `pageIndex` >= 0
- `pageSize` in [10, 20, 50, 100]
- `pageIndex` < ceil(filteredCount / pageSize)

### Sorting

- At most one column sorted at a time (single sort mode)
- Column must have `sortable: true`

### Filtering

- `globalFilter`: Any string, debounced 300ms
- Column filters: Value must match one of `filterOptions` for select types
- Date range: `startDate` <= `endDate`

## State Transitions

### Sort Toggle

```
Initial state: sorting = []
Click column A: sorting = [{ id: 'A', desc: false }]
Click column A: sorting = [{ id: 'A', desc: true }]
Click column A: sorting = []
Click column B: sorting = [{ id: 'B', desc: false }]
```

### Filter Application

```
Initial: columnFilters = [], globalFilter = ''
Set status filter: columnFilters = [{ id: 'status', value: 'open' }]
Add type filter: columnFilters = [{ id: 'status', value: 'open' }, { id: 'fxOrderType', value: 'forward' }]
Set search: globalFilter = 'USD'
Clear all: columnFilters = [], globalFilter = ''
```

### Page Size Change

```
Current: pageIndex = 5, pageSize = 20 (showing rows 100-119)
Change to pageSize = 50
Result: pageIndex = 0 (reset to first page)
```
