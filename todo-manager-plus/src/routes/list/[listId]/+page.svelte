<script>
	export let data;
	import {
		listenerSubCollection,
		createSubCollection,
		updateSubCollection,
		updateSubCollectionFinished,
		deleteSubCollection
	} from '$lib/firebase/firebase';
	import { onDestroy, onMount } from 'svelte';
	// import { goto } from '$app/navigation';

	import Modal from '$lib/components/Modal.svelte';

	let showCreateTodoModal = false;

	let showEditTodoModal = false;
	let editingTodoId = '';
	let editingTodoName = '';

	// let showDeleteListModal = false;
	// let deletingListId = '';
	// let deletingListConfirmation = false;

	let snapshotLoading = true;

	let todos = [];
	let unsubFromTodos = () => {};
	onMount(() => {
		unsubFromTodos = listenerSubCollection(data.id, (arr) => {
			todos = arr;
			if (snapshotLoading) snapshotLoading = false;
		});
	});
	onDestroy(unsubFromTodos);

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

	// function startDeletingList(id) {
	// 	deletingListId = id;
	// 	showDeleteListModal = true;
	// }
	// function deleteList() {
	// 	deleteMainCollection(deletingListId);

	// 	deletingListId = '';
	// 	deletingListConfirmation = false;
	// 	showDeleteListModal = false;
	// }

	// function redirectToList(id) {
	// 	goto(`/list/${id}`);
	// }
</script>

<header class="zeroBottomPadding">
	<hgroup>
		<h1>{data.name}</h1>
		<h2>Created on {data.createdOn}</h2>
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
			<table>
				<thead>
					<tr>
						<th><strong>Name</strong></th>
						<th><strong>Finished</strong></th>
						<th />
						<th />
					</tr>
				</thead>
				<tbody>
					{#each todos as todo}
						<tr>
							<td>{todo.name}</td>
							<td class="zeroWidth">
								<input
									type="checkbox"
									bind:checked={todo.finished}
									on:change={updateTodoFinished(todo.id, todo.finished)}
								/>
							</td>
							<td class="zeroWidth">
									<kbd
										on:click|stopPropagation={startEditingTodo(todo.id, todo.name)}
										on:keydown|stopPropagation={startEditingTodo(todo.id, todo.name)}
										style="cursor: pointer;">Edit</kbd
									>
								</td>
								<!-- <td class="zeroWidth">
									<kbd
										on:click|stopPropagation={startDeletingList(list.id)}
										on:keydown|stopPropagation={startDeletingList(list.id)}
										style="cursor: pointer;">Delete</kbd
									>
								</td> -->
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
					button to get started!
				</p>
			</article>
		{/if}

		<button
			class="stickyFooter zeroBottomMargin eightyWidth"
			on:click={() => (showCreateTodoModal = true)}>Create new todo</button
		>

		<Modal bind:showModal={showCreateTodoModal}>
			<article class="zeroBottomPadding">
				<form method="POST" on:submit|preventDefault={createTodo}>
					<label for="createTodo">Create todo</label>
					<input
						type="text"
						id="createTodo"
						name="createTodo"
						placeholder="Todo item name"
						required
						autocomplete="off"
						bind:value={createTodoText}
					/>
					<input type="submit" value="Create" />
				</form>
			</article>
		</Modal>

		<Modal bind:showModal={showEditTodoModal}>
			<article class="zeroBottomPadding">
				<form method="POST" on:submit|preventDefault={editList}>
					<label for="editTodo">Update todo item name</label>
					<input
						type="text"
						id="editTodo"
						name="editTodo"
						placeholder="Todo item name"
						required
						autocomplete="off"
						bind:value={editingTodoName}
					/>
					<input type="submit" value="Update" />
				</form>
			</article>
		</Modal>

		<!-- <Modal bind:showModal={showDeleteListModal}>
			<article class="zeroBottomPadding">
				<form method="POST" on:submit|preventDefault={deleteList}>
					<label for="deleteList">Delete todo list</label>

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
		</Modal> -->
	{/if}
</main>
