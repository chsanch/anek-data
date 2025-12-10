# Research: Analytics Page

**Date**: 2025-12-10
**Feature**: 004-analytics-page

## Research Topics

### 1. Lightweight Charts Integration with Svelte 5

**Decision**: Use `lightweight-charts` directly with Svelte 5 `$effect` for lifecycle management

**Rationale**:

- The existing `svelte-lightweight-charts` wrapper was built for Svelte 4 and may not be compatible with Svelte 5 runes syntax
- Direct integration gives us full control and avoids wrapper compatibility issues
- Lightweight Charts v5.0 is the latest (as of 2025), with improved tree-shaking and reduced bundle size
- Constitution specifies Lightweight Charts for time-series, aligning with this choice

**Alternatives Considered**:

- `svelte-lightweight-charts` wrapper: Rejected due to Svelte 5 compatibility uncertainty
- Chart.js: Rejected per constitution (not TradingView aesthetic, larger bundle)
- ECharts: Rejected per constitution (larger bundle, overkill for this use case)

**Implementation Pattern**:

```typescript
// In Svelte 5 component
import { createChart, AreaSeries, HistogramSeries } from 'lightweight-charts';

let chartContainer: HTMLDivElement;
let chart: IChartApi;

$effect(() => {
	if (chartContainer) {
		chart = createChart(chartContainer, options);
		// Add series, set data
		return () => chart.remove(); // cleanup
	}
});
```

**Sources**:

- [Lightweight Charts Documentation](https://tradingview.github.io/lightweight-charts/)
- [GitHub: tradingview/lightweight-charts](https://github.com/tradingview/lightweight-charts)
- [svelte-lightweight-charts wrapper](https://github.com/trash-and-fire/svelte-lightweight-charts)

---

### 2. Chart Types for Analytics Visualizations

**Decision**: Use AreaSeries for volume trends, HistogramSeries for buy/sell comparison

**Rationale**:

- **AreaSeries**: Best for showing cumulative/aggregate data over time (daily volume)
- **HistogramSeries**: Ideal for comparing positive/negative or dual values (buy vs sell)
- Both are native Lightweight Charts types with excellent performance

**Chart Mapping**:

| Visualization       | Lightweight Charts Type    | Data Format                                               |
| ------------------- | -------------------------- | --------------------------------------------------------- |
| Daily Volume Trend  | AreaSeries                 | `{ time: string, value: number }[]`                       |
| Buy vs Sell Balance | HistogramSeries (2 series) | `{ time: string, value: number, color: string }[]`        |
| Status Distribution | N/A (HTML/CSS)             | `{ status: string, count: number, percentage: number }[]` |

**Alternatives Considered**:

- LineSeries for volume: Less visual impact than area
- BarSeries: Requires more configuration than histogram
- Stacked charts: Not natively supported in Lightweight Charts

---

### 3. DuckDB Query Patterns for Analytics

**Decision**: Extend existing `queries.ts` with dedicated analytics query functions

**Rationale**:

- Consistent with existing codebase patterns
- Queries already handle BigInt conversion, date formatting
- Reuse existing connection management

**Query Functions to Add**:

```sql
-- Daily Volume (for area chart)
SELECT
  creation_date as time,
  SUM(sell_amount_cents)::DOUBLE / 100.0 as value,
  COUNT(*) as trade_count
FROM orders
WHERE creation_date >= ? AND creation_date <= ?
GROUP BY creation_date
ORDER BY creation_date

-- Buy vs Sell (for histogram)
SELECT
  creation_date as time,
  SUM(CASE WHEN market_direction = 'buy' THEN buy_amount_cents ELSE 0 END)::DOUBLE / 100.0 as buy_volume,
  SUM(CASE WHEN market_direction = 'sell' THEN sell_amount_cents ELSE 0 END)::DOUBLE / 100.0 as sell_volume
FROM orders
WHERE creation_date >= ? AND creation_date <= ?
GROUP BY creation_date
ORDER BY creation_date

-- Status Distribution (for HTML bars)
SELECT
  status,
  COUNT(*) as count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentage
FROM orders
GROUP BY status
ORDER BY count DESC
```

---

### 4. Time Range Selector Design

**Decision**: Simple preset selector with custom date range option

**Rationale**:

- MVP approach: offer common presets (7d, 30d, 90d, All)
- Avoids complexity of full date picker for initial implementation
- Can extend to custom range picker in future iteration

**Presets**:

- Last 7 days
- Last 30 days (default)
- Last 90 days
- All time

**Alternatives Considered**:

- Full date picker: More complex, not needed for MVP
- Month/quarter selectors: Less flexible than day-based presets

---

### 5. Svelte 5 Component Patterns

**Decision**: Use runes ($state, $derived, $effect) for all new components

**Rationale**:

- Constitution requires Svelte 5 runes for reactive state
- Existing codebase already uses this pattern
- Better TypeScript inference than stores

**Component State Pattern**:

```typescript
// Chart component
let data = $state<ChartDataPoint[]>([]);
let loading = $state(true);
let error = $state<string | null>(null);

// Time range reactive
let dateRange = $derived(calculateDateRange(selectedPreset));

$effect(() => {
	loadData(dateRange.start, dateRange.end);
});
```

---

## Resolved Clarifications

All technical context items resolved:

- ✅ Chart library: Lightweight Charts v5.0 (direct integration)
- ✅ Chart types: AreaSeries, HistogramSeries
- ✅ Query patterns: Extend existing queries.ts
- ✅ State management: Svelte 5 runes
- ✅ Time range: Preset selector with 30d default

## External Sources

- [TradingView Lightweight Charts](https://www.tradingview.com/lightweight-charts/)
- [Lightweight Charts GitHub](https://github.com/tradingview/lightweight-charts)
- [Lightweight Charts v5 Announcement](https://www.tradingview.com/blog/en/tradingview-lightweight-charts-version-5-50837/)
- [svelte-lightweight-charts wrapper](https://github.com/trash-and-fire/svelte-lightweight-charts)
