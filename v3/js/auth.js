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
    updateDoc,
    getDoc,
    setDoc
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
  const userNameElement = document.getElementById('user-name');
  const userInfo = document.querySelector('.user-info');
  const logoutLink = document.getElementById('logout-link');
  const profileLink = document.getElementById('profile-link');
  
  // Function to get current user
  function getCurrentUser() {
    return currentUser;
  }
  
  // Function to update user UI
  function updateUserUI() {
    if (currentUser) {
      if (loginBtn) loginBtn.style.display = 'none';
      if (signupBtn) signupBtn.style.display = 'none';
      if (userInfo) {
        userInfo.style.display = 'flex';
      }
      
      // Don't update the display name immediately to prevent flashing
      // We'll update it only after we get the data from Firestore
      
      // Get user data from Firestore - use the user's UID as the document ID
      getDoc(doc(db, "users", currentUser.uid))
        .then((docSnapshot) => {
          if (docSnapshot.exists()) {
            currentUserData = docSnapshot.data();
            currentUserDocId = docSnapshot.id;
            
            // Use only first name if available
            if (currentUserData.firstName) {
              if (userNameElement) {
                userNameElement.textContent = currentUserData.firstName;
                userNameElement.classList.add('loaded');
              }
            } else if (currentUserData.username) {
              if (userNameElement) {
                userNameElement.textContent = currentUserData.username;
                userNameElement.classList.add('loaded');
              }
            } else {
              // Fallback to email
              const displayName = currentUser.email ? currentUser.email.split('@')[0] : 'User';
              if (userNameElement) {
                userNameElement.textContent = displayName;
                userNameElement.classList.add('loaded');
              }
            }
            
            console.log("User data loaded:", currentUserData);
          } else {
            console.log("No user data found, creating new user document");
            // Create a new user document
            const userData = {
              email: currentUser.email,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp()
            };
            
            // Use the UID as the document ID
            setDoc(doc(db, "users", currentUser.uid), userData)
              .then(() => {
                console.log("User document created successfully");
                currentUserData = userData;
                currentUserDocId = currentUser.uid;
                
                // Set display name to email username
                const displayName = currentUser.email ? currentUser.email.split('@')[0] : 'User';
                if (userNameElement) {
                  userNameElement.textContent = displayName;
                  userNameElement.classList.add('loaded');
                }
              })
              .catch((error) => {
                console.error("Error creating user document:", error);
              });
          }
        })
        .catch((error) => {
          console.error("Error getting user data:", error);
        });
    } else {
      if (loginBtn) loginBtn.style.display = 'block';
      if (signupBtn) signupBtn.style.display = 'block';
      if (userInfo) {
        userInfo.style.display = 'none';
      }
      
      if (userNameElement) {
        userNameElement.textContent = '';
        userNameElement.classList.remove('loaded');
      }
      
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
    console.log("Setting up auth functionality");
    
    // Setup dropdown functionality
    if (userInfo) {
      userInfo.addEventListener('click', (e) => {
        userInfo.classList.toggle('active');
        e.stopPropagation();
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        userInfo.classList.remove('active');
      });
    }
    
    // Profile link
    if (profileLink) {
      profileLink.addEventListener('click', openProfileModal);
    }
    
    // Logout button
    if (logoutLink) {
      logoutLink.addEventListener('click', () => {
        signOut(auth).then(() => {
          currentUser = null;
          updateUserUI();
          showNotification('Logged out successfully');
          
          // If on a board page, redirect to dashboard
          if (window.location.pathname.includes('board.html')) {
            window.location.href = 'dashboard.html';
          }
        }).catch((error) => {
          console.error("Error signing out:", error);
          showNotification('Error signing out', true);
        });
      });
    }
    
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
            
            // Add user profile to Firestore using UID as document ID
            setDoc(doc(db, "users", currentUser.uid), {
              uid: currentUser.uid,
              firstName: firstName,
              lastName: lastName,
              email: email,
              createdAt: serverTimestamp()
            }).then(() => {
              currentUserDocId = currentUser.uid;
              if (signupModal) signupModal.classList.remove('active');
              showNotification('Signed up successfully!');
              signupForm.reset();
            }).catch((error) => {
              showNotification('Error creating user profile: ' + error.message, true);
            });
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
        
        // Always use the user's UID as the document ID
        const userDocRef = doc(db, "users", currentUser.uid);
        
        // Update user profile in Firestore
        setDoc(userDocRef, {
          uid: currentUser.uid,
          firstName: firstName,
          lastName: lastName,
          email: currentUser.email,
          updatedAt: serverTimestamp()
        }, { merge: true })
        .then(() => {
          // Update local user data
          currentUserData = {
            uid: currentUser.uid,
            firstName: firstName,
            lastName: lastName,
            email: currentUser.email
          };
          currentUserDocId = currentUser.uid;
          
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