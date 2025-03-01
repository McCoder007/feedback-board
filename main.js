// Firebase configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where 
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut 
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA52dIm2y8-D9tuzScz5UxAy1-ljfiQPtw",
    authDomain: "feedback-board-b5889.firebaseapp.com",
    projectId: "feedback-board-b5889",
    storageBucket: "feedback-board-b5889.firebasestorage.app",
    messagingSenderId: "356107718217",
    appId: "1:356107718217:web:9701f2b5fd7ba26063f998",
    measurementId: "G-FZQ5CBDLTV"
};


// Initialize Firebase
let app, db, auth;

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
        
        // Add the DOMContentLoaded event listener here, after auth is initialized
        window.addEventListener('DOMContentLoaded', () => {
            // Check if user is already logged in
            onAuthStateChanged(auth, (user) => {
                if (user) {
                    currentUser = user;
                    updateUserUI();
                    loadAllItems();
                } else {
                    currentUser = null;
                    updateUserUI();
                    // Still load items for anonymous viewing
                    loadAllItems();
                }
            });
            
            // Set up event listeners
            setupEventListeners();
        });
        
    } catch (authError) {
        console.error("Auth initialization error:", authError);
    }
} catch (error) {
    console.error("Firebase initialization error:", error);
}

// DOM Elements
const addItemBtns = document.querySelectorAll('.add-item');
const closeModalBtns = document.querySelectorAll('.close-modal, .close-modal-btn');
const addItemModal = document.getElementById('add-item-modal');
const loginModal = document.getElementById('login-modal');
const signupModal = document.getElementById('signup-modal');
const addItemForm = document.getElementById('add-item-form');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const columnTypeInput = document.getElementById('column-type');
const notification = document.getElementById('notification');
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const userInfo = document.querySelector('.user-info');
const logoutBtn = document.createElement('button');
logoutBtn.className = 'btn btn-outline';
logoutBtn.textContent = 'Logout';
logoutBtn.style.display = 'none';
userInfo.parentNode.appendChild(logoutBtn);

// Current user state
let currentUser = null;

// Initialize the app and load data
window.addEventListener('DOMContentLoaded', () => {
    // Make sure auth is initialized before using it
    if (auth) {
      // Check if user is already logged in
      onAuthStateChanged(auth, (user) => {
        if (user) {
          currentUser = user;
          updateUserUI();
          loadAllItems();
        } else {
          currentUser = null;
          updateUserUI();
          // Still load items for anonymous viewing
          loadAllItems();
        }
      });
      
      // Set up event listeners
      setupEventListeners();
    } else {
      console.error("Auth not initialized yet");
      // Still try to load items for viewing
      loadAllItems();
    }
  });

// Set up all event listeners
function setupEventListeners() {
  // Add item buttons
  addItemBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (!currentUser) {
        showNotification('Please log in to add items', true);
        return;
      }
      
      columnTypeInput.value = btn.dataset.column;
      addItemModal.classList.add('active');
    });
  });

  // Close modal buttons
  closeModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
      });
    });
  });

  // Add item form submission
  addItemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const content = document.getElementById('item-content').value;
    const columnType = columnTypeInput.value;
    
    if (!content.trim()) return;
    
    addNewItem(columnType, content);
  });

  // Login button
  loginBtn.addEventListener('click', () => {
    loginModal.classList.add('active');
  });

  // Signup button
  signupBtn.addEventListener('click', () => {
    signupModal.classList.add('active');
  });

  // Logout button
  logoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
      currentUser = null;
      updateUserUI();
      showNotification('Logged out successfully!');
    }).catch((error) => {
      showNotification('Error logging out: ' + error.message, true);
    });
  });

  // Login form submission
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        currentUser = userCredential.user;
        loginModal.classList.remove('active');
        showNotification('Logged in successfully!');
        loginForm.reset();
      })
      .catch((error) => {
        showNotification('Login error: ' + error.message, true);
      });
  });

  // Signup form submission
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
        
        signupModal.classList.remove('active');
        showNotification('Signed up successfully!');
        signupForm.reset();
      })
      .catch((error) => {
        showNotification('Signup error: ' + error.message, true);
      });
  });

  // Global click listener for votes
  document.addEventListener('click', async (e) => {
    // Handle upvotes
    const upvoteBtn = e.target.closest('.upvote');
    if (upvoteBtn) {
      if (!currentUser) {
        showNotification('Please log in to vote', true);
        return;
      }
      
      const card = upvoteBtn.closest('.card');
      const itemId = card.dataset.id;
      const voteCount = upvoteBtn.querySelector('span');
      
      await handleVote(itemId, 'upvote', upvoteBtn.classList.contains('upvoted'), card);
    }
    
    // Handle downvotes
    const downvoteBtn = e.target.closest('.downvote');
    if (downvoteBtn) {
      if (!currentUser) {
        showNotification('Please log in to vote', true);
        return;
      }
      
      const card = downvoteBtn.closest('.card');
      const itemId = card.dataset.id;
      const voteCount = downvoteBtn.querySelector('span');
      
      await handleVote(itemId, 'downvote', downvoteBtn.classList.contains('downvoted'), card);
    }
  });

  // Search functionality
  const searchInput = document.querySelector('.search-input input');
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const cards = document.querySelectorAll('.card');
    
    cards.forEach(card => {
      const content = card.querySelector('p').textContent.toLowerCase();
      if (content.includes(searchTerm)) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  });

  // Sort functionality
  const sortSelect = document.querySelector('select');
  sortSelect.addEventListener('change', () => {
    loadAllItems(sortSelect.value);
  });
}

// Function to add a new item
async function addNewItem(columnType, content) {
  try {
    // Add item to Firestore
    const docRef = await addDoc(collection(db, "items"), {
      content: content,
      columnType: columnType,
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
      upvotes: [],
      downvotes: []
    });
    
    // Add item to UI
    addItemToUI({
      id: docRef.id,
      content: content,
      columnType: columnType,
      upvotes: [],
      downvotes: []
    });
    
    // Reset form and close modal
    addItemForm.reset();
    addItemModal.classList.remove('active');
    showNotification('Item added successfully!');
  } catch (error) {
    showNotification('Error adding item: ' + error.message, true);
  }
}

// Function to add item to UI
function addItemToUI(item) {
  const column = document.querySelector(`.${item.columnType} .cards`);
  
  const card = document.createElement('div');
  card.className = 'card';
  card.dataset.id = item.id;
  
  // Check if current user has voted
  const hasUpvoted = item.upvotes && item.upvotes.includes(currentUser?.uid);
  const hasDownvoted = item.downvotes && item.downvotes.includes(currentUser?.uid);
  
  card.innerHTML = `
    <p>${item.content}</p>
    <div class="card-actions">
      <button class="vote-btn upvote ${hasUpvoted ? 'upvoted' : ''}">
        <i class="fas fa-arrow-up"></i>
        <span>${item.upvotes ? item.upvotes.length : 0}</span>
      </button>
      <button class="vote-btn downvote ${hasDownvoted ? 'downvoted' : ''}">
        <i class="fas fa-arrow-down"></i>
        <span>${item.downvotes ? item.downvotes.length : 0}</span>
      </button>
    </div>
  `;
  
  column.prepend(card);
}

// Function to handle votes
async function handleVote(itemId, voteType, isAlreadyVoted, card) {
  try {
    const itemRef = doc(db, "items", itemId);
    const itemSnapshot = await getDocs(query(collection(db, "items"), where("__name__", "==", itemId)));
    
    if (itemSnapshot.empty) {
      showNotification('Item not found', true);
      return;
    }
    
    const itemData = itemSnapshot.docs[0].data();
    const upvotes = itemData.upvotes || [];
    const downvotes = itemData.downvotes || [];
    
    // Handle upvote
    if (voteType === 'upvote') {
      if (isAlreadyVoted) {
        // Remove upvote
        const newUpvotes = upvotes.filter(uid => uid !== currentUser.uid);
        await updateDoc(itemRef, { upvotes: newUpvotes });
      } else {
        // Add upvote and remove downvote if exists
        const newUpvotes = [...upvotes, currentUser.uid];
        const newDownvotes = downvotes.filter(uid => uid !== currentUser.uid);
        await updateDoc(itemRef, { 
          upvotes: newUpvotes,
          downvotes: newDownvotes
        });
      }
    } 
    // Handle downvote
    else if (voteType === 'downvote') {
      if (isAlreadyVoted) {
        // Remove downvote
        const newDownvotes = downvotes.filter(uid => uid !== currentUser.uid);
        await updateDoc(itemRef, { downvotes: newDownvotes });
      } else {
        // Add downvote and remove upvote if exists
        const newDownvotes = [...downvotes, currentUser.uid];
        const newUpvotes = upvotes.filter(uid => uid !== currentUser.uid);
        await updateDoc(itemRef, { 
          downvotes: newDownvotes,
          upvotes: newUpvotes
        });
      }
    }
    
    // Refresh all items to update UI
    loadAllItems();
  } catch (error) {
    showNotification('Error handling vote: ' + error.message, true);
  }
}

// Function to load all items
async function loadAllItems(sortBy = 'newest') {
  try {
    // Clear existing items
    document.querySelectorAll('.cards').forEach(column => {
      column.innerHTML = '';
    });
    
    // Get items from Firestore
    let itemsQuery;
    
    switch (sortBy) {
      case 'oldest':
        itemsQuery = query(collection(db, "items"), orderBy("createdAt", "asc"));
        break;
      case 'most-votes':
        // In a real app, this would be more complex
        itemsQuery = query(collection(db, "items"));
        break;
      default: // newest
        itemsQuery = query(collection(db, "items"), orderBy("createdAt", "desc"));
        break;
    }
    
    const querySnapshot = await getDocs(itemsQuery);
    let items = [];
    
    querySnapshot.forEach((doc) => {
      items.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // If sorting by votes, do it client-side
    if (sortBy === 'most-votes') {
      items.sort((a, b) => {
        const aScore = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
        const bScore = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
        return bScore - aScore;
      });
    }
    
    // Add items to UI
    items.forEach(item => {
      addItemToUI(item);
    });
  } catch (error) {
    showNotification('Error loading items: ' + error.message, true);
  }
}

// Function to update user UI
function updateUserUI() {
  if (currentUser) {
    loginBtn.style.display = 'none';
    signupBtn.style.display = 'none';
    logoutBtn.style.display = 'block';
    userInfo.style.display = 'flex';
    
    // Get user data from Firestore
    getDocs(query(collection(db, "users"), where("uid", "==", currentUser.uid)))
      .then((querySnapshot) => {
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          const username = userData.username || currentUser.email.split('@')[0];
          
          const avatar = userInfo.querySelector('.avatar');
          const usernameEl = userInfo.querySelector('.username');
          
          avatar.textContent = username.substring(0, 2).toUpperCase();
          usernameEl.textContent = username;
        }
      });
  } else {
    loginBtn.style.display = 'block';
    signupBtn.style.display = 'block';
    logoutBtn.style.display = 'none';
    userInfo.style.display = 'none';
  }
}

// Function to show notification
function showNotification(message, isError = false) {
  notification.textContent = message;
  notification.className = 'notification';
  
  if (isError) {
    notification.classList.add('error');
  }
  
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}




