<script>
	export let data;

	import {
		listenerSubCollection,
		createSubCollection,
		updateSubCollection,
		updateSubCollectionFinished,
		deleteSubCollection,
		signOutWithGoogle,
		currentUserStore,
		listenerMainCollectionDoc,
		shareMainCollection,
		leaveMainCollection
	} from '$lib/firebase/firebase';
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';

	import Modal from '$lib/components/Modal.svelte';

	let showSignoutModal = false;

	let showCreateTodoModal = false;

	let showEditTodoModal = false;
	let editingTodoId = '';
	let editingTodoName = '';

	let showDeleteTodoModal = false;
	let deletingTodoId = '';
	let deletingTodoConfirmation = false;

	let showShareListModal = false;
	let sharingListId = '';
	let sharingEmail = '';
	let shareMessage = 'Email address';

	let showLeaveListModal = false;
	let showLeavingListConfirmation = false;

	let showWithListModal = false;

	let snapshotLoading = true;

	let todos = [];
	let unsubFromTodos = () => {};
	let unsubFromDoc = () => {};
	let unsubFromUser = () => {};

	let loaded = false;
	let timeoutId;
	async function updateLoginStatus(u) {
		if (u) {
			if (timeoutId) clearTimeout(timeoutId);
			if (!loaded) {
				try {
					unsubFromDoc = await listenerMainCollectionDoc(
						data.listId,
						async (docData) => {
							const timestampDate = docData.timestamp.toDate();
							const createdOn = `${
								timestampDate.getMonth() + 1
							}/${timestampDate.getDate()}/${timestampDate.getFullYear()}`;

							data.count = docData.count;
							data.name = docData.name;
							data.id = docData.id;
							data.uids = docData.uids;
							data.createdOn = createdOn;

							if (!loaded) {
								unsubFromTodos = await listenerSubCollection(data.id, (arr) => {
									todos = arr;
									if (snapshotLoading) snapshotLoading = false;
								});
								loaded = true;
							}
						},
						backToHome
					);
				} catch (e) {
					if (e.code === 'permission-denied') {
						backToHome();
					}
				}
			}
		} else {
			timeoutId = setTimeout(backToHome, 1000);
		}
	}

	onMount(() => {
		unsubFromUser = currentUserStore.subscribe(updateLoginStatus);
	});
	onDestroy(() => {
		unsubFromTodos();
		unsubFromDoc();
		unsubFromUser();
	});

	let createTodoText = '';
	function createTodo() {
		createSubCollection(data.id, createTodoText);
		createTodoText = '';
		showCreateTodoModal = false;
	}

	function updateTodoFinished(id, finished) {
		updateSubCollectionFinished(data.id, id, finished);
	}

	function startEditingTodo(id, name) {
		editingTodoId = id;
		editingTodoName = name;
		showEditTodoModal = true;
	}
	function editList() {
		updateSubCollection(data.id, editingTodoId, editingTodoName);

		editingTodoId = '';
		editingTodoName = '';
		showEditTodoModal = false;
	}

	function startDeletingTodo(id) {
		deletingTodoId = id;
		deletingTodoConfirmation = false;
		showDeleteTodoModal = true;
	}
	function deleteTodo() {
		deleteSubCollection(data.id, deletingTodoId);
		deletingTodoId = '';
		deletingTodoConfirmation = false;
		showDeleteTodoModal = false;
	}

	function startSharingList(id) {
		sharingListId = id;
		sharingEmail = '';
		showShareListModal = true;
		shareMessage = 'Email address';

		showLeavingListConfirmation = false;
	}
	function shareList() {
		sharingEmail = sharingEmail.trim();
		if (sharingEmail.length === 0) return;

		shareMainCollection(sharingListId, sharingEmail)
			.then(() => {
				shareMessage = `Shared list with ${sharingEmail}`;
			})
			.catch((err) => {
				shareMessage = `${err.data.message}`;
			})
			.finally(() => {
				sharingEmail = '';
			});
	}

	function startLeavingList() {
		showLeaveListModal = true;
	}
	function leaveList() {
		leaveMainCollection(sharingListId);

		sharingListId = '';
		sharingEmail = '';
		showShareListModal = false;

		showLeavingListConfirmation = false;
		showLeaveListModal = false;

		backToHome();
	}

	function startShowingWithList() {
		showWithListModal = true;
	}

	function signOutAndBackToHome() {
		signOutWithGoogle();
		backToHome();
	}

	function backToHome() {
		goto('/');
	}
</script>

<svelte:head>
	{#if !loaded}
		<title>Todo Manager+: Loading...</title>
	{:else}
		<title>Todo Manager+: {data.name}</title>
	{/if}
</svelte:head>

<header class="zeroBottomPadding">
	<hgroup>
		{#if $currentUserStore != null}
			<img
				class="floatRight"
				src={$currentUserStore.photoURL}
				alt="?"
				title="Signed in as {$currentUserStore.displayName}. Click to sign out."
				on:click={() => (showSignoutModal = true)}
				on:keydown={() => (showSignoutModal = true)}
				style="cursor: pointer;"
			/>
		{:else}
			<img
				class="floatRight"
				src="https://static.thenounproject.com/png/711255-200.png"
				alt=""
			/>
		{/if}

		{#if !loaded}
			<kbd class="floatRight clearBoth" style="cursor: pointer;">Share list</kbd>

			<h1>Loading...</h1>
			<h2>Created on loading...</h2>
		{:else}
			<kbd
				on:click|stopPropagation={startSharingList(data.listId)}
				on:keydown|stopPropagation={startSharingList(data.listId)}
				class="floatRight clearBoth"
				style="cursor: pointer;">Share list</kbd
			>

			<h1 class="breakWord">{data.name}</h1>
			<h2>Created on {data.createdOn}</h2>
		{/if}
	</hgroup>
</header>

<hr />

<main>
	{#if snapshotLoading}
		<h5>Loading</h5>
		<article class="zeroTopMargin" aria-busy="true" />
	{:else}
		{#if todos.length > 0}
			<h4 class="zeroBottomMargin">Todos:</h4>
			<table class="threeEmBottomMargin">
				<thead>
					<tr>
						<th><strong>Name</strong></th>
						<th class="zeroWidth zeroWidthPadding"><strong>Done</strong></th>
						<th />
						<th />
					</tr>
				</thead>
				<tbody>
					{#each todos as todo (todo.id)}
						<tr>
							<td class="breakWord">
								{#if todo.finished}
									<del>{todo.name}</del>
								{:else}
									{todo.name}
								{/if}
							</td>
							<td>
								<input
									type="checkbox"
									bind:checked={todo.finished}
									on:change={updateTodoFinished(todo.id, todo.finished)}
								/>
							</td>
							<td class="zeroWidth zeroWidthPadding">
								<kbd
									on:click|stopPropagation={startEditingTodo(todo.id, todo.name)}
									on:keydown|stopPropagation={startEditingTodo(todo.id, todo.name)}
									style="cursor: pointer;">Edit</kbd
								>
							</td>
							<td class="zeroWidth zeroWidthPadding">
								<kbd
									on:click|stopPropagation={startDeletingTodo(todo.id)}
									on:keydown|stopPropagation={startDeletingTodo(todo.id)}
									style="cursor: pointer;">&#128465;</kbd
								>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<article class="zeroTopMargin">
				<h2>No todos yet!</h2>
				<p>
					Click the
					<kbd
						on:click={() => (showCreateTodoModal = true)}
						on:keydown={() => (showCreateTodoModal = true)}
						style="cursor: pointer;">Create</kbd
					>
					button to add an item!
				</p>
			</article>
		{/if}

		<div class="stickyFooter zeroBottomMargin textAlignCenter">
			<div class="footerWidth zeroBottomMargin marginZeroAuto nintyFiveWidth">
				<input
					class="zeroBottomMargin fifteenWidth floatLeft"
					style="cursor: pointer"
					type="reset"
					value="&blacktriangleleft;"
					on:click|preventDefault={backToHome}
				/>
				<button
					class="zeroBottomMargin eightyWidth floatRight"
					on:click={() => (showCreateTodoModal = true)}>Create new todo</button
				>
			</div>
		</div>

		<Modal bind:showModal={showCreateTodoModal}>
			<article class="zeroBottomPadding">
				<form method="POST" on:submit|preventDefault={createTodo}>
					<h1 class="zeroBottomMargin"><label for="createTodo">Create todo</label></h1>
					<input
						type="text"
						id="createTodo"
						name="createTodo"
						placeholder="Todo item name"
						required
						autocomplete="off"
						bind:value={createTodoText}
					/>
					<input class="floatRight" type="submit" value="Create" />
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showEditTodoModal}>
			<article class="zeroBottomPadding">
				<form method="POST" on:submit|preventDefault={editList}>
					<h1 class="zeroBottomMargin"><label for="editTodo">Update todo</label></h1>
					<input
						type="text"
						id="editTodo"
						name="editTodo"
						placeholder="Todo item name"
						required
						autocomplete="off"
						bind:value={editingTodoName}
					/>
					<input class="floatRight" type="submit" value="Update" />
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showDeleteTodoModal}>
			<article class="zeroBottomPadding">
				<form method="POST" on:submit|preventDefault={deleteTodo}>
					<h1 class="zeroBottomMargin"><label for="deleteList">Delete todo</label></h1>
					<label for="deleteList">
						Are you sure you want to delete this item?
						<input
							type="checkbox"
							role="switch"
							id="deleteList"
							name="deleteList"
							bind:checked={deletingTodoConfirmation}
						/>
					</label>

					<input
						class="floatRight"
						type="submit"
						value="Delete"
						disabled={!deletingTodoConfirmation}
					/>
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showShareListModal}>
			<article class="zeroBottomPadding">
				<form method="POST" on:submit|preventDefault={shareList}>
					<h1 class="zeroBottomMargin"><label for="shareList">Share list</label></h1>
					<input
						type="text"
						id="shareList"
						name="shareList"
						placeholder={shareMessage}
						required
						autocomplete="on"
						bind:value={sharingEmail}
					/>

					<input class="halfEmBottomMargin" type="submit" value="Share" />
					<input
						class="fiftyWidthWithSpace floatLeft zeroPadding"
						type="reset"
						value="Shared with"
						on:click|preventDefault={startShowingWithList}
					/>
					<input
						class="fiftyWidthWithSpace floatRight zeroPadding"
						type="reset"
						value="Leave"
						on:click|preventDefault={startLeavingList}
					/>
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showLeaveListModal}>
			<article class="zeroBottomPadding">
				<form method="POST" on:submit|preventDefault|stopPropagation={leaveList}>
					<h1 class="zeroBottomMargin">
						<label for="leaveList">Leave list</label>
					</h1>

					<label for="leaveList">
						Leaving a list will mean you will no longer be able to access it. Are you
						sure you want to leave this list?
						<input
							type="checkbox"
							role="switch"
							id="leaveList"
							name="leaveList"
							bind:checked={showLeavingListConfirmation}
						/>
					</label>

					<input
						class="floatRight"
						type="submit"
						value="Leave"
						disabled={!showLeavingListConfirmation}
					/>
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showWithListModal}>
			<article class="overflowScroll">
				<h1 class="zeroBottomMargin">Shared with</h1>

				{#each data.uids as email (email)}
					<li>{email}</li>
				{/each}
			</article>
		</Modal>

		{#if $currentUserStore != null}
			<Modal bind:showModal={showSignoutModal}>
				<article class="zeroBottomPadding">
					<form method="POST" on:submit|preventDefault={signOutAndBackToHome}>
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
	{/if}
</main>
