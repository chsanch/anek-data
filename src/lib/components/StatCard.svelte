<script lang="ts">
	import Sparkline from './Sparkline.svelte';

	interface Props {
		label: string;
		value: string;
		prefix?: string;
		suffix?: string;
		variant?: 'default' | 'primary' | 'highlight' | 'rate' | 'success' | 'warning';
		sparklineData?: number[];
	}

	let { label, value, prefix, suffix, variant = 'default', sparklineData }: Props = $props();

	// Get sparkline stroke color based on variant
	function getSparklineColor(): string {
		switch (variant) {
			case 'primary':
				return 'var(--accent-primary)';
			case 'highlight':
			case 'warning':
				return 'var(--accent-warning)';
			case 'rate':
				return 'var(--accent-purple)';
			case 'success':
				return 'var(--accent-success)';
			default:
				return 'var(--accent-primary)';
		}
	}

	// Get sparkline fill color based on variant (for gradient)
	function getSparklineFillColor(): string {
		switch (variant) {
			case 'primary':
				return 'var(--accent-primary-muted)';
			case 'highlight':
			case 'warning':
				return 'var(--accent-warning-muted)';
			case 'rate':
				return 'var(--accent-purple-muted)';
			case 'success':
				return 'var(--accent-success-muted)';
			default:
				return 'var(--accent-primary-muted)';
		}
	}
</script>

<div
	class="stat-card"
	class:primary={variant === 'primary'}
	class:highlight={variant === 'highlight'}
	class:rate={variant === 'rate'}
	class:success={variant === 'success'}
	class:warning={variant === 'warning'}
	class:has-sparkline={sparklineData && sparklineData.length >= 2}
>
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
	{#if sparklineData && sparklineData.length >= 2}
		<div class="sparkline-container">
			<Sparkline
				data={sparklineData}
				width={100}
				height={20}
				strokeColor={getSparklineColor()}
				fillColor={getSparklineFillColor()}
			/>
		</div>
	{/if}
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

	.stat-card.success {
		border-color: var(--accent-success);
		background: var(--gradient-success-subtle);
	}

	.stat-card.success .stat-value {
		color: var(--accent-success);
	}

	.stat-card.warning {
		border-color: var(--accent-warning);
		background: var(--gradient-warning-subtle);
	}

	.stat-card.warning .stat-value {
		color: var(--accent-warning);
	}

	.sparkline-container {
		margin-top: 4px;
	}

	.stat-card.has-sparkline {
		gap: 4px;
	}
</style>
