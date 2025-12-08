#!/usr/bin/env python3
"""
Generate sample FX Orders data in Parquet format.
Creates realistic-looking data matching the unified-orders structure.

Usage:
    pip install pandas pyarrow
    python generate_sample_data.py

Output:
    orders.parquet - 50K rows of sample FX order data
"""

import random
import string
from datetime import datetime, timedelta
import pandas as pd

# Configuration
NUM_ROWS = 50_000
OUTPUT_FILE = "orders.parquet"

# Realistic FX data parameters
CURRENCIES = ["EUR", "USD", "CHF", "GBP", "DKK", "SEK", "NOK", "JPY"]
BASE_CURRENCY = "EUR"  # Most orders involve EUR

# Realistic exchange rates (approximate, vs EUR)
EXCHANGE_RATES = {
    "EUR": 1.0,
    "USD": 1.05,
    "CHF": 0.94,
    "GBP": 0.86,
    "DKK": 7.46,
    "SEK": 11.20,
    "NOK": 11.80,
    "JPY": 162.0,
}

FX_ORDER_TYPES = ["forward", "chain", "spot"]
FX_ORDER_TYPE_WEIGHTS = [0.3, 0.6, 0.1]  # chains are most common

MARKET_DIRECTIONS = ["buy", "sell"]

STATUSES = ["open", "closed_to_trading", "completed"]
STATUS_WEIGHTS = [0.5, 0.3, 0.2]

LIQUIDITY_PROVIDERS = ["SIVB", "RBS", "SEB", "BARC", "CITI", "HSBC"]


def generate_reference(order_type: str) -> str:
    """Generate a realistic order reference."""
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
    if order_type == "chain":
        return f"KCH-{suffix}"
    else:
        return f"K-{suffix}"


def generate_rate(buy_currency: str, sell_currency: str) -> float:
    """Generate a realistic exchange rate with some variation."""
    if buy_currency == sell_currency:
        return 1.0

    # Calculate base rate
    buy_rate = EXCHANGE_RATES.get(buy_currency, 1.0)
    sell_rate = EXCHANGE_RATES.get(sell_currency, 1.0)
    base_rate = sell_rate / buy_rate

    # Add some random variation (+/- 2%)
    variation = random.uniform(-0.02, 0.02)
    return round(base_rate * (1 + variation), 7)


def generate_amount_cents() -> int:
    """Generate realistic order amounts (in cents)."""
    # Mix of different order sizes
    size_type = random.choices(
        ["small", "medium", "large", "very_large"],
        weights=[0.3, 0.4, 0.2, 0.1]
    )[0]

    if size_type == "small":
        return random.randint(100_00, 50_000_00) * 100  # 100 - 50K
    elif size_type == "medium":
        return random.randint(50_000_00, 500_000_00) * 100  # 50K - 500K
    elif size_type == "large":
        return random.randint(500_000_00, 5_000_000_00) * 100  # 500K - 5M
    else:
        return random.randint(5_000_000_00, 100_000_000_00) * 100  # 5M - 100M


def generate_dates(status: str) -> tuple:
    """Generate realistic creation, execution, and value dates."""
    # Creation date: within last 12 months
    days_ago = random.randint(0, 365)
    creation_date = datetime.now() - timedelta(days=days_ago)

    # Value date: 1-12 months after creation
    value_date_offset = random.randint(1, 365)
    value_date = creation_date + timedelta(days=value_date_offset)

    # Execution date: between creation and now (if executed)
    execution_date = None
    if status in ["closed_to_trading", "completed"]:
        max_exec_days = min(days_ago, (datetime.now() - creation_date).days)
        if max_exec_days > 0:
            exec_offset = random.randint(0, max_exec_days)
            execution_date = creation_date + timedelta(days=exec_offset)

    return (
        creation_date.strftime("%Y-%m-%d"),
        execution_date.strftime("%Y-%m-%d") if execution_date else None,
        value_date.strftime("%Y-%m-%d")
    )


def generate_currency_pair() -> tuple:
    """Generate a realistic currency pair (most involve EUR)."""
    if random.random() < 0.7:  # 70% involve EUR
        other = random.choice([c for c in CURRENCIES if c != "EUR"])
        if random.random() < 0.5:
            return ("EUR", other)
        else:
            return (other, "EUR")
    else:
        # Non-EUR pair
        pair = random.sample([c for c in CURRENCIES if c != "EUR"], 2)
        return tuple(pair)


def generate_order() -> dict:
    """Generate a single order record."""
    fx_order_type = random.choices(FX_ORDER_TYPES, weights=FX_ORDER_TYPE_WEIGHTS)[0]
    reference = generate_reference(fx_order_type)

    market_direction = random.choice(MARKET_DIRECTIONS)
    status = random.choices(STATUSES, weights=STATUS_WEIGHTS)[0]

    buy_currency, sell_currency = generate_currency_pair()
    rate = generate_rate(buy_currency, sell_currency)

    # Generate amounts
    buy_amount_cents = generate_amount_cents()
    sell_amount_cents = int(buy_amount_cents * rate)

    # Determine which is the "amount" vs "counter-amount" based on direction
    if market_direction == "buy":
        amount_cents = buy_amount_cents
        counter_amount_cents = sell_amount_cents
        currency = buy_currency
        counter_currency = sell_currency
    else:
        amount_cents = sell_amount_cents
        counter_amount_cents = buy_amount_cents
        currency = sell_currency
        counter_currency = buy_currency

    creation_date, execution_date, value_date = generate_dates(status)

    return {
        "id": reference,
        "reference": reference,
        "fx_order_type": fx_order_type,
        "source": "fx_order",
        "creation_date": creation_date,
        "market_direction": market_direction,
        "buy_amount_cents": buy_amount_cents,
        "sell_amount_cents": sell_amount_cents,
        "buy_currency": buy_currency,
        "sell_currency": sell_currency,
        "amount_cents": amount_cents,
        "counter_amount_cents": counter_amount_cents,
        "currency": currency,
        "counter_currency": counter_currency,
        "value_date": value_date,
        "rate": rate,
        "liquidity_provider": random.choice(LIQUIDITY_PROVIDERS),
        "execution_date": execution_date,
        "status": status,
    }


def main():
    print(f"Generating {NUM_ROWS:,} sample orders...")

    # Generate all orders
    orders = [generate_order() for _ in range(NUM_ROWS)]

    # Create DataFrame
    df = pd.DataFrame(orders)

    # Convert date columns to proper date type
    df["creation_date"] = pd.to_datetime(df["creation_date"]).dt.date
    df["value_date"] = pd.to_datetime(df["value_date"]).dt.date
    df["execution_date"] = pd.to_datetime(df["execution_date"]).dt.date

    # Display sample and stats
    print("\n--- Sample Data (first 5 rows) ---")
    print(df.head().to_string())

    print("\n--- Data Statistics ---")
    print(f"Total rows: {len(df):,}")
    print(f"Order types: {df['fx_order_type'].value_counts().to_dict()}")
    print(f"Statuses: {df['status'].value_counts().to_dict()}")
    print(f"Currencies (buy): {df['buy_currency'].value_counts().to_dict()}")
    print(f"Date range: {df['creation_date'].min()} to {df['creation_date'].max()}")

    # Save to Parquet
    df.to_parquet(OUTPUT_FILE, engine="pyarrow", compression="snappy")

    # Report file size
    import os
    file_size = os.path.getsize(OUTPUT_FILE)
    print(f"\n--- Output ---")
    print(f"File: {OUTPUT_FILE}")
    print(f"Size: {file_size:,} bytes ({file_size / 1024 / 1024:.2f} MB)")
    print(f"Compression: snappy")


if __name__ == "__main__":
    main()
