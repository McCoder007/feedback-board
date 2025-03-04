// This will be included directly in the HTML for faster loading

// Basic Firebase initialization - will be loaded earlier
const initFirebase = () => {
    try {
      const firebaseConfig = {
        apiKey: "AIzaSyA52dIm2y8-D9tuzScz5UxAy1-ljfiQPtw",
        authDomain: "feedback-board-b5889.firebaseapp.com",
        projectId: "feedback-board-b5889",
        storageBucket: "feedback-board-b5889.firebasestorage.app",
        messagingSenderId: "356107718217",
        appId: "1:356107718217:web:9701f2b5fd7ba26063f998",
        measurementId: "G-FZQ5CBDLTV"
      };
  
      // Initialize Firebase early
      window.firebaseApp = firebase.initializeApp(firebaseConfig);
      console.log("Firebase initialized early");
    } catch (error) {
      console.error("Firebase early initialization failed:", error);
    }
  };
  
  // Run immediately
  initFirebase();