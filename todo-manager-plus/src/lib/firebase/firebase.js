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

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export function listenerOnAuthStateChanged(callback) {
	const unsubscribe = onAuthStateChanged(auth, callback);
	return unsubscribe;
}

export async function signInWithGoogle() {
	await signInWithPopup(auth, provider);
}

export async function signOutWithGoogle() {
	await signOut(auth);
}

`
db format:

lists: 
	- auto id
	- name
	- timestamp (sorted by this - 2)
	- count (number of todos)
    - countTodo (number of unfinished todos)
    - order (sorted by this - 1)
    - uids (array of emails)
	- todos:
		- auto id
		- name
		- timestamp (sorted by this - 3)
		- finished (sorted by this - desc - 2)
        - order (sorted by this - 1)
        - uids (array of emails)
`;

const db = getFirestore(app);

const mainCollectionId = 'lists';
const mainCollection = collection(db, mainCollectionId);
const mainCollectionQueryParams = [
	orderBy('order'),
	orderBy('timestamp', 'desc'),
	// these are just to make sure the data contains these fields
    orderBy('countTodo'),
	orderBy('count'),
	orderBy('name')
];

const subCollectionId = 'todos';
const subCollectionQueryParams = [
	orderBy('finished'),
	orderBy('order'),
	orderBy('timestamp', 'desc'),
	// these are just to make sure the data contains these fields
	orderBy('name')
];

function getMainCollectionQuery() {
	const mainCollectionQuery = query(
		mainCollection,
		...mainCollectionQueryParams,
		where('uids', 'array-contains', auth.currentUser.email)
	);
	return mainCollectionQuery;
}

export async function createMainCollection(name) {
	const trimedName = name.trim();
	if (!trimedName || trimedName.length == 0) {
		throw fail(400, { message: 'Name is required' });
	}

	const docData = {
		name: trimedName,
		count: 0,
        countTodo: 0,
		order: 0,
		uids: [auth.currentUser.email],
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
	const trimedName = newName.trim();
	if (!trimedName || trimedName.length == 0) {
		throw fail(400, { message: 'Name is required' });
	}

	const docRef = doc(db, mainCollectionId, id);
	await updateDoc(docRef, {
		name: trimedName
	});
}

export async function updateMainCollectionOrder(id, newOrder) {
	const docRef = doc(db, mainCollectionId, id);
	await updateDoc(docRef, {
		order: newOrder
	});
}

export async function shareMainCollection(id, email) {
	const docRef = doc(db, mainCollectionId, id);
	const docSnap = await getDoc(docRef);
	if (docSnap.exists()) {
		const docData = docSnap.data();
		const oldUids = docData.uids;
		if (oldUids.includes(email)) {
			// throw fail(400, { message: `Already shared with ${email}` });
			return;
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
		const newUids = oldUids.filter((uid) => uid !== auth.currentUser.email);
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
			const newUids = oldUids.filter((uid) => uid !== auth.currentUser.email);
			updateDoc(subDocRef, {
				uids: newUids
			});
		});
	}
}

export async function removeShareMainCollection(id, email) {
	const docRef = doc(db, mainCollectionId, id);
	const docSnap = await getDoc(docRef);
	if (docSnap.exists()) {
		const docData = docSnap.data();
		const oldUids = docData.uids;
		const newUids = oldUids.filter((uid) => uid !== email);
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
			const newUids = oldUids.filter((uid) => uid !== email);
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

async function safeToCreateListenerMainCollectionDoc(id) {
	try {
		const docRef = doc(db, mainCollectionId, id);
		const docSnap = await getDoc(docRef);
		return docSnap.exists();
	} catch (err) {
		return false;
	}
}

export async function listenerMainCollectionDoc(id, postMapCallback, redirectCallback) {
	const safe = await safeToCreateListenerMainCollectionDoc(id);
	if (safe) {
		const docRef = doc(db, mainCollectionId, id);
		const unsubscribe = onSnapshot(docRef, (docSnap) => {
			if (docSnap.exists()) {
				const docData = {
					...docSnap.data(),
					id: docSnap.id
				};
				postMapCallback(docData);
			} else {
				redirectCallback();
				return () => {};
			}
		});
		return unsubscribe;
	} else {
		redirectCallback();
		return () => {};
	}
}

function getSubCollectionQuery(id) {
	const subCollection = collection(db, mainCollectionId, id, subCollectionId);
	const subCollectionQuery = query(
		subCollection,
		...subCollectionQueryParams,
		where('uids', 'array-contains', auth.currentUser.email)
	);
	return subCollectionQuery;
}

async function getSubCollectionSnapshot(id) {
	const subCollectionQuery = getSubCollectionQuery(id);
	const snapshot = await getDocs(subCollectionQuery);
	return snapshot;
}

export async function createSubCollection(id, name) {
	const trimedName = name.trim();
	if (!trimedName || trimedName.length == 0) {
		throw fail(400, { message: 'Name is required' });
	}

	const docData = {
		name: trimedName,
		finished: false,
		order: 0,
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
		count: increment(1),
        countTodo: increment(1)
	});
}

export async function deleteSubCollection(id, subId) {
	const docRef = doc(db, mainCollectionId, id, subCollectionId, subId);
    const docSnap = await getDoc(docRef);
    const docData = docSnap.data();

	await deleteDoc(docRef);

	// update list.count
	const docRef2 = doc(db, mainCollectionId, id);
	await updateDoc(docRef2, {
		count: increment(-1)
	});

    // if deleted doc is not finished, update countTodo
    if (!docData.finished) {
        await updateDoc(docRef2, {
            countTodo: increment(-1)
        });
    }
}

export async function updateSubCollection(id, subId, newName) {
	const trimedName = newName.trim();
	if (!trimedName || trimedName.length == 0) {
		throw fail(400, { message: 'Name is required' });
	}

	const docRef = doc(db, mainCollectionId, id, subCollectionId, subId);
	await updateDoc(docRef, {
		name: trimedName
	});
}

export async function updateSubCollectionFinished(id, subId, newFinished) {
	const docRef = doc(db, mainCollectionId, id, subCollectionId, subId);

	await updateDoc(docRef, {
		finished: newFinished,
		timestamp: serverTimestamp()
	});

    // update list.countTodo
    const docRef2 = doc(db, mainCollectionId, id);
    await updateDoc(docRef2, {
        countTodo: newFinished ? increment(-1) : increment(1)
    });
}

export async function updateSubCollectionOrder(id, subId, newOrder) {
	const docRef = doc(db, mainCollectionId, id, subCollectionId, subId);
	await updateDoc(docRef, {
		order: newOrder
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
