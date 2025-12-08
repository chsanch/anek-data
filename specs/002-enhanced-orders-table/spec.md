# Feature Specification: Enhanced Orders Table

**Feature Branch**: `002-enhanced-orders-table`
**Created**: 2025-12-08
**Status**: Draft
**Input**: User description: "Provide a better UX/UI for the table that displays orders. Features include pagination, sorting, filtering, page size control, and the ability to download filtered results."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Column Sorting (Priority: P1)

As a user viewing the orders table, I want to click on column headers to sort data by that column so I can quickly find orders based on specific criteria like rate, date, or amount.

**Why this priority**: Sorting is the most fundamental table interaction. Without it, users cannot efficiently locate specific orders in large datasets. This delivers immediate value with minimal complexity.

**Independent Test**: Can be fully tested by clicking column headers and verifying data reorders correctly. Delivers value by allowing users to find highest/lowest rates, most recent orders, etc.

**Acceptance Scenarios**:

1. **Given** the orders table is displayed, **When** I click on the "Rate" column header, **Then** orders are sorted by rate in ascending order
2. **Given** orders are sorted by rate ascending, **When** I click the "Rate" header again, **Then** orders are sorted by rate in descending order
3. **Given** orders are sorted by rate, **When** I click on "Value Date" header, **Then** orders are re-sorted by value date and rate sort is cleared
4. **Given** the table is loading, **When** I click a column header, **Then** the sort action is queued until data loads

---

### User Story 2 - Page Size Control (Priority: P2)

As a user, I want to choose how many orders are displayed per page (10, 20, 50, 100) so I can balance between overview and detail based on my needs.

**Why this priority**: Page size control enhances the existing pagination and allows users to customize their view. It builds on P1 and requires minimal additional UI.

**Independent Test**: Can be fully tested by selecting different page sizes and verifying the correct number of rows appear. Delivers value by letting users see more data at once or focus on fewer items.

**Acceptance Scenarios**:

1. **Given** the orders table is displayed with default 20 rows, **When** I select "50" from the page size dropdown, **Then** the table displays up to 50 orders per page
2. **Given** I'm on page 3 with 20 items per page, **When** I change page size to 50, **Then** I'm reset to page 1 to avoid invalid page state
3. **Given** there are 75 total orders and page size is 50, **When** I view pagination, **Then** it shows 2 total pages

---

### User Story 3 - Reference Search (Priority: P3)

As a user, I want to search orders by reference number so I can quickly find a specific order when I know its reference (e.g., "KCH-X87AYWT5").

**Why this priority**: Reference search provides the most practical text search capability for this dataset. Other fields (status, type, currency, LP) are better served by dropdown filters (US4) since they have limited, enumerable values.

**Implementation Note**: Changed from "global text search across all columns" to "reference-only search" because:
- `reference` is the only truly searchable text field
- Other text fields (currency, status, type, LP) have limited values better suited for dropdown filters
- Searching across all columns would be overkill and potentially confusing

**Independent Test**: Can be fully tested by typing a reference (full or partial) and verifying matching rows are displayed. Delivers value by enabling rapid order lookup.

**Acceptance Scenarios**:

1. **Given** the orders table is displayed, **When** I type "KCH-X87" in the reference search field, **Then** only orders with reference containing "KCH-X87" are shown
2. **Given** I've searched for a reference, **When** I clear the search field, **Then** all orders are displayed again
3. **Given** I've searched for "NONEXISTENT", **When** no orders match, **Then** an empty state message is shown: "No orders match your search"
4. **Given** I type in the search field, **When** I pause typing for 300ms, **Then** the filter is applied (debounced)

---

### User Story 4 - Column-Specific Filters (Priority: P4)

As a user, I want to filter orders by specific column values (status, order type, currency) using dropdown filters so I can view subsets of data relevant to my task.

**Why this priority**: Column filters provide precise control over data visibility. More complex than text search but enables focused analysis (e.g., "show only open forward orders").

**Independent Test**: Can be fully tested by selecting filter values and verifying only matching rows appear. Delivers value by enabling focused data views.

**Acceptance Scenarios**:

1. **Given** the orders table is displayed, **When** I select "open" from the status filter, **Then** only orders with status "open" are displayed
2. **Given** I've filtered by status "open", **When** I also select type "forward", **Then** only open forward orders are displayed (filters combine with AND)
3. **Given** filters are applied, **When** I click "Clear filters", **Then** all filters are removed and all orders are shown
4. **Given** I've applied a status filter, **When** I use text search, **Then** both filters apply simultaneously

---

### User Story 5 - Export Filtered Results (Priority: P5)

As a user, I want to export the currently filtered/sorted view as CSV so I can analyze or share the specific subset of data I'm viewing.

**Why this priority**: Export of filtered data extends the existing export functionality. Requires filter state to be tracked and passed to export logic.

**Independent Test**: Can be fully tested by applying filters, clicking export, and verifying the CSV contains only filtered results. Delivers value by enabling filtered data extraction.

**Acceptance Scenarios**:

1. **Given** I've filtered orders to show only "completed" status, **When** I click Export, **Then** the export modal shows the filtered count (not total count)
2. **Given** I've applied multiple filters and sorting, **When** I export, **Then** the CSV contains only matching orders in the current sort order
3. **Given** no filters are applied, **When** I click Export, **Then** the existing export modal behavior is preserved (export all or by date range)
4. **Given** filters are applied, **When** I open export modal, **Then** I see options to "Export filtered results" or "Export all orders"

---

### Edge Cases

- What happens when sorting a column with null/empty values? Nulls should sort to the end regardless of sort direction.
- What happens when filter criteria match zero records? Display "No orders match your criteria" empty state with option to clear filters.
- What happens when user rapidly changes filters? Debounce filter application (300ms) to avoid excessive re-renders.
- What happens when page size change results in invalid page? Reset to page 1 and recalculate pagination.
- What happens when data is still loading and user tries to filter/sort? Queue the operation or disable controls until data loads.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support sorting by any visible column (ascending/descending toggle)
- **FR-002**: System MUST indicate current sort column and direction visually (arrow icon)
- **FR-003**: System MUST provide page size selector with options: 10, 20, 50, 100
- **FR-004**: System MUST persist user's page size preference during the session
- **FR-005**: System MUST provide a reference search input that filters orders by reference field (partial match)
- **FR-006**: System MUST debounce reference search input by 300ms before applying filter
- **FR-007**: System MUST provide dropdown filters for: status, fx_order_type, buy_currency, sell_currency
- **FR-008**: System MUST allow combining multiple filters (AND logic)
- **FR-009**: System MUST display active filter count/indicators
- **FR-010**: System MUST provide "Clear all filters" action
- **FR-011**: System MUST update pagination info to reflect filtered results count
- **FR-012**: System MUST allow exporting filtered results as CSV
- **FR-013**: System MUST perform all filtering and sorting client-side using data already loaded in DuckDB
- **FR-014**: System MUST maintain filter/sort state when navigating between pages

### Key Entities

- **TableState**: Current pagination, sorting, and filtering configuration (page, pageSize, sortColumn, sortDirection, filters, searchTerm)
- **ColumnDefinition**: Configuration for each table column including sortable flag, filterable flag, filter type (text/select), and filter options
- **FilterCriteria**: Active filters including search term, column-specific filters, and their values

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can sort any column within 100ms response time (client-side operation)
- **SC-002**: Users can apply filters and see results within 200ms (client-side filtering)
- **SC-003**: All table interactions (sort, filter, page change) work without page reload
- **SC-004**: Exported CSV accurately reflects current filtered/sorted view
- **SC-005**: Table remains responsive with 10,000+ rows loaded in DuckDB
- **SC-006**: Filter controls are accessible via keyboard navigation
