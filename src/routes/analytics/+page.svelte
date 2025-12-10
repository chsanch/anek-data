<script lang="ts">
	import VolumeChart from '$lib/components/charts/VolumeChart.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { getDataContext } from '$lib/db/context';
	import { getDailyVolume, type DashboardStats, getDashboardStats } from '$lib/db/queries';
	import { calculateDateRange } from '$lib/utils/date-range';
	import { formatCompact } from '$lib/utils/format';
	import type { DailyVolume, TimeRangePreset } from '$lib/types/analytics';
	import { DEFAULT_TIME_RANGE, TIME_RANGE_OPTIONS } from '$lib/types/analytics';

	const dataContext = getDataContext();

	// Time range state
	let selectedTimeRange: TimeRangePreset = $state(DEFAULT_TIME_RANGE);

	// Chart data state
	let volumeData: DailyVolume[] = $state([]);
	let volumeLoading = $state(false);
	let volumeError: string | null = $state(null);

	// Stats for summary
	let stats: DashboardStats | null = $state(null);

	// Load data when initialized or time range changes
	$effect(() => {
		if (dataContext.state.initialized && dataContext.db) {
			loadVolumeData();
			loadStats();
		}
	});

	async function loadVolumeData() {
		if (!dataContext.db) return;

		volumeLoading = true;
		volumeError = null;

		try {
			const { start, end } = calculateDateRange(selectedTimeRange);
			volumeData = await getDailyVolume(dataContext.db, start, end);
		} catch (err) {
			volumeError = err instanceof Error ? err.message : 'Failed to load volume data';
			volumeData = [];
		} finally {
			volumeLoading = false;
		}
	}

	async function loadStats() {
		if (!dataContext.db) return;

		try {
			stats = await getDashboardStats(dataContext.db);
		} catch {
			// Stats are optional, don't show error
			stats = null;
		}
	}

	function handleTimeRangeChange(event: Event) {
		const target = event.target as HTMLSelectElement;
		selectedTimeRange = target.value as TimeRangePreset;
		loadVolumeData();
	}
</script>

<div class="analytics-page">
	<header class="page-header">
		<div class="header-left">
			<a href="/" class="back-link">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<path d="M19 12H5M12 19l-7-7 7-7" />
				</svg>
				Dashboard
			</a>
			<h1>Analytics</h1>
		</div>
		<div class="header-right">
			<ThemeToggle />
		</div>
	</header>

	{#if !dataContext.state.initialized}
		<div class="loading-state">
			<div class="loading-spinner"></div>
			<span>Initializing data...</span>
		</div>
	{:else if dataContext.state.error}
		<div class="error-state">
			<span>Failed to load data: {dataContext.state.error}</span>
		</div>
	{:else}
		<!-- Summary Stats -->
		{#if stats}
			<div class="stats-summary">
				<div class="stat-item">
					<span class="stat-label">Total Volume</span>
					<span class="stat-value">{formatCompact(stats.totalVolume)}</span>
				</div>
				<div class="stat-item">
					<span class="stat-label">Total Trades</span>
					<span class="stat-value">{stats.totalTrades.toLocaleString()}</span>
				</div>
				<div class="stat-item">
					<span class="stat-label">Open Orders</span>
					<span class="stat-value">{stats.openOrders.toLocaleString()}</span>
				</div>
			</div>
		{/if}

		<!-- Volume Chart Section -->
		<section class="chart-section">
			<div class="section-header">
				<h2>Daily Trading Volume</h2>
				<div class="time-range-selector">
					<label for="time-range" class="sr-only">Time Range</label>
					<select id="time-range" value={selectedTimeRange} onchange={handleTimeRangeChange}>
						{#each TIME_RANGE_OPTIONS as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>
			</div>
			<VolumeChart
				data={volumeData}
				loading={volumeLoading}
				error={volumeError}
				onRetry={loadVolumeData}
			/>
		</section>
	{/if}
</div>

<style>
	.analytics-page {
		min-height: 100vh;
		padding: 24px;
		background: var(--page-bg, #0a0b0d);
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 24px;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.back-link {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--text-secondary, #9ca3af);
		text-decoration: none;
		font-size: 14px;
		transition: color 0.2s;
	}

	.back-link:hover {
		color: var(--text-primary, #ffffff);
	}

	h1 {
		font-size: 24px;
		font-weight: 600;
		color: var(--text-primary, #ffffff);
		margin: 0;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.loading-state,
	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		gap: 16px;
		color: var(--text-secondary, #9ca3af);
	}

	.error-state {
		color: var(--error-color, #ef4444);
	}

	.loading-spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--spinner-track, #1e2028);
		border-top-color: var(--primary-color, #00d4aa);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.stats-summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 16px;
		margin-bottom: 24px;
	}

	.stat-item {
		background: var(--card-bg, #12131a);
		border: 1px solid var(--card-border, #1e2028);
		border-radius: 8px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.stat-label {
		font-size: 12px;
		color: var(--text-secondary, #9ca3af);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.stat-value {
		font-size: 24px;
		font-weight: 600;
		color: var(--text-primary, #ffffff);
	}

	.chart-section {
		margin-bottom: 24px;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	h2 {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-primary, #ffffff);
		margin: 0;
	}

	.time-range-selector select {
		background: var(--input-bg, #1e2028);
		border: 1px solid var(--input-border, #2e3038);
		border-radius: 6px;
		padding: 8px 12px;
		color: var(--text-primary, #ffffff);
		font-size: 14px;
		cursor: pointer;
		transition: border-color 0.2s;
	}

	.time-range-selector select:hover {
		border-color: var(--input-border-hover, #3e4048);
	}

	.time-range-selector select:focus {
		outline: none;
		border-color: var(--primary-color, #00d4aa);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* Light theme */
	:global([data-theme='light']) .analytics-page {
		background: #f9fafb;
	}

	:global([data-theme='light']) h1,
	:global([data-theme='light']) h2 {
		color: #111827;
	}

	:global([data-theme='light']) .back-link {
		color: #6b7280;
	}

	:global([data-theme='light']) .back-link:hover {
		color: #111827;
	}

	:global([data-theme='light']) .stat-item {
		background: #ffffff;
		border-color: #e5e7eb;
	}

	:global([data-theme='light']) .stat-label {
		color: #6b7280;
	}

	:global([data-theme='light']) .stat-value {
		color: #111827;
	}

	:global([data-theme='light']) .time-range-selector select {
		background: #ffffff;
		border-color: #d1d5db;
		color: #111827;
	}

	:global([data-theme='light']) .time-range-selector select:hover {
		border-color: #9ca3af;
	}

	:global([data-theme='light']) .loading-spinner {
		border-color: #e5e7eb;
		border-top-color: #059669;
	}
</style>
