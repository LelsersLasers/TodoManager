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
	import { goto } from '$app/navigation';

	import Modal from '$lib/components/Modal.svelte';

	let showCreateTodoModal = false;

	let showEditTodoModal = false;
	let editingTodoId = '';
	let editingTodoName = '';

	let showDeleteTodoModal = false;
	let deletingTodoId = '';
	let deletingTodoConfirmation = false;

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

	function startDeletingTodo(id) {
		deletingTodoId = id;
		showDeleteTodoModal = true;
	}
	function deleteTodo() {
		deleteSubCollection(data.id, deletingTodoId);

		deletingTodoId = '';
		deletingTodoConfirmation = false;
		showDeleteTodoModal = false;
	}

	function backToHome() {
		goto('/');
	}
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
						<th class="zeroWidth zeroWidthPadding"><strong>Done</strong></th>
						<th />
						<th />
					</tr>
				</thead>
				<tbody>
					{#each todos as todo}
						<tr>
							<td>
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
									style="cursor: pointer;">Delete</kbd
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

		<div class="stickyFooter zeroBottomMargin nintyWidth">
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
					<input type="submit" value="Create" />
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
					<input type="submit" value="Update" />
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

					<input type="submit" value="Delete" disabled={!deletingTodoConfirmation} />
				</form>
			</article>
		</Modal>
	{/if}
</main>
