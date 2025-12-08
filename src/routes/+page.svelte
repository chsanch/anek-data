<script lang="ts">
	import StatCard from '$lib/components/StatCard.svelte';
	import OrdersTable from '$lib/components/OrdersTable.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import RefreshButton from '$lib/components/RefreshButton.svelte';
	import LoadingIndicator from '$lib/components/LoadingIndicator.svelte';
	import ErrorMessage from '$lib/components/ErrorMessage.svelte';
	import ErrorBoundary from '$lib/components/ErrorBoundary.svelte';
	import { formatCompact } from '$lib/utils/format';
	import { debounce, QueryCache } from '$lib/utils/debounce';
	import { getDataContext } from '$lib/db/context';
	import {
		getPaginatedOrders,
		getTotalOrderCount,
		getDashboardStats,
		getVolumeByCurrency,
		type DashboardStats,
		type VolumeByCurrency
	} from '$lib/db/queries';
	import type { UnifiedOrder } from '$lib/types/orders';

	// Query cache for stats (30 second TTL)
	const statsCache = new QueryCache<DashboardStats>(30000);
	const volumeCache = new QueryCache<VolumeByCurrency[]>(30000);

	// Get data context from DataProvider
	const dataContext = getDataContext();

	// Pagination state
	const PAGE_SIZE = 20;
	let currentPage = $state(1);

	// Orders state
	let orders: UnifiedOrder[] = $state([]);
	let totalOrders = $state(0);
	let ordersLoading = $state(false);

	// Stats state
	let stats: DashboardStats = $state({
		totalTrades: 0,
		totalVolume: 0,
		activeCurrencies: 0,
		openOrders: 0,
		avgRate: 0,
		totalChains: 0
	});
	let statsLoading = $state(false);

	// Volume by currency state
	let volumeByCurrency: VolumeByCurrency[] = $state([]);
	let volumeLoading = $state(false);

	// Load data when initialized
	$effect(() => {
		if (dataContext.state.initialized && dataContext.db) {
			loadOrders(currentPage);
			loadStats();
			loadVolumeByCurrency();
		}
	});

	async function loadOrders(page: number) {
		if (!dataContext.db) return;

		ordersLoading = true;
		try {
			const offset = (page - 1) * PAGE_SIZE;
			const [fetchedOrders, count] = await Promise.all([
				getPaginatedOrders(dataContext.db, PAGE_SIZE, offset),
				getTotalOrderCount(dataContext.db)
			]);
			orders = fetchedOrders;
			totalOrders = count;
		} catch (e) {
			console.error('Failed to load orders:', e);
		} finally {
			ordersLoading = false;
		}
	}

	function handlePageChange(page: number) {
		currentPage = page;
		loadOrders(page);
	}

	async function loadStats(useCache = true) {
		if (!dataContext.db) return;

		// Check cache first
		const cacheKey = 'dashboard-stats';
		if (useCache) {
			const cached = statsCache.get(cacheKey);
			if (cached) {
				stats = cached;
				return;
			}
		}

		statsLoading = true;
		try {
			const fetchedStats = await getDashboardStats(dataContext.db);
			stats = fetchedStats;
			statsCache.set(cacheKey, fetchedStats);
		} catch (e) {
			console.error('Failed to load stats:', e);
		} finally {
			statsLoading = false;
		}
	}

	async function loadVolumeByCurrency(useCache = true) {
		if (!dataContext.db) return;

		// Check cache first
		const cacheKey = 'volume-by-currency';
		if (useCache) {
			const cached = volumeCache.get(cacheKey);
			if (cached) {
				volumeByCurrency = cached;
				return;
			}
		}

		volumeLoading = true;
		try {
			const fetchedVolume = await getVolumeByCurrency(dataContext.db, 5);
			volumeByCurrency = fetchedVolume;
			volumeCache.set(cacheKey, fetchedVolume);
		} catch (e) {
			console.error('Failed to load volume by currency:', e);
		} finally {
			volumeLoading = false;
		}
	}

	async function handleRefresh() {
		// Invalidate caches on refresh
		statsCache.invalidate();
		volumeCache.invalidate();

		await dataContext.refresh();
		// Reset to first page on refresh and reload all data (bypassing cache)
		currentPage = 1;
		loadStats(false);
		loadVolumeByCurrency(false);
	}

	// Calculate max volume for bar chart scaling
	let maxVolume = $derived(
		volumeByCurrency.length > 0 ? Math.max(...volumeByCurrency.map((v) => v.volume)) : 1
	);

</script>

<svelte:head>
	<title>ANEK FX Analytics</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="dashboard">
	<!-- Header -->
	<header class="header">
		<div class="header-left">
			<div class="logo">
				<span class="logo-mark">A</span>
				<span class="logo-text">ANEK</span>
			</div>
			<nav class="nav">
				<a href="/" class="nav-link active">Dashboard</a>
				<a href="/orders" class="nav-link">Orders</a>
				<a href="/chains" class="nav-link">Chains</a>
				<a href="/analytics" class="nav-link">Analytics</a>
			</nav>
		</div>
		<div class="header-right">
			<div class="sync-status">
				<span class="sync-dot"></span>
				<span class="sync-text">Live</span>
			</div>
			<time class="timestamp">{new Date().toLocaleString('en-GB', { hour12: false })}</time>
			<ThemeToggle />
		</div>
	</header>

	<!-- Main Content -->
	<main class="main">
		<!-- Stats Row -->
		<section class="stats-grid">
			<StatCard label="Total Trades" value={stats.totalTrades.toLocaleString()} variant="primary" />
			<StatCard
				label="Total Volume"
				value={formatCompact(stats.totalVolume)}
				suffix="EUR"
				variant="default"
			/>
			<StatCard label="Open Orders" value={stats.openOrders.toLocaleString()} variant="highlight" />
			<StatCard
				label="Active Chains"
				value={stats.totalChains.toLocaleString()}
				variant="default"
			/>
			<StatCard
				label="Avg. Rate"
				value={stats.avgRate.toFixed(4)}
				prefix="EUR/USD"
				variant="rate"
			/>
			<StatCard
				label="Currencies"
				value={stats.activeCurrencies.toString()}
				variant="default"
			/>
		</section>

		<!-- Volume by Currency -->
		<section class="volume-section">
			<h2 class="section-title">Volume by Currency</h2>
			{#if volumeLoading}
				<div class="volume-loading">
					<LoadingIndicator message="Loading volume data..." />
				</div>
			{:else if volumeByCurrency.length === 0}
				<div class="volume-empty">No volume data available</div>
			{:else}
				<div class="currency-grid">
					{#each volumeByCurrency as { currency, volume, orderCount } (currency)}
						<div class="currency-card">
							<div class="currency-header">
								<span class="currency-code">{currency}</span>
								<span class="currency-orders">{orderCount.toLocaleString()} orders</span>
							</div>
							<div class="currency-volume">{formatCompact(volume)}</div>
							<div class="currency-bar">
								<div
									class="currency-bar-fill"
									style="width: {(volume / maxVolume) * 100}%"
								></div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Orders Table -->
		<section class="orders-section">
			<div class="section-header">
				<h2 class="section-title">Unified Orders</h2>
				<div class="section-actions">
					<RefreshButton
						onclick={handleRefresh}
						loading={dataContext.state.loading}
					/>
					<button class="btn-filter">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
						</svg>
						Filter
					</button>
					<button class="btn-export">Export</button>
				</div>
			</div>
			{#if dataContext.state.loading && !dataContext.state.initialized}
				<div class="orders-loading">
					<LoadingIndicator message="Loading orders from parquet file..." />
				</div>
			{:else if dataContext.state.error}
				<div class="orders-error">
					<ErrorMessage error={dataContext.state.error} onRetry={handleRefresh} />
				</div>
			{:else}
				<OrdersTable
					orders={orders}
					loading={ordersLoading}
					totalCount={totalOrders}
					pageSize={PAGE_SIZE}
					currentPage={currentPage}
					onPageChange={handlePageChange}
				/>
			{/if}
		</section>
	</main>
</div>

<style>
	.dashboard {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	/* Header */
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
		transition: background 0.3s ease, border-color 0.3s ease;
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

	.sync-status {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.sync-dot {
		width: 6px;
		height: 6px;
		background: var(--accent-primary);
		border-radius: 50%;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.4; }
	}

	.sync-text {
		font-size: 12px;
		font-weight: 500;
		color: var(--accent-primary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.timestamp {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 12px;
		color: var(--text-muted);
	}

	/* Main */
	.main {
		flex: 1;
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: 12px;
	}

	@media (max-width: 1200px) {
		.stats-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 768px) {
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	/* Volume Section */
	.volume-section {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		padding: 20px;
		transition: background 0.3s ease, border-color 0.3s ease;
	}

	.section-title {
		font-size: 13px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		margin: 0 0 16px 0;
	}

	.currency-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: 12px;
	}

	@media (max-width: 1200px) {
		.currency-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	@media (max-width: 768px) {
		.currency-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	.currency-card {
		background: var(--bg-tertiary);
		border: 1px solid var(--border-primary);
		padding: 16px;
		transition: all 0.15s ease;
	}

	.currency-card:hover {
		border-color: var(--border-secondary);
	}

	.currency-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.currency-code {
		font-family: 'IBM Plex Mono', monospace;
		font-weight: 600;
		font-size: 14px;
		color: var(--text-white);
	}

	.currency-orders {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 11px;
		font-weight: 500;
		color: var(--text-muted);
	}

	.volume-loading,
	.volume-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 32px;
		color: var(--text-muted);
		font-size: 14px;
	}

	.currency-volume {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 20px;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 12px;
	}

	.currency-bar {
		height: 3px;
		background: var(--border-primary);
		overflow: hidden;
	}

	.currency-bar-fill {
		height: 100%;
		background: var(--gradient-bar);
		transition: width 0.3s ease;
	}

	/* Orders Section */
	.orders-section {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		flex: 1;
		display: flex;
		flex-direction: column;
		transition: background 0.3s ease, border-color 0.3s ease;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		border-bottom: 1px solid var(--border-primary);
	}

	.section-header .section-title {
		margin: 0;
	}

	.section-actions {
		display: flex;
		gap: 8px;
	}

	.btn-filter,
	.btn-export {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		font-size: 12px;
		font-weight: 500;
		border: 1px solid var(--border-secondary);
		background: transparent;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-filter:hover,
	.btn-export:hover {
		border-color: var(--border-hover);
		color: var(--text-primary);
	}

	.btn-export {
		background: var(--accent-primary);
		border-color: var(--accent-primary);
		color: var(--bg-primary);
	}

	.btn-export:hover {
		background: var(--accent-primary-hover);
		border-color: var(--accent-primary-hover);
		color: var(--bg-primary);
	}

	.orders-loading,
	.orders-error {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 48px 24px;
	}
</style>
