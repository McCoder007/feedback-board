// Auth module
import { 
    auth, 
    db, 
    collection, 
    addDoc, 
    getDocs, 
    query, 
    where, 
    serverTimestamp,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged as firebaseAuthStateChanged,
    signOut
  } from './firebase-config.js';
  import { showNotification } from './ui.js';
  import { setupRealTimeUpdates } from './board.js';
  
  // Current user state
  let currentUser = null;
  
  // Auth state change callbacks
  const authStateCallbacks = [];
  
  // UI elements
  const loginBtn = document.getElementById('login-btn');
  const signupBtn = document.getElementById('signup-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const userNameElement = document.getElementById('user-name');
  const userInfo = document.querySelector('.user-info');
  
  // Create logout button
  const logoutBtnElement = document.createElement('button');
  logoutBtnElement.className = 'btn btn-outline';
  logoutBtnElement.textContent = 'Logout';
  logoutBtnElement.style.display = 'none';
  if (userInfo && userInfo.parentNode) {
    userInfo.parentNode.appendChild(logoutBtnElement);
  }
  
  // Function to get current user
  function getCurrentUser() {
    return currentUser;
  }
  
  // Function to update user UI
  function updateUserUI() {
    if (currentUser) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (signupBtn) signupBtn.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'block';
      if (userInfo) userInfo.style.display = 'flex';
      
      // Update user name display
      const displayName = currentUser.email ? currentUser.email.split('@')[0] : 'User';
      if (userNameElement) userNameElement.textContent = displayName;
      
      // Get user data from Firestore
      getDocs(query(collection(db, "users"), where("uid", "==", currentUser.uid)))
        .then((querySnapshot) => {
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            const username = userData.username || displayName;
            
            if (userNameElement) userNameElement.textContent = username;
          }
        });
    } else {
      if (loginBtn) loginBtn.style.display = 'block';
      if (signupBtn) signupBtn.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (userInfo) userInfo.style.display = 'none';
    }
  }
  
  // Custom auth state change handler
  function onAuthStateChanged(callback) {
    // Add callback to the list
    if (callback && typeof callback === 'function') {
      authStateCallbacks.push(callback);
    }
    
    // Return unsubscribe function
    return () => {
      const index = authStateCallbacks.indexOf(callback);
      if (index !== -1) {
        authStateCallbacks.splice(index, 1);
      }
    };
  }
  
  // Setup authentication listeners and handlers
  function setupAuth() {
    const loginModal = document.getElementById('login-modal');
    const signupModal = document.getElementById('signup-modal');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    
    // Login button
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        if (loginModal) loginModal.classList.add('active');
      });
    }
  
    // Signup button
    if (signupBtn) {
      signupBtn.addEventListener('click', () => {
        if (signupModal) signupModal.classList.add('active');
      });
    }
  
    // Logout button
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
          currentUser = null;
          updateUserUI();
          
          // Notify all callbacks
          authStateCallbacks.forEach(callback => callback(null));
          
          showNotification('Logged out successfully!');
        }).catch((error) => {
          showNotification('Error logging out: ' + error.message, true);
        });
      });
    }
  
    // Login form submission
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        signInWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            if (loginModal) loginModal.classList.remove('active');
            showNotification('Logged in successfully!');
            loginForm.reset();
          })
          .catch((error) => {
            showNotification('Login error: ' + error.message, true);
          });
      });
    }
  
    // Signup form submission
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        const username = document.getElementById('signup-username').value;
        
        if (password !== confirmPassword) {
          showNotification('Passwords do not match', true);
          return;
        }
        
        createUserWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            currentUser = userCredential.user;
            
            // Add username to user profile in Firestore
            addDoc(collection(db, "users"), {
              uid: currentUser.uid,
              username: username,
              email: email,
              createdAt: serverTimestamp()
            });
            
            if (signupModal) signupModal.classList.remove('active');
            showNotification('Signed up successfully!');
            signupForm.reset();
          })
          .catch((error) => {
            showNotification('Signup error: ' + error.message, true);
          });
      });
    }
  
    // Initialize auth state listener
    if (auth) {
      firebaseAuthStateChanged(auth, (user) => {
        currentUser = user;
        updateUserUI();
        
        // Notify all callbacks
        authStateCallbacks.forEach(callback => callback(user));
      });
    } else {
      console.error("Auth not initialized yet");
    }
  }
  
  export { 
    setupAuth, 
    getCurrentUser, 
    updateUserUI,
    onAuthStateChanged
  };