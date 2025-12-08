# Sample Data

Scripts to generate and serve sample FX orders data for local development.

## Prerequisites

```bash
pip install pandas pyarrow
```

## Generate Sample Data

```bash
cd sample-data
python generate_sample_data.py
```

This creates `orders.parquet` with 50,000 sample FX orders.

## Serve Parquet File

Start a CORS-enabled HTTP server:

```bash
python serve.py
```

Server runs at `http://localhost:8080`. Custom port: `python serve.py 9000`

## Configure App

Update `.env`:

```bash
PUBLIC_PARQUET_URL=http://localhost:8080/orders.parquet
```

## Data Schema

| Column | Type | Description |
|--------|------|-------------|
| id | string | Unique order ID |
| reference | string | Order reference (K-xxx or KCH-xxx) |
| fx_order_type | string | forward, chain, or spot |
| market_direction | string | buy or sell |
| buy_amount_cents | int | Buy amount in cents |
| sell_amount_cents | int | Sell amount in cents |
| buy_currency | string | Buy currency code |
| sell_currency | string | Sell currency code |
| rate | float | Exchange rate |
| value_date | date | Settlement date |
| creation_date | date | Order creation date |
| execution_date | date | Execution date (nullable) |
| status | string | open, closed_to_trading, completed |
| liquidity_provider | string | LP code |
