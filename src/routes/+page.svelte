<script lang="ts">
	import StatCard from '$lib/components/StatCard.svelte';
	import OrdersTable from '$lib/components/OrdersTable.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { formatCompact } from '$lib/utils/format';
	import type { UnifiedOrder } from '$lib/types/orders';

	// Mock data based on the data structure proposal
	const stats = $state({
		totalTrades: 18_432,
		totalVolume: 2_847_392_150,
		activeCurrencies: 12,
		openOrders: 847,
		avgRate: 1.0847,
		totalChains: 1_203
	});

	const volumeByCurrency = $state([
		{ currency: 'EUR', volume: 1_234_567_890, change: 12.4 },
		{ currency: 'USD', volume: 987_654_321, change: -3.2 },
		{ currency: 'CHF', volume: 456_789_012, change: 8.7 },
		{ currency: 'GBP', volume: 234_567_890, change: -1.5 },
		{ currency: 'DKK', volume: 123_456_789, change: 5.3 }
	]);

	// Mock orders data
	const mockOrders: UnifiedOrder[] = $state(
		Array.from({ length: 100 }, (_, i) => ({
			id: `K-${String(10000 + i).padStart(6, '0')}`,
			reference: `K-${String(10000 + i).padStart(6, '0')}`,
			fxOrderType: ['forward', 'chain', 'spot'][Math.floor(Math.random() * 3)] as
				| 'forward'
				| 'chain'
				| 'spot',
			marketDirection: Math.random() > 0.5 ? 'buy' : 'sell',
			buyAmountCents: Math.floor(Math.random() * 10000000) + 100000,
			sellAmountCents: Math.floor(Math.random() * 10000000) + 100000,
			buyCurrency: ['EUR', 'USD', 'CHF', 'GBP'][Math.floor(Math.random() * 4)],
			sellCurrency: ['EUR', 'USD', 'CHF', 'GBP'][Math.floor(Math.random() * 4)],
			rate: 1 + Math.random() * 0.3,
			valueDate: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split('T')[0],
			creationDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
				.toISOString()
				.split('T')[0],
			executionDate:
				Math.random() > 0.3
					? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
							.toISOString()
							.split('T')[0]
					: null,
			status: ['open', 'closed_to_trading', 'completed'][Math.floor(Math.random() * 3)] as
				| 'open'
				| 'closed_to_trading'
				| 'completed',
			liquidityProvider: ['SIVB', 'BARC', 'CITI', 'JPMC'][Math.floor(Math.random() * 4)]
		}))
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
			<div class="currency-grid">
				{#each volumeByCurrency as { currency, volume, change } (currency)}
					<div class="currency-card">
						<div class="currency-header">
							<span class="currency-code">{currency}</span>
							<span class="currency-change" class:positive={change > 0} class:negative={change < 0}>
								{change > 0 ? '+' : ''}{change.toFixed(1)}%
							</span>
						</div>
						<div class="currency-volume">{formatCompact(volume)}</div>
						<div class="currency-bar">
							<div
								class="currency-bar-fill"
								style="width: {(volume / volumeByCurrency[0].volume) * 100}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- Orders Table -->
		<section class="orders-section">
			<div class="section-header">
				<h2 class="section-title">Unified Orders</h2>
				<div class="section-actions">
					<button class="btn-filter">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
						</svg>
						Filter
					</button>
					<button class="btn-export">Export</button>
				</div>
			</div>
			<OrdersTable orders={mockOrders} />
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

	.currency-change {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 12px;
		font-weight: 500;
	}

	.currency-change.positive {
		color: var(--accent-primary);
	}

	.currency-change.negative {
		color: var(--accent-danger);
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
</style>
