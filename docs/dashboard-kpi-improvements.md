# Dashboard KPI Improvements Proposal

## Current State Analysis

### Existing KPIs (6 cards)
| KPI | Current Value | Assessment |
|-----|---------------|------------|
| Total Trades | 900,000 | Good - core metric |
| Total Volume | 91762.268M EUR | Issues: mixes currencies, hardcoded suffix |
| Open Orders | 450,660 | Good but lacks context (% of total) |
| Active Chains | 540,176 | Good for chain workflow tracking |
| Avg Rate | 57.1966 EUR/USD | Misleading - averages rates across different pairs |
| Currencies | 9 | Low-value - rarely changes |

### Current Sections
1. **Stats Grid** - 6 KPIs in a row
2. **Volume by Currency** - Top 5 currencies with bar chart
3. **Unified Orders Table** - Paginated, sortable, filterable

---

## Proposed Improvements

### 1. Replace Low-Value KPIs

**Remove:**
- "Avg Rate" (meaningless across different currency pairs)
- "Currencies" (static, low-value)

**Add:**

#### Completion Rate
```
Completed Orders / Total Orders × 100
```
- Shows operational efficiency
- Visual: percentage with progress ring or bar

#### Buy/Sell Ratio
```
Buy Orders : Sell Orders
```
- Shows market direction balance
- Visual: Split bar (green/red) or ratio like "1.2:1"

### 2. Enhanced KPI Cards

**Add Trend Indicators:**
- Small sparkline showing 7-day trend
- Up/down arrow with % change from previous period

**Example Layout:**
```
┌─────────────────────────┐
│ TOTAL TRADES            │
│ 900,000      ↑ 12.5%    │
│ ▁▂▄▃▅▆▇█ (7d sparkline) │
└─────────────────────────┘
```

### 3. New KPIs to Add

| KPI | Formula | Why It Matters |
|-----|---------|----------------|
| **Completion Rate** | `completed / total × 100` | Operational efficiency |
| **Avg Order Size** | `SUM(amount) / COUNT(*)` | Typical deal size |
| **Orders Today** | `COUNT(*) WHERE creation_date = TODAY` | Daily activity |
| **Pending Execution** | `closed_to_trading count` | Pipeline visibility |
| **Top LP Share** | `MAX(LP orders) / total × 100` | Concentration risk |

### 4. Add Quick Insights Section

A new section below stats showing actionable insights:

```
┌─────────────────────────────────────────────────────────────┐
│ QUICK INSIGHTS                                              │
├─────────────────────────────────────────────────────────────┤
│ 📊 Forward orders dominate at 65% of volume                 │
│ 🔄 Buy/Sell ratio is balanced at 1.05:1                     │
│ ⏰ 12,450 orders pending execution (closed_to_trading)      │
│ 🏆 Top LP: "Acme Bank" handles 34% of orders                │
└─────────────────────────────────────────────────────────────┘
```

### 5. Status Distribution on Dashboard

Move the status distribution chart from Analytics to the main dashboard:

```
┌────────────────────────────────────────┐
│ ORDER STATUS                           │
├────────────────────────────────────────┤
│ ████████████████████░░░░ Completed 65% │
│ ████████░░░░░░░░░░░░░░░░ Open 25%      │
│ ████░░░░░░░░░░░░░░░░░░░░ Closed 10%    │
└────────────────────────────────────────┘
```

### 6. Order Type Distribution

Add a visual breakdown of Forward/Chain/Spot:

```
┌────────────────────────────────────────┐
│ ORDER TYPES                            │
├────────────────────────────────────────┤
│ Forward  ████████████████  540K (60%)  │
│ Chain    ████████░░░░░░░░  270K (30%)  │
│ Spot     ████░░░░░░░░░░░░   90K (10%)  │
└────────────────────────────────────────┘
```

---

## Recommended Dashboard Layout

### Row 1: Primary KPIs (4 cards, larger)
| Total Trades | Total Volume | Open Orders | Completion Rate |
|--------------|--------------|-------------|-----------------|
| 900,000      | 91.7B        | 450,660     | 65.2%           |
| ↑ 12.5%      | ↑ 8.3%       | ↓ 2.1%      | ↑ 1.5%          |

### Row 2: Secondary KPIs (4 cards, smaller)
| Active Chains | Avg Order Size | Orders Today | Top LP Share |
|---------------|----------------|--------------|--------------|
| 540,176       | 102K EUR       | 3,245        | 34% (Acme)   |

### Row 3: Two-Column Layout
| Volume by Currency (existing) | Order Distribution |
|-------------------------------|-------------------|
| JPY: 76.5B                    | Status pie/bar    |
| NOK: 4.8B                     | Type pie/bar      |
| ...                           |                   |

### Row 4: Orders Table (existing)

---

## Implementation Priority

### Phase 1 (Quick Wins)
1. Add Completion Rate KPI
2. Add Status Distribution to dashboard
3. Add Order Type Distribution
4. Remove/replace "Avg Rate" and "Currencies"

### Phase 2 (Enhanced)
1. Add trend indicators (sparklines)
2. Add Buy/Sell ratio visualization
3. Add "Orders Today" KPI
4. Add Top LP insight

### Phase 3 (Advanced)
1. Add Quick Insights section
2. Add period comparison (vs last week/month)
3. Add alerts for anomalies

---

## New SQL Queries Needed

### Order Type Distribution
```sql
SELECT
    fx_order_type as type,
    COUNT(*)::BIGINT as count,
    (COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ())::DOUBLE as percentage
FROM orders
GROUP BY fx_order_type
ORDER BY count DESC
```

### Buy/Sell Ratio
```sql
SELECT
    SUM(CASE WHEN market_direction = 'buy' THEN 1 ELSE 0 END)::BIGINT as buy_count,
    SUM(CASE WHEN market_direction = 'sell' THEN 1 ELSE 0 END)::BIGINT as sell_count
FROM orders
```

### Top Liquidity Provider
```sql
SELECT
    liquidity_provider,
    COUNT(*)::BIGINT as order_count,
    (COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ())::DOUBLE as percentage
FROM orders
GROUP BY liquidity_provider
ORDER BY order_count DESC
LIMIT 1
```

### Orders Today
```sql
SELECT COUNT(*)::BIGINT as today_count
FROM orders
WHERE DATE_TRUNC('day', creation_date) = CURRENT_DATE
```

### Completion Rate
```sql
SELECT
    (COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*))::DOUBLE as completion_rate
FROM orders
```
