// -------------------------------------------------------
// 🔥 CONFIG FIREBASE
// -------------------------------------------------------
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "TA-CLE-ICI",
  authDomain: "TON-PROJET.firebaseapp.com",
  projectId: "TON-PROJET",
  storageBucket: "TON-PROJET.appspot.com",
  messagingSenderId: "xxxxxxx",
  appId: "xxxxxxx",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
