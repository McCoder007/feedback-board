// UI utilities module

// Function to show notification
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
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
  
  // Setup modal functionality
  function setupModals() {
    const closeModalBtns = document.querySelectorAll('.close-modal, .close-modal-btn');
    
    // Close modal buttons
    closeModalBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(modal => {
          modal.classList.remove('active');
        });
      });
    });
    
    // Handle Enter key in the textarea
    const itemContentTextarea = document.getElementById('item-content');
    if (itemContentTextarea) {
      itemContentTextarea.addEventListener('keydown', (e) => {
        // Check if the key pressed was Enter without Shift (to allow for multi-line input with Shift+Enter)
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault(); // Prevent default behavior (new line)
          
          // Trigger form submission
          const submitBtn = document.getElementById('add-item-form').querySelector('button[type="submit"]');
          submitBtn.click();
        }
      });
    }
  }
  
  // Show a loading state for the board
  function showBoardLoading(isLoading = true) {
    const loadingIndicator = document.getElementById('loading-indicator');
    const board = document.querySelector('.board');
    
    if (loadingIndicator) {
      loadingIndicator.style.display = isLoading ? 'flex' : 'none';
    }
    
    if (board) {
      board.style.display = isLoading ? 'none' : 'grid';
    }
  }
  
// Enhanced failsafe function in ui.js
function setupBoardLoadingFailsafe() {
    // Set a shorter timeout for mobile devices
    const timeoutDuration = window.innerWidth <= 768 ? 8000 : 10000;
    
    setTimeout(() => {
      const loadingIndicator = document.getElementById('loading-indicator');
      const board = document.querySelector('.board');
      const errorMessage = document.getElementById('error-message');
      
      if (loadingIndicator && loadingIndicator.style.display !== 'none') {
        console.log("Failsafe timeout triggered - attempting recovery");
        
        // Hide loading indicator
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        
        // Check if we can display the board
        if (board) {
          if (board.querySelectorAll('.column').length > 0) {
            // We have columns, so show the board
            board.style.display = window.innerWidth <= 768 ? 'block' : 'grid';
            console.log("Board recovered and displayed");
          } else {
            // No columns, show error message
            if (errorMessage) {
              errorMessage.style.display = 'block';
              console.log("Showing error message - no columns found");
            }
          }
        }
      }
    }, timeoutDuration);
    
    // Add retry button functionality
    const retryButton = document.getElementById('retry-button');
    if (retryButton) {
      retryButton.addEventListener('click', () => {
        location.reload();
      });
    }
  }
  
  export { 
    showNotification, 
    setupModals, 
    showBoardLoading,
    setupBoardLoadingFailsafe
  };