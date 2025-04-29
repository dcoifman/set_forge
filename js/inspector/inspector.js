// Import dependencies (placeholders, update paths as needed)
// import { selectedElement, selectedElements } from '../ui/selection.js'; // Need to refactor selection logic
// import { getStructuredDetails } from '../utils/parser.js';
// import { saveWorkoutCardDetails, deleteSelectedWorkoutCard } from '../workout/card.js'; // Moved functions
// import { updateLoadValueExplanation } from '../ui/formHelpers.js'; // Placeholder
// import { getPhaseWeekRange, getCurrentBlockLoads } from '../state/blockData.js'; // Placeholder
// import { populateAssistTab } from './assist.js'; // Placeholder
// import { showInspectorFocusMessage, clearInspectorFocusMessage } from './focusMessage.js'; // Placeholder
// import { triggerAnalyticsUpdate } from '../analytics/updates.js';
// import { triggerSaveState } from '../state/storage.js';
import { showToast } from '../ui/toast.js';
import { getStructuredDetails } from '../utils/helpers.js';
import { deleteSelectedWorkoutCard } from '../workout/card.js'; 
import { updateLoadValueExplanation } from '../ui/dom.js';
import { getSelectionState } from '../ui/selection.js';
import ForgeAssist from '../forgeassist.js'; // <<< Added ForgeAssist import
import { getPhaseWeekRange } from '../calendar/indicators.js'; // <-- Added import
import { getCurrentBlockLoads } from '../state/blockData.js'; // <-- Added import for loads

// DOM References (Inject or query as needed)
const inspectorPanel = document.getElementById('inspector-panel');
const inspectorTabs = document.querySelectorAll('.inspector-tabs .tab-link');
const inspectorContents = document.querySelectorAll('.inspector-content .tab-content');
const inspectorTitle = document.getElementById('inspector-title');
const inspectorTabsContainer = document.querySelector('.inspector-tabs');
const blockBuilderContainer = document.querySelector('.block-builder-container');
const inspectorCloseBtn = document.getElementById('inspector-close-btn');
const workCanvas = document.getElementById('work-canvas'); // Needed for phase calc

// Global state (potentially refactor later)

// DOM Elements (cached for performance)

// Initialize DOM element references
function cacheDOMElements() {
    // ... caching logic ...
}

export function activateTab(targetTabId) {
    inspectorTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === targetTabId);
    });
    inspectorContents.forEach(content => {
        const isActive = content.id === targetTabId;
        content.classList.toggle('active', isActive);
        // Force display style for the active tab content
        if (isActive) {
            content.style.display = ''; // Reset to default display (usually block via CSS .active)
        } else {
            // Optionally ensure inactive tabs are hidden if not handled by setTabVisibility
            // content.style.display = 'none'; 
        }
    });
}

export function setTabVisibility(visibleTabs) {
    // Manage Tab Link visibility
    inspectorTabs.forEach(tab => {
        const tabId = tab.dataset.tab;
        if (visibleTabs.includes(tabId)) {
            tab.style.display = '';
        } else {
            tab.style.display = 'none';
        }
    });

    // --- ADDED: Manage Content Div visibility ---
    inspectorContents.forEach(content => {
        const contentId = content.id;
        if (visibleTabs.includes(contentId)) {
            content.style.display = ''; // Use default display (which .active class will override if needed)
        } else {
            content.style.display = 'none'; // Explicitly hide content not in the list
            // Also remove 'active' class if it's being hidden
            if (content.classList.contains('active')) {
                content.classList.remove('active');
            }
        }
    });
    // --- END ADDED ---

    // Ensure at least one visible tab is active (call activateTab AFTER visibility is set)
    const currentActiveTabLink = inspectorTabsContainer.querySelector('.tab-link.active');
    // Check if the currently active tab link is now hidden
    if (currentActiveTabLink && currentActiveTabLink.style.display === 'none') {
        const firstVisibleTabLink = inspectorTabsContainer.querySelector('.tab-link:not([style*="display: none"])'); // Find first visible link
        if (firstVisibleTabLink) {
            activateTab(firstVisibleTabLink.dataset.tab);
        }
    } else if (!currentActiveTabLink) {
        // Or if NO tab is active, activate the first visible one
        const firstVisibleTabLink = inspectorTabsContainer.querySelector('.tab-link:not([style*="display: none"])');
        if (firstVisibleTabLink) {
            activateTab(firstVisibleTabLink.dataset.tab);
        }
    }
}

export function openInspector(content = null) {
    // selectedElement = content; // This state needs to be managed externally
    inspectorPanel.classList.add('is-visible');
    if (blockBuilderContainer) blockBuilderContainer.classList.add('inspector-is-visible');
    // REMOVED: const detailsTab = document.getElementById('details');
    // REMOVED: detailsTab.innerHTML = ''; // Clear previous details - Let updateInspector handle this

    // Default title and tabs if inspector wasn't already visible or no content specified?
    // Maybe reset only if !content?
    if (inspectorTitle) inspectorTitle.textContent = 'Inspector';
    // REMOVED: setTabVisibility(['library', 'details', 'assist', 'settings']); // Let updateInspector handle this

    // --- Logic based on selected content (moved to updateInspectorForSelection) ---
    // This function now primarily just ensures the panel is visible.
    // Content-specific updates should happen elsewhere, likely in updateInspectorForSelection.
    // REMOVED: updateInspectorForSelection(); // Call update function after opening - REMOVE THIS
}

export function closeInspector() {
    inspectorPanel.classList.remove('is-visible');
    if (blockBuilderContainer) blockBuilderContainer.classList.remove('inspector-is-visible');
    // Deselection logic needs to be handled externally (e.g., in selection module)
    // if (selectedElement) {
    //     selectedElement.classList.remove('selected');
    // }
    // selectedElements.forEach(el => el.classList.remove('selected'));
    // selectedElements.clear();
    // selectedElement = null;

    // Reset title when closed
    if (inspectorTitle) inspectorTitle.textContent = 'Inspector';
}

export function updateInspectorPhaseDetails(phaseElement) {
     if (!phaseElement || !inspectorPanel.classList.contains('is-visible')) return;
      const detailsTab = document.getElementById('details');
      const phaseName = phaseElement.dataset.phase; // Use data attribute
      const phaseWidth = parseFloat(phaseElement.style.width).toFixed(1);

      // Calculate real stats for phase (Needs dependency injection/imports)
      const totalWeeksInBlock = workCanvas.querySelectorAll('.week-label').length;
      const phaseRibbon = phaseElement.closest('.phase-ribbon'); // Find the ribbon element

      // --- Updated call to getPhaseWeekRange ---
      const { startWeek, endWeek } = getPhaseWeekRange(phaseElement, phaseRibbon, workCanvas); // <-- Updated arguments
      // --- End of Update ---

      const phaseDurationWeeks = (endWeek - startWeek + 1);
      const weeklyLoadsInPhase = [];
      // --- Updated call to getCurrentBlockLoads ---
      const currentLoads = getCurrentBlockLoads(workCanvas); // <-- Pass workCanvas
      // --- End of Update ---
      for (let w = startWeek; w <= endWeek; w++) {
         const weekStartIndex = (w - 1) * 7;
         const weekLoads = currentLoads.slice(weekStartIndex, weekStartIndex + 7);
         const totalWeekLoad = weekLoads.reduce((sum, load) => sum + load, 0);
         weeklyLoadsInPhase.push(totalWeekLoad);
      }
      const avgWeeklyLoad = weeklyLoadsInPhase.length > 0 ?
                             Math.round(weeklyLoadsInPhase.reduce((sum, load) => sum + load, 0) / weeklyLoadsInPhase.length) :
                             0;

      // Simple Load Category
      const loadCategory = avgWeeklyLoad > 4000 ? 'High' : avgWeeklyLoad > 2000 ? 'Moderate' : 'Low';

      detailsTab.innerHTML = `
           <h4>Phase Details</h4>
           <p><strong>Phase:</strong> ${phaseElement.querySelector('.phase-bar-label').textContent}</p>
           <p><strong>Duration:</strong> ${phaseWidth}% (${phaseDurationWeeks} weeks)</p>
           <p><strong>Avg. Weekly Load:</strong> ${avgWeeklyLoad} units (${loadCategory})</p>
           <hr class="detail-separator">
           <p><em>Drag edge to resize.</em></p>`;
}

export function openMultiSelectInspector() {
     // Placeholder function for multi-select inspector view
     inspectorPanel.classList.add('is-visible');
     if (blockBuilderContainer) blockBuilderContainer.classList.add('inspector-is-visible');
     const detailsTab = document.getElementById('details');
     activateTab('details'); // Activate details tab

     // Needs access to selectedElements state
     if (inspectorTitle) inspectorTitle.textContent = `${selectedElements.size} Items Selected`;

     detailsTab.innerHTML = `
         <h4>Multiple Items Selected (${selectedElements.size})</h4>
         <p>Apply bulk actions:</p>
         <button id="delete-selected-items" class="cta-button secondary-cta" style="background-color: #555;">Delete Selected Cards</button>
         <hr class="detail-separator">
         <p><em>More bulk actions coming soon (e.g., copy, tag).</em></p>
     `;

     // Add listener for the bulk delete button
     const deleteBtn = detailsTab.querySelector('#delete-selected-items');
     if (deleteBtn) {
         // Check if any cards are selected before enabling
         const cardsSelected = Array.from(selectedElements).some(el => el.classList.contains('workout-card'));
         deleteBtn.disabled = !cardsSelected;
         if (cardsSelected) {
            deleteBtn.addEventListener('click', deleteSelectedWorkoutCard); // Dependency
         } else {
             deleteBtn.textContent = 'Delete Selected (No Cards)';
         }
     }
     // Hide library/assist/settings for multi-select? Or show common settings?
     setTabVisibility(['details']); // Only show details tab for multi-select for now
}

// New function to render the Assist tab content
function renderAssistTabContent() {
    const container = document.getElementById('assist')?.querySelector('.assist-action-list-container');
    if (!container) return;

    try {
        // Check if ForgeAssist is properly initialized
        if (!ForgeAssist || typeof ForgeAssist.getContextualActions !== 'function') {
            container.innerHTML = '<p><i>ForgeAssist is not available. Please refresh the page.</i></p>';
            console.error('[Inspector] ForgeAssist module not properly loaded');
            return;
        }

        // Try to get actions from ForgeAssist with proper error handling
        const actions = ForgeAssist.getContextualActions() || [];

        container.innerHTML = ''; // Clear previous content

        if (actions.length === 0) {
            container.innerHTML = '<p><i>No contextual actions available for the current selection.</i></p>';
            return;
        }

        const list = document.createElement('div');
        list.className = 'assist-action-list';

        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = 'cta-button secondary-cta assist-action-btn'; // Use appropriate classes
            button.textContent = action.label;
            button.disabled = action.disabled || false;
            button.dataset.actionId = action.id;

            if (action.handler) {
                if (typeof action.handler === 'function') {
                    button.addEventListener('click', (e) => {
                        e.stopPropagation(); // Prevent other inspector clicks
                        try {
                            action.handler(); // Execute the provided handler directly
                        } catch (error) {
                            console.error(`[Inspector] Error executing action handler for "${action.label}":`, error);
                            showToast(`Error executing action: ${error.message}`, 'error');
                        }
                    });
                } else if (typeof action.handler === 'string') {
                     // Assume it's a command string for processCommand
                     button.addEventListener('click', (e) => {
                         e.stopPropagation();
                         try {
                             ForgeAssist.processCommand(action.handler);
                         } catch (error) {
                            console.error(`[Inspector] Error executing command "${action.handler}":`, error);
                            showToast(`Error executing command: ${error.message}`, 'error');
                         }
                     });
                } // Add other handler types if needed
            } else {
                // Default: assume ID maps to a command
                 button.addEventListener('click', (e) => {
                     e.stopPropagation();
                     // Maybe map common IDs to commands? Or just disable?
                     console.warn(`[Inspector] No handler defined for assist action: ${action.id}`);
                     showToast(`Action '${action.label}' not fully implemented yet.`, 'info');
                 });
                 // button.disabled = true; // Option: disable if no handler
            }
            list.appendChild(button);
        });

        container.appendChild(list);
    } catch (error) {
        console.error('[Inspector] Error rendering assist tab content:', error);
        container.innerHTML = '<p><i>An error occurred while loading contextual actions. Please try again.</i></p>';
    }
}

// This function replaces the conditional logic inside openInspector and handles updates based on current selection state
export function updateInspectorForSelection() {
    clearInspectorFocusMessage();
    const detailsTabContent = document.getElementById('details');
    if (!detailsTabContent) return;

    const { selectedElement, selectedElements } = getSelectionState();

    if (selectedElements.size > 1) {
        openMultiSelectInspector();
        return;
    }

    const element = selectedElement;

    if (!element) {
         // Nothing selected - show default message or settings tab
         if (inspectorPanel.classList.contains('is-visible')) { // Only change if inspector is open
            detailsTabContent.innerHTML = '<p>Select an item on the canvas to see details.</p>';
            if (inspectorTitle) inspectorTitle.textContent = 'Block Settings';
            setTabVisibility(['library', 'details', 'assist', 'analytics', 'settings']);
            activateTab('settings'); // Default to settings when nothing selected
         }
        return;
    }

    // If we reach here, something IS selected, ensure inspector is visible and details tab active
    if (!inspectorPanel.classList.contains('is-visible')) {
        openInspector(element); // Open if not already open
    }
    setTabVisibility(['library', 'details', 'assist', 'analytics', 'settings']);
    activateTab('details');

    if (element.classList.contains('session-placeholder-card')) {
        // --- Handle Placeholder Selection ---
         if (inspectorTitle) inspectorTitle.textContent = 'Placeholder Details';
         const sessionType = element.dataset.sessionType || 'Placeholder';
         const targetMetric = element.dataset.targetMetric || 'N/A';
         const cell = element.closest('.day-cell');
         const day = cell?.dataset.day || '?';
         const week = cell?.dataset.week || '?';
         detailsTabContent.innerHTML = `
            <h4>${sessionType} Session Placeholder</h4>
            <p><strong>Location:</strong> ${day}, Week ${week}</p>
            <p><strong>Target / Details:</strong> ${targetMetric}</p>
            <hr class="detail-separator">
            <p><em>This is a planned session outline.</em></p>
            <p><strong>Next Steps:</strong></p>
            <ul>
                <li>Click the '+' button on the card to quickly open the Library.</li>
                <li>Double-click the card to open the Library.</li>
                <li>Drag specific exercises from the Library tab onto the calendar day.</li>
            </ul>
         `;
    } else if (element.classList.contains('workout-card')) {
        // --- Handle Regular Card Selection (Existing Logic) ---
        const structuredDetails = getStructuredDetails(element); // Dependency
        const parentCell = element.closest('.day-cell');
        const week = parentCell?.dataset.week || '?';
        const day = parentCell?.dataset.day || '?';
        const cardLoad = parseInt(element.dataset.load || '0', 10);

        if (inspectorTitle) inspectorTitle.textContent = `Edit: ${structuredDetails.name}`;

        detailsTabContent.innerHTML = `
             <p><small>Location: Week ${week}, ${day}</small></p>
             <p><small>Est. Load Contribution: ${cardLoad} units</small></p>
             <hr class="detail-separator">
             <div class="form-group full-width">
                <label for="inspector-exercise-name">Exercise Name</label>
                <input type="text" id="inspector-exercise-name" value="${structuredDetails.name}">
             </div>
             <div class="structured-inputs" style="display: flex; flex-wrap: wrap; gap: 0 1rem;">
                <div style="display: flex; gap: 1rem; width: 100%; margin-bottom: 1rem;">
                    <div class="form-group" style="flex: 1;">
                        <label for="inspector-sets">Sets</label>
                        <input type="number" id="inspector-sets" value="${structuredDetails.sets}" min="1">
                    </div>
                    <div class="form-group" style="flex: 1;">
                        <label for="inspector-reps">Reps</label>
                        <input type="text" id="inspector-reps" value="${structuredDetails.reps}" placeholder="e.g., 5 or 8-12">
                    </div>
                </div>
                <div class="form-group" style="flex-basis: 50%; flex-grow: 1;">
                    <label for="inspector-load-type">Load Type</label>
                    <select id="inspector-load-type">
                        <option value="rpe" ${structuredDetails.loadType === 'rpe' ? 'selected' : ''}>RPE</option>
                        <option value="percent" ${structuredDetails.loadType === 'percent' ? 'selected' : ''}>% 1RM</option>
                        <option value="weight" ${structuredDetails.loadType === 'weight' ? 'selected' : ''}>Weight (kg)</option>
                        <option value="text" ${structuredDetails.loadType === 'text' ? 'selected' : ''}>Text</option>
                    </select>
                </div>
                <div class="form-group" style="flex-basis: calc(50% - 1rem); flex-grow: 1;">
                    <label for="inspector-load-value">Load Value</label>
                    <input type="text" id="inspector-load-value" value="${structuredDetails.loadValue}" placeholder="e.g., 8 or 75">
                    <div id="load-value-explanation" style="font-size: 0.75rem; color: var(--text-color); margin-top: 4px; min-height: 1em;"></div>
                </div>
                <div class="form-group" style="flex-basis: 100%;">
                    <label for="inspector-rest">Rest</label>
                    <input type="text" id="inspector-rest" value="${structuredDetails.rest}" placeholder="e.g., 90s or 2m">
                </div>
             </div>
             <div class="form-group full-width">
                <label for="inspector-notes">Notes</label>
                <textarea id="inspector-notes" rows="3">${structuredDetails.notes}</textarea>
             </div>
             <hr class="detail-separator">
             <button id="save-card-details" class="cta-button primary-cta">Save Details</button>
             <button id="delete-card" class="cta-button secondary-cta" style="margin-top: 10px; background-color: #555;">Delete Card</button>
        `;

        // Add listeners for save/delete
        document.getElementById('save-card-details')?.addEventListener('click', saveWorkoutCardDetails); // Dependency
        document.getElementById('delete-card')?.addEventListener('click', deleteSelectedWorkoutCard); // Dependency

        // Add listener for load type change to update explanation
        const loadTypeSelect = document.getElementById('inspector-load-type');
        if (loadTypeSelect) {
            loadTypeSelect.addEventListener('change', updateLoadValueExplanation); // Dependency
            updateLoadValueExplanation(); // Initial call
        }

    } else if (element.classList.contains('day-cell')) {
         // --- Handle Day Cell Selection ---
         const week = element.dataset.week;
         const day = element.dataset.day;
         if (inspectorTitle) inspectorTitle.textContent = `Day Details: Wk ${week}, ${day}`;

         let totalDayLoad = 0;
         let cardCount = 0;
         let exerciseNames = [];
         element.querySelectorAll('.workout-card:not(.session-placeholder-card)').forEach(card => {
             const name = card.querySelector('.exercise-name')?.textContent || '';
             if(name) exerciseNames.push(name.toLowerCase());
             totalDayLoad += parseInt(card.dataset.load || '0', 10);
             cardCount++;
         });

         let focus = 'Mixed';
         if (cardCount > 0) {
             if (exerciseNames.every(name => name.includes('squat') || name.includes('deadlift') || name.includes('leg'))) focus = 'Lower Body';
             else if (exerciseNames.every(name => name.includes('press') || name.includes('row') || name.includes('pull'))) focus = 'Upper Body';
             else if (exerciseNames.every(name => name.includes('run') || name.includes('sprint') || name.includes('jump'))) focus = 'Conditioning/Plyo';
         }

         detailsTabContent.innerHTML = `<h4>Week ${week}, ${day}</h4>`;
         if (cardCount > 0) {
            detailsTabContent.innerHTML += '<ul>' + exerciseNames.map(name => `<li>${name}</li>`).join('') + '</ul>';
         }
         detailsTabContent.innerHTML += `
             <hr class="detail-separator">
             <p><small>Card Count: ${cardCount}</small></p>
             <p><small>Est. Daily Load: ${totalDayLoad} units</small></p>
             <p><small>Focus: ${focus}</small></p>
             <p><small>Phase: [Needs Phase Info]</small></p> 
         `;
         // Add Quick Add functionality here?

    } else if (element.classList.contains('phase-bar')) {
        // --- Handle Phase Bar Selection ---
        updateInspectorPhaseDetails(element); // Call dedicated function
    } else {
        // Fallback for unknown selection
        detailsTabContent.innerHTML = '<p>Select an item on the canvas to see details.</p>';
        if (inspectorTitle) inspectorTitle.textContent = 'Inspector';
    }

    // Update ForgeAssist Contextual Actions
    renderAssistTabContent(); // <<< Call new render function
}

// Save function (was inside openInspector initially)
export function saveWorkoutCardDetails() {
    const { selectedElement } = getSelectionState();
    if (!selectedElement || !selectedElement.classList.contains('workout-card')) return;

    const nameInput = document.getElementById('inspector-exercise-name');
    const setsInput = document.getElementById('inspector-sets');
    const repsInput = document.getElementById('inspector-reps');
    const loadTypeSelect = document.getElementById('inspector-load-type');
    const loadValueInput = document.getElementById('inspector-load-value');
    const restInput = document.getElementById('inspector-rest');
    const notesInput = document.getElementById('inspector-notes');

    if (nameInput && setsInput && repsInput && loadTypeSelect && loadValueInput && restInput && notesInput) {
        selectedElement.querySelector('.exercise-name').textContent = nameInput.value;

        let detailsString = '';
        if (setsInput.value && repsInput.value) detailsString += `${setsInput.value} x ${repsInput.value}`;
        else if (setsInput.value) detailsString += `${setsInput.value} sets`;
        else if (repsInput.value) detailsString += `${repsInput.value} reps`;

        if (loadValueInput.value) {
             if (detailsString) detailsString += ' @ ';
             if (loadTypeSelect.value === 'rpe') detailsString += `RPE ${loadValueInput.value}`;
             else if (loadTypeSelect.value === 'percent') detailsString += `${loadValueInput.value}%`;
             else if (loadTypeSelect.value === 'weight') detailsString += `${loadValueInput.value}kg`;
             else detailsString += loadValueInput.value;
        }
         if (restInput.value) detailsString += ` (${restInput.value} rest)`;

        selectedElement.querySelector('.details').textContent = detailsString || 'No details';

        selectedElement.dataset.sets = setsInput.value;
        selectedElement.dataset.reps = repsInput.value;
        selectedElement.dataset.loadType = loadTypeSelect.value;
        selectedElement.dataset.loadValue = loadValueInput.value;
        selectedElement.dataset.rest = restInput.value;
        selectedElement.dataset.notes = notesInput.value;

        // Update estimated load (duplicate logic, should be in a helper)
        let estimatedLoad = 300;
        const sets = parseInt(setsInput.value, 10) || 1;
        const reps = parseInt(repsInput.value.split('-')[0], 10) || 5;
        const loadVal = parseFloat(loadValueInput.value) || 0;
        estimatedLoad += sets * reps * 5;
        if (loadTypeSelect.value === 'rpe' && loadVal > 7) estimatedLoad *= (1 + (loadVal - 7) * 0.15);
        if (loadTypeSelect.value === 'percent' && loadVal > 70) estimatedLoad *= (1 + (loadVal - 70) * 0.015);
         if (loadTypeSelect.value === 'weight') estimatedLoad = Math.max(estimatedLoad, loadVal * sets * reps * 0.5);
        if (nameInput.value.toLowerCase().includes('squat') || nameInput.value.toLowerCase().includes('deadlift')) estimatedLoad *= 1.2;
        if (nameInput.value.toLowerCase().includes('press')) estimatedLoad *= 0.8;
        selectedElement.dataset.load = Math.round(estimatedLoad);

        triggerAnalyticsUpdate(); // Dependency
        triggerSaveState(); // Dependency
        showToast('Workout details saved', 'info', 1500); // Dependency
    }
}

// Setup listeners originally in blockbuilder.js
export function initializeInspectorListeners() {
    if (inspectorCloseBtn) inspectorCloseBtn.addEventListener('click', closeInspector);

    inspectorTabs.forEach(tab => {
        tab.addEventListener('click', () => {
           activateTab(tab.dataset.tab);
        });
    });
    // Potentially add listener for clicking outside inspector to close it here?
}

// --- Inspector Focus Message ---
let inspectorFocusTimeout = null;
export function showInspectorFocusMessage(message, duration = 4000) {
    clearTimeout(inspectorFocusTimeout);
    const focusArea = document.getElementById('inspector-focus-message'); // Assumes this element exists in HTML
    if (focusArea) {
        focusArea.textContent = message;
        focusArea.style.display = 'block';
        inspectorFocusTimeout = setTimeout(() => {
            focusArea.style.display = 'none';
            focusArea.textContent = '';
        }, duration);
    }
}

export function clearInspectorFocusMessage() {
     clearTimeout(inspectorFocusTimeout);
     const focusArea = document.getElementById('inspector-focus-message');
     if (focusArea) {
         focusArea.style.display = 'none';
         focusArea.textContent = '';
     }
}

// Dependencies:
// - DOM querying/manipulation (getElementById, querySelectorAll, classList, innerHTML, style, etc.)
// - Browser globals (parseInt, parseFloat, Math)
// - External state: selectedElement, selectedElements
// - External functions (needs imports):
//   - getStructuredDetails
//   - saveWorkoutCardDetails, deleteSelectedWorkoutCard
//   - updateLoadValueExplanation
//   - getPhaseWeekRange, getCurrentBlockLoads
//   - populateAssistTab
//   - showInspectorFocusMessage, clearInspectorFocusMessage
//   - triggerAnalyticsUpdate
//   - triggerSaveState
//   - showToast
// - Event listeners need re-attachment for save/delete buttons within dynamic content
// - Initialization function `initializeInspectorListeners` needs to be called.
