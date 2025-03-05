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
    setTimeout(setupMobileView, 1000);
    
    // Also listen for Firebase state changes
    document.addEventListener('firebase-loaded', setupMobileView);
    
    // Add a safety timeout to ensure board always displays
    setTimeout(ensureBoardVisible, 5000);
  });
  
  // Main function to set up the mobile view
  function setupMobileView() {
    // Only run on mobile devices
    if (window.innerWidth > 768) return;
    
    console.log('Setting up mobile view');
    
    // Hide loading indicator if it's still showing
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
    
    // Make sure board is visible
    const board = document.querySelector('.board');
    if (board) {
      board.style.display = 'block';
    }
    
    // Set up proper collapsible columns
    setupCollapsibleColumns();
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
      board.style.display = window.innerWidth <= 768 ? 'block' : 'grid';
    }
  }
  
  // Set up proper collapsible columns
  function setupCollapsibleColumns() {
    console.log('Setting up collapsible columns');
    const columns = document.querySelectorAll('.column');
    
    columns.forEach((column, index) => {
      // Add proper aria attributes for accessibility
      const header = column.querySelector('.column-header');
      const cardsContainer = column.querySelector('.cards');
      
      if (!header || !cardsContainer) return;
      
      // Set up proper ARIA attributes
      const headerId = `column-header-${index}`;
      const contentId = `column-content-${index}`;
      
      header.setAttribute('id', headerId);
      header.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');
      header.setAttribute('aria-controls', contentId);
      header.setAttribute('role', 'button');
      header.setAttribute('tabindex', '0');
      
      cardsContainer.setAttribute('id', contentId);
      cardsContainer.setAttribute('role', 'region');
      cardsContainer.setAttribute('aria-labelledby', headerId);
      
      // Make first column expanded, others collapsed on mobile
      if (index === 0) {
        column.classList.remove('collapsed');
      } else {
        column.classList.add('collapsed');
      }
      
      // Remove any existing event listeners
      header.removeEventListener('click', headerClickHandler);
      
      // Add click event listener
      header.addEventListener('click', headerClickHandler);
      
      // Also handle keyboard interaction
      header.addEventListener('keydown', function(e) {
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
    
    // If we have local storage, save state
    try {
      const columns = document.querySelectorAll('.column');
      const state = Array.from(columns).map(col => col.classList.contains('collapsed'));
      localStorage.setItem('feedbackBoardColumnState', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving column state:', error);
    }
  }