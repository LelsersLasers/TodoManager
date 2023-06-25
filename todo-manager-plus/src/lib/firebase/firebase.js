import { initializeApp } from 'firebase/app';
import {
	getFirestore,
	collection,
	getDocs,
	query,
	orderBy,
	where,
	addDoc,
	onSnapshot,
	serverTimestamp,
	doc,
	updateDoc,
	deleteDoc,
	getDoc,
	setDoc,
	increment
} from 'firebase/firestore';
import {
	getAuth,
	onAuthStateChanged,
	signInWithPopup,
	signOut,
	GoogleAuthProvider
} from 'firebase/auth';

import { writable } from 'svelte/store';

import { fail, redirect } from '@sveltejs/kit';
import { goto } from '$app/navigation';

// Your web app's Firebase configuration
const firebaseConfig = {
	apiKey: 'AIzaSyAyj9y8A9L9k65mKivTCzfaZDKRqnIBQzo',
	authDomain: 'todo-manager-lelserslasers.firebaseapp.com',
	databaseURL: 'https://todo-manager-lelserslasers-default-rtdb.firebaseio.com',
	projectId: 'todo-manager-lelserslasers',
	storageBucket: 'todo-manager-lelserslasers.appspot.com',
	messagingSenderId: '94257088353',
	appId: '1:94257088353:web:e172dc575e417731a36720'
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

let user = null;
export const currentUserStore = writable(user);
onAuthStateChanged(auth, (u) => {
	user = u;
	currentUserStore.set(user);
});

export async function signInWithGoogle() {
	await signInWithPopup(auth, provider);
}

export async function signOutWithGoogle() {
	await signOut(auth);
}

const db = getFirestore(app);

const mainCollectionId = 'lists';
const mainCollection = collection(db, mainCollectionId);
const mainCollectionQueryParams = [orderBy('timestamp', 'desc')];

const subCollectionId = 'todos';
const subCollectionQueryParams = [orderBy('finished'), orderBy('timestamp', 'desc')];

function getMainCollectionQuery() {
	const mainCollectionQuery = query(
		mainCollection,
		...mainCollectionQueryParams,
		where('uids', 'array-contains', user.email)
	);
	return mainCollectionQuery;
}

// export async function getMainCollection() {
// 	const snapshot = await getDocs(mainCollectionQuery);

// 	if (!snapshot.empty) {
// 		const docs = snapshot.docs;
// 		const docData = docs.map((d) => {
// 			return {
// 				...d.data(),
// 				id: d.id
// 			};
// 		});
// 		return docData;
// 	} else {
// 		return [];
// 	}
// }

export async function getMainCollectionDoc(id) {
	const docRef = doc(db, mainCollectionId, id);
	const docSnap = await getDoc(docRef);

	if (docSnap.exists()) {
		return {
			...docSnap.data(),
			id: docSnap.id
		};
	} else {
		throw redirect(302, '/');
	}
}

export async function createMainCollection(name) {
	const trimedName = name.trim();
	if (!trimedName || trimedName.length == 0) {
		throw fail(400, { message: 'Name is required' });
	}

	const docData = {
		name: trimedName,
		count: 0,
		uids: [user.email],
		timestamp: serverTimestamp()
	};
	addDoc(mainCollection, docData).then((docRef) => goto(`/list/${docRef.id}`));
}

export async function deleteMainCollection(id) {
	const subCollectionSnapshot = await getSubCollectionSnapshot(id);
	if (!subCollectionSnapshot.empty) {
		const subCollectionDocs = subCollectionSnapshot.docs;
		subCollectionDocs.forEach((d) => {
			deleteDoc(d.ref);
		});
	}

	const docRef = doc(db, mainCollectionId, id);
	await deleteDoc(docRef);
}

export async function updateMainCollection(id, newName) {
	const docRef = doc(db, mainCollectionId, id);
	await updateDoc(docRef, {
		name: newName
	});
}

export async function shareMainCollection(id, email) {
	const docRef = doc(db, mainCollectionId, id);
	const docSnap = await getDoc(docRef);
	if (docSnap.exists()) {
		const docData = docSnap.data();
		const oldUids = docData.uids;
		if (oldUids.includes(email)) {
			throw fail(400, { message: `Already shared with ${email}` });
		}
		const newUids = [...oldUids, email];
		await updateDoc(docRef, {
			uids: newUids
		});
	}

	// update sub collection docs also
	const subCollectionSnapshot = await getSubCollectionSnapshot(id);
	if (!subCollectionSnapshot.empty) {
		const subCollectionDocs = subCollectionSnapshot.docs;
		subCollectionDocs.forEach(async (d) => {
			const subDocRef = doc(db, mainCollectionId, id, subCollectionId, d.id);
			const subDocSnap = await getDoc(subDocRef);
			const subDocData = subDocSnap.data();
			const oldUids = subDocData.uids;
			const newUids = [...oldUids, email];
			updateDoc(subDocRef, {
				uids: newUids
			});
		});
	}
}

export async function leaveMainCollection(id) {
	const docRef = doc(db, mainCollectionId, id);
	const docSnap = await getDoc(docRef);
	if (docSnap.exists()) {
		const docData = docSnap.data();
		const oldUids = docData.uids;
		const newUids = oldUids.filter((uid) => uid !== user.email);
		if (newUids.length === 0) {
			await deleteMainCollection(id);
			return;
		}
		await updateDoc(docRef, {
			uids: newUids
		});
	}

	// update sub collection docs also
	const subCollectionSnapshot = await getSubCollectionSnapshot(id);
	if (!subCollectionSnapshot.empty) {
		const subCollectionDocs = subCollectionSnapshot.docs;
		subCollectionDocs.forEach(async (d) => {
			const subDocRef = doc(db, mainCollectionId, id, subCollectionId, d.id);
			const subDocSnap = await getDoc(subDocRef);
			const subDocData = subDocSnap.data();
			const oldUids = subDocData.uids;
			const newUids = oldUids.filter((uid) => uid !== user.email);
			updateDoc(subDocRef, {
				uids: newUids
			});
		});
	}
}

export async function listenerMainCollection(postMapCallback) {
	const mainCollectionQuery = getMainCollectionQuery();
	const unsubscribe = onSnapshot(mainCollectionQuery, (querySnapshot) => {
		const arr = querySnapshot.docs.map((d) => {
			return {
				...d.data(),
				id: d.id
			};
		});
		postMapCallback(arr);
	});
	return unsubscribe;
}

function getSubCollectionQuery(id) {
	const subCollection = collection(db, mainCollectionId, id, subCollectionId);
	const subCollectionQuery = query(
		subCollection,
		...subCollectionQueryParams,
		where('uids', 'array-contains', user.email)
	);
	return subCollectionQuery;
}

async function getSubCollectionSnapshot(id) {
	const subCollectionQuery = getSubCollectionQuery(id);
	const snapshot = await getDocs(subCollectionQuery);
	return snapshot;
}

// export async function getSubCollection(id) {
// 	const snapshot = await getSubCollectionSnapshot(id);

// 	if (!snapshot.empty) {
// 		const docs = snapshot.docs;
// 		const docData = docs.map((d) => {
// 			return {
// 				...d.data(),
// 				id: d.id
// 			};
// 		});
// 		return docData;
// 	} else {
// 		return [];
// 	}
// }

export async function createSubCollection(id, name) {
	const trimedName = name.trim();
	if (!trimedName || trimedName.length == 0) {
		throw fail(400, { message: 'Name is required' });
	}

	const docData = {
		name: trimedName,
		finished: false,
		// uids: [user.email], // Doesn't work, need to get the doc first
		timestamp: serverTimestamp()
	};

	const docRef = doc(db, mainCollectionId, id);
	const docSnap = await getDoc(docRef);
	if (!docSnap.exists()) {
		throw fail(404, { message: 'List not found' });
	}
	const mainCollectionData = docSnap.data();

	const subCollectionDoc = doc(collection(db, mainCollectionId, id, subCollectionId));
	await setDoc(subCollectionDoc, {
		...docData,
		id: subCollectionDoc.id,
		uids: mainCollectionData.uids
	});

	// update list.count
	await updateDoc(docRef, {
		count: increment(1)
	});
}

export async function deleteSubCollection(id, subId) {
	const docRef = doc(db, mainCollectionId, id, subCollectionId, subId);
	await deleteDoc(docRef);

	// update list.count
	const docRef2 = doc(db, mainCollectionId, id);
	await updateDoc(docRef2, {
		count: increment(-1)
	});
}

export async function updateSubCollection(id, subId, newName) {
	const docRef = doc(db, mainCollectionId, id, subCollectionId, subId);
	await updateDoc(docRef, {
		name: newName
	});
}

export async function updateSubCollectionFinished(id, subId, newFinished) {
	const docRef = doc(db, mainCollectionId, id, subCollectionId, subId);
	await updateDoc(docRef, {
		finished: newFinished,
		timestamp: serverTimestamp()
	});
}

export async function listenerSubCollection(id, postMapCallback) {
	const subCollectionQuery = getSubCollectionQuery(id);
	const unsubscribe = onSnapshot(subCollectionQuery, (querySnapshot) => {
		const arr = querySnapshot.docs.map((d) => {
			return {
				...d.data(),
				id: d.id
			};
		});
		postMapCallback(arr);
	});
	return unsubscribe;
}

`
db format:

lists: 
	- auto id
	- name
	- timestamp (sorted by this)
	- count (number of todos)
    - uids (array of emails)
	- todos:
		- auto id
		- name
		- timestamp (sorted by this - 2)
		- finished (sorted by this - desc - 1)
        - uids (array of emails)
`;
