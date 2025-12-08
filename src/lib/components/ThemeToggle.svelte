<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';
</script>

<button
	class="theme-toggle"
	onclick={() => themeStore.toggle()}
	aria-label={themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
	title={themeStore.isDark ? 'Switch to light mode' : 'Switch to dark mode'}
>
	<div class="toggle-track" class:light={!themeStore.isDark}>
		<div class="toggle-thumb">
			{#if themeStore.isDark}
				<!-- Moon icon -->
				<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
					/>
				</svg>
			{:else}
				<!-- Sun icon -->
				<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
					<path
						d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"
					/>
				</svg>
			{/if}
		</div>
	</div>
</button>

<style>
	.theme-toggle {
		background: transparent;
		border: none;
		cursor: pointer;
		padding: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.toggle-track {
		width: 48px;
		height: 26px;
		background: var(--toggle-track-bg, #1e2028);
		border: 1px solid var(--toggle-track-border, #2e3038);
		border-radius: 13px;
		position: relative;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.toggle-track.light {
		background: var(--toggle-track-bg-light, #e5e7eb);
		border-color: var(--toggle-track-border-light, #d1d5db);
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 20px;
		height: 20px;
		background: var(--toggle-thumb-bg, #00d4aa);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--toggle-thumb-color, #0a0b0d);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.toggle-track.light .toggle-thumb {
		left: calc(100% - 22px);
		background: var(--toggle-thumb-bg-light, #f59e0b);
		color: var(--toggle-thumb-color-light, #fff);
	}

	.theme-toggle:hover .toggle-track {
		border-color: var(--toggle-track-hover, #3e4048);
	}

	.theme-toggle:hover .toggle-track.light {
		border-color: var(--toggle-track-hover-light, #9ca3af);
	}

	.theme-toggle:focus-visible {
		outline: 2px solid var(--focus-ring, #00d4aa);
		outline-offset: 2px;
		border-radius: 4px;
	}
</style>
