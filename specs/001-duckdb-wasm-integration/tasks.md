# Tasks: DuckDB WASM Integration

**Input**: Design documents from `/specs/001-duckdb-wasm-integration/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested in feature specification - test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependency installation, and environment configuration

- [x] T001 Install @duckdb/duckdb-wasm dependency via `pnpm install @duckdb/duckdb-wasm`
- [x] T002 [P] Create `.env` file with PUBLIC_PARQUET_URL environment variable
- [x] T003 [P] Add PUBLIC_PARQUET_URL type declaration in `src/app.d.ts`
- [x] T004 [P] Create `src/lib/db/` directory structure for database layer
- [x] T005 [P] Create `src/lib/db/types.ts` with DataError and DataState type definitions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core DuckDB infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Implement DuckDB singleton initialization in `src/lib/db/duckdb.ts`
- [x] T007 Implement Parquet loading logic in `src/lib/db/loader.ts`
- [x] T008 [P] Create LoadingIndicator component in `src/lib/components/LoadingIndicator.svelte`
- [x] T009 [P] Create ErrorMessage component in `src/lib/components/ErrorMessage.svelte`
- [x] T010 Create DataProvider context component in `src/lib/components/DataProvider.svelte`
- [x] T011 Wrap application with DataProvider in `src/routes/+layout.svelte`

**Checkpoint**: Foundation ready - DuckDB initializes and loads Parquet on app start ✅

---

## Phase 3: User Story 1 - Load Order Data from Remote Parquet File (Priority: P1) 🎯 MVP

**Goal**: Download and load order data from a remote parquet file on application start, display data in orders table

**Independent Test**: Load a parquet file from configured URL and verify data appears in the orders table. User sees loading indicator during download and error message if fetch fails.

**Acceptance Criteria**:

- Auto-load on app start with loading indicator visible within 500ms
- Orders table displays records from loaded parquet file
- Clear error message shown if remote server is unreachable
- Manual refresh button allows users to reload data on demand

### Implementation for User Story 1

- [x] T012 [US1] Implement SQL query definitions in `src/lib/db/queries.ts` (paginated orders, total count)
- [x] T013 [US1] Create result-to-UnifiedOrder mapping function in `src/lib/db/queries.ts`
- [x] T014 [US1] Create RefreshButton component in `src/lib/components/RefreshButton.svelte`
- [x] T015 [US1] Update `src/routes/+page.svelte` to consume DataProvider context
- [x] T016 [US1] Replace mock orders array with DuckDB query results in `src/routes/+page.svelte`
- [x] T017 [US1] Add refresh button to dashboard header in `src/routes/+page.svelte`
- [x] T018 [US1] Update OrdersTable to handle loading/error states in `src/lib/components/OrdersTable.svelte`
- [x] T019 [US1] Implement SQL-based pagination (LIMIT/OFFSET) in OrdersTable

**Checkpoint**: User Story 1 complete - Orders load from Parquet file, display in table with pagination, refresh button works ✅

---

## Phase 4: User Story 2 - View Aggregated Dashboard Statistics (Priority: P2)

**Goal**: Calculate and display real statistics (total trades, total volume, open orders) from loaded order data

**Independent Test**: Load sample data and verify that dashboard stat cards display correct calculated values matching SQL query results.

**Acceptance Criteria**:

- "Total Trades" stat card shows COUNT(\*) of all orders
- "Total Volume" stat card shows SUM(sell_amount_cents) formatted correctly
- "Open Orders" stat card shows count where status = 'open'
- Stat cards display zero/empty states when no data loaded

### Implementation for User Story 2

- [x] T020 [US2] Add dashboard statistics SQL queries to `src/lib/db/queries.ts`
- [x] T021 [US2] Create DashboardStats type interface in `src/lib/db/queries.ts` (simplified from stats.svelte.ts)
- [x] T022 [US2] Update `src/routes/+page.svelte` to fetch real stats on load
- [x] T023 [US2] Connect StatCard components to real data in `src/routes/+page.svelte`
- [x] T024 [US2] Stats refresh when RefreshButton is clicked
- [x] T025 [US2] Handle BigInt overflow for large aggregations with toSafeNumber helper

**Checkpoint**: User Story 2 complete - Dashboard shows accurate statistics calculated from DuckDB queries ✅

---

## Phase 5: User Story 3 - View Volume by Currency Breakdown (Priority: P3)

**Goal**: Display trading volume broken down by sell currency, sorted by volume (highest first)

**Independent Test**: Load data with multiple currencies and verify the currency breakdown section shows accurate volume per currency, sorted correctly.

**Acceptance Criteria**:

- Each currency displays its total volume (sum of sellAmountCents)
- Currencies are sorted by volume descending
- Currency breakdown updates on data refresh

### Implementation for User Story 3

- [x] T026 [US3] Add volume-by-currency SQL query to `src/lib/db/queries.ts`
- [x] T027 [US3] Create VolumeByCurrency type interface in `src/lib/db/queries.ts`
- [x] T028 [US3] Update `src/routes/+page.svelte` to replace mock volumeByCurrency with real data
- [x] T029 [US3] Verify currency breakdown sorting (highest volume first) - ORDER BY volume DESC

**Checkpoint**: User Story 3 complete - Currency breakdown shows real aggregated data ✅

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements, error handling refinements, and validation

- [x] T030 [P] Add ErrorBoundary component for graceful error handling in `src/lib/components/ErrorBoundary.svelte`
- [x] T031 [P] Add Skeleton loading components in `src/lib/components/Skeleton.svelte`
- [x] T032 [P] Add EmptyState component for no-data scenarios in `src/lib/components/EmptyState.svelte`
- [x] T033 Add QueryCache utility for performance optimization in `src/lib/utils/debounce.ts`
- [x] T034 Implement query caching for stats and volume data (30s TTL)
- [x] T035 Add cache invalidation on refresh button click
- [x] T036 Schema validation on Parquet load (already implemented in DataProvider.svelte lines 38-47)
- [x] T037 Update quickstart.md with actual implementation patterns (local bundles, BigInt handling, CORS server)

**Checkpoint**: Phase 6 complete - Polish and performance optimizations applied ✅

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can then proceed in priority order (P1 → P2 → P3)
  - Or in parallel if multiple developers available
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 data loading but independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Extends US2 stats service but independently testable

### Within Each User Story

- Queries before services
- Services before UI integration
- Core implementation before refinements
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup):**

```
T002, T003, T004, T005 can all run in parallel
```

**Phase 2 (Foundational):**

```
T008, T009 can run in parallel (LoadingIndicator and ErrorMessage components)
```

**User Story 1:**

```
No parallel opportunities - sequential dependency chain
```

**User Story 2:**

```
T020 (queries) → T021 (stats service) → T022-T025 (integration)
```

**Phase 6 (Polish):**

```
T030, T031, T032 can all run in parallel
```

---

## Parallel Example: Phase 1 Setup

```bash
# Launch all parallel setup tasks together:
Task: "Create .env file with PUBLIC_PARQUET_URL environment variable"
Task: "Add PUBLIC_PARQUET_URL type declaration in src/app.d.ts"
Task: "Create src/lib/db/ directory structure for database layer"
Task: "Create src/lib/db/types.ts with DataError and DataState type definitions"
```

## Parallel Example: Phase 2 Foundational

```bash
# After T006 and T007 complete, launch UI components in parallel:
Task: "Create LoadingIndicator component in src/lib/components/LoadingIndicator.svelte"
Task: "Create ErrorMessage component in src/lib/components/ErrorMessage.svelte"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Verify orders load from Parquet and display in table
5. Deploy/demo if ready - MVP delivers core local-first data access

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test: Orders table populated → Deploy (MVP!)
3. Add User Story 2 → Test: Stats cards show real data → Deploy
4. Add User Story 3 → Test: Currency breakdown accurate → Deploy
5. Add Polish → Final validation and edge cases

### Single Developer Strategy

Execute phases sequentially in order:

1. Setup (Phase 1)
2. Foundational (Phase 2)
3. User Story 1 (Phase 3) - P1 Priority
4. User Story 2 (Phase 4) - P2 Priority
5. User Story 3 (Phase 5) - P3 Priority
6. Polish (Phase 6)

---

## File Summary

### New Files to Create

| File                                         | Phase        | Purpose                         |
| -------------------------------------------- | ------------ | ------------------------------- |
| `.env`                                       | Setup        | Environment configuration       |
| `src/lib/db/types.ts`                        | Setup        | TypeScript type definitions     |
| `src/lib/db/duckdb.ts`                       | Foundational | DuckDB singleton initialization |
| `src/lib/db/loader.ts`                       | Foundational | Parquet loading logic           |
| `src/lib/db/queries.ts`                      | US1          | SQL query definitions           |
| `src/lib/db/stats.svelte.ts`                 | US2          | Reactive statistics service     |
| `src/lib/components/LoadingIndicator.svelte` | Foundational | Loading UI                      |
| `src/lib/components/ErrorMessage.svelte`     | Foundational | Error display                   |
| `src/lib/components/DataProvider.svelte`     | Foundational | Context provider                |
| `src/lib/components/RefreshButton.svelte`    | US1          | Manual refresh                  |

### Files to Modify

| File                                    | Phase        | Changes                          |
| --------------------------------------- | ------------ | -------------------------------- |
| `src/app.d.ts`                          | Setup        | Add env type declaration         |
| `src/routes/+layout.svelte`             | Foundational | Wrap with DataProvider           |
| `src/routes/+page.svelte`               | US1-US3      | Replace mock data with real data |
| `src/lib/components/StatCard.svelte`    | US2          | Add loading state handling       |
| `src/lib/components/OrdersTable.svelte` | US1          | SQL pagination, loading states   |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Tests not included per spec - add test phase if needed later
