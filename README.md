# ANEK Data

FX Analytics Dashboard built with Svelte 5, SvelteKit, and DuckDB WASM.

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
PUBLIC_ARROW_URL=http://localhost:3000/arrow
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

- Svelte 5 + SvelteKit
- TypeScript
- Tailwind CSS 4
- DuckDB WASM
