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
    const content = card.querySelector('p').textContent;
    const upvotes = parseInt(card.querySelector('.upvote span').textContent) || 0;
    const downvotes = parseInt(card.querySelector('.downvote span').textContent) || 0;
    
    // Get item ID to potentially fetch timestamp from Firebase
    const itemId = card.dataset.id;
    
    // Create data object
    const item = {
      columnType: columnType,
      content: content,
      upvotes: upvotes,
      downvotes: downvotes,
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
            <span class="upvotes">👍 ${item.upvotes}</span>
            <span class="downvotes">👎 ${item.downvotes}</span>
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
    // Show notification
    showNotification('Generating CSV...');
    
    // Get data with timestamps if possible
    const fbItems = await getItemsWithTimestamps();
    
    // If we have data from Firebase with timestamps, use it to enhance our export
    if (fbItems.length > 0) {
      // Create a map of item IDs to their timestamps
      const itemTimestamps = {};
      fbItems.forEach(item => {
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
      
      // Update all columns with timestamps
      const updatedWentWell = updateTimestamps(wentWellCards);
      const updatedToImprove = updateTimestamps(toImproveCards);
      const updatedActionItems = updateTimestamps(actionItemsCards);
      
      // Define column headers
      const headers = ['Column', 'Content', 'Upvotes', 'Downvotes', 'Created At'];
      let csvContent = headers.join(',') + '\n';
      
      // Combine all data
      const allData = [
        ...updatedWentWell,
        ...updatedToImprove,
        ...updatedActionItems
      ];
      
      // Convert data to CSV rows
      allData.forEach(item => {
        // Format date
        const date = item.createdAt ? new Date(item.createdAt * 1000).toLocaleString() : 'N/A';
        
        // Escape content to handle commas and quotes in the text
        const escapedContent = item.content.replace(/"/g, '""');
        
        const row = [
          `"${item.columnType}"`,
          `"${escapedContent}"`,
          item.upvotes,
          item.downvotes,
          `"${date}"`
        ];
        
        csvContent += row.join(',') + '\n';
      });
      
      // Create a downloadable link for the CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `team-feedback-${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('CSV export complete!');
    } else {
      // Fall back to simpler export method
      const basicExport = basicExportToCSV();
      if (basicExport) {
        showNotification('CSV export complete!');
      }
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    showNotification('Error exporting to CSV: ' + error.message, true);
  }
}

// Basic CSV export function without Firebase timestamps
function basicExportToCSV() {
  try {
    // Define column headers
    const headers = ['Column', 'Content', 'Upvotes', 'Downvotes', 'Created At'];
    let csvContent = headers.join(',') + '\n';
    
    // Get all cards
    const wentWellCards = getColumnData('went-well');
    const toImproveCards = getColumnData('to-improve');
    const actionItemsCards = getColumnData('action-items');
    
    // Combine all data
    const allData = [
      ...wentWellCards,
      ...toImproveCards,
      ...actionItemsCards
    ];
    
    // Convert data to CSV rows
    allData.forEach(item => {
      // Format date
      const date = item.createdAt ? new Date(item.createdAt * 1000).toLocaleString() : 'N/A';
      
      // Escape content to handle commas and quotes in the text
      const escapedContent = item.content.replace(/"/g, '""');
      
      const row = [
        `"${item.columnType}"`,
        `"${escapedContent}"`,
        item.upvotes,
        item.downvotes,
        `"${date}"`
      ];
      
      csvContent += row.join(',') + '\n';
    });
    
    // Create a downloadable link for the CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `team-feedback-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Error in basic CSV export:', error);
    return false;
  }
}

// Function to export board to PDF
async function exportToPDF() {
  try {
    // Show a loading notification
    showNotification('Generating PDF...');
    
    // Get data with timestamps if possible
    const fbItems = await getItemsWithTimestamps();
    
    // Create a map of item IDs to their data
    const itemDataMap = {};
    fbItems.forEach(item => {
      if (item.id) {
        itemDataMap[item.id] = item;
      }
    });
    
    // Get the current date for the filename
    const date = new Date().toLocaleDateString().replace(/\//g, '-');
    
    // Create a new div to clone the board into
    const printContainer = document.createElement('div');
    printContainer.className = 'pdf-container';
    
    // Create a styled document for PDF export
    printContainer.innerHTML = `
      <style>
        .pdf-container {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .pdf-header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #ddd;
        }
        .pdf-header h1 {
          margin: 0;
          color: #333;
        }
        .pdf-header p {
          margin: 5px 0 0;
          color: #666;
        }
        .column-container {
          margin-bottom: 30px;
        }
        .column-title {
          padding: 10px;
          color: white;
          border-radius: 5px 5px 0 0;
          font-weight: bold;
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
        }
        .upvotes {
          margin-right: 15px;
        }
        .no-items {
          padding: 10px;
          font-style: italic;
          color: #666;
        }
      </style>
      <div class="pdf-header">
        <h1>Team Feedback Board</h1>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    `;
    
    // Get data from each column
    const wentWellCards = getColumnData('went-well');
    const toImproveCards = getColumnData('to-improve');
    const actionItemsCards = getColumnData('action-items');
    
    // Enhance card data with timestamps from Firebase if available
    const enhanceWithTimestamps = (cards) => {
      return cards.map(card => {
        if (card.id && itemDataMap[card.id] && itemDataMap[card.id].createdAt) {
          card.createdAt = itemDataMap[card.id].createdAt;
        }
        return card;
      });
    };
    
    // Apply timestamp enhancements if we have Firebase data
    const enhancedWentWellCards = Object.keys(itemDataMap).length > 0 ? enhanceWithTimestamps(wentWellCards) : wentWellCards;
    const enhancedToImproveCards = Object.keys(itemDataMap).length > 0 ? enhanceWithTimestamps(toImproveCards) : toImproveCards;
    const enhancedActionItemsCards = Object.keys(itemDataMap).length > 0 ? enhanceWithTimestamps(actionItemsCards) : actionItemsCards;
    
    // Add the "Went Well" column
    const wentWellHTML = createColumnHTML('Went Well', enhancedWentWellCards, 'went-well');
    printContainer.innerHTML += wentWellHTML;
    
    // Add the "To Improve" column
    const toImproveHTML = createColumnHTML('To Improve', enhancedToImproveCards, 'to-improve');
    printContainer.innerHTML += toImproveHTML;
    
    // Add the "Action Items" column
    const actionItemsHTML = createColumnHTML('Action Items', enhancedActionItemsCards, 'action-items');
    printContainer.innerHTML += actionItemsHTML;
    
    // Use html2pdf library to generate PDF
    html2pdf()
      .from(printContainer)
      .set({
        margin: [15, 15, 15, 15],
        filename: `team-feedback-${date}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      })
      .save()
      .then(() => {
        showNotification('PDF successfully generated!');
      })
      .catch(err => {
        console.error('PDF generation error:', err);
        showNotification('Error generating PDF: ' + err.message, true);
      });
  } catch (error) {
    console.error('Error exporting PDF:', error);
    showNotification('Error exporting to PDF: ' + error.message, true);
  }