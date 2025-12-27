<script lang="ts">
	interface Props {
		data: number[];
		width?: number;
		height?: number;
		strokeColor?: string;
		strokeWidth?: number;
		fillColor?: string;
	}

	let {
		data,
		width = 80,
		height = 24,
		strokeColor = 'var(--accent-primary)',
		strokeWidth = 1.5,
		fillColor = 'var(--accent-primary-muted)'
	}: Props = $props();

	// Generate unique ID per instance to avoid gradient ID collisions in the DOM
	const instanceId = Math.random().toString(36).slice(2, 9);
	const gradientId = `sparkline-gradient-${instanceId}`;

	// Calculate SVG path from data points
	let pathData = $derived.by(() => {
		if (data.length < 2) return { line: '', area: '' };

		const min = Math.min(...data);
		const max = Math.max(...data);
		const range = max - min || 1; // Avoid division by zero

		const padding = 2;
		const chartWidth = width - padding * 2;
		const chartHeight = height - padding * 2;

		const points = data.map((value, index) => {
			const x = padding + (index / (data.length - 1)) * chartWidth;
			const y = padding + chartHeight - ((value - min) / range) * chartHeight;
			return { x, y };
		});

		// Create line path
		const line = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

		// Create area path (for gradient fill)
		const area =
			line +
			` L ${points[points.length - 1].x} ${height - padding}` +
			` L ${padding} ${height - padding}` +
			` Z`;

		return { line, area };
	});

	// Determine trend direction for color hints
	let trend = $derived.by(() => {
		if (data.length < 2) return 'neutral';
		const first = data[0];
		const last = data[data.length - 1];
		if (last > first * 1.01) return 'up';
		if (last < first * 0.99) return 'down';
		return 'neutral';
	});
</script>

{#if data.length >= 2}
	<svg
		{width}
		{height}
		viewBox="0 0 {width} {height}"
		class="sparkline"
		class:trend-up={trend === 'up'}
		class:trend-down={trend === 'down'}
	>
		<!-- Gradient fill under the line -->
		<defs>
			<linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
				<stop offset="0%" style="stop-color: {fillColor}; stop-opacity: 0.4" />
				<stop offset="100%" style="stop-color: {fillColor}; stop-opacity: 0" />
			</linearGradient>
		</defs>

		<!-- Area fill -->
		<path d={pathData.area} fill="url(#{gradientId})" />

		<!-- Line -->
		<path d={pathData.line} fill="none" stroke={strokeColor} stroke-width={strokeWidth} stroke-linecap="round" stroke-linejoin="round" />
	</svg>
{:else}
	<svg {width} {height} class="sparkline empty">
		<line x1="4" y1={height / 2} x2={width - 4} y2={height / 2} stroke="var(--border-primary)" stroke-width="1" stroke-dasharray="2,2" />
	</svg>
{/if}

<style>
	.sparkline {
		display: block;
		flex-shrink: 0;
	}

	.sparkline.empty {
		opacity: 0.5;
	}
</style>
