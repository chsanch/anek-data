# Tasks: Browser Data Persistence (Parquet Cache)

**Input**: Design documents from `/specs/003-parquet-cache/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not explicitly requested - test tasks excluded. Manual testing via quickstart.md verification checklist.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Project type**: SvelteKit web application
- **Source**: `src/lib/` for library code, `src/routes/` for pages
- **Components**: `src/lib/components/`
- **Database layer**: `src/lib/db/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and dependency installation

- [x] T001 Install idb dependency: `pnpm add idb`
- [x] T002 [P] Add PUBLIC_CACHE_TTL to .env.example with default value 3600000

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and cache service that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create cache type definitions in src/lib/db/cache-types.ts (CachedParquet, CacheMetadata, CacheStatus, CacheConfig, CacheState, LoadResult interfaces)
- [x] T004 Create ParquetCacheService class skeleton in src/lib/db/cache.ts with init(), isCacheValid(), getMetadata(), loadData(), clearCache(), clearAllCache(), getStatus() methods
- [x] T005 Implement IndexedDB schema and database initialization in src/lib/db/cache.ts using idb openDB with ParquetCacheDB schema
- [x] T006 Update src/lib/db/context.ts to add cacheStatus to DataContext interface and DATA_PROVIDER_KEY

**Checkpoint**: Foundation ready - cache service structure exists, user story implementation can begin

---

## Phase 3: User Story 1 - Fast Page Load with Cached Data (Priority: P1) MVP

**Goal**: Eliminate redundant network downloads by loading parquet data from IndexedDB cache when valid

**Independent Test**: Load page twice - second load should show no network request for parquet file and load in < 2 seconds

### Implementation for User Story 1

- [ ] T007 [US1] Implement isCacheValid() in src/lib/db/cache.ts - check if cache entry exists and TTL not expired
- [ ] T008 [US1] Implement getMetadata() in src/lib/db/cache.ts - return CacheMetadata without binary data
- [ ] T009 [US1] Implement private storeCache() in src/lib/db/cache.ts - store ArrayBuffer with metadata to IndexedDB
- [ ] T010 [US1] Implement loadData() basic flow in src/lib/db/cache.ts - check cache first, fetch from network if miss, store result
- [ ] T011 [US1] Update loadParquetFromUrl() in src/lib/db/loader.ts to accept optional cache service parameter
- [ ] T012 [US1] Integrate cache service into DataProvider.svelte - initialize cache on mount, use cache-aware loading
- [ ] T013 [US1] Add graceful degradation in src/lib/db/cache.ts - catch IndexedDB errors, fall back to network-only mode
- [ ] T014 [US1] Implement TTL configuration from PUBLIC_CACHE_TTL environment variable in src/lib/db/cache.ts

**Checkpoint**: User Story 1 complete - returning users load from cache, first-time users cache data after download

---

## Phase 4: User Story 2 - Cache Status Visibility (Priority: P2)

**Goal**: Display cache status and last download timestamp to users

**Independent Test**: After page load, UI indicator shows "Cached - Last updated: [time]" or loading state

### Implementation for User Story 2

- [ ] T015 [US2] Implement getStatus() in src/lib/db/cache.ts - return current CacheStatus (state, timestamp, isStale, source)
- [ ] T016 [US2] Add cacheStatus reactive state to DataProvider.svelte and expose via context
- [ ] T017 [US2] Create CacheIndicator.svelte component in src/lib/components/ - display cache status with timestamp
- [ ] T018 [US2] Implement timestamp formatting in CacheIndicator.svelte using $derived rune (e.g., "2:30 PM" format)
- [ ] T019 [US2] Add loading state display in CacheIndicator.svelte when state is 'checking' or 'loading'
- [ ] T020 [US2] Add stale data warning display in CacheIndicator.svelte when isStale is true
- [ ] T021 [US2] Add CacheIndicator to src/routes/+page.svelte dashboard UI

**Checkpoint**: User Story 2 complete - users see cache status and data freshness at all times

---

## Phase 5: User Story 3 - Manual Data Refresh (Priority: P2)

**Goal**: Allow users to manually refresh data bypassing cache

**Independent Test**: Click refresh button - network request occurs regardless of cache validity, indicator updates

### Implementation for User Story 3

- [ ] T022 [US3] Add forceRefresh option to loadData() in src/lib/db/cache.ts - bypass cache check when true
- [ ] T023 [US3] Add forceRefresh() method to DataProvider.svelte context - calls loadData with forceRefresh: true
- [ ] T024 [US3] Add refresh button to CacheIndicator.svelte that calls forceRefresh()
- [ ] T025 [US3] Disable refresh button during loading state in CacheIndicator.svelte
- [ ] T026 [US3] Update cache indicator timestamp after successful refresh in DataProvider.svelte

**Checkpoint**: User Story 3 complete - users can force data refresh at any time

---

## Phase 6: User Story 4 - Efficient Server Validation (Priority: P3)

**Goal**: Use ETag headers to validate cache without re-downloading unchanged data

**Independent Test**: When cache expires, monitor network - should send If-None-Match header, receive 304 if unchanged

### Implementation for User Story 4

- [ ] T027 [US4] Extract and store ETag from response headers in src/lib/db/cache.ts storeCache()
- [ ] T028 [US4] Implement conditional fetch with If-None-Match header in src/lib/db/cache.ts loadData()
- [ ] T029 [US4] Handle 304 Not Modified response - extend cache TTL without re-downloading in src/lib/db/cache.ts
- [ ] T030 [US4] Handle new data response (200) - update cache with new data and ETag in src/lib/db/cache.ts
- [ ] T031 [US4] Fallback to full fetch when no ETag available in src/lib/db/cache.ts

**Checkpoint**: User Story 4 complete - bandwidth saved when server data unchanged

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Edge case handling and validation

- [ ] T032 [P] Handle storage quota exceeded error in src/lib/db/cache.ts - log warning, skip caching
- [ ] T033 [P] Handle corrupted cache data in src/lib/db/cache.ts - delete invalid entry, fetch fresh
- [ ] T034 [P] Handle offline mode with valid cache in src/lib/db/cache.ts - use cache, set isStale flag
- [ ] T035 [P] Handle offline mode with expired cache in src/lib/db/cache.ts - use expired cache, prominent warning
- [ ] T036 Run pnpm check to verify TypeScript types
- [ ] T037 Run pnpm lint to verify code style
- [ ] T038 Manual verification using quickstart.md checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001) - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (P1): Can start after Foundational - No dependencies on other stories
  - US2 (P2): Can start after Foundational - Uses cache status from US1 but independently testable
  - US3 (P2): Can start after Foundational - Adds to US2's UI but independently testable
  - US4 (P3): Can start after Foundational - Enhances US1's fetch logic
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

| Story | Depends On | Can Start After |
|-------|------------|-----------------|
| US1 (P1) | Foundational | Phase 2 complete |
| US2 (P2) | Foundational | Phase 2 complete (uses US1's cache service) |
| US3 (P2) | Foundational | Phase 2 complete (extends US2's indicator) |
| US4 (P3) | Foundational | Phase 2 complete (enhances US1's fetch) |

### Within Each User Story

- Types before implementation
- Core logic before integration
- Service layer before component layer
- Story complete before moving to next priority

### Parallel Opportunities

- T002 can run in parallel with T001 (different files)
- T032, T033, T034, T035 can all run in parallel (independent edge cases)
- US2 and US4 can be developed in parallel after US1 core is complete
- US3 can be developed in parallel with US2 (different aspects of UI)

---

## Parallel Example: Foundational Phase

```bash
# After T003 completes, these can run in parallel:
# (T004, T005, T006 all depend on types from T003)

# Sequential order required within Foundational:
T003 → T004 → T005 → T006
```

## Parallel Example: Polish Phase

```bash
# All edge case handlers can be implemented in parallel:
Task: T032 - Handle storage quota exceeded
Task: T033 - Handle corrupted cache data
Task: T034 - Handle offline with valid cache
Task: T035 - Handle offline with expired cache
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T006)
3. Complete Phase 3: User Story 1 (T007-T014)
4. **STOP and VALIDATE**: Test caching works - second page load uses cache
5. Deploy/demo if ready - core value delivered

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add User Story 1 → Test cache works → **MVP Complete**
3. Add User Story 2 → Test indicator shows → Enhanced UX
4. Add User Story 3 → Test refresh works → User control added
5. Add User Story 4 → Test ETag works → Bandwidth optimized
6. Polish phase → Production ready

### Recommended Order (Single Developer)

```
T001 → T002 → T003 → T004 → T005 → T006 (Foundation)
→ T007 → T008 → T009 → T010 → T011 → T012 → T013 → T014 (US1 - MVP)
→ T015 → T016 → T017 → T018 → T019 → T020 → T021 (US2)
→ T022 → T023 → T024 → T025 → T026 (US3)
→ T027 → T028 → T029 → T030 → T031 (US4)
→ T032-T038 (Polish)
```

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Total tasks: 38
- Tasks per story: US1=8, US2=7, US3=5, US4=5, Setup=2, Foundational=4, Polish=7
