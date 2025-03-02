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
let currentUser = null;

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

// Initialize the app and load data - SINGLE EVENT LISTENER
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded, initializing app...");

    // Set up event listeners immediately
    setupEventListeners();

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
    } else {
      console.error("Auth not initialized yet");
      // Still try to load items for viewing
      setTimeout(() => loadAllItems(), 1000);
    }
    
    // Failsafe: ensure board is displayed even if data loading fails
    setTimeout(() => {
      const loadingIndicator = document.getElementById('loading-indicator');
      const board = document.querySelector('.board');
      
      if (loadingIndicator && loadingIndicator.style.display !== 'none') {
        console.log("Failsafe timeout triggered - showing board anyway");
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (board) board.style.display = 'grid';
      }
    }, 5000); // 5 second timeout
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
      
      // Auto-focus the textarea when modal opens
      setTimeout(() => {
        document.getElementById('item-content').focus();
      }, 100);
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
  
  // Handle Enter key in the textarea
  document.getElementById('item-content').addEventListener('keydown', (e) => {
    // Check if the key pressed was Enter without Shift (to allow for multi-line input with Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default behavior (new line)
      
      // Trigger form submission
      const submitBtn = addItemForm.querySelector('button[type="submit"]');
      submitBtn.click();
    }
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
      if (!card || !card.dataset.id) return;
      
      const itemId = card.dataset.id;
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
      if (!card || !card.dataset.id) return;
      
      const itemId = card.dataset.id;
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

let isSubmitting = false;

async function addNewItem(columnType, content) {
  if (isSubmitting) return;
  isSubmitting = true;
  
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
    
    // Reset form and close modal
    addItemForm.reset();
    addItemModal.classList.remove('active');
    showNotification('Item added successfully!');
    
    // Reload all items to show the new item
    loadAllItems();
  } catch (error) {
    showNotification('Error adding item: ' + error.message, true);
  } finally {
    isSubmitting = false;
  }
}

// Function to add item to UI
function addItemToUI(item, items, index) {
  const column = document.querySelector(`.${item.columnType} .cards`);
  if (!column) {
    console.error(`Column ${item.columnType} not found`);
    return;
  }
  
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
  
  // Add the card at the appropriate position in the column
  if (index === 0) {
    // If it's the first item, prepend it
    column.prepend(card);
  } else {
    // Otherwise, insert it after the previous item
    const previousCards = column.querySelectorAll('.card');
    if (index < previousCards.length) {
      column.insertBefore(card, previousCards[index]);
    } else {
      column.appendChild(card);
    }
  }
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
    // Show loading indicator, hide board
    const loadingIndicator = document.getElementById('loading-indicator');
    const board = document.querySelector('.board');
    
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    if (board) board.style.display = 'none';
    
    // Clear existing items first to avoid duplicates
    document.querySelectorAll('.cards').forEach(column => {
      column.innerHTML = '';
    });
    
    // Get items from Firestore
    let itemsQuery;
    
    // Get all items - we'll sort them in JavaScript for consistent ordering
    itemsQuery = query(collection(db, "items"));
    
    const querySnapshot = await getDocs(itemsQuery);
    let items = [];
    
    querySnapshot.forEach((doc) => {
      const item = {
        id: doc.id,
        ...doc.data()
      };
      items.push(item);
    });
    
    // Sort based on selected option
    switch (sortBy) {
      case 'newest':
        // Sort by created date (newest first)
        items.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime; // Descending order (newest first)
        });
        break;
        
      case 'oldest':
        // Sort by created date (oldest first)
        items.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return aTime - bTime; // Ascending order (oldest first)
        });
        break;
        
      case 'most-votes':
        // Sort by vote score (upvotes - downvotes)
        items.sort((a, b) => {
          const aScore = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
          const bScore = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
          return bScore - aScore; // Descending order (highest score first)
        });
        break;
    }
    
    console.log(`Sorted ${items.length} items by ${sortBy}`);
    
    // Organize items by column type for better rendering
    const columnItems = {
      'went-well': [],
      'to-improve': [],
      'action-items': []
    };
    
    // Group items by column
    items.forEach(item => {
      if (columnItems[item.columnType]) {
        columnItems[item.columnType].push(item);
      }
    });
    
    // Add items to UI in the correct order
    for (const column in columnItems) {
      columnItems[column].forEach((item, index) => {
        addItemToUI(item, columnItems[column], index);
      });
    }
    
    // Hide loading indicator, show board
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (board) board.style.display = 'grid';
    
  } catch (error) {
    showNotification('Error loading items: ' + error.message, true);
    
    // Hide loading indicator and show board even on error
    const loadingIndicator = document.getElementById('loading-indicator');
    const board = document.querySelector('.board');
    
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (board) board.style.display = 'grid';
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