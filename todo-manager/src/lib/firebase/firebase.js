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
	updateDoc
} from 'firebase/firestore';

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

const todosCol = collection(db, 'todo');
const q = query(todosCol, orderBy('Finished'), orderBy('Timestamp', 'desc'));

export async function getTodos() {
	const snapshot = await getDocs(q);

	if (!snapshot.empty) {
		const docs = snapshot.docs;
		const docData = docs.map((d) => {
			return {
				...d.data(),
				id: d.id
			};
		});

		// console.log(docs);

		return docData;
	} else {
		return [];
	}
}

export async function createTodo(todo) {
	const todoWithTimestamp = {
		...todo,
		Timestamp: serverTimestamp()
	};
	const doc = await addDoc(todosCol, todoWithTimestamp);
	return doc;
}

export async function setFinished(id, finished) {
	const docRef = doc(db, 'todo', id);
	await updateDoc(docRef, {
		Finished: finished
	});
}

// export function set

export function createListener(mapCallback, postMapCallback) {
	const unsubscribe = onSnapshot(q, (querySnapshot) => {
		const arr = querySnapshot.docs
			.map((d) => {
				return {
					...d.data(),
					id: d.id
				};
			})
			.map(mapCallback);
		postMapCallback(arr);
	});
	return unsubscribe;
}
