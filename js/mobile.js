// mobile.js - Collapsible sections for mobile
// Updated version with fixed event handlers

// Function to set up mobile-specific enhancements
function setupMobileEnhancements() {
    console.log("Setting up mobile enhancements, width:", window.innerWidth);
    
    if (window.innerWidth <= 768) {
      // First, ensure the board is visible
      const board = document.querySelector('.board');
      const loadingIndicator = document.getElementById('loading-indicator');
      
      if (loadingIndicator) loadingIndicator.style.display = 'none';
      if (board) board.style.display = 'block';
      
      // Short delay to ensure DOM is ready
      setTimeout(() => {
        // Set up collapsible columns
        setupCollapsibleColumns();
        
        // Add section navigation
        setupSectionNavigation();
        
        // Add item counts
        updateColumnItemCounts();
        
        // Mark last viewed column as active
        restoreActiveColumn();
        
        console.log("Mobile enhancements setup complete");
      }, 300);
    }
  }
  
  // Set up collapsible columns - FIXED EVENT HANDLING
  function setupCollapsibleColumns() {
    console.log("Setting up collapsible columns");
    const columns = document.querySelectorAll('.column');
    
    columns.forEach((column, index) => {
      const header = column.querySelector('.column-header');
      if (!header) {
        console.log("Header not found for column", index);
        return;
      }
      
      // Create item count badge if it doesn't exist
      if (!column.querySelector('.item-count')) {
        let itemCount = document.createElement('span');
        itemCount.className = 'item-count';
        itemCount.textContent = column.querySelectorAll('.card').length;
        
        // Insert before the + button
        const addBtn = header.querySelector('.add-item');
        if (addBtn) {
          header.insertBefore(itemCount, addBtn);
        } else {
          header.appendChild(itemCount);
        }
      }
      
      // Expand the first column, collapse others initially
      if (index > 0) {
        column.classList.add('collapsed');
      }
      
      // IMPORTANT: Remove any existing click handlers to prevent duplicates
      header.removeEventListener('click', headerClickHandler);
      
      // Add click handler with a named function so we can remove it later
      header.addEventListener('click', headerClickHandler);
      
      console.log("Collapsible setup done for column", index);
    });
    
    // Restore collapsed state from localStorage
    restoreColumnState();
  }
  
  // Named event handler function for header clicks
  function headerClickHandler(e) {
    console.log("Header clicked", e.target);
    
    // Don't toggle if clicking the add button
    if (e.target.classList.contains('add-item') || 
        e.target.closest('.add-item')) {
      console.log("Clicked add button, ignoring collapse action");
      return;
    }
    
    const header = this;
    const column = header.closest('.column');
    
    if (!column) {
      console.log("Could not find parent column for header");
      return;
    }
    
    console.log("Toggling column", column.className);
    
    // Toggle collapsed state
    column.classList.toggle('collapsed');
    
    // Save state to localStorage for persistence
    saveColumnState();
    
    // If expanding, set as active column
    if (!column.classList.contains('collapsed')) {
      const columns = document.querySelectorAll('.column');
      const index = Array.from(columns).indexOf(column);
      setActiveColumn(index);
    }
  }
  
  // Save column collapsed state to localStorage
  function saveColumnState() {
    const columns = document.querySelectorAll('.column');
    const state = [];
    
    columns.forEach(column => {
      state.push(column.classList.contains('collapsed'));
    });
    
    localStorage.setItem('feedbackBoardColumnState', JSON.stringify(state));
    console.log("Column state saved:", state);
  }
  
  // Restore column collapsed state from localStorage
  function restoreColumnState() {
    const savedState = localStorage.getItem('feedbackBoardColumnState');
    if (!savedState) return;
    
    try {
      const state = JSON.parse(savedState);
      const columns = document.querySelectorAll('.column');
      
      columns.forEach((column, index) => {
        if (state[index]) {
          column.classList.add('collapsed');
        } else {
          column.classList.remove('collapsed');
        }
      });
      
      console.log("Column state restored:", state);
    } catch (e) {
      console.error('Error restoring column state:', e);
    }
  }
  
  // Update item counts for each column
  function updateColumnItemCounts() {
    const columns = document.querySelectorAll('.column');
    
    columns.forEach(column => {
      const itemCountBadge = column.querySelector('.item-count');
      if (itemCountBadge) {
        const count = column.querySelectorAll('.card').length;
        itemCountBadge.textContent = count;
      }
    });
  }
  
  // Set up fixed navigation at the bottom of the screen
  function setupSectionNavigation() {
    // Check if navigation already exists
    if (document.querySelector('.section-nav')) {
      console.log("Section nav already exists, skipping creation");
      return;
    }
    
    const columns = document.querySelectorAll('.column');
    const container = document.querySelector('.container');
    
    if (!container || columns.length === 0) {
      console.log("Container or columns not found, cannot create section nav");
      return;
    }
    
    // Create navigation
    const nav = document.createElement('div');
    nav.className = 'section-nav';
    
    // Create a button for each column
    columns.forEach((column, index) => {
      const columnHeaderSpan = column.querySelector('.column-header span');
      if (!columnHeaderSpan) {
        console.log("Column header span not found for index", index);
        return;
      }
      
      const button = document.createElement('button');
      button.className = 'section-nav-button';
      if (index === 0) button.classList.add('active');
      
      // Get column name and add appropriate icon
      const columnName = columnHeaderSpan.textContent;
      let iconClass = 'fa-thumbs-up';
      
      if (columnName.includes('Improve')) {
        iconClass = 'fa-wrench';
      } else if (columnName.includes('Action')) {
        iconClass = 'fa-tasks';
      }
      
      button.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <span>${columnName}</span>
      `;
      
      // Add click handler
      button.addEventListener('click', () => {
        console.log("Section nav button clicked for", columnName);
        
        // Expand this column, collapse others
        columns.forEach((col, i) => {
          if (i === index) {
            col.classList.remove('collapsed');
          } else {
            col.classList.add('collapsed');
          }
        });
        
        // Update active states
        document.querySelectorAll('.section-nav-button').forEach((btn, i) => {
          btn.classList.toggle('active', i === index);
        });
        
        // Scroll to the column
        column.scrollIntoView({ behavior: 'smooth' });
        
        // Save state
        saveColumnState();
        
        // Set as active column
        setActiveColumn(index);
      });
      
      nav.appendChild(button);
    });
    
    // Add to the page
    document.body.appendChild(nav);
    console.log("Section navigation created");
    
    // Add event listener to update counts
    document.addEventListener('boardUpdated', updateColumnItemCounts);
  }
  
  // Set active column and save to localStorage
  function setActiveColumn(index) {
    const columns = document.querySelectorAll('.column');
    const navButtons = document.querySelectorAll('.section-nav-button');
    
    // Update column active states
    columns.forEach((col, i) => {
      col.classList.toggle('active', i === index);
    });
    
    // Update nav button active states
    navButtons.forEach((btn, i) => {
      btn.classList.toggle('active', i === index);
    });
    
    // Save to localStorage
    localStorage.setItem('feedbackBoardActiveColumn', index);
    console.log("Active column set to", index);
  }
  
  // Restore active column from localStorage
  function restoreActiveColumn() {
    const savedIndex = localStorage.getItem('feedbackBoardActiveColumn');
    if (savedIndex !== null) {
      setActiveColumn(parseInt(savedIndex));
    }
  }
  
  // Listen for changes to the board and update counts
  function observeBoardChanges() {
    // Set up mutation observer to watch for card changes
    const board = document.querySelector('.board');
    if (!board) return;
    
    const observer = new MutationObserver(() => {
      // Dispatch a custom event that our listeners can use
      const event = new CustomEvent('boardUpdated');
      document.dispatchEvent(event);
      console.log("Board updated event dispatched");
    });
    
    observer.observe(board, { 
      childList: true, 
      subtree: true, 
      attributes: false 
    });
    
    console.log("Board change observer initialized");
  }
  
  // Fix CSS for mobile view
  function fixMobileCSS() {
    // Create a style element
    const style = document.createElement('style');
    style.innerHTML = `
      @media (max-width: 768px) {
        /* Fix for collapsed columns */
        .column.collapsed .cards {
          max-height: 0 !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          overflow: hidden !important;
        }
        
        /* Ensure cards container is visible when not collapsed */
        .column:not(.collapsed) .cards {
          max-height: none !important;
          overflow: visible !important;
          padding: 16px !important;
        }
        
        /* Make column headers more obviously clickable */
        .column-header {
          cursor: pointer !important;
          -webkit-tap-highlight-color: rgba(0,0,0,0.1);
        }
        
        /* Add collapse indicator */
        .column-header:after {
          content: '\\f107' !important; /* FontAwesome down arrow */
          font-family: 'Font Awesome 5 Free' !important;
          font-weight: 900 !important;
          margin-left: 8px !important;
          display: inline-block !important;
          transition: transform 0.3s ease !important;
        }
        
        .column.collapsed .column-header:after {
          transform: rotate(-90deg) !important;
        }
      }
    `;
    document.head.appendChild(style);
    console.log("Mobile CSS fixes applied");
  }
  
  // Initialize mobile enhancements
  function initMobileEnhancements() {
    console.log("Initializing mobile enhancements...");
    
    // Add additional mobile CSS fixes
    fixMobileCSS();
    
    // Setup based on screen size
    setupMobileEnhancements();
    
    // Set up board observer
    observeBoardChanges();
    
    // Update on window resize
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 768) {
        setupMobileEnhancements();
      }
    });
    
    console.log("Mobile enhancements initialized");
  }
  
  // Export the initialization function
  export { initMobileEnhancements };