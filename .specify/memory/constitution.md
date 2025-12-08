<!--
Sync Impact Report
==================
Version change: N/A → 1.0.0 (initial ratification)
Modified principles: N/A (initial creation)
Added sections:
  - Core Principles (5 principles)
  - Technology Stack section
  - Development Workflow section
  - Governance section
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (compatible - no changes needed)
  - .specify/templates/spec-template.md ✅ (compatible - no changes needed)
  - .specify/templates/tasks-template.md ✅ (compatible - no changes needed)
Follow-up TODOs: None
-->

# ANEK Data - FX Analytics Dashboard Constitution

## Core Principles

### I. Local-First Architecture

All analytics processing MUST occur in the browser using DuckDB WASM. Server interactions are limited to:

- Initial bulk data download (Parquet format)
- Incremental sync updates (JSON API)
- No real-time server-side query execution for analytics

**Rationale**: Instant query response times, offline capability, and reduced server load for internal analytics use cases.

### II. Data Integrity & Sync

Data synchronization MUST follow this hierarchy:

- Parquet files serve as the source of truth for bulk historical data
- IndexedDB provides client-side persistence for offline access
- Delta sync via JSON API keeps local data current
- All amounts stored in cents (integer) to avoid floating-point errors

**Rationale**: Ensures consistent, reliable data across sessions while supporting offline workflows.

### III. Performance-First Design

The application MUST meet these performance targets:

- Initial Parquet load: < 500ms for 20K orders
- Simple aggregation queries: < 50ms
- Complex GROUP BY queries: < 200ms
- UI interactions: No blocking during data operations

**Rationale**: Analytics dashboards are useless if users wait for results. Local-first architecture enables this performance.

### IV. Component Independence

Each dashboard component (chart, table, filter) MUST:

- Manage its own data subscriptions
- Handle loading and error states independently
- Be testable in isolation using Vitest
- Use Svelte 5 runes for reactive state management

**Rationale**: Enables parallel development, easier testing, and prevents cascading failures.

### V. Simplicity Over Flexibility

Implementation decisions MUST favor:

- Lightweight Charts for time-series (professional trading look, small bundle)
- HTML tables for categorical data over additional charting libraries
- Direct DuckDB SQL over abstraction layers
- Explicit data flows over implicit reactivity chains

**Rationale**: FX analytics has well-defined visualization needs. Over-engineering adds complexity without value.

## Technology Stack

**Framework**: SvelteKit with Svelte 5
**Language**: TypeScript (strict mode)
**Styling**: Tailwind CSS 4
**Data Layer**: DuckDB WASM + IndexedDB
**Charts**: Lightweight Charts (TradingView)
**Testing**: Vitest + Playwright
**Build**: Vite 7

**Data Formats**:

- Storage/Transfer: Apache Parquet
- In-Memory: Apache Arrow (handled by DuckDB)
- API Sync: JSON

**NOT in scope** (avoid adding without explicit justification):

- Additional charting libraries (ECharts, Chart.js)
- State management libraries (stores are sufficient)
- ORM or query builders (use raw SQL)
- Server-side rendering for analytics views

## Development Workflow

### Code Organization

```
src/
├── lib/
│   ├── db/           # DuckDB initialization, queries, sync
│   ├── components/   # Reusable UI components
│   └── utils/        # Type definitions, helpers
├── routes/           # SvelteKit pages
└── tests/            # Vitest tests
```

### Testing Requirements

- Unit tests for DuckDB query functions
- Component tests for chart and table components
- Integration tests for sync workflows
- Browser tests via Playwright for critical user flows

### Code Quality Gates

- All code MUST pass `npm run check` (TypeScript + Svelte checks)
- All code MUST pass `npm run lint` (ESLint + Prettier)
- Tests MUST pass before merging (`npm run test`)

## Governance

This constitution defines non-negotiable standards for the ANEK Data project. All implementation decisions, code reviews, and architectural changes MUST align with these principles.

### Amendment Process

1. Propose changes via pull request to this file
2. Document rationale for changes
3. Update dependent templates if principles change
4. Increment version according to:
   - MAJOR: Principle removal or fundamental redefinition
   - MINOR: New principle or significant guidance expansion
   - PATCH: Clarifications and wording improvements

### Compliance

- Code reviews MUST verify adherence to principles
- Deviations require documented justification in Complexity Tracking (see plan-template.md)
- Constitution takes precedence over convenience

**Version**: 1.0.0 | **Ratified**: 2025-12-08 | **Last Amended**: 2025-12-08
