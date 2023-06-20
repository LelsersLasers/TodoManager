<script>
	export let data;

	function clearTextInput() {
		document.getElementById("addTodo").value = "";
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

	{#if data.todos.length > 0}
		<ul>
			{#each data.todos as todo}
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

	<form action="?/newTodo" method="POST">
		<label for="addTodo">Add todo</label>
		<input type="text" id="addTodo" name="addTodo" placeholder="New todo" required />
		<input type="submit" value="Create" />
	</form>

</main>
