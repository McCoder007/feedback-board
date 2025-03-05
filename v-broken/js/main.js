// Main entry point for the Team Feedback Board application
// Add this import for the mobile enhancements
import { initMobileEnhancements } from './mobile.js';
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
  
  // Initialize mobile enhancements - add this line
  initMobileEnhancements();
});

// Add to main.js
function setupOfflineDetection() {
    window.addEventListener('online', () => {
      document.body.classList.remove('offline');
      const offlineMessage = document.getElementById('offline-message');
      if (offlineMessage) {
        offlineMessage.style.display = 'none';
      }
    });
    
    window.addEventListener('offline', () => {
      document.body.classList.add('offline');
      const offlineMessage = document.getElementById('offline-message');
      if (offlineMessage) {
        offlineMessage.style.display = 'block';
      } else {
        const message = document.createElement('div');
        message.id = 'offline-message';
        message.innerHTML = `
          <div style="background-color: #f97316; color: white; text-align: center; padding: 10px; position: sticky; top: 0; z-index: 1000;">
            You are currently offline. Some features may not work properly.
          </div>
        `;
        document.body.prepend(message);
      }
    });
    
    // Check initial state
    if (!navigator.onLine) {
      document.body.classList.add('offline');
    }
  }

  // Add to main.js
function enableMobileDebug() {
    // Create a debug overlay for mobile
    const debugOverlay = document.createElement('div');
    debugOverlay.id = 'mobile-debug';
    debugOverlay.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 12px;
      z-index: 9999;
      max-width: 80%;
      max-height: 30%;
      overflow: auto;
      display: none;
    `;
    document.body.appendChild(debugOverlay);
    
    // Toggle debug with triple tap on header
    const header = document.querySelector('header');
    if (header) {
      let tapCount = 0;
      header.addEventListener('touchend', () => {
        tapCount++;
        if (tapCount >= 3) {
          const overlay = document.getElementById('mobile-debug');
          if (overlay) {
            overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
          }
          tapCount = 0;
        }
        setTimeout(() => { tapCount = 0; }, 1000);
      });
    }
    
    // Override console.log
    const originalLog = console.log;
    console.log = function(...args) {
      originalLog.apply(console, args);
      
      const overlay = document.getElementById('mobile-debug');
      if (overlay && overlay.style.display !== 'none') {
        const message = document.createElement('div');
        message.textContent = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : arg
        ).join(' ');
        overlay.appendChild(message);
        
        // Limit number of messages
        while (overlay.childNodes.length > 20) {
          overlay.removeChild(overlay.firstChild);
        }
        
        // Scroll to bottom
        overlay.scrollTop = overlay.scrollHeight;
      }
    };
  }
  
  // Call this from your initialization
  if (window.innerWidth <= 768) {
    enableMobileDebug();
  }
  
  // Call this from your initialization
  setupOfflineDetection();