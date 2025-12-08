<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		fallback?: Snippet<[{ error: unknown; reset: () => void }]>;
		onError?: (error: unknown) => void;
	}

	let { children, fallback, onError }: Props = $props();

	function handleError(error: unknown, reset: () => void) {
		console.error('ErrorBoundary caught error:', error);
		onError?.(error);
	}

	function getErrorMessage(error: unknown): string {
		if (error instanceof Error) {
			return error.message;
		}
		return String(error);
	}
</script>

<svelte:boundary onerror={handleError}>
	{@render children()}

	{#snippet failed(error, reset)}
		{#if fallback}
			{@render fallback({ error, reset })}
		{:else}
			<div class="error-boundary-fallback">
				<div class="error-icon">!</div>
				<div class="error-content">
					<h3 class="error-title">Something went wrong</h3>
					<p class="error-message">{getErrorMessage(error)}</p>
				</div>
				<button class="retry-button" onclick={reset}> Try again </button>
			</div>
		{/if}
	{/snippet}
</svelte:boundary>

<style>
	.error-boundary-fallback {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		padding: 32px;
		background: var(--bg-secondary);
		border: 1px solid var(--accent-danger);
		border-radius: 4px;
		text-align: center;
	}

	.error-icon {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--accent-danger-bg);
		color: var(--accent-danger);
		font-size: 24px;
		font-weight: 700;
		border-radius: 50%;
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
		color: var(--text-primary);
	}

	.error-message {
		margin: 0;
		font-size: 13px;
		font-family: 'IBM Plex Mono', monospace;
		color: var(--text-muted);
		max-width: 400px;
		word-break: break-word;
	}

	.retry-button {
		padding: 8px 16px;
		background: var(--accent-primary);
		color: var(--bg-primary);
		border: none;
		border-radius: 4px;
		font-size: 13px;
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
