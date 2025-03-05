// Board functionality module
import { 
    db, 
    collection, 
    addDoc, 
    getDoc,
    doc, 
    updateDoc,
    query, 
    where, 
    serverTimestamp,
    onSnapshot  // Import the onSnapshot listener
  } from './firebase-config.js';
  import { getCurrentUser } from './auth.js';
  import { showNotification, showBoardLoading } from './ui.js';
  
  // Track current sort order
  let currentSortOrder = 'newest'; // Default sort
  
  // Store our active listeners so we can detach them when needed
  let activeSnapshotListener = null;
  
  // Function to initialize board functionality
  function initBoard() {
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
    
    // Setup event listeners for the board
    setupBoardEventListeners();
    
    // Set up real-time updates
    setupRealTimeUpdates();
  }
  
  // Function to set up board event listeners
  function setupBoardEventListeners() {
    const addItemBtns = document.querySelectorAll('.add-item');
    const addItemModal = document.getElementById('add-item-modal');
    const addItemForm = document.getElementById('add-item-form');
    const columnTypeInput = document.getElementById('column-type');
    
    // Add item buttons - add both click and touchend events for better mobile support
    addItemBtns.forEach(btn => {
      // Helper function to handle the add item action
      const handleAddItem = (e) => {
        // Prevent default behavior and stop propagation
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Add item button clicked/touched');
        
        const currentUser = getCurrentUser();
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
      };
      
      // Add click event for most browsers
      btn.addEventListener('click', handleAddItem);
      
      // Add touchend event specifically for iOS
      btn.addEventListener('touchend', handleAddItem, { passive: false });
    });
  
    // Add item form submission
    if (addItemForm) {
      addItemForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const content = document.getElementById('item-content').value;
        const columnType = columnTypeInput.value;
        
        if (!content.trim()) return;
        
        addNewItem(columnType, content);
      });
    }
  
    // Global click listener for votes
    document.addEventListener('click', async (e) => {
      // Handle upvotes
      const upvoteBtn = e.target.closest('.upvote');
      if (upvoteBtn) {
        const currentUser = getCurrentUser();
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
        const currentUser = getCurrentUser();
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
    if (searchInput) {
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
    }
  
    // Sort functionality
    const sortSelect = document.querySelector('select');
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        // Store the selected sort in our variable and localStorage
        currentSortOrder = sortSelect.value;
        localStorage.setItem('feedbackBoardSort', currentSortOrder);
        
        // Update real-time listener with new sort order
        setupRealTimeUpdates();
      });
    }
  }
  
  // Set up real-time updates using Firestore onSnapshot
  function setupRealTimeUpdates() {
    // First, detach any existing listeners to avoid duplicates
    if (activeSnapshotListener) {
      activeSnapshotListener();
      activeSnapshotListener = null;
    }
    
    // Show loading state
    showBoardLoading(true);
    
    try {
      // Set up a real-time listener on the items collection
      const itemsQuery = query(collection(db, "items"));
      
      activeSnapshotListener = onSnapshot(itemsQuery, (snapshot) => {
        // Get all documents from the snapshot
        let items = [];
        
        snapshot.forEach((doc) => {
          const item = {
            id: doc.id,
            ...doc.data()
          };
          items.push(item);
        });
        
        console.log(`Real-time update received: ${items.length} items, sorting by ${currentSortOrder}`);
        
        // Sort and render the updated data
        renderItems(items, currentSortOrder);
        
        // Hide loading spinner after first load
        showBoardLoading(false);
      }, (error) => {
        console.error("Error in real-time updates:", error);
        showNotification("Error getting real-time updates. Please refresh the page.", true);
        showBoardLoading(false);
      });
    } catch (error) {
      console.error("Failed to set up real-time listener:", error);
      showNotification("Failed to set up live updates. Please refresh the page.", true);
      showBoardLoading(false);
    }
  }
  
  // Function to render items in the board
  function renderItems(items, sortBy) {
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
    
    // Get current search term to maintain filter during updates
    const searchTerm = document.querySelector('.search-input input')?.value.toLowerCase() || '';
    
    // Create a map of existing cards to help with animations
    const existingCards = new Map();
    document.querySelectorAll('.card').forEach(card => {
      existingCards.set(card.dataset.id, card);
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
        // Create a new card element
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = item.id;
        
        // Check if card should be visible based on current search
        if (searchTerm && !item.content.toLowerCase().includes(searchTerm)) {
          card.style.display = 'none';
        }
        
        // Check if current user has voted
        const currentUser = getCurrentUser();
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
        
        // If this is a new card (not in existingCards map), add an animation class
        if (!existingCards.has(item.id)) {
          card.classList.add('new-card');
          setTimeout(() => {
            card.classList.remove('new-card');
          }, 1000);
        }
        
        // Add to column
        column.appendChild(card);
      });
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
      
      const currentUser = getCurrentUser();
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
      
      // Note: We don't need to update the UI here anymore,
      // the real-time listener will handle that automatically
      
    } catch (error) {
      console.error('Error handling vote:', error);
      showNotification('Error handling vote: ' + error.message, true);
    }
  }
  
  // Function to add a new item
  let isSubmitting = false;
  
  async function addNewItem(columnType, content) {
    if (isSubmitting) return;
    isSubmitting = true;
    
    try {
      const currentUser = getCurrentUser();
      
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
      document.getElementById('add-item-form').reset();
      document.getElementById('add-item-modal').classList.remove('active');
      showNotification('Item added successfully!');
      
      // Note: We don't need to manually refresh the board
      // The real-time listener will update automatically
      
    } catch (error) {
      showNotification('Error adding item: ' + error.message, true);
    } finally {
      isSubmitting = false;
    }
  }
  
  // Clean up function for removing listeners when page unloads
  function cleanupListeners() {
    if (activeSnapshotListener) {
      activeSnapshotListener();
      activeSnapshotListener = null;
    }
  }
  
  // Add event listener for page unload
  window.addEventListener('beforeunload', cleanupListeners);
  
  export {
    initBoard,
    setupRealTimeUpdates,
    currentSortOrder
  };