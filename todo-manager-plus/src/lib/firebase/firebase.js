import { initializeApp } from 'firebase/app';
import {
	getFirestore,
	collection,
	getDocs,
	query,
	orderBy,
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

export const currentUserStore = writable(null);
onAuthStateChanged(auth, (u) => currentUserStore.set(u));

export async function signInWithGoogle() {
	await signInWithPopup(auth, provider);
}

export async function signOutWithGoogle() {
	await signOut(auth);
}

const db = getFirestore(app);

const mainCollectionId = 'lists';
const mainCollection = collection(db, mainCollectionId);
const mainCollectionQuery = query(mainCollection, orderBy('timestamp', 'desc'));

const subCollectionId = 'todos';
const subCollectionQueryParams = [orderBy('finished'), orderBy('timestamp', 'desc')];

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
		throw redirect(404, '/');
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

export async function listenerMainCollection(postMapCallback) {
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
	const subCollectionQuery = query(subCollection, ...subCollectionQueryParams);
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
		timestamp: serverTimestamp()
	};

	const subCollectionDoc = doc(collection(db, mainCollectionId, id, subCollectionId));
	await setDoc(subCollectionDoc, {
		...docData,
		id: subCollectionDoc.id
	});

	// update list.count
	const docRef = doc(db, mainCollectionId, id);
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
    - users (array of user uids)
	- todos:
		- auto id
		- name
		- timestamp (sorted by this - 2)
		- finished (sorted by this - desc - 1)
`;
