<script>
	import { listenerMainCollection, createMainCollection } from '$lib/firebase/firebase';
	import { onDestroy, onMount } from 'svelte';

	import Modal from '$lib/components/Modal.svelte';
	let showCreateListModal = false;

	let snapshotLoading = true;

	let lists = [];
	let unsubFromLists = () => {};
	onMount(() => {
		unsubFromLists = listenerMainCollection((arr) => (lists = arr));
		if (snapshotLoading) snapshotLoading = false;
	});

	onDestroy(unsubFromLists);

	let createListText = '';
	async function createList() {
		createMainCollection(createListText);
		createListText = '';
	}
</script>

<header>
	<hgroup>
		<h1>Todo Manager<sup>+</sup></h1>
		<h2>Managing your todos has never been this easy</h2>
	</hgroup>
</header>

<hr />

<main>
	<h4 class="zeroBottomMargin">Todo lists:</h4>
	{#if snapshotLoading}
		<h5>Loading</h5>
		<article aria-busy="true" />
	{:else}
		{#if lists.length > 0}
			<table>
				<thead>
					<tr>
						<th><strong>Name</strong></th>
						<th><strong>#</strong></th>
						<th />
						<th />
					</tr>
				</thead>
				<tbody>
					{#each lists as list}
						<tr>
							<td>{list.name}</td>
							<td class="zeroWidth">{list.count}</td>
							<td class="zeroWidth">
								<kbd
									on:click={console.log(list.id)}
									on:keydown={console.log(list.id)}
									style="cursor: pointer;">Edit</kbd
								>
							</td>
							<td class="zeroWidth"><kbd>Delete</kbd></td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<article>
				<h2>No todo lists yet!</h2>
				<p>Click the <kbd>+</kbd> to get started!</p>
			</article>
		{/if}

		<button
			class="stickyFooter zeroBottomMargin eightyWidth"
			on:click={() => (showCreateListModal = true)}>Create new list</button
		>

		<Modal bind:showModal={showCreateListModal}>
			<article class="zeroBottomPadding">
				<form method="POST" on:submit|preventDefault={createList}>
					<label for="createList">Create todo list</label>
					<input
						type="text"
						id="createList"
						name="createList"
						placeholder="List name"
						required
						bind:value={createListText}
					/>
					<input type="submit" value="Create" />
				</form>
			</article>
		</Modal>
	{/if}
</main>

<style>
	.zeroWidth {
		width: 0%;
	}

	.eightyWidth {
		width: 80%;
	}

	.zeroBottomMargin {
		margin-bottom: 0;
	}

	.zeroBottomPadding {
		padding-bottom: 0;
	}

	.stickyFooter {
		position: fixed;
		left: 10%;
		bottom: 0;
	}
</style>
