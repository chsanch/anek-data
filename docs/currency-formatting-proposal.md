# Currency Formatting Proposal

> **Status: IMPLEMENTED** - All components updated including SQL aggregations.

## Problem Statement

The application stores monetary amounts as integers in cents (`buy_amount_cents`, `sell_amount_cents`, `amount_cents`). Currently, the `formatCurrency()` utility always divides by 100 and displays 2 decimal places.

This approach breaks for currencies with different minor units:

| Currency      | Minor Units | Example            |
| ------------- | ----------- | ------------------ |
| EUR, USD, GBP | 2           | 1000 cents → 10.00 |
| JPY           | 0           | 1000 cents → 1000  |
| KWD           | 3           | 1000 cents → 1.000 |

## Data Source

A new `/currencies` endpoint provides currency metadata:

```json
[
	{ "code": "EUR", "minor_units": 2 },
	{ "code": "USD", "minor_units": 2 },
	{ "code": "CHF", "minor_units": 2 },
	{ "code": "GBP", "minor_units": 2 },
	{ "code": "DKK", "minor_units": 2 },
	{ "code": "SEK", "minor_units": 2 },
	{ "code": "NOK", "minor_units": 2 },
	{ "code": "JPY", "minor_units": 0 },
	{ "code": "KWD", "minor_units": 3 }
]
```

## Recommended Approach: Hybrid

Store currencies in DuckDB as a reference table while keeping amounts in cents. Format at render time using the minor_units lookup.

### Why This Approach?

| Aspect                     | Benefit                                       |
| -------------------------- | --------------------------------------------- |
| **Precision**              | Integer cents avoid floating-point errors     |
| **Aggregations**           | `SUM(amount_cents)` is always accurate in SQL |
| **Single source of truth** | Currencies table in DuckDB                    |
| **Flexible formatting**    | Can adapt to locale/display preferences       |

### Alternative Approaches Considered

| Approach                     | Pros                                | Cons                                    |
| ---------------------------- | ----------------------------------- | --------------------------------------- |
| Transform at render only     | Simple, no data duplication         | Need to pass currency map everywhere    |
| Store converted values in DB | Fast reads                          | Duplicates data, aggregation complexity |
| **Hybrid (chosen)**          | Best of both, accurate aggregations | Slightly more setup                     |

## Implementation Plan

### 1. Create Currency Types

**File:** `src/lib/types/currency.ts`

```typescript
export interface Currency {
	code: string;
	minorUnits: number;
}

export type CurrencyMap = Map<string, Currency>;
```

### 2. Currency Service

**File:** `src/lib/db/currencies.ts`

```typescript
import type { Currency, CurrencyMap } from '$lib/types/currency';
import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';

export async function loadCurrencies(db: AsyncDuckDB, endpoint: string): Promise<CurrencyMap> {
	// Fetch from API
	const response = await fetch(endpoint);
	const data = await response.json();

	const currencies: Currency[] = data.map((c: { code: string; minor_units: number }) => ({
		code: c.code,
		minorUnits: c.minor_units
	}));

	// Store in DuckDB for SQL JOINs
	const conn = await db.connect();
	try {
		await conn.query(`
      CREATE TABLE IF NOT EXISTS currencies (
        code VARCHAR PRIMARY KEY,
        minor_units INTEGER NOT NULL
      )
    `);

		// Clear and reload
		await conn.query(`DELETE FROM currencies`);

		for (const c of currencies) {
			await conn.query(`INSERT INTO currencies VALUES ('${c.code}', ${c.minorUnits})`);
		}
	} finally {
		await conn.close();
	}

	// Return map for fast JS lookups
	return new Map(currencies.map((c) => [c.code, c]));
}
```

### 3. Update Format Utility

**File:** `src/lib/utils/format.ts`

```typescript
import type { CurrencyMap } from '$lib/types/currency';

/**
 * Formats a cents value to a currency string using the correct minor units.
 *
 * @param cents - The amount in cents (smallest currency unit)
 * @param currencyCode - ISO 4217 currency code (e.g., 'EUR', 'JPY')
 * @param currencyMap - Map of currency codes to their metadata
 * @param locale - Optional locale for number formatting (default: 'en-US')
 * @returns Formatted currency string (e.g., "12,345.67" or "1,000")
 */
export function formatCurrency(
	cents: number,
	currencyCode: string,
	currencyMap: CurrencyMap,
	locale: string = 'en-US'
): string {
	const currency = currencyMap.get(currencyCode);
	const minorUnits = currency?.minorUnits ?? 2; // Default to 2 if unknown

	const value = cents / Math.pow(10, minorUnits);

	return new Intl.NumberFormat(locale, {
		minimumFractionDigits: minorUnits,
		maximumFractionDigits: minorUnits
	}).format(value);
}

/**
 * Converts cents to actual currency value.
 * Useful for calculations or passing to charting libraries.
 */
export function centsToValue(
	cents: number,
	currencyCode: string,
	currencyMap: CurrencyMap
): number {
	const currency = currencyMap.get(currencyCode);
	const minorUnits = currency?.minorUnits ?? 2;
	return cents / Math.pow(10, minorUnits);
}
```

### 4. Svelte Context for Currency Map

**File:** `src/lib/contexts/currency.ts`

```typescript
import { getContext, setContext } from 'svelte';
import type { CurrencyMap } from '$lib/types/currency';

const CURRENCY_CONTEXT_KEY = Symbol('currency');

export function setCurrencyContext(currencyMap: CurrencyMap): void {
	setContext(CURRENCY_CONTEXT_KEY, currencyMap);
}

export function getCurrencyContext(): CurrencyMap {
	const ctx = getContext<CurrencyMap>(CURRENCY_CONTEXT_KEY);
	if (!ctx) {
		throw new Error('Currency context not found. Did you forget to call setCurrencyContext?');
	}
	return ctx;
}
```

### 5. SQL Aggregations with Proper Conversion

When aggregating in SQL and needing actual currency values:

```sql
-- Total volume with proper currency conversion
SELECT
  o.sell_currency,
  SUM(o.sell_amount_cents) as total_cents,
  SUM(o.sell_amount_cents::DOUBLE / POWER(10, c.minor_units)) as total_value
FROM orders o
JOIN currencies c ON o.sell_currency = c.code
GROUP BY o.sell_currency;

-- Order details with converted amounts
SELECT
  o.*,
  o.buy_amount_cents::DOUBLE / POWER(10, bc.minor_units) as buy_amount,
  o.sell_amount_cents::DOUBLE / POWER(10, sc.minor_units) as sell_amount
FROM orders o
JOIN currencies bc ON o.buy_currency = bc.code
JOIN currencies sc ON o.sell_currency = sc.code;
```

### 6. Usage in Components

```svelte
<script lang="ts">
	import { getCurrencyContext } from '$lib/contexts/currency';
	import { formatCurrency } from '$lib/utils/format';

	const currencyMap = getCurrencyContext();

	interface Props {
		order: {
			buyAmountCents: number;
			buyCurrency: string;
		};
	}

	let { order }: Props = $props();
</script>

<td class="cell-amount">
	<span class="amount">{formatCurrency(order.buyAmountCents, order.buyCurrency, currencyMap)}</span>
	<span class="currency">{order.buyCurrency}</span>
</td>
```

## Environment Variables

Add to `.env`:

```env
PUBLIC_CURRENCIES_URL=http://localhost:8888/currencies
```

## Migration Steps

1. Create `src/lib/types/currency.ts`
2. Create `src/lib/db/currencies.ts`
3. Create `src/lib/contexts/currency.ts`
4. Update `src/lib/utils/format.ts` (keep backward compatibility initially)
5. Load currencies on app initialization (alongside orders data)
6. Set currency context in root layout
7. Update `OrdersTable.svelte` to use new formatting
8. Update SQL queries in `queries.ts` for aggregations
9. Update analytics components if they display currency values

## Testing Considerations

- Test with JPY (0 decimal places): `1000` cents → `"1,000"`
- Test with EUR (2 decimal places): `1000` cents → `"10.00"`
- Test with KWD (3 decimal places): `1000` cents → `"1.000"`
- Test unknown currency (should default to 2): `1000` cents → `"10.00"`
- Test SQL JOINs return correct values

## Future Enhancements

- Add currency symbols (€, $, ¥) as optional display
- Support locale-specific formatting (1.234,56 vs 1,234.56)
- Cache currencies in IndexedDB alongside parquet data
- Add currency conversion rates for cross-currency analytics
