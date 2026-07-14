import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBD1fVKMQDypIwq6PmoUgAVifuzua1F5N8",
  authDomain: "mobi-c064c.firebaseapp.com",
  projectId: "mobi-c064c",
  storageBucket: "mobi-c064c.firebasestorage.app",
  messagingSenderId: "964234380308",
  appId: "1:964234380308:web:84e56e1f6ae92917dfd301",
  measurementId: "G-JLS1F9808X"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

export default app;
