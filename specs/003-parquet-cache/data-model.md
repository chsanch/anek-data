# Data Model: Browser Data Persistence (Parquet Cache)

**Feature**: 003-parquet-cache
**Date**: 2025-12-08

## Entities

### CachedParquet

Represents a cached parquet file with its metadata.

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `url` | `string` | Source URL of the parquet file | Primary key, non-empty |
| `data` | `ArrayBuffer` | Raw parquet file binary data | Non-null |
| `timestamp` | `number` | Unix timestamp (ms) when cached | > 0 |
| `expiresAt` | `number` | Unix timestamp (ms) when cache expires | > timestamp |
| `fileSize` | `number` | Size of data in bytes | >= 0 |
| `etag` | `string \| null` | Server ETag header value | Optional |

**Validation Rules**:
- `url` must be a valid URL string
- `expiresAt` must be greater than `timestamp`
- `fileSize` must match `data.byteLength`
- `etag` is null if server doesn't provide ETag header

---

### CacheStatus

Represents the current state of the cache for UI display.

| Field | Type | Description |
|-------|------|-------------|
| `state` | `CacheState` | Current cache state enum |
| `timestamp` | `number \| null` | When data was last downloaded |
| `isStale` | `boolean` | True if using expired cache (offline fallback) |
| `source` | `'cache' \| 'network' \| null` | Where current data came from |

**CacheState Enum**:
```typescript
type CacheState =
  | 'idle'      // Initial state, no data loaded
  | 'checking'  // Checking cache validity
  | 'loading'   // Loading from cache or network
  | 'ready'     // Data loaded and available
  | 'error'     // Failed to load data
```

---

### CacheConfig

Configuration for cache behavior.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `ttl` | `number` | `3600000` | Time-to-live in milliseconds (1 hour) |
| `dbName` | `string` | `'anec-data-cache'` | IndexedDB database name |
| `storeName` | `string` | `'parquet-cache'` | Object store name |

---

## State Transitions

```
┌─────────┐
│  idle   │
└────┬────┘
     │ loadData()
     ▼
┌──────────┐
│ checking │ ◄─────────────────┐
└────┬─────┘                   │
     │                         │
     ├─── cache valid ─────────┼──► loading (from cache) ──► ready
     │                         │
     └─── cache expired/missing┼──► loading (from network) ─┬► ready
                               │                            │
                               │   ┌────────────────────────┘
                               │   │
                               │   └─► error (network failed, no cache)
                               │
                               └── refresh() triggers re-check
```

**Transition Rules**:
1. `idle` → `checking`: On component mount or refresh request
2. `checking` → `loading`: Cache validity determined
3. `loading` → `ready`: Data successfully loaded into DuckDB
4. `loading` → `error`: Network failed and no usable cache exists
5. `ready` → `checking`: User clicks refresh or TTL expires on navigation

---

## IndexedDB Schema

```typescript
import { DBSchema } from 'idb';

interface ParquetCacheDB extends DBSchema {
  'parquet-cache': {
    key: string;  // URL
    value: {
      url: string;
      data: ArrayBuffer;
      timestamp: number;
      expiresAt: number;
      fileSize: number;
      etag: string | null;
    };
  };
}
```

**Database Configuration**:
- Name: `anec-data-cache`
- Version: `1`
- Object Store: `parquet-cache`
- Key Path: `url`

---

## Relationships

```
┌─────────────────┐         ┌─────────────────┐
│  CachedParquet  │         │   CacheStatus   │
│  (IndexedDB)    │────────►│   (Runtime)     │
└─────────────────┘ derives └─────────────────┘
                                    │
                                    │ exposed via
                                    ▼
                            ┌─────────────────┐
                            │  DataProvider   │
                            │   (Context)     │
                            └─────────────────┘
                                    │
                                    │ consumed by
                                    ▼
                            ┌─────────────────┐
                            │ CacheIndicator  │
                            │   (Component)   │
                            └─────────────────┘
```

- `CachedParquet` is persisted in IndexedDB
- `CacheStatus` is derived at runtime from cache operations
- `DataProvider` exposes `CacheStatus` via Svelte context
- `CacheIndicator` consumes context to render UI
