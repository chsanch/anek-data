<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import DataProvider from '$lib/components/DataProvider.svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import { page } from '$app/state';
	import type { Pathname } from '$app/types';

	let { children } = $props();

	// Navigation items
	const navItems: { href: Pathname; label: string }[] = [
		{ href: '/', label: 'Dashboard' },
		{ href: '/orders', label: 'Orders' },
		{ href: '/chains', label: 'Chains' },
		{ href: '/analytics', label: 'Analytics' }
	];

	// Check if a nav item is active
	function isActive(href: Pathname): boolean {
		if (href === '/') {
			return page.url.pathname === '/';
		}
		return page.url.pathname.startsWith(href);
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<DataProvider>
	<div class="app-layout">
		<AppHeader {navItems} {isActive} />
		<main class="main-content">
			{@render children()}
		</main>
	</div>
</DataProvider>

<style>
	.app-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.main-content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
</style>
