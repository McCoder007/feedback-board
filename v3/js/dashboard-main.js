// This is the main entry point for the dashboard page

// Import modules
import { setupThemeToggle } from './theme.js';
import { setupAuth } from './auth.js';
import { initDashboard } from './dashboard.js';

// Wait for DOM content to be loaded before initializing
document.addEventListener('DOMContentLoaded', async function() {
    console.log("DOM loaded, initializing dashboard application...");
    
    // Check if we're transitioning from another page
    const prevPage = localStorage.getItem('currentPage');
    if (prevPage && prevPage !== 'dashboard') {
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
        
        // Initialize dashboard functionality
        await initDashboard();
        
        console.log("Dashboard application initialized successfully");
    } catch (error) {
        console.error("Error initializing dashboard application:", error);
    }
} 