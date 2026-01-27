# Expandable Row Feature

## Problem Statement

Orders may have optional metadata fields (`external_reference`, `notes`) that don't warrant dedicated table columns. Adding more columns would:

- Increase horizontal scrolling on smaller screens
- Clutter the table for the majority of orders that don't have these fields
- Make the existing columns harder to scan

## Decision

Use expandable rows to reveal optional metadata on demand. Rows with extra data show a chevron indicator in the reference cell. Clicking the row toggles an expansion panel below it.

## Implementation Details

### New Fields

| Field                | Type             | DB Column            | Description                        |
| -------------------- | ---------------- | -------------------- | ---------------------------------- |
| `externalReference`  | `string \| null` | `external_reference` | External system reference ID       |
| `notes`              | `string \| null` | `notes`              | Free-text notes attached to order  |

### Behaviour

- Only rows where `external_reference` or `notes` is non-null show the expand chevron
- Clicking anywhere on an expandable row toggles the expansion panel
- The expansion row spans the full table width (`colspan="9"`)
- Multiple rows can be expanded simultaneously
- Expanded state is tracked client-side in a `Set<string>` keyed by order ID
- Orders without extra data behave exactly as before (no chevron, no pointer cursor)

### UI

- **Chevron icon**: Small `▶` / `▼` prepended to the reference cell
- **Expansion panel**: Muted background, smaller text, displays labels and values for present fields
- **Cursor**: `pointer` on expandable rows only

## Files Modified

| File                                        | Changes                                                        |
| ------------------------------------------- | -------------------------------------------------------------- |
| `src/lib/types/orders.ts`                   | Added `externalReference` and `notes` optional fields          |
| `src/lib/db/schema.ts`                      | Added `external_reference` and `notes` to `EXPECTED_COLUMNS`   |
| `src/lib/db/queries.ts`                     | Added fields to SQL SELECTs, `mapRowToOrder`, CSV headers      |
| `src/lib/components/OrdersTable.svelte`     | Added expand/collapse state, chevron icon, expandable sub-row  |

## CSV Export

Both new fields are included in CSV exports. They appear as `external_reference` and `notes` columns after `liquidity_provider`.
