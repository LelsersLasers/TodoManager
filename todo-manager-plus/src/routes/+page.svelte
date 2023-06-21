<script>
	import { listenerMainCollection} from '$lib/firebase/firebase';
	import { onDestroy, onMount } from 'svelte';

	let lists = [];
	let unsubFromLists = () => {};
	onMount(() => unsubFromLists = listenerMainCollection(arr => lists = arr));

	onDestroy(unsubFromLists);

</script>


<header>
	<hgroup>
		<h1>Todo Manager<sup>+</sup></h1>
		<h2>Managing your todos has never been this easy</h2>
	</hgroup>
</header>

<hr />

<main>
	<h4>TODOS:</h4>
	{#if lists.length > 0}
		<table>
			<tr>
				<th>Name</th>
				<th>#</th>
			</tr>
			{#each lists as list}
				<tr>
					<th>{list.name}</th>
					<th>{list.count}</th>
				</tr>
			{/each}
		</table>
	{:else}
		<p>No todos yet</p>
	{/if}
</main>