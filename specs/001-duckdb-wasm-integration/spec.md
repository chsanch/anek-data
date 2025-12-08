# Feature Specification: DuckDB WASM Integration

**Feature Branch**: `001-duckdb-wasm-integration`
**Created**: 2025-12-08
**Status**: Draft
**Input**: User description: "Integrate DuckDB WASM for local data operations with parquet files. Download a batch of orders from a remote server, make data available locally for the client, populate the main orders table, and display aggregated statistics in the dashboard (total trades, total volume, etc.)."

## Clarifications

### Session 2025-12-08

- Q: Should data loading be automatic or user-initiated? → A: Auto-load on app start, with manual refresh button
- Q: How is the parquet file source URL configured? → A: Environment variable (set at build/deploy time)
- Q: Which field represents "Total Volume" for aggregation? → A: Sum of sellAmountCents (notional traded)

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Load Order Data from Remote Parquet File (Priority: P1)

As a dashboard user, I want the application to download and load order data from a remote parquet file so that I can view and analyze FX trading data locally without requiring continuous server connectivity.

**Why this priority**: This is the foundational capability that enables all other features. Without data loading, the dashboard cannot display any meaningful information. This provides the core value proposition of local data access.

**Independent Test**: Can be fully tested by loading a parquet file from a configured URL and verifying the data appears in the orders table. Delivers immediate value by enabling offline data access.

**Acceptance Scenarios**:

1. **Given** the application loads for the first time, **When** a remote parquet file URL is configured, **Then** the system downloads and loads the parquet file into the local data store
2. **Given** a parquet file is being downloaded, **When** the download is in progress, **Then** the user sees a loading indicator showing download status
3. **Given** a parquet file has been loaded, **When** the user views the orders table, **Then** the table displays the order records from the loaded file
4. **Given** the remote server is unreachable, **When** the application attempts to download data, **Then** the user sees a clear error message explaining the issue

---

### User Story 2 - View Aggregated Dashboard Statistics (Priority: P2)

As a dashboard user, I want to see aggregated statistics (total trades, total volume, etc.) calculated from the loaded order data so that I can quickly understand the overall trading activity.

**Why this priority**: Once data is loaded, users need summary metrics to gain insights without examining individual records. This transforms raw data into actionable information.

**Independent Test**: Can be tested by loading sample data and verifying that dashboard stat cards display correct calculated values (total trades count, sum of volumes, etc.).

**Acceptance Scenarios**:

1. **Given** order data has been loaded, **When** the user views the dashboard, **Then** the "Total Trades" stat card shows the count of all orders
2. **Given** order data has been loaded, **When** the user views the dashboard, **Then** the "Total Volume" stat card shows the sum of all transaction volumes
3. **Given** order data has been loaded, **When** the user views the dashboard, **Then** the "Open Orders" stat card shows the count of orders with status "open"
4. **Given** no data has been loaded yet, **When** the user views the dashboard, **Then** the stat cards display appropriate zero/empty states

---

### User Story 3 - View Volume by Currency Breakdown (Priority: P3)

As a dashboard user, I want to see trading volume broken down by currency so that I can understand currency distribution in my trading activity.

**Why this priority**: Provides deeper analytical value beyond basic totals, enabling currency-specific insights for FX trading decisions.

**Independent Test**: Can be tested by loading data with multiple currencies and verifying the currency breakdown section shows accurate volume per currency.

**Acceptance Scenarios**:

1. **Given** order data has been loaded, **When** the user views the currency breakdown section, **Then** each currency displays its total volume
2. **Given** order data contains multiple currencies, **When** the user views the currency breakdown, **Then** currencies are sorted by volume (highest first)

---

### Edge Cases

- What happens when the parquet file is empty (contains headers but no data)?
- How does the system handle malformed or corrupted parquet files?
- What happens when the parquet file schema doesn't match the expected order structure?
- How does the system behave when the parquet file is very large (over 100MB)?
- What happens if the browser runs out of memory while processing data?
- How are network timeouts handled during file download?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST initialize a local data store capable of querying columnar data when the application loads
- **FR-002**: System MUST automatically download parquet files from an environment-variable-configured remote URL on application start
- **FR-002a**: System MUST provide a manual refresh button allowing users to reload data on demand
- **FR-003**: System MUST parse and load parquet file contents into the local data store
- **FR-004**: System MUST display a loading indicator during data download and processing operations
- **FR-005**: System MUST display clear error messages when data loading fails (network errors, parsing errors, etc.)
- **FR-006**: System MUST calculate and display total order count from loaded data
- **FR-007**: System MUST calculate and display total trading volume as the sum of sellAmountCents (notional traded) from loaded data
- **FR-008**: System MUST calculate and display count of open orders from loaded data
- **FR-009**: System MUST calculate and display volume breakdown by sellCurrency (using sum of sellAmountCents per currency)
- **FR-010**: System MUST populate the orders table with records from the loaded parquet file
- **FR-011**: System MUST preserve existing table functionality (pagination, display formatting) when using loaded data
- **FR-012**: System MUST handle the existing order data schema (UnifiedOrder type with fields: id, reference, fxOrderType, marketDirection, buyAmountCents, sellAmountCents, buyCurrency, sellCurrency, rate, valueDate, creationDate, executionDate, status, liquidityProvider)

### Key Entities

- **Order**: A financial transaction record containing trade details including amounts, currencies, rates, dates, and status. This is the primary data entity loaded from parquet files.
- **Dashboard Statistics**: Aggregated metrics derived from orders including total count, total volume, currency breakdowns, and filtered counts.
- **Data Store**: Local query-capable storage that holds loaded order data and supports aggregation queries.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can view order data from a remote parquet file within 10 seconds of application load (for files under 10MB)
- **SC-002**: Dashboard statistics accurately reflect the loaded data (100% accuracy for totals and counts)
- **SC-003**: System successfully loads and displays parquet files containing up to 100,000 order records
- **SC-004**: Loading state is visible to users within 500ms of initiating data load
- **SC-005**: Error messages are displayed within 2 seconds of failure occurrence
- **SC-006**: Users can paginate through loaded orders with the same responsiveness as current mock data (page transitions under 100ms)

## Assumptions

- The parquet file format will follow a consistent schema matching the UnifiedOrder type
- Remote parquet files will be accessible via HTTPS without authentication for this initial implementation
- Browser memory will be sufficient for typical data volumes (up to 100,000 records)
- The existing dashboard UI structure (stat cards, orders table, currency breakdown) will be reused without redesign
- Initial implementation focuses on read-only operations; data modification features are out of scope
