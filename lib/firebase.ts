
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Use environment variables (process.env or import.meta.env depending on your bundler)
// For this environment, we expect them to be available globally or via process.env
const firebaseConfig = {
  apiKey: (window as any).process?.env?.VITE_FIREBASE_API_KEY || "AIzaSy...",
  authDomain: (window as any).process?.env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (window as any).process?.env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: (window as any).process?.env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: (window as any).process?.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: (window as any).process?.env?.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
