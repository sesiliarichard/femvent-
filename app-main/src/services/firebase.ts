import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyBD1fVKMQDypIwq6PmoUgAVifuzua1F5N8",
  authDomain: "mobi-c064c.firebaseapp.com",
  projectId: "mobi-c064c",
  storageBucket: "mobi-c064c.firebasestorage.app",
  messagingSenderId: "964234380308",
  appId: "1:964234380308:web:84e56e1f6ae92917dfd301",
  measurementId: "G-JLS1F9808X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence (with error handling)
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error: any) {
  // If auth is already initialized, get the existing instance
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    console.error('Firebase Auth initialization error:', error);
    // Fallback to getAuth if initializeAuth fails
    auth = getAuth(app);
  }
}

// Initialize Firestore with better error handling
const db = getFirestore(app);

// Configure Firestore settings for better reliability
if (Platform.OS === 'web') {
  // Web-specific configuration
  import('firebase/firestore').then(({ enableNetwork, disableNetwork }) => {
    // Enable offline persistence
    enableNetwork(db).catch((error) => {
      console.warn('Failed to enable Firestore network:', error);
    });
  });
}

// Initialize other services
const storage = getStorage(app);
const functions = getFunctions(app);

// Connection monitoring
let isConnected = true;
let connectionRetries = 0;
const maxRetries = 3;

export const checkConnection = async () => {
  try {
    await enableNetwork(db);
    isConnected = true;
    connectionRetries = 0;
    console.log('Firestore connection restored');
    return true;
  } catch (error) {
    console.error('Failed to restore Firestore connection:', error);
    isConnected = false;
    return false;
  }
};

export const retryConnection = async (): Promise<boolean> => {
  if (connectionRetries >= maxRetries) {
    console.log('Max connection retries reached, giving up');
    return false;
  }

  connectionRetries++;
  console.log(`Retrying Firestore connection (attempt ${connectionRetries}/${maxRetries})`);

  // Wait before retry (exponential backoff)
  const delay = Math.pow(2, connectionRetries) * 1000;
  await new Promise(resolve => setTimeout(resolve, delay));

  return await checkConnection();
};

export const getConnectionStatus = () => isConnected;
export const getConnectionRetries = () => connectionRetries;

export { auth, db, storage, functions };
export default app;