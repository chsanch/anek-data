# Implementation Plan: Browser Data Persistence (Parquet Cache)

**Branch**: `003-parquet-cache` | **Date**: 2025-12-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-parquet-cache/spec.md`

## Summary

Implement IndexedDB-based caching for parquet files to eliminate redundant network downloads on page load. The cache service will store the raw parquet buffer with metadata (URL, timestamp, expiry, ETag), check validity before network requests, and provide UI indicators for cache status with manual refresh capability.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: SvelteKit, Svelte 5, @duckdb/duckdb-wasm, idb (IndexedDB wrapper)
**Storage**: IndexedDB (browser persistence for parquet buffers)
**Testing**: Vitest + Playwright
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge)
**Project Type**: Web application (SvelteKit)
**Performance Goals**:

- Cached page load: < 2 seconds
- Cache check: < 50ms
- UI indicator visible within 1 second of load completion
  **Constraints**:
- Parquet files < 500MB
- 1-hour default TTL (configurable)
- Graceful degradation when storage unavailable
  **Scale/Scope**: Single data source (orders table), single-user browser storage

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                      | Status | Notes                                                                                                |
| ------------------------------ | ------ | ---------------------------------------------------------------------------------------------------- |
| I. Local-First Architecture    | PASS   | IndexedDB caching aligns with client-side persistence strategy                                       |
| II. Data Integrity & Sync      | PASS   | IndexedDB for client-side persistence is explicitly endorsed; cache metadata ensures data provenance |
| III. Performance-First Design  | PASS   | Eliminates network latency for returning users; targets < 2s load time                               |
| IV. Component Independence     | PASS   | CacheIndicator component will manage its own state; cache service is decoupled                       |
| V. Simplicity Over Flexibility | PASS   | Using idb library (minimal wrapper) over complex caching abstractions; direct IndexedDB access       |

**Gate Result**: PASS - All constitution principles satisfied. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/003-parquet-cache/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output (internal service contracts)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── db/
│   │   ├── cache.ts           # NEW: ParquetCacheService implementation
│   │   ├── cache-types.ts     # NEW: Cache-related type definitions
│   │   ├── duckdb.ts          # Existing: DuckDB initialization
│   │   ├── loader.ts          # MODIFY: Integrate cache layer
│   │   ├── context.ts         # MODIFY: Expose cache status in context
│   │   ├── queries.ts         # Existing: Query functions
│   │   └── types.ts           # Existing: Data types
│   ├── components/
│   │   ├── DataProvider.svelte    # MODIFY: Use cache service, expose refresh
│   │   ├── CacheIndicator.svelte  # NEW: Cache status UI component
│   │   └── ...existing components
│   └── utils/
│       └── ...existing utilities
└── routes/
    ├── +layout.svelte     # Existing
    └── +page.svelte       # MODIFY: Add CacheIndicator to UI
```

**Structure Decision**: Extends existing SvelteKit structure. New cache module in `src/lib/db/` alongside existing DuckDB integration. New UI component in `src/lib/components/`.

## Complexity Tracking

> No constitution violations. Table intentionally left empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| -         | -          | -                                    |
