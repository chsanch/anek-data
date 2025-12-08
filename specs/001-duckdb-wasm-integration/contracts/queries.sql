-- SQL Query Contracts for DuckDB WASM Integration
-- Feature: 001-duckdb-wasm-integration
-- Date: 2025-12-08

-- ============================================================================
-- TABLE CREATION
-- ============================================================================

-- Create orders table from Parquet file
-- Used by: loader.ts
CREATE OR REPLACE TABLE orders AS
SELECT * FROM read_parquet('orders.parquet');

-- Alternative: Create table with explicit schema (for validation)
-- Used when schema validation is needed
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR PRIMARY KEY,
    reference VARCHAR NOT NULL,
    fx_order_type VARCHAR NOT NULL,
    market_direction VARCHAR NOT NULL,
    buy_amount_cents BIGINT NOT NULL,
    sell_amount_cents BIGINT NOT NULL,
    buy_currency VARCHAR NOT NULL,
    sell_currency VARCHAR NOT NULL,
    rate DECIMAL(18,8) NOT NULL,
    value_date DATE NOT NULL,
    creation_date DATE NOT NULL,
    execution_date DATE,
    status VARCHAR NOT NULL,
    liquidity_provider VARCHAR NOT NULL
);

-- ============================================================================
-- DASHBOARD STATISTICS QUERIES (FR-006 through FR-009)
-- ============================================================================

-- Query: Total Trades Count
-- Requirement: FR-006
-- Returns: Single row with total_trades column
SELECT COUNT(*) as total_trades FROM orders;

-- Query: Total Volume
-- Requirement: FR-007
-- Clarification: Sum of sellAmountCents (notional traded)
-- Returns: Single row with total_volume column (in cents)
SELECT COALESCE(SUM(sell_amount_cents), 0) as total_volume FROM orders;

-- Query: Open Orders Count
-- Requirement: FR-008
-- Returns: Single row with open_orders column
SELECT COUNT(*) as open_orders
FROM orders
WHERE status = 'open';

-- Query: Volume by Currency
-- Requirement: FR-009
-- Returns: Multiple rows with currency and volume columns, sorted by volume desc
SELECT
    sell_currency as currency,
    COALESCE(SUM(sell_amount_cents), 0) as volume
FROM orders
GROUP BY sell_currency
ORDER BY volume DESC;

-- Query: All Dashboard Stats (Combined)
-- Optimization: Single query for all stats except volume by currency
-- Returns: Single row with all aggregate columns
SELECT
    COUNT(*) as total_trades,
    COALESCE(SUM(sell_amount_cents), 0) as total_volume,
    COUNT(*) FILTER (WHERE status = 'open') as open_orders,
    COUNT(DISTINCT sell_currency) as active_currencies
FROM orders;

-- ============================================================================
-- ORDERS TABLE QUERIES (FR-010, FR-011)
-- ============================================================================

-- Query: Paginated Orders
-- Requirement: FR-010, FR-011
-- Parameters: $1 = limit (page size), $2 = offset
-- Returns: Order rows for current page
SELECT
    id,
    reference,
    fx_order_type,
    market_direction,
    buy_amount_cents,
    sell_amount_cents,
    buy_currency,
    sell_currency,
    rate,
    value_date,
    creation_date,
    execution_date,
    status,
    liquidity_provider
FROM orders
ORDER BY creation_date DESC, id DESC
LIMIT $1 OFFSET $2;

-- Query: Total Order Count (for pagination)
-- Used to calculate total pages
SELECT COUNT(*) as total_count FROM orders;

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

-- Query: Schema Validation
-- Used to verify Parquet schema matches expected structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Query: Data Validation - Check for invalid status values
SELECT DISTINCT status
FROM orders
WHERE status NOT IN ('open', 'closed_to_trading', 'completed');

-- Query: Data Validation - Check for invalid fx_order_type values
SELECT DISTINCT fx_order_type
FROM orders
WHERE fx_order_type NOT IN ('forward', 'chain', 'spot');

-- Query: Data Validation - Check for negative amounts
SELECT COUNT(*) as invalid_count
FROM orders
WHERE buy_amount_cents < 0 OR sell_amount_cents < 0;

-- ============================================================================
-- UTILITY QUERIES
-- ============================================================================

-- Query: Order Count by Status (for debugging)
SELECT
    status,
    COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY count DESC;

-- Query: Order Count by Type (for debugging)
SELECT
    fx_order_type,
    COUNT(*) as count
FROM orders
GROUP BY fx_order_type
ORDER BY count DESC;

-- Query: Date Range (for debugging)
SELECT
    MIN(creation_date) as earliest_order,
    MAX(creation_date) as latest_order,
    MIN(value_date) as earliest_settlement,
    MAX(value_date) as latest_settlement
FROM orders;

-- Query: Currency Pairs Summary (for debugging)
SELECT
    buy_currency || '/' || sell_currency as pair,
    COUNT(*) as trade_count,
    SUM(sell_amount_cents) as total_volume
FROM orders
GROUP BY buy_currency, sell_currency
ORDER BY total_volume DESC
LIMIT 10;
