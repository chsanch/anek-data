<script lang="ts">
	interface Props {
		onclick: () => void;
		loading?: boolean;
		disabled?: boolean;
	}

	let { onclick, loading = false, disabled = false }: Props = $props();
</script>

<button
	class="refresh-button"
	class:loading
	{onclick}
	disabled={disabled || loading}
	aria-label={loading ? 'Refreshing data...' : 'Refresh data'}
>
	<svg
		class="refresh-icon"
		class:spinning={loading}
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
	>
		<path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
		<path d="M21 3v5h-5" />
	</svg>
	<span class="button-text">{loading ? 'Refreshing...' : 'Refresh'}</span>
</button>

<style>
	.refresh-button {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		border-radius: 4px;
		color: var(--text-primary);
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.refresh-button:hover:not(:disabled) {
		border-color: var(--accent-primary);
		color: var(--accent-primary);
	}

	.refresh-button:focus {
		outline: 2px solid var(--focus-ring);
		outline-offset: 2px;
	}

	.refresh-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.refresh-button.loading {
		color: var(--text-muted);
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

	.button-text {
		white-space: nowrap;
	}
</style>
