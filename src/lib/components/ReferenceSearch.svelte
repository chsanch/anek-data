<script lang="ts">
	import { debounce } from '$lib/utils/debounce';

	interface Props {
		value: string;
		onChange: (value: string) => void;
		placeholder?: string;
		debounceMs?: number;
	}

	let {
		value,
		onChange,
		placeholder = 'Search by reference...',
		debounceMs = 300
	}: Props = $props();

	// Create debounced onChange handler
	const debouncedOnChange = debounce((val: string) => {
		onChange(val);
	}, debounceMs);

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		value = target.value;
		debouncedOnChange(target.value);
	}

	function handleClear() {
		value = '';
		onChange('');
	}
</script>

<div class="reference-search">
	<div class="search-input-wrapper">
		<svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<circle cx="11" cy="11" r="8" />
			<path d="M21 21l-4.35-4.35" />
		</svg>
		<input
			type="text"
			class="search-input"
			{placeholder}
			{value}
			oninput={handleInput}
			aria-label="Search orders by reference"
		/>
		{#if value}
			<button
				type="button"
				class="clear-btn"
				onclick={handleClear}
				aria-label="Clear search"
			>
				<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M18 6L6 18M6 6l12 12" />
				</svg>
			</button>
		{/if}
	</div>
</div>

<style>
	.reference-search {
		display: flex;
		align-items: center;
	}

	.search-input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-icon {
		position: absolute;
		left: 12px;
		color: var(--text-muted);
		pointer-events: none;
	}

	.search-input {
		width: 240px;
		height: 36px;
		padding: 0 36px 0 38px;
		font-family: 'IBM Plex Mono', monospace;
		font-size: 12px;
		color: var(--text-primary);
		background: var(--bg-tertiary);
		border: 1px solid var(--border-secondary);
		transition: all 0.15s ease;
	}

	.search-input::placeholder {
		color: var(--text-muted);
	}

	.search-input:focus {
		outline: none;
		border-color: var(--accent-primary);
		background: var(--bg-elevated);
	}

	.clear-btn {
		position: absolute;
		right: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		padding: 0;
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		transition: color 0.15s ease;
	}

	.clear-btn:hover {
		color: var(--text-primary);
	}
</style>
