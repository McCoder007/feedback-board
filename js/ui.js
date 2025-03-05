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