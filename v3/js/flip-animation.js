// FLIP Animation Utility (First-Last-Invert-Play)
// This module provides smooth animations for card repositioning during sort operations

// Store positions of elements before sorting
let previousPositions = new Map();

// Capture positions of all cards before they're repositioned
function captureCardPositions() {
  const cards = document.querySelectorAll('.card');
  previousPositions.clear();
  
  cards.forEach(card => {
    // Only store positions of cards that are visible
    if (card.style.display !== 'none') {
      const rect = card.getBoundingClientRect();
      previousPositions.set(card.dataset.id, {
        left: rect.left,
        top: rect.top
      });
    }
  });
}

// Apply FLIP animation to cards
function animateCardPositions() {
  const cards = document.querySelectorAll('.card');
  const animationPromises = [];
  
  cards.forEach(card => {
    const id = card.dataset.id;
    const previousPosition = previousPositions.get(id);
    
    // Only animate cards that have previous positions
    if (previousPosition && card.style.display !== 'none') {
      const currentRect = card.getBoundingClientRect();
      
      // Calculate the difference between previous and current positions
      const deltaX = previousPosition.left - currentRect.left;
      const deltaY = previousPosition.top - currentRect.top;
      
      // Only animate if the card actually moved
      if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
        // First: Apply a transform to make the card appear at its previous position
        card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        card.style.transition = 'none';
        
        // Force a reflow to ensure the transform is applied before the animation starts
        void card.offsetWidth;
        
        // Last & Play: Remove the transform with a transition to animate to the new position
        card.style.transition = 'transform 250ms ease-out';
        card.style.transform = '';
        
        // Add a subtle highlight effect during transition
        card.classList.add('sorting');
        
        // Create a promise that resolves when the animation is complete
        const promise = new Promise(resolve => {
          const onTransitionEnd = () => {
            card.classList.remove('sorting');
            card.style.transition = '';
            card.removeEventListener('transitionend', onTransitionEnd);
            resolve();
          };
          
          card.addEventListener('transitionend', onTransitionEnd);
          
          // Backup timeout in case the transitionend event doesn't fire
          setTimeout(onTransitionEnd, 300);
        });
        
        animationPromises.push(promise);
      }
    }
  });
  
  // Return a promise that resolves when all animations are complete
  return Promise.all(animationPromises);
}

// Export the functions
export { captureCardPositions, animateCardPositions }; 