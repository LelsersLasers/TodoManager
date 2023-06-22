// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
} from 'firebase/firestore';

import { fail } from '@sveltejs/kit';
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const mainCollectionId = 'lists';
const mainCollection = collection(db, mainCollectionId);
const mainCollectionQuery = query(mainCollection, orderBy('timestamp', 'desc'));

const subCollectionId = 'todos';
const subCollectionQueryParams = [orderBy('finished'), orderBy('timestamp', 'desc')];

export async function getMainCollection() {
	const snapshot = await getDocs(mainCollectionQuery);

	if (!snapshot.empty) {
		const docs = snapshot.docs;
		const docData = docs.map((d) => {
			return {
				...d.data(),
				id: d.id
			};
		});
		return docData;
	} else {
		return [];
	}
}

export async function createMainCollection(name) {
	const trimedName = name.trim();
	if (!trimedName || trimedName.length === 0) {
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


async function getSubCollectionSnapshot(id) {
	const subCollection = collection(db, mainCollectionId, id, subCollectionId);
	const subCollectionQuery = query(subCollection, ...subCollectionQueryParams);
	const snapshot = await getDocs(subCollectionQuery);
	return snapshot;
}

export async function getSubCollection(id) {
	const snapshot = await getSubCollectionSnapshot(id);

	if (!snapshot.empty) {
		const docs = snapshot.docs;
		const docData = docs.map((d) => {
			return {
				...d.data(),
				id: d.id
			};
		});
		return docData;
	} else {
		return [];
	}
}

`
db format:

lists: 
	- auto id
	- name
	- timestamp (sorted by this)
	- count (number of todos)
	- todos:
		- auto id
		- name
		- timestamp (sorted by this - 2)
		- finished (sorted by this - desc - 1)
`;
