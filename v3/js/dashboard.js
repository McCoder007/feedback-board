// Dashboard.js - Handles the multi-board dashboard functionality
import { setupThemeToggle } from './theme.js';
import { setupAuth, getCurrentUser, onAuthStateChanged } from './auth.js';
import { db, collection, addDoc, getDocs, query, where, orderBy, serverTimestamp, doc, updateDoc, deleteDoc } from './firebase-config.js';
import { showNotification, setupModals } from './ui.js';

// Firebase collection for boards
const BOARDS_COLLECTION = 'boards';

// DOM Elements
const createBoardBtn = document.getElementById('create-board-btn');
const createBoardForm = document.getElementById('create-board-form');
const boardsContainer = document.querySelector('.boards-container');
const noBoardsMessage = document.querySelector('.no-boards-message');
const createFirstBoardBtn = document.querySelector('.create-first-board-btn');
const loadingIndicator = document.getElementById('loading-indicator');
const sortBoardsSelect = document.getElementById('sort-boards');
const searchBoardsInput = document.getElementById('search-boards');

// Initialize the dashboard
async function initDashboard() {
    console.log("Initializing dashboard...");
    
    // Setup UI components
    setupModals();
    setupThemeToggle();
    setupAuth();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load boards when auth state changes
    onAuthStateChanged((user) => {
        if (user) {
            loadUserBoards();
        } else {
            // Show message for non-logged in users
            showNoBoards(true);
            loadingIndicator.style.display = 'none';
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Create board button
    createBoardBtn.addEventListener('click', () => {
        const createBoardModal = document.getElementById('create-board-modal');
        createBoardModal.classList.add('active');
    });
    
    // Create first board button (shown when no boards exist)
    createFirstBoardBtn.addEventListener('click', () => {
        const createBoardModal = document.getElementById('create-board-modal');
        createBoardModal.classList.add('active');
    });
    
    // Create board form submission
    createBoardForm.addEventListener('submit', handleCreateBoard);
    
    // Sort boards
    sortBoardsSelect.addEventListener('change', () => {
        loadUserBoards();
    });
    
    // Search boards
    searchBoardsInput.addEventListener('input', debounce(() => {
        loadUserBoards();
    }, 300));
}

// Handle board creation
async function handleCreateBoard(e) {
    e.preventDefault();
    
    const title = document.getElementById('board-title').value.trim();
    const description = document.getElementById('board-description').value.trim();
    const access = document.getElementById('board-access').value;
    
    if (!title) {
        showNotification('Please enter a board title', true);
        return;
    }
    
    const user = getCurrentUser();
    if (!user) {
        showNotification('You must be logged in to create a board', true);
        return;
    }
    
    try {
        // Create the board
        await addDoc(collection(db, BOARDS_COLLECTION), {
            title,
            description,
            access,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            ownerId: user.uid,
            ownerEmail: user.email
        });
        
        // Close the modal and reset form
        const createBoardModal = document.getElementById('create-board-modal');
        createBoardModal.classList.remove('active');
        createBoardForm.reset();
        
        // Reload the boards
        showNotification('Board created successfully!');
        loadUserBoards();
        
    } catch (error) {
        console.error('Error creating board:', error);
        showNotification('Failed to create board. Please try again.', true);
    }
}

// Load user's boards
async function loadUserBoards() {
    const user = getCurrentUser();
    if (!user) return;
    
    loadingIndicator.style.display = 'flex';
    boardsContainer.innerHTML = '';
    
    try {
        // Get the sort option
        const sortOption = sortBoardsSelect.value;
        
        // Get the search term
        const searchTerm = searchBoardsInput.value.trim().toLowerCase();
        
        // Create query to get user's boards
        let boardsQuery = query(
            collection(db, BOARDS_COLLECTION),
            where('ownerId', '==', user.uid)
        );
        
        // Add sorting
        if (sortOption === 'recent') {
            boardsQuery = query(boardsQuery, orderBy('createdAt', 'desc'));
        } else if (sortOption === 'name') {
            boardsQuery = query(boardsQuery, orderBy('title'));
        } else if (sortOption === 'activity') {
            boardsQuery = query(boardsQuery, orderBy('updatedAt', 'desc'));
        }
        
        const querySnapshot = await getDocs(boardsQuery);
        
        // Filter by search term if provided
        let boards = [];
        querySnapshot.forEach((doc) => {
            const boardData = { id: doc.id, ...doc.data() };
            
            // Apply search filter
            if (searchTerm) {
                if (
                    boardData.title.toLowerCase().includes(searchTerm) ||
                    (boardData.description && boardData.description.toLowerCase().includes(searchTerm))
                ) {
                    boards.push(boardData);
                }
            } else {
                boards.push(boardData);
            }
        });
        
        // Display boards or no boards message
        if (boards.length > 0) {
            renderBoards(boards);
            showNoBoards(false);
        } else {
            showNoBoards(true);
        }
    } catch (error) {
        console.error('Error loading boards:', error);
        showNotification('Failed to load boards. Please try again.', true);
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Render boards to the container
function renderBoards(boards) {
    boardsContainer.innerHTML = '';
    
    boards.forEach(board => {
        const boardCard = createBoardCard(board);
        boardsContainer.appendChild(boardCard);
    });
}

// Create a board card element
function createBoardCard(board) {
    const boardCard = document.createElement('div');
    boardCard.className = 'board-card';
    
    // Format dates
    const createdDate = board.createdAt ? new Date(board.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown';
    const updatedDate = board.updatedAt ? new Date(board.updatedAt.seconds * 1000).toLocaleDateString() : 'Unknown';
    
    boardCard.innerHTML = `
        <div class="board-card-header">
            <h3 class="board-card-title">${board.title}</h3>
            <div class="board-card-actions">
                <button class="board-action-btn edit-board" data-id="${board.id}" title="Edit Board">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="board-action-btn delete-board" data-id="${board.id}" title="Delete Board">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <p class="board-card-description">${board.description || 'No description'}</p>
        <div class="board-card-meta">
            <span class="board-access ${board.access}">
                <i class="fas ${board.access === 'public' ? 'fa-globe' : 'fa-lock'}"></i>
                ${board.access === 'public' ? 'Public' : 'Private'}
            </span>
            <span class="board-date">Created: ${createdDate}</span>
        </div>
        <a href="board.html?id=${board.id}" class="btn btn-primary board-open-btn">Open Board</a>
        <button class="btn btn-outline board-share-btn" data-id="${board.id}">
            <i class="fas fa-share-alt"></i> Share
        </button>
    `;
    
    // Add event listeners
    const editBtn = boardCard.querySelector('.edit-board');
    const deleteBtn = boardCard.querySelector('.delete-board');
    const shareBtn = boardCard.querySelector('.board-share-btn');
    
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // TODO: Implement edit board functionality
        showNotification('Edit board functionality coming soon');
    });
    
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
            deleteBoard(board.id);
        }
    });
    
    shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        shareBoardLink(board.id, board.title);
    });
    
    return boardCard;
}

// Delete a board
async function deleteBoard(boardId) {
    try {
        await deleteDoc(doc(db, BOARDS_COLLECTION, boardId));
        showNotification('Board deleted successfully');
        loadUserBoards();
    } catch (error) {
        console.error('Error deleting board:', error);
        showNotification('Failed to delete board. Please try again.', true);
    }
}

// Share board link
function shareBoardLink(boardId, boardTitle) {
    const boardUrl = `${window.location.origin}${window.location.pathname.replace('dashboard.html', 'board.html')}?id=${boardId}`;
    
    // Check if the Web Share API is available
    if (navigator.share) {
        navigator.share({
            title: boardTitle,
            text: `Check out this feedback board: ${boardTitle}`,
            url: boardUrl
        })
        .then(() => console.log('Shared successfully'))
        .catch((error) => {
            console.error('Error sharing:', error);
            fallbackShare(boardUrl);
        });
    } else {
        fallbackShare(boardUrl);
    }
}

// Fallback share method (copy to clipboard)
function fallbackShare(url) {
    // Create a temporary input element
    const tempInput = document.createElement('input');
    tempInput.value = url;
    document.body.appendChild(tempInput);
    
    // Select and copy the link
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    
    showNotification('Board link copied to clipboard!');
}

// Show or hide the no boards message
function showNoBoards(show) {
    noBoardsMessage.style.display = show ? 'flex' : 'none';
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

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', initDashboard); 