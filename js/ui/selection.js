import ForgeAssist from '../forgeassist.js';

// --- State ---
let selectedElement = null;
let selectedElements = new Set();

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

// Dependencies:
// - DOM Manipulation (classList, etc.)
// - Potentially ForgeAssist or other modules needing selection context
//   - ForgeAssist.updateContext (imported) 