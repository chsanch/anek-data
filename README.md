# ANEC Data

FX Analytics Dashboard for exploring and visualizing foreign exchange order data. Built with Svelte 5, SvelteKit, and DuckDB WASM for in-browser SQL analytics — no backend database required.

## Features

- **Dashboard KPIs** — Orders Today, Buy/Sell ratio, Top LP insights, with 7-day sparkline trends
- **Analytics page** — Interactive charts for volume over time, buy/sell direction, status distribution, and price analysis (powered by TradingView Lightweight Charts)
- **Orders table** — Sortable, filterable order list with expandable row details (powered by TanStack Table)
- **In-browser SQL** — All queries run locally via DuckDB WASM on Arrow IPC data streams
- **Currency formatting** — ISO 4217 minor units support (JPY 0 decimals, KWD 3 decimals, EUR/USD 2 decimals)
- **EUR-normalised volumes** — Cross-currency volume comparison normalised to EUR
- **IndexedDB caching** — Persistent data cache with ETag validation, configurable TTL, and offline support

## Quick Start

```bash
pnpm install
pnpm dev
```

## Setup

1. Copy `.env.example` to `.env`
2. Configure `PUBLIC_ARROW_URL` with your Arrow IPC stream endpoint

### Environment Variables

| Variable                | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `PUBLIC_ARROW_URL`      | URL to Arrow IPC stream endpoint (required)         |
| `PUBLIC_CURRENCIES_URL` | URL to currencies endpoint for minor units lookup   |
| `PUBLIC_CACHE_TTL`      | Cache TTL in milliseconds (default: 86400000 = 24h) |

### Example `.env`

```bash
PUBLIC_ARROW_URL=http://localhost:3000/entries
PUBLIC_CURRENCIES_URL=http://localhost:3000/currencies
PUBLIC_CACHE_TTL=86400000
```

## Scripts

| Command          | Description          |
| ---------------- | -------------------- |
| `pnpm dev`       | Start dev server     |
| `pnpm build`     | Build for production |
| `pnpm check`     | TypeScript check     |
| `pnpm lint`      | Lint code            |
| `pnpm format`    | Format code          |
| `pnpm test:unit` | Run tests            |

## Tech Stack

- [Svelte 5](https://svelte.dev/) + [SvelteKit](https://svelte.dev/docs/kit) — UI framework and routing
- [TypeScript 5.9](https://www.typescriptlang.org/) — Strict mode
- [Tailwind CSS 4](https://tailwindcss.com/) — Utility-first styling
- [DuckDB WASM 1.32](https://duckdb.org/docs/api/wasm/overview) — In-browser SQL engine
- [Apache Arrow 21](https://arrow.apache.org/docs/js/) — Columnar data format (IPC streams)
- [TanStack Table 8](https://tanstack.com/table) — Headless table logic
- [Lightweight Charts 5](https://tradingview.github.io/lightweight-charts/) — Financial charting (TradingView)
- [idb 8](https://github.com/nicedoc/idb) — IndexedDB wrapper for data caching
- [Vitest](https://vitest.dev/) — Unit testing
