import { getTodos, createTodo } from '$lib/firebase/firebase'

export const actions = {
	newTodo: async ({ request }) => {
		const formData = await request.formData();
		const Name = formData.get("addTodo");
		const todo = {
			Name,
			Finished: false
		}
		createTodo(todo);
	}
}

export const load = async () => {
	const todos = getTodos();
	return {
		todos
	}
}