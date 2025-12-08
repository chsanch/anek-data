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

- [ ] T001 Install @tanstack/svelte-table dependency via `pnpm add @tanstack/svelte-table`
- [ ] T002 [P] Create table types file at src/lib/types/table.ts with TableState, SortingState, ColumnFiltersState interfaces from contracts/table-api.ts
- [ ] T003 [P] Create column definitions constant ORDER_COLUMNS in src/lib/types/table.ts with all 9 columns configured for sortable/filterable flags

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core TanStack Table integration that all user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Add getAllOrders query function to src/lib/db/queries.ts that fetches all orders without pagination (TanStack will handle client-side pagination)
- [ ] T005 Refactor OrdersTable.svelte to use createSvelteTable with getCoreRowModel and getPaginationRowModel at src/lib/components/OrdersTable.svelte
- [ ] T006 Update +page.svelte to pass all orders to OrdersTable instead of paginated orders at src/routes/+page.svelte
- [ ] T007 Verify table renders with TanStack managing pagination (existing pagination should still work)

**Checkpoint**: Foundation ready - TanStack Table integrated, existing functionality preserved

---

## Phase 3: User Story 1 - Column Sorting (Priority: P1) 🎯 MVP

**Goal**: Users can click column headers to sort data ascending/descending

**Independent Test**: Click "Rate" header → orders sort by rate. Click again → reverses. Click different header → clears previous sort.

### Implementation for User Story 1

- [ ] T008 [US1] Add getSortedRowModel to TanStack table configuration in src/lib/components/OrdersTable.svelte
- [ ] T009 [US1] Add sorting state ($state) and onSortingChange callback to table options in src/lib/components/OrdersTable.svelte
- [ ] T010 [US1] Update table header cells to call column.getToggleSortingHandler() on click in src/lib/components/OrdersTable.svelte
- [ ] T011 [US1] Add visual sort indicators (↑/↓ arrows) to header cells using column.getIsSorted() in src/lib/components/OrdersTable.svelte
- [ ] T012 [US1] Add cursor:pointer and hover styles to sortable column headers in src/lib/components/OrdersTable.svelte
- [ ] T013 [US1] Configure sortUndefined: 'last' for columns that may have null values in src/lib/types/table.ts

**Checkpoint**: Column sorting fully functional - MVP complete

---

## Phase 4: User Story 2 - Page Size Control (Priority: P2)

**Goal**: Users can select 10, 20, 50, or 100 rows per page

**Independent Test**: Select "50" from dropdown → table shows 50 rows, pagination updates to reflect fewer pages

### Implementation for User Story 2

- [ ] T014 [US2] Add pageSize state and onPaginationChange callback to table options in src/lib/components/OrdersTable.svelte
- [ ] T015 [US2] Create PageSizeSelector component at src/lib/components/PageSizeSelector.svelte with dropdown for 10/20/50/100
- [ ] T016 [US2] Integrate PageSizeSelector into pagination section of OrdersTable in src/lib/components/OrdersTable.svelte
- [ ] T017 [US2] Ensure page resets to 0 when pageSize changes (add logic to onPaginationChange) in src/lib/components/OrdersTable.svelte
- [ ] T018 [US2] Update pagination info text to use table.getPageCount() and table.getRowModel().rows.length in src/lib/components/OrdersTable.svelte

**Checkpoint**: Page size control functional, pagination info accurate

---

## Phase 5: User Story 3 - Text Search Filter (Priority: P3)

**Goal**: Users can type in search box to filter across all columns

**Independent Test**: Type "USD" → only rows containing "USD" in any column shown. Clear → all rows return.

### Implementation for User Story 3

- [ ] T019 [US3] Add getFilteredRowModel to TanStack table configuration in src/lib/components/OrdersTable.svelte
- [ ] T020 [US3] Add globalFilter state and onGlobalFilterChange callback in src/lib/components/OrdersTable.svelte
- [ ] T021 [US3] Create TableToolbar component at src/lib/components/TableToolbar.svelte with search input
- [ ] T022 [US3] Add debounced search input (300ms) using existing debounce utility in src/lib/components/TableToolbar.svelte
- [ ] T023 [US3] Integrate TableToolbar above table in OrdersTable component at src/lib/components/OrdersTable.svelte
- [ ] T024 [US3] Update empty state message when search yields no results in src/lib/components/OrdersTable.svelte

**Checkpoint**: Global text search functional with debouncing

---

## Phase 6: User Story 4 - Column-Specific Filters (Priority: P4)

**Goal**: Users can filter by status, type, currency using dropdown filters

**Independent Test**: Select "open" from status filter → only open orders shown. Add "forward" filter → only open forwards shown.

### Implementation for User Story 4

- [ ] T025 [US4] Add columnFilters state and onColumnFiltersChange callback in src/lib/components/OrdersTable.svelte
- [ ] T026 [US4] Create FilterDropdown component at src/lib/components/FilterDropdown.svelte with select element and "All" option
- [ ] T027 [US4] Add extractFilterOptions function to compute unique values from orders in src/lib/components/OrdersTable.svelte
- [ ] T028 [US4] Add filter dropdowns to TableToolbar for status, fxOrderType, buyCurrency, sellCurrency, liquidityProvider in src/lib/components/TableToolbar.svelte
- [ ] T029 [US4] Wire filter dropdowns to columnFilters state via setFilterValue in src/lib/components/TableToolbar.svelte
- [ ] T030 [US4] Add active filter count badge to TableToolbar in src/lib/components/TableToolbar.svelte
- [ ] T031 [US4] Add "Clear all filters" button that resets globalFilter and columnFilters in src/lib/components/TableToolbar.svelte
- [ ] T032 [US4] Update empty state to show "No orders match your filters" with clear button in src/lib/components/OrdersTable.svelte

**Checkpoint**: Column filters functional, combinable with search, clearable

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
