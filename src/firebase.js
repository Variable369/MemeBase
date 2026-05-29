import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC1pPkpOPQAYlft9SfPngTmbVCdAq22n9s",
  authDomain: "memebase369.firebaseapp.com",
  projectId: "memebase369",
  storageBucket: "memebase369.firebasestorage.app",
  messagingSenderId: "953818398093",
  appId: "1:953818398093:web:760c468489c272b52551c4"
};

// Nastartování Firebase
const app = initializeApp(firebaseConfig);

// Otevření spojení
export const db = getFirestore(app);
export const auth = getAuth(app); 