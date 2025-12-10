# Implementation Plan: Analytics Page

**Branch**: `004-analytics-page` | **Date**: 2025-12-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-analytics-page/spec.md`

## Summary

Add a dedicated analytics page with three visualizations: daily volume trends (area chart), buy vs sell balance (histogram), and order status distribution (HTML/CSS bars). Uses Lightweight Charts for time-series financial data visualization. Includes a time range selector defaulting to 30 days with user-adjustable range.

## Technical Context

**Language/Version**: TypeScript 5.9 (strict mode)
**Primary Dependencies**: SvelteKit 2.48, Svelte 5.43, Lightweight Charts (TradingView), DuckDB WASM 1.30, TanStack Table Core 8.21
**Storage**: DuckDB WASM (in-browser) + IndexedDB (cache via idb 8.0)
**Testing**: Vitest 4.0 + Playwright 1.56
**Target Platform**: Web (modern browsers with WASM support)
**Project Type**: Web application (SvelteKit)
**Performance Goals**: < 3s page load, < 50ms simple queries, < 200ms complex aggregations (per constitution)
**Constraints**: Local-first architecture, no server-side query execution, offline-capable
**Scale/Scope**: Up to 20,000 orders in browser database

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Local-First Architecture | ✅ PASS | All analytics queries run in DuckDB WASM browser-side |
| II. Data Integrity & Sync | ✅ PASS | Uses existing DataProvider, amounts in cents |
| III. Performance-First Design | ✅ PASS | Targets align (3s load, 50ms queries) |
| IV. Component Independence | ✅ PASS | Each chart component manages own data/loading/error states |
| V. Simplicity Over Flexibility | ✅ PASS | Lightweight Charts for time-series, HTML/CSS for status distribution |

**Technology Stack Compliance**:
- ✅ Lightweight Charts specified in constitution for time-series
- ✅ No additional charting libraries needed (status uses HTML/CSS)
- ✅ Direct DuckDB SQL for queries
- ✅ Svelte 5 runes for state management

**No violations requiring justification.**

## Project Structure

### Documentation (this feature)

```text
specs/004-analytics-page/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no external API)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── components/
│   │   ├── charts/              # NEW: Chart components
│   │   │   ├── VolumeChart.svelte
│   │   │   ├── DirectionChart.svelte
│   │   │   └── StatusDistribution.svelte
│   │   └── TimeRangeSelector.svelte  # NEW: Date range picker
│   ├── db/
│   │   └── queries.ts           # EXTEND: Add analytics queries
│   ├── types/
│   │   └── analytics.ts         # NEW: Analytics type definitions
│   └── utils/
│       └── format.ts            # EXISTING: Already has formatCompact
├── routes/
│   └── analytics/
│       └── +page.svelte         # NEW: Analytics page route
└── tests/
    └── unit/
        └── analytics-queries.spec.ts  # NEW: Query tests
```

**Structure Decision**: Extends existing SvelteKit structure. New chart components go in `lib/components/charts/`. New route at `/analytics`. Query functions extend existing `queries.ts`.

## Complexity Tracking

> No violations. Constitution fully aligned with implementation approach.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| N/A | - | - |
