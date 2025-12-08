<script lang="ts">
	import type { UnifiedOrder } from '$lib/types/orders';
	import { formatCurrency } from '$lib/utils/format';
	import Skeleton from './Skeleton.svelte';
	import EmptyState from './EmptyState.svelte';

	interface Props {
		orders: UnifiedOrder[];
		loading?: boolean;
		totalCount?: number;
		pageSize?: number;
		currentPage?: number;
		onPageChange?: (page: number) => void;
	}

	let {
		orders,
		loading = false,
		totalCount,
		pageSize = 20,
		currentPage = 1,
		onPageChange
	}: Props = $props();

	// Use totalCount for SQL pagination, or fallback to orders.length for client-side
	let effectiveTotalCount = $derived(totalCount ?? orders.length);
	let totalPages = $derived(Math.ceil(effectiveTotalCount / pageSize));

	// For SQL pagination, orders are already paginated; for client-side, slice them
	let displayOrders = $derived(
		totalCount !== undefined
			? orders // SQL pagination: orders are already the current page
			: orders.slice((currentPage - 1) * pageSize, currentPage * pageSize)
	);

	function goToPage(page: number) {
		if (page >= 1 && page <= totalPages) {
			if (onPageChange) {
				onPageChange(page);
			}
		}
	}

	function getStatusClass(status: string): string {
		switch (status) {
			case 'open':
				return 'status-open';
			case 'completed':
				return 'status-completed';
			case 'closed_to_trading':
				return 'status-closed';
			default:
				return '';
		}
	}

	function getTypeClass(type: string): string {
		switch (type) {
			case 'forward':
				return 'type-forward';
			case 'chain':
				return 'type-chain';
			case 'spot':
				return 'type-spot';
			default:
				return '';
		}
	}

	let visiblePages = $derived.by(() => {
		const pages: (number | string)[] = [];
		const delta = 2;

		for (let i = 1; i <= totalPages; i++) {
			if (
				i === 1 ||
				i === totalPages ||
				(i >= currentPage - delta && i <= currentPage + delta)
			) {
				pages.push(i);
			} else if (pages[pages.length - 1] !== '...') {
				pages.push('...');
			}
		}

		return pages;
	});
</script>

<div class="table-container">
	<table class="orders-table">
		<thead>
			<tr>
				<th>Reference</th>
				<th>Type</th>
				<th>Direction</th>
				<th>Buy</th>
				<th>Sell</th>
				<th class="align-right">Rate</th>
				<th>Value Date</th>
				<th>Status</th>
				<th>LP</th>
			</tr>
		</thead>
		<tbody>
			{#if loading}
				{#each Array(5) as _, i (i)}
					<tr class="skeleton-row">
						<td><Skeleton width="100px" height="14px" /></td>
						<td><Skeleton width="60px" height="22px" /></td>
						<td><Skeleton width="40px" height="14px" /></td>
						<td><Skeleton width="90px" height="14px" /></td>
						<td><Skeleton width="90px" height="14px" /></td>
						<td><Skeleton width="70px" height="14px" /></td>
						<td><Skeleton width="80px" height="14px" /></td>
						<td><Skeleton width="70px" height="22px" /></td>
						<td><Skeleton width="50px" height="14px" /></td>
					</tr>
				{/each}
			{:else if displayOrders.length === 0}
				<tr>
					<td colspan="9" class="cell-empty">
						<EmptyState
							title="No orders found"
							message="There are no orders matching your criteria."
							icon="search"
						/>
					</td>
				</tr>
			{:else}
				{#each displayOrders as order (order.id)}
					<tr>
						<td class="cell-reference">{order.reference}</td>
						<td>
							<span class="badge {getTypeClass(order.fxOrderType)}">
								{order.fxOrderType}
							</span>
						</td>
						<td>
							<span class="direction" class:buy={order.marketDirection === 'buy'} class:sell={order.marketDirection === 'sell'}>
								{order.marketDirection.toUpperCase()}
							</span>
						</td>
						<td class="cell-amount">
							<span class="amount">{formatCurrency(order.buyAmountCents)}</span>
							<span class="currency">{order.buyCurrency}</span>
						</td>
						<td class="cell-amount">
							<span class="amount">{formatCurrency(order.sellAmountCents)}</span>
							<span class="currency">{order.sellCurrency}</span>
						</td>
						<td class="cell-rate">{order.rate.toFixed(4)}</td>
						<td class="cell-date">{order.valueDate}</td>
						<td>
							<span class="status {getStatusClass(order.status)}">
								{order.status.replace(/_/g, ' ')}
							</span>
						</td>
						<td class="cell-lp">{order.liquidityProvider}</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>

<div class="pagination">
	<div class="pagination-info">
		Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, effectiveTotalCount)} of {effectiveTotalCount} orders
	</div>
	<div class="pagination-controls">
		<button
			class="page-btn"
			onclick={() => goToPage(currentPage - 1)}
			disabled={currentPage === 1}
			aria-label="Previous page"
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M15 18l-6-6 6-6" />
			</svg>
		</button>

		{#each visiblePages as page, index (index)}
			{#if page === '...'}
				<span class="page-ellipsis">...</span>
			{:else}
				<button
					class="page-btn"
					class:active={page === currentPage}
					onclick={() => goToPage(page as number)}
				>
					{page}
				</button>
			{/if}
		{/each}

		<button
			class="page-btn"
			onclick={() => goToPage(currentPage + 1)}
			disabled={currentPage === totalPages}
			aria-label="Next page"
		>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M9 18l6-6-6-6" />
			</svg>
		</button>
	</div>
</div>

<style>
	.table-container {
		overflow-x: auto;
		flex: 1;
	}

	.orders-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}

	.orders-table th {
		text-align: left;
		padding: 12px 16px;
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		background: var(--bg-tertiary);
		border-bottom: 1px solid var(--border-primary);
		position: sticky;
		top: 0;
		transition: background 0.3s ease, color 0.3s ease;
	}

	.orders-table th.align-right {
		text-align: right;
	}

	.orders-table td {
		padding: 12px 16px;
		border-bottom: 1px solid var(--border-primary);
		color: var(--text-primary);
		transition: color 0.3s ease, border-color 0.3s ease;
	}

	.orders-table tbody tr {
		transition: background 0.1s ease;
	}

	.orders-table tbody tr:hover {
		background: var(--table-row-hover);
	}

	.cell-reference {
		font-family: 'IBM Plex Mono', monospace;
		font-weight: 500;
		color: var(--text-white);
	}

	.badge {
		display: inline-block;
		padding: 4px 8px;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.type-forward {
		background: var(--accent-purple-bg);
		color: var(--accent-purple);
	}

	.type-chain {
		background: var(--accent-warning-bg);
		color: var(--accent-warning);
	}

	.type-spot {
		background: var(--accent-primary-bg);
		color: var(--accent-primary);
	}

	.direction {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.04em;
	}

	.direction.buy {
		color: var(--accent-primary);
	}

	.direction.sell {
		color: var(--accent-danger);
	}

	.cell-amount {
		font-family: 'IBM Plex Mono', monospace;
		white-space: nowrap;
	}

	.amount {
		color: var(--text-primary);
	}

	.currency {
		margin-left: 4px;
		font-size: 11px;
		color: var(--text-muted);
	}

	.cell-rate {
		font-family: 'IBM Plex Mono', monospace;
		text-align: right;
		color: var(--text-secondary);
	}

	.cell-date {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 12px;
		color: var(--text-secondary);
	}

	.status {
		display: inline-block;
		padding: 4px 8px;
		font-size: 10px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.status-open {
		background: var(--accent-warning-bg);
		color: var(--accent-warning);
	}

	.status-completed {
		background: var(--accent-primary-bg);
		color: var(--accent-primary);
	}

	.status-closed {
		background: var(--accent-neutral-bg);
		color: var(--text-secondary);
	}

	.cell-lp {
		font-family: 'IBM Plex Mono', monospace;
		font-size: 12px;
		color: var(--text-muted);
	}

	/* Pagination */
	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 20px;
		border-top: 1px solid var(--border-primary);
		background: var(--bg-tertiary);
		transition: background 0.3s ease, border-color 0.3s ease;
	}

	.pagination-info {
		font-size: 12px;
		color: var(--text-muted);
	}

	.pagination-controls {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.page-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 32px;
		height: 32px;
		padding: 0 8px;
		font-family: 'IBM Plex Mono', monospace;
		font-size: 12px;
		font-weight: 500;
		color: var(--text-secondary);
		background: transparent;
		border: 1px solid var(--border-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.page-btn:hover:not(:disabled) {
		border-color: var(--border-hover);
		color: var(--text-primary);
	}

	.page-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.page-btn.active {
		background: var(--accent-primary);
		border-color: var(--accent-primary);
		color: var(--bg-primary);
	}

	.page-ellipsis {
		padding: 0 8px;
		font-size: 12px;
		color: var(--text-muted);
	}

	/* Loading and Empty States */
	.cell-empty {
		text-align: center;
		padding: 48px 16px !important;
		color: var(--text-muted);
		font-size: 14px;
	}

	.skeleton-row td {
		padding: 12px 16px;
		border-bottom: 1px solid var(--border-primary);
	}
</style>
