<script lang="ts">
	import {
		createChart,
		HistogramSeries,
		type IChartApi,
		type ISeriesApi,
		ColorType
	} from 'lightweight-charts';
	import { untrack } from 'svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import type { DailyDirectionVolume } from '$lib/types/analytics';

	interface Props {
		data: DailyDirectionVolume[];
		loading?: boolean;
		error?: string | null;
		onRetry?: () => void;
	}

	let { data, loading = false, error = null, onRetry }: Props = $props();

	let chartContainer: HTMLDivElement | null = $state(null);
	let chartReady = $state(false);

	// These are NOT reactive - they're external library objects
	let chart: IChartApi | null = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let buySeries: ISeriesApi<any> | null = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let sellSeries: ISeriesApi<any> | null = null;

	// Colors for buy/sell
	const BUY_COLOR = '#26a69a'; // Green
	const SELL_COLOR = '#ef5350'; // Red

	// Theme-aware chart colors
	const getChartColors = (isDark: boolean) => ({
		background: isDark ? '#0a0b0d' : '#ffffff',
		textColor: isDark ? '#9ca3af' : '#374151',
		gridColor: isDark ? '#1e2028' : '#e5e7eb'
	});

	// Initialize chart when container is available
	$effect(() => {
		if (!chartContainer) return;

		// Only create chart once
		if (chart) return;

		const colors = untrack(() => getChartColors(themeStore.isDark));

		chart = createChart(chartContainer, {
			layout: {
				background: { type: ColorType.Solid, color: colors.background },
				textColor: colors.textColor
			},
			grid: {
				vertLines: { color: colors.gridColor },
				horzLines: { color: colors.gridColor }
			},
			width: chartContainer.clientWidth,
			height: 250,
			rightPriceScale: {
				borderColor: colors.gridColor
			},
			timeScale: {
				borderColor: colors.gridColor,
				timeVisible: false
			}
		});

		// Create two histogram series - buy (positive) and sell (negative)
		buySeries = chart.addSeries(HistogramSeries, {
			color: BUY_COLOR,
			priceFormat: {
				type: 'volume'
			},
			priceScaleId: 'right'
		});

		sellSeries = chart.addSeries(HistogramSeries, {
			color: SELL_COLOR,
			priceFormat: {
				type: 'volume'
			},
			priceScaleId: 'right'
		});

		chartReady = true;

		return () => {
			chart?.remove();
			chart = null;
			buySeries = null;
			sellSeries = null;
			chartReady = false;
		};
	});

	// Update data when it changes
	$effect(() => {
		if (!buySeries || !sellSeries || data.length === 0) return;

		// Buy volumes as positive values
		const buyData = data.map((d) => ({
			time: d.time,
			value: d.buyVolume,
			color: BUY_COLOR
		}));

		// Sell volumes as negative values (shown below zero line)
		const sellData = data.map((d) => ({
			time: d.time,
			value: -d.sellVolume,
			color: SELL_COLOR
		}));

		buySeries.setData(buyData);
		sellSeries.setData(sellData);

		untrack(() => {
			chart?.timeScale().fitContent();
		});
	});

	// Update theme when it changes
	$effect(() => {
		if (!chartReady || !chart) return;

		const colors = getChartColors(themeStore.isDark);

		chart.applyOptions({
			layout: {
				background: { type: ColorType.Solid, color: colors.background },
				textColor: colors.textColor
			},
			grid: {
				vertLines: { color: colors.gridColor },
				horzLines: { color: colors.gridColor }
			},
			rightPriceScale: {
				borderColor: colors.gridColor
			},
			timeScale: {
				borderColor: colors.gridColor
			}
		});
	});

	// Handle resize
	$effect(() => {
		if (!chart || !chartContainer) return;

		const currentChart = chart;
		const resizeObserver = new ResizeObserver((entries) => {
			if (entries.length === 0) return;
			const { width } = entries[0].contentRect;
			currentChart.applyOptions({ width });
		});

		resizeObserver.observe(chartContainer);

		return () => {
			resizeObserver.disconnect();
		};
	});
</script>

<div class="direction-chart">
	{#if loading}
		<div class="chart-placeholder">
			<div class="loading-spinner"></div>
			<span>Loading chart data...</span>
		</div>
	{:else if error}
		<div class="chart-placeholder error">
			<span class="error-message">{error}</span>
			{#if onRetry}
				<button class="retry-button" onclick={onRetry}>Retry</button>
			{/if}
		</div>
	{:else}
		<div
			class="chart-container"
			class:hidden={data.length === 0}
			bind:this={chartContainer}
		></div>
		{#if data.length === 0}
			<div class="chart-placeholder">
				<span>No data available for the selected time range</span>
			</div>
		{/if}
	{/if}
	<div class="chart-legend">
		<span class="legend-item buy">
			<span class="legend-color"></span>
			Buy
		</span>
		<span class="legend-item sell">
			<span class="legend-color"></span>
			Sell
		</span>
	</div>
</div>

<style>
	.direction-chart {
		width: 100%;
		min-height: 250px;
		border-radius: 8px;
		overflow: hidden;
		background: var(--card-bg, #12131a);
		border: 1px solid var(--card-border, #1e2028);
		position: relative;
	}

	.chart-container {
		width: 100%;
		height: 250px;
	}

	.chart-container.hidden {
		display: none;
	}

	.chart-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 250px;
		gap: 12px;
		color: var(--text-secondary, #9ca3af);
	}

	.chart-placeholder.error {
		color: var(--error-color, #ef4444);
	}

	.error-message {
		text-align: center;
		padding: 0 16px;
	}

	.retry-button {
		padding: 8px 16px;
		background: var(--primary-color, #00d4aa);
		color: var(--primary-text, #0a0b0d);
		border: none;
		border-radius: 6px;
		cursor: pointer;
		font-weight: 500;
		transition: opacity 0.2s;
	}

	.retry-button:hover {
		opacity: 0.9;
	}

	.loading-spinner {
		width: 32px;
		height: 32px;
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

	.chart-legend {
		display: flex;
		justify-content: center;
		gap: 24px;
		padding: 12px;
		border-top: 1px solid var(--card-border, #1e2028);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: var(--text-secondary, #9ca3af);
	}

	.legend-color {
		width: 12px;
		height: 12px;
		border-radius: 2px;
	}

	.legend-item.buy .legend-color {
		background: #26a69a;
	}

	.legend-item.sell .legend-color {
		background: #ef5350;
	}

	:global([data-theme='light']) .direction-chart {
		background: #ffffff;
		border-color: #e5e7eb;
	}

	:global([data-theme='light']) .chart-placeholder {
		color: #6b7280;
	}

	:global([data-theme='light']) .loading-spinner {
		border-color: #e5e7eb;
		border-top-color: #059669;
	}

	:global([data-theme='light']) .retry-button {
		background: #059669;
		color: #ffffff;
	}

	:global([data-theme='light']) .chart-legend {
		border-top-color: #e5e7eb;
	}

	:global([data-theme='light']) .legend-item {
		color: #6b7280;
	}
</style>
