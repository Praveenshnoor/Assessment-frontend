import { initializeApp } from 'firebase/app';
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDyURfwNaIbNCMvjvOlr_lja9cf7NVPYSY",
    authDomain: "assignment-portal-556d9.firebaseapp.com",
    projectId: "assignment-portal-556d9",
    storageBucket: "assignment-portal-556d9.firebasestorage.app",
    messagingSenderId: "979956221332",
    appId: "1:979956221332:web:acce0ec4dc6e9303293b81",
    measurementId: "G-89PBEQFMKG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Export auth and helper functions
export {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
};
