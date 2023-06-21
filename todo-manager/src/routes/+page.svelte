<script>
	import { createTodo, setFinished, createListener } from '$lib/firebase/firebase';
	import { onDestroy, onMount } from 'svelte';

	export let data;

	let todos = data.todos;

	let addTodoText;

	let unsub;
	onMount(() => {
		unsub = createListener(
			(x) => x,
			(arr) => (todos = arr)
		);
	});

	onDestroy(() => {
		if (unsub) unsub();
	});

	function addTodo() {
		const todo = {
			Name: addTodoText,
			Finished: false
		};
		createTodo(todo);
		addTodoText = '';
	}

	// function updateTodo(id, checked) {
	// 	// TODO
	// }
</script>

<header>
	<hgroup>
		<h1>Todo Manager</h1>
		<h2>Manage your todos with ease</h2>
	</hgroup>
</header>

<main>
	<h3>Todos</h3>

	{#if todos.length > 0}
		<table>
			<tr>
				<th>Name</th>
				<th>Finished</th>
			</tr>
			{#each todos as todo}
				<tr>
					<th>{todo.Name}</th>
					<th>
						<input
							type="checkbox"
							bind:checked={todo.Finished}
							on:change={setFinished(todo.id, todo.Finished)}
						/>
					</th>
				</tr>
			{/each}
		</table>
	{:else}
		<p>No todos yet!</p>
	{/if}

	<form method="POST" on:submit|preventDefault={addTodo}>
		<label for="addTodo">Add todo</label>
		<input
			type="text"
			id="addTodo"
			name="addTodo"
			placeholder="New todo"
			required
			bind:value={addTodoText}
		/>
		<input type="submit" value="Create" />
	</form>
</main>
