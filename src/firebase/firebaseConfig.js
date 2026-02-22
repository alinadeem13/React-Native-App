import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuth } from "firebase/auth";
import { initializeAuth, getReactNativePersistence } from "@firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCAjxZQu7Fx8_81Og-Gw32qx7WguP86Fj8",
  authDomain: "react-native-app-1e55a.firebaseapp.com",
  projectId: "react-native-app-1e55a",
  storageBucket: "react-native-app-1e55a.firebasestorage.app",
  messagingSenderId: "934177790688",
  appId: "1:934177790688:android:96a02a92da9d94aaf98e85"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch {
  auth = getAuth(app);
}

const db = getFirestore(app);

export { db, auth };
