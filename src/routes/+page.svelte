<script lang="ts">
	import StatCard from '$lib/components/StatCard.svelte';
	import OrdersTable from '$lib/components/OrdersTable.svelte';
	import RefreshButton from '$lib/components/RefreshButton.svelte';
	import LoadingIndicator from '$lib/components/LoadingIndicator.svelte';
	import ErrorMessage from '$lib/components/ErrorMessage.svelte';
	import ExportModal from '$lib/components/ExportModal.svelte';
	import ReferenceSearch from '$lib/components/ReferenceSearch.svelte';
	import TableToolbar from '$lib/components/TableToolbar.svelte';
	import StatusDistribution from '$lib/components/charts/StatusDistribution.svelte';
	import OrderTypeDistribution from '$lib/components/charts/OrderTypeDistribution.svelte';
	import type { ExportOptions } from '$lib/components/ExportModal.svelte';
	import { formatCompact } from '$lib/utils/format';
	import { QueryCache } from '$lib/utils/debounce';
	import { getDataContext } from '$lib/db/context';
	import {
		getPaginatedOrders,
		getTotalOrderCount,
		getDashboardStats,
		getVolumeByCurrency,
		getFilterOptions,
		getStatusDistribution,
		getOrderTypeDistribution,
		exportOrdersToCsv,
		downloadCsv,
		getExportOrderCount,
		type DashboardStats,
		type VolumeByCurrency,
		type SortConfig,
		type ColumnFilters,
		type FilterOptions,
		type OrderTypeDistribution as OrderTypeDistributionData
	} from '$lib/db/queries';
	import type { UnifiedOrder } from '$lib/types/orders';
	import type { StatusDistribution as StatusDistributionData } from '$lib/types/analytics';

	// Query cache for stats (30 second TTL)
	const statsCache = new QueryCache<DashboardStats>(30000);
	const volumeCache = new QueryCache<VolumeByCurrency[]>(30000);
	const statusCache = new QueryCache<StatusDistributionData[]>(30000);
	const orderTypeCache = new QueryCache<OrderTypeDistributionData[]>(30000);

	// Get data context from DataProvider
	const dataContext = getDataContext();

	// Pagination state
	let pageSize = $state(20);
	let currentPage = $state(1);

	// Sorting state
	let currentSort = $state<SortConfig | undefined>(undefined);

	// Reference search state
	let referenceSearch = $state('');

	// Column filters state
	let columnFilters = $state<ColumnFilters>({});
	let filterOptions = $state<FilterOptions>({
		status: [],
		fxOrderType: [],
		buyCurrency: [],
		sellCurrency: [],
		liquidityProvider: []
	});
	let showFilters = $state(false);

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
		completedOrders: 0,
		closedToTradingOrders: 0,
		completionRate: 0,
		totalChains: 0
	});

	// Volume by currency state
	let volumeByCurrency: VolumeByCurrency[] = $state([]);
	let volumeLoading = $state(false);

	// Status distribution state
	let statusDistribution: StatusDistributionData[] = $state([]);
	let statusLoading = $state(false);
	let statusError: string | null = $state(null);

	// Order type distribution state
	let orderTypeDistribution: OrderTypeDistributionData[] = $state([]);
	let orderTypeLoading = $state(false);
	let orderTypeError: string | null = $state(null);

	// Load data when initialized
	$effect(() => {
		if (dataContext.state.initialized && dataContext.db) {
			loadOrders(currentPage, pageSize, currentSort, referenceSearch, columnFilters);
			loadStats();
			loadVolumeByCurrency();
			loadStatusDistribution();
			loadOrderTypeDistribution();
			loadFilterOptions();
		}
	});

	async function loadOrders(
		page: number,
		size: number,
		sort?: SortConfig,
		search?: string,
		filters?: ColumnFilters
	) {
		if (!dataContext.db) return;

		ordersLoading = true;
		try {
			const offset = (page - 1) * size;
			const [fetchedOrders, count] = await Promise.all([
				getPaginatedOrders(dataContext.db, size, offset, sort, search, filters),
				getTotalOrderCount(dataContext.db, search, filters)
			]);
			orders = fetchedOrders;
			totalOrders = count;
		} catch (e) {
			console.error('Failed to load orders:', e);
		} finally {
			ordersLoading = false;
		}
	}

	async function loadFilterOptions() {
		if (!dataContext.db) return;
		try {
			filterOptions = await getFilterOptions(dataContext.db);
		} catch (e) {
			console.error('Failed to load filter options:', e);
		}
	}

	function handlePageChange(page: number) {
		currentPage = page;
		loadOrders(page, pageSize, currentSort, referenceSearch, columnFilters);
	}

	function handleSortChange(sort: SortConfig | undefined) {
		currentSort = sort;
		currentPage = 1; // Reset to first page when sorting changes
		loadOrders(1, pageSize, sort, referenceSearch, columnFilters);
	}

	function handlePageSizeChange(size: number) {
		pageSize = size;
		currentPage = 1; // Reset to first page when page size changes
		loadOrders(1, size, currentSort, referenceSearch, columnFilters);
	}

	function handleReferenceSearchChange(search: string) {
		referenceSearch = search;
		currentPage = 1; // Reset to first page when search changes
		loadOrders(1, pageSize, currentSort, search, columnFilters);
	}

	function handleColumnFiltersChange(filters: ColumnFilters) {
		columnFilters = filters;
		currentPage = 1; // Reset to first page when filters change
		loadOrders(1, pageSize, currentSort, referenceSearch, filters);
	}

	function toggleFilters() {
		showFilters = !showFilters;
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

		try {
			const fetchedStats = await getDashboardStats(dataContext.db);
			stats = fetchedStats;
			statsCache.set(cacheKey, fetchedStats);
		} catch (e) {
			console.error('Failed to load stats:', e);
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

	async function loadStatusDistribution(useCache = true) {
		if (!dataContext.db) return;

		const cacheKey = 'status-distribution';
		if (useCache) {
			const cached = statusCache.get(cacheKey);
			if (cached) {
				statusDistribution = cached;
				statusError = null;
				return;
			}
		}

		statusLoading = true;
		statusError = null;
		try {
			const fetchedStatus = await getStatusDistribution(dataContext.db);
			statusDistribution = fetchedStatus;
			statusCache.set(cacheKey, fetchedStatus);
		} catch (e) {
			console.error('Failed to load status distribution:', e);
			statusError = e instanceof Error ? e.message : 'Failed to load status distribution';
		} finally {
			statusLoading = false;
		}
	}

	async function loadOrderTypeDistribution(useCache = true) {
		if (!dataContext.db) return;

		const cacheKey = 'order-type-distribution';
		if (useCache) {
			const cached = orderTypeCache.get(cacheKey);
			if (cached) {
				orderTypeDistribution = cached;
				orderTypeError = null;
				return;
			}
		}

		orderTypeLoading = true;
		orderTypeError = null;
		try {
			const fetchedOrderType = await getOrderTypeDistribution(dataContext.db);
			orderTypeDistribution = fetchedOrderType;
			orderTypeCache.set(cacheKey, fetchedOrderType);
		} catch (e) {
			console.error('Failed to load order type distribution:', e);
			orderTypeError = e instanceof Error ? e.message : 'Failed to load order type distribution';
		} finally {
			orderTypeLoading = false;
		}
	}

	async function handleRefresh() {
		// Invalidate caches on refresh
		statsCache.invalidate();
		volumeCache.invalidate();
		statusCache.invalidate();
		orderTypeCache.invalidate();

		await dataContext.refresh();
		// Reset to first page on refresh and reload all data (bypassing cache)
		currentPage = 1;
		loadOrders(1, pageSize, currentSort, referenceSearch, columnFilters);
		loadStats(false);
		loadVolumeByCurrency(false);
		loadStatusDistribution(false);
		loadOrderTypeDistribution(false);
		loadFilterOptions();
	}

	// Calculate max volume for bar chart scaling
	let maxVolume = $derived(
		volumeByCurrency.length > 0 ? Math.max(...volumeByCurrency.map((v) => v.volume)) : 1
	);

	// Count active filters for badge
	let activeFilterCount = $derived(
		Object.values(columnFilters).filter((v) => v && v.trim()).length
	);

	// Check if any filters or search is active (for empty state message)
	let hasActiveFilters = $derived(activeFilterCount > 0 || referenceSearch.trim().length > 0);

	// Export modal state
	let showExportModal = $state(false);
	let exporting = $state(false);

	async function handleExport(options: ExportOptions) {
		if (!dataContext.db) return;

		exporting = true;
		try {
			const { csv, rowCount } = await exportOrdersToCsv(dataContext.db, options);

			// Generate filename with timestamp
			const timestamp = new Date().toISOString().split('T')[0];
			let filename = `orders-export-${timestamp}`;
			if (options.type === 'date-range') {
				filename = `orders-${options.startDate}-to-${options.endDate}`;
			}
			filename += '.csv';

			downloadCsv(csv, filename);
			showExportModal = false;

			console.log(`Exported ${rowCount} orders to ${filename}`);
		} catch (e) {
			console.error('Failed to export orders:', e);
		} finally {
			exporting = false;
		}
	}

	async function handleGetExportCount(options: ExportOptions): Promise<number> {
		if (!dataContext.db) return 0;
		return getExportOrderCount(dataContext.db, options);
	}
</script>

<svelte:head>
	<title>ANEK FX Analytics - Dashboard</title>
</svelte:head>

<div class="dashboard">
	<!-- Main Content -->
	<div class="main">
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
				label="Completion Rate"
				value={stats.completionRate.toFixed(1)}
				suffix="%"
				variant="success"
			/>
			<StatCard
				label="Pending Execution"
				value={stats.closedToTradingOrders.toLocaleString()}
				variant="warning"
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
								<div class="currency-bar-fill" style="width: {(volume / maxVolume) * 100}%"></div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Distribution Charts -->
		<section class="distributions-grid">
			<StatusDistribution
				data={statusDistribution}
				loading={statusLoading}
				error={statusError}
				onRetry={() => loadStatusDistribution(false)}
			/>
			<OrderTypeDistribution
				data={orderTypeDistribution}
				loading={orderTypeLoading}
				error={orderTypeError}
				onRetry={() => loadOrderTypeDistribution(false)}
			/>
		</section>

		<!-- Orders Table -->
		<section class="orders-section">
			<div class="section-header">
				<div class="section-header-left">
					<h2 class="section-title">Unified Orders</h2>
					<ReferenceSearch value={referenceSearch} onChange={handleReferenceSearchChange} />
				</div>
				<div class="section-actions">
					<RefreshButton onclick={handleRefresh} loading={dataContext.state.loading} />
					<button
						class="btn-filter"
						class:active={showFilters || activeFilterCount > 0}
						onclick={toggleFilters}
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
						>
							<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
						</svg>
						Filter
						{#if activeFilterCount > 0}
							<span class="filter-badge">{activeFilterCount}</span>
						{/if}
					</button>
					<button class="btn-export" onclick={() => (showExportModal = true)}>Export</button>
				</div>
			</div>
			{#if showFilters}
				<TableToolbar {filterOptions} {columnFilters} onFilterChange={handleColumnFiltersChange} />
			{/if}
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
					{orders}
					loading={ordersLoading}
					totalCount={totalOrders}
					{pageSize}
					{currentPage}
					onPageChange={handlePageChange}
					onPageSizeChange={handlePageSizeChange}
					onSortChange={handleSortChange}
					{currentSort}
					searchTerm={referenceSearch}
					hasFilters={hasActiveFilters}
				/>
			{/if}
		</section>
	</div>
</div>

<!-- Export Modal -->
<ExportModal
	open={showExportModal}
	onclose={() => (showExportModal = false)}
	onexport={handleExport}
	ongetcount={handleGetExportCount}
	totalOrders={hasActiveFilters ? stats.totalTrades : totalOrders}
	filteredCount={totalOrders}
	{hasActiveFilters}
	{referenceSearch}
	{columnFilters}
	sortConfig={currentSort}
	{exporting}
/>

<style>
	.dashboard {
		flex: 1;
		display: flex;
		flex-direction: column;
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
		transition:
			background 0.3s ease,
			border-color 0.3s ease;
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

	/* Distribution Charts */
	.distributions-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 16px;
	}

	@media (max-width: 768px) {
		.distributions-grid {
			grid-template-columns: 1fr;
		}
	}

	/* Orders Section */
	.orders-section {
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		flex: 1;
		display: flex;
		flex-direction: column;
		transition:
			background 0.3s ease,
			border-color 0.3s ease;
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

	.section-header-left {
		display: flex;
		align-items: center;
		gap: 16px;
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

	.btn-filter.active {
		border-color: var(--accent-primary);
		color: var(--accent-primary);
	}

	.filter-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		font-size: 10px;
		font-weight: 600;
		color: var(--bg-primary);
		background: var(--accent-primary);
		border-radius: 9px;
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
