// mobile-fix.js - A cleaner solution for mobile display issues

/**
 * This is a focused fix for mobile display issues that:
 * 1. Ensures the board displays properly after Firebase loads
 * 2. Correctly sets up collapsible columns on mobile
 * 3. Doesn't interfere with existing data loading
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Mobile fix script loaded');
    
    // Set up mobile enhancements after a short delay
    // to ensure other scripts have had time to run
    setTimeout(setupMobileView, 500);
    
    // Also listen for Firebase state changes
    document.addEventListener('firebase-loaded', setupMobileView);
    
    // Add a safety timeout to ensure board always displays
    setTimeout(ensureBoardVisible, 5000);
    
    // Add window resize listener to handle orientation changes
    window.addEventListener('resize', handleWindowResize);
  });
  
  // Debounce function to limit how often resize event fires
  function debounce(func, wait) {
    let timeout;
    return function() {
      const context = this;
      const args = arguments;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
    };
  }
  
  // Handle window resize (debounced)
  const handleWindowResize = debounce(function() {
    setupMobileView();
  }, 250);
  
  // Main function to set up the mobile view
  function setupMobileView() {
    // Determine if we're in mobile view based on CSS media query
    const isMobileView = window.matchMedia('(max-width: 768px)').matches;
    
    console.log('Setting up mobile view, mobile mode:', isMobileView);
    
    // Hide loading indicator if it's still showing
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
    
    // Make sure board is visible with appropriate display mode
    const board = document.querySelector('.board');
    if (board) {
      board.style.display = isMobileView ? 'grid' : 'grid';
    }
    
    // Set up proper collapsible columns only in mobile view
    if (isMobileView) {
      setupCollapsibleColumns();
    } else {
      // In desktop mode, make sure all columns are expanded
      document.querySelectorAll('.column').forEach(column => {
        column.classList.remove('collapsed');
        const header = column.querySelector('.column-header');
        if (header) {
          header.setAttribute('aria-expanded', 'true');
        }
      });
    }
  }
  
  // Function to ensure the board is eventually visible
  function ensureBoardVisible() {
    const loadingIndicator = document.getElementById('loading-indicator');
    const board = document.querySelector('.board');
    
    if (loadingIndicator && loadingIndicator.style.display !== 'none') {
      console.log('Safety timeout: hiding loading indicator');
      loadingIndicator.style.display = 'none';
    }
    
    if (board && board.style.display === 'none') {
      console.log('Safety timeout: showing board');
      board.style.display = 'grid';
    }
  }
  
  // Set up proper collapsible columns
  function setupCollapsibleColumns() {
    console.log('Setting up collapsible columns');
    const columns = document.querySelectorAll('.column');
    
    // Check if we have a saved state
    let savedState = null;
    try {
      const savedStateJSON = localStorage.getItem('feedbackBoardColumnState');
      if (savedStateJSON) {
        savedState = JSON.parse(savedStateJSON);
      }
    } catch (err) {
      console.error('Error loading saved column state:', err);
    }
    
    columns.forEach((column, index) => {
      // Add proper aria attributes for accessibility
      const header = column.querySelector('.column-header');
      const cardsContainer = column.querySelector('.cards');
      
      if (!header || !cardsContainer) return;
      
      // Set up proper ARIA attributes
      const headerId = `column-header-${index}`;
      const contentId = `column-content-${index}`;
      
      header.setAttribute('id', headerId);
      header.setAttribute('aria-controls', contentId);
      header.setAttribute('role', 'button');
      header.setAttribute('tabindex', '0');
      
      cardsContainer.setAttribute('id', contentId);
      cardsContainer.setAttribute('role', 'region');
      cardsContainer.setAttribute('aria-labelledby', headerId);
      
      // Apply saved state if available, otherwise default to first column expanded
      let isCollapsed = false;
      
      if (savedState && savedState.length > index) {
        isCollapsed = savedState[index];
      } else {
        isCollapsed = index !== 0;
      }
      
      if (isCollapsed) {
        column.classList.add('collapsed');
        header.setAttribute('aria-expanded', 'false');
      } else {
        column.classList.remove('collapsed');
        header.setAttribute('aria-expanded', 'true');
      }
      
      // Remove any existing event listeners using clone and replace technique
      const newHeader = header.cloneNode(true);
      header.parentNode.replaceChild(newHeader, header);
      
      // Add click event listener to new element
      newHeader.addEventListener('click', headerClickHandler);
      
      // Also handle keyboard interaction
      newHeader.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          headerClickHandler.call(this, e);
        }
      });
    });
  }
  
  // Event handler for header clicks
  function headerClickHandler(e) {
    // Don't toggle if clicking add button
    if (e.target.classList.contains('add-item') || 
        e.target.closest('.add-item')) {
      return;
    }
    
    const header = this;
    const column = header.closest('.column');
    
    if (!column) return;
    
    // Toggle collapsed state
    const isCollapsed = column.classList.toggle('collapsed');
    
    // Update ARIA attribute
    header.setAttribute('aria-expanded', !isCollapsed);
    
    // If the column is now expanded, scroll it into view
    if (!isCollapsed) {
      setTimeout(() => {
        column.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
    
    // Save state
    saveColumnState();
  }
  
  // Save column state to localStorage
  function saveColumnState() {
    try {
      const columns = document.querySelectorAll('.column');
      const state = Array.from(columns).map(col => col.classList.contains('collapsed'));
      localStorage.setItem('feedbackBoardColumnState', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving column state:', error);
    }
  }

// Export functions for potential use in other modules
export {
  setupMobileView,
  ensureBoardVisible,
  setupCollapsibleColumns
};