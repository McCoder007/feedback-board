// Error monitoring utility
import { analytics } from './firebase-config.js';

// Maximum number of errors to store locally
const MAX_STORED_ERRORS = 10;

// Initialize error storage
let errorStorage = JSON.parse(localStorage.getItem('error_log') || '[]');

// Function to log errors
export function logError(error, context = {}) {
  const timestamp = new Date().toISOString();
  const errorObj = {
    timestamp,
    message: error.message || 'Unknown error',
    code: error.code || 'unknown',
    stack: error.stack,
    context: JSON.stringify(context)
  };
  
  console.error('Error logged:', errorObj);
  
  // Store in local storage for debugging
  errorStorage.push(errorObj);
  
  // Keep only the most recent errors
  if (errorStorage.length > MAX_STORED_ERRORS) {
    errorStorage = errorStorage.slice(-MAX_STORED_ERRORS);
  }
  
  // Save to localStorage
  localStorage.setItem('error_log', JSON.stringify(errorStorage));
  
  // Log to analytics if available
  try {
    if (analytics) {
      // Use Firebase Analytics to log the error
      const analyticsEvent = {
        error_type: error.code || 'unknown',
        error_message: error.message || 'Unknown error',
        error_context: JSON.stringify(context).substring(0, 100) // Limit length
      };
      
      // Log custom event to analytics
      window.gtag('event', 'app_error', analyticsEvent);
    }
  } catch (analyticsError) {
    console.error('Failed to log error to analytics:', analyticsError);
  }
  
  return errorObj;
}

// Function to get all logged errors
export function getLoggedErrors() {
  return errorStorage;
}

// Function to clear error log
export function clearErrorLog() {
  errorStorage = [];
  localStorage.removeItem('error_log');
}

// Set up global error handler
window.addEventListener('error', (event) => {
  logError(event.error || new Error(event.message), {
    source: event.filename,
    line: event.lineno,
    column: event.colno
  });
});

// Set up unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  logError(event.reason || new Error('Unhandled Promise rejection'), {
    type: 'unhandled_promise_rejection'
  });
});

console.log('Error monitoring initialized'); 