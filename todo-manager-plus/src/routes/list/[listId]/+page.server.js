import { getMainCollectionDoc } from '$lib/firebase/firebase.js';


export const load = async ({ params }) => {
	const { listId } = params;
	const listData = await getMainCollectionDoc(listId);

	const timestampDate = listData.timestamp.toDate();
	const createdOn = `${timestampDate.getMonth() + 1}/${timestampDate.getDate()}/${timestampDate.getFullYear()}`;

	return {
		count: listData.count,
		name: listData.name,
		createdOn
	};
};