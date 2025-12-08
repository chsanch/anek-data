<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import DataProvider from '$lib/components/DataProvider.svelte';

	let { children } = $props();

	// Initialize theme on mount
	onMount(() => {
		if (browser) {
			const stored = localStorage.getItem('theme');
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			const theme = stored || (prefersDark ? 'dark' : 'light');
			document.documentElement.setAttribute('data-theme', theme);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- Prevent flash of wrong theme -->
	{@html `<script>
		(function() {
			const stored = localStorage.getItem('theme');
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			const theme = stored || (prefersDark ? 'dark' : 'light');
			document.documentElement.setAttribute('data-theme', theme);
		})();
	</script>`}
</svelte:head>

<DataProvider>
	{@render children()}
</DataProvider>
