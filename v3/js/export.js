// Export functionality module
import { db, collection, getDocs, query } from './firebase-config.js';
import { showNotification } from './ui.js';

// Function to get column data for export
function getColumnData(columnType) {
  const column = document.querySelector(`.${columnType} .cards`);
  if (!column) return [];
  
  const cards = column.querySelectorAll('.card');
  const data = [];
  
  cards.forEach(card => {
    // Get content and votes
    const content = card.querySelector('p')?.textContent || '';
    // Fix: Get votes from the vote-count element instead of non-existent spans
    const votes = parseInt(card.querySelector('.vote-count')?.textContent) || 0;
    
    // Get item ID to potentially fetch timestamp from Firebase
    const itemId = card.dataset.id;
    
    // Create data object
    const item = {
      columnType: columnType,
      content: content,
      votes: votes, // Use a single votes field instead of separate upvotes/downvotes
      id: itemId,
      // We'll add the timestamp later if possible
      createdAt: Date.now() / 1000 // Default to current time if we can't get actual timestamp
    };
    
    data.push(item);
  });
  
  return data;
}

// Function to get items with timestamps from Firestore
async function getItemsWithTimestamps() {
  if (!db) return [];
  
  try {
    const querySnapshot = await getDocs(query(collection(db, "items")));
    const items = [];
    
    querySnapshot.forEach((doc) => {
      const item = {
        id: doc.id,
        ...doc.data()
      };
      
      // Convert Firebase timestamp to seconds
      if (item.createdAt && typeof item.createdAt.seconds !== 'undefined') {
        item.createdAt = item.createdAt.seconds;
      }
      
      items.push(item);
    });
    
    return items;
  } catch (error) {
    console.error('Error getting items with timestamps:', error);
    return [];
  }
}

// Helper function to create HTML for a column in the PDF
function createColumnHTML(title, items, columnClass) {
  let html = `
    <div class="column-container ${columnClass}">
      <div class="column-title">${title}</div>
      <div class="column-items">
  `;
  
  if (items.length === 0) {
    html += `<div class="no-items">No items in this column</div>`;
  } else {
    items.forEach(item => {
      // Format date if available
      const date = item.createdAt ? new Date(item.createdAt * 1000).toLocaleString() : 'N/A';
      
      html += `
        <div class="card-item">
          <div class="card-content">${item.content}</div>
          <div class="votes">
            <span class="vote-count"><i class="fas fa-thumbs-up"></i> ${item.votes || 0}</span>
          </div>
        </div>
      `;
    });
  }
  
  html += `
      </div>
    </div>
  `;
  
  return html;
}

// Setup export functionality
function setupExport() {
  // Export to CSV button
  const exportCSVBtn = document.getElementById('export-csv-btn');
  if (exportCSVBtn) {
    exportCSVBtn.addEventListener('click', exportToCSV);
  }
  
  // Export to PDF button
  const exportPDFBtn = document.getElementById('export-pdf-btn');
  if (exportPDFBtn) {
    exportPDFBtn.addEventListener('click', exportToPDF);
  }
}

// Function to export board to CSV
async function exportToCSV() {
  try {
    console.log("Starting CSV export...");
    showNotification('Preparing CSV export...');
    
    // Get items with timestamps from Firestore
    const firestoreItems = await getItemsWithTimestamps();
    
    // Create a map of item IDs to timestamps
    const itemTimestamps = {};
    firestoreItems.forEach(item => {
      if (item.id && item.createdAt) {
        itemTimestamps[item.id] = item.createdAt;
      }
    });
    
    // Get data from DOM and enhance with timestamps
    const wentWellCards = getColumnData('went-well');
    const toImproveCards = getColumnData('to-improve');
    const actionItemsCards = getColumnData('action-items');
    
    // Update timestamps where possible
    const updateTimestamps = (items) => {
      return items.map(item => {
        if (item.id && itemTimestamps[item.id]) {
          item.createdAt = itemTimestamps[item.id];
        }
        return item;
      });
    };
    
    // Enhance data with timestamps
    const wentWellWithTimestamps = updateTimestamps(wentWellCards);
    const toImproveWithTimestamps = updateTimestamps(toImproveCards);
    const actionItemsWithTimestamps = updateTimestamps(actionItemsCards);
    
    // Create CSV data
    let csvContent = '';
    
    // Add headers
    const headers = ['Column', 'Content', 'Votes', 'Created At'];
    csvContent += headers.join(',') + '\n';
    
    // Function to escape CSV values
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      // If the value contains commas, quotes, or newlines, wrap it in quotes
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        // Double up any quotes
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };
    
    // Add rows
    const addRows = (items, columnName) => {
      items.forEach(item => {
        const row = [
          escapeCSV(columnName),
          escapeCSV(item.content),
          escapeCSV(item.votes),
          escapeCSV(new Date(item.createdAt * 1000).toLocaleString())
        ];
        csvContent += row.join(',') + '\n';
      });
    };
    
    // Add all items
    addRows(wentWellWithTimestamps, 'Went Well');
    addRows(toImproveWithTimestamps, 'To Improve');
    addRows(actionItemsWithTimestamps, 'Action Items');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'feedback-board-export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('CSV exported successfully!');
  } catch (error) {
    console.error('Error exporting CSV:', error);
    showNotification('Failed to export CSV', true);
  }
}

// Function to export board to PDF
async function exportToPDF() {
  try {
    showNotification('Generating PDF...');
    
    // Get data from columns
    const wentWellCards = getColumnData('went-well');
    const toImproveCards = getColumnData('to-improve');
    const actionItemsCards = getColumnData('action-items');
    
    // Get board title
    const boardTitle = document.getElementById('board-title').textContent || 'Feedback Board';
    
    // Create an HTML structure for the PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${boardTitle} - Export</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            text-align: center;
            margin-bottom: 30px;
            color: #444;
          }
          .board-container {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: space-between;
          }
          .column-container {
            flex: 1;
            min-width: 300px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            border-radius: 5px;
            overflow: hidden;
          }
          .column-title {
            padding: 15px;
            font-weight: bold;
            color: white;
            text-align: center;
          }
          .went-well .column-title {
            background-color: #10b981;
          }
          .to-improve .column-title {
            background-color: #ef4444;
          }
          .action-items .column-title {
            background-color: #8b5cf6;
          }
          .column-items {
            border: 1px solid #ddd;
            border-top: none;
            border-radius: 0 0 5px 5px;
          }
          .card-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
          }
          .card-item:last-child {
            border-bottom: none;
          }
          .card-content {
            margin-bottom: 5px;
          }
          .votes {
            display: flex;
            font-size: 0.8em;
            color: #666;
            gap: 10px;
          }
          .no-items {
            padding: 20px;
            text-align: center;
            color: #999;
          }
          .export-date {
            text-align: center;
            margin-top: 30px;
            font-size: 0.8em;
            color: #999;
          }
        </style>
      </head>
      <body>
        <h1>${boardTitle}</h1>
        <div class="board-container">
          ${createColumnHTML('What Went Well', wentWellCards, 'went-well')}
          ${createColumnHTML('What To Improve', toImproveCards, 'to-improve')}
          ${createColumnHTML('Action Items', actionItemsCards, 'action-items')}
        </div>
        <div class="export-date">
          Exported on ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for content to load and then print
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.print();
        showNotification('PDF export complete!');
      }, 500);
    };
    
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    showNotification('Error exporting to PDF: ' + error.message, true);
  }
}

// Export functions
export {
  setupExport,
  exportToCSV,
  exportToPDF,
  getColumnData,
  getItemsWithTimestamps
};