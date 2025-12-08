<script lang="ts">
	interface Props {
		width?: string;
		height?: string;
		variant?: 'text' | 'rect' | 'circle';
		class?: string;
	}

	let {
		width = '100%',
		height = '1rem',
		variant = 'text',
		class: className = ''
	}: Props = $props();
</script>

<div
	class="skeleton {variant} {className}"
	style="width: {width}; height: {height};"
	aria-hidden="true"
></div>

<style>
	.skeleton {
		background: linear-gradient(
			90deg,
			var(--bg-tertiary) 25%,
			var(--border-secondary) 50%,
			var(--bg-tertiary) 75%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}

	.text {
		border-radius: 4px;
	}

	.rect {
		border-radius: 4px;
	}

	.circle {
		border-radius: 50%;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
