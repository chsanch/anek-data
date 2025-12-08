<script lang="ts">
	import type { ColumnFilters, FilterOptions } from '$lib/db/queries';
	import FilterDropdown from './FilterDropdown.svelte';

	interface Props {
		filterOptions: FilterOptions;
		columnFilters: ColumnFilters;
		onFilterChange: (filters: ColumnFilters) => void;
	}

	let { filterOptions, columnFilters, onFilterChange }: Props = $props();

	// Count active filters
	let activeFilterCount = $derived(
		Object.values(columnFilters).filter((v) => v && v.trim()).length
	);

	function handleFilterChange(column: keyof ColumnFilters, value: string) {
		onFilterChange({
			...columnFilters,
			[column]: value || undefined
		});
	}

	function clearAllFilters() {
		onFilterChange({});
	}
</script>

<div class="table-toolbar">
	<div class="filters-row">
		<FilterDropdown
			label="Status"
			value={columnFilters.status ?? ''}
			options={filterOptions.status}
			onChange={(v) => handleFilterChange('status', v)}
		/>
		<FilterDropdown
			label="Type"
			value={columnFilters.fxOrderType ?? ''}
			options={filterOptions.fxOrderType}
			onChange={(v) => handleFilterChange('fxOrderType', v)}
		/>
		<FilterDropdown
			label="Buy Currency"
			value={columnFilters.buyCurrency ?? ''}
			options={filterOptions.buyCurrency}
			onChange={(v) => handleFilterChange('buyCurrency', v)}
		/>
		<FilterDropdown
			label="Sell Currency"
			value={columnFilters.sellCurrency ?? ''}
			options={filterOptions.sellCurrency}
			onChange={(v) => handleFilterChange('sellCurrency', v)}
		/>
		<FilterDropdown
			label="LP"
			value={columnFilters.liquidityProvider ?? ''}
			options={filterOptions.liquidityProvider}
			onChange={(v) => handleFilterChange('liquidityProvider', v)}
		/>

		{#if activeFilterCount > 0}
			<div class="filter-actions">
				<span class="active-filter-badge">{activeFilterCount} active</span>
				<button
					type="button"
					class="clear-filters-btn"
					onclick={clearAllFilters}
					aria-label="Clear all filters"
				>
					Clear all
				</button>
			</div>
		{/if}
	</div>
</div>

<style>
	.table-toolbar {
		padding: 12px 20px;
		border-bottom: 1px solid var(--border-primary);
		background: var(--bg-secondary);
	}

	.filters-row {
		display: flex;
		align-items: flex-end;
		gap: 12px;
		flex-wrap: wrap;
	}

	.filter-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-left: auto;
	}

	.active-filter-badge {
		display: inline-flex;
		align-items: center;
		padding: 4px 8px;
		font-size: 11px;
		font-weight: 600;
		color: var(--accent-primary);
		background: var(--accent-primary-bg);
		border-radius: 2px;
	}

	.clear-filters-btn {
		padding: 6px 12px;
		font-size: 12px;
		font-weight: 500;
		color: var(--text-secondary);
		background: transparent;
		border: 1px solid var(--border-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.clear-filters-btn:hover {
		color: var(--text-primary);
		border-color: var(--border-hover);
	}
</style>
