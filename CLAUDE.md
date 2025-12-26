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
- Current env vars:
  - `PUBLIC_DATA_SOURCE`: Data source type (`'arrow'` or `'parquet'`, default: `'parquet'`)
  - `PUBLIC_PARQUET_URL`: URL to remote parquet file
  - `PUBLIC_ARROW_URL`: URL to Arrow IPC stream endpoint (Rust server)
  - `PUBLIC_CACHE_TTL`: Cache time-to-live in milliseconds (default: 86400000 = 24 hours)

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

## Recent Changes

- 005-arrow-cache: Extended IndexedDB caching to Arrow data source, smart relative timestamps in CacheIndicator, 24h default TTL

- 004-analytics-page: Added TypeScript 5.9 (strict mode) + SvelteKit 2.48, Svelte 5.43, Lightweight Charts (TradingView), DuckDB WASM 1.30, TanStack Table Core 8.21

- 003-parquet-cache: Added browser data persistence with IndexedDB caching, ETag validation, cache status UI indicator

## Active Technologies

- TypeScript 5.9 (strict mode) + SvelteKit 2.48, Svelte 5.43, Lightweight Charts (TradingView), DuckDB WASM 1.30, TanStack Table Core 8.21 (004-analytics-page)
- DuckDB WASM (in-browser) + IndexedDB (cache via idb 8.0) (004-analytics-page)
