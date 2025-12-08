# Quickstart: Browser Data Persistence (Parquet Cache)

**Feature**: 003-parquet-cache

## Prerequisites

- Node.js 18+
- pnpm installed
- Existing ANEC Data project setup

## Setup

### 1. Install Dependencies

```bash
pnpm add idb
```

### 2. Environment Configuration (Optional)

Create or update `.env` to customize cache TTL:

```bash
# .env
PUBLIC_CACHE_TTL=3600000  # 1 hour in milliseconds (default)
```

## Implementation Order

### Step 1: Cache Types (`src/lib/db/cache-types.ts`)

Define TypeScript interfaces for cache entities:

- `CachedParquet` - stored entry structure
- `CacheMetadata` - metadata without binary data
- `CacheStatus` - runtime status for UI
- `CacheConfig` - configuration options

### Step 2: Cache Service (`src/lib/db/cache.ts`)

Implement `ParquetCacheService` class:

- `init()` - open IndexedDB
- `isCacheValid(url)` - check TTL expiry
- `getMetadata(url)` - get metadata without data
- `loadData(url, options)` - load from cache or network
- `clearCache(url)` - remove specific entry
- `getStatus()` - get current status for UI

### Step 3: Update Loader (`src/lib/db/loader.ts`)

Modify `loadParquetFromUrl` to:

1. Accept cache service instance
2. Check cache before network fetch
3. Store successful fetches in cache
4. Handle ETag validation

### Step 4: Update DataProvider (`src/lib/components/DataProvider.svelte`)

Integrate cache service:

1. Initialize cache service on mount
2. Use cache-aware loading
3. Expose `cacheStatus` in context
4. Add `forceRefresh()` method

### Step 5: Cache Indicator (`src/lib/components/CacheIndicator.svelte`)

Create UI component:

1. Consume cache status from context
2. Display "Cached • Last updated: X" or loading state
3. Include refresh button
4. Show stale warning when applicable

### Step 6: Update Page (`src/routes/+page.svelte`)

Add `CacheIndicator` to the dashboard UI.

## Testing

### Manual Testing

1. **First Visit**: Open app, verify network request occurs
2. **Reload**: Refresh page, verify no parquet network request
3. **Cache Indicator**: Confirm timestamp displays correctly
4. **Force Refresh**: Click refresh button, verify new network request
5. **Browser Restart**: Close and reopen browser, verify cache loads
6. **TTL Expiry**: Wait for TTL (or modify), verify refresh occurs

### Automated Testing (Vitest)

```typescript
// Example test structure
describe('ParquetCacheService', () => {
  it('stores parquet data in IndexedDB', async () => { ... });
  it('returns cached data when TTL valid', async () => { ... });
  it('fetches fresh data when TTL expired', async () => { ... });
  it('handles 304 Not Modified responses', async () => { ... });
  it('falls back to network when cache unavailable', async () => { ... });
});
```

## Verification Checklist

- [ ] First load downloads and caches parquet file
- [ ] Subsequent loads use cache (no network request for parquet)
- [ ] Cache indicator shows correct timestamp
- [ ] Refresh button fetches fresh data
- [ ] Cache persists across browser sessions
- [ ] Graceful degradation when IndexedDB unavailable
- [ ] ETag validation works (304 responses handled)

## Troubleshooting

### Cache not persisting

- Check browser DevTools > Application > IndexedDB
- Verify `anec-data-cache` database exists
- Ensure not in private/incognito mode

### Network requests still occurring

- Verify TTL hasn't expired (default 1 hour)
- Check console for cache errors
- Confirm URL matches cached entry exactly

### IndexedDB errors

- Clear site data and reload
- Check storage quota in DevTools
- Review console for specific error messages
