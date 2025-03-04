// mobile.js - Collapsible sections for mobile
// Put this file in your js directory

// Function to set up mobile-specific enhancements
function setupMobileEnhancements() {
    if (window.innerWidth <= 768) {
      // Set up collapsible columns
      setupCollapsibleColumns();
      
      // Add section navigation
      setupSectionNavigation();
      
      // Add item counts
      updateColumnItemCounts();
      
      // Mark last viewed column as active
      restoreActiveColumn();
    }
  }
  
  // Set up collapsible columns
  function setupCollapsibleColumns() {
    const columns = document.querySelectorAll('.column');
    
    columns.forEach((column, index) => {
      const header = column.querySelector('.column-header');
      const cards = column.querySelector('.cards');
      
      // Create item count badge
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
      
      // Expand the first column, collapse others
      if (index > 0) {
        column.classList.add('collapsed');
      }
      
      // Add click handler to toggle
      header.addEventListener('click', (e) => {
        // Don't toggle if clicking the add button
        if (e.target.classList.contains('add-item') || 
            e.target.closest('.add-item')) {
          return;
        }
        
        // Toggle collapsed state
        column.classList.toggle('collapsed');
        
        // Save state to localStorage for persistence
        saveColumnState();
        
        // If expanding, set as active column
        if (!column.classList.contains('collapsed')) {
          setActiveColumn(index);
        }
      });
    });
    
    // Restore collapsed state from localStorage
    restoreColumnState();
  }
  
  // Save column collapsed state to localStorage
  function saveColumnState() {
    const columns = document.querySelectorAll('.column');
    const state = [];
    
    columns.forEach(column => {
      state.push(column.classList.contains('collapsed'));
    });
    
    localStorage.setItem('feedbackBoardColumnState', JSON.stringify(state));
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
    if (document.querySelector('.section-nav')) return;
    
    const columns = document.querySelectorAll('.column');
    const container = document.querySelector('.container');
    
    if (!container || columns.length === 0) return;
    
    // Create navigation
    const nav = document.createElement('div');
    nav.className = 'section-nav';
    
    // Create a button for each column
    columns.forEach((column, index) => {
      const button = document.createElement('button');
      button.className = 'section-nav-button';
      if (index === 0) button.classList.add('active');
      
      // Get column name and add appropriate icon
      const columnName = column.querySelector('.column-header span').textContent;
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
    });
    
    observer.observe(board, { 
      childList: true, 
      subtree: true, 
      attributes: false 
    });
  }
  
// Modify initMobileEnhancements in mobile.js
function initMobileEnhancements() {
    // Only run on actual mobile devices
    if (window.innerWidth <= 768) {
      console.log("Initializing mobile enhancements");
      
      // First ensure board is visible
      const board = document.querySelector('.board');
      if (board && board.style.display === 'none') {
        board.style.display = 'block';
      }
      
      // Then run mobile-specific setup
      setTimeout(() => {
        setupCollapsibleColumns();
        setupSectionNavigation();
        updateColumnItemCounts();
      }, 1000); // Delay to ensure board is loaded
    }
  }
  
  // Export the initialization function
  export { initMobileEnhancements };