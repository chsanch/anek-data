# Requirements Checklist: Enhanced Orders Table

**Feature**: 002-enhanced-orders-table
**Generated**: 2025-12-08

## User Stories Completion

### P1 - Column Sorting
- [ ] Clicking column header sorts ascending
- [ ] Clicking same header toggles to descending
- [ ] Clicking different header clears previous sort
- [ ] Visual indicator shows current sort column and direction
- [ ] Sort works while data is loading (queued)

### P2 - Page Size Control
- [ ] Page size dropdown with options: 10, 20, 50, 100
- [ ] Changing page size updates displayed rows
- [ ] Changing page size resets to page 1
- [ ] Pagination info updates correctly
- [ ] Page size persists during session

### P3 - Text Search Filter
- [ ] Search input field visible in table toolbar
- [ ] Typing filters across all visible columns
- [ ] Clearing search shows all orders
- [ ] Empty state shown when no matches
- [ ] Search is debounced (300ms)

### P4 - Column-Specific Filters
- [ ] Status filter dropdown
- [ ] Order type filter dropdown
- [ ] Buy currency filter dropdown
- [ ] Sell currency filter dropdown
- [ ] Multiple filters combine with AND logic
- [ ] Active filter count/indicator shown
- [ ] "Clear all filters" button works

### P5 - Export Filtered Results
- [ ] Export modal shows filtered count when filters active
- [ ] "Export filtered results" option available
- [ ] Exported CSV contains only filtered data
- [ ] Exported CSV maintains current sort order
- [ ] Existing export behavior preserved when no filters

## Functional Requirements

- [ ] FR-001: Sort by any visible column
- [ ] FR-002: Visual sort indicators
- [ ] FR-003: Page size selector (10, 20, 50, 100)
- [ ] FR-004: Persist page size preference
- [ ] FR-005: Global text search
- [ ] FR-006: Debounced search (300ms)
- [ ] FR-007: Dropdown filters (status, type, currencies)
- [ ] FR-008: Combined filters (AND logic)
- [ ] FR-009: Active filter indicators
- [ ] FR-010: Clear all filters action
- [ ] FR-011: Pagination reflects filtered count
- [ ] FR-012: Export filtered results
- [ ] FR-013: Client-side filtering/sorting via DuckDB
- [ ] FR-014: Maintain state across page navigation

## Edge Cases

- [ ] Null values sort to end
- [ ] Zero results shows empty state with clear option
- [ ] Rapid filter changes are debounced
- [ ] Invalid page after size change resets to page 1
- [ ] Controls disabled during loading

## Success Criteria

- [ ] SC-001: Column sort < 100ms
- [ ] SC-002: Filter application < 200ms
- [ ] SC-003: No page reloads for interactions
- [ ] SC-004: Export matches filtered view
- [ ] SC-005: Responsive with 10,000+ rows
- [ ] SC-006: Keyboard accessible controls
