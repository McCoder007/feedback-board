// Firebase configuration module
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
  onSnapshot,  // Added onSnapshot for real-time updates
  increment,    // Added increment for vote counting
  setDoc       // Added setDoc for setting documents with specific IDs
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail,  // Added for password reset
  updateProfile           // Added for profile updates
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';
import { getAnalytics } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-analytics.js';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA52dIm2y8-D9tuzScz5UxAy1-ljfiQPtw",
    authDomain: "feedback-board-b5889.firebaseapp.com",
    projectId: "feedback-board-b5889",
    storageBucket: "feedback-board-b5889.appspot.com",
    messagingSenderId: "356107718217",
    appId: "1:356107718217:web:9701f2b5fd7ba26063f998",
    measurementId: "G-FZQ5CBDLTV"
};

// Initialize Firebase
let app, db, auth, analytics;

try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase app initialized successfully");
    
    try {
        db = getFirestore(app);
        console.log("Firestore initialized successfully");
    } catch (firestoreError) {
        console.error("Firestore initialization error:", firestoreError);
    }
    
    try {
        auth = getAuth(app);
        console.log("Auth initialized successfully");
    } catch (authError) {
        console.error("Auth initialization error:", authError);
    }
    
    try {
        analytics = getAnalytics(app);
        console.log("Analytics initialized successfully");
    } catch (analyticsError) {
        console.error("Analytics initialization error:", analyticsError);
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
}

// Export initialized Firebase instances and Firebase modules
export { 
    app, 
    db, 
    auth,
    analytics,
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp,
    where,
    onSnapshot,  // Export onSnapshot
    increment,   // Export increment
    setDoc,      // Export setDoc
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    sendPasswordResetEmail,  // Export password reset function
    updateProfile           // Export profile update function
};