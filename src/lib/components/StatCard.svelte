<script lang="ts">
	interface Props {
		label: string;
		value: string;
		prefix?: string;
		suffix?: string;
		variant?: 'default' | 'primary' | 'highlight' | 'rate';
	}

	let { label, value, prefix, suffix, variant = 'default' }: Props = $props();
</script>

<div class="stat-card" class:primary={variant === 'primary'} class:highlight={variant === 'highlight'} class:rate={variant === 'rate'}>
	<span class="stat-label">{label}</span>
	<div class="stat-value-container">
		{#if prefix}
			<span class="stat-prefix">{prefix}</span>
		{/if}
		<span class="stat-value">{value}</span>
		{#if suffix}
			<span class="stat-suffix">{suffix}</span>
		{/if}
	</div>
</div>

<style>
	.stat-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		transition: all 0.3s ease;
	}

	.stat-card:hover {
		border-color: var(--border-secondary);
	}

	.stat-card.primary {
		border-color: var(--accent-primary);
		background: var(--gradient-primary-subtle);
	}

	.stat-card.highlight {
		border-color: var(--accent-warning);
		background: var(--gradient-warning-subtle);
	}

	.stat-card.rate {
		border-color: var(--accent-purple);
		background: var(--gradient-purple-subtle);
	}

	.stat-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.stat-value-container {
		display: flex;
		align-items: baseline;
		gap: 6px;
	}

	.stat-value {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 24px;
		font-weight: 600;
		color: var(--text-white);
		line-height: 1;
	}

	.stat-prefix {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 11px;
		font-weight: 500;
		color: var(--text-muted);
	}

	.stat-suffix {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 12px;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.stat-card.primary .stat-value {
		color: var(--accent-primary);
	}

	.stat-card.highlight .stat-value {
		color: var(--accent-warning);
	}

	.stat-card.rate .stat-value {
		color: var(--accent-purple);
	}
</style>
