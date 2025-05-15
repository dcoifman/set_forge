import { handleSelection } from './selection.js';

let isMarqueeActive = false;
let marqueeElement = null;
let marqueeStartX = 0;
let marqueeStartY = 0;
let workCanvasElement = null;

/**
 * Initialize marquee selection on the work canvas
 * @param {HTMLElement} workCanvas - The work canvas element
 */
export function initializeMarqueeSelection(workCanvas) {
    workCanvasElement = workCanvas;
    
    // Create marquee element
    marqueeElement = document.createElement('div');
    marqueeElement.className = 'selection-marquee';
    marqueeElement.style.display = 'none';
    document.body.appendChild(marqueeElement);
    
    // Add event listeners
    workCanvas.addEventListener('mousedown', handleMarqueeStart);
    document.addEventListener('mousemove', handleMarqueeMove);
    document.addEventListener('mouseup', handleMarqueeEnd);
}

/**
 * Handle the start of a marquee selection
 * @param {MouseEvent} e - The mouse event
 */
function handleMarqueeStart(e) {
    // Only start marquee on work canvas with shift key
    if (!e.shiftKey || e.button !== 0 || !e.target.closest('.day-cell')) {
        return;
    }
    
    // Prevent default behavior
    e.preventDefault();
    
    // Get mouse position relative to viewport
    marqueeStartX = e.clientX;
    marqueeStartY = e.clientY;
    
    // Initialize marquee
    isMarqueeActive = true;
    marqueeElement.style.left = marqueeStartX + 'px';
    marqueeElement.style.top = marqueeStartY + 'px';
    marqueeElement.style.width = '0px';
    marqueeElement.style.height = '0px';
    marqueeElement.style.display = 'block';
    
    // Add selecting class to workout cards for visual feedback
    const workoutCards = workCanvasElement.querySelectorAll('.workout-card');
    workoutCards.forEach(card => {
        card.classList.add('selecting');
    });
    
    // Dispatch event
    const event = new CustomEvent('marquee-selection-start', {
        detail: { x: marqueeStartX, y: marqueeStartY }
    });
    workCanvasElement.dispatchEvent(event);
}

/**
 * Handle the movement of a marquee selection
 * @param {MouseEvent} e - The mouse event
 */
function handleMarqueeMove(e) {
    if (!isMarqueeActive) return;
    
    // Prevent default behavior
    e.preventDefault();
    
    // Calculate marquee dimensions
    const currentX = e.clientX;
    const currentY = e.clientY;
    
    const left = Math.min(marqueeStartX, currentX);
    const top = Math.min(marqueeStartY, currentY);
    const width = Math.abs(currentX - marqueeStartX);
    const height = Math.abs(currentY - marqueeStartY);
    
    // Update marquee element
    marqueeElement.style.left = left + 'px';
    marqueeElement.style.top = top + 'px';
    marqueeElement.style.width = width + 'px';
    marqueeElement.style.height = height + 'px';
    
    // Update workout cards under marquee
    updateCardsUnderMarquee(left, top, width, height);
    
    // Dispatch event
    const event = new CustomEvent('marquee-selection-move', {
        detail: { left, top, width, height }
    });
    workCanvasElement.dispatchEvent(event);
}

/**
 * Handle the end of a marquee selection
 * @param {MouseEvent} e - The mouse event
 */
function handleMarqueeEnd(e) {
    if (!isMarqueeActive) return;
    
    // Reset marquee
    isMarqueeActive = false;
    marqueeElement.style.display = 'none';
    
    // Get final marquee dimensions
    const left = parseInt(marqueeElement.style.left);
    const top = parseInt(marqueeElement.style.top);
    const width = parseInt(marqueeElement.style.width);
    const height = parseInt(marqueeElement.style.height);
    
    // Select all workout cards under marquee
    const selectedCards = getCardsUnderMarquee(left, top, width, height);
    
    // Add each card to selection
    selectedCards.forEach(card => {
        handleSelection(card, true);
    });
    
    // Remove selecting class from workout cards
    const workoutCards = workCanvasElement.querySelectorAll('.workout-card');
    workoutCards.forEach(card => {
        card.classList.remove('selecting');
    });
    
    // Dispatch event with Set of selected cards (to match blockbuilder.js expectation)
    const event = new CustomEvent('marquee-selection-complete', {
        detail: { selectedElements: new Set(selectedCards) }
    });
    document.dispatchEvent(event);
}

/**
 * Update workout cards under the marquee with visual feedback
 * @param {number} left - Left position of marquee
 * @param {number} top - Top position of marquee
 * @param {number} width - Width of marquee
 * @param {number} height - Height of marquee
 */
function updateCardsUnderMarquee(left, top, width, height) {
    const workoutCards = workCanvasElement.querySelectorAll('.workout-card');
    const marqueeRect = {
        left: left,
        top: top,
        right: left + width,
        bottom: top + height
    };
    
    workoutCards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        
        // Check if card intersects with marquee
        const intersects = !(
            cardRect.left > marqueeRect.right ||
            cardRect.right < marqueeRect.left ||
            cardRect.top > marqueeRect.bottom ||
            cardRect.bottom < marqueeRect.top
        );
        
        if (intersects) {
            card.classList.add('selecting');
        } else {
            card.classList.remove('selecting');
        }
    });
}

/**
 * Get all workout cards under the marquee
 * @param {number} left - Left position of marquee
 * @param {number} top - Top position of marquee
 * @param {number} width - Width of marquee
 * @param {number} height - Height of marquee
 * @returns {Array} Array of workout card elements
 */
function getCardsUnderMarquee(left, top, width, height) {
    const workoutCards = workCanvasElement.querySelectorAll('.workout-card');
    const marqueeRect = {
        left: left,
        top: top,
        right: left + width,
        bottom: top + height
    };
    
    return Array.from(workoutCards).filter(card => {
        const cardRect = card.getBoundingClientRect();
        
        // Check if card intersects with marquee
        return !(
            cardRect.left > marqueeRect.right ||
            cardRect.right < marqueeRect.left ||
            cardRect.top > marqueeRect.bottom ||
            cardRect.bottom < marqueeRect.top
        );
    });
}

// Export other utility functions
export const getMarqueeStatus = () => ({
    isActive: isMarqueeActive,
    position: {
        left: parseInt(marqueeElement?.style.left || 0),
        top: parseInt(marqueeElement?.style.top || 0),
        width: parseInt(marqueeElement?.style.width || 0),
        height: parseInt(marqueeElement?.style.height || 0)
    }
}); 