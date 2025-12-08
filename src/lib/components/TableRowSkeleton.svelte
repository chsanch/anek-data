<script lang="ts">
	import Skeleton from './Skeleton.svelte';

	interface Props {
		columns?: number;
	}

	let { columns = 9 }: Props = $props();
</script>

<tr class="skeleton-row">
	{#each Array(columns) as _, i (i)}
		<td>
			<Skeleton
				width={i === 0 ? '120px' : i === 5 ? '80px' : '60px'}
				height="14px"
				variant="text"
			/>
		</td>
	{/each}
</tr>

<style>
	.skeleton-row td {
		padding: 12px 16px;
		border-bottom: 1px solid var(--border-primary);
	}
</style>
