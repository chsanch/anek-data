# ANEK Data

FX Analytics Dashboard built with Svelte 5, SvelteKit, and DuckDB WASM.

## Quick Start

```bash
pnpm install
pnpm dev
```

## Setup

1. Copy `.env.example` to `.env`
2. Configure `PUBLIC_PARQUET_URL` with your parquet file URL

For local testing, serve a parquet file:
```bash
python3 -m http.server 8888 --directory /path/to/parquet/files
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Build for production |
| `pnpm check` | TypeScript check |
| `pnpm lint` | Lint code |
| `pnpm format` | Format code |
| `pnpm test:unit` | Run tests |

## Tech Stack

- Svelte 5 + SvelteKit
- TypeScript
- Tailwind CSS 4
- DuckDB WASM
