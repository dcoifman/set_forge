// Import dependencies (placeholders)
import { createWorkoutCard } from '../workout/card.js';
import { handleSelection, getSelectionState } from '../ui/selection.js'; // Assuming selection state managed elsewhere
import { openInspector, activateTab } from '../inspector/inspector.js'; // Correct import
import { incrementExerciseFrequency } from '../exercises/library.js'; // Corrected import
import { showToast } from '../ui/toast.js';
import { triggerAnalyticsUpdate } from '../analytics/updates.js'; // Corrected import
// import { incrementExerciseFrequency } from '../exercises/frequency.js'; // Assuming frequency state managed elsewhere
// import { showToast } from '../ui/toast.js';
// import { triggerAnalyticsUpdate } from '../analytics/updates.js';

// State (Managed within this module)
let draggedItem = null;
let altKeyPressed = false;

// --- DOM References (Needs injection or querying in init) ---
let multiAthleteToggle = null; 
let workCanvasElement = null; // Needed for closest()
let exerciseListElement = null; // Needed for closest()

// --- Initialization ---
// Call this function after DOM is loaded to get element references
export function initializeDragDrop(config) {
    multiAthleteToggle = config.multiAthleteToggle || document.getElementById('multi-athlete-toggle');
    workCanvasElement = config.workCanvas || document.getElementById('work-canvas');
    exerciseListElement = config.exerciseList || document.querySelector('.exercise-list');

    if (!workCanvasElement || !exerciseListElement) {
        console.error("DragDrop Init Error: Work canvas or exercise list element not found.");
        return;
    }

    // Attach drag start/end listeners to containers
    exerciseListElement.addEventListener('dragstart', handleExerciseDragStart);
    exerciseListElement.addEventListener('dragend', handleExerciseDragEnd);
    workCanvasElement.addEventListener('dragstart', handleCardDragStart);
    workCanvasElement.addEventListener('dragend', handleCardDragEnd);

    // Attach global listeners for Alt key and window blur
    document.addEventListener('keydown', handleAltKeyDown); 
    document.addEventListener('keyup', handleAltKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    // Attach listeners to all *existing* slots on initialization
    const initialSlots = workCanvasElement.querySelectorAll('.day-cell');
    console.log(`[DragDrop Init] Attaching listeners to ${initialSlots.length} initial day cells.`);
    initialSlots.forEach(slot => {
        attachDragDropListeners(slot);
    });

    console.log("DragDrop module initialized and listeners attached.");
}

// --- Drag and Drop Handlers ---

export function attachDragDropListeners(slot) {
    slot.addEventListener('dragover', handleDragOver);
    slot.addEventListener('dragleave', handleDragLeave);
    slot.addEventListener('drop', handleDrop);
}

export function handleDragOver(e) {
    e.preventDefault();
    if (!draggedItem) return;
    e.dataTransfer.dropEffect = draggedItem.classList.contains('exercise-item') ? 'copy' : 'move';
    e.currentTarget.classList.add('drag-over');
    updateMultiAthleteHover(altKeyPressed, e.currentTarget); // Pass target
}

export function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
    e.currentTarget.classList.remove('multi-athlete-hover');
}

export function handleDrop(e) {
    e.preventDefault();
    const targetSlot = e.currentTarget;
    targetSlot.classList.remove('drag-over');
    targetSlot.classList.remove('multi-athlete-hover');

    if (!draggedItem) return;
    console.log('[handleDrop] Drop detected. Dragged item:', draggedItem);

    let newlyAddedCardId = null;

    if (draggedItem.classList.contains('exercise-item')) {
        const exerciseName = e.dataTransfer.getData('text/exercise-name') || 'Unknown Exercise';
        console.log('[handleDrop] Retrieved exercise name from dataTransfer:', e.dataTransfer.getData('text/exercise-name'));
        const exerciseId = draggedItem.dataset.exerciseId;
        console.log(`[handleDrop] Dropped exercise item: ${exerciseName} (ID: ${exerciseId})`);

        // Context-Aware Defaults
        const targetWeekContainer = targetSlot.closest('.week-row-container');
        const week = targetWeekContainer ? parseInt(targetWeekContainer.dataset.week, 10) : 1;
        const defaultRpe = 6 + Math.floor((week - 1) / 4);
        const defaultDetails = `3x8 @ RPE ${Math.min(9, defaultRpe)}`;
        console.log(`[handleDrop] Determined week: ${week}, default details: ${defaultDetails}`);

        const newCard = createWorkoutCard(exerciseName, defaultDetails, { exerciseId: exerciseId }); // Pass ID in options
        console.log('[handleDrop] createWorkoutCard returned:', newCard);

        if (newCard && targetSlot) {
            targetSlot.appendChild(newCard);
            newlyAddedCardId = newCard.id;

            // Open Inspector
            handleSelection(newCard, false); // Dependency
            openInspector(newCard); // Dependency
            activateTab('details'); // Dependency

            // Increment Frequency
            if (exerciseId) {
                incrementExerciseFrequency(exerciseId); // Dependency
            }

            // Undo Toast
            showToast( // Dependency
               `"${exerciseName}" added. <button class='toast-undo-btn' data-card-id='${newlyAddedCardId}'>Undo</button>`,
               'info',
               7000
           );
        } else {
            console.error('[handleDrop] Failed to create card or find target slot!', { newCard, targetSlot });
        }

    } else if (draggedItem.classList.contains('workout-card')) {
         // Moving an existing card
         if (targetSlot !== draggedItem.parentElement) {
           targetSlot.appendChild(draggedItem);
           // TODO: Add undo for move?
           // TODO: Trigger save state for move?
         }
    }

    // --- Pass workCanvasElement to triggerAnalyticsUpdate ---
    if (workCanvasElement) {
        triggerAnalyticsUpdate(workCanvasElement); // Pass canvas element
    } else {
        console.warn('[handleDrop] workCanvasElement not found, cannot trigger analytics update.');
    }
    // --- End Update ---
    draggedItem = null; // Reset state
}

// --- Drag Start/End Handlers ---

// Needs to be attached to the exercise list container
export function handleExerciseDragStart(e) {
    const exerciseItem = e.target.closest('.exercise-item');
    if (exerciseItem) {
        draggedItem = exerciseItem; // Set state
        const exerciseId = exerciseItem.dataset.exerciseId;
        const exerciseName = exerciseItem.querySelector('.exercise-list-name')?.textContent || 'Unknown';

        console.log(`[handleExerciseDragStart] Setting data: ID=${exerciseId}, Name=${exerciseName}`);
        e.dataTransfer.setData('text/plain', exerciseId);
        e.dataTransfer.setData('text/exercise-name', exerciseName);
        e.dataTransfer.effectAllowed = 'copy';
        setTimeout(() => {
             exerciseItem.classList.add('dragging');
        }, 0);
    }
}

// Needs to be attached to the exercise list container
export function handleExerciseDragEnd(e) {
   if (draggedItem && draggedItem.classList.contains('exercise-item')) {
       draggedItem.classList.remove('dragging');
       draggedItem = null; // Reset state
   }
}

// Needs to be attached to the work canvas
export function handleCardDragStart(e) {
    if (e.target.classList.contains('workout-card')) {
        draggedItem = e.target; // Set state
        e.dataTransfer.setData('text/plain', e.target.id);
        e.dataTransfer.effectAllowed = 'move';
         setTimeout(() => {
             e.target.classList.add('dragging');
        }, 0);
    }
}

// Needs to be attached to the work canvas
export function handleCardDragEnd(e) {
   if (draggedItem && draggedItem.classList.contains('workout-card')) {
       draggedItem.classList.remove('dragging');
       draggedItem = null; // Reset state
   }
}

// --- Multi-Athlete Hover Logic ---

// Needs to be attached to document keydown/keyup/blur
export function handleAltKeyDown(e) {
    if (e.altKey) {
        altKeyPressed = true; // Set state
        if (draggedItem && multiAthleteToggle?.checked) {
             updateMultiAthleteHover(true);
        }
    }
}

export function handleAltKeyUp(e) {
    if (!e.altKey) { 
        altKeyPressed = false; // Reset state
         if (draggedItem && multiAthleteToggle?.checked) {
             updateMultiAthleteHover(false);
        }
    }
}

export function handleWindowBlur() {
     altKeyPressed = false; // Reset state
     updateMultiAthleteHover(false);
}

// Helper to add/remove multi-athlete hover class from active drag-over slots
export function updateMultiAthleteHover(isAltDown, targetSlot = null) {
    if (targetSlot) { // If called from dragover, update specific target
        targetSlot.classList.toggle('multi-athlete-hover', isAltDown && multiAthleteToggle?.checked);
    } else { // If called from key event, update all potential targets
        document.querySelectorAll('.day-cell.drag-over').forEach(slot => {
            slot.classList.toggle('multi-athlete-hover', isAltDown && multiAthleteToggle?.checked);
        });
    }
}


// Dependencies:
// - DOM querying/manipulation
// - Browser globals: setTimeout, parseInt, Math
// - External state: draggedItem, altKeyPressed (need export/management)
// - External functions: createWorkoutCard, handleSelection, openInspector, activateTab, incrementExerciseFrequency, showToast, triggerAnalyticsUpdate
// - Event listeners need attaching in appropriate places (slots, exercise list, work canvas, document)
