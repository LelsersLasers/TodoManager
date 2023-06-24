<script>
	import {
		listenerMainCollection,
		createMainCollection,
		updateMainCollection,
		deleteMainCollection,
		signInWithGoogle,
		signOutWithGoogle,
		currentUserStore
	} from '$lib/firebase/firebase';
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';

	import Modal from '$lib/components/Modal.svelte';

	let showSignoutModal = false;

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
		unsubFromLists = listenerMainCollection((arr) => {
			lists = arr;
			if (snapshotLoading) snapshotLoading = false;
		});
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

	function redirectToList(id) {
		goto(`/list/${id}`);
	}
</script>

<header class="zeroBottomPadding">
	<hgroup>
		{#if $currentUserStore != null}
			<img
				class="floatRight"
				src={$currentUserStore.photoURL}
				alt=""
				title="Signed in as {$currentUserStore.displayName}. Click to sign out."
				on:click={() => (showSignoutModal = true)}
				on:keydown={() => (showSignoutModal = true)}
				style="cursor: pointer;"
			/>
		{/if}
		<h1>Todo Manager<sup>+</sup></h1>
		<h2>Managing your todos has never been this easy</h2>
	</hgroup>
</header>

<hr />

<main>
	{#if $currentUserStore === null}
		<article class="zeroTopMargin">
			<h2 style="text-align: center;">Sign in to get started!</h2>
			<p style="text-align: center;">
				<kbd
					on:click={signInWithGoogle}
					on:keydown={signInWithGoogle}
					style="cursor: pointer;">Sign in</kbd
				> with your Google account to start managing your todos!
			</p>
		</article>

		<button class="stickyFooter zeroBottomMargin nintyWidth" on:click={signInWithGoogle}
			>Sign in with Google</button
		>
	{:else if snapshotLoading}
		<h5>Loading</h5>
		<article class="zeroTopMargin" aria-busy="true" />
	{:else}
		{#if lists.length > 0}
			<h4 class="zeroBottomMargin">Todo lists:</h4>
			<table>
				<thead>
					<tr>
						<th><strong>Name</strong></th>
						<th class="zeroWidth zeroWidthPadding"><strong>#</strong></th>
						<th />
						<th />
					</tr>
				</thead>
				<tbody>
					{#each lists as list}
						<tr
							on:click={redirectToList(list.id)}
							on:keydown={redirectToList(list.id)}
							style="cursor: pointer;"
						>
							<td>{list.name}</td>
							<td class="zeroWidth zeroWidthPadding">{list.count}</td>
							<td class="zeroWidth zeroWidthPadding">
								<kbd
									on:click|stopPropagation={startEditingList(list.id, list.name)}
									on:keydown|stopPropagation={startEditingList(list.id, list.name)}
									style="cursor: pointer;">Edit</kbd
								>
							</td>
							<td class="zeroWidth zeroWidthPadding">
								<kbd
									on:click|stopPropagation={startDeletingList(list.id)}
									on:keydown|stopPropagation={startDeletingList(list.id)}
									style="cursor: pointer;">Delete</kbd
								>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<article class="zeroTopMargin">
				<h2>No todo lists yet!</h2>
				<p>
					Click the
					<kbd
						on:click={() => (showCreateListModal = true)}
						on:keydown={() => (showCreateListModal = true)}
						style="cursor: pointer;">Create</kbd
					>
					button to get started!
				</p>
			</article>
		{/if}

		<button
			class="stickyFooter zeroBottomMargin nintyWidth"
			on:click={() => (showCreateListModal = true)}>Create new list</button
		>

		<Modal bind:showModal={showCreateListModal}>
			<article class="zeroBottomPadding">
				<form method="POST" on:submit|preventDefault={createList}>
					<h1 class="zeroBottomMargin">
						<label for="createList">Create list</label>
					</h1>
					<input
						type="text"
						id="createList"
						name="createList"
						placeholder="List name"
						required
						autocomplete="off"
						bind:value={createListText}
					/>
					<input type="submit" value="Create" />
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showEditListModal}>
			<article class="zeroBottomPadding">
				<form method="POST" on:submit|preventDefault={editList}>
					<h1 class="zeroBottomMargin"><label for="editList">Update list</label></h1>
					<input
						type="text"
						id="editList"
						name="editList"
						placeholder="List name"
						required
						autocomplete="off"
						bind:value={editingListName}
					/>
					<input type="submit" value="Update" />
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showDeleteListModal}>
			<article class="zeroBottomPadding">
				<form method="POST" on:submit|preventDefault={deleteList}>
					<h1 class="zeroBottomMargin">
						<label for="deleteList">Delete list</label>
					</h1>

					<label for="deleteList">
						Are you sure you want to delete this list?
						<input
							type="checkbox"
							role="switch"
							id="deleteList"
							name="deleteList"
							bind:checked={deletingListConfirmation}
						/>
					</label>

					<input type="submit" value="Delete" disabled={!deletingListConfirmation} />
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showSignoutModal}>
			<article class="zeroBottomPadding">
				<form method="POST" on:submit|preventDefault={signOutWithGoogle}>
					<h1 class="zeroBottomMargin">
						<label for="deleteList">Sign out?</label>
					</h1>
					<p>Currently signed in as {$currentUserStore.displayName}</p>
					<br />

					<input type="submit" value="Sign out" />
				</form>
			</article>
		</Modal>
	{/if}
</main>
