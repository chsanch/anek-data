<script lang="ts">
	import {
		createChart,
		AreaSeries,
		type IChartApi,
		type ISeriesApi,
		ColorType
	} from 'lightweight-charts';
	import { untrack } from 'svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import type { DailyVolume } from '$lib/types/analytics';

	interface Props {
		data: DailyVolume[];
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
	let areaSeries: ISeriesApi<any> | null = null;

	// Theme-aware chart colors
	const getChartColors = (isDark: boolean) => ({
		background: isDark ? '#0a0b0d' : '#ffffff',
		textColor: isDark ? '#9ca3af' : '#374151',
		gridColor: isDark ? '#1e2028' : '#e5e7eb',
		lineColor: isDark ? '#00d4aa' : '#059669',
		areaTopColor: isDark ? 'rgba(0, 212, 170, 0.4)' : 'rgba(5, 150, 105, 0.4)',
		areaBottomColor: isDark ? 'rgba(0, 212, 170, 0.0)' : 'rgba(5, 150, 105, 0.0)'
	});

	// Format large numbers with K, M, B suffixes
	function formatCompactPrice(price: number): string {
		const absPrice = Math.abs(price);
		if (absPrice >= 1_000_000_000_000) {
			return (price / 1_000_000_000_000).toFixed(1) + 'T';
		}
		if (absPrice >= 1_000_000_000) {
			return (price / 1_000_000_000).toFixed(1) + 'B';
		}
		if (absPrice >= 1_000_000) {
			return (price / 1_000_000).toFixed(1) + 'M';
		}
		if (absPrice >= 1_000) {
			return (price / 1_000).toFixed(1) + 'K';
		}
		return price.toFixed(2);
	}

	// Initialize chart when container is available
	$effect(() => {
		if (!chartContainer) return;

		// Only create chart once - use untrack to avoid theme dependency
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
			height: 300,
			rightPriceScale: {
				borderColor: colors.gridColor
			},
			timeScale: {
				borderColor: colors.gridColor,
				timeVisible: false
			},
			crosshair: {
				vertLine: {
					labelBackgroundColor: colors.lineColor
				},
				horzLine: {
					labelBackgroundColor: colors.lineColor
				}
			},
			localization: {
				priceFormatter: formatCompactPrice
			}
		});

		areaSeries = chart.addSeries(AreaSeries, {
			lineColor: colors.lineColor,
			topColor: colors.areaTopColor,
			bottomColor: colors.areaBottomColor,
			lineWidth: 2,
			priceFormat: {
				type: 'custom',
				formatter: formatCompactPrice
			}
		});

		// Signal that chart is ready for theme updates
		chartReady = true;

		// Cleanup on destroy
		return () => {
			chart?.remove();
			chart = null;
			areaSeries = null;
			chartReady = false;
		};
	});

	// Update data when it changes
	$effect(() => {
		if (!areaSeries || data.length === 0) return;

		const chartData = data.map((d) => ({
			time: d.time,
			value: d.value
		}));
		areaSeries.setData(chartData);

		untrack(() => {
			chart?.timeScale().fitContent();
		});
	});

	// Update theme when it changes
	$effect(() => {
		// Use chartReady as reactive dependency to ensure this runs after chart init
		if (!chartReady || !chart || !areaSeries) return;

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

		areaSeries.applyOptions({
			lineColor: colors.lineColor,
			topColor: colors.areaTopColor,
			bottomColor: colors.areaBottomColor
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

<div class="volume-chart">
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
		<!-- Always render container so chart can initialize -->
		<div class="chart-container" class:hidden={data.length === 0} bind:this={chartContainer}></div>
		{#if data.length === 0}
			<div class="chart-placeholder">
				<span>No data available for the selected time range</span>
			</div>
		{/if}
	{/if}
</div>

<style>
	.volume-chart {
		width: 100%;
		min-height: 300px;
		border-radius: 8px;
		overflow: hidden;
		background: var(--card-bg, #12131a);
		border: 1px solid var(--card-border, #1e2028);
	}

	.chart-container {
		width: 100%;
		height: 300px;
	}

	.chart-container.hidden {
		display: none;
	}

	.chart-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 300px;
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

	:global([data-theme='light']) .volume-chart {
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
</style>
