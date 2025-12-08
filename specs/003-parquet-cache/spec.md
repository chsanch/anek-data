# Feature Specification: Browser Data Persistence (Parquet Cache)

**Feature Branch**: `003-parquet-cache`
**Created**: 2025-12-08
**Status**: Draft
**Input**: User description: "Cache parquet file in IndexedDB with time-based + ETag invalidation to avoid downloading on every page load"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fast Page Load with Cached Data (Priority: P1)

As a user returning to the application, I want the data to load instantly from browser storage instead of waiting for a network download, so I can start working immediately.

**Why this priority**: This is the core value proposition - eliminating unnecessary network requests and reducing load times for returning users.

**Independent Test**: Can be fully tested by loading the page twice and measuring load times. Second load should be significantly faster and use no network bandwidth for parquet data.

**Acceptance Scenarios**:

1. **Given** a user has visited the application before (data is cached) and the cache is still valid, **When** they load the application, **Then** data loads from browser storage without any network request for the parquet file
2. **Given** a user has visited before but cache has expired (older than 1 hour), **When** they load the application, **Then** fresh data is downloaded from the server and cached again
3. **Given** a first-time visitor with no cached data, **When** they load the application, **Then** data is downloaded from the server and stored in browser cache for future visits

---

### User Story 2 - Cache Status Visibility (Priority: P2)

As a user, I want to see when I'm viewing cached data and when it was last downloaded, so I can understand the freshness of the information displayed.

**Why this priority**: Transparency about data freshness builds user trust and helps them make informed decisions about whether to refresh.

**Independent Test**: Can be tested by observing the UI indicator after page load - should display cache status and timestamp clearly.

**Acceptance Scenarios**:

1. **Given** the application is displaying cached data, **When** the page finishes loading, **Then** an indicator shows "Cached" status with the last download time (e.g., "Cached - Last updated: 2:30 PM")
2. **Given** fresh data was just downloaded, **When** the page finishes loading, **Then** the indicator reflects the current download time
3. **Given** data is loading, **When** the page is loading, **Then** an appropriate loading state is displayed

---

### User Story 3 - Manual Data Refresh (Priority: P2)

As a user, I want to manually refresh the data when I know there are updates, even if the cache hasn't expired yet, so I can see the latest information.

**Why this priority**: Users need control over data freshness, especially when they know server data has changed.

**Independent Test**: Can be tested by clicking the refresh button and verifying new data is fetched from the server regardless of cache state.

**Acceptance Scenarios**:

1. **Given** the application is displaying cached data, **When** the user clicks the "Refresh Data" button, **Then** fresh data is downloaded from the server bypassing the cache
2. **Given** a refresh is in progress, **When** the user views the interface, **Then** a loading indicator is shown
3. **Given** a refresh completes successfully, **When** the download finishes, **Then** the cache indicator updates to show the new download time

---

### User Story 4 - Efficient Server Validation (Priority: P3)

As a system operator, I want the application to efficiently validate cache freshness using ETag headers, so bandwidth is saved when server data hasn't changed.

**Why this priority**: Optimization feature that reduces bandwidth usage when data hasn't changed on the server.

**Independent Test**: Can be tested by monitoring network requests when cache expires - should send conditional request and receive 304 Not Modified when server data unchanged.

**Acceptance Scenarios**:

1. **Given** cached data has expired and the server supports ETag headers, **When** the application checks for updates, **Then** a conditional request with `If-None-Match` header is sent
2. **Given** the server returns 304 Not Modified, **When** the response is received, **Then** the existing cache is kept and its expiry is extended
3. **Given** the server returns new data with a new ETag, **When** the response is received, **Then** the cache is updated with fresh data and new ETag

---

### Edge Cases

- What happens when browser storage is full? The system should gracefully handle storage quota errors and fall back to network-only mode, notifying the user if possible.
- What happens in private/incognito mode? The system should work normally but cache will not persist after the browser window closes.
- What happens if the cached data is corrupted? The system should detect invalid data and automatically re-fetch from the server.
- What happens if the server is unreachable but cache exists? The system should use cached data even if expired, with a warning that data may be stale.
- What happens if the server removes ETag support? The system should fall back to time-based expiry only.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store downloaded parquet file data in persistent browser storage that survives browser restarts
- **FR-002**: System MUST check cache validity before making network requests for parquet data
- **FR-003**: System MUST use a default cache expiry time of 1 hour (configurable)
- **FR-004**: System MUST store cache metadata including: source URL, download timestamp, expiry time, file size, and ETag (if available)
- **FR-005**: System MUST display a visual indicator showing whether data is from cache and when it was last downloaded
- **FR-006**: System MUST provide a manual refresh button that bypasses cache and downloads fresh data
- **FR-007**: System MUST send conditional requests with `If-None-Match` header when validating expired cache (if ETag is available)
- **FR-008**: System MUST handle 304 Not Modified responses by extending cache validity without re-downloading data
- **FR-009**: System MUST show a loading state while data is being fetched or loaded from cache
- **FR-010**: System MUST gracefully degrade to network-only mode if browser storage is unavailable or full
- **FR-011**: System MUST allow cache expiry time to be configured via environment variable

### Key Entities

- **CachedParquet**: Represents stored parquet data with metadata (source URL, raw data buffer, download timestamp, expiry timestamp, file size, ETag)
- **CacheStatus**: Represents current cache state (valid/expired/missing/loading) and metadata for UI display

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Returning users experience page load with cached data completing in under 2 seconds (vs initial download time)
- **SC-002**: Zero network requests for parquet data when cache is valid (measurable in browser network tab)
- **SC-003**: Cache status indicator is visible and accurate within 1 second of page load completion
- **SC-004**: Manual refresh successfully retrieves fresh data 100% of the time when server is reachable
- **SC-005**: System correctly handles 304 Not Modified responses without re-downloading unchanged data
- **SC-006**: Cached data persists across browser sessions (survives browser close/reopen)

## Assumptions

- The parquet file size is expected to be under 500MB (within browser storage limits)
- The server hosting the parquet file may or may not support ETag headers
- Users have modern browsers with IndexedDB support (all major browsers since 2015)
- The application currently handles a single parquet data source (orders table); multiple sources may be added later

## Out of Scope

- Multiple data source caching (will be addressed in future iterations)
- Offline-first functionality (using stale cache when server unreachable is a graceful degradation, not a primary feature)
- Data synchronization or conflict resolution
- Cache size management or automatic cleanup of old entries
