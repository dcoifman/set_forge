import ForgeAssist from '../forgeassist.js';

// --- State ---
let selectedElement = null;
let selectedElements = new Set();
let isMarqueeActive = false;
let marqueeElement = null;
let marqueeStartX = 0;
let marqueeStartY = 0;

// --- Selection Logic (Single & Multi) ---
export function handleSelection(element, isShiftHeld) {
    // Prevent selection if element is null or being dragged
    if (!element || element.classList.contains('dragging')) return;

    const elementType = element.classList.contains('workout-card') ? 'card' : 
                       element.classList.contains('day-cell') ? 'cell' : 
                       element.classList.contains('phase-bar') ? 'phase' : 'other';

    if (!isShiftHeld) {
        // Regular click: Deselect all previous, select current
        selectedElements.forEach(el => el.classList.remove('selected'));
        selectedElements.clear();
        selectedElements.add(element);
        element.classList.add('selected');
        selectedElement = element; // Update single selection ref
    } else {
        // Shift click: Toggle selection for the clicked element
        // Only allow multi-select for cards and potentially cells, not phases
         if (elementType === 'card' || elementType === 'cell') { 
            if (selectedElements.has(element)) {
                // Already selected, remove it
                element.classList.remove('selected');
                selectedElements.delete(element);
            } else {
                // Not selected, add it
                // Ensure we are not mixing types (e.g., cards and cells)
                const currentSelectionType = selectedElements.size > 0 ? 
                                             (Array.from(selectedElements)[0].classList.contains('workout-card') ? 'card' : 'cell') 
                                             : elementType;
                if (elementType === currentSelectionType) {
                     element.classList.add('selected');
                     selectedElements.add(element);
                } else {
                    // Type mismatch - treat as a new single selection
                    selectedElements.forEach(el => el.classList.remove('selected'));
                    selectedElements.clear();
                    selectedElements.add(element);
                    element.classList.add('selected');
                }
            }
            // Update single selectedElement ref: null if multi, otherwise the single item
            selectedElement = selectedElements.size === 1 ? Array.from(selectedElements)[0] : null;
         } else {
             // Shift-clicking a phase or other non-card/cell element -> treat as single select
             selectedElements.forEach(el => el.classList.remove('selected'));
             selectedElements.clear();
             selectedElements.add(element);
             element.classList.add('selected');
             selectedElement = element;
         }
    }

    console.log('Selected items:', selectedElements.size);
    // Update context for other modules if needed
    ForgeAssist?.updateContext(selectedElement, selectedElements); // Call the imported module
}

// Function to update the state externally if needed (e.g., closing inspector)
export function setSelectedElement(element) {
    selectedElement = element;
}

export function clearSelectedElements() {
    selectedElements.clear();
}

export function addSelectedElement(element) {
    selectedElements.add(element);
}

export function deleteSelectedElement(element) {
    selectedElements.delete(element);
}

// Function to get the current selection state
export function getSelectionState() {
    return { selectedElement, selectedElements };
}

// --- Marquee Selection Logic ---
export function initializeMarqueeSelection(workCanvasElement) {
    if (!workCanvasElement) return;
    
    // Create the marquee element if it doesn't exist
    if (!marqueeElement) {
        marqueeElement = document.createElement('div');
        marqueeElement.className = 'selection-marquee';
        marqueeElement.style.display = 'none';
        document.body.appendChild(marqueeElement);
    }
    
    // Mouse down starts marquee if not on a card or interactive element
    workCanvasElement.addEventListener('mousedown', (e) => {
        // Skip if right click or on an interactive element
        if (e.button !== 0 || 
            e.target.closest('.workout-card') || 
            e.target.closest('button') ||
            e.target.closest('input') ||
            e.target.closest('select')) {
            return;
        }
        
        isMarqueeActive = true;
        marqueeStartX = e.clientX;
        marqueeStartY = e.clientY;
        
        // Position and show marquee
        updateMarqueePosition(e.clientX, e.clientY);
        marqueeElement.style.display = 'block';
        
        // Prevent text selection during marquee
        e.preventDefault();
    });
    
    // Mouse move updates marquee size and position
    document.addEventListener('mousemove', (e) => {
        if (!isMarqueeActive) return;
        
        updateMarqueePosition(e.clientX, e.clientY);
        
        // Calculate marquee bounds
        const marqueeRect = marqueeElement.getBoundingClientRect();
        
        // Get all workout cards and check intersection
        const workoutCards = document.querySelectorAll('.workout-card');
        
        workoutCards.forEach(card => {
            const cardRect = card.getBoundingClientRect();
            
            // Check if card intersects with marquee
            if (rectsIntersect(marqueeRect, cardRect)) {
                if (!selectedElements.has(card)) {
                    card.classList.add('selected');
                    selectedElements.add(card);
                }
            } else if (!e.shiftKey) {
                // If not shift-selecting, remove cards that are not in the marquee
                if (selectedElements.has(card)) {
                    card.classList.remove('selected');
                    selectedElements.delete(card);
                }
            }
        });
        
        // Update selectedElement reference
        selectedElement = selectedElements.size === 1 ? Array.from(selectedElements)[0] : null;
    });
    
    // Mouse up ends marquee selection
    document.addEventListener('mouseup', () => {
        if (!isMarqueeActive) return;
        
        isMarqueeActive = false;
        marqueeElement.style.display = 'none';
        
        // Trigger an event for handling the selection
        const event = new CustomEvent('marquee-selection-complete', {
            detail: { selectedElements }
        });
        document.dispatchEvent(event);
    });
}

// Helper function to update marquee position and size
function updateMarqueePosition(currentX, currentY) {
    const left = Math.min(marqueeStartX, currentX);
    const top = Math.min(marqueeStartY, currentY);
    const width = Math.abs(currentX - marqueeStartX);
    const height = Math.abs(currentY - marqueeStartY);
    
    marqueeElement.style.left = `${left}px`;
    marqueeElement.style.top = `${top}px`;
    marqueeElement.style.width = `${width}px`;
    marqueeElement.style.height = `${height}px`;
}

// Helper function to check if two rectangles intersect
function rectsIntersect(rect1, rect2) {
    return !(
        rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom
    );
}

// Clear all selections
export function clearSelections() {
    selectedElements.forEach(el => el.classList.remove('selected'));
    selectedElements.clear();
    selectedElement = null;
}

// Dependencies:
// - DOM Manipulation (classList, etc.)
// - Potentially ForgeAssist or other modules needing selection context
//   - ForgeAssist.updateContext (imported) 