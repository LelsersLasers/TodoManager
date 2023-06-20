<script lang="ts">
	let todos = [
		{ id: 1, title: 'Buy milk' },
		{ id: 2, title: 'Buy cheese' },
		{ id: 3, title: 'Buy bread' },
	];
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
					{todo.title}
					<!-- TODO! -->
				</li>
			{/each}
		</ul>
	{:else}
		<p>No todos yet!</p>
	{/if}

	<label for="addTodo">Add todo</label>
	<input type="text" id="addTodo" name="addTodo" placeholder="New todo" required />
	<input type="submit" value="Create" />

</main>
