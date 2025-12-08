# Tasks: Enhanced Orders Table

**Input**: Design documents from `/specs/002-enhanced-orders-table/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - test tasks omitted. Manual testing via quickstart.md.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/lib/` for components/types, `src/routes/` for pages
- All paths are relative to repository root

---

## Phase 1: Setup

**Purpose**: Install dependencies and create type definitions

- [x] T001 Install @tanstack/table-core dependency via `pnpm add @tanstack/table-core` (**Note**: Using table-core, not svelte-table due to Svelte 5 incompatibility)
- [x] T002 [P] Create table types file at src/lib/types/table.ts with TableState, SortingState, ColumnFiltersState interfaces from contracts/table-api.ts
- [x] T003 [P] Create column definitions constant ORDER_COLUMNS in src/lib/types/table.ts with all 9 columns configured for sortable/filterable flags

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core TanStack Table integration that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Implementation Note**: We discovered `@tanstack/svelte-table` is incompatible with Svelte 5 (imports removed `svelte/internal`). Created custom adapter in `src/lib/components/table/` based on [walker-tx/svelte5-tanstack-table-reference](https://github.com/walker-tx/svelte5-tanstack-table-reference).

- [x] T004 Add getAllOrders query function to src/lib/db/queries.ts (kept for potential future use)
- [x] T005 Create custom Svelte 5 TanStack adapter at src/lib/components/table/ with createSvelteTable, FlexRender, and render helpers
- [x] T006 Refactor OrdersTable.svelte to use custom adapter with TanStack for UI state management
- [x] T007 Verify table renders with SQL-based pagination (TanStack manages sort UI, SQL handles data)

**Checkpoint**: Foundation ready - Custom TanStack adapter integrated, SQL pagination preserved

---

## Phase 3: User Story 1 - Column Sorting (Priority: P1) 🎯 MVP ✅ COMPLETE

**Goal**: Users can click column headers to sort data ascending/descending

**Independent Test**: Click "Rate" header → orders sort by rate across ENTIRE dataset. Click again → reverses. Click different header → clears previous sort.

**Implementation Note**: We pivoted from client-side sorting to **SQL-based sorting**. TanStack manages the sort UI state, but actual sorting is done via DuckDB `ORDER BY` clause. This ensures sorting applies to the entire 73K+ dataset, not just the visible page.

### Implementation for User Story 1

- [x] T008 [US1] Add SortConfig interface and sortConfig parameter to getPaginatedOrders in src/lib/db/queries.ts
- [x] T009 [US1] Add sorting state management with onSortChange callback and currentSort prop in src/lib/components/OrdersTable.svelte
- [x] T010 [US1] Configure TanStack with manualSorting: true (SQL handles sorting, TanStack handles UI)
- [x] T011 [US1] Add visual sort indicators (↑/↓/↕ arrows) to header cells using column.getIsSorted() in src/lib/components/OrdersTable.svelte
- [x] T012 [US1] Add cursor:pointer and hover styles to sortable column headers in src/lib/components/OrdersTable.svelte
- [x] T013 [US1] Configure sortUndefined: 'last' for columns that may have null values in src/lib/types/table.ts

**Checkpoint**: Column sorting fully functional - MVP complete ✅

---

## Phase 4: User Story 2 - Page Size Control (Priority: P2) ✅ COMPLETE

**Goal**: Users can select 10, 20, 50, or 100 rows per page

**Independent Test**: Select "50" from dropdown → table shows 50 rows, pagination updates to reflect fewer pages

### Implementation for User Story 2

- [x] T014 [US2] Add pageSize state and onPageSizeChange callback in src/routes/+page.svelte
- [x] T015 [US2] Create PageSizeSelector component at src/lib/components/PageSizeSelector.svelte with dropdown for 10/20/50/100
- [x] T016 [US2] Integrate PageSizeSelector into pagination section of OrdersTable in src/lib/components/OrdersTable.svelte
- [x] T017 [US2] Ensure page resets to 1 when pageSize changes (handlePageSizeChange resets currentPage)
- [x] T018 [US2] Update pagination info text with toLocaleString() for number formatting

**Checkpoint**: Page size control functional, pagination info accurate ✅

---

## Phase 5: User Story 3 - Reference Search (Priority: P3) ✅ COMPLETE

**Goal**: Users can search orders by reference number (partial match)

**Independent Test**: Type "KCH-X87" → only orders with reference containing "KCH-X87" shown. Clear → all rows return.

**Implementation Note**: Changed from "global text search across all columns" to "reference-only search" because:
- `reference` is the only truly searchable text field in the orders data
- Other fields (status, type, currency, LP) have limited enumerable values better suited for dropdown filters (US4)
- Uses SQL `WHERE reference ILIKE '%search%'` for efficient server-side filtering

### Implementation for User Story 3

- [x] T019 [US3] Add referenceSearch parameter to getPaginatedOrders and getTotalOrderCount in src/lib/db/queries.ts with SQL ILIKE filter
- [x] T020 [US3] Add referenceSearch state and handleReferenceSearchChange callback in src/routes/+page.svelte
- [x] T021 [US3] Create ReferenceSearch component at src/lib/components/ReferenceSearch.svelte with search input, clear button, and search icon
- [x] T022 [US3] Add debounced search (300ms) using existing debounce utility in src/lib/components/ReferenceSearch.svelte
- [x] T023 [US3] Integrate ReferenceSearch into orders section header in src/routes/+page.svelte with new section-header-left layout
- [x] T024 [US3] Update empty state message when search yields no results in src/lib/components/OrdersTable.svelte (shows search term in message)

**Checkpoint**: Reference search functional with debouncing and SQL-based filtering ✅

---

## Phase 6: User Story 4 - Column-Specific Filters (Priority: P4) ✅ COMPLETE

**Goal**: Users can filter by status, type, currency using dropdown filters

**Independent Test**: Select "open" from status filter → only open orders shown. Add "forward" filter → only open forwards shown.

**Implementation Note**: Filters are SQL-based using exact match queries (`WHERE column = 'value'`). Filter options are dynamically loaded from the database via `getFilterOptions()`. The Filter button toggles a collapsible `TableToolbar` component.

### Implementation for User Story 4

- [x] T025 [US4] Add ColumnFilters interface, columnFilters state, and buildWhereConditions helper in src/lib/db/queries.ts
- [x] T026 [US4] Create FilterDropdown component at src/lib/components/FilterDropdown.svelte with select element and "All" option
- [x] T027 [US4] Add getFilterOptions function to query unique values for all filterable columns in src/lib/db/queries.ts
- [x] T028 [US4] Create TableToolbar component at src/lib/components/TableToolbar.svelte with filter dropdowns for status, fxOrderType, buyCurrency, sellCurrency, liquidityProvider
- [x] T029 [US4] Wire filter dropdowns to columnFilters state in +page.svelte with handleColumnFiltersChange callback
- [x] T030 [US4] Add active filter count badge to Filter button in +page.svelte header
- [x] T031 [US4] Add "Clear all filters" button in TableToolbar.svelte that resets columnFilters
- [x] T032 [US4] Update empty state in OrdersTable.svelte to show "No orders match your filters" when hasFilters is true

**Checkpoint**: Column filters functional, combinable with search, clearable ✅

---

## Phase 7: User Story 5 - Export Filtered Results (Priority: P5)

**Goal**: Users can export currently filtered/sorted view as CSV

**Independent Test**: Apply filters → click Export → CSV contains only filtered rows in current sort order

### Implementation for User Story 5

- [ ] T033 [US5] Add getFilteredRowModel().rows access to get filtered order IDs in src/lib/components/OrdersTable.svelte
- [ ] T034 [US5] Extend ExportOptions interface to include 'filtered' type and orderIds array in src/lib/db/queries.ts
- [ ] T035 [US5] Add exportFilteredOrders function that exports specific order IDs in current order in src/lib/db/queries.ts
- [ ] T036 [US5] Update ExportModal to show "Export filtered results (X rows)" option when filters active in src/lib/components/ExportModal.svelte
- [ ] T037 [US5] Pass filtered row count and IDs from OrdersTable to ExportModal in src/lib/components/OrdersTable.svelte
- [ ] T038 [US5] Update +page.svelte handleExport to handle filtered export option at src/routes/+page.svelte
- [ ] T039 [US5] Preserve existing export behavior (all/date-range) when no filters active in src/lib/components/ExportModal.svelte

**Checkpoint**: Filtered export functional, preserves existing export options

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T040 [P] Add keyboard navigation support (Enter to sort, Tab between filters) in src/lib/components/OrdersTable.svelte
- [ ] T041 [P] Add aria-sort attributes to sortable headers for accessibility in src/lib/components/OrdersTable.svelte
- [ ] T042 [P] Add aria-label to filter dropdowns and search input in src/lib/components/TableToolbar.svelte
- [ ] T043 Run TypeScript check via `pnpm check` and fix any type errors
- [ ] T044 Run quickstart.md manual testing checklist to verify all features
- [ ] T045 Performance test with 10,000+ rows - verify sort/filter < 200ms

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (Sorting) - No dependencies on other stories
  - US2 (Page Size) - No dependencies on other stories
  - US3 (Search) - No dependencies on other stories
  - US4 (Column Filters) - No dependencies on other stories
  - US5 (Export) - Depends on filter state from US3/US4 being available
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: Foundational (TanStack integration)
    ↓
    ├── Phase 3: US1 Sorting (MVP) ←── Start here
    ├── Phase 4: US2 Page Size      ←── Can parallel with US1
    ├── Phase 5: US3 Text Search    ←── Can parallel with US1/US2
    ├── Phase 6: US4 Column Filters ←── Can parallel with US1/US2/US3
    └── Phase 7: US5 Export Filtered ←── Requires US3/US4 filter state
    ↓
Phase 8: Polish
```

### Within Each User Story

- Configuration changes before UI changes
- State management before rendering
- Core functionality before edge cases

### Parallel Opportunities

- T002 and T003 can run in parallel (different content in same file, but independent)
- Once Foundational completes, US1-US4 can run in parallel
- T040, T041, T042 can run in parallel (different files/concerns)

---

## Parallel Example: User Story 4 (Column Filters)

```bash
# These tasks work on different files and can run in parallel:
Task T026: "Create FilterDropdown component at src/lib/components/FilterDropdown.svelte"
Task T027: "Add extractFilterOptions function in src/lib/components/OrdersTable.svelte"

# These must be sequential (same file, dependencies):
Task T028 depends on T026 (FilterDropdown must exist)
Task T029 depends on T028 (dropdowns must be in toolbar)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T007)
3. Complete Phase 3: User Story 1 - Sorting (T008-T013)
4. **STOP and VALIDATE**: Test sorting independently
5. Deploy/demo sorting feature

### Incremental Delivery

1. Setup + Foundational → TanStack integrated
2. Add US1 (Sorting) → Test → Deploy (MVP!)
3. Add US2 (Page Size) → Test → Deploy
4. Add US3 (Search) → Test → Deploy
5. Add US4 (Filters) → Test → Deploy
6. Add US5 (Export) → Test → Deploy
7. Polish phase → Final release

### Single Developer Strategy

Execute phases sequentially in priority order:
1. Setup → Foundational → US1 → validate
2. US2 → US3 → US4 → US5 → validate
3. Polish → final validation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All operations client-side per constitution requirements
- Target <100ms for sort, <200ms for filter operations
