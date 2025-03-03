// UCI Theme Toggler - Add this to your main.js file or as a separate script

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    setupThemeSelector();
  });
  
  function setupThemeSelector() {
    // First, create the theme selector if it doesn't exist
    if (!document.getElementById('theme-selector')) {
      createThemeSelector();
    }
    
    // Then set up the event listener
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
      // Check for saved theme
      const savedColorTheme = localStorage.getItem('feedbackBoardColorTheme') || 'default';
      
      // Apply saved theme
      themeSelector.value = savedColorTheme;
      applyTheme(savedColorTheme);
      
      // Add event listener
      themeSelector.addEventListener('change', function() {
        const selectedTheme = this.value;
        applyTheme(selectedTheme);
        localStorage.setItem('feedbackBoardColorTheme', selectedTheme);
      });
    }
  }
  
  function applyTheme(themeName) {
    // Remove any existing theme classes
    document.body.classList.remove('uci-theme');
    
    // Apply the selected theme
    if (themeName === 'uci-anteater') {
      document.body.classList.add('uci-theme');
    }
    
    // Note: Dark mode is handled separately by your existing code
    // This just manages the color theme
  }
  
  function createThemeSelector() {
    // Create the theme selector dropdown
    const selectorContainer = document.createElement('div');
    selectorContainer.className = 'theme-selector';
    selectorContainer.style.marginLeft = '10px';
    
    const selectEl = document.createElement('select');
    selectEl.id = 'theme-selector';
    selectEl.style.padding = '6px';
    selectEl.style.borderRadius = '6px';
    selectEl.style.border = '1px solid var(--border-color)';
    selectEl.style.backgroundColor = 'var(--card-bg)';
    selectEl.style.color = 'var(--text-color)';
    
    // Add options
    const defaultOption = document.createElement('option');
    defaultOption.value = 'default';
    defaultOption.textContent = 'Default Theme';
    
    const uciOption = document.createElement('option');
    uciOption.value = 'uci-anteater';
    uciOption.textContent = 'UCI Anteater';
    
    selectEl.appendChild(defaultOption);
    selectEl.appendChild(uciOption);
    selectorContainer.appendChild(selectEl);
    
    // Find a good location to insert it (next to the theme toggle button)
    const themeToggle = document.querySelector('.theme-toggle');
    if (themeToggle && themeToggle.parentNode) {
      themeToggle.parentNode.insertBefore(selectorContainer, themeToggle.nextSibling);
    } else {
      // Fallback - insert into header controls
      const headerControls = document.querySelector('.header-controls');
      if (headerControls) {
        headerControls.insertBefore(selectorContainer, headerControls.firstChild);
      }
    }
    // Fix for sort dropdown becoming blank on refresh
document.addEventListener('DOMContentLoaded', function() {
    // Get the sort dropdown
    const sortSelect = document.querySelector('.search-tools select');
    
    if (sortSelect) {
      // Check if there's a saved sort preference in localStorage
      const savedSort = localStorage.getItem('feedbackBoardSort');
      
      if (savedSort) {
        // Set the dropdown value to match the saved preference
        sortSelect.value = savedSort;
      } else {
        // If no saved preference, default to 'newest' (or whatever your default is)
        sortSelect.value = 'newest';
        // Optionally save this default to localStorage
        localStorage.setItem('feedbackBoardSort', 'newest');
      }
      
      // Make sure the change event is properly attached
      sortSelect.addEventListener('change', function() {
        const selectedSort = this.value;
        localStorage.setItem('feedbackBoardSort', selectedSort);
        
        // Call your existing sort function if available
        if (typeof loadAllItems === 'function') {
          loadAllItems(selectedSort);
        }
      });
    }
  });
  }