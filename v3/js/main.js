// This is the main entry point for the board page

// Import modules
import { setupThemeToggle } from './theme.js';
import { setupAuth } from './auth.js';
import { initBoard } from './board.js';
import { setupModals, setupBoardLoadingFailsafe } from './ui.js';
import { setupExport } from './export.js';
// Import error monitoring
import { logError } from './error-monitor.js';
// Import mobile fix functionality to ensure proper mobile support
import './mobile-fix.js';

// Wait for DOM content to be loaded before initializing
document.addEventListener('DOMContentLoaded', async function() {
    console.log("DOM loaded, initializing application...");
    
    // Check if we're transitioning from another page
    const prevPage = localStorage.getItem('currentPage');
    if (prevPage && prevPage !== 'board') {
        // We're coming from another page, delay the initialization slightly
        // to allow the transition to complete
        setTimeout(async function() {
            await initApp();
        }, 100);
    } else {
        // We're loading the page directly, initialize immediately
        await initApp();
    }
});

// Initialize all application functionality
async function initApp() {
    try {
        // Setup theme toggle functionality
        setupThemeToggle();
        
        // Initialize auth functionality
        setupAuth();
        
        // Initialize board functionality
        await initBoard();
        
        // Setup UI components
        setupModals();
        setupBoardLoadingFailsafe();
        
        // Setup export functionality
        setupExport();
        
        console.log("Application initialized successfully");
        
        // Log successful initialization to analytics
        if (window.gtag) {
            window.gtag('event', 'app_initialized', {
                'environment': 'production'
            });
        }
    } catch (error) {
        console.error("Error initializing application:", error);
        logError(error, { component: 'initApp' });
        
        // Show a user-friendly error message
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.innerHTML = `
            <div class="error-container">
                <h3>Something went wrong</h3>
                <p>We encountered an error while loading the application. Please try refreshing the page.</p>
                <button onclick="window.location.reload()">Refresh Page</button>
            </div>
        `;
        document.body.appendChild(errorMessage);
    }
}