# Reactive Data Refresh

## Problem

The application has two refresh mechanisms:

1. **Header refresh** (CacheIndicator) - Fetches new data from the server
2. **Table refresh** (RefreshButton) - Should just re-query existing DuckDB data

Previously, clicking the header refresh would fetch new data into DuckDB, but the dashboard wouldn't update until manually clicking the table refresh.

## Solution: Reactive Effect + Separated Refresh Functions

### Two Refresh Behaviors

| Button         | Location                   | Behavior                   | Network Request |
| -------------- | -------------------------- | -------------------------- | --------------- |
| Header refresh | AppHeader (CacheIndicator) | Fetch new data from server | Yes             |
| Table refresh  | Orders section             | Re-query DuckDB            | No              |

### Implementation

```typescript
// Track last refresh (not $state - just a tracker variable)
let lastKnownRefresh: Date | null = null;

// React to data changes from ANY source (header refresh, initial load, etc.)
$effect(() => {
	if (dataContext.state.initialized && dataContext.db) {
		const currentRefresh = dataContext.state.lastRefresh;
		const isNewRefresh = currentRefresh !== lastKnownRefresh;

		if (isNewRefresh) {
			lastKnownRefresh = currentRefresh; // Update tracker (not reactive)

			// Invalidate caches and reload all data from DuckDB
			invalidateAllCaches();
			currentPage = 1;
			loadAllDashboardData();
		}
	}
});

// Table refresh - just re-query DuckDB (fast, no network)
function handleTableRefresh() {
	invalidateAllCaches();
	currentPage = 1;
	loadAllDashboardData();
}
```

### Why This Works

1. **Header refresh** calls `dataContext.forceRefresh()`:
   - Fetches new data from server
   - Loads into DuckDB
   - Updates `dataContext.state.lastRefresh`
   - The `$effect` detects the change and reloads the dashboard

2. **Table refresh** calls `handleTableRefresh()`:
   - Just invalidates query caches
   - Re-queries DuckDB with existing data
   - Fast, no network request

### About the `$effect` Pattern

The `$effect` watches `dataContext.state.lastRefresh` but doesn't update `$state` inside:

- `lastKnownRefresh` is a **regular variable**, not `$state`
- Updating it doesn't trigger reactivity loops
- It's just a tracker to detect changes

This follows Svelte 5 best practices - the effect reacts to external state changes and triggers side effects (data loading), but doesn't synchronize reactive state.

### Data Flow

**Header Refresh (fetch new data):**

```
Click header refresh
       ↓
AppHeader calls dataContext.forceRefresh()
       ↓
DataProvider fetches from server (bypasses cache)
       ↓
New data loaded into DuckDB
       ↓
dataContext.state.lastRefresh updated
       ↓
$effect detects change
       ↓
invalidateAllCaches() + loadAllDashboardData()
       ↓
UI updates with new data
```

**Table Refresh (re-query existing data):**

```
Click table refresh
       ↓
handleTableRefresh()
       ↓
invalidateAllCaches()
       ↓
loadAllDashboardData()
       ↓
Queries run against current DuckDB data
       ↓
UI updates (same data, just refreshed)
```

### Multi-Level Caching

| Level           | Storage     | TTL        | When Invalidated              |
| --------------- | ----------- | ---------- | ----------------------------- |
| Network/Storage | IndexedDB   | 24 hours   | Header refresh (forceRefresh) |
| Query Cache     | In-memory   | 30 seconds | Any refresh (header or table) |
| DuckDB          | WASM memory | Session    | Header refresh replaces table |

## Files Modified

- `src/routes/+page.svelte` - Dashboard with reactive effect and separated refresh handlers
- `src/lib/components/AppHeader.svelte` - Header with CacheIndicator calling `forceRefresh`
