// import { getMainCollectionDoc } from '$lib/firebase/firebase.js';

export const load = async ({ params }) => {
	const { listId } = params;

	return {
		listId
	};
};
