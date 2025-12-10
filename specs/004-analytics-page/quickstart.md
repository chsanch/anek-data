# Quickstart: Analytics Page

**Date**: 2025-12-10
**Feature**: 004-analytics-page

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- Project cloned and dependencies installed

## Setup

```bash
# Switch to feature branch
git checkout 004-analytics-page

# Install dependencies (includes new lightweight-charts)
pnpm install

# Start dev server
pnpm dev
```

## New Dependency

This feature requires adding `lightweight-charts`:

```bash
pnpm add lightweight-charts
```

## File Structure After Implementation

```
src/
├── lib/
│   ├── components/
│   │   ├── charts/
│   │   │   ├── VolumeChart.svelte      # Daily volume area chart
│   │   │   ├── DirectionChart.svelte   # Buy/sell histogram
│   │   │   └── StatusDistribution.svelte # Status bars (HTML/CSS)
│   │   └── TimeRangeSelector.svelte    # Preset selector
│   ├── db/
│   │   └── queries.ts                  # Extended with analytics queries
│   └── types/
│       └── analytics.ts                # New type definitions
├── routes/
│   └── analytics/
│       └── +page.svelte                # New analytics page
```

## Key Implementation Steps

### 1. Add Types (`src/lib/types/analytics.ts`)

```typescript
export interface DailyVolume {
  time: string;
  value: number;
  tradeCount: number;
}

export interface DailyDirectionVolume {
  time: string;
  buyVolume: number;
  sellVolume: number;
}

export interface StatusDistribution {
  status: 'open' | 'closed_to_trading' | 'completed';
  count: number;
  percentage: number;
}

export type TimeRangePreset = '7d' | '30d' | '90d' | 'all';
```

### 2. Add Query Functions (`src/lib/db/queries.ts`)

```typescript
export async function getDailyVolume(
  db: AsyncDuckDB,
  startDate: string,
  endDate: string
): Promise<DailyVolume[]> {
  // Implementation
}

export async function getDailyDirectionVolume(
  db: AsyncDuckDB,
  startDate: string,
  endDate: string
): Promise<DailyDirectionVolume[]> {
  // Implementation
}

export async function getStatusDistribution(
  db: AsyncDuckDB
): Promise<StatusDistribution[]> {
  // Implementation
}
```

### 3. Create Chart Components

Each chart follows this pattern:

```svelte
<script lang="ts">
  import { createChart, AreaSeries } from 'lightweight-charts';
  import type { DailyVolume } from '$lib/types/analytics';

  let { data }: { data: DailyVolume[] } = $props();

  let container: HTMLDivElement;
  let chart: IChartApi | null = null;

  $effect(() => {
    if (container && data.length > 0) {
      chart = createChart(container, { /* options */ });
      const series = chart.addSeries(AreaSeries);
      series.setData(data);

      return () => chart?.remove();
    }
  });
</script>

<div bind:this={container} class="chart-container"></div>
```

### 4. Create Analytics Page Route

```svelte
<!-- src/routes/analytics/+page.svelte -->
<script lang="ts">
  import VolumeChart from '$lib/components/charts/VolumeChart.svelte';
  import DirectionChart from '$lib/components/charts/DirectionChart.svelte';
  import StatusDistribution from '$lib/components/charts/StatusDistribution.svelte';
  import TimeRangeSelector from '$lib/components/TimeRangeSelector.svelte';
  import { getDataContext } from '$lib/db/context';
  // ... implementation
</script>
```

## Testing the Feature

```bash
# Run type checking
pnpm check

# Run linting
pnpm lint

# Run unit tests
pnpm test:unit

# Manual testing
# 1. Navigate to http://localhost:5173/analytics
# 2. Verify volume chart displays
# 3. Verify buy/sell chart displays
# 4. Verify status distribution displays
# 5. Change time range and verify charts update
# 6. Toggle dark/light theme and verify styling
```

## Verification Checklist

- [ ] Analytics page loads at `/analytics`
- [ ] Navigation link works from dashboard
- [ ] Volume chart displays daily aggregated data
- [ ] Buy/sell chart shows directional comparison
- [ ] Status distribution shows accurate breakdown
- [ ] Time range selector defaults to 30 days
- [ ] Changing time range updates charts
- [ ] Loading states display while fetching
- [ ] Empty states display when no data
- [ ] Error states display with retry option
- [ ] Dark theme renders correctly
- [ ] Light theme renders correctly
- [ ] Page loads within 3 seconds

## Common Issues

### Chart not rendering
- Ensure container div has explicit height
- Check that data array is not empty
- Verify Lightweight Charts is imported correctly

### TypeScript errors
- Run `pnpm check` to identify issues
- Ensure `lightweight-charts` types are available

### Data not loading
- Verify DataProvider context is accessible
- Check DuckDB connection is established
- Verify date range query parameters are valid
