<script>
	import { createTodo } from "$lib/firebase/firebase";

	export let data;

	let todos = data.todos;

	let addTodoText;

	function addTodo() {
		const todo = {
			Name: addTodoText,
			Finished: false
		}
		createTodo(todo);
	}
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
		<ul>
			{#each todos as todo}
				<li>
					<div>
						{todo.Name}
						{todo.Finished ? '✅' : '[X]' }
					</div>
				</li>
			{/each}
		</ul>
	{:else}
		<p>No todos yet!</p>
	{/if}

	<form action="?/newTodo" method="POST" on:submit|preventDefault={addTodo}>
		<label for="addTodo">Add todo</label>
		<input type="text" id="addTodo" name="addTodo" placeholder="New todo" required bind:value={addTodoText} />
		<input type="submit" value="Create" />
	</form>

</main>
