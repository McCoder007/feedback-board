// Dark Mode Toggle Functionality
(function() {
    // Function to initialize dark mode
    function setupDarkModeToggle() {
        // Find the theme toggle element
        const themeToggle = document.getElementById('theme-toggle');
        
        if (!themeToggle) {
            console.error("Theme toggle element not found");
            return;
        }
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('feedbackBoardTheme');
        
        // Apply saved theme if it exists
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeToggle.checked = true;
        }
        
        // Add event listener to toggle
        themeToggle.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('feedbackBoardTheme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('feedbackBoardTheme', 'light');
            }
        });
        
        console.log("Dark mode functionality initialized");
    }

    // Run the setup function when the DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupDarkModeToggle);
    } else {
        setupDarkModeToggle();
    }
})();