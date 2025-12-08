<script lang="ts">
	import Modal from './Modal.svelte';
	import type { ColumnFilters, SortConfig } from '$lib/db/queries';

	interface Props {
		open: boolean;
		onclose: () => void;
		onexport: (options: ExportOptions) => void;
		ongetcount: (options: ExportOptions) => Promise<number>;
		exporting?: boolean;
		totalOrders?: number;
		// For filtered export
		filteredCount?: number;
		hasActiveFilters?: boolean;
		referenceSearch?: string;
		columnFilters?: ColumnFilters;
		sortConfig?: SortConfig;
	}

	export interface ExportOptions {
		type: 'all' | 'date-range' | 'filtered';
		startDate?: string;
		endDate?: string;
		// For filtered exports
		referenceSearch?: string;
		columnFilters?: ColumnFilters;
		sortConfig?: SortConfig;
	}

	let {
		open,
		onclose,
		onexport,
		ongetcount,
		exporting = false,
		totalOrders = 0,
		filteredCount = 0,
		hasActiveFilters = false,
		referenceSearch = '',
		columnFilters = {},
		sortConfig
	}: Props = $props();

	let exportType = $state<'all' | 'date-range' | 'filtered'>('all');
	let startDate = $state('');
	let endDate = $state('');
	let previewCount = $state<number | null>(null);
	let loadingCount = $state(false);

	// Set default dates when switching to date-range
	$effect(() => {
		if (exportType === 'date-range' && !startDate) {
			const today = new Date();
			const thirtyDaysAgo = new Date(today);
			thirtyDaysAgo.setDate(today.getDate() - 30);

			startDate = thirtyDaysAgo.toISOString().split('T')[0];
			endDate = today.toISOString().split('T')[0];
		}
	});

	// Default to filtered export if filters are active when modal opens
	$effect(() => {
		if (open && hasActiveFilters) {
			exportType = 'filtered';
		}
	});

	// Reset preview count when modal opens or export type changes
	$effect(() => {
		if (open) {
			if (exportType === 'all') {
				previewCount = totalOrders;
			} else if (exportType === 'filtered') {
				previewCount = filteredCount;
			} else {
				previewCount = null;
			}
		}
	});

	// Fetch count when date range changes (with debounce)
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (exportType === 'date-range' && startDate && endDate && startDate <= endDate) {
			// Clear previous timer
			if (debounceTimer) clearTimeout(debounceTimer);

			// Debounce the count fetch
			debounceTimer = setTimeout(async () => {
				loadingCount = true;
				try {
					previewCount = await ongetcount({
						type: 'date-range',
						startDate,
						endDate
					});
				} catch (e) {
					console.error('Failed to get count:', e);
					previewCount = null;
				} finally {
					loadingCount = false;
				}
			}, 300);
		}
	});

	function handleExport() {
		const options: ExportOptions = {
			type: exportType
		};

		if (exportType === 'date-range') {
			options.startDate = startDate;
			options.endDate = endDate;
		} else if (exportType === 'filtered') {
			options.referenceSearch = referenceSearch;
			options.columnFilters = columnFilters;
			options.sortConfig = sortConfig;
		}

		onexport(options);
	}

	let isValid = $derived(
		exportType === 'all' ||
		exportType === 'filtered' ||
		(exportType === 'date-range' && startDate && endDate && startDate <= endDate)
	);
</script>

<Modal {open} title="Export Orders" {onclose}>
	<div class="export-options">
		<p class="export-description">
			Export orders data from the local DuckDB storage as a CSV file.
		</p>

		<div class="option-group">
			{#if hasActiveFilters}
				<label class="radio-option highlighted">
					<input
						type="radio"
						name="export-type"
						value="filtered"
						bind:group={exportType}
					/>
					<span class="radio-label">
						<span class="radio-title">
							Export current view
							<span class="filtered-badge">{filteredCount.toLocaleString()} rows</span>
						</span>
						<span class="radio-description">Export orders matching your current filters and sort order</span>
					</span>
				</label>
			{/if}

			<label class="radio-option">
				<input
					type="radio"
					name="export-type"
					value="all"
					bind:group={exportType}
				/>
				<span class="radio-label">
					<span class="radio-title">Export all orders</span>
					<span class="radio-description">Download all {totalOrders.toLocaleString()} orders in the database</span>
				</span>
			</label>

			<label class="radio-option">
				<input
					type="radio"
					name="export-type"
					value="date-range"
					bind:group={exportType}
				/>
				<span class="radio-label">
					<span class="radio-title">Filter by date range</span>
					<span class="radio-description">Export orders within a specific creation date range</span>
				</span>
			</label>
		</div>

		{#if exportType === 'date-range'}
			<div class="date-range-inputs">
				<div class="date-field">
					<label for="start-date">Start Date</label>
					<input
						type="date"
						id="start-date"
						bind:value={startDate}
					/>
				</div>
				<div class="date-field">
					<label for="end-date">End Date</label>
					<input
						type="date"
						id="end-date"
						bind:value={endDate}
					/>
				</div>
			</div>
			{#if startDate && endDate && startDate > endDate}
				<p class="error-message">Start date must be before or equal to end date</p>
			{/if}
		{/if}

		<!-- Preview count -->
		<div class="preview-count">
			{#if loadingCount}
				<span class="count-loading">
					<span class="mini-spinner"></span>
					Counting rows...
				</span>
			{:else if previewCount !== null}
				<span class="count-value">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
						<polyline points="14 2 14 8 20 8" />
						<line x1="16" y1="13" x2="8" y2="13" />
						<line x1="16" y1="17" x2="8" y2="17" />
						<polyline points="10 9 9 9 8 9" />
					</svg>
					<strong>{previewCount.toLocaleString()}</strong> rows will be exported
				</span>
			{/if}
		</div>
	</div>

	{#snippet footer()}
		<button class="btn-cancel" onclick={onclose} disabled={exporting}>
			Cancel
		</button>
		<button
			class="btn-export"
			onclick={handleExport}
			disabled={!isValid || exporting}
		>
			{#if exporting}
				<span class="spinner"></span>
				Exporting...
			{:else}
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
					<polyline points="7 10 12 15 17 10" />
					<line x1="12" y1="15" x2="12" y2="3" />
				</svg>
				Export CSV
			{/if}
		</button>
	{/snippet}
</Modal>

<style>
	.export-options {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.export-description {
		margin: 0;
		font-size: 14px;
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.option-group {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.radio-option {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 12px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-primary);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.radio-option:hover {
		border-color: var(--border-secondary);
	}

	.radio-option:has(input:checked) {
		border-color: var(--accent-primary);
		background: var(--accent-primary-muted);
	}

	.radio-option input[type="radio"] {
		margin-top: 2px;
		accent-color: var(--accent-primary);
	}

	.radio-label {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.radio-title {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		font-weight: 500;
		color: var(--text-primary);
	}

	.filtered-badge {
		display: inline-flex;
		padding: 2px 6px;
		font-size: 11px;
		font-weight: 600;
		font-family: 'IBM Plex Mono', monospace;
		color: var(--accent-primary);
		background: var(--accent-primary-bg);
		border-radius: 2px;
	}

	.radio-option.highlighted {
		border-color: var(--accent-primary);
		background: var(--accent-primary-muted);
	}

	.radio-description {
		font-size: 12px;
		color: var(--text-muted);
	}

	.date-range-inputs {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	.date-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.date-field label {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.date-field input[type="date"] {
		padding: 10px 12px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-primary);
		color: var(--text-primary);
		font-family: 'IBM Plex Mono', monospace;
		font-size: 13px;
		transition: border-color 0.15s ease;
	}

	.date-field input[type="date"]:focus {
		outline: none;
		border-color: var(--accent-primary);
	}

	.error-message {
		margin: 0;
		font-size: 12px;
		color: var(--accent-danger);
	}

	.preview-count {
		display: flex;
		align-items: center;
		min-height: 40px;
		padding: 12px 16px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-primary);
	}

	.count-loading {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: var(--text-muted);
	}

	.count-value {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		color: var(--text-secondary);
	}

	.count-value svg {
		color: var(--accent-primary);
	}

	.count-value strong {
		color: var(--text-primary);
		font-family: 'IBM Plex Mono', monospace;
	}

	.mini-spinner {
		width: 12px;
		height: 12px;
		border: 2px solid var(--border-secondary);
		border-top-color: var(--accent-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	.btn-cancel,
	.btn-export {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 10px 16px;
		font-size: 13px;
		font-weight: 500;
		border: none;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-cancel {
		background: transparent;
		border: 1px solid var(--border-secondary);
		color: var(--text-secondary);
	}

	.btn-cancel:hover:not(:disabled) {
		border-color: var(--border-hover);
		color: var(--text-primary);
	}

	.btn-export {
		background: var(--accent-primary);
		color: var(--bg-primary);
	}

	.btn-export:hover:not(:disabled) {
		background: var(--accent-primary-hover);
	}

	.btn-cancel:disabled,
	.btn-export:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.spinner {
		width: 14px;
		height: 14px;
		border: 2px solid transparent;
		border-top-color: currentColor;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
