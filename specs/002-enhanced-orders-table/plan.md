# Implementation Plan: Enhanced Orders Table

**Branch**: `002-enhanced-orders-table` | **Date**: 2025-12-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-enhanced-orders-table/spec.md`

## Summary

Enhance the orders table with professional UX features: column sorting, page size control, global text search, column-specific filters, and filtered export. All operations execute client-side using TanStack Table for state management with DuckDB WASM for data queries, maintaining sub-200ms response times per constitution requirements.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Svelte 5, SvelteKit, @tanstack/table-core (with custom Svelte 5 adapter), DuckDB WASM
**Storage**: DuckDB WASM (in-browser), IndexedDB (persistence)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (SvelteKit single project)
**Performance Goals**: Sort < 100ms, Filter < 200ms per spec; Aggregations < 200ms per constitution
**Constraints**: All filtering/sorting client-side, no server queries for analytics
**Scale/Scope**: 10,000+ orders in DuckDB, single orders table view

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                      | Status | Notes                                                        |
| ------------------------------ | ------ | ------------------------------------------------------------ |
| I. Local-First Architecture    | PASS   | All sorting/filtering via DuckDB WASM client-side            |
| II. Data Integrity & Sync      | PASS   | No data modification, read-only table operations             |
| III. Performance-First Design  | PASS   | Client-side ops target <200ms, TanStack handles state        |
| IV. Component Independence     | PASS   | Table component self-contained with own state                |
| V. Simplicity Over Flexibility | PASS   | TanStack is headless (minimal bundle), no abstraction layers |

**NOT in scope validation**:

- No additional charting libraries needed
- No state management libraries (TanStack uses Svelte's native reactivity)
- Direct DuckDB SQL preserved for queries
- No SSR needed for table view

## Project Structure

### Documentation (this feature)

```text
specs/002-enhanced-orders-table/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── components/
│   │   ├── OrdersTable.svelte       # MODIFIED: Uses TanStack for sort UI, SQL for data
│   │   ├── table/                   # NEW: Custom Svelte 5 TanStack adapter
│   │   │   ├── index.ts             # Re-exports from @tanstack/table-core
│   │   │   ├── table.svelte.ts      # createSvelteTable with $state/$effect
│   │   │   ├── FlexRender.svelte    # Flexible cell/header rendering
│   │   │   └── render-component.ts  # Helper classes for rendering
│   │   ├── TableToolbar.svelte      # NEW: Search, filters, page size (future)
│   │   ├── FilterDropdown.svelte    # NEW: Column-specific filters (future)
│   │   ├── ExportModal.svelte       # MODIFY: Add filtered export option (future)
│   │   └── Modal.svelte             # EXISTS: Reuse
│   ├── db/
│   │   └── queries.ts               # MODIFIED: Added SortConfig, sortConfig param
│   ├── types/
│   │   └── table.ts                 # NEW: Table state types, ORDER_COLUMNS
│   └── utils/
│       ├── debounce.ts              # EXISTS: Reuse
│       └── format.ts                # EXISTS: Reuse
├── routes/
│   └── +page.svelte                 # MODIFIED: Handles sort state, passes to table
└── tests/
    └── unit/
        └── table.test.ts            # NEW: Table logic tests (future)
```

**Structure Decision**: Single SvelteKit project with components in `src/lib/components/`. No monorepo structure needed - this is a UI enhancement to existing table.

## Complexity Tracking

No constitution violations. TanStack Table is:

- Headless (no styling conflicts with existing design)
- ~15KB gzipped (acceptable bundle impact)
- Framework-agnostic core with Svelte adapter
- Used instead of building custom sorting/filtering state management
