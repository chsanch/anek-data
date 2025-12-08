<script lang="ts">
	interface Props {
		label: string;
		value: string;
		options: string[];
		onChange: (value: string) => void;
	}

	let { label, value, options, onChange }: Props = $props();

	function handleChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		onChange(select.value);
	}

	// Format display values (e.g., "closed_to_trading" -> "Closed To Trading")
	function formatOption(option: string): string {
		return option
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}
</script>

<div class="filter-dropdown">
	<label class="filter-label" for={`filter-${label}`}>{label}</label>
	<select
		id={`filter-${label}`}
		class="filter-select"
		{value}
		onchange={handleChange}
		aria-label={`Filter by ${label}`}
	>
		<option value="">All</option>
		{#each options as opt (opt)}
			<option value={opt}>{formatOption(opt)}</option>
		{/each}
	</select>
</div>

<style>
	.filter-dropdown {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.filter-label {
		font-size: 10px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.filter-select {
		height: 32px;
		padding: 0 28px 0 10px;
		font-family: 'IBM Plex Mono', monospace;
		font-size: 12px;
		color: var(--text-primary);
		background: var(--bg-tertiary);
		border: 1px solid var(--border-secondary);
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 8px center;
		transition: all 0.15s ease;
	}

	.filter-select:hover {
		border-color: var(--border-hover);
	}

	.filter-select:focus {
		outline: none;
		border-color: var(--accent-primary);
	}
</style>
