# Tasks: Analytics Page

**Input**: Design documents from `/specs/004-analytics-page/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested in spec - tests omitted per template guidelines.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Project type**: SvelteKit web application
- **Source**: `src/lib/` for components, `src/routes/` for pages
- **Tests**: `src/` for colocated tests (Vitest)

---

## Phase 1: Setup

**Purpose**: Install dependency and create base structure

- [x] T001 Install lightweight-charts dependency via `pnpm add lightweight-charts`
- [x] T002 [P] Create analytics types file at src/lib/types/analytics.ts
- [x] T003 [P] Create charts component directory at src/lib/components/charts/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core query functions that ALL chart components depend on

**⚠️ CRITICAL**: No chart implementation can begin until queries are ready

- [x] T004 Add getDailyVolume query function in src/lib/db/queries.ts
- [x] T005 [P] Add getDailyDirectionVolume query function in src/lib/db/queries.ts
- [x] T006 [P] Add getStatusDistribution query function in src/lib/db/queries.ts
- [x] T007 Add calculateDateRange utility function in src/lib/utils/date-range.ts

**Checkpoint**: All analytics queries available - chart components can now be built

---

## Phase 3: User Story 1 - View Daily Volume Trends (Priority: P1) 🎯 MVP

**Goal**: Display an area chart showing daily aggregated trading volume over time

**Independent Test**: Navigate to /analytics and verify area chart displays daily volumes with dates on x-axis

### Implementation for User Story 1

- [x] T008 [US1] Create VolumeChart.svelte component in src/lib/components/charts/VolumeChart.svelte
- [x] T009 [US1] Implement Lightweight Charts integration with $effect lifecycle in VolumeChart.svelte
- [x] T010 [US1] Add loading state handling in VolumeChart.svelte
- [x] T011 [US1] Add empty state handling in VolumeChart.svelte
- [x] T012 [US1] Add error state with retry capability in VolumeChart.svelte
- [x] T013 [US1] Create analytics page route at src/routes/analytics/+page.svelte
- [x] T014 [US1] Add page header and layout structure in src/routes/analytics/+page.svelte
- [x] T015 [US1] Integrate VolumeChart component in analytics page
- [x] T016 [US1] Add dark/light theme support for VolumeChart styling

**Checkpoint**: User Story 1 complete - analytics page shows daily volume chart, independently testable

---

## Phase 4: User Story 4 - Adjust Time Range (Priority: P2)

**Goal**: Allow users to select different time ranges (7d, 30d default, 90d, all) for charts

**Independent Test**: Change time range selector and verify volume chart updates with new date range

### Implementation for User Story 4

- [ ] T017 [US4] Create TimeRangeSelector.svelte component in src/lib/components/TimeRangeSelector.svelte
- [ ] T018 [US4] Implement preset buttons (7d, 30d, 90d, all) in TimeRangeSelector.svelte
- [ ] T019 [US4] Add default selection state (30d) in TimeRangeSelector.svelte
- [ ] T020 [US4] Integrate TimeRangeSelector in analytics page header
- [ ] T021 [US4] Connect time range selection to VolumeChart data fetching
- [ ] T022 [US4] Add loading state during time range changes

**Checkpoint**: User Story 4 complete - time range selector controls volume chart, independently testable

---

## Phase 5: User Story 2 - Analyze Buy vs Sell Balance (Priority: P2)

**Goal**: Display histogram chart comparing buy and sell volumes over time

**Independent Test**: Verify buy/sell chart shows two distinct colored series (green buy, red sell)

### Implementation for User Story 2

- [x] T023 [P] [US2] Create DirectionChart.svelte component in src/lib/components/charts/DirectionChart.svelte
- [x] T024 [US2] Implement dual histogram series (buy positive, sell negative) in DirectionChart.svelte
- [x] T025 [US2] Add color coding (green=#26a69a for buy, red=#ef5350 for sell) in DirectionChart.svelte
- [x] T026 [US2] Add loading/empty/error states in DirectionChart.svelte
- [x] T027 [US2] Integrate DirectionChart in analytics page below VolumeChart
- [x] T028 [US2] Connect DirectionChart to time range selector state
- [x] T029 [US2] Add dark/light theme support for DirectionChart styling

**Checkpoint**: User Story 2 complete - buy/sell chart displays with time range control, independently testable

---

## Phase 6: User Story 3 - View Order Status Distribution (Priority: P3)

**Goal**: Display status breakdown (open, closed_to_trading, completed) as visual bars

**Independent Test**: Verify status distribution shows accurate counts and percentages for each status

### Implementation for User Story 3

- [x] T030 [P] [US3] Create StatusDistribution.svelte component in src/lib/components/charts/StatusDistribution.svelte
- [x] T031 [US3] Implement HTML/CSS bar visualization in StatusDistribution.svelte
- [x] T032 [US3] Add count and percentage display for each status bar
- [x] T033 [US3] Add status color coding matching existing dashboard badges
- [x] T034 [US3] Add loading/empty/error states in StatusDistribution.svelte
- [x] T035 [US3] Integrate StatusDistribution in analytics page sidebar or below charts
- [x] T036 [US3] Add dark/light theme support for StatusDistribution styling

**Checkpoint**: User Story 3 complete - status distribution displays with accurate data, independently testable

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration, performance, and quality improvements

- [x] T037 Verify all charts render within 3 second performance target
- [x] T038 [P] Add compact number formatting (K, M, B) to chart axis labels
- [x] T039 [P] Ensure consistent styling with existing dashboard typography
- [x] T040 Test dark/light theme toggle on all chart components
- [x] T041 Test empty state scenarios (no data in selected range)
- [x] T042 Test error state scenarios (query failures)
- [x] T043 Run `pnpm check` to verify TypeScript compilation
- [x] T044 Run `pnpm lint` to verify code quality
- [x] T045 Validate against quickstart.md verification checklist

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all chart components
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (Volume Chart) must be complete before US4 (Time Range) can integrate
  - US2 (Direction Chart) and US3 (Status Distribution) can start after Foundational
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 2: Foundational (queries)
    │
    ├── Phase 3: US1 - Volume Chart (P1) 🎯 MVP
    │       │
    │       └── Phase 4: US4 - Time Range (P2) [extends US1]
    │               │
    │               └── Phase 5: US2 - Direction Chart (P2) [uses time range]
    │
    └── Phase 6: US3 - Status Distribution (P3) [independent, no time range needed]
```

### Within Each User Story

- Component creation before integration
- Core functionality before states (loading/empty/error)
- Implementation before styling/theming

### Parallel Opportunities

**Phase 1 (Setup)**:

```
T002 (types) + T003 (directory) can run in parallel
```

**Phase 2 (Foundational)**:

```
T004 (daily volume query)
T005 (direction query) [P]
T006 (status query) [P]
```

**After Foundational completes**:

```
US1 can start immediately (P1 priority - MVP)
US3 can start in parallel (different component, no US1 dependency)
```

**Phase 5 & 6**:

```
T023 (DirectionChart) + T030 (StatusDistribution) can be created in parallel
```

---

## Parallel Example: Foundational Phase

```bash
# After T004 completes, launch remaining queries in parallel:
Task: "Add getDailyDirectionVolume query function in src/lib/db/queries.ts"
Task: "Add getStatusDistribution query function in src/lib/db/queries.ts"
```

## Parallel Example: Charts Creation

```bash
# After US1 checkpoint, launch US2 and US3 component creation in parallel:
Task: "Create DirectionChart.svelte component in src/lib/components/charts/DirectionChart.svelte"
Task: "Create StatusDistribution.svelte component in src/lib/components/charts/StatusDistribution.svelte"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T007)
3. Complete Phase 3: User Story 1 - Volume Chart (T008-T016)
4. **STOP and VALIDATE**: Test /analytics page with volume chart
5. Deploy/demo if ready - users can see daily volume trends!

### Incremental Delivery

1. Setup + Foundational → Queries ready
2. Add US1 (Volume Chart) → **MVP!** Users see volume trends
3. Add US4 (Time Range) → Users can adjust date ranges
4. Add US2 (Direction Chart) → Users see buy/sell comparison
5. Add US3 (Status Distribution) → Users see order pipeline status
6. Each story adds value without breaking previous stories

### Recommended Execution Order

For single developer:

1. T001 → T002, T003 (parallel) → T004 → T005, T006, T007 (parallel)
2. T008 → T009 → T010 → T011 → T012 → T013 → T014 → T015 → T016
3. T017 → T018 → T019 → T020 → T021 → T022
4. T023 → T024 → T025 → T026 → T027 → T028 → T029
5. T030 → T031 → T032 → T033 → T034 → T035 → T036
6. T037 → T038, T039 (parallel) → T040 → T041 → T042 → T043 → T044 → T045

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- US1 (Volume Chart) is the MVP - delivers immediate value
- US4 (Time Range) enhances US1 before adding more charts
- US3 (Status Distribution) is independent of time range (shows all orders)
