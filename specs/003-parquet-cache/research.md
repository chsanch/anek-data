# Research: Browser Data Persistence (Parquet Cache)

**Feature**: 003-parquet-cache
**Date**: 2025-12-08

## Research Tasks

### 1. IndexedDB Library Selection

**Decision**: Use `idb` library (v8.x)

**Rationale**:

- Tiny footprint (~1.19KB brotli'd) - aligns with constitution's simplicity principle
- Promise-based API - modern async/await patterns
- Built-in TypeScript definitions - type safety for schema and operations
- Maintained by Jake Archibald (Chrome team) - reliable and well-documented
- Direct IndexedDB access - no abstraction overhead

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| `idb-keyval` | Too simple - lacks schema support needed for metadata |
| `localForage` | Larger bundle, includes unnecessary localStorage/WebSQL fallbacks |
| `Dexie.js` | Overkill - ORM-like features add complexity we don't need |
| Native IndexedDB | Event-based API creates callback hell; idb is minimal wrapper |

**References**:

- [idb GitHub](https://github.com/jakearchibald/idb)
- [idb npm](https://www.npmjs.com/package/idb)

---

### 2. IndexedDB Schema Design for Binary Data

**Decision**: Single object store with composite key structure

**Rationale**:

- IndexedDB natively supports `ArrayBuffer` and `Blob` storage
- Single store simplifies transaction management
- URL-based key enables future multi-source caching

**Schema Design**:

```typescript
interface ParquetCacheDB {
	'parquet-cache': {
		key: string; // URL of the parquet source
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

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Separate stores for data/metadata | Complicates transactions, no real benefit |
| Blob storage instead of ArrayBuffer | ArrayBuffer integrates directly with DuckDB's `registerFileBuffer` |
| Multiple stores per data source | Premature optimization; single store with URL key is sufficient |

---

### 3. Cache Validation Strategy

**Decision**: Two-tier validation (TTL + ETag)

**Rationale**:

- **TTL (Time-To-Live)**: Fast local check, no network required
- **ETag**: Server-side validation when TTL expires, saves bandwidth if unchanged

**Flow**:

```
1. Check local TTL → if valid, use cache (no network)
2. If TTL expired and ETag exists:
   - Send HEAD/GET with If-None-Match header
   - 304 response → extend TTL, use existing cache
   - 200 response → update cache with new data
3. If no ETag → full fetch on TTL expiry
```

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| TTL only | Misses opportunity to save bandwidth when server data unchanged |
| ETag only (no TTL) | Always requires network request, defeats caching purpose |
| Last-Modified header | Less reliable than ETag; servers don't always set it |

---

### 4. Error Handling & Graceful Degradation

**Decision**: Fail-open to network mode

**Rationale**:

- Cache is an optimization, not a requirement
- Users should never be blocked from accessing data due to cache issues
- Silent fallback preferred over error popups

**Error Scenarios**:
| Scenario | Behavior |
|----------|----------|
| IndexedDB unavailable | Log warning, proceed with network fetch |
| Storage quota exceeded | Log warning, skip caching, use network |
| Corrupted cache data | Delete invalid entry, fetch fresh |
| Network unavailable + valid cache | Use cache, show stale warning |
| Network unavailable + expired cache | Use expired cache, show prominent warning |
| Network unavailable + no cache | Show error state |

---

### 5. Environment Variable Configuration

**Decision**: `PUBLIC_CACHE_TTL` environment variable

**Rationale**:

- SvelteKit convention for client-exposed variables (`PUBLIC_` prefix)
- Milliseconds format for precision
- Default value in code, override via `.env`

**Configuration**:

```bash
# .env (optional)
PUBLIC_CACHE_TTL=3600000  # 1 hour in milliseconds (default)
```

**Parsing**:

```typescript
const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour
const ttl = parseInt(import.meta.env.PUBLIC_CACHE_TTL || '', 10) || DEFAULT_TTL;
```

---

### 6. UI Component Patterns

**Decision**: Standalone `CacheIndicator` component with Svelte 5 runes

**Rationale**:

- Constitution Principle IV requires component independence
- Component receives cache status via context, manages own display state
- Uses `$derived` for computed display values

**Component API**:

```svelte
<CacheIndicator />
<!-- Renders: "Cached • Last updated: 2:30 PM" with refresh button -->
<!-- Or: "Loading..." during fetch -->
<!-- Or: "Data may be stale" warning when using expired cache offline -->
```

**State Sources**:

- Cache status from DataProvider context
- Timestamp formatting handled internally
- Refresh action triggers context's `refresh()` method

---

## Unresolved Items

None. All technical decisions resolved.

## Dependencies to Add

```bash
pnpm add idb
```

## References

- [idb GitHub Repository](https://github.com/jakearchibald/idb)
- [MDN: Using IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [MDN: Storage Quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
