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
  }