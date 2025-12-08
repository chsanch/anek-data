<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import DataProvider from '$lib/components/DataProvider.svelte';

	let { children } = $props();
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
