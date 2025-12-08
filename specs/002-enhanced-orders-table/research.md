# Research: Enhanced Orders Table

**Feature**: 002-enhanced-orders-table
**Date**: 2025-12-08

## Research Questions

### 1. TanStack Table vs Custom Implementation

**Decision**: Use @tanstack/svelte-table

**Rationale**:

- Headless library (~15KB gzipped) - no styling conflicts with existing design
- Battle-tested state management for sorting, filtering, pagination
- Native Svelte adapter using `createSvelteTable`
- Avoids reinventing complex interaction patterns
- Active maintenance and community support

**Alternatives Considered**:

- **Custom implementation**: Would require building sorting/filtering state machine from scratch. Higher risk of bugs, more code to maintain.
- **AG Grid**: Feature-rich but heavy (~200KB+), overkill for single table, brings its own styling.
- **Svelte Headless Table**: Less mature, smaller community, fewer examples.

---

### 2. Data Source Strategy: TanStack vs DuckDB Queries

**Decision**: Hybrid approach - SQL for sorting/pagination, TanStack for UI state management

**Rationale** (Updated after implementation):

- **SQL-based sorting**: DuckDB handles `ORDER BY` across entire dataset (73K+ rows)
- **SQL-based pagination**: DuckDB handles `LIMIT/OFFSET` for fast page loads
- **TanStack for UI**: Manages sort state, click handlers, visual indicators
- This approach sorts the **entire dataset**, not just the visible page

**Why we pivoted from client-side sorting**:

- Loading all 73K orders for client-side sorting was too slow (~5+ seconds)
- Users expect sorting to apply to the entire dataset, not just current page
- DuckDB is extremely fast for sorting (<50ms for 73K rows)

**Implementation Notes**:

```typescript
// queries.ts - SQL handles sorting
export async function getPaginatedOrders(
	db: AsyncDuckDB,
	limit: number,
	offset: number,
	sortConfig?: SortConfig // { column: 'rate', direction: 'desc' }
): Promise<UnifiedOrder[]> {
	const orderBy = sortConfig
		? `${COLUMN_MAP[sortConfig.column]} ${sortConfig.direction.toUpperCase()}`
		: 'creation_date DESC';

	return db.query(`SELECT * FROM orders ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`);
}

// OrdersTable.svelte - TanStack manages UI state only
const table = createSvelteTable({
	data: orders, // Current page data from SQL
	columns: ORDER_COLUMNS,
	manualSorting: true, // Tell TanStack we handle sorting externally
	onSortingChange: (updater) => {
		// Convert TanStack state to SQL sort config and re-fetch
		onSortChange?.({ column: sort.id, direction: sort.desc ? 'desc' : 'asc' });
	},
	getCoreRowModel: getCoreRowModel()
	// No getSortedRowModel - SQL handles sorting
});
```

---

### 3. TanStack Table with Svelte 5 Runes

**Decision**: Use custom adapter with `@tanstack/table-core` (not `@tanstack/svelte-table`)

**Rationale** (Updated after implementation):

- `@tanstack/svelte-table` is **incompatible with Svelte 5** - it imports from `svelte/internal` which was removed
- Created custom adapter based on [walker-tx/svelte5-tanstack-table-reference](https://github.com/walker-tx/svelte5-tanstack-table-reference)
- Adapter uses `$state` and `$effect.pre` for reactive state management

**Custom Adapter Structure** (`src/lib/components/table/`):

```text
table/
├── index.ts              # Re-exports from @tanstack/table-core
├── table.svelte.ts       # createSvelteTable function with mergeObjects
├── FlexRender.svelte     # Flexible cell/header rendering
└── render-component.ts   # Helper classes for component/snippet rendering
```

**Implementation Pattern**:

```typescript
// table.svelte.ts
import { createTable, type TableOptions } from '@tanstack/table-core';

export function createSvelteTable<TData>(options: TableOptions<TData>) {
	const table = createTable(resolvedOptions);
	let state = $state(table.initialState);

	$effect.pre(() => {
		table.setOptions((prev) =>
			mergeObjects(prev, options, {
				state: mergeObjects(state, options.state || {}),
				onStateChange: (updater) => {
					state = typeof updater === 'function' ? updater(state) : updater;
				}
			})
		);
	});

	return table;
}

// mergeObjects preserves getters for reactivity (from SolidJS)
export function mergeObjects(...sources) {
	/* ... */
}
```

**Key Insight**: The `mergeObjects` function is critical - it preserves getter properties so TanStack can react to Svelte 5's `$state` changes.

---

### 4. Filter Options Population

**Decision**: Pre-compute unique values from loaded data

**Rationale**:

- Status options: Extract unique `status` values from orders array
- Currency options: Extract unique `buyCurrency` and `sellCurrency` values
- Type options: Extract unique `fxOrderType` values
- Compute once after data load, cache for dropdown rendering

**Implementation**:

```typescript
const statusOptions = $derived([...new Set(orders.map((o) => o.status))]);
const typeOptions = $derived([...new Set(orders.map((o) => o.fxOrderType))]);
const currencyOptions = $derived(
	[...new Set([...orders.map((o) => o.buyCurrency), ...orders.map((o) => o.sellCurrency)])].sort()
);
```

---

### 5. Export Integration with Filters

**Decision**: Pass filtered row IDs to export function

**Rationale**:

- TanStack provides `table.getFilteredRowModel().rows` for current filtered set
- Extract order IDs from filtered rows
- Modify `exportOrdersToCsv` to accept optional ID array for filtering
- Preserves existing export modal UX, adds "Export filtered" option

**Implementation**:

```typescript
async function handleExport(options: ExportOptions) {
	if (options.type === 'filtered') {
		const filteredIds = $table.getFilteredRowModel().rows.map((row) => row.original.id);
		return exportOrdersToCsv(db, { ...options, orderIds: filteredIds });
	}
	return exportOrdersToCsv(db, options);
}
```

---

### 6. Performance with 10,000+ Rows

**Decision**: Use TanStack's built-in virtualization if needed

**Rationale**:

- TanStack Table includes `@tanstack/virtual` for row virtualization
- Only render visible rows in DOM, recycle on scroll
- Initial implementation without virtualization; add if performance degrades
- Constitution requires <200ms for complex queries - filtering 10K rows in JS is well within this

**Monitoring**:

- Measure filter/sort times in development
- Add virtualization if render time exceeds 100ms

---

## Resolved Clarifications

| Item                            | Resolution                                                       |
| ------------------------------- | ---------------------------------------------------------------- |
| TanStack Svelte 5 compatibility | Confirmed: Uses reactive stores compatible with Svelte 5         |
| Bundle size impact              | ~15KB gzipped - acceptable per constitution simplicity principle |
| Filter debouncing               | Use existing `debounce.ts` utility (300ms) for search input      |
| Page size persistence           | Session-only via component state; no localStorage needed         |
| Null handling in sort           | TanStack supports `sortUndefined` option for null placement      |

## Dependencies to Add

```bash
pnpm add @tanstack/table-core
```

**Note**: We use `@tanstack/table-core` (not `@tanstack/svelte-table`) because the Svelte adapter is incompatible with Svelte 5. Our custom adapter in `src/lib/components/table/` bridges this gap.
