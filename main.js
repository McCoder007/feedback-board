// Firebase configuration
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
let currentSortOrder = 'newest'; // Default sort

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

    // Load saved sort preference
    const savedSort = localStorage.getItem('feedbackBoardSort');
    if (savedSort) {
      currentSortOrder = savedSort;
      // Update select element to match saved preference
      const sortSelect = document.querySelector('.search-tools select');
      if (sortSelect) {
        sortSelect.value = currentSortOrder;
      }
    }

    // Set up event listeners immediately
    setupEventListeners();

    // Make sure auth is initialized before using it
    if (auth) {
      // Check if user is already logged in
      onAuthStateChanged(auth, (user) => {
        if (user) {
          currentUser = user;
          updateUserUI();
          loadAllItems(currentSortOrder);
        } else {
          currentUser = null;
          updateUserUI();
          // Still load items for anonymous viewing
          loadAllItems(currentSortOrder);
        }
      });
    } else {
      console.error("Auth not initialized yet");
      // Still try to load items for viewing
      setTimeout(() => loadAllItems(currentSortOrder), 1000);
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
    // Store the selected sort in our variable and localStorage
    currentSortOrder = sortSelect.value;
    localStorage.setItem('feedbackBoardSort', currentSortOrder);
    loadAllItems(currentSortOrder);
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
    
    // Use the tracked sort order
    loadAllItems(currentSortOrder);
  } catch (error) {
    showNotification('Error adding item: ' + error.message, true);
  } finally {
    isSubmitting = false;
  }
}

// Function to handle votes
async function handleVote(itemId, voteType, isAlreadyVoted, card) {
  try {
    const itemRef = doc(db, "items", itemId);
    
    // Get the latest document directly using the document reference
    const itemDoc = await getDoc(itemRef);
    
    if (!itemDoc.exists()) {
      showNotification('Item not found', true);
      return;
    }
    
    const itemData = itemDoc.data();
    const upvotes = itemData.upvotes || [];
    const downvotes = itemData.downvotes || [];
    
    let updateData = {};
    
    // Handle upvote
    if (voteType === 'upvote') {
      if (isAlreadyVoted) {
        // Remove upvote
        updateData.upvotes = upvotes.filter(uid => uid !== currentUser.uid);
      } else {
        // Add upvote and remove downvote if exists
        updateData.upvotes = [...upvotes, currentUser.uid];
        updateData.downvotes = downvotes.filter(uid => uid !== currentUser.uid);
      }
    } 
    // Handle downvote
    else if (voteType === 'downvote') {
      if (isAlreadyVoted) {
        // Remove downvote
        updateData.downvotes = downvotes.filter(uid => uid !== currentUser.uid);
      } else {
        // Add downvote and remove upvote if exists
        updateData.downvotes = [...downvotes, currentUser.uid];
        updateData.upvotes = upvotes.filter(uid => uid !== currentUser.uid);
      }
    }
    
    // Update Firestore
    await updateDoc(itemRef, updateData);
    
    // Immediately update the UI for the current card
    updateCardVoteUI(card, voteType, isAlreadyVoted, updateData);
    
    // If sorting by most votes, we need to reposition the cards
    if (currentSortOrder === 'most-votes') {
      // Instead of reloading everything, just reposition this card if needed
      await repositionCardAfterVote(itemId, card, updateData, currentSortOrder);
    }
    
  } catch (error) {
    console.error('Error handling vote:', error);
    showNotification('Error handling vote: ' + error.message, true);
  }
}

// Helper function to update card UI immediately without waiting for Firestore
function updateCardVoteUI(card, voteType, isAlreadyVoted, updateData) {
  if (!card) return;
  
  const upvoteBtn = card.querySelector('.upvote');
  const downvoteBtn = card.querySelector('.downvote');
  
  if (!upvoteBtn || !downvoteBtn) return;
  
  const upvoteCount = upvoteBtn.querySelector('span');
  const downvoteCount = downvoteBtn.querySelector('span');
  
  // Update the vote counts based on updateData
  if (updateData.upvotes !== undefined) {
    upvoteCount.textContent = updateData.upvotes.length;
  }
  
  if (updateData.downvotes !== undefined) {
    downvoteCount.textContent = updateData.downvotes.length;
  }
  
  // Update button styles
  if (voteType === 'upvote') {
    if (isAlreadyVoted) {
      upvoteBtn.classList.remove('upvoted');
    } else {
      upvoteBtn.classList.add('upvoted');
      downvoteBtn.classList.remove('downvoted');
    }
  } else if (voteType === 'downvote') {
    if (isAlreadyVoted) {
      downvoteBtn.classList.remove('downvoted');
    } else {
      downvoteBtn.classList.add('downvoted');
      upvoteBtn.classList.remove('upvoted');
    }
  }
}

// Helper function to reposition a card after voting without reloading everything
async function repositionCardAfterVote(itemId, card, updateData, sortBy) {
  if (sortBy !== 'most-votes' || !card) return;
  
  try {
    const columnType = card.closest('.column').classList[1]; // Get column type (went-well, to-improve, etc)
    const column = document.querySelector(`.${columnType} .cards`);
    if (!column) return;
    
    // Calculate the new score for this card
    const newUpvotes = updateData.upvotes?.length || 0;
    const newDownvotes = updateData.downvotes?.length || 0;
    const newScore = newUpvotes - newDownvotes;
    
    // Get all cards in this column
    const cards = Array.from(column.querySelectorAll('.card'));
    
    // If there's only one card, no need to reposition
    if (cards.length <= 1) return;
    
    // Calculate scores for all cards to determine new position
    const cardScores = await Promise.all(cards.map(async (c) => {
      // Skip the current card, we already know its score
      if (c === card) {
        return { card: c, score: newScore };
      }
      
      const cId = c.dataset.id;
      const upvoteCount = parseInt(c.querySelector('.upvote span').textContent) || 0;
      const downvoteCount = parseInt(c.querySelector('.downvote span').textContent) || 0;
      const score = upvoteCount - downvoteCount;
      
      return { card: c, score };
    }));
    
    // Sort the cards by score (highest first)
    cardScores.sort((a, b) => {
      // First sort by score
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      
      // If scores are equal and one is our card, prioritize newer items
      // Since we can't easily get timestamp here, we'll just assume our card is newer
      if (a.card === card) return -1;
      if (b.card === card) return 1;
      
      return 0;
    });
    
    // Find the new position of our card
    const newIndex = cardScores.findIndex(c => c.card === card);
    
    // If the card is already in the right position, no need to reposition
    const currentIndex = cards.indexOf(card);
    if (newIndex === currentIndex) return;
    
    // Add a subtle highlight effect to make it easier to track the card movement
    card.classList.add('highlight-card');
    
    // Animate the card's removal
    card.style.transition = 'opacity 0.2s ease-out';
    card.style.opacity = '0';
    
    // After a short delay, reposition the card
    setTimeout(() => {
      // Remove the card from DOM temporarily
      card.remove();
      
      // Insert it at the new position
      if (newIndex === 0) {
        // If it should be first, prepend it
        column.prepend(card);
      } else if (newIndex >= cards.length - 1) {
        // If it should be last, append it
        column.appendChild(card);
      } else {
        // Otherwise insert it before the card that should come after it
        const nextCard = cardScores[newIndex + 1].card;
        column.insertBefore(card, nextCard);
      }
      
      // Animate the card's appearance
      card.style.opacity = '1';
      
      // Remove the highlight effect after animation
      setTimeout(() => {
        card.classList.remove('highlight-card');
        card.style.transition = '';
      }, 1000);
    }, 200);
    
  } catch (error) {
    console.error('Error repositioning card:', error);
    // If anything goes wrong, fall back to reloading all items
    loadAllItems(sortBy);
  }
}

// Function to load all items with proper sorting
async function loadAllItems(sortBy) {
  try {
    // If sortBy is provided, update our tracking variable
    if (sortBy) {
      currentSortOrder = sortBy;
      localStorage.setItem('feedbackBoardSort', currentSortOrder);
    } else {
      // If no sortBy provided, use the tracked order
      sortBy = currentSortOrder;
    }
    
    // Update the select element to match
    const sortSelect = document.querySelector('.search-tools select');
    if (sortSelect) {
      sortSelect.value = sortBy;
    }
    
    // Show loading indicator, hide board
    const loadingIndicator = document.getElementById('loading-indicator');
    const board = document.querySelector('.board');
    
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    if (board) board.style.display = 'none';
    
    // Create a query with cache disabled to ensure fresh data
    const itemsQuery = query(collection(db, "items"));
    
    // Get fresh data from Firestore
    const querySnapshot = await getDocs(itemsQuery);
    let items = [];
    
    // Convert to array and log each item's vote counts for debugging
    querySnapshot.forEach((doc) => {
      const item = {
        id: doc.id,
        ...doc.data()
      };
      
      items.push(item);
    });
    
    console.log(`Loaded ${items.length} items, sorting by ${sortBy}`);
    
    // Sort based on selected option
    if (sortBy === 'newest') {
      items.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // Descending (newest first)
      });
    } else if (sortBy === 'oldest') {
      items.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return aTime - bTime; // Ascending (oldest first) 
      });
    } else if (sortBy === 'most-votes') {
      items.sort((a, b) => {
        const aScore = (a.upvotes?.length || 0) - (a.downvotes?.length || 0);
        const bScore = (b.upvotes?.length || 0) - (b.downvotes?.length || 0);
        
        // First sort by score
        const scoreComparison = bScore - aScore;
        if (scoreComparison !== 0) {
          return scoreComparison; // Items have different scores
        }
        
        // If scores are equal, use recency as a tiebreaker
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime; // Newer items come first when scores are tied
      });
    }
    
    // Group items by column
    const columnItems = {
      'went-well': [],
      'to-improve': [],
      'action-items': []
    };
    
    // Add items to their respective column arrays
    items.forEach(item => {
      if (columnItems[item.columnType]) {
        columnItems[item.columnType].push(item);
      }
    });
    
    // Clear existing items from the DOM
    document.querySelectorAll('.cards').forEach(column => {
      column.innerHTML = '';
    });
    
    // Add items to the DOM in the sorted order (one column at a time)
    for (const columnType in columnItems) {
      const column = document.querySelector(`.${columnType} .cards`);
      if (!column) continue;
      
      const columnItemsArray = columnItems[columnType];
      
      // For each column, append items in their current order
      columnItemsArray.forEach(item => {
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
        
        // Always append (not prepend) to maintain the sorted order
        column.appendChild(card);
      });
    }
    
    // Hide loading indicator, show board
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    if (board) board.style.display = 'grid';
    
  } catch (error) {
    console.error('Error loading items:', error);
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