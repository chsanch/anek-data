<script lang="ts">
	import type { OrderTypeDistribution } from '$lib/db/queries';

	interface Props {
		data: OrderTypeDistribution[];
		loading?: boolean;
		error?: string | null;
		onRetry?: () => void;
	}

	let { data, loading = false, error = null, onRetry }: Props = $props();

	// Format type label for display
	function formatType(type: string): string {
		return type.charAt(0).toUpperCase() + type.slice(1);
	}

	// Get color class for order type
	function getTypeColorClass(type: string): string {
		switch (type) {
			case 'forward':
				return 'type-forward';
			case 'chain':
				return 'type-chain';
			case 'spot':
				return 'type-spot';
			default:
				return '';
		}
	}

	// Format large numbers with K, M, B suffixes
	function formatCount(count: number): string {
		if (count >= 1_000_000_000) {
			return (count / 1_000_000_000).toFixed(1) + 'B';
		}
		if (count >= 1_000_000) {
			return (count / 1_000_000).toFixed(1) + 'M';
		}
		if (count >= 1_000) {
			return (count / 1_000).toFixed(1) + 'K';
		}
		return count.toLocaleString();
	}
</script>

<div class="type-distribution">
	<div class="distribution-header">
		<h3>Order Types</h3>
	</div>

	{#if loading}
		<div class="distribution-placeholder">
			<div class="loading-spinner"></div>
			<span>Loading...</span>
		</div>
	{:else if error}
		<div class="distribution-placeholder error">
			<span class="error-message">{error}</span>
			{#if onRetry}
				<button class="retry-button" onclick={onRetry}>Retry</button>
			{/if}
		</div>
	{:else if data.length === 0}
		<div class="distribution-placeholder">
			<span>No type data available</span>
		</div>
	{:else}
		<div class="distribution-bars">
			{#each data as item (item.type)}
				<div class="bar-row">
					<div class="bar-label">
						<span class="type-name {getTypeColorClass(item.type)}">
							{formatType(item.type)}
						</span>
						<span class="type-count">{formatCount(item.count)}</span>
					</div>
					<div class="bar-container">
						<div
							class="bar-fill {getTypeColorClass(item.type)}"
							style="width: {item.percentage}%"
						></div>
					</div>
					<span class="bar-percentage">{item.percentage.toFixed(1)}%</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.type-distribution {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		padding: 16px 20px;
		transition:
			background 0.3s ease,
			border-color 0.3s ease;
	}

	.distribution-header {
		margin-bottom: 16px;
	}

	.distribution-header h3 {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin: 0;
	}

	.distribution-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100px;
		gap: 12px;
		color: var(--text-secondary);
	}

	.distribution-placeholder.error {
		color: var(--accent-danger);
	}

	.error-message {
		text-align: center;
	}

	.retry-button {
		padding: 6px 12px;
		background: var(--accent-primary);
		color: var(--bg-primary);
		border: none;
		cursor: pointer;
		font-size: 12px;
		font-weight: 500;
		transition: opacity 0.2s;
	}

	.retry-button:hover {
		opacity: 0.9;
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

	.distribution-bars {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.bar-row {
		display: grid;
		grid-template-columns: 100px 1fr 50px;
		align-items: center;
		gap: 12px;
	}

	.bar-label {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.type-name {
		font-size: 13px;
		font-weight: 600;
		text-transform: capitalize;
	}

	.type-count {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 11px;
		color: var(--text-muted);
	}

	.bar-container {
		height: 8px;
		background: var(--border-primary);
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		transition: width 0.3s ease;
	}

	.bar-percentage {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 12px;
		font-weight: 500;
		color: var(--text-secondary);
		text-align: right;
	}

	/* Type colors matching OrdersTable */
	.type-forward {
		color: var(--accent-purple);
	}

	.bar-fill.type-forward {
		background: var(--accent-purple);
	}

	.type-chain {
		color: var(--accent-warning);
	}

	.bar-fill.type-chain {
		background: var(--accent-warning);
	}

	.type-spot {
		color: var(--accent-primary);
	}

	.bar-fill.type-spot {
		background: var(--accent-primary);
	}
</style>
