<script lang="ts">
	interface Props {
		value: number;
		onChange: (size: number) => void;
	}

	const { value, onChange }: Props = $props();

	const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

	function handleChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		onChange(parseInt(select.value, 10));
	}
</script>

<div class="page-size-selector">
	<label for="page-size">Rows per page:</label>
	<select id="page-size" {value} onchange={handleChange}>
		{#each PAGE_SIZE_OPTIONS as option (option)}
			<option value={option}>{option}</option>
		{/each}
	</select>
</div>

<style>
	.page-size-selector {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	label {
		font-size: 12px;
		color: var(--text-muted);
	}

	select {
		padding: 6px 24px 6px 10px;
		font-family: 'IBM Plex Mono', monospace;
		font-size: 12px;
		font-weight: 500;
		color: var(--text-secondary);
		background: var(--bg-tertiary);
		border: 1px solid var(--border-secondary);
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 8px center;
		transition: all 0.15s ease;
	}

	select:hover {
		border-color: var(--border-hover);
		color: var(--text-primary);
	}

	select:focus {
		outline: none;
		border-color: var(--accent-primary);
	}
</style>
