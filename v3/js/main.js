// This is the main entry point for the board page

// Import modules
import { setupThemeToggle } from './theme.js';
import { setupAuth } from './auth.js';
import { initBoard } from './board.js';
import { setupModals, setupBoardLoadingFailsafe } from './ui.js';
import { setupExport } from './export.js';
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
    } catch (error) {
        console.error("Error initializing application:", error);
    }
}