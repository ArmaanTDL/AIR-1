// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBZ7Wx2Aqq603ncc_pafMPpa1fR-fiq6CM",
  authDomain: "trackos-dfcea.firebaseapp.com",
  projectId: "trackos-dfcea",
  storageBucket: "trackos-dfcea.firebasestorage.app",
  messagingSenderId: "154400846563",
  appId: "1:154400846563:web:0349a43b6bd47a2ede0bd6",
  measurementId: "G-JDXTB8BLGH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
