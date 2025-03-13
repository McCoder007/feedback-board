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
    
    // No longer using page transitions
    // setupPageTransitions();
    
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
    
    // Prepare the login prompt for non-authenticated users
    const loginPrompt = noBoardsMessage.querySelector('.login-prompt');
    console.log("Login prompt element during init:", loginPrompt);
    if (loginPrompt) {
        console.log("Setting initial login prompt display to none");
        loginPrompt.style.display = 'none'; // Hide initially to prevent flashing
    } else {
        console.error("Login prompt element not found during initialization!");
        console.log("No-boards-message HTML:", noBoardsMessage.innerHTML);
    }
    
    // Load boards when auth state changes
    onAuthStateChanged((user) => {
        console.log("Auth state changed, user:", user ? "authenticated" : "not authenticated");
        if (user) {
            loadUserBoards();
        } else {
            // Clear the boards container when user logs out
            boardsContainer.innerHTML = '';
            // Show message for non-logged in users
            showNoBoards(true, true);
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
        
        // Automatically focus on the board title input
        setTimeout(() => {
            document.getElementById('board-title').focus();
        }, 50); // Small delay to ensure modal is fully displayed
    });
    
    // Create first board button (shown when no boards exist)
    createFirstBoardBtn.addEventListener('click', () => {
        const createBoardModal = document.getElementById('create-board-modal');
        createBoardModal.classList.add('active');
        
        // Automatically focus on the board title input
        setTimeout(() => {
            document.getElementById('board-title').focus();
        }, 50); // Small delay to ensure modal is fully displayed
    });
    
    // Create board form submission
    createBoardForm.addEventListener('submit', handleCreateBoard);
    
    // Edit board form submission
    const editBoardForm = document.getElementById('edit-board-form');
    if (editBoardForm) {
        editBoardForm.addEventListener('submit', handleEditBoard);
        
        // Allow Enter key in edit description textarea to submit the form
        const editBoardDescription = document.getElementById('edit-board-description');
        if (editBoardDescription) {
            editBoardDescription.addEventListener('keydown', (e) => {
                // If Enter is pressed without Shift key
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault(); // Prevent the default action (new line)
                    // Submit the form
                    editBoardForm.dispatchEvent(new Event('submit'));
                }
            });
        }
    }
    
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
    
    // Allow Enter key in description textarea to submit the form (but Shift+Enter for new lines)
    const boardDescription = document.getElementById('board-description');
    if (boardDescription) {
        boardDescription.addEventListener('keydown', (e) => {
            // If Enter is pressed without Shift key
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent the default action (new line)
                // Submit the form
                createBoardForm.dispatchEvent(new Event('submit'));
            }
        });
    }
    
    // Login prompt button
    const loginPromptBtn = document.getElementById('login-prompt-btn');
    if (loginPromptBtn) {
        loginPromptBtn.addEventListener('click', () => {
            const loginBtn = document.getElementById('login-btn');
            if (loginBtn) {
                loginBtn.click();
            }
        });
    }
}

// Handle board creation
async function handleCreateBoard(e) {
    e.preventDefault();
    
    const title = document.getElementById('board-title').value.trim();
    const description = document.getElementById('board-description').value.trim();
    // All boards are now public - access level selection removed
    const access = 'public';
    
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
    boardCard.setAttribute('data-id', board.id);
    
    // Format dates
    const createdDate = board.createdAt ? new Date(board.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown';
    
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
            <span class="board-date">Created: ${createdDate}</span>
        </div>
        <div class="board-card-footer">
            <button class="board-share-btn" data-id="${board.id}">
                <i class="fas fa-share-alt"></i> Share
            </button>
        </div>
    `;
    
    // Make the entire card clickable to open the board
    boardCard.addEventListener('click', (e) => {
        // Don't navigate if clicking on action buttons
        if (!e.target.closest('.board-action-btn') && !e.target.closest('.board-share-btn')) {
            window.location.href = `board.html?id=${board.id}`;
        }
    });
    
    // Add event listeners for action buttons
    const editBtn = boardCard.querySelector('.edit-board');
    const deleteBtn = boardCard.querySelector('.delete-board');
    const shareBtn = boardCard.querySelector('.board-share-btn');
    
    editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // Open edit board modal and populate with board data
        openEditBoardModal(board);
    });
    
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
            deleteBoard(board.id);
        }
    });
    
    shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openShareModal(board.id, board.title);
    });
    
    return boardCard;
}

// Open the edit board modal with the board data
function openEditBoardModal(board) {
    const editBoardModal = document.getElementById('edit-board-modal');
    const editBoardId = document.getElementById('edit-board-id');
    const editBoardTitle = document.getElementById('edit-board-title');
    const editBoardDescription = document.getElementById('edit-board-description');
    
    // Set the values from the board
    editBoardId.value = board.id;
    editBoardTitle.value = board.title || '';
    editBoardDescription.value = board.description || '';
    
    // Open the modal
    editBoardModal.classList.add('active');
    
    // Focus on the title field
    setTimeout(() => {
        editBoardTitle.focus();
    }, 50);
}

// Handle edit board form submission
async function handleEditBoard(e) {
    e.preventDefault();
    
    const boardId = document.getElementById('edit-board-id').value;
    const title = document.getElementById('edit-board-title').value.trim();
    const description = document.getElementById('edit-board-description').value.trim();
    
    if (!title) {
        showNotification('Please enter a board title', true);
        return;
    }
    
    const user = getCurrentUser();
    if (!user) {
        showNotification('You must be logged in to edit a board', true);
        return;
    }
    
    try {
        // Update the board
        await updateDoc(doc(db, BOARDS_COLLECTION, boardId), {
            title,
            description,
            updatedAt: serverTimestamp()
        });
        
        // Close the modal and reset form
        const editBoardModal = document.getElementById('edit-board-modal');
        editBoardModal.classList.remove('active');
        document.getElementById('edit-board-form').reset();
        
        // Reload the boards
        showNotification('Board updated successfully!');
        loadUserBoards();
        
    } catch (error) {
        console.error('Error updating board:', error);
        showNotification('Failed to update board. Please try again.', true);
    }
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

// Function to open share modal
function openShareModal(boardId, boardTitle) {
    console.log('Opening share modal for board:', boardId, boardTitle);
    
    // Get the share modal
    const shareModal = document.getElementById('share-modal');
    
    if (shareModal) {
        // Generate the board URL
        const boardUrl = `${window.location.origin}${window.location.pathname.replace('dashboard.html', 'board.html')}?id=${boardId}`;
        
        // Set the board URL in the input field
        const boardUrlInput = document.getElementById('board-url');
        if (boardUrlInput) {
            boardUrlInput.value = boardUrl;
        }
        
        // Setup copy button
        const copyUrlBtn = document.getElementById('copy-url-btn');
        if (copyUrlBtn) {
            // Remove any existing event listeners
            const newCopyBtn = copyUrlBtn.cloneNode(true);
            copyUrlBtn.parentNode.replaceChild(newCopyBtn, copyUrlBtn);
            
            // Add new event listener
            newCopyBtn.addEventListener('click', function() {
                boardUrlInput.select();
                boardUrlInput.setSelectionRange(0, 99999); // For mobile devices
                
                // Copy to clipboard
                navigator.clipboard.writeText(boardUrlInput.value)
                    .then(() => {
                        // Show success state on button
                        const copyButton = document.getElementById('copy-url-btn');
                        if (copyButton) {
                            // Change button text
                            const buttonText = copyButton.querySelector('.button-text');
                            if (buttonText) buttonText.textContent = 'Copied!';
                            
                            // Add success class for styling
                            copyButton.classList.add('copy-success');
                            
                            // Revert back after 2 seconds
                            setTimeout(() => {
                                copyButton.classList.remove('copy-success');
                                if (buttonText) buttonText.textContent = 'Copy';
                            }, 2000);
                        }
                    })
                    .catch(err => {
                        console.error('Failed to copy: ', err);
                        showNotification('Failed to copy URL', true);
                    });
            });
        }
        
        // Generate QR code
        generateQRCode(boardUrl);
        
        // Show the modal
        shareModal.classList.add('active');
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
        // Use QR Server API which is more reliable
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(url)}&size=200x200&margin=10`;
        
        // Create image element
        const qrCodeImg = document.createElement('img');
        qrCodeImg.src = qrCodeUrl;
        qrCodeImg.alt = 'QR Code for board URL';
        qrCodeImg.id = 'qr-code-img';
        qrCodeImg.style.width = '100%';
        qrCodeImg.style.height = 'auto';
        
        // Add loading indicator and error handling
        qrCodeImg.onerror = function() {
            qrCodeDisplay.innerHTML = '<p style="text-align: center; color: var(--error-color);">Failed to load QR code. Please try again.</p>';
        };
        
        qrCodeImg.onload = function() {
            // QR code loaded successfully
            console.log('QR code generated successfully');
        };
        
        // Append to container
        qrCodeDisplay.appendChild(qrCodeImg);
        
        // Setup download button
        downloadQrBtn.addEventListener('click', downloadQrCode);
    } catch (e) {
        console.error('Exception in QR code generation:', e);
        qrCodeDisplay.innerHTML = '<p style="text-align: center; color: var(--error-color);">Failed to generate QR code.</p>';
    }
}

// Function to download QR code
function downloadQrCode() {
    const qrCodeImg = document.getElementById('qr-code-img');
    if (qrCodeImg) {
        try {
            // Create a canvas element
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set canvas dimensions to match the image
            canvas.width = qrCodeImg.naturalWidth || 200;
            canvas.height = qrCodeImg.naturalHeight || 200;
            
            // Draw the image on the canvas
            ctx.drawImage(qrCodeImg, 0, 0, canvas.width, canvas.height);
            
            // Convert canvas to data URL
            const dataURL = canvas.toDataURL('image/png');
            
            // Create a temporary link element
            const downloadLink = document.createElement('a');
            
            // Set download attributes
            downloadLink.href = dataURL;
            downloadLink.download = 'feedback-board-qr.png';
            
            // Append to body, click, and remove
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            // Show success notification
            showNotification('QR code downloaded successfully');
        } catch (error) {
            console.error('Error downloading QR code:', error);
            showNotification('Failed to download QR code', true);
        }
    } else {
        showNotification('QR code not available for download', true);
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
function showNoBoards(show, isLoggedOut = false) {
    console.log("showNoBoards called with:", { show, isLoggedOut });
    noBoardsMessage.style.display = show ? 'flex' : 'none';
    
    // Update the message based on login status
    const messageElement = noBoardsMessage.querySelector('p');
    const createBoardButton = noBoardsMessage.querySelector('.create-first-board-btn');
    const loginPrompt = noBoardsMessage.querySelector('.login-prompt');
    
    console.log("Elements found:", { 
        messageElement: messageElement ? true : false, 
        createBoardButton: createBoardButton ? true : false,
        loginPrompt: loginPrompt ? true : false
    });
    
    if (messageElement) {
        if (isLoggedOut) {
            console.log("Showing login prompt for non-authenticated user");
            // Hide the default message for non-authenticated users
            messageElement.style.display = 'none';
            if (createBoardButton) {
                createBoardButton.style.display = 'none';
            }
            // Show login prompt
            if (loginPrompt) {
                console.log("Setting login prompt display to flex");
                loginPrompt.style.display = 'flex';
            } else {
                console.error("Login prompt element not found!");
            }
        } else {
            console.log("Showing default message for authenticated user");
            // Show the default message for authenticated users
            messageElement.style.display = 'block';
            messageElement.textContent = 'You don\'t have any boards yet. Create your first board to get started!';
            if (createBoardButton) {
                createBoardButton.style.display = 'block';
            }
            // Hide login prompt
            if (loginPrompt) {
                loginPrompt.style.display = 'none';
            }
        }
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

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initDashboard();
});

// Export the functions for use in other modules
export { 
  initDashboard,
  openShareModal,
  generateQRCode
}; 