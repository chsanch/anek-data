<script lang="ts">
	interface Props {
		title?: string;
		message?: string;
		icon?: 'data' | 'search' | 'error';
		action?: {
			label: string;
			onclick: () => void;
		};
	}

	let {
		title = 'No data found',
		message = 'There is no data to display at this time.',
		icon = 'data',
		action
	}: Props = $props();

	const icons = {
		data: 'M3 3h18v18H3zM8 7v10M12 7v10M16 7v10',
		search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
		error:
			'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
	};
</script>

<div class="empty-state">
	<div class="empty-icon">
		<svg
			width="48"
			height="48"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="1.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d={icons[icon]} />
		</svg>
	</div>
	<h3 class="empty-title">{title}</h3>
	<p class="empty-message">{message}</p>
	{#if action}
		<button class="empty-action" onclick={action.onclick}>
			{action.label}
		</button>
	{/if}
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		padding: 48px 24px;
		text-align: center;
	}

	.empty-icon {
		color: var(--text-muted);
		opacity: 0.5;
	}

	.empty-title {
		margin: 0;
		font-size: 16px;
		font-weight: 600;
		color: var(--text-primary);
	}

	.empty-message {
		margin: 0;
		font-size: 14px;
		color: var(--text-muted);
		max-width: 300px;
	}

	.empty-action {
		margin-top: 8px;
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

	.empty-action:hover {
		background: var(--accent-primary-hover);
	}

	.empty-action:focus {
		outline: 2px solid var(--focus-ring);
		outline-offset: 2px;
	}
</style>
