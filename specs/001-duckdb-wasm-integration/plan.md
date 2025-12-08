# Implementation Plan: DuckDB WASM Integration

**Branch**: `001-duckdb-wasm-integration` | **Date**: 2025-12-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-duckdb-wasm-integration/spec.md`

## Summary

Integrate DuckDB WASM to enable local-first FX analytics in the browser. The system will automatically download order data from a remote Parquet file on application start, load it into an in-browser DuckDB instance, and populate the existing dashboard with real statistics (total trades, total volume, open orders, volume by currency) calculated via SQL queries. A manual refresh button allows users to reload data on demand.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: @duckdb/duckdb-wasm, SvelteKit, Svelte 5
**Storage**: DuckDB WASM (in-memory), Parquet files (remote)
**Testing**: Vitest (unit), Playwright (e2e)
**Target Platform**: Browser (WASM)
**Project Type**: Web application (SvelteKit)
**Performance Goals**:
- Parquet load: < 10s for files under 10MB (SC-001)
- Simple aggregations: < 50ms (Constitution)
- Pagination: < 100ms (SC-006)
- Loading indicator: visible within 500ms (SC-004)
**Constraints**:
- Up to 100,000 orders (SC-003)
- Offline-capable data processing (Constitution Principle I)
- No SSR for analytics views (Constitution)
**Scale/Scope**: Single dashboard page, 100K order records max

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Local-First Architecture | ✅ PASS | DuckDB WASM processes all analytics in browser; server only provides Parquet file |
| II. Data Integrity & Sync | ✅ PASS | Parquet as source of truth; amounts in cents (integer); no IndexedDB for MVP |
| III. Performance-First Design | ✅ PASS | Performance targets defined and achievable per research |
| IV. Component Independence | ✅ PASS | Using Svelte 5 runes; components manage own loading/error states |
| V. Simplicity Over Flexibility | ✅ PASS | Direct SQL queries; no abstraction layers; existing UI reused |

**Technology Stack Alignment**:
- ✅ SvelteKit with Svelte 5
- ✅ TypeScript (strict mode)
- ✅ Tailwind CSS 4 (existing)
- ✅ DuckDB WASM (new dependency)
- ✅ Vitest + Playwright (existing)
- ✅ Apache Parquet format

**NOT in scope verification**:
- ✅ No additional charting libraries added
- ✅ No state management libraries (using runes)
- ✅ No ORM or query builders (raw SQL)
- ✅ No SSR for analytics views

## Project Structure

### Documentation (this feature)

```text
specs/001-duckdb-wasm-integration/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 research output
├── data-model.md        # Phase 1 data model
├── quickstart.md        # Phase 1 quickstart guide
├── contracts/           # Phase 1 API contracts
│   └── queries.sql      # SQL query definitions
└── tasks.md             # Phase 2 output (via /speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── db/                    # NEW: DuckDB integration layer
│   │   ├── duckdb.ts          # DuckDB initialization singleton
│   │   ├── queries.ts         # SQL query definitions
│   │   ├── loader.ts          # Parquet loading logic
│   │   └── stats.svelte.ts    # Reactive stats with Svelte 5 runes
│   ├── components/
│   │   ├── DataProvider.svelte    # NEW: Context provider for DB
│   │   ├── RefreshButton.svelte   # NEW: Manual refresh button
│   │   ├── LoadingIndicator.svelte # NEW: Loading state UI
│   │   ├── ErrorMessage.svelte    # NEW: Error display component
│   │   ├── StatCard.svelte        # EXISTING: Update to use real data
│   │   ├── OrdersTable.svelte     # EXISTING: Update to use real data
│   │   └── ThemeToggle.svelte     # EXISTING: No changes
│   ├── types/
│   │   └── orders.ts          # EXISTING: UnifiedOrder type (no changes)
│   ├── stores/
│   │   └── theme.svelte.ts    # EXISTING: No changes
│   └── utils/
│       └── format.ts          # EXISTING: No changes
├── routes/
│   ├── +layout.svelte         # MODIFY: Add DataProvider wrapper
│   └── +page.svelte           # MODIFY: Replace mock data with DB queries
└── app.d.ts                   # MODIFY: Add env type declarations

tests/
├── unit/
│   ├── db/
│   │   ├── duckdb.test.ts     # DuckDB initialization tests
│   │   ├── queries.test.ts    # SQL query tests
│   │   └── loader.test.ts     # Parquet loading tests
│   └── components/
│       └── stats.test.ts      # Stats calculation tests
└── e2e/
    └── dashboard.spec.ts      # End-to-end dashboard tests
```

**Structure Decision**: Web application structure with new `db/` directory under `lib/` for DuckDB integration. This follows the Constitution's code organization pattern and keeps database logic separate from UI components.

## Complexity Tracking

> No violations - design aligns with Constitution principles.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |

## Implementation Phases

### Phase 1: Core DuckDB Integration (P1 - Data Loading)

**Goal**: Initialize DuckDB WASM and load Parquet file on app start

**Files to create**:
1. `src/lib/db/duckdb.ts` - Singleton initialization
2. `src/lib/db/loader.ts` - Parquet fetch and load
3. `src/lib/db/queries.ts` - SQL query definitions
4. `src/lib/components/DataProvider.svelte` - Context provider
5. `src/lib/components/LoadingIndicator.svelte` - Loading UI
6. `src/lib/components/ErrorMessage.svelte` - Error UI

**Files to modify**:
1. `src/routes/+layout.svelte` - Wrap with DataProvider
2. `src/app.d.ts` - Add PUBLIC_PARQUET_URL type
3. `.env` - Add PUBLIC_PARQUET_URL variable

**Dependencies to add**:
- `@duckdb/duckdb-wasm`

### Phase 2: Dashboard Statistics (P2 - Aggregations)

**Goal**: Calculate and display real statistics from loaded data

**Files to create**:
1. `src/lib/db/stats.svelte.ts` - Reactive stats service

**Files to modify**:
1. `src/routes/+page.svelte` - Replace mock stats with DB queries
2. `src/lib/components/StatCard.svelte` - Handle loading/error states

### Phase 3: Orders Table Integration (P2 continued)

**Goal**: Populate orders table with real data, preserve pagination

**Files to modify**:
1. `src/routes/+page.svelte` - Query orders from DB
2. `src/lib/components/OrdersTable.svelte` - Minor adjustments for data source

### Phase 4: Refresh Functionality (FR-002a)

**Goal**: Add manual refresh button

**Files to create**:
1. `src/lib/components/RefreshButton.svelte` - Refresh button component

**Files to modify**:
1. `src/routes/+page.svelte` - Add refresh button to header

### Phase 5: Testing & Polish

**Goal**: Comprehensive testing and error handling

**Files to create**:
1. `tests/unit/db/duckdb.test.ts`
2. `tests/unit/db/queries.test.ts`
3. `tests/unit/db/loader.test.ts`
4. `tests/e2e/dashboard.spec.ts`

## Key SQL Queries

```sql
-- Total trades count (FR-006)
SELECT COUNT(*) as total_trades FROM orders;

-- Total volume (FR-007) - sum of sellAmountCents per clarification
SELECT SUM(sell_amount_cents) as total_volume FROM orders;

-- Open orders count (FR-008)
SELECT COUNT(*) as open_orders FROM orders WHERE status = 'open';

-- Volume by currency (FR-009)
SELECT
  sell_currency as currency,
  SUM(sell_amount_cents) as volume
FROM orders
GROUP BY sell_currency
ORDER BY volume DESC;

-- Paginated orders (FR-010, FR-011)
SELECT * FROM orders
ORDER BY creation_date DESC
LIMIT ? OFFSET ?;
```

## Success Criteria Mapping

| Criteria | Implementation | Verification |
|----------|----------------|--------------|
| SC-001: < 10s load | Async fetch + DuckDB COPY | Performance test |
| SC-002: 100% accuracy | SQL aggregations | Unit tests |
| SC-003: 100K records | DuckDB handles natively | Load test |
| SC-004: 500ms loading indicator | Immediate state update | Manual + e2e |
| SC-005: 2s error display | Try/catch with state update | Unit test |
| SC-006: < 100ms pagination | SQL LIMIT/OFFSET | Performance test |

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Large Parquet file (> 100MB) | Show warning, implement chunking in future |
| CORS issues | Document server configuration requirements |
| Browser memory limits | Track memory usage, warn if approaching limit |
| DuckDB WASM bundle size | Lazy load, show loading state |

## Next Steps

Run `/speckit.tasks` to generate actionable task list from this plan.
