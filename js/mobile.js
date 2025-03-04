// mobile.js - Mobile usability enhancement script
// Place this file in your js directory

// Function to set up mobile-specific enhancements
function setupMobileEnhancements() {
    // Create column indicators for mobile
    createColumnIndicators();
    
    // Setup horizontal scrolling with indicators
    setupHorizontalScrolling();
    
    // Setup column navigation buttons
    setupColumnNavigation();
    
    // Improve touch handling for card scrolling
    improveCardScrolling();
  }
  
  // Create indicators to show which column is currently in view on mobile
  function createColumnIndicators() {
    // Only create on mobile
    if (window.innerWidth > 768) return;
    
    const board = document.querySelector('.board');
    if (!board) return;
    
    // Check if indicators already exist to avoid duplicates
    if (document.querySelector('.column-indicators')) return;
    
    // Create indicator container
    const indicatorContainer = document.createElement('div');
    indicatorContainer.className = 'column-indicators';
    
    // Get columns
    const columns = board.querySelectorAll('.column');
    
    // Create an indicator for each column
    columns.forEach((column, index) => {
      const indicator = document.createElement('div');
      indicator.className = 'column-indicator';
      if (index === 0) indicator.classList.add('active');
      indicatorContainer.appendChild(indicator);
    });
    
    // Add indicators after the board
    board.parentNode.insertBefore(indicatorContainer, board.nextSibling);
  }
  
  // Set up horizontal scrolling behavior with indicators
  function setupHorizontalScrolling() {
    const board = document.querySelector('.board');
    const columns = document.querySelectorAll('.column');
    
    if (!board || columns.length === 0) return;
    
    // Make first column active initially
    if (window.innerWidth <= 768) {
      columns[0].classList.add('active');
    }
    
    // Update indicators and active column based on scroll position
    board.addEventListener('scroll', () => {
      if (window.innerWidth > 768) return;
      
      const indicators = document.querySelectorAll('.column-indicator');
      if (indicators.length === 0) return;
      
      const scrollPosition = board.scrollLeft;
      const containerWidth = board.offsetWidth;
      
      // Calculate which column is most visible
      let activeIndex = 0;
      let maxVisibility = 0;
      
      columns.forEach((column, index) => {
        const columnLeftEdge = column.offsetLeft - board.offsetLeft;
        const columnRightEdge = columnLeftEdge + column.offsetWidth;
        
        // Calculate how much of the column is visible
        const visibleLeft = Math.max(columnLeftEdge, scrollPosition);
        const visibleRight = Math.min(columnRightEdge, scrollPosition + containerWidth);
        const visibleWidth = Math.max(0, visibleRight - visibleLeft);
        
        // If this column is more visible than the current most visible column, update
        if (visibleWidth > maxVisibility) {
          maxVisibility = visibleWidth;
          activeIndex = index;
        }
        
        // Update active state
        column.classList.toggle('active', index === activeIndex);
      });
      
      // Update indicators
      indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === activeIndex);
      });
      
      // Update navigation heading
      updateNavigationHeading(activeIndex);
    });
    
    // Initial trigger to set active state
    if (window.innerWidth <= 768) {
      setTimeout(() => {
        const event = new Event('scroll');
        board.dispatchEvent(event);
      }, 100);
    }
    
    // Add click behavior to indicators
    setTimeout(() => {
      const indicators = document.querySelectorAll('.column-indicator');
      indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
          if (window.innerWidth > 768) return;
          
          scrollToColumn(index);
        });
      });
    }, 200);
  }
  
  // Function to smoothly scroll to a specific column
  function scrollToColumn(index) {
    const board = document.querySelector('.board');
    const columns = document.querySelectorAll('.column');
    
    if (!board || !columns[index]) return;
    
    const column = columns[index];
    const columnLeftEdge = column.offsetLeft - board.offsetLeft;
    
    board.scrollTo({
      left: columnLeftEdge,
      behavior: 'smooth'
    });
  }
  
  // Set up column navigation buttons for mobile
  function setupColumnNavigation() {
    const board = document.querySelector('.board');
    if (!board) return;
    
    // Only create on mobile and if not already created
    if (window.innerWidth > 768 || document.querySelector('.column-nav')) return;
    
    // Create navigation container
    const navContainer = document.createElement('div');
    navContainer.className = 'column-nav';
    
    // Previous button
    const prevButton = document.createElement('button');
    prevButton.className = 'column-nav-button prev-column';
    prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
    
    // Column name display
    const columnName = document.createElement('div');
    columnName.className = 'column-name';
    columnName.textContent = 'Went Well';
    
    // Next button
    const nextButton = document.createElement('button');
    nextButton.className = 'column-nav-button next-column';
    nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
    
    // Add to nav container
    navContainer.appendChild(prevButton);
    navContainer.appendChild(columnName);
    navContainer.appendChild(nextButton);
    
    // Add to page
    board.parentNode.insertBefore(navContainer, board);
    
    // Set up button functionality
    let currentColumnIndex = 0;
    const columns = document.querySelectorAll('.column');
    
    prevButton.addEventListener('click', () => {
      if (currentColumnIndex > 0) {
        scrollToColumn(--currentColumnIndex);
      }
    });
    
    nextButton.addEventListener('click', () => {
      if (currentColumnIndex < columns.length - 1) {
        scrollToColumn(++currentColumnIndex);
      }
    });
    
    // Update buttons on scroll
    board.addEventListener('scroll', () => {
      if (window.innerWidth > 768) return;
      
      // Find active column index
      const activeColumn = document.querySelector('.column.active');
      if (activeColumn) {
        currentColumnIndex = Array.from(columns).indexOf(activeColumn);
      }
      
      // Disable prev button if at first column
      prevButton.disabled = currentColumnIndex === 0;
      
      // Disable next button if at last column
      nextButton.disabled = currentColumnIndex === columns.length - 1;
    });
  }
  
  // Update the navigation heading based on which column is active
  function updateNavigationHeading(activeIndex) {
    const columnName = document.querySelector('.column-name');
    if (!columnName) return;
    
    const columns = document.querySelectorAll('.column');
    if (!columns[activeIndex]) return;
    
    // Get column header
    const header = columns[activeIndex].querySelector('.column-header span');
    if (header) {
      columnName.textContent = header.textContent;
    }
    
    // Update current column index for navigation buttons
    const prevButton = document.querySelector('.prev-column');
    const nextButton = document.querySelector('.next-column');
    
    if (prevButton) prevButton.disabled = activeIndex === 0;
    if (nextButton) nextButton.disabled = activeIndex === columns.length - 1;
  }
  
  // Improve scrolling behavior for card containers
  function improveCardScrolling() {
    const cardContainers = document.querySelectorAll('.cards');
    
    cardContainers.forEach(container => {
      // Store the initial touch position
      let startY = 0;
      let startX = 0;
      let isScrollingVertically = false;
      
      container.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        startX = e.touches[0].clientX;
        isScrollingVertically = false;
      }, { passive: true });
      
      container.addEventListener('touchmove', (e) => {
        // If it's the first move event, determine scroll direction
        if (!isScrollingVertically && e.touches[0].clientY !== startY) {
          const deltaY = Math.abs(e.touches[0].clientY - startY);
          const deltaX = Math.abs(e.touches[0].clientX - startX);
          
          // If vertical movement is greater, set flag
          isScrollingVertically = deltaY > deltaX;
        }
      }, { passive: true });
    });
    
    // Prevent board horizontal scroll from interfering with card vertical scroll
    const board = document.querySelector('.board');
    if (board) {
      board.addEventListener('touchmove', (e) => {
        // Check if touch is over a card container
        const target = e.target;
        const cardContainer = target.closest('.cards');
        
        if (cardContainer) {
          const rect = cardContainer.getBoundingClientRect();
          const touchY = e.touches[0].clientY;
          const touchX = e.touches[0].clientX;
          
          // If touch is inside card container and not at the edge
          if (touchY > rect.top + 10 && touchY < rect.bottom - 10 &&
              touchX > rect.left + 10 && touchX < rect.right - 10) {
            // Let the card container handle the scroll
            e.stopPropagation();
          }
        }
      }, { passive: true });
    }
  }
  
  // Detect whether we should enable mobile enhancements
  function shouldEnableMobileEnhancements() {
    return window.innerWidth <= 768 || 'ontouchstart' in window;
  }
  
  // Initialize mobile enhancements
  function initMobileEnhancements() {
    if (shouldEnableMobileEnhancements()) {
      setupMobileEnhancements();
    }
    
    // Re-run on resize
    window.addEventListener('resize', () => {
      if (shouldEnableMobileEnhancements()) {
        setupMobileEnhancements();
      }
    });
  }
  
  // Export the initialization function
  export { initMobileEnhancements };