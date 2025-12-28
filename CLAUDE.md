# ANEC Data - Project Instructions

## Package Manager

**ALWAYS use `pnpm`** - this project uses pnpm as the package manager.

- Install dependencies: `pnpm install`
- Add a package: `pnpm add <package>`
- Add dev dependency: `pnpm add -D <package>`
- Run scripts: `pnpm run <script>` or `pnpm <script>`

**NEVER use npm or yarn** - the project has `pnpm-lock.yaml` and uses pnpm workspaces.

## Tech Stack

- **Svelte 5** with runes (`$state`, `$derived`, `$effect`)
- **SvelteKit** for routing and SSR
- **TypeScript 5.x** in strict mode
- **Tailwind CSS 4** for styling
- **DuckDB WASM** for in-browser SQL analytics
- **idb** for IndexedDB cache (parquet file persistence)
- **Vitest** for testing

## Svelte MCP Server

You have access to the Svelte MCP server with comprehensive Svelte 5 and SvelteKit documentation. Use these tools effectively:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

## Code Quality Standards

### Svelte 5 Best Practices

- Use runes (`$state`, `$derived`, `$effect`) instead of stores for component state
- Use `$props()` for component props
- Use Svelte context API for sharing state across components (SSR-safe)
- Avoid `onMount` for data fetching when possible; prefer load functions or context

### $effect Best Practices

- **Don't update `$state` inside `$effect`** - This can cause infinite loops and is an anti-pattern
- Use `$effect` for side effects only (DOM manipulation, network requests, analytics)
- For tracking external state changes, use a **non-reactive tracker variable**:
  ```typescript
  let tracker: Date | null = null; // NOT $state!

  $effect(() => {
    if (externalState.lastRefresh !== tracker) {
      tracker = externalState.lastRefresh; // Update tracker (not reactive)
      doSideEffect(); // Trigger side effects
    }
  });
  ```
- Prefer `$derived` over `$effect` when computing values from other state

### TypeScript

- All code must be strictly typed
- Use interfaces for object shapes
- Use discriminated unions for error types
- Prefer `unknown` over `any`

### File Naming

- Components: `PascalCase.svelte`
- Modules: `kebab-case.ts` or `camelCase.ts`
- Svelte modules with runes: `*.svelte.ts`

## Common Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm check        # TypeScript check
pnpm lint         # Lint code
pnpm format       # Format code
pnpm test:unit    # Run tests
```

## Project Structure

```
src/
├── lib/
│   ├── components/   # Reusable Svelte components
│   ├── db/           # DuckDB WASM integration layer
│   ├── types/        # TypeScript type definitions
│   ├── stores/       # Svelte stores (legacy, prefer runes)
│   └── utils/        # Utility functions
├── routes/           # SvelteKit routes
└── app.d.ts          # Global type declarations
```

## Environment Variables

- Public env vars must be prefixed with `PUBLIC_`
- Access via `$env/static/public` or `$env/dynamic/public`
- See `.env.example` for a complete template

### Data Source

| Variable | Description | Default |
|----------|-------------|---------|
| `PUBLIC_DATA_SOURCE` | Data source type: `'parquet'` or `'arrow'` | `'parquet'` |
| `PUBLIC_PARQUET_URL` | URL to remote parquet file | - |
| `PUBLIC_ARROW_URL` | URL to Arrow IPC stream endpoint | - |

### Currency

| Variable | Description | Default |
|----------|-------------|---------|
| `PUBLIC_CURRENCIES_URL` | URL to currencies endpoint (returns `[{code, minor_units}]`) | - |

### Cache

| Variable | Description | Default |
|----------|-------------|---------|
| `PUBLIC_CACHE_TTL` | Cache TTL in milliseconds (0 to disable) | `86400000` (24h) |

## Testing Local Parquet Server

To test with a local parquet file, start a Python HTTP server:

```bash
cd /path/to/parquet/files && python3 -m http.server 8888
```

Then set `PUBLIC_PARQUET_URL=http://localhost:8888/orders.parquet` in `.env`

## Caching Architecture

The application uses IndexedDB to cache data files (both Parquet and Arrow) for faster page loads:

- **Cache Service**: `src/lib/db/cache.ts` - `ParquetCacheService` class handles all caching logic
- **Cache Types**: `src/lib/db/cache-types.ts` - TypeScript interfaces for cache entities
- **Cache Indicator**: `src/lib/components/CacheIndicator.svelte` - UI component showing cache status
- **Arrow Loader**: `src/lib/db/arrow-loader.ts` - Loads Arrow IPC streams with cache support

### Cache Features

- Time-based expiration (configurable via `PUBLIC_CACHE_TTL`)
- ETag-based validation (sends `If-None-Match` header, handles 304 responses)
- Graceful degradation (falls back to network if IndexedDB unavailable)
- Offline support (uses stale cache with warning when network fails)
- Corruption detection (validates cache entries, auto-deletes invalid data)

### Cache States

- `idle`: Initial state
- `checking`: Validating cache
- `loading`: Fetching from network
- `ready`: Data loaded (from cache or network)
- `error`: Failed to load

## Refresh Architecture

The application has a two-tier refresh system:

### Header Refresh (CacheIndicator)
- Calls `dataContext.forceRefresh()` - fetches new data from server
- Bypasses IndexedDB cache, always makes network request
- Updates `dataContext.state.lastRefresh` when complete
- Dashboard pages react via `$effect` watching `lastRefresh`

### Table/Component Refresh
- Calls local `handleTableRefresh()` - re-queries DuckDB only
- No network request, just invalidates query caches and reloads from existing DuckDB data
- Fast, used for UI refreshes without fetching new server data

### Query Cache (In-Memory)
- 30-second TTL for expensive DuckDB queries (stats, distributions, trends)
- Invalidated on any refresh (header or table)
- See `src/lib/utils/debounce.ts` for `QueryCache` class

## Currency Formatting

The application supports proper currency formatting based on ISO 4217 minor units:

- **Types**: `src/lib/types/currency.ts` - `Currency`, `CurrencyMap` interfaces
- **Service**: `src/lib/db/currencies.ts` - Loads currencies into DuckDB and returns a lookup map
- **Formatting**: `src/lib/utils/format.ts` - `formatCurrency(cents, currencyCode, currencyMap)`

### Minor Units Examples

| Currency | Minor Units | 1000 cents displays as |
|----------|-------------|------------------------|
| EUR, USD | 2 | 10.00 |
| JPY | 0 | 1,000 |
| KWD | 3 | 1.000 |

The currency map is loaded from `PUBLIC_CURRENCIES_URL` on startup and available via `getDataContext().currencyMap`.

## Normalised Amounts

Order volumes are normalized to EUR for accurate cross-currency comparison:

- **Field**: `normalisedAmountCents` on `UnifiedOrder` - EUR-equivalent value at order creation time
- **Database column**: `normalised_amount_cents BIGINT` - stored in cents
- **Usage**: Volume by Currency KPI uses this for accurate percentage calculations
- **Documentation**: `docs/normalised-volume-feature.md`

### Why Normalize?

Raw currency amounts are misleading (77T JPY ≠ 77T EUR). Normalizing to EUR allows:
- Accurate volume comparison across currencies
- Meaningful percentage breakdowns
- Proper sorting by economic value

### Query Example

```sql
SELECT
    sell_currency as currency,
    SUM(normalised_amount_cents / 100.0) as volume_eur
FROM orders
GROUP BY sell_currency
ORDER BY volume_eur DESC
```

## Recent Changes

- 008-normalised-volume: EUR-normalized amounts for accurate cross-currency volume comparison, enhanced Volume by Currency KPI with percentages and thicker bars, schema validation for Arrow loads

- 007-dashboard-kpi-phase2: Dashboard KPI improvements - sparklines for 7-day trends, Orders Today, Buy/Sell ratio visualization, Top LP insight, reactive data refresh with two-tier system

- 006-currency-formatting: Added currency minor units support for proper amount formatting (JPY, KWD, etc.)

- 005-arrow-cache: Extended IndexedDB caching to Arrow data source, smart relative timestamps in CacheIndicator, 24h default TTL

- 004-analytics-page: Added TypeScript 5.9 (strict mode) + SvelteKit 2.48, Svelte 5.43, Lightweight Charts (TradingView), DuckDB WASM 1.30, TanStack Table Core 8.21

- 003-parquet-cache: Added browser data persistence with IndexedDB caching, ETag validation, cache status UI indicator

## Active Technologies

- TypeScript 5.9 (strict mode) + SvelteKit 2.48, Svelte 5.43, Lightweight Charts (TradingView), DuckDB WASM 1.30, TanStack Table Core 8.21 (004-analytics-page)
- DuckDB WASM (in-browser) + IndexedDB (cache via idb 8.0) (004-analytics-page)
