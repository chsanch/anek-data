<script lang="ts">
	interface Props {
		buyCount: number;
		sellCount: number;
		loading?: boolean;
	}

	let { buyCount, sellCount, loading = false }: Props = $props();

	// Calculate percentages and ratio
	let total = $derived(buyCount + sellCount);
	let buyPercentage = $derived(total > 0 ? (buyCount / total) * 100 : 50);
	let sellPercentage = $derived(total > 0 ? (sellCount / total) * 100 : 50);
	let hasData = $derived(total > 0 && sellCount > 0);
	let ratio = $derived(hasData ? (buyCount / sellCount).toFixed(2) : null);

	// Format large numbers with K, M suffixes
	function formatCount(count: number): string {
		if (count >= 1_000_000) {
			return (count / 1_000_000).toFixed(1) + 'M';
		}
		if (count >= 1_000) {
			return (count / 1_000).toFixed(1) + 'K';
		}
		return count.toLocaleString();
	}
</script>

<div class="buy-sell-ratio">
	<div class="ratio-header">
		<h3>Buy/Sell Ratio</h3>
		<span class="ratio-value">{ratio !== null ? `${ratio}:1` : '—'}</span>
	</div>

	{#if loading}
		<div class="ratio-placeholder">
			<div class="loading-spinner"></div>
			<span>Loading...</span>
		</div>
	{:else if total === 0}
		<div class="ratio-placeholder">
			<span>No data available</span>
		</div>
	{:else}
		<div class="ratio-bar-container">
			<div class="ratio-bar">
				<div
					class="bar-segment buy"
					style="width: {buyPercentage}%"
					title="Buy: {buyCount.toLocaleString()} ({buyPercentage.toFixed(1)}%)"
				></div>
				<div
					class="bar-segment sell"
					style="width: {sellPercentage}%"
					title="Sell: {sellCount.toLocaleString()} ({sellPercentage.toFixed(1)}%)"
				></div>
			</div>
		</div>

		<div class="ratio-legend">
			<div class="legend-item">
				<span class="legend-dot buy"></span>
				<span class="legend-label">Buy</span>
				<span class="legend-count">{formatCount(buyCount)}</span>
				<span class="legend-percentage">{buyPercentage.toFixed(1)}%</span>
			</div>
			<div class="legend-item">
				<span class="legend-dot sell"></span>
				<span class="legend-label">Sell</span>
				<span class="legend-count">{formatCount(sellCount)}</span>
				<span class="legend-percentage">{sellPercentage.toFixed(1)}%</span>
			</div>
		</div>
	{/if}
</div>

<style>
	.buy-sell-ratio {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		padding: 16px 20px;
		transition:
			background 0.3s ease,
			border-color 0.3s ease;
	}

	.ratio-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.ratio-header h3 {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin: 0;
	}

	.ratio-value {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 18px;
		font-weight: 600;
		color: var(--text-white);
	}

	.ratio-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 80px;
		gap: 12px;
		color: var(--text-secondary);
	}

	.loading-spinner {
		width: 24px;
		height: 24px;
		border: 2px solid var(--border-primary);
		border-top-color: var(--accent-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.ratio-bar-container {
		margin-bottom: 16px;
	}

	.ratio-bar {
		display: flex;
		height: 12px;
		border-radius: 6px;
		overflow: hidden;
		background: var(--border-primary);
	}

	.bar-segment {
		height: 100%;
		transition: width 0.3s ease;
	}

	.bar-segment.buy {
		background: var(--accent-primary);
	}

	.bar-segment.sell {
		background: var(--accent-danger);
	}

	.ratio-legend {
		display: flex;
		justify-content: space-between;
		gap: 16px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
	}

	.legend-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.legend-dot.buy {
		background: var(--accent-primary);
	}

	.legend-dot.sell {
		background: var(--accent-danger);
	}

	.legend-label {
		font-size: 13px;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.legend-count {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 13px;
		font-weight: 600;
		color: var(--text-white);
		margin-left: auto;
	}

	.legend-percentage {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 12px;
		color: var(--text-muted);
		min-width: 45px;
		text-align: right;
	}
</style>
