<script lang="ts">
	import Skeleton from './Skeleton.svelte';
</script>

<div class="stat-card-skeleton">
	<Skeleton width="60%" height="12px" variant="text" />
	<Skeleton width="80%" height="28px" variant="text" />
</div>

<style>
	.stat-card-skeleton {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 16px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-primary);
		min-height: 80px;
	}
</style>
