<script lang="ts">
	import type { CacheStatus } from '$lib/db/cache-types';

	interface Props {
		status: CacheStatus;
		onRefresh?: () => void;
		refreshing?: boolean;
	}

	let { status, onRefresh, refreshing = false }: Props = $props();

	// Format timestamp as readable time (e.g., "2:30 PM")
	let formattedTime = $derived.by(() => {
		if (!status.timestamp) return null;
		return new Date(status.timestamp).toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		});
	});

	// Determine the display label based on cache state
	let statusLabel = $derived.by(() => {
		switch (status.state) {
			case 'checking':
				return 'Checking cache...';
			case 'loading':
				return 'Loading data...';
			case 'error':
				return 'Error';
			case 'ready':
				if (status.source === 'cache') {
					return status.isStale ? 'Stale cache' : 'Cached';
				}
				return 'Fresh';
			default:
				return 'Idle';
		}
	});

	// Determine status variant for styling
	let statusVariant = $derived.by(() => {
		if (status.state === 'checking' || status.state === 'loading') return 'loading';
		if (status.state === 'error') return 'error';
		if (status.isStale) return 'stale';
		if (status.source === 'cache') return 'cache';
		if (status.source === 'network') return 'network';
		return 'idle';
	});

	let isLoading = $derived(status.state === 'checking' || status.state === 'loading' || refreshing);
</script>

<div class="cache-indicator" data-variant={statusVariant}>
	<div class="status-content">
		<span class="status-dot" class:pulsing={isLoading}></span>
		<span class="status-label">{statusLabel}</span>
		{#if formattedTime && status.state === 'ready'}
			<span class="status-time">- Last updated: {formattedTime}</span>
		{/if}
	</div>
	{#if status.isStale}
		<span class="stale-warning" title="Data may be outdated. Refresh to get latest.">
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path
					d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
				/>
				<line x1="12" y1="9" x2="12" y2="13" />
				<line x1="12" y1="17" x2="12.01" y2="17" />
			</svg>
		</span>
	{/if}
	{#if onRefresh}
		<button
			class="refresh-btn"
			onclick={onRefresh}
			disabled={isLoading}
			aria-label="Force refresh data"
			title="Force refresh data from server"
		>
			<svg
				class="refresh-icon"
				class:spinning={isLoading}
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
			>
				<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
				<path d="M21 3v5h-5" />
			</svg>
		</button>
	{/if}
</div>

<style>
	.cache-indicator {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 4px 10px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-primary);
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
		transition: all 0.2s ease;
	}

	.status-content {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.status-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--text-muted);
		transition: background 0.2s ease;
	}

	.status-dot.pulsing {
		animation: pulse 1.5s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.4;
		}
	}

	/* Variant-based status dot colors */
	[data-variant='cache'] .status-dot {
		background: var(--accent-primary);
	}

	[data-variant='network'] .status-dot {
		background: #22c55e;
	}

	[data-variant='loading'] .status-dot {
		background: #f59e0b;
	}

	[data-variant='error'] .status-dot {
		background: #ef4444;
	}

	[data-variant='stale'] .status-dot {
		background: #f59e0b;
	}

	.status-label {
		color: var(--text-primary);
	}

	.status-time {
		color: var(--text-muted);
		font-family: 'IBM Plex Mono', monospace;
	}

	.stale-warning {
		display: flex;
		align-items: center;
		color: #f59e0b;
		cursor: help;
	}

	.refresh-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px;
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.15s ease;
	}

	.refresh-btn:hover:not(:disabled) {
		color: var(--accent-primary);
		background: var(--accent-primary-muted);
	}

	.refresh-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.refresh-icon {
		flex-shrink: 0;
	}

	.refresh-icon.spinning {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Stale variant border */
	[data-variant='stale'] {
		border-color: #f59e0b;
	}

	/* Error variant */
	[data-variant='error'] {
		border-color: #ef4444;
	}

	[data-variant='error'] .status-label {
		color: #ef4444;
	}
</style>
