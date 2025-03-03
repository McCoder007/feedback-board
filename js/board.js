// Board functionality module
import { 
    db, 
    collection, 
    addDoc, 
    getDocs, 
    getDoc,
    doc, 
    updateDoc,
    query, 
    where, 
    serverTimestamp 
  } from './firebase-config.js';
  import { getCurrentUser } from './auth.js';
  import { showNotification, showBoardLoading } from './ui.js';
  
  // Track current sort order
  let currentSortOrder = 'newest'; // Default sort
  
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
  }
  
  // Function to set up board event listeners
  function setupBoardEventListeners() {
    const addItemBtns = document.querySelectorAll('.add-item');
    const addItemModal = document.getElementById('add-item-modal');
    const addItemForm = document.getElementById('add-item-form');
    const columnTypeInput = document.getElementById('column-type');
    
    // Add item buttons
    addItemBtns.forEach(btn => {
      btn.addEventListener('click', () => {
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
      });
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
        loadAllItems(currentSortOrder);
      });
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
      showBoardLoading(true);
      
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
          
          // Always append (not prepend) to maintain the sorted order
          column.appendChild(card);
        });
      }
      
      // Hide loading indicator, show board
      showBoardLoading(false);
      
    } catch (error) {
      console.error('Error loading items:', error);
      showNotification('Error loading items: ' + error.message, true);
      
      // Hide loading indicator and show board even on error
      showBoardLoading(false);
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
      
      // Use the tracked sort order
      loadAllItems(currentSortOrder);
    } catch (error) {
      showNotification('Error adding item: ' + error.message, true);
    } finally {
      isSubmitting = false;
    }
  }
  
  export {
    initBoard,
    loadAllItems,
    currentSortOrder
  };