<script>
	import {
		listenerMainCollection,
		createMainCollection,
		updateMainCollection,
		deleteMainCollection,
	} from '$lib/firebase/firebase';
	import { onDestroy, onMount } from 'svelte';

	import Modal from '$lib/components/Modal.svelte';
	let showCreateListModal = false;

	let showEditListModal = false;
	let editingListId = '';
	let editingListName = '';

	let showDeleteListModal = false;
	let deletingListId = '';
	let deletingListConfirmation = false;

	let snapshotLoading = true;

	let lists = [];
	let unsubFromLists = () => {};
	onMount(() => {
		unsubFromLists = listenerMainCollection((arr) => (lists = arr));
		if (snapshotLoading) snapshotLoading = false;
	});
	onDestroy(unsubFromLists);

	let createListText = '';
	function createList() {
		createMainCollection(createListText);
		createListText = '';
		showCreateListModal = false;
	}

	function startEditingList(id, name) {
		editingListId = id;
		editingListName = name;
		showEditListModal = true;
	}
	function editList() {
		updateMainCollection(editingListId, editingListName);

		editingListId = '';
		editingListName = '';
		showEditListModal = false;
	}

	function startDeletingList(id) {
		deletingListId = id;
		showDeleteListModal = true;
	}
	function deleteList() {
		deleteMainCollection(deletingListId);

		deletingListId = '';
		deletingListConfirmation = false;
		showDeleteListModal = false;
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
									on:click={startEditingList(list.id, list.name)}
									on:keydown={startEditingList(list.id, list.name)}
									style="cursor: pointer;">Edit</kbd
								>
							</td>
							<td class="zeroWidth">
								<kbd
									on:click={startDeletingList(list.id)}
									on:keydown={startDeletingList(list.id)}
									style="cursor: pointer;">Delete</kbd
								>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<article>
				<h2>No todo lists yet!</h2>
				<p>Click the <kbd>Create</kbd> button to get started!</p>
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

		<Modal bind:showModal={showEditListModal}>
			<article class="zeroBottomPadding">
				<form method="POST" on:submit|preventDefault={editList}>
					<label for="editList">Update list name</label>
					<input
						type="text"
						id="editList"
						name="editList"
						placeholder="List name"
						required
						bind:value={editingListName}
					/>
					<input type="submit" value="Update" />
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showDeleteListModal}>
			<article class="zeroBottomPadding">
				<form method="POST" on:submit|preventDefault={deleteList}>
					<label for="deleteList">Delete todo list</label>

					<label for="deleteList">
						Are you sure you want to delete this list?
						<input type="checkbox" role="switch" id="deleteList" name="deleteList" bind:checked={deletingListConfirmation} />
					</label>

					<input type="submit" value="Delete" disabled='{!deletingListConfirmation}' />
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
