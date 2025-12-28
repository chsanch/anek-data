# Normalised Volume Feature

## Problem Statement

The "Volume by Currency" KPI was summing raw `sell_amount_cents` across different currencies without conversion. This produced misleading results:

| Currency | Raw Volume | Displayed % |
|----------|-----------|-------------|
| JPY | 77.3T | 84.6% |
| EUR | 1.5T | 1.6% |

**The issue**: 77.3T JPY ≈ 465B EUR, so JPY's dominance was artificially inflated by ~166x due to exchange rate differences. Summing amounts in different currencies is like adding apples and oranges.

## Solution

The backend now provides a `normalised_amount_cents` field on each order entry, representing the transaction's economic value in EUR cents at the time of order creation.

### Backend Payload Examples

**Order with EUR on one side:**
```json
{
  "id": "order-123",
  "reference": "ORD-2024-001",
  "fx_order_type": "spot",
  "market_direction": "sell",
  "buy_amount_cents": 602400,
  "sell_amount_cents": 100000000,
  "normalised_amount_cents": 602400,
  "buy_currency": "EUR",
  "sell_currency": "JPY",
  "rate": 166.0,
  "value_date": 20000,
  "creation_date": 19950,
  "execution_date": 19960,
  "status": "completed",
  "liquidity_provider": "SEB"
}
```

Interpretation: Sell 1,000,000 JPY → Buy 6,024 EUR. Normalised value = 6,024 EUR.

**Order with no EUR on either side:**
```json
{
  "id": "order-456",
  "reference": "ORD-2024-002",
  "fx_order_type": "spot",
  "market_direction": "sell",
  "buy_amount_cents": 1350000,
  "sell_amount_cents": 1000000,
  "normalised_amount_cents": 925926,
  "buy_currency": "CAD",
  "sell_currency": "USD",
  "rate": 1.35,
  "value_date": 20010,
  "creation_date": 19970,
  "execution_date": 19975,
  "status": "completed",
  "liquidity_provider": "HSBC"
}
```

Interpretation: Sell 10,000 USD → Buy 13,500 CAD. At EUR/USD = 1.08, normalised value = ~9,259 EUR.

## Expected Outcome

After implementation, the KPI will show true EUR-equivalent volumes:

| Currency | EUR Volume | True % |
|----------|-----------|--------|
| EUR | 1.5T € | ~42% |
| JPY | 465B € | ~31% |
| USD | 200B € | ~14% |
| ... | ... | ... |

This gives users meaningful insights into actual trading volume distribution.

## Implementation Plan

### Phase 1: Type Updates

1. **Update `UnifiedOrder` interface** (`src/lib/types/orders.ts`)
   - Add `normalisedAmountCents: number` field

### Phase 2: Data Layer Updates

2. **Update DuckDB schema** (`src/lib/db/schema.ts`)
   - Add `normalised_amount_cents BIGINT` column to orders table

3. **Update data loader** (`src/lib/db/loader.ts` or similar)
   - Ensure `normalised_amount_cents` is mapped from API response to DuckDB

### Phase 3: Query Updates

4. **Update `getVolumeByCurrency` query** (`src/lib/db/queries.ts`)
   - Change from `SUM(sell_amount_cents)` to `SUM(normalised_amount_cents)`
   - Remove currency-specific minor_units conversion (normalised is already in EUR cents)
   - Optionally keep native volume for display

5. **Update `VolumeByCurrency` type** (`src/lib/db/queries.ts`)
   - Add `volumeEur` field for EUR-normalised volume
   - Keep `volume` as native currency volume (optional)

### Phase 4: UI Updates

6. **Update Volume by Currency section** (`src/routes/+page.svelte`)
   - Use `volumeEur` for percentage calculation
   - Display EUR symbol (€) with volume
   - Update tooltip/label to indicate "EUR equivalent"

### Phase 5: Testing & Verification

7. **Run type check** - Ensure no TypeScript errors
8. **Visual verification** - Check dashboard displays correctly
9. **Validate calculations** - Confirm percentages make sense

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/types/orders.ts` | Add `normalisedAmountCents` to interface |
| `src/lib/db/schema.ts` | Add column to CREATE TABLE statement |
| `src/lib/db/loader.ts` | Map new field from API response |
| `src/lib/db/queries.ts` | Update query and return type |
| `src/routes/+page.svelte` | Update UI to use EUR volume |

## Rollback Plan

If issues arise, the frontend can fall back to the previous behavior by:
1. Using `sell_amount_cents` instead of `normalised_amount_cents` in queries
2. Reverting UI labels

The backend change is additive (new field), so no backend rollback needed.

## Additional Features

- **CSV Export**: The `exportOrdersToCsv` function includes `normalised_amount_cents`, so exported data contains EUR-equivalent values for analysis in external tools.

## Future Considerations

- **Swap/Leg entities**: May need `normalised_amount_cents` if displayed in similar KPIs
- **Historical reports**: All normalized values use rate at order creation time (historically accurate)
- **Base currency config**: Currently hardcoded to EUR; could be made configurable in future
