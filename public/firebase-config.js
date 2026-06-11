// Import the core Firebase SDK and services
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBaTQchEmlHPHQjZ4a3-9JzdHA-DbYpt40",
  authDomain: "campusissuesystem.firebaseapp.com",
  projectId: "campusissuesystem",
  storageBucket: "campusissuesystem.firebasestorage.app",
  messagingSenderId: "121004564693",
  appId: "1:121004564693:web:6786c69b8b660a8a52c25c"
};

// Initialize and export for use in script.js
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);