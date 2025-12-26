# Arrow Data Caching Enhancement

## Decision Summary

**Enhancement:** Extend IndexedDB caching to Arrow data source

**Status:** In progress

---

## Problem

The original browser persistence implementation (see `browser-data-persistence-proposal.md`) only cached Parquet files. When `PUBLIC_DATA_SOURCE=arrow`, data is fetched from the network on every page load, even after browser restart.

### Current Behavior

```
User opens app (Arrow mode)
    │
    ▼
Fetch from http://localhost:8888/entries ──► Load into DuckDB
    │
    ▼
User closes browser and reopens
    │
    ▼
Fetch from http://localhost:8888/entries ──► Load into DuckDB (again!)
```

**Issues:**
1. No caching for Arrow data source
2. Data re-fetched on every page load
3. CacheIndicator shows "Idle" instead of meaningful status
4. Users can't tell when data was last downloaded

---

## Solution

Extend the existing `ParquetCacheService` to cache Arrow IPC stream data using the same IndexedDB infrastructure.

### New Behavior

```
User opens app (Arrow mode)
    │
    ▼
┌─────────────────────┐
│ Check IndexedDB     │
│ cache validity      │
└─────────────────────┘
    │
    ├─── Valid cache ──────► Load from IndexedDB ──► DuckDB
    │                        (shows "Cached • Dec 26, 14:30")
    │
    └─── Expired/Missing ──► Fetch from server ──► Store in IndexedDB ──► DuckDB
                             (shows "Synced • just now")
```

---

## Implementation Changes

### 1. `src/lib/db/arrow-loader.ts`

**Added:** `loadArrowWithCache()` function

```typescript
export async function loadArrowWithCache(
  db: AsyncDuckDB,
  url: string,
  cacheService: ParquetCacheService,
  options?: { forceRefresh?: boolean }
): Promise<LoadResult>
```

- Reuses the `ParquetCacheService` for caching Arrow data
- Passes custom fetch headers (`Accept: application/vnd.apache.arrow.stream`)
- Returns `LoadResult` with cache metadata for UI display

### 2. `src/lib/db/cache.ts`

**Modified:** `loadData()` method signature

```typescript
async loadData(
  url: string,
  options?: { forceRefresh?: boolean; fetchOptions?: RequestInit }
): Promise<LoadResult>
```

- Added `fetchOptions` parameter to support custom HTTP headers
- Merges custom headers with ETag conditional request headers

### 3. `src/lib/components/DataProvider.svelte`

**Modified:** Unified cache initialization for both data sources

- Cache service now initialized before checking data source type
- Arrow data path uses `loadArrowWithCache()` instead of `loadArrowFromUrl()`
- Cache status properly updated for Arrow data
- Default TTL increased from 1 hour to 24 hours

### 4. `src/lib/components/CacheIndicator.svelte`

**Enhanced:** Better timestamp and status display

| Before | After |
|--------|-------|
| "Idle" | "Cached" / "Synced" |
| "10:30 AM" | "5m ago" / "Dec 26, 14:30" |
| Blue dot only | Cyan (cached) / Green (fresh) |

**Smart timestamp formatting:**
- Under 1 hour: `5m ago`, `just now`
- Under 24 hours: `3h ago`
- Older: `Dec 26, 14:30`
- Different year: `Dec 26 '24, 14:30`

**Visual state colors:**
- **Cyan** - Data loaded from cache
- **Green** - Fresh data from network
- **Amber** - Stale data / Loading
- **Red** - Error state

---

## Configuration

### Environment Variables

```bash
# Data source selection
PUBLIC_DATA_SOURCE=arrow    # or 'parquet'

# Cache TTL (optional, default: 24 hours = 86400000ms)
PUBLIC_CACHE_TTL=86400000

# Arrow server URL
PUBLIC_ARROW_URL=http://localhost:8888/entries
```

---

## Cache Storage

Both Parquet and Arrow data are stored in the same IndexedDB database:

- **Database:** `anec-data-cache`
- **Object Store:** `parquet-cache`
- **Key:** URL of the data source

```typescript
interface CachedData {
  url: string;           // "http://localhost:8888/entries"
  data: ArrayBuffer;     // Arrow IPC stream binary
  timestamp: number;     // When downloaded
  expiresAt: number;     // TTL expiration
  fileSize: number;      // For display
  etag: string | null;   // Server ETag (if available)
}
```

---

## Testing

### Verify Cache Persistence

1. Open app at http://localhost:5173/
2. Wait for data to load (should show "Synced • just now")
3. Close browser completely
4. Reopen browser and navigate to app
5. Should show "Cached • Xm ago" (data loaded from IndexedDB)

### Force Refresh

1. Click the refresh button in header
2. Should show "Syncing..." then "Synced • just now"
3. IndexedDB cache updated with fresh data

### Check IndexedDB

1. Open DevTools → Application → IndexedDB
2. Expand `anec-data-cache` → `parquet-cache`
3. Verify entry exists with URL as key

---

## Files Changed

| File | Change Type |
|------|-------------|
| `src/lib/db/arrow-loader.ts` | Added `loadArrowWithCache()` |
| `src/lib/db/cache.ts` | Added `fetchOptions` parameter |
| `src/lib/components/DataProvider.svelte` | Unified cache for both sources |
| `src/lib/components/CacheIndicator.svelte` | Enhanced UI display |

---

## Limitations

- Arrow server must support CORS for browser requests
- ETag-based validation requires server to send ETag headers
- IndexedDB storage limits apply (~50% of disk on modern browsers)
- DuckDB still re-parses data on each page load (data cached, not query results)

---

## References

- [Original persistence spec](./browser-data-persistence-proposal.md)
- [Apache Arrow IPC format](https://arrow.apache.org/docs/format/Columnar.html#ipc-streaming-format)
- [idb library](https://github.com/jakearchibald/idb)
