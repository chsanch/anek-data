<script lang="ts">
	import type { StatusDistribution } from '$lib/types/analytics';

	interface Props {
		data: StatusDistribution[];
		loading?: boolean;
		error?: string | null;
		onRetry?: () => void;
	}

	let { data, loading = false, error = null, onRetry }: Props = $props();

	// Format status label for display
	function formatStatus(status: string): string {
		return status.replace(/_/g, ' ');
	}

	// Get color class for status
	function getStatusColorClass(status: string): string {
		switch (status) {
			case 'open':
				return 'status-open';
			case 'completed':
				return 'status-completed';
			case 'closed_to_trading':
				return 'status-closed';
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

<div class="status-distribution">
	<div class="distribution-header">
		<h3>Order Status</h3>
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
			<span>No status data available</span>
		</div>
	{:else}
		<div class="distribution-bars">
			{#each data as item (item.status)}
				<div class="bar-row">
					<div class="bar-label">
						<span class="status-name {getStatusColorClass(item.status)}">
							{formatStatus(item.status)}
						</span>
						<span class="status-count">{formatCount(item.count)}</span>
					</div>
					<div class="bar-container">
						<div
							class="bar-fill {getStatusColorClass(item.status)}"
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
	.status-distribution {
		background: var(--card-bg, #12131a);
		border: 1px solid var(--card-border, #1e2028);
		border-radius: 8px;
		padding: 16px;
	}

	.distribution-header {
		margin-bottom: 16px;
	}

	.distribution-header h3 {
		font-size: 16px;
		font-weight: 600;
		color: var(--text-primary, #ffffff);
		margin: 0;
	}

	.distribution-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 120px;
		gap: 12px;
		color: var(--text-secondary, #9ca3af);
	}

	.distribution-placeholder.error {
		color: var(--error-color, #ef4444);
	}

	.error-message {
		text-align: center;
	}

	.retry-button {
		padding: 6px 12px;
		background: var(--primary-color, #00d4aa);
		color: var(--primary-text, #0a0b0d);
		border: none;
		border-radius: 4px;
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
		border: 2px solid var(--spinner-track, #1e2028);
		border-top-color: var(--primary-color, #00d4aa);
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
		grid-template-columns: 140px 1fr 50px;
		align-items: center;
		gap: 12px;
	}

	.bar-label {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.status-name {
		font-size: 13px;
		font-weight: 500;
		text-transform: capitalize;
	}

	.status-count {
		font-size: 11px;
		color: var(--text-secondary, #9ca3af);
	}

	.bar-container {
		height: 8px;
		background: var(--bar-track, #1e2028);
		border-radius: 4px;
		overflow: hidden;
	}

	.bar-fill {
		height: 100%;
		border-radius: 4px;
		transition: width 0.3s ease;
	}

	.bar-percentage {
		font-size: 12px;
		font-weight: 500;
		color: var(--text-secondary, #9ca3af);
		text-align: right;
	}

	/* Status colors */
	.status-open {
		color: var(--accent-warning, #fbbf24);
	}

	.bar-fill.status-open {
		background: var(--accent-warning, #fbbf24);
	}

	.status-completed {
		color: var(--accent-primary, #00d4aa);
	}

	.bar-fill.status-completed {
		background: var(--accent-primary, #00d4aa);
	}

	.status-closed {
		color: var(--text-secondary, #9ca3af);
	}

	.bar-fill.status-closed {
		background: var(--text-secondary, #9ca3af);
	}

	/* Light theme */
	:global([data-theme='light']) .status-distribution {
		background: #ffffff;
		border-color: #e5e7eb;
	}

	:global([data-theme='light']) .distribution-header h3 {
		color: #111827;
	}

	:global([data-theme='light']) .distribution-placeholder {
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

	:global([data-theme='light']) .bar-container {
		background: #e5e7eb;
	}

	:global([data-theme='light']) .status-open {
		color: #d97706;
	}

	:global([data-theme='light']) .bar-fill.status-open {
		background: #d97706;
	}

	:global([data-theme='light']) .status-completed {
		color: #059669;
	}

	:global([data-theme='light']) .bar-fill.status-completed {
		background: #059669;
	}

	:global([data-theme='light']) .status-closed {
		color: #6b7280;
	}

	:global([data-theme='light']) .bar-fill.status-closed {
		background: #9ca3af;
	}
</style>
