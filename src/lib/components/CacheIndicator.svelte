<script lang="ts">
	import type { CacheStatus } from '$lib/db/cache-types';

	interface Props {
		status: CacheStatus;
		onRefresh?: () => void;
		refreshing?: boolean;
	}

	let { status, onRefresh, refreshing = false }: Props = $props();

	// Smart timestamp formatting - shows relative or absolute based on age
	let formattedTimestamp = $derived.by(() => {
		if (!status.timestamp) return null;

		const date = new Date(status.timestamp);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);

		// Within last hour: show "X min ago"
		if (diffMins < 60) {
			return diffMins <= 1 ? 'just now' : `${diffMins}m ago`;
		}

		// Within last 24 hours: show "X hours ago"
		if (diffHours < 24) {
			return `${diffHours}h ago`;
		}

		// Older: show "Dec 26, 10:30"
		const month = date.toLocaleDateString('en-US', { month: 'short' });
		const day = date.getDate();
		const time = date.toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: false
		});

		// If same year, omit year
		if (date.getFullYear() === now.getFullYear()) {
			return `${month} ${day}, ${time}`;
		}

		return `${month} ${day} '${String(date.getFullYear()).slice(-2)}, ${time}`;
	});

	// Determine the display label based on cache state
	let statusLabel = $derived.by(() => {
		switch (status.state) {
			case 'checking':
				return 'Checking';
			case 'loading':
				return 'Syncing';
			case 'error':
				return 'Error';
			case 'ready':
				if (status.source === 'cache') {
					return status.isStale ? 'Stale' : 'Cached';
				}
				return 'Synced';
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
	<div class="status-badge">
		<span class="status-dot"></span>
		<span class="status-label">{statusLabel}</span>
	</div>

	{#if formattedTimestamp && status.state === 'ready'}
		<div class="timestamp-group">
			<span class="timestamp-divider"></span>
			<span class="timestamp">{formattedTimestamp}</span>
		</div>
	{/if}

	{#if status.isStale}
		<span class="stale-icon" title="Data may be outdated">
			<svg
				width="12"
				height="12"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
			>
				<path d="M12 9v4M12 17h.01" />
				<path
					d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
				/>
			</svg>
		</span>
	{/if}

	{#if onRefresh}
		<button
			class="refresh-btn"
			onclick={onRefresh}
			disabled={isLoading}
			aria-label="Refresh data"
			title="Refresh data from server"
		>
			<svg
				class="refresh-icon"
				class:spinning={isLoading}
				width="13"
				height="13"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
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
		gap: 6px;
		padding: 5px 10px 5px 8px;
		background: var(--bg-tertiary, rgba(255, 255, 255, 0.03));
		border: 1px solid var(--border-primary, rgba(255, 255, 255, 0.08));
		border-radius: 6px;
		font-family: 'IBM Plex Mono', monospace;
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.02em;
		transition: all 0.2s ease;
	}

	.cache-indicator:hover {
		background: var(--bg-tertiary-hover, rgba(255, 255, 255, 0.05));
		border-color: var(--border-secondary, rgba(255, 255, 255, 0.12));
	}

	.status-badge {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.status-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: currentColor;
		opacity: 0.6;
		transition: all 0.2s ease;
	}

	.status-label {
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted, rgba(255, 255, 255, 0.7));
	}

	/* Timestamp styling */
	.timestamp-group {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.timestamp-divider {
		width: 1px;
		height: 12px;
		background: var(--border-primary, rgba(255, 255, 255, 0.15));
	}

	.timestamp {
		color: var(--text-secondary, rgba(255, 255, 255, 0.45));
		font-variant-numeric: tabular-nums;
	}

	/* Stale warning */
	.stale-icon {
		display: flex;
		align-items: center;
		color: #f59e0b;
		animation: pulse-warning 2s ease-in-out infinite;
	}

	@keyframes pulse-warning {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	/* Refresh button */
	.refresh-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		margin-left: 2px;
		background: transparent;
		border: 1px solid transparent;
		color: var(--text-muted, rgba(255, 255, 255, 0.4));
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.15s ease;
	}

	.refresh-btn:hover:not(:disabled) {
		color: var(--text-primary, rgba(255, 255, 255, 0.9));
		background: var(--bg-tertiary-hover, rgba(255, 255, 255, 0.08));
		border-color: var(--border-primary, rgba(255, 255, 255, 0.1));
	}

	.refresh-btn:active:not(:disabled) {
		transform: scale(0.95);
	}

	.refresh-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.refresh-icon.spinning {
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* === VARIANT STATES === */

	/* Idle - muted, waiting */
	[data-variant='idle'] {
		border-color: var(--border-primary, rgba(255, 255, 255, 0.06));
	}
	[data-variant='idle'] .status-dot {
		background: var(--text-muted, rgba(255, 255, 255, 0.3));
	}

	/* Loading - amber pulse */
	[data-variant='loading'] {
		border-color: rgba(251, 191, 36, 0.2);
		background: rgba(251, 191, 36, 0.05);
	}
	[data-variant='loading'] .status-dot {
		background: #fbbf24;
		animation: pulse-dot 1s ease-in-out infinite;
	}
	[data-variant='loading'] .status-label {
		color: #fbbf24;
	}

	@keyframes pulse-dot {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.5;
			transform: scale(0.8);
		}
	}

	/* Cached - cyan accent (from local storage) */
	[data-variant='cache'] {
		border-color: rgba(34, 211, 238, 0.15);
	}
	[data-variant='cache'] .status-dot {
		background: #22d3ee;
		box-shadow: 0 0 6px rgba(34, 211, 238, 0.4);
	}
	[data-variant='cache'] .status-label {
		color: #22d3ee;
	}

	/* Network/Synced - green (fresh from server) */
	[data-variant='network'] {
		border-color: rgba(34, 197, 94, 0.15);
	}
	[data-variant='network'] .status-dot {
		background: #22c55e;
		box-shadow: 0 0 6px rgba(34, 197, 94, 0.4);
	}
	[data-variant='network'] .status-label {
		color: #22c55e;
	}

	/* Stale - orange warning */
	[data-variant='stale'] {
		border-color: rgba(245, 158, 11, 0.25);
		background: rgba(245, 158, 11, 0.05);
	}
	[data-variant='stale'] .status-dot {
		background: #f59e0b;
	}
	[data-variant='stale'] .status-label {
		color: #f59e0b;
	}

	/* Error - red alert */
	[data-variant='error'] {
		border-color: rgba(239, 68, 68, 0.25);
		background: rgba(239, 68, 68, 0.05);
	}
	[data-variant='error'] .status-dot {
		background: #ef4444;
		animation: pulse-dot 0.6s ease-in-out infinite;
	}
	[data-variant='error'] .status-label {
		color: #ef4444;
	}
</style>
