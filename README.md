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

### Local Development with Sample Data

Generate and serve sample data (see [sample-data/README.md](sample-data/README.md)):

```bash
cd sample-data
pip install pandas pyarrow
python generate_sample_data.py
python serve.py
```

Then set in `.env`:

```bash
PUBLIC_PARQUET_URL=http://localhost:8080/orders.parquet
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
