# Feature Specification: Analytics Page

**Feature Branch**: `004-analytics-page`
**Created**: 2025-12-10
**Status**: Draft
**Input**: User description: "Add analytics page with charts for daily volume trends, buy/sell balance, and order status distribution"

## Clarifications

### Session 2025-12-10

- Q: What is the default time range for charts? → A: Last 30 days by default
- Q: Can users adjust the time range? → A: Yes, users can change the range to see more or less data

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View Daily Volume Trends (Priority: P1)

As an FX trader or operations user, I want to see a visual chart showing daily trading volume over time so that I can identify activity patterns, seasonal trends, and busy trading periods at a glance.

**Why this priority**: Volume trends are the most fundamental metric for understanding trading activity. Without this, users cannot see the "big picture" of their FX operations.

**Independent Test**: Can be fully tested by loading the analytics page with historical data and verifying a time-series chart displays daily volumes. Delivers immediate value by showing activity patterns that would otherwise require manual data analysis.

**Acceptance Scenarios**:

1. **Given** the user is on the dashboard, **When** they click the "Analytics" navigation link, **Then** they are taken to the analytics page showing the volume trend chart
2. **Given** the analytics page is loaded with order data, **When** the chart renders, **Then** it displays daily total volume as a line or area chart with dates on the x-axis and volume amounts on the y-axis
3. **Given** multiple days of order data exist, **When** viewing the volume chart, **Then** each data point represents the aggregated sell volume for that day
4. **Given** no order data is available, **When** the analytics page loads, **Then** a friendly empty state message is shown instead of a blank chart

---

### User Story 2 - Analyze Buy vs Sell Balance (Priority: P2)

As an FX trader or risk analyst, I want to see a visual comparison of buy versus sell volumes over time so that I can understand market direction exposure and identify periods of imbalance.

**Why this priority**: Understanding directional exposure is critical for FX risk management. This builds on P1 by adding the directional dimension to volume analysis.

**Independent Test**: Can be tested by verifying the buy/sell chart shows separate series for buy and sell volumes, allowing quick visual comparison of market direction over time.

**Acceptance Scenarios**:

1. **Given** the analytics page is loaded, **When** viewing the buy/sell chart, **Then** it displays both buy and sell volumes as distinct visual elements (different colors or positions)
2. **Given** order data with mixed buy/sell directions exists, **When** the chart renders, **Then** users can visually compare the magnitude of buying vs selling activity for each time period
3. **Given** a period with only buy orders, **When** viewing that period on the chart, **Then** only the buy volume is shown (sell is zero)

---

### User Story 3 - View Order Status Distribution (Priority: P3)

As an operations manager, I want to see the breakdown of orders by status (open, closed_to_trading, completed) so that I can quickly understand the pipeline state and identify any backlog of unprocessed orders.

**Why this priority**: Status distribution provides operational insight complementing the volume/direction analysis. It's valuable but less critical than understanding volume trends and direction exposure.

**Independent Test**: Can be tested independently by verifying the status breakdown displays accurate counts/percentages for each status category using simple visual elements (bars, segments).

**Acceptance Scenarios**:

1. **Given** the analytics page is loaded, **When** viewing the status distribution section, **Then** it shows the count and/or percentage of orders in each status (open, closed_to_trading, completed)
2. **Given** orders with different statuses exist, **When** viewing the distribution, **Then** the visual representation (bars/segments) accurately reflects the proportions
3. **Given** all orders are in one status, **When** viewing the distribution, **Then** that status shows 100% and others show 0

---

### User Story 4 - Adjust Time Range (Priority: P2)

As a user viewing analytics, I want to adjust the time range for the charts so that I can focus on specific periods of interest or see the full historical picture.

**Why this priority**: Enables deeper analysis beyond the default 30-day view, allowing users to investigate specific time periods or long-term trends.

**Independent Test**: Can be tested by verifying the time range control updates all time-series charts when changed.

**Acceptance Scenarios**:

1. **Given** the analytics page is loaded, **When** viewing charts, **Then** the default time range is the last 30 days
2. **Given** the user wants to see more history, **When** they adjust the time range selector, **Then** all time-series charts update to reflect the new range
3. **Given** the user selects a range with no data, **When** charts update, **Then** appropriate empty states are shown

---

### Edge Cases

- What happens when the date range has gaps (no orders on certain days)?
  - Charts should handle sparse data gracefully, connecting data points or showing gaps appropriately
- How does the system handle very large volumes that might overflow display?
  - Use compact number formatting (K, M, B) for readability
- What happens if the database fails to load or queries time out?
  - Display appropriate error state with retry option
- How does the page behave on slow connections?
  - Show loading indicators while data is being processed

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a dedicated analytics page accessible via the existing "Analytics" navigation link
- **FR-002**: System MUST display a time-series chart showing daily aggregated trading volume
- **FR-003**: System MUST display a chart comparing buy versus sell volumes over time
- **FR-004**: System MUST display order status distribution showing counts for each status type (open, closed_to_trading, completed)
- **FR-005**: System MUST query data from the existing in-browser database using appropriate SQL aggregations
- **FR-006**: System MUST maintain consistent visual styling with the existing dashboard (dark/light theme support, same typography)
- **FR-007**: System MUST show loading states while chart data is being queried
- **FR-008**: System MUST show empty states when no data is available
- **FR-009**: System MUST show error states with retry capability if queries fail
- **FR-010**: System MUST use compact number formatting for large values (e.g., 1.5M instead of 1,500,000)
- **FR-011**: System MUST default to showing the last 30 days of data on initial page load
- **FR-012**: System MUST provide a time range selector allowing users to adjust the displayed date range
- **FR-013**: System MUST update all time-series charts when the time range selection changes

### Key Entities

- **DailyVolume**: Represents aggregated trading volume for a single day (date, total volume, trade count)
- **DailyDirectionVolume**: Represents buy/sell breakdown for a single day (date, buy volume, sell volume)
- **StatusDistribution**: Represents count of orders by status (status name, order count, percentage)

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can navigate to analytics page and view all three visualizations within 3 seconds of clicking the navigation link
- **SC-002**: Charts display data accurately reflecting the underlying order data (volume totals match dashboard totals within rounding tolerance)
- **SC-003**: Page renders correctly on both light and dark themes
- **SC-004**: Charts remain readable and performant with up to 20,000 orders loaded
- **SC-005**: Users can identify volume trends and buy/sell patterns without needing to export data to external tools

## Assumptions

- The existing in-browser database is already loaded with order data when the analytics page is accessed (data loading is handled by the existing DataProvider)
- The "Analytics" navigation link in the header already exists and just needs to route to the new page
- Time-series charts will aggregate by creation_date field from orders
- Volume calculations use sell_amount_cents converted to whole currency units (divide by 100)
- A lightweight charting library appropriate for financial data visualization will be used for time-series charts
- The status distribution can use simple HTML/CSS visualization without requiring a charting library
