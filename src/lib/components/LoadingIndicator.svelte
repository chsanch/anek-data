<script lang="ts">
	interface Props {
		message?: string;
	}

	let { message = 'Loading data...' }: Props = $props();
</script>

<div class="loading-container">
	<div class="spinner"></div>
	<span class="loading-message">{message}</span>
</div>

<style>
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		padding: 48px;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid var(--border-primary);
		border-top-color: var(--accent-primary);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.loading-message {
		font-size: 14px;
		color: var(--text-muted);
	}
</style>
