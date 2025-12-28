# Volume by Currency KPI Improvements

## Current State

The "Volume by Currency" section displays the top 5 currencies by trading volume:
- **Layout**: 5 horizontal cards in a row
- **Metrics per card**: Currency code, order count, volume (with "B" suffix), thin progress bar
- **Visual style**: Clean, minimal, consistent with dashboard's dark theme

### Issues Identified

1. **Volume formatting is confusing**: "75818.48B" appears incorrect - should be "75.8B" or similar compact format
2. **Progress bars too subtle**: Thin bars don't communicate the dramatic volume differences
3. **No percentage of total**: Users can't quickly grasp relative importance (e.g., "JPY is 45% of volume")
4. **Order counts feel redundant**: Similar values (~73K) don't differentiate currencies

## Industry Patterns Analysis

Common patterns in FX/trading dashboards (Bloomberg, Refinitiv, TradingView):

| Pattern | Use Case | Pros | Cons |
|---------|----------|------|------|
| Horizontal bar chart | Ranking comparison | Clear visual hierarchy, scannable | Takes vertical space |
| Stacked bar / 100% bar | Part-of-whole | Shows composition at a glance | Hard to read exact values |
| Treemap | Many currencies | Efficient space use | Less precise |
| Sorted table | Detailed data | Sortable, precise | Less visual impact |
| Donut/Pie | Few categories (5-7) | Intuitive percentages | Poor for close values |

**Conclusion**: For top 5 currencies, enhanced cards with percentage bars or horizontal bar charts work best.

## Recommended Metrics

| Metric | Priority | Rationale |
|--------|----------|-----------|
| **% of Total** | Essential | Immediately communicates dominance |
| **Volume (compact)** | Essential | Core metric, properly formatted |
| **Order count** | Keep | Shows activity level |
| **Trend indicator** | Future | Shows momentum vs previous period |
| **Avg order size** | Future | Volume ÷ Orders reveals trade patterns |

## Design Options Considered

### Option A: Enhanced Cards with Visual Hierarchy (Selected)

```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ JPY     │ │ NOK     │ │ SEK     │ │ DKK     │ │ EUR     │
│ 45.2%   │ │ 23.1%   │ │ 18.4%   │ │ 8.7%    │ │ 4.6%    │
│ ████████│ │ ████    │ │ ███     │ │ ██      │ │ █       │
│ 75.8B   │ │ 4.9B    │ │ 4.5B    │ │ 3.0B    │ │ 1.5B    │
│ 73K ord │ │ 73K ord │ │ 73K ord │ │ 73K ord │ │ 314K ord│
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

**Changes**:
- Add percentage prominently (larger than order count)
- Make progress bar thicker (8-12px instead of 3px)
- Show volume in clean compact format (75.8B not 75818.48B)

**Why selected**: Maintains current structure while addressing key issues. Minimal code changes.

### Option B: Horizontal Bar Chart (Future Consideration)

```
JPY  ██████████████████████████████████████  75.8B  45%
NOK  █████████████████                        4.9B  23%
SEK  ██████████████                           4.5B  18%
DKK  ███████                                  3.0B   9%
EUR  ████                                     1.5B   5%
```

**Pros**: Instantly shows dominance, very scannable, compact
**Consider for**: Future redesign if comparison is primary goal

### Option C: Cards with Sparklines (Future Consideration)

Add 7-day trend sparklines to each currency card to show momentum.

**Consider for**: When historical trend data is valuable to users

## Implementation Plan

### Phase 1: Apply Option A (Current)

1. **Fix volume formatting** - Use `Intl.NumberFormat` with `notation: 'compact'`
2. **Add percentage of total** - Calculate and display prominently
3. **Increase bar thickness** - From 3px to 8px for better visibility
4. **Reorder card content** - Percentage first, then volume, then orders

### Phase 2: Future Enhancements

- Add trend indicators (↑↓) showing change vs previous period
- Consider horizontal bar chart variant for different view
- Add currency flags/icons for visual recognition
- Add average order size metric

## Technical Notes

### Volume Formatting

```typescript
function formatVolume(value: number): string {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

// Examples:
// 75818480000 → "75.8B"
// 4939540000 → "4.9B"
// 1496150000 → "1.5B"
```

### Percentage Calculation

```typescript
const totalVolume = currencies.reduce((sum, c) => sum + c.volume, 0);
const percentage = (currency.volume / totalVolume) * 100;
```

## Files Modified

- `src/routes/+page.svelte` - Volume section template and percentage calculation
- `src/lib/utils/format.ts` - Add compact volume formatting function

## Decision

**Applying Option A** - Enhanced cards with percentage, better formatting, and thicker bars. This provides immediate improvements while maintaining the existing design language. Future iterations can explore Option B (horizontal bars) or Option C (sparklines) based on user feedback.
