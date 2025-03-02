// Dark Mode Toggle Functionality
function setupDarkModeToggle() {
    const savedTheme = localStorage.getItem('feedbackBoardTheme');
    
    // Apply saved theme on load
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('theme-toggle').checked = true;
    }
    
    // Toggle theme when switch is clicked
    document.getElementById('theme-toggle').addEventListener('change', (e) => {
        if (e.target.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('feedbackBoardTheme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('feedbackBoardTheme', 'light');
        }
    });
}

// Initialize dark mode
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDarkModeToggle);
} else {
    setupDarkModeToggle();
}