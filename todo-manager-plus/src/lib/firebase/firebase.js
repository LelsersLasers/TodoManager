// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import {
	getFirestore
	// collection,
	// getDocs,
	// query,
	// orderBy,
	// addDoc,
	// onSnapshot,
	// serverTimestamp,
	// doc,
	// updateDoc
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
