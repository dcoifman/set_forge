// Import dependencies (placeholders)
import { updateInspectorPhaseDetails } from '../inspector/inspector.js';
import { getSelectionState } from './selection.js'; 
import { triggerAnalyticsUpdate } from '../analytics/updates.js';
import { triggerSaveState } from '../state/storage.js';
import { updateCalendarPhaseIndicators } from '../calendar/indicators.js';

// --- State ---
let isResizing = false;
let resizingPhase = null;
let startX = 0;
let initialWidths = [];
let workCanvasElement = null;

// --- DOM References (Needs injection or querying in init) ---
let phaseRibbonElement = null;

// --- Event Handlers ---
function handleMouseDown(e) {
    if (e.target.classList.contains('phase-resize-handle')) {
        isResizing = true;
        resizingPhase = e.target.closest('.phase-bar');
        startX = e.clientX;
        document.body.style.cursor = 'col-resize'; // Global cursor change
        resizingPhase.classList.add('is-resizing');

        // Store initial widths of all phases
        initialWidths = Array.from(phaseRibbonElement.querySelectorAll('.phase-bar')).map(p => p.offsetWidth);
        
        // Prevent text selection during resize
        document.body.style.userSelect = 'none';
    }
}

function handleMouseMove(e) {
    if (!isResizing || !resizingPhase) return;

    const currentX = e.clientX;
    const deltaX = currentX - startX;
    const ribbonWidth = phaseRibbonElement.offsetWidth;

    const phases = Array.from(phaseRibbonElement.querySelectorAll('.phase-bar'));
    const currentIndex = phases.indexOf(resizingPhase);
    const nextPhase = phases[currentIndex + 1];

    if (!nextPhase) return; // Shouldn't happen if handles are set up right

    const currentInitialWidth = initialWidths[currentIndex];
    const nextInitialWidth = initialWidths[currentIndex + 1];

    let newCurrentWidth = currentInitialWidth + deltaX;
    let newNextWidth = nextInitialWidth - deltaX;

    // Add minimum width constraint (e.g., 50px or a percentage)
    const minWidthPx = 50; 
    if (newCurrentWidth < minWidthPx) {
        newCurrentWidth = minWidthPx;
        newNextWidth = currentInitialWidth + nextInitialWidth - minWidthPx;
    }
    if (newNextWidth < minWidthPx) {
        newNextWidth = minWidthPx;
        newCurrentWidth = currentInitialWidth + nextInitialWidth - minWidthPx;
    }

    // Convert back to percentage for flexibility
    const newCurrentPercent = (newCurrentWidth / ribbonWidth) * 100;
    const newNextPercent = (newNextWidth / ribbonWidth) * 100;
    
    resizingPhase.style.width = `${newCurrentPercent}%`;
    nextPhase.style.width = `${newNextPercent}%`;

    // Update inspector if the resized phase is selected
    const { selectedElement } = getSelectionState(); // Dependency
    if (selectedElement === resizingPhase) {
        updateInspectorPhaseDetails(resizingPhase); // Dependency
    }
    if (selectedElement === nextPhase) {
         updateInspectorPhaseDetails(nextPhase); // Dependency
    }
}

function handleMouseUp(e) {
    if (isResizing) {
        isResizing = false;
        if(resizingPhase) resizingPhase.classList.remove('is-resizing');
        resizingPhase = null;
        document.body.style.cursor = ''; // Reset global cursor
        document.body.style.userSelect = ''; // Re-enable text selection
        initialWidths = [];

        // Call external functions for updates
        if (workCanvasElement) {
            triggerAnalyticsUpdate(workCanvasElement);
            updateCalendarPhaseIndicators(phaseRibbonElement, workCanvasElement);
        } else {
            console.warn('Work canvas element not available for post-resize updates.');
        }
        triggerSaveState();
    }
}

// --- Initialization ---
export function initializePhaseResizing(ribbonElement, canvasElement) {
    if (!ribbonElement || !canvasElement) {
        console.error("Phase ribbon or work canvas element not provided for resizing initialization.");
        return;
    }
    phaseRibbonElement = ribbonElement;
    workCanvasElement = canvasElement;

    phaseRibbonElement.addEventListener('mousedown', handleMouseDown);
    // Attach global listeners only once
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    console.log("Phase resizing listeners initialized.");
}

// --- Cleanup (Optional but good practice) ---
export function cleanupPhaseResizing() {
    if (phaseRibbonElement) {
        phaseRibbonElement.removeEventListener('mousedown', handleMouseDown);
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    phaseRibbonElement = null;
    workCanvasElement = null;
    console.log("Phase resizing listeners removed.");
}

// Dependencies:
// - DOM Access (document.body.style, element.classList, element.style, querySelectorAll, closest)
// - Browser Globals (parseFloat, Math)
// - External State: getSelectionState (imported)
// - External Functions: 
//    - updateInspectorPhaseDetails (imported from inspector/inspector.js)
//    - triggerAnalyticsUpdate (imported from analytics/updates.js)
//    - triggerSaveState (imported from state/storage.js)
//    - updateCalendarPhaseIndicators (imported from calendar/indicators.js)

// --- Example Usage ---
// initializePhaseResizing(document.getElementById('phase-ribbon'), document.getElementById('work-canvas'));
// cleanupPhaseResizing(); 