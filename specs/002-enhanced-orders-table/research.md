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

**Decision**: Hybrid approach - TanStack for UI state, DuckDB for data retrieval

**Rationale**:
- Load all data into TanStack Table on initial fetch
- Use TanStack's client-side `getSortedRowModel()`, `getFilteredRowModel()`, `getPaginationRowModel()`
- This keeps all operations in-memory (<200ms per constitution)
- DuckDB remains source of truth, TanStack handles presentation layer

**Alternatives Considered**:
- **DuckDB-only with SQL sorting/filtering**: Would require rebuilding pagination/sort state management. Each filter change = new SQL query. More complex state coordination.
- **TanStack server-side mode**: Not applicable - we're fully client-side per constitution.

**Implementation Notes**:
```typescript
// Load all orders once from DuckDB
const allOrders = await getAllOrders(db);

// TanStack handles the rest client-side
const table = createSvelteTable({
  data: allOrders,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
});
```

---

### 3. TanStack Table with Svelte 5 Runes

**Decision**: Use `$state` for table options, derive table instance

**Rationale**:
- TanStack Svelte adapter returns a reactive store
- Svelte 5 can interop with stores via `$` prefix
- State changes (sorting, filtering) managed via `onSortingChange`, `onFilterChange` callbacks

**Implementation Pattern**:
```svelte
<script lang="ts">
import { createSvelteTable, getCoreRowModel, getSortedRowModel } from '@tanstack/svelte-table';

let sorting = $state<SortingState>([]);
let globalFilter = $state('');

const table = createSvelteTable({
  get data() { return orders; },
  columns,
  state: {
    get sorting() { return sorting; },
    get globalFilter() { return globalFilter; }
  },
  onSortingChange: (updater) => {
    sorting = typeof updater === 'function' ? updater(sorting) : updater;
  },
  onGlobalFilterChange: (updater) => {
    globalFilter = typeof updater === 'function' ? updater(globalFilter) : updater;
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
});
</script>
```

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
const statusOptions = $derived([...new Set(orders.map(o => o.status))]);
const typeOptions = $derived([...new Set(orders.map(o => o.fxOrderType))]);
const currencyOptions = $derived([
  ...new Set([...orders.map(o => o.buyCurrency), ...orders.map(o => o.sellCurrency)])
].sort());
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
    const filteredIds = $table.getFilteredRowModel().rows.map(row => row.original.id);
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

| Item | Resolution |
|------|------------|
| TanStack Svelte 5 compatibility | Confirmed: Uses reactive stores compatible with Svelte 5 |
| Bundle size impact | ~15KB gzipped - acceptable per constitution simplicity principle |
| Filter debouncing | Use existing `debounce.ts` utility (300ms) for search input |
| Page size persistence | Session-only via component state; no localStorage needed |
| Null handling in sort | TanStack supports `sortUndefined` option for null placement |

## Dependencies to Add

```bash
pnpm add @tanstack/svelte-table
```

No additional dependencies required - TanStack is the only new package.
