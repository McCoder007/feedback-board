// Main entry point for the Team Feedback Board application
import { setupThemeToggle } from './theme.js';
import { setupAuth } from './auth.js';
import { initBoard } from './board.js';
import { setupModals, setupBoardLoadingFailsafe } from './ui.js';
import { setupExport } from './export.js';

// Initialize the app when DOM is fully loaded
window.addEventListener('DOMContentLoaded', () => {
  console.log("DOM fully loaded, initializing app...");

  // Setup UI components
  setupModals();
  setupBoardLoadingFailsafe();
  
  // Setup theme toggle
  setupThemeToggle();
  
  // Setup authentication
  setupAuth();
  
  // Initialize the board
  initBoard();
  
  // Setup export functionality
  setupExport();
});