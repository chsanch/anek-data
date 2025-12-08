# Browser Data Persistence - Implementation Spec

## Decision Summary

**Chosen approach:** IndexedDB + Parquet Buffer Storage

**Status:** Approved for implementation

---

## Problem

The app downloads the parquet file on every page load, causing unnecessary network requests and slow load times.

## Solution

Cache the parquet file in IndexedDB with time-based + ETag invalidation.

### How It Works

```
Page Load
    │
    ▼
┌─────────────────────┐
│ Check IndexedDB     │
│ cache validity      │
└─────────────────────┘
    │
    ├─── Valid cache ──────► Load from IndexedDB ──► DuckDB
    │
    └─── Expired/Missing ──► Fetch from server ──► Store in IndexedDB ──► DuckDB
```

### Key Decisions

| Decision | Choice |
|----------|--------|
| Storage mechanism | IndexedDB (persistent, survives browser restart) |
| Default TTL | 1 hour |
| Cache invalidation | Time-based + ETag headers |
| UI indicator | Yes - show cache status and last download time |
| Manual refresh | Yes - button to force re-download |
| Scope | Single table (`orders`) for now |

---

## What Gets Stored

```typescript
interface CachedParquet {
  url: string;           // Source URL
  data: ArrayBuffer;     // Raw parquet file
  timestamp: number;     // When downloaded
  expiresAt: number;     // TTL expiration
  fileSize: number;      // For display
  etag?: string;         // Server ETag for validation
}
```

## Cache Invalidation Logic

1. **Time check:** If `now > expiresAt`, cache is stale
2. **ETag check:** On refresh, send `If-None-Match` header; if server returns 304, keep cache
3. **Manual refresh:** User clicks "Refresh Data" button to bypass cache

## UI Requirements

- Show indicator when using cached data (e.g., "Cached • Last updated: 2:30 PM")
- "Refresh Data" button to force fresh download
- Show loading state during fetch

## Implementation Files

| File | Purpose |
|------|---------|
| `src/lib/db/cache.ts` | ParquetCacheService class |
| `src/lib/db/loader.ts` | Update to use cache layer |
| `src/lib/components/DataProvider.svelte` | Integrate cache, expose refresh |
| `src/lib/components/CacheIndicator.svelte` | UI component for cache status |

## Environment Variables

```bash
# Optional: Override default 1-hour TTL (in milliseconds)
PUBLIC_CACHE_TTL=3600000
```

## Limitations

- Data persists in IndexedDB but DuckDB still re-parses parquet on each page load
- Private/Incognito mode: cache cleared when window closes
- Browser storage limits apply (~50% of disk on Firefox, dynamic on Chrome)

## Future Considerations

If performance becomes critical for larger datasets, consider migrating to OPFS with DuckDB native persistence (requires HTTPS and COOP/COEP headers).

---

## References

- [idb library](https://github.com/jakearchibald/idb)
- [DuckDB WASM Persistence Discussion](https://github.com/duckdb/duckdb-wasm/discussions/1433)
- [MDN: Storage Quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
