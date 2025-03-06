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
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    doc,
    updateDoc
  } from './firebase-config.js';
  import { showNotification } from './ui.js';
  import { setupRealTimeUpdates } from './board.js';
  
  // Current user state
  let currentUser = null;
  let currentUserData = null;
  let currentUserDocId = null;
  
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
      if (userInfo) {
        userInfo.style.display = 'flex';
        // Make user info clickable to open profile modal
        userInfo.style.cursor = 'pointer';
        userInfo.title = 'Click to view profile';
        userInfo.removeEventListener('click', openProfileModal); // Remove first to prevent duplicates
        userInfo.addEventListener('click', openProfileModal);
      }
      
      // Update user name display
      const displayName = currentUser.email ? currentUser.email.split('@')[0] : 'User';
      if (userNameElement) userNameElement.textContent = displayName;
      
      // Get user data from Firestore
      getDocs(query(collection(db, "users"), where("uid", "==", currentUser.uid)))
        .then((querySnapshot) => {
          if (!querySnapshot.empty) {
            const docSnapshot = querySnapshot.docs[0];
            currentUserData = docSnapshot.data();
            currentUserDocId = docSnapshot.id;
            
            // Use first name and last name if available
            if (currentUserData.firstName && currentUserData.lastName) {
              const fullName = `${currentUserData.firstName} ${currentUserData.lastName}`;
              if (userNameElement) userNameElement.textContent = fullName;
            } else if (currentUserData.username) {
              if (userNameElement) userNameElement.textContent = currentUserData.username;
            }
            
            console.log("User data loaded:", currentUserData);
          } else {
            console.log("No user document found for UID:", currentUser.uid);
            // Create a user document if none exists
            addDoc(collection(db, "users"), {
              uid: currentUser.uid,
              email: currentUser.email,
              createdAt: serverTimestamp()
            }).then(docRef => {
              currentUserDocId = docRef.id;
              currentUserData = {
                uid: currentUser.uid,
                email: currentUser.email
              };
              console.log("Created new user document with ID:", docRef.id);
            }).catch(error => {
              console.error("Error creating user document:", error);
            });
          }
        })
        .catch(error => {
          console.error("Error fetching user data:", error);
        });
    } else {
      if (loginBtn) loginBtn.style.display = 'block';
      if (signupBtn) signupBtn.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (userInfo) {
        userInfo.style.display = 'none';
        userInfo.style.cursor = 'default';
        userInfo.title = '';
        // Remove event listener
        userInfo.removeEventListener('click', openProfileModal);
      }
      
      // Reset user data
      currentUserData = null;
      currentUserDocId = null;
    }
  }
  
  // Function to open profile modal
  function openProfileModal() {
    if (!currentUser) return;
    
    const profileModal = document.getElementById('profile-modal');
    if (!profileModal) return;
    
    // Populate form with user data
    const firstNameInput = document.getElementById('profile-firstname');
    const lastNameInput = document.getElementById('profile-lastname');
    const emailInput = document.getElementById('profile-email');
    
    if (emailInput) emailInput.value = currentUser.email || '';
    
    if (currentUserData) {
      if (firstNameInput) firstNameInput.value = currentUserData.firstName || '';
      if (lastNameInput) lastNameInput.value = currentUserData.lastName || '';
    }
    
    // Show the modal
    profileModal.classList.add('active');
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
    const passwordResetModal = document.getElementById('password-reset-modal');
    const profileModal = document.getElementById('profile-modal');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const passwordResetForm = document.getElementById('password-reset-form');
    const profileForm = document.getElementById('profile-form');
    
    // Modal navigation links
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const signupLink = document.getElementById('signup-link');
    const loginLink = document.getElementById('login-link');
    const backToLoginLink = document.getElementById('back-to-login-link');
    
    // Function to close all modals
    function closeAllModals() {
      if (loginModal) loginModal.classList.remove('active');
      if (signupModal) signupModal.classList.remove('active');
      if (passwordResetModal) passwordResetModal.classList.remove('active');
      if (profileModal) profileModal.classList.remove('active');
    }
    
    // Login button
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        closeAllModals();
        if (loginModal) loginModal.classList.add('active');
      });
    }
  
    // Signup button
    if (signupBtn) {
      signupBtn.addEventListener('click', () => {
        closeAllModals();
        if (signupModal) signupModal.classList.add('active');
      });
    }
    
    // Forgot password link
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeAllModals();
        if (passwordResetModal) passwordResetModal.classList.add('active');
      });
    }
    
    // Signup link from login modal
    if (signupLink) {
      signupLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeAllModals();
        if (signupModal) signupModal.classList.add('active');
      });
    }
    
    // Login link from signup modal
    if (loginLink) {
      loginLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeAllModals();
        if (loginModal) loginModal.classList.add('active');
      });
    }
    
    // Back to login link from password reset modal
    if (backToLoginLink) {
      backToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeAllModals();
        if (loginModal) loginModal.classList.add('active');
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
        const firstName = document.getElementById('signup-firstname').value;
        const lastName = document.getElementById('signup-lastname').value;
        
        if (password !== confirmPassword) {
          showNotification('Passwords do not match', true);
          return;
        }
        
        createUserWithEmailAndPassword(auth, email, password)
          .then((userCredential) => {
            currentUser = userCredential.user;
            
            // Set display name in Firebase Auth
            const displayName = `${firstName} ${lastName}`;
            updateProfile(currentUser, {
              displayName: displayName
            }).catch((error) => {
              console.error("Error updating profile:", error);
            });
            
            // Add user profile to Firestore
            addDoc(collection(db, "users"), {
              uid: currentUser.uid,
              firstName: firstName,
              lastName: lastName,
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
    
    // Password reset form submission
    if (passwordResetForm) {
      passwordResetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('reset-email').value;
        
        sendPasswordResetEmail(auth, email)
          .then(() => {
            if (passwordResetModal) passwordResetModal.classList.remove('active');
            showNotification('Password reset email sent! Check your inbox.');
            passwordResetForm.reset();
          })
          .catch((error) => {
            showNotification('Password reset error: ' + error.message, true);
          });
      });
    }
    
    // Profile form submission
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        if (!currentUser) {
          showNotification('You must be logged in to update your profile', true);
          return;
        }
        
        const firstName = document.getElementById('profile-firstname').value;
        const lastName = document.getElementById('profile-lastname').value;
        
        // Update display name in Firebase Auth
        const displayName = `${firstName} ${lastName}`;
        updateProfile(currentUser, {
          displayName: displayName
        }).catch((error) => {
          console.error("Error updating profile:", error);
        });
        
        // If we don't have a user document yet, create one
        if (!currentUserDocId) {
          addDoc(collection(db, "users"), {
            uid: currentUser.uid,
            firstName: firstName,
            lastName: lastName,
            email: currentUser.email,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp()
          })
          .then((docRef) => {
            currentUserDocId = docRef.id;
            currentUserData = {
              uid: currentUser.uid,
              firstName: firstName,
              lastName: lastName,
              email: currentUser.email
            };
            
            // Update UI
            if (userNameElement) userNameElement.textContent = displayName;
            
            if (profileModal) profileModal.classList.remove('active');
            showNotification('Profile created successfully!');
          })
          .catch((error) => {
            showNotification('Error creating profile: ' + error.message, true);
          });
          return;
        }
        
        // Update user profile in Firestore
        const userDocRef = doc(db, "users", currentUserDocId);
        updateDoc(userDocRef, {
          firstName: firstName,
          lastName: lastName,
          updatedAt: serverTimestamp()
        })
        .then(() => {
          // Update local user data
          if (currentUserData) {
            currentUserData.firstName = firstName;
            currentUserData.lastName = lastName;
          }
          
          // Update UI
          if (userNameElement) userNameElement.textContent = displayName;
          
          if (profileModal) profileModal.classList.remove('active');
          showNotification('Profile updated successfully!');
        })
        .catch((error) => {
          console.error("Error updating profile:", error);
          showNotification('Error updating profile: ' + error.message, true);
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