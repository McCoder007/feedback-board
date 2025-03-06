// UI utilities module

// Function to show notification
function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = 'notification';
    
    if (isError) {
      notification.classList.add('error');
      // For errors, use the centered style to make them more visible
      notification.classList.add('centered');
    }
    
    notification.classList.add('show');
    
    // Longer timeout for error messages
    const timeout = isError ? 5000 : 3000;
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, timeout);
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
    
    // Add escape key functionality to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Find any active modals and close them
        const activeModals = document.querySelectorAll('.modal.active');
        if (activeModals.length > 0) {
          activeModals.forEach(modal => {
            modal.classList.remove('active');
            
            // Clear any form inputs if needed
            const form = modal.querySelector('form');
            if (form) {
              form.reset();
            }
          });
          
          console.log('Modal closed with Escape key');
        }
      }
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
    
    // Prevent modals from closing when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        // Only close if the click is directly on the modal background (not on modal content)
        if (e.target === modal) {
          // We're preventing the default behavior of closing when clicking outside
          e.stopPropagation();
        }
      });
    });
  }
  
  // Show a loading state for the board
  function showBoardLoading(isLoading = true) {
    const boardContainer = document.getElementById('board-container');
    
    if (boardContainer) {
      if (!isLoading) {
        boardContainer.classList.add('loaded');
      } else {
        boardContainer.classList.remove('loaded');
      }
    }
  }
  
  // Setup failsafe to ensure board is displayed even if data loading fails
  function setupBoardLoadingFailsafe() {
    setTimeout(() => {
      const loadingIndicator = document.getElementById('loading-indicator');
      const board = document.querySelector('.board');
      
      if (loadingIndicator && loadingIndicator.style.display !== 'none') {
        console.log("Failsafe timeout triggered - showing board anyway");
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (board) board.style.display = 'grid';
      }
    }, 5000); // 5 second timeout
  }
  
  export { 
    showNotification, 
    setupModals, 
    showBoardLoading,
    setupBoardLoadingFailsafe
  };