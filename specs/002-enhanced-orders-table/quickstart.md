# Quickstart: Enhanced Orders Table

**Feature**: 002-enhanced-orders-table
**Date**: 2025-12-08

## Prerequisites

- Node.js 18+
- pnpm installed
- Project cloned and on branch `002-enhanced-orders-table`

## Setup

```bash
# Install dependencies (including new TanStack Table)
pnpm install

# Install TanStack Table (if not already added)
pnpm add @tanstack/svelte-table

# Start dev server
pnpm dev
```

## Key Files to Modify

| File | Purpose |
|------|---------|
| `src/lib/components/OrdersTable.svelte` | Main table component - integrate TanStack |
| `src/lib/components/TableToolbar.svelte` | NEW: Search, filters, page size controls |
| `src/lib/components/FilterDropdown.svelte` | NEW: Column filter dropdown component |
| `src/lib/components/ExportModal.svelte` | MODIFY: Add filtered export option |
| `src/lib/types/table.ts` | NEW: Table state types |
| `src/routes/+page.svelte` | Wire up enhanced table |

## Implementation Order

### Phase 1: Core Table with TanStack

1. Add `@tanstack/svelte-table` dependency
2. Create `src/lib/types/table.ts` with state types
3. Refactor `OrdersTable.svelte` to use `createSvelteTable`
4. Implement sorting (click column headers)
5. Test sorting works

### Phase 2: Pagination Enhancement

1. Add page size selector UI
2. Wire up `pageSize` state to TanStack pagination
3. Update pagination info display
4. Test page size changes

### Phase 3: Filtering

1. Create `FilterDropdown.svelte` component
2. Create `TableToolbar.svelte` with search input
3. Implement global filter (text search)
4. Add column filters (status, type, currencies)
5. Test filter combinations

### Phase 4: Export Integration

1. Extend `ExportModal.svelte` with "Export filtered" option
2. Pass filtered order IDs to export function
3. Test filtered export produces correct CSV

## Code Snippets

### Basic TanStack Setup

```svelte
<script lang="ts">
  import {
    createSvelteTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    type SortingState
  } from '@tanstack/svelte-table';

  let { orders } = $props();

  let sorting = $state<SortingState>([]);
  let globalFilter = $state('');

  const table = createSvelteTable({
    get data() { return orders; },
    columns: columnDefs,
    state: {
      get sorting() { return sorting; },
      get globalFilter() { return globalFilter; }
    },
    onSortingChange: (updater) => {
      sorting = typeof updater === 'function' ? updater(sorting) : updater;
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });
</script>
```

### Sort Toggle Handler

```svelte
<th onclick={() => header.column.getToggleSortingHandler()}>
  {header.column.columnDef.header}
  {#if header.column.getIsSorted()}
    {header.column.getIsSorted() === 'asc' ? '↑' : '↓'}
  {/if}
</th>
```

### Filter Dropdown

```svelte
<select onchange={(e) => column.setFilterValue(e.target.value || undefined)}>
  <option value="">All</option>
  {#each options as option}
    <option value={option}>{option}</option>
  {/each}
</select>
```

## Testing

```bash
# Run unit tests
pnpm test:unit

# Run e2e tests (with dev server running)
pnpm test:e2e

# Manual testing checklist
# - [ ] Click column header → sorts ascending
# - [ ] Click again → sorts descending
# - [ ] Click third time → clears sort
# - [ ] Change page size → resets to page 1
# - [ ] Type in search → filters across all columns
# - [ ] Select status filter → shows only matching
# - [ ] Combine filters → shows intersection
# - [ ] Clear filters → shows all
# - [ ] Export filtered → CSV has filtered data only
```

## Troubleshooting

### TanStack not updating on data change

Ensure data is passed reactively:
```typescript
// Wrong
const table = createSvelteTable({ data: orders, ... });

// Right
const table = createSvelteTable({
  get data() { return orders; },
  ...
});
```

### Sorting not working

Check that `getSortedRowModel()` is included in table options and column has `enableSorting: true`.

### Filters not combining correctly

TanStack uses AND logic by default. Verify both `getFilteredRowModel()` is included and each column has `enableColumnFilter: true`.
