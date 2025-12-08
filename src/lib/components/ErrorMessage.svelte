<script lang="ts">
	import type { DataError } from '$lib/db/types';

	interface Props {
		error: DataError;
		onRetry?: () => void;
	}

	let { error, onRetry }: Props = $props();

	const errorIcons: Record<DataError['type'], string> = {
		network: '🌐',
		parse: '📄',
		memory: '💾',
		query: '🔍'
	};

	const errorTitles: Record<DataError['type'], string> = {
		network: 'Network Error',
		parse: 'Data Error',
		memory: 'Memory Error',
		query: 'Query Error'
	};
</script>

<div class="error-container">
	<div class="error-icon">{errorIcons[error.type]}</div>
	<div class="error-content">
		<h3 class="error-title">{errorTitles[error.type]}</h3>
		<p class="error-message">{error.message}</p>
		{#if error.details}
			<p class="error-details">{error.details}</p>
		{/if}
	</div>
	{#if onRetry}
		<button class="retry-button" onclick={onRetry}>
			Retry
		</button>
	{/if}
</div>

<style>
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		padding: 32px;
		background: var(--accent-danger-bg);
		border: 1px solid var(--accent-danger);
		border-radius: 4px;
		text-align: center;
	}

	.error-icon {
		font-size: 32px;
	}

	.error-content {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.error-title {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		color: var(--accent-danger);
	}

	.error-message {
		margin: 0;
		font-size: 14px;
		color: var(--text-primary);
	}

	.error-details {
		margin: 0;
		font-size: 12px;
		font-family: 'IBM Plex Mono', monospace;
		color: var(--text-muted);
		word-break: break-all;
	}

	.retry-button {
		padding: 8px 16px;
		background: var(--accent-primary);
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: background 0.2s ease;
	}

	.retry-button:hover {
		background: var(--accent-primary-hover);
	}

	.retry-button:focus {
		outline: 2px solid var(--focus-ring);
		outline-offset: 2px;
	}
</style>
