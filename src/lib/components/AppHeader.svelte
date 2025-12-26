<script lang="ts">
	import ThemeToggle from './ThemeToggle.svelte';
	import CacheIndicator from './CacheIndicator.svelte';
	import { getDataContext } from '$lib/db/context';
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';

	interface NavItem {
		href: Pathname;
		label: string;
	}

	interface Props {
		navItems: NavItem[];
		isActive: (href: Pathname) => boolean;
	}

	let { navItems, isActive }: Props = $props();

	const dataContext = getDataContext();
</script>

<header class="header">
	<div class="header-left">
		<a href={resolve('/')} class="logo">
			<span class="logo-mark">A</span>
			<span class="logo-text">ANEK</span>
		</a>
		<nav class="nav">
			{#each navItems as item (item.href)}
				<a href={resolve(item.href)} class="nav-link" class:active={isActive(item.href)}>
					{item.label}
				</a>
			{/each}
		</nav>
	</div>
	<div class="header-right">
		<CacheIndicator
			status={dataContext.cacheStatus}
			onRefresh={dataContext.forceRefresh}
			refreshing={dataContext.state.loading}
		/>
		<time class="timestamp">{new Date().toLocaleString('en-GB', { hour12: false })}</time>
		<ThemeToggle />
	</div>
</header>

<style>
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 24px;
		height: 56px;
		background: var(--bg-elevated);
		border-bottom: 1px solid var(--border-primary);
		position: sticky;
		top: 0;
		z-index: 100;
		transition:
			background 0.3s ease,
			border-color 0.3s ease;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 32px;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: 8px;
		text-decoration: none;
	}

	.logo-mark {
		width: 28px;
		height: 28px;
		background: var(--gradient-primary);
		color: var(--bg-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'IBM Plex Mono', monospace;
		font-weight: 600;
		font-size: 14px;
	}

	.logo-text {
		font-family: 'IBM Plex Mono', monospace;
		font-weight: 600;
		font-size: 16px;
		letter-spacing: 0.1em;
		color: var(--text-white);
	}

	.nav {
		display: flex;
		gap: 4px;
	}

	.nav-link {
		padding: 8px 16px;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-muted);
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.nav-link:hover {
		color: var(--text-primary);
	}

	.nav-link.active {
		color: var(--accent-primary);
		background: var(--accent-primary-muted);
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 20px;
	}

	.timestamp {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 12px;
		color: var(--text-muted);
	}
</style>
