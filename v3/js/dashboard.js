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
    
    // Check if sort select exists
    if (sortBoardsSelect) {
        console.log("Sort select found:", sortBoardsSelect);
        console.log("Current sort value:", sortBoardsSelect.value);
    } else {
        console.error("Sort select element not found!");
    }
    
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
    if (sortBoardsSelect) {
        console.log("Adding change event listener to sort select");
        sortBoardsSelect.addEventListener('change', (e) => {
            console.log("Sort changed to:", e.target.value);
            loadUserBoards();
        });
    }
    
    // Search boards
    if (searchBoardsInput) {
        searchBoardsInput.addEventListener('input', debounce(() => {
            loadUserBoards();
        }, 300));
    }
    
    // Setup modal close buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', () => {
            // Find the closest modal parent
            const modal = button.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
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
        const sortOption = sortBoardsSelect ? sortBoardsSelect.value : 'recent';
        console.log('Sort option selected:', sortOption);
        
        // Get the search term
        const searchTerm = searchBoardsInput ? searchBoardsInput.value.trim().toLowerCase() : '';
        
        // Create query to get user's boards
        let boardsQuery = query(
            collection(db, BOARDS_COLLECTION),
            where('ownerId', '==', user.uid)
        );
        
        // We'll fetch all boards and sort client-side for more reliable sorting
        const querySnapshot = await getDocs(boardsQuery);
        
        // Filter by search term if provided
        let boards = [];
        querySnapshot.forEach((doc) => {
            const boardData = { id: doc.id, ...doc.data() };
            console.log('Board data:', boardData);
            
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
        
        console.log('Boards before sorting:', boards);
        
        // Apply client-side sorting
        if (sortOption === 'recent') {
            console.log('Sorting by recent');
            boards.sort((a, b) => {
                const dateA = a.createdAt ? (a.createdAt.seconds || 0) : 0;
                const dateB = b.createdAt ? (b.createdAt.seconds || 0) : 0;
                return dateB - dateA; // Descending order (newest first)
            });
        } else if (sortOption === 'name') {
            console.log('Sorting by name');
            boards.sort((a, b) => {
                const titleA = (a.title || '').toLowerCase();
                const titleB = (b.title || '').toLowerCase();
                return titleA.localeCompare(titleB);
            });
        } else if (sortOption === 'activity') {
            console.log('Sorting by activity');
            boards.sort((a, b) => {
                const dateA = a.updatedAt ? (a.updatedAt.seconds || 0) : 0;
                const dateB = b.updatedAt ? (b.updatedAt.seconds || 0) : 0;
                return dateB - dateA; // Descending order (most recent activity first)
            });
        }
        
        console.log('Boards after sorting:', boards);
        
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
    
    // Store the board info for sharing
    window.currentBoardToShare = {
        id: boardId,
        title: boardTitle,
        url: boardUrl
    };
    
    // Show the share modal
    const shareModal = document.getElementById('share-modal');
    shareModal.classList.add('active');
    
    // Setup share option buttons
    setupShareOptions(boardUrl, boardTitle);
}

// Setup share options
function setupShareOptions(boardUrl, boardTitle) {
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const qrCodeBtn = document.getElementById('qr-code-btn');
    const emailShareBtn = document.getElementById('email-share-btn');
    const nativeShareBtn = document.getElementById('native-share-btn');
    const boardUrlContainer = document.querySelector('.board-url-container');
    const boardUrlInput = document.getElementById('board-url');
    const copySuccess = document.querySelector('.copy-success');
    const shareModal = document.getElementById('share-modal');
    
    // Hide success message initially
    copySuccess.style.display = 'none';
    
    // Set the board URL
    boardUrlInput.value = boardUrl;
    
    // Copy link button
    copyLinkBtn.addEventListener('click', () => {
        boardUrlContainer.style.display = 'block';
        boardUrlInput.select();
        document.execCommand('copy');
        
        // Show success message
        copySuccess.style.display = 'block';
        setTimeout(() => {
            copySuccess.style.display = 'none';
        }, 2000);
    });
    
    // QR Code button
    qrCodeBtn.addEventListener('click', () => {
        // Close the share modal
        shareModal.classList.remove('active');
        
        // Open the QR code modal
        const qrCodeModal = document.getElementById('qr-code-modal');
        qrCodeModal.classList.add('active');
        
        // Generate QR code
        generateQRCode(boardUrl);
    });
    
    // Email share button
    emailShareBtn.addEventListener('click', () => {
        const subject = encodeURIComponent(`Feedback Board: ${boardTitle}`);
        const body = encodeURIComponent(`Check out this feedback board: ${boardTitle}\n\n${boardUrl}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    });
    
    // Native share button (Web Share API)
    if (navigator.share) {
        nativeShareBtn.style.display = 'flex';
        nativeShareBtn.addEventListener('click', () => {
            navigator.share({
                title: boardTitle,
                text: `Check out this feedback board: ${boardTitle}`,
                url: boardUrl
            })
            .then(() => {
                console.log('Shared successfully');
                shareModal.classList.remove('active');
            })
            .catch(error => console.error('Error sharing:', error));
        });
    } else {
        nativeShareBtn.style.display = 'none';
    }
}

// Generate QR Code
function generateQRCode(url) {
    console.log('Generating QR code for URL:', url);
    const qrCodeDisplay = document.getElementById('qr-code-display');
    const downloadQrBtn = document.getElementById('download-qr-btn');
    
    // Clear previous QR code
    qrCodeDisplay.innerHTML = '';
    
    try {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        qrCodeDisplay.appendChild(canvas);
        
        // Generate QR code
        QRCode.toCanvas(canvas, url, {
            width: 200,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        }, function(error) {
            if (error) {
                console.error('Error generating QR code:', error);
                qrCodeDisplay.innerHTML = '<p>Error generating QR code</p>';
                return;
            }
            
            console.log('QR code generated successfully');
        });
        
        // Setup download button
        downloadQrBtn.addEventListener('click', () => {
            console.log('Download button clicked');
            // Create a temporary link
            const link = document.createElement('a');
            link.download = 'feedback-board-qr.png';
            
            // Get the canvas and convert to data URL
            if (canvas) {
                link.href = canvas.toDataURL('image/png');
                link.click();
                console.log('QR code download initiated');
            } else {
                console.error('Canvas not found for download');
            }
        });
    } catch (e) {
        console.error('Exception in QR code generation:', e);
        qrCodeDisplay.innerHTML = '<p>Error generating QR code: ' + e.message + '</p>';
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