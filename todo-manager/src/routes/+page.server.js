// import { getTodos, createTodo } from '$lib/firebase/firebase'
// import { fail } from '@sveltejs/kit';

// export const actions = {
// 	// newTodo: async ({ request }) => {
// 	// 	const formData = await request.formData();
// 	// 	const Name = formData.get("addTodo");

// 	// 	if (!Name || Name.length == 0) {
// 	// 		return fail(400);
// 	// 	}

// 	// 	const todo = {
// 	// 		Name,
// 	// 		Finished: false
// 	// 	}
// 	// 	createTodo(todo);
// 	// }
// }

import { getTodos } from '$lib/firebase/firebase';
export const load = async () => {
	const todos = (await getTodos()).map((t) => {
		// WHY IS THIS NEEDED????????
		const obj = {};
		for (let key in t) {
			if (key == 'Timestamp') {
				obj[key] = t[key].toString();
			} else {
				obj[key] = t[key];
			}
		}
		return obj;
	});

	return {
		todos
	};
};
