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
    onSnapshot,  // Import the onSnapshot listener
    deleteDoc,
    orderBy,
    increment
  } from './firebase-config.js';
  import { getCurrentUser } from './auth.js';
  import { showNotification, showBoardLoading } from './ui.js';
  
  // Track current sort order
  let currentSortOrder = 'newest'; // Default sort
  
  // Store our active listeners so we can detach them when needed
  let activeSnapshotListener = null;
  
  // Constants
  const ITEMS_COLLECTION = 'items';
  const BOARDS_COLLECTION = 'boards';
  
  // State
  let currentBoardId = null;
  let currentBoardData = null;
  let unsubscribeListeners = [];
  
  // DOM Elements
  const boardTitleElement = document.getElementById('board-title');
  const addItemButtons = document.querySelectorAll('.add-item');
  const addItemForm = document.getElementById('add-item-form');
  const itemContentTextarea = document.getElementById('item-content');
  const searchInput = document.querySelector('.search-input input');
  const sortSelect = document.querySelector('.sort-select');
  const exportBtn = document.querySelector('.export-btn');
  
  // Function to initialize board functionality
  function initBoard() {
    console.log("Initializing board...");
    
    // Get board ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const boardId = urlParams.get('id');
    
    if (!boardId) {
      showNotification('No board ID specified. Redirecting to dashboard...', true);
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 2000);
      return;
    }
    
    currentBoardId = boardId;
    
    // Show loading state
    showBoardLoading(true);
    
    // Load board data
    loadBoardData(boardId);
    
    // Setup event listeners
    setupBoardEventListeners();
  }
  
  // Load board data
  async function loadBoardData(boardId) {
    try {
      // Query for the board with this boardId
      const boardsRef = collection(db, BOARDS_COLLECTION);
      const q = query(boardsRef, where('boardId', '==', boardId));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (querySnapshot.empty) {
          showNotification('Board not found', true);
          showBoardLoading(false);
          return;
        }
        
        // Get the first matching board
        const boardDoc = querySnapshot.docs[0];
        currentBoardData = { id: boardDoc.id, ...boardDoc.data() };
        
        // Update board title
        if (boardTitleElement) {
          boardTitleElement.textContent = currentBoardData.title || 'Feedback Board';
        }
        
        // Set document title
        document.title = `${currentBoardData.title || 'Feedback Board'}`;
        
        // Setup real-time updates for this board's items
        setupRealTimeUpdates();
        
        // Hide loading state
        showBoardLoading(false);
      });
      
      // Add to unsubscribe listeners
      unsubscribeListeners.push(unsubscribe);
      
    } catch (error) {
      console.error('Error loading board data:', error);
      showNotification('Failed to load board data', true);
      showBoardLoading(false);
    }
  }
  
  // Function to set up board event listeners
  function setupBoardEventListeners() {
    // Add item buttons
    addItemButtons.forEach(button => {
      // For desktop
      button.addEventListener('click', handleAddItem);
      
      // For mobile
      button.addEventListener('touchend', (e) => {
        e.preventDefault();
        handleAddItem(e);
      });
    });
    
    // Add item form submission
    if (addItemForm) {
      addItemForm.addEventListener('submit', handleItemSubmit);
    }
    
    // Search input
    if (searchInput) {
      searchInput.addEventListener('input', debounce(() => {
        filterItems();
      }, 300));
    }
    
    // Sort select
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        filterItems();
      });
    }
    
    // Export button
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const exportModal = document.getElementById('export-modal');
        if (exportModal) {
          exportModal.classList.add('active');
        }
      });
    }
  }
  
  // Handle add item button click
  function handleAddItem(e) {
    e.preventDefault();
    
    // Check if user is authenticated
    const user = getCurrentUser();
    
    // Get the column type from the button's data attribute
    const columnType = e.currentTarget.dataset.column;
    
    // Get the modal elements
    const addItemModal = document.getElementById('add-item-modal');
    const modalTitle = document.querySelector('.modal-title');
    const modalHeader = document.querySelector('.modal-header');
    const submitButton = addItemForm.querySelector('button[type="submit"]');
    const formLabel = document.querySelector('label[for="item-content"]');
    
    // Reset any previous classes
    modalHeader.className = 'modal-header';
    
    // Set the title and class based on column type
    if (columnType === 'went-well') {
      modalTitle.textContent = 'Add What Went Well';
      modalHeader.classList.add('went-well-header');
      formLabel.textContent = 'What went well?';
      submitButton.className = 'btn btn-went-well';
    } else if (columnType === 'to-improve') {
      modalTitle.textContent = 'Add What Needs Improvement';
      modalHeader.classList.add('to-improve-header');
      formLabel.textContent = 'What could be improved?';
      submitButton.className = 'btn btn-to-improve';
    } else if (columnType === 'action-items') {
      modalTitle.textContent = 'Add Action Item';
      modalHeader.classList.add('action-items-header');
      formLabel.textContent = 'What action should be taken?';
      submitButton.className = 'btn btn-action-items';
    }
    
    // Store the column type in a data attribute on the form
    addItemForm.dataset.column = columnType;
    
    // Show the modal
    addItemModal.classList.add('active');
    
    // Focus the textarea
    setTimeout(() => {
      itemContentTextarea.focus();
    }, 100);
  }
  
  // Handle item form submission
  async function handleItemSubmit(e) {
    e.preventDefault();
    
    const content = itemContentTextarea.value.trim();
    const columnType = addItemForm.dataset.column;
    
    if (!content) {
      showNotification('Please enter some content', true);
      return;
    }
    
    if (!currentBoardId) {
      showNotification('No board selected', true);
      return;
    }
    
    try {
      const user = getCurrentUser();
      const isAnonymous = !user;
      
      // Create the item
      await addDoc(collection(db, ITEMS_COLLECTION), {
        content,
        type: columnType,
        boardId: currentBoardId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        votes: 0,
        voters: {},
        authorId: user ? user.uid : 'anonymous',
        authorEmail: user ? user.email : 'anonymous',
        isAnonymous
      });
      
      // Update the board's updatedAt timestamp
      if (currentBoardData && currentBoardData.id) {
        await updateDoc(doc(db, BOARDS_COLLECTION, currentBoardData.id), {
          updatedAt: serverTimestamp()
        });
      }
      
      // Close the modal and reset form
      const addItemModal = document.getElementById('add-item-modal');
      addItemModal.classList.remove('active');
      addItemForm.reset();
      
      showNotification('Item added successfully!');
    } catch (error) {
      console.error('Error adding item:', error);
      showNotification('Failed to add item', true);
    }
  }
  
  // Set up real-time updates using Firestore onSnapshot
  function setupRealTimeUpdates() {
    // Clear any existing listeners
    unsubscribeListeners.forEach(unsubscribe => unsubscribe());
    unsubscribeListeners = [];
    
    if (!currentBoardId) {
      console.error('No board ID for real-time updates');
      return;
    }
    
    // Show loading state
    showBoardLoading(true);
    
    try {
      // Create query for items in this board
      const itemsRef = collection(db, ITEMS_COLLECTION);
      const q = query(
        itemsRef,
        where('boardId', '==', currentBoardId),
        orderBy('createdAt', 'desc')
      );
      
      // Subscribe to real-time updates
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const items = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        
        // Process and display items
        processItems(items);
        
        // Hide loading state
        showBoardLoading(false);
      }, (error) => {
        console.error('Error getting real-time updates:', error);
        showNotification('Failed to get real-time updates', true);
        showBoardLoading(false);
      });
      
      // Add to unsubscribe listeners
      unsubscribeListeners.push(unsubscribe);
      
    } catch (error) {
      console.error('Error setting up real-time updates:', error);
      showNotification('Failed to set up real-time updates', true);
      showBoardLoading(false);
    }
  }
  
  // Process and display items
  function processItems(items) {
    // Apply filters
    const filteredItems = filterItemsData(items);
    
    // Group items by type
    const groupedItems = {
      'went-well': filteredItems.filter(item => item.type === 'went-well'),
      'to-improve': filteredItems.filter(item => item.type === 'to-improve'),
      'action-items': filteredItems.filter(item => item.type === 'action-items')
    };
    
    // Update the UI for each column
    Object.keys(groupedItems).forEach(columnType => {
      updateColumn(columnType, groupedItems[columnType]);
    });
  }
  
  // Filter items based on search and sort
  function filterItems() {
    // This will trigger the real-time listener to re-process items
    setupRealTimeUpdates();
  }
  
  // Filter items data based on search and sort
  function filterItemsData(items) {
    let filteredItems = [...items];
    
    // Apply search filter
    if (searchInput && searchInput.value.trim()) {
      const searchTerm = searchInput.value.trim().toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.content.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply sorting
    if (sortSelect) {
      const sortOption = sortSelect.value;
      
      if (sortOption === 'votes') {
        filteredItems.sort((a, b) => b.votes - a.votes);
      } else if (sortOption === 'newest') {
        filteredItems.sort((a, b) => {
          const dateA = a.createdAt ? a.createdAt.seconds : 0;
          const dateB = b.createdAt ? b.createdAt.seconds : 0;
          return dateB - dateA;
        });
      } else if (sortOption === 'oldest') {
        filteredItems.sort((a, b) => {
          const dateA = a.createdAt ? a.createdAt.seconds : 0;
          const dateB = b.createdAt ? b.createdAt.seconds : 0;
          return dateA - dateB;
        });
      }
    }
    
    return filteredItems;
  }
  
  // Update a column with items
  function updateColumn(columnType, items) {
    const column = document.querySelector(`.${columnType}`);
    if (!column) return;
    
    const cardsContainer = column.querySelector('.cards');
    if (!cardsContainer) return;
    
    // Clear existing cards
    cardsContainer.innerHTML = '';
    
    // Add items to the column
    items.forEach(item => {
      const card = createCard(item);
      cardsContainer.appendChild(card);
    });
  }
  
  // Create a card element for an item
  function createCard(item) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = item.id;
    
    // Format the date
    const date = item.createdAt ? new Date(item.createdAt.seconds * 1000) : new Date();
    const formattedDate = date.toLocaleDateString();
    
    // Check if current user has voted
    const user = getCurrentUser();
    const userId = user ? user.uid : 'anonymous';
    const userVote = item.voters && item.voters[userId] ? item.voters[userId] : 0;
    
    card.innerHTML = `
      <p>${item.content}</p>
      <div class="card-meta">
        <span class="card-date">${formattedDate}</span>
        <span class="card-author">${item.isAnonymous ? 'Anonymous' : item.authorEmail.split('@')[0]}</span>
      </div>
      <div class="card-actions">
        <button class="vote-btn upvote ${userVote > 0 ? 'upvoted' : ''}" data-id="${item.id}">
          <i class="fas fa-chevron-up"></i>
        </button>
        <span class="vote-count">${item.votes || 0}</span>
        <button class="vote-btn downvote ${userVote < 0 ? 'downvoted' : ''}" data-id="${item.id}">
          <i class="fas fa-chevron-down"></i>
        </button>
        ${user && (user.uid === item.authorId || (currentBoardData && user.uid === currentBoardData.ownerId)) ? 
          `<button class="delete-btn" data-id="${item.id}">
            <i class="fas fa-trash"></i>
          </button>` : ''}
      </div>
    `;
    
    // Add event listeners
    const upvoteBtn = card.querySelector('.upvote');
    const downvoteBtn = card.querySelector('.downvote');
    const deleteBtn = card.querySelector('.delete-btn');
    
    upvoteBtn.addEventListener('click', () => handleVote(item.id, 1));
    downvoteBtn.addEventListener('click', () => handleVote(item.id, -1));
    
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this item?')) {
          deleteItem(item.id);
        }
      });
    }
    
    return card;
  }
  
  // Handle voting on an item
  async function handleVote(itemId, voteValue) {
    try {
      const user = getCurrentUser();
      const userId = user ? user.uid : 'anonymous';
      
      // Get the current item
      const itemRef = doc(db, ITEMS_COLLECTION, itemId);
      
      // Get the current voters object
      const itemDoc = await getDoc(itemRef);
      if (!itemDoc.exists()) {
        showNotification('Item not found', true);
        return;
      }
      
      const item = itemDoc.data();
      const voters = item.voters || {};
      const currentVote = voters[userId] || 0;
      
      // Calculate vote change
      let voteChange = 0;
      
      if (currentVote === voteValue) {
        // User is removing their vote
        voters[userId] = 0;
        voteChange = -currentVote;
      } else {
        // User is changing their vote
        voteChange = voteValue - currentVote;
        voters[userId] = voteValue;
      }
      
      // Update the item
      await updateDoc(itemRef, {
        votes: increment(voteChange),
        voters: voters,
        updatedAt: serverTimestamp()
      });
      
    } catch (error) {
      console.error('Error voting:', error);
      showNotification('Failed to vote', true);
    }
  }
  
  // Delete an item
  async function deleteItem(itemId) {
    try {
      await deleteDoc(doc(db, ITEMS_COLLECTION, itemId));
      showNotification('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      showNotification('Failed to delete item', true);
    }
  }
  
  // Debounce function for search input
  function debounce(func, delay) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }
  
  // Clean up function to remove listeners
  function cleanupBoard() {
    unsubscribeListeners.forEach(unsubscribe => unsubscribe());
    unsubscribeListeners = [];
  }
  
  export {
    initBoard,
    setupRealTimeUpdates,
    cleanupBoard
  };