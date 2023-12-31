<script>
	export let data;

	import {
		listenerSubCollection,
		createSubCollection,
		updateSubCollection,
		updateSubCollectionFinished,
		updateSubCollectionOrder,
		deleteSubCollection,
		signOutWithGoogle,
		listenerOnAuthStateChanged,
		listenerMainCollectionDoc,
		shareMainCollection,
		leaveMainCollection,
		removeShareMainCollection,
		updateMainCollection,
		deleteMainCollection
	} from '$lib/firebase/firebase';

	import { onDestroy, onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { fly } from 'svelte/transition';
	import { goto } from '$app/navigation';

	import Modal from '$lib/components/Modal.svelte';

	let user;

	let pageTitle = writable('Todo Manager+: Loading...');

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
	let sharingListLoading = false;
	let shareButtonText = 'Share';
	let shareMessage = 'Email address';

	let showLeaveListModal = false;
	let showLeavingListConfirmation = false;

	let showRemoveListModal = false;
	let removingEmail = '';
	let showRemovingListConfirmation = false;

	let showLinkListModal = false;
	let shareLink = '';

	let showWithListModal = false;

	let showEditListModal = false;
	let editingListId = '';
	let editingListName = '';

	let showDeleteListModal = false;
	let deletingListConfirmation = false;

	let snapshotLoading = true;

	let editingOrder = false;

	let todos = [];

	let notAllFinished = false;
	let markingFinishing = false;

	let finishedChangedKeys = {};

	let unsubFromTodos = () => {};
	let unsubFromDoc = () => {};
	let unsubFromUser = () => {};

	let loaded = false;
	let timeoutId;
	async function updateLoginStatus(u) {
		if (!leaving) user = u;
		if (u) {
			if (timeoutId) clearTimeout(timeoutId);
			if (!loaded) {
				try {
					// not sure if this does anything...
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

							pageTitle.set(`Todo Manager+: ${data.name}`);

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
		} else if (!leaving) {
			timeoutId = setTimeout(backToHome, 1000);
		}
	}

	onMount(() => {
		unsubFromUser = listenerOnAuthStateChanged(updateLoginStatus);
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
		finishedChangedKeys[id] = finished;
		updateSubCollectionFinished(data.id, id, finished);
	}

	function startEditingTodo(id, name) {
		editingTodoId = id;
		editingTodoName = name;
		showEditTodoModal = true;
	}
	function editTodo() {
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

	let copied = false;
	function copyText() {
		navigator.clipboard.writeText(shareLink);
		copied = true;
	}
	function startSharingList(id) {
		sharingListId = id;
		sharingEmail = '';
		showShareListModal = true;
		shareMessage = 'Email address';
		shareButtonText = 'Share';

		const searchParams = new URLSearchParams();
		const base = 'https://todo-manager-plus.vercel.app';
		searchParams.set('sharedListId', sharingListId);
		searchParams.set('sharedListName', data.name);
		shareLink = `${base}?${searchParams.toString()}`;

		showLeavingListConfirmation = false;
	}
	async function shareList() {
		sharingEmail = sharingEmail.trim();
		if (sharingEmail.length === 0) return;

		sharingListLoading = true;
		const response = await fetch('/email/', {
			method: 'POST',
			body: JSON.stringify({
				userEmail: user.email,
				userName: user.displayName,
				toEmail: sharingEmail,
				listName: data.name,
				shareLink: shareLink
			}),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		const { success } = await response.json();
		sharingListLoading = false;

		if (success) {
			shareMainCollection(sharingListId, sharingEmail).then(() => {
				shareMessage = `Shared list with ${sharingEmail}`;
				sharingEmail = '';
			});
		} else {
			shareButtonText = 'Not Found';
		}
	}

	function startSharingLink() {
		copied = false;
		showLinkListModal = true;
	}

	function startLeavingList() {
		showLeaveListModal = true;
	}
	function leaveList() {
		leaveMainCollection(sharingListId);
		backToHome();
	}

	function startRemovingList(email) {
		removingEmail = email;
		showRemoveListModal = true;
	}
	async function removeList() {
		removeShareMainCollection(sharingListId, removingEmail);

		removingEmail = '';
		showRemoveListModal = false;
	}

	function startShowingWithList() {
		showRemovingListConfirmation = false;
		showWithListModal = true;
	}

	function startEditingList(id, name) {
		editingListId = id;
		editingListName = name;
		showEditListModal = true;

		deletingListConfirmation = false;

		notAllFinished = todos.some((t) => !t.finished);
		markingFinishing = false;
	}
	function editList() {
		updateMainCollection(editingListId, editingListName);

		editingListId = '';
		editingListName = '';
		showEditListModal = false;

		deletingListConfirmation = false;
	}
	async function toggleFinishedAll() {
		markingFinishing = true;
		for (let todo of todos.slice().reverse()) {
			if (todo.finished != notAllFinished) {
				await updateSubCollectionFinished(data.id, todo.id, notAllFinished);
			}
		}
		notAllFinished = todos.some((t) => !t.finished);
		markingFinishing = false;
	}

	function startDeletingList() {
		deletingListConfirmation = false;
		showDeleteListModal = true;
	}
	function deleteList() {
		deleteMainCollection(editingListId);
		backToHome();
	}

	function noNegativeTodoOrders(idsToUpdate) {
		let todoOrders = todos.map((t) => t.order);
		let minTodoOrder = Math.min(...todoOrders);
		if (minTodoOrder < 0) {
			let offset = Math.abs(minTodoOrder);
			todos.forEach((t) => {
				t.order += offset;
			});
			idsToUpdate = todos.map((t) => t.id);
		}
		return idsToUpdate;
	}

	function moveTodoUp(id) {
		// the following is guaranteed to be true
		// {#if (todos[index - 1]) && (todos[index - 1].finished == todo.finished)}
		let idsToUpdate = [];

		let todo = todos.find((t) => t.id == id);
		let index = todos.indexOf(todo);

		let aboveTodo = todos[index - 1];
		todo.order = aboveTodo.order - 1;
		index--;

		idsToUpdate.push(todo.id);

		while (todos[index - 1] && todos[index - 1].finished == todo.finished) {
			todos[index - 1].order = todos[index].order - 2;
			index--;
			idsToUpdate.push(todos[index].id);
		}

		idsToUpdate = noNegativeTodoOrders(idsToUpdate);

		idsToUpdate.forEach((id) => {
			const todoToUpdate = todos.find((t) => t.id == id);
			updateSubCollectionOrder(data.id, id, todoToUpdate.order);
		});
	}
	function moveTodoDown(id) {
		// the following is guaranteed to be true
		// {#if (todos[index + 1]) && (todos[index + 1].finished == todo.finished)}

		let idsToUpdate = [];

		let todo = todos.find((t) => t.id == id);
		let index = todos.indexOf(todo);

		let belowTodo = todos[index + 1];
		todo.order = belowTodo.order + 1;
		index++;

		idsToUpdate.push(todo.id);

		while (todos[index + 1] && todos[index + 1].finished == todo.finished) {
			todos[index + 1].order = todos[index].order + 2;
			index++;
			idsToUpdate.push(todos[index].id);
		}

		idsToUpdate = noNegativeTodoOrders(idsToUpdate);

		idsToUpdate.forEach((id) => {
			updateSubCollectionOrder(data.id, id, todos.find((t) => t.id == id).order);
		});
	}

	let leaving = false;
	function signOutAndBackToHome() {
		leaving = true;
		signOutWithGoogle();
		backToHome();
	}

	function backToHome() {
		leaving = true;
		goto('/');
	}
</script>

<svelte:head>
	<title>{$pageTitle}</title>
</svelte:head>

<header class="zeroBottomPadding">
	<hgroup class="threeEmBottomMargin">
		{#if user}
			<img
				class="floatRight"
				src={user.photoURL}
				alt="?"
				title="Signed in as {user.displayName}. Click to sign out."
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
			<kbd class="floatRight clearBoth" style="cursor: pointer;">Edit list</kbd>

			<h1>Loading...</h1>
			<h2>Created on loading...</h2>
		{:else}
			<kbd
				on:click={startSharingList(data.listId)}
				on:keydown={startSharingList(data.listId)}
				class="floatRight clearBoth"
				style="cursor: pointer;">Share list</kbd
			>
			<kbd
				on:click={startEditingList(data.listId, data.name)}
				on:keydown={startEditingList(data.listId, data.name)}
				class="floatRight clearBoth"
				style="cursor: pointer;">Edit list</kbd
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
			{#if todos.length > 1 && !(todos.length == 2 && todos[0].finished != todos[1].finished)}
				{#if !editingOrder}
					<kbd
						on:click={() => (editingOrder = true)}
						on:keydown={() => (editingOrder = true)}
						class="floatRight clearBoth stickyOnScroll"
						style="cursor: pointer;">Edit Order</kbd
					>
				{:else}
					<kbd
						on:click={() => (editingOrder = false)}
						on:keydown={() => (editingOrder = false)}
						class="floatRight clearBoth stickyOnScroll"
						style="cursor: pointer;">Save Order</kbd
					>
				{/if}
			{/if}
			<h4 class="zeroBottomMargin">Todos:</h4>
			<table class="threeEmBottomMargin">
				<thead>
					<tr>
						{#if editingOrder}
							<th class="zeroWidth zeroWidthPadding"><strong>Order</strong></th>
						{/if}
						<th><strong>Name</strong></th>
						<th
							title="Marking something as done does not delete it"
							class="zeroWidth zeroWidthPadding"><strong>Done</strong></th
						>
						<th />
						<th />
					</tr>
				</thead>
				<tbody>
					{#each todos as todo, index (todo.id)}
						{#key finishedChangedKeys[todo.id]}
							<tr
								in:fly|global={{ duration: 300, x: -200 }}
								out:fly|global={{ duration: 300, x: 200 }}
							>
								{#if editingOrder}
									<td class="zeroWidth zeroWidthPadding">
										{#if todos[index - 1] && todos[index - 1].finished == todo.finished}
											<button on:click={moveTodoUp(todo.id)} class="tiny tinyMargin">
												&uarr;
											</button>
										{/if}
										{#if todos[index + 1] && todos[index + 1].finished == todo.finished}
											<button on:click={moveTodoDown(todo.id)} class="tiny">
												&darr;
											</button>
										{/if}
									</td>
								{/if}
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
						{/key}
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
					class="zeroBottomMargin twentyWidthWithSpace floatLeft"
					style="cursor: pointer"
					type="reset"
					value="&blacktriangleleft;"
					on:click|preventDefault={backToHome}
				/>
				<button
					class="zeroBottomMargin eightyWidthWithSpace floatRight"
					on:click={() => (showCreateTodoModal = true)}>Create new todo</button
				>
			</div>
		</div>

		<Modal bind:showModal={showCreateTodoModal}>
			<article class="zeroBottomPadding smallArticleTopPadding">
				<form method="POST" on:submit|preventDefault={createTodo}>
					<h1 class="zeroBottomMargin"><label for="createTodo">Create todo</label></h1>
					<input
						type="text"
						id="createTodo"
						name="createTodo"
						placeholder="Todo item name"
						required
						autocomplete="off"
						spellcheck="true"
						bind:value={createTodoText}
					/>
					<input class="floatRight" type="submit" value="Create" />
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showEditTodoModal}>
			<article class="zeroBottomPadding smallArticleTopPadding">
				<form method="POST" on:submit|preventDefault={editTodo}>
					<h1 class="zeroBottomMargin"><label for="editTodo">Update todo</label></h1>
					<input
						type="text"
						id="editTodo"
						name="editTodo"
						placeholder="Todo item name"
						required
						autocomplete="off"
						spellcheck="true"
						bind:value={editingTodoName}
					/>
					<input class="floatRight" type="submit" value="Update" />
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showDeleteTodoModal}>
			<article class="zeroBottomPadding smallArticleTopPadding">
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
			<article class="zeroBottomPadding smallArticleTopPadding">
				<form method="POST" on:submit|preventDefault={shareList}>
					<h1 class="zeroBottomMargin"><label for="shareList">Share list</label></h1>
					<input
						type="email"
						id="shareList"
						name="shareList"
						placeholder={shareMessage}
						required
						autocomplete="on"
						bind:value={sharingEmail}
						on:change={() => (shareButtonText = 'Share')}
					/>

					{#if sharingListLoading}
						<button
							class="halfEmBottomMargin eightyWidthWithSpace floatLeft"
							aria-busy="true">.....</button
						>
					{:else}
						<input
							class="halfEmBottomMargin eightyWidthWithSpace floatLeft"
							type="submit"
							value={shareButtonText}
						/>
					{/if}

					<input
						class="halfEmBottomMargin twentyWidthWithSpace floatRight zeroPadding"
						type="reset"
						value="&#128279;"
						title="Share link"
						on:click|preventDefault={startSharingLink}
					/>

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
						title="Leave list"
						on:click|preventDefault={startLeavingList}
					/>
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showLinkListModal}>
			<article class="largeModal">
				<h1 class="zeroBottomMargin" style="text-align: center">Share link</h1>

				<p style="text-align: center">
					Only people with access (i.e. the list is already shared with them) can open
					with the link.
				</p>
				<p style="text-align: center">
					Share link:
					<code id="shareLinkCopy" class="halfEmBottomMargin">{shareLink}</code>
					<br />

					<kbd on:click={copyText} on:keydown={copyText} style="cursor: pointer;">
						{#if !copied}
							Copy
						{:else}
							Copied!
						{/if}
					</kbd>
				</p>
			</article>
		</Modal>

		<Modal bind:showModal={showLeaveListModal}>
			<article class="zeroBottomPadding smallArticleTopPadding">
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

		<Modal bind:showModal={showRemoveListModal}>
			<article class="zeroBottomPadding smallArticleTopPadding">
				<form method="POST" on:submit|preventDefault|stopPropagation={removeList}>
					<h1 class="zeroBottomMargin">
						<label for="removeList">Remove user</label>
					</h1>

					<label for="removeList">
						Removing someone from a list will mean they will no longer be able to access
						it. Are you sure you want to remove this user from the list?
						<input
							type="checkbox"
							role="switch"
							id="removeList"
							name="removeList"
							bind:checked={showRemovingListConfirmation}
						/>
					</label>

					<input
						class="floatRight"
						type="submit"
						value="Remove"
						disabled={!showRemovingListConfirmation}
					/>
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showWithListModal}>
			<article class="overflowScroll largeModal">
				<h1 class="zeroBottomMargin">Shared with</h1>

				<table>
					<thead>
						<tr>
							<th><strong>Email</strong></th>
							<th />
						</tr>
					</thead>
					<tbody>
						{#each data.uids as email (email)}
							<tr>
								<td class="modifiedTd breakWord">{email}</td>
								<td class="modifiedTd zeroWidth zeroWidthPadding">
									{#if user && email == user.email}
										<kbd
											class="floatRight"
											on:click|stopPropagation={startLeavingList}
											on:keydown|stopPropagation={startLeavingList}
											style="cursor: pointer;">Leave</kbd
										>
									{:else}
										<kbd
											class="floatRight"
											on:click|stopPropagation={startRemovingList(email)}
											on:keydown|stopPropagation={startRemovingList(email)}
											style="cursor: pointer;">Remove</kbd
										>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</article>
		</Modal>

		<Modal bind:showModal={showEditListModal}>
			<article class="zeroBottomPadding smallArticleTopPadding">
				<form method="POST" on:submit|preventDefault={editList}>
					<h1 class="zeroBottomMargin"><label for="editList">Update list</label></h1>
					<input
						type="text"
						id="editList"
						name="editList"
						placeholder="List name"
						required
						autocomplete="off"
						spellcheck="true"
						bind:value={editingListName}
					/>

					{#if todos.length > 0}
						<input
							class="eightyWidthWithSpace floatLeft halfEmBottomMargin"
							type="submit"
							value="Update"
						/>
						<input
							class="twentyWidthWithSpace floatRight halfEmBottomMargin"
							type="reset"
							value="&#128465;"
							on:click|preventDefault={startDeletingList}
						/>

						{#key notAllFinished && markingFinishing}
							<input
								class="floatRight zeroPadding"
								type="reset"
								value={markingFinishing
									? 'Mark all as ........'
									: notAllFinished
									? 'Mark all as done'
									: 'Mark all as todo'}
								on:click|preventDefault={toggleFinishedAll}
							/>
						{/key}
					{:else}
						<input
							class="eightyWidthWithSpace floatLeft zeroPadding"
							type="submit"
							value="Update"
						/>
						<input
							class="twentyWidthWithSpace floatRight zeroPadding"
							type="reset"
							value="&#128465;"
							on:click|preventDefault={startDeletingList}
						/>
					{/if}
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showDeleteListModal}>
			<article class="zeroBottomPadding smallArticleTopPadding">
				<form method="POST" on:submit|preventDefault|stopPropagation={deleteList}>
					<h1 class="zeroBottomMargin">
						<label for="deleteList">Delete list</label>
					</h1>
					<label for="deleteList">
						Deleting a list will also delete it for all users who have access to it. Are
						you sure you want to delete this list?
						<input
							type="checkbox"
							role="switch"
							id="deleteList"
							name="deleteList"
							bind:checked={deletingListConfirmation}
						/>
					</label>
					<input
						class="floatRight"
						type="submit"
						value="Delete"
						disabled={!deletingListConfirmation}
					/>
				</form>
			</article>
		</Modal>

		{#if user}
			<Modal bind:showModal={showSignoutModal}>
				<article class="zeroBottomPadding">
					<form method="POST" on:submit|preventDefault={signOutAndBackToHome}>
						<h1 class="zeroBottomMargin">
							<label for="deleteList">Sign out?</label>
						</h1>
						<p>Currently signed in as {user.displayName}</p>
						<br />

						<input type="submit" value="Sign out" />
					</form>
				</article>
			</Modal>
		{/if}
	{/if}
</main>
