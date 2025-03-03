// Theme handling module

// Initialize theme based on localStorage or user preference
function initTheme() {
    const savedTheme = localStorage.getItem('feedbackBoardTheme');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
    } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('feedbackBoardTheme', 'dark');
        }
    }
  }
  
  // Toggle theme function
  function toggleTheme() {
      const isDarkMode = document.body.classList.toggle('dark-mode');
      localStorage.setItem('feedbackBoardTheme', isDarkMode ? 'dark' : 'light');
      
      // Add a smooth animation effect for the toggle
      const themeToggleBtn = document.getElementById('theme-toggle-btn');
      themeToggleBtn.classList.add('animate-toggle');
      setTimeout(() => themeToggleBtn.classList.remove('animate-toggle'), 500);
  }
  
  // Theme toggle setup
  function setupThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    console.log("Setting up theme toggle, button exists:", themeToggleBtn !== null);
    
    if (themeToggleBtn) {
        // Remove any existing listeners to avoid duplicates
        themeToggleBtn.removeEventListener('click', toggleTheme);
        
        // Add the click event listener
        themeToggleBtn.addEventListener('click', toggleTheme);
        console.log("Added click listener to theme toggle button");
    } else {
        console.error("Theme toggle button not found in the DOM");
    }
    
    // Initialize the theme
    initTheme();
  }
  
  export { setupThemeToggle, toggleTheme, initTheme };