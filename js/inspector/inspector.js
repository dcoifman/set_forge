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
import { getCurrentBlockLoads } from '../state/blockData.js'; // <-- Added import for load calculations

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
        // Make a defensive check for ForgeAssist
        const forgeAssist = window.ForgeAssist || ForgeAssist || null;
        
        // Check if ForgeAssist is properly initialized
        if (!forgeAssist || typeof forgeAssist.getContextualActions !== 'function') {
            container.innerHTML = '<p><i>ForgeAssist is initializing. Please wait or refresh the page if this message persists.</i></p>';
            console.warn('[Inspector] ForgeAssist module not properly loaded or still initializing');
            return;
        }

        // Try to get actions from ForgeAssist with proper error handling
        const actions = forgeAssist.getContextualActions() || [];

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
                             forgeAssist.processCommand(action.handler);
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

// New function to create and update load gauges in the Inspector
export function updateInspectorLoadGauges(context = {}) {
    const detailsTab = document.getElementById('details');
    if (!detailsTab) return;
    
    // Check if load gauge container exists, create if not
    let loadGaugeContainer = document.getElementById('inspector-load-gauges');
    if (!loadGaugeContainer) {
        loadGaugeContainer = document.createElement('div');
        loadGaugeContainer.id = 'inspector-load-gauges';
        loadGaugeContainer.className = 'inspector-load-gauges';
        
        // Insert at top of details tab if it's not the first child
        if (detailsTab.firstChild) {
            detailsTab.insertBefore(loadGaugeContainer, detailsTab.firstChild);
        } else {
            detailsTab.appendChild(loadGaugeContainer);
        }
    }
    
    // Get context data
    const selectedElement = context.selectedElement || (getSelectionState ? getSelectionState().selectedElement : null);
    
    if (!selectedElement) {
        // If nothing selected, show general block load info
        const currentLoads = getCurrentBlockLoads(workCanvas);
        const weeklyLoads = calculateWeeklyLoads(currentLoads);
        const totalLoad = currentLoads.reduce((sum, load) => sum + load, 0);
        const avgWeeklyLoad = weeklyLoads.length > 0 ? 
            Math.round(weeklyLoads.reduce((sum, load) => sum + load, 0) / weeklyLoads.length) : 0;
        
        loadGaugeContainer.innerHTML = `
            <h4>Block Load Summary</h4>
            <div class="gauge-container">
                <div class="inspector-gauge">
                    <span class="gauge-label">Total Load</span>
                    <span class="gauge-value">${totalLoad.toLocaleString()}</span>
                    <div class="gauge-bar-bg"><div class="gauge-bar" style="width: 70%;"></div></div>
                </div>
                <div class="inspector-gauge">
                    <span class="gauge-label">Avg Weekly</span>
                    <span class="gauge-value">${avgWeeklyLoad.toLocaleString()}</span>
                    <div class="gauge-bar-bg"><div class="gauge-bar" style="width: 65%;"></div></div>
                </div>
            </div>
        `;
        return;
    }
    
    // Handle different element types
    if (selectedElement.classList.contains('workout-card')) {
        // For workout cards, show exercise-specific load
        const cardData = getStructuredDetails(selectedElement);
        if (!cardData) return;
        
        const setsReps = cardData.sets * cardData.reps;
        const estimatedLoad = cardData.load * setsReps;
        const percentOfDayLoad = 65; // Mock value, would be calculated based on day's total load
        
        loadGaugeContainer.innerHTML = `
            <h4>Exercise Load</h4>
            <div class="gauge-container">
                <div class="inspector-gauge">
                    <span class="gauge-label">Total</span>
                    <span class="gauge-value">${estimatedLoad.toLocaleString()}</span>
                    <div class="gauge-bar-bg"><div class="gauge-bar" style="width: ${percentOfDayLoad}%;"></div></div>
                </div>
                <div class="inspector-gauge">
                    <span class="gauge-label">Volume</span>
                    <span class="gauge-value">${setsReps} (${cardData.sets}×${cardData.reps})</span>
                    <div class="gauge-bar-bg"><div class="gauge-bar" style="width: 50%;"></div></div>
                </div>
            </div>
        `;
    } else if (selectedElement.classList.contains('day-cell')) {
        // For day cells, show day's total load
        const dayLoad = calculateDayLoad(selectedElement);
        const weekAvg = calculateWeekAverageLoad(selectedElement);
        const percentOfWeek = weekAvg > 0 ? Math.min(100, Math.round((dayLoad / weekAvg) * 70)) : 0;
        
        loadGaugeContainer.innerHTML = `
            <h4>Day Load</h4>
            <div class="gauge-container">
                <div class="inspector-gauge">
                    <span class="gauge-label">Total</span>
                    <span class="gauge-value">${dayLoad.toLocaleString()}</span>
                    <div class="gauge-bar-bg"><div class="gauge-bar" style="width: ${percentOfWeek}%;"></div></div>
                </div>
                <div class="inspector-gauge">
                    <span class="gauge-label">vs. Week Avg</span>
                    <span class="gauge-value">${weekAvg > 0 ? Math.round((dayLoad / weekAvg) * 100) : 0}%</span>
                    <div class="gauge-bar-bg"><div class="gauge-bar" style="width: ${percentOfWeek}%;"></div></div>
                </div>
            </div>
        `;
    } else if (selectedElement.classList.contains('phase-bar')) {
        // For phase bars, show phase load metrics
        const { startWeek, endWeek } = getPhaseWeekRange(selectedElement, selectedElement.closest('.phase-ribbon'), workCanvas);
        const phaseDurationWeeks = (endWeek - startWeek + 1);
        const phaseWeeklyLoads = [];
        const currentLoads = getCurrentBlockLoads(workCanvas);
        
        for (let w = startWeek; w <= endWeek; w++) {
            const weekStartIndex = (w - 1) * 7;
            const weekLoads = currentLoads.slice(weekStartIndex, weekStartIndex + 7);
            const totalWeekLoad = weekLoads.reduce((sum, load) => sum + load, 0);
            phaseWeeklyLoads.push(totalWeekLoad);
        }
        
        const totalPhaseLoad = phaseWeeklyLoads.reduce((sum, load) => sum + load, 0);
        const avgWeeklyLoad = phaseWeeklyLoads.length > 0 ?
            Math.round(phaseWeeklyLoads.reduce((sum, load) => sum + load, 0) / phaseWeeklyLoads.length) : 0;
        
        // Calculate percentage for visualization (70% max width to avoid overflow)
        const percentBar = Math.min(70, Math.round((avgWeeklyLoad / 5000) * 100));
        
        loadGaugeContainer.innerHTML = `
            <h4>Phase Load</h4>
            <div class="gauge-container">
                <div class="inspector-gauge">
                    <span class="gauge-label">Total</span>
                    <span class="gauge-value">${totalPhaseLoad.toLocaleString()}</span>
                    <div class="gauge-bar-bg"><div class="gauge-bar" style="width: ${percentBar}%;"></div></div>
                </div>
                <div class="inspector-gauge">
                    <span class="gauge-label">Avg Weekly</span>
                    <span class="gauge-value">${avgWeeklyLoad.toLocaleString()}</span>
                    <div class="gauge-bar-bg"><div class="gauge-bar" style="width: ${percentBar}%;"></div></div>
                </div>
            </div>
        `;
    } else {
        // Clear the gauges if not a recognized element
        loadGaugeContainer.innerHTML = '';
    }
}

// Helper function to calculate total load for a day cell
function calculateDayLoad(dayCell) {
    if (!dayCell) return 0;
    
    const workoutCards = dayCell.querySelectorAll('.workout-card');
    let totalLoad = 0;
    
    workoutCards.forEach(card => {
        const cardData = getStructuredDetails(card);
        if (cardData) {
            totalLoad += cardData.load * cardData.sets * cardData.reps;
        }
    });
    
    return totalLoad;
}

// Helper function to calculate the average load for a week
function calculateWeekAverageLoad(dayCell) {
    if (!dayCell) return 0;
    
    // Find the week container
    const weekRow = dayCell.closest('.week-row');
    if (!weekRow) return 0;
    
    // Get all day cells in this week
    const dayCells = weekRow.querySelectorAll('.day-cell');
    let totalWeekLoad = 0;
    let daysWithLoad = 0;
    
    dayCells.forEach(cell => {
        const dayLoad = calculateDayLoad(cell);
        totalWeekLoad += dayLoad;
        if (dayLoad > 0) daysWithLoad++;
    });
    
    return daysWithLoad > 0 ? Math.round(totalWeekLoad / daysWithLoad) : 0;
}

// New function to update the ForgeAssist tab
export function updateForgeAssistTab() {
    const assistTab = document.getElementById('assist');
    if (!assistTab) return;
    
    // Get contextual actions from ForgeAssist
    let contextualActions = [];
    try {
        // Make a defensive check for ForgeAssist
        const forgeAssist = window.ForgeAssist || ForgeAssist || null;
        
        if (forgeAssist && typeof forgeAssist.getContextualActions === 'function') {
            contextualActions = forgeAssist.getContextualActions() || [];
        }
    } catch (error) {
        console.error('[Inspector] Error getting contextual actions:', error);
        contextualActions = []; // Ensure empty array on error
    }
    
    // Get the containers
    const actionListContainer = assistTab.querySelector('.assist-action-list-container');
    const accessorySuggestionsContainer = document.getElementById('accessory-suggestions-container');
    
    if (!actionListContainer) return;
    
    // Update the action list
    let actionsHtml = '';
    
    if (contextualActions.length === 0) {
        actionListContainer.innerHTML = '<p><i>No contextual actions available for the current selection.</i></p>';
    } else {
        actionsHtml = '<div class="assist-action-list">';
        
        contextualActions.forEach(action => {
            let disabledAttr = action.disabled ? 'disabled' : '';
            actionsHtml += `
                <button class="cta-button secondary-cta assist-action-btn" 
                        data-action-id="${action.id || ''}" 
                        ${disabledAttr}>
                    ${action.label || 'Action'}
                </button>
            `;
        });
        
        actionsHtml += '</div>';
        actionListContainer.innerHTML = actionsHtml;
        
        // Add event listeners to the buttons
        const actionButtons = actionListContainer.querySelectorAll('.assist-action-btn');
        actionButtons.forEach(button => {
            button.addEventListener('click', handleForgeAssistAction);
        });
    }
    
    // Update accessory suggestions if in the right context
    if (accessorySuggestionsContainer) {
        updateAccessorySuggestions(accessorySuggestionsContainer);
    }
}

// Function to handle ForgeAssist action button clicks
function handleForgeAssistAction(event) {
    const actionId = event.target.dataset.actionId;
    if (!actionId) return;
    
    try {
        // This assumes ForgeAssist has a handleAction method that takes an action ID
        if (typeof ForgeAssist.handleAction === 'function') {
            ForgeAssist.handleAction(actionId);
        } else {
            console.warn('[Inspector] ForgeAssist.handleAction is not available');
        }
    } catch (error) {
        console.error(`[Inspector] Error executing ForgeAssist action ${actionId}:`, error);
        showToast(`Error executing action: ${error.message}`, 'error');
    }
}

// Function to update accessory suggestions
function updateAccessorySuggestions(container) {
    if (!container) return;
    
    // Get selection context
    const { selectedElement } = getSelectionState ? getSelectionState() : { selectedElement: null };
    
    // Check if a day cell is selected
    const isDayCell = selectedElement && selectedElement.classList.contains('day-cell');
    
    if (!isDayCell) {
        container.innerHTML = '<p>Select a day with GDAP exercises to see suggestions.</p>';
        return;
    }
    
    // Check if day has GDAP exercises - Fix to use the correct data attribute
    // The correct attribute is data-goal-driven='true', not data-is-gdap
    const hasGDAPExercises = selectedElement.querySelector('.workout-card[data-goal-driven="true"]') || 
                            selectedElement.querySelector('.workout-card[data-source-goal-id]');
    
    if (!hasGDAPExercises) {
        container.innerHTML = '<p>This day has no primary GDAP exercises. Add a GDAP exercise to see accessory suggestions.</p>';
        return;
    }
    
    // Get suggestions from ForgeAssist/RecoveryRecommender
    let suggestions = [];
    try {
        if (typeof ForgeAssist.getSuggestionsForDay === 'function') {
            suggestions = ForgeAssist.getSuggestionsForDay(selectedElement) || [];
        }
    } catch (error) {
        console.error('[Inspector] Error getting accessory suggestions:', error);
        suggestions = []; // Ensure empty array on error
    }
    
    if (suggestions.length === 0) {
        container.innerHTML = '<p>No accessory suggestions available for the selected day.</p>';
        return;
    }
    
    // Build the suggestions UI
    let suggestionsHtml = `
        <h4>Accessory Suggestions</h4>
        <p class="assist-subtitle">Based on your primary exercises</p>
        <ul class="accessory-suggestion-list">
    `;
    
    suggestions.forEach(suggestion => {
        suggestionsHtml += `
            <li class="accessory-suggestion-item" data-exercise-id="${suggestion.id}">
                <div class="suggestion-exercise-name">${suggestion.name}</div>
                <div class="suggestion-reason">${suggestion.reason}</div>
                <button class="add-suggestion-btn">Add</button>
            </li>
        `;
    });
    
    suggestionsHtml += '</ul>';
    container.innerHTML = suggestionsHtml;
    
    // Add event listeners for the suggestion buttons
    const addButtons = container.querySelectorAll('.add-suggestion-btn');
    addButtons.forEach(button => {
        button.addEventListener('click', handleAddSuggestion);
    });
}

// Function to handle adding a suggested exercise
function handleAddSuggestion(event) {
    const suggestionItem = event.target.closest('.accessory-suggestion-item');
    if (!suggestionItem) return;
    
    const exerciseId = suggestionItem.dataset.exerciseId;
    if (!exerciseId) return;
    
    // Get the day cell
    const { selectedElement } = getSelectionState ? getSelectionState() : { selectedElement: null };
    if (!selectedElement || !selectedElement.classList.contains('day-cell')) return;
    
    try {
        // This could call a function in the workout module to add the exercise to the day
        // For now, we'll just show a toast
        showToast(`Adding exercise ${exerciseId} to the selected day`, 'info');
        
        // Here you would normally call a function like:
        // addExerciseToDay(selectedElement, exerciseId);
        
        // Temp placeholder until implementation
        console.log('[Inspector] Adding exercise ID:', exerciseId, 'to day:', selectedElement);
    } catch (error) {
        console.error('[Inspector] Error adding suggested exercise:', error);
        showToast(`Error adding exercise: ${error.message}`, 'error');
    }
}

// Modify the existing updateInspectorForSelection function 
export function updateInspectorForSelection() {
    try {
        // Safely call clearInspectorFocusMessage
        if (typeof inspectorFocusTimeout !== 'undefined') {
            clearTimeout(inspectorFocusTimeout);
        }
        
        const detailsTabContent = document.getElementById('details');
        if (!detailsTabContent) return;

        const selectionState = getSelectionState ? getSelectionState() : 
            { selectedElement: null, selectedElements: new Set(), multiSelectActive: false };

        const { selectedElement, selectedElements, multiSelectActive } = selectionState;

        if (multiSelectActive && selectedElements && selectedElements.size > 0) {
            openMultiSelectInspector();
            return;
        }

        if (!selectedElement) {
            if (inspectorTitle) inspectorTitle.textContent = 'Inspector';
            
            setTabVisibility(['library', 'details', 'assist', 'settings']);
            
            detailsTabContent.innerHTML = '<p>Select an item to see details.</p>';
            
            updateInspectorLoadGauges({ selectedElement: null });
            return;
        }

        if (!inspectorPanel.classList.contains('is-visible')) {
            openInspector(selectedElement);
        }
        
        // Update ForgeAssist context - safely check if function exists
        const forgeAssist = window.ForgeAssist || ForgeAssist || null;
        if (forgeAssist && typeof forgeAssist.updateContext === 'function') {
            try {
                forgeAssist.updateContext(selectedElement, selectedElements);
            } catch (e) {
                console.warn('[Inspector] Error updating ForgeAssist context:', e);
            }
        }
        
        // Update the tabs with new content
        if (typeof updateForgeAssistTab === 'function') {
            updateForgeAssistTab();
        }
        
        if (typeof updateAdaptiveTab === 'function') {
            try {
                updateAdaptiveTab();
            } catch (e) {
                console.warn('[Inspector] Error updating Adaptive tab:', e);
            }
        }
        
        if (typeof updateAnalyticsTab === 'function') {
            try {
                updateAnalyticsTab();
            } catch (e) {
                console.warn('[Inspector] Error updating Analytics tab:', e);
            }
        }

        // Update content based on selected element type
        if (selectedElement.classList.contains('session-placeholder-card')) {
            if (inspectorTitle) inspectorTitle.textContent = 'Placeholder Details';
            const sessionType = selectedElement.dataset.sessionType || 'Placeholder';
            const targetMetric = selectedElement.dataset.targetMetric || 'N/A';
            const cell = selectedElement.closest('.day-cell');
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
        } else if (selectedElement.classList.contains('workout-card')) {
            // Use the dedicated function instead of implementing card handling here
            updateInspectorForCard(selectedElement);
        } else if (selectedElement.classList.contains('day-cell')) {
            const week = selectedElement.dataset.week || '?';
            const day = selectedElement.dataset.day || '?';
            if (inspectorTitle) inspectorTitle.textContent = `Day: Week ${week}, ${day}`;
            
            // Get any cards inside this day
            const cards = selectedElement.querySelectorAll('.workout-card');
            const cardCount = cards.length;
            
            // Calculate total day load
            let totalDayLoad = 0;
            let exerciseNames = [];
            
            cards.forEach(card => {
                // Add to total load if present
                const cardLoad = parseInt(card.dataset.load || '0', 10);
                if (!isNaN(cardLoad)) totalDayLoad += cardLoad;
                
                // Extract exercise name
                const exerciseName = card.querySelector('.exercise-name')?.textContent || 'Exercise';
                exerciseNames.push(exerciseName);
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
        } else if (selectedElement.classList.contains('phase-bar')) {
            updateInspectorPhaseDetails(selectedElement);
        } else {
            detailsTabContent.innerHTML = '<p>Select an item on the canvas to see details.</p>';
            if (inspectorTitle) inspectorTitle.textContent = 'Inspector';
        }

        // Safely call renderAssistTabContent function
        if (typeof renderAssistTabContent === 'function') {
            renderAssistTabContent();
        }
    } catch (error) {
        console.error('[Inspector] Error in updateInspectorForSelection:', error);
        // Attempt to show some basic content if an error occurs
        try {
            const detailsTab = document.getElementById('details');
            if (detailsTab) {
                detailsTab.innerHTML = '<p>An error occurred while updating inspector content. Please try again.</p>';
            }
            if (inspectorTitle) {
                inspectorTitle.textContent = 'Inspector';
            }
        } catch (e) {
            // Silent fail if even recovery fails
        }
    }
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

        const detailsElement = selectedElement.querySelector('.exercise-details') || selectedElement.querySelector('.details');
        if (detailsElement) {
            detailsElement.textContent = detailsString || 'No details';
        }

        // Update data attributes
        selectedElement.dataset.sets = setsInput.value;
        selectedElement.dataset.reps = repsInput.value;
        selectedElement.dataset.loadType = loadTypeSelect.value;
        selectedElement.dataset.loadValue = loadValueInput.value;
        selectedElement.dataset.rest = restInput.value;
        selectedElement.dataset.notes = notesInput.value;
        selectedElement.dataset.exerciseName = nameInput.value;

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

        // Refresh ForgeAssist context to reflect the updated exercise details
        try {
            const forgeAssist = window.ForgeAssist || ForgeAssist || null;
            if (forgeAssist) {
                // Clear context first
                if (typeof forgeAssist.clearContext === 'function') {
                    forgeAssist.clearContext();
                }
                
                // Then update with the current selection
                if (typeof forgeAssist.updateContext === 'function') {
                    const selectionState = getSelectionState ? getSelectionState() : 
                        { selectedElement: null, selectedElements: new Set() };
                    forgeAssist.updateContext(selectionState.selectedElement, selectionState.selectedElements);
                }
                
                // Update the ForgeAssist tab content
                if (typeof updateForgeAssistTab === 'function') {
                    updateForgeAssistTab();
                }
            }
        } catch (e) {
            console.warn('[Inspector] Error refreshing ForgeAssist context:', e);
        }

        // Trigger analytics update and save state if the functions exist
        if (typeof triggerAnalyticsUpdate === 'function') {
            triggerAnalyticsUpdate();
        }
        
        if (typeof triggerSaveState === 'function') {
            triggerSaveState();
        }

        showToast('Exercise details updated', 'success');
    }
}

// Add missing showInspectorFocusMessage function
let inspectorFocusTimeout; // Global variable to track timeout

export function showInspectorFocusMessage(message, duration = 5000) {
    // Clear any existing timeout
    if (typeof inspectorFocusTimeout !== 'undefined') {
    clearTimeout(inspectorFocusTimeout);
    }
    
    // Get or create the focus message area
    let focusArea = document.getElementById('inspector-focus-message');
    
    if (!focusArea && inspectorPanel) {
        focusArea = document.createElement('div');
        focusArea.id = 'inspector-focus-message';
        focusArea.style.display = 'none';
        inspectorPanel.appendChild(focusArea);
    }
    
    if (focusArea) {
        focusArea.textContent = message;
        focusArea.style.display = 'block';
        
        // Auto-hide after duration if > 0
        if (duration > 0) {
        inspectorFocusTimeout = setTimeout(() => {
            focusArea.style.display = 'none';
            focusArea.textContent = '';
        }, duration);
        }
    }
}

export function clearInspectorFocusMessage() {
    // Check if inspectorFocusTimeout is defined before clearing it
    if (typeof inspectorFocusTimeout !== 'undefined') {
     clearTimeout(inspectorFocusTimeout);
    }
    
     const focusArea = document.getElementById('inspector-focus-message');
     if (focusArea) {
         focusArea.style.display = 'none';
         focusArea.textContent = '';
     }
    // If element doesn't exist, create it for future use
    else if (inspectorPanel) {
        const newFocusArea = document.createElement('div');
        newFocusArea.id = 'inspector-focus-message';
        newFocusArea.style.display = 'none';
        inspectorPanel.appendChild(newFocusArea);
    }
}

// Media support functions for the Inspector Panel
// Function to initialize media functionality in Inspector Panel
export function initMediaSupport() {
    // Listen for drag and drop events on the inspector panel
    const inspectorPanel = document.getElementById('inspector-panel');
    if (!inspectorPanel) return;
    
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        inspectorPanel.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    // Highlight drop area when dragging over
    ['dragenter', 'dragover'].forEach(eventName => {
        inspectorPanel.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        inspectorPanel.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        inspectorPanel.classList.add('drag-highlight');
    }
    
    function unhighlight() {
        inspectorPanel.classList.remove('drag-highlight');
    }
    
    // Handle drop event
    inspectorPanel.addEventListener('drop', handleDrop, false);
    
    // Initialize media input UI in Details tab
    setupMediaInputUI();
}

// Function to handle dropped media links
function handleDrop(e) {
    const { selectedElement } = getSelectionState ? getSelectionState() : { selectedElement: null };
    if (!selectedElement) {
        showToast('Select an exercise first before dropping media', 'warning');
        return;
    }
    
    if (!selectedElement.classList.contains('workout-card')) {
        showToast('You can only add media to exercises', 'warning');
        return;
    }
    
    const dt = e.dataTransfer;
    const text = dt.getData('text');
    
    if (text) {
        // Check if it's a valid URL
        try {
            const url = new URL(text);
            processMediaUrl(url.href, selectedElement);
        } catch (error) {
            showToast('Invalid URL: Please drop a valid video link', 'error');
            console.error('[Inspector] Invalid URL dropped:', error);
        }
    }
}

// Function to process media URLs (YouTube, Loom, etc.)
function processMediaUrl(url, cardElement) {
    // Extract video ID and platform
    let videoId = null;
    let platform = null;
    
    // YouTube URL patterns
    const youtubePatterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/i,
        /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/i,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/i
    ];
    
    // Loom URL patterns
    const loomPatterns = [
        /(?:https?:\/\/)?(?:www\.)?loom\.com\/share\/([a-zA-Z0-9]+)/i
    ];
    
    // Check YouTube patterns
    for (const pattern of youtubePatterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            videoId = match[1];
            platform = 'youtube';
            break;
        }
    }
    
    // Check Loom patterns if not YouTube
    if (!videoId) {
        for (const pattern of loomPatterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                videoId = match[1];
                platform = 'loom';
                break;
            }
        }
    }
    
    if (!videoId || !platform) {
        showToast('Unsupported URL: Please use YouTube or Loom links', 'error');
        return;
    }
    
    // Save the media info to the exercise card
    saveMediaToExercise(cardElement, { url, videoId, platform });
    
    // Update the inspector to show the media
    updateMediaPreview(cardElement);
    
    // Show success message
    showToast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} video added to exercise`, 'success');
}

// Function to save media info to an exercise card
function saveMediaToExercise(cardElement, mediaInfo) {
    if (!cardElement) return;
    
    // Store media info as data attributes
    cardElement.dataset.mediaUrl = mediaInfo.url;
    cardElement.dataset.mediaVideoId = mediaInfo.videoId;
    cardElement.dataset.mediaPlatform = mediaInfo.platform;
    
    // Add a visual indicator to the card
    const cardFront = cardElement.querySelector('.card-front');
    if (cardFront) {
        // Check if indicator already exists
        let indicator = cardFront.querySelector('.media-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'media-indicator';
            indicator.innerHTML = '<i class="fas fa-video"></i>';
            indicator.setAttribute('title', 'Media attached');
            cardFront.appendChild(indicator);
        }
    }
    
    // Trigger save state to persist changes
    if (dependencies && dependencies.triggerSaveState) {
        dependencies.triggerSaveState();
    }
}

// Function to update the media preview in the Details tab
function updateMediaPreview(cardElement) {
    if (!cardElement) return;
    
    const detailsTab = document.getElementById('details');
    if (!detailsTab) return;
    
    // Check if the card has media info
    const url = cardElement.dataset.mediaUrl;
    const videoId = cardElement.dataset.mediaVideoId;
    const platform = cardElement.dataset.mediaPlatform;
    
    if (!url || !videoId || !platform) {
        // No media, remove preview if it exists
        const existingPreview = detailsTab.querySelector('.media-preview-container');
        if (existingPreview) {
            existingPreview.remove();
        }
        return;
    }
    
    // Create media preview container if it doesn't exist
    let previewContainer = detailsTab.querySelector('.media-preview-container');
    if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.className = 'media-preview-container';
        
        // Add after exercise details or at the end of the tab
        const detailsForm = detailsTab.querySelector('.exercise-details-form');
        if (detailsForm) {
            detailsForm.after(previewContainer);
        } else {
            detailsTab.appendChild(previewContainer);
        }
    }
    
    // Create the appropriate embed based on platform
    let embedHtml = '';
    
    if (platform === 'youtube') {
        embedHtml = `
            <iframe 
                src="https://www.youtube.com/embed/${videoId}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
    } else if (platform === 'loom') {
        embedHtml = `
            <iframe 
                src="https://www.loom.com/embed/${videoId}" 
                frameborder="0" 
                webkitallowfullscreen mozallowfullscreen allowfullscreen>
            </iframe>
        `;
    }
    
    if (embedHtml) {
        previewContainer.innerHTML = `
            <div class="media-preview-header">
                <h4>Exercise Video</h4>
                <button class="remove-media-btn" title="Remove video">×</button>
            </div>
            ${embedHtml}
        `;
        
        // Add event listener to remove button
        const removeBtn = previewContainer.querySelector('.remove-media-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => removeMediaFromExercise(cardElement));
        }
    }
}

// Function to remove media from an exercise
function removeMediaFromExercise(cardElement) {
    if (!cardElement) return;
    
    // Remove data attributes
    delete cardElement.dataset.mediaUrl;
    delete cardElement.dataset.mediaVideoId;
    delete cardElement.dataset.mediaPlatform;
    
    // Remove visual indicator
    const indicator = cardElement.querySelector('.media-indicator');
    if (indicator) {
        indicator.remove();
    }
    
    // Update the preview (will remove it)
    updateMediaPreview(cardElement);
    
    // Show confirmation
    showToast('Media removed from exercise', 'info');
    
    // Trigger save state to persist changes
    if (dependencies && dependencies.triggerSaveState) {
        dependencies.triggerSaveState();
    }
}

// Function to set up media input UI in Details tab
function setupMediaInputUI() {
    // Will be called when the Details tab is updated for workout cards
    document.addEventListener('inspector:detailsTabUpdated', event => {
        const { element } = event.detail || {};
        if (!element || !element.classList.contains('workout-card')) return;
        
        const detailsTab = document.getElementById('details');
        if (!detailsTab) return;
        
        // Check if media input group already exists
        if (detailsTab.querySelector('.media-input-group')) return;
        
        // Create the media input group
        const mediaInputGroup = document.createElement('div');
        mediaInputGroup.className = 'media-input-group';
        mediaInputGroup.innerHTML = `
            <input type="text" id="media-url-input" placeholder="Paste YouTube or Loom URL...">
            <button id="add-media-btn">Add</button>
        `;
        
        // Add after exercise details or at the end of the tab
        const detailsForm = detailsTab.querySelector('.exercise-details-form');
        if (detailsForm) {
            detailsForm.after(mediaInputGroup);
        } else {
            detailsTab.appendChild(mediaInputGroup);
        }
        
        // Add event listener to the button
        const addBtn = mediaInputGroup.querySelector('#add-media-btn');
        const urlInput = mediaInputGroup.querySelector('#media-url-input');
        
        if (addBtn && urlInput) {
            addBtn.addEventListener('click', () => {
                const url = urlInput.value.trim();
                if (!url) {
                    showToast('Please enter a video URL', 'warning');
                    return;
                }
                
                processMediaUrl(url, element);
                urlInput.value = ''; // Clear the input
            });
            
            // Also handle Enter key
            urlInput.addEventListener('keydown', event => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    addBtn.click();
                }
            });
        }
    });
}

// Update the function that handles card details to include media preview
function updateInspectorForCard(card) {
    if (!card) return;
    
    // First, check if it's a workout card
    if (!card.classList.contains('workout-card')) return;
    
    console.log("[Inspector] Updating inspector for card:", card.id);
    
    // Get the exercise name or card ID for the title
    const exerciseName = card.querySelector('.exercise-name')?.textContent || 'Exercise';
    
    // Get card details for the form
    const cardDetails = getStructuredDetails(card);
    
    // Set the inspector title with additional context for GDAP or model-driven exercises
    if (inspectorTitle) {
        let titlePrefix = '';
        if (cardDetails.isGDAP) {
            titlePrefix = '[GDAP] ';
        } else if (cardDetails.isModelDriven) {
            titlePrefix = '[Model] ';
        }
        inspectorTitle.textContent = `Edit: ${titlePrefix}${cardDetails.name}`;
    }
    
    // Show relevant tabs
    setTabVisibility(['library', 'details', 'assist', 'adaptive', 'analytics', 'settings']);
    activateTab('details');
    
    // Clear previous details
    const detailsTab = document.getElementById('details');
    if (!detailsTab) return;
    
    // Highlight GDAP or model status if applicable
    let statusHtml = '';
    if (cardDetails.isGDAP) {
        statusHtml = `<div style="margin-bottom: 10px; padding: 8px; background-color: rgba(255, 112, 59, 0.1); border-left: 3px solid var(--accent-color); font-size: 0.9rem;">
            <strong>Goal-Driven Exercise:</strong> This exercise is part of your goal-driven program.
        </div>`;
    } else if (cardDetails.isModelDriven) {
        const modelType = card.dataset.modelType || 'Custom';
        statusHtml = `<div style="margin-bottom: 10px; padding: 8px; background-color: rgba(58, 123, 213, 0.1); border-left: 3px solid #3a7bd5; font-size: 0.9rem;">
            <strong>${modelType} Model Exercise:</strong> This exercise is generated by a periodization model.
        </div>`;
    }
    
    // Get day information
    const parentCell = card.closest('.day-cell');
    const week = parentCell?.dataset.week || '?';
    const day = parentCell?.dataset.day || '?';
    const cardLoad = parseInt(card.dataset.load || '0', 10);
    
    // Create form
    detailsTab.innerHTML = `
        ${statusHtml}
        <h4>${cardDetails.name} <small>(Week ${week}, ${day})</small></h4>
        <div class="form-row">
            <div class="form-group">
                <label for="inspector-sets">Sets</label>
                <input type="text" id="inspector-sets" value="${cardDetails.sets}" placeholder="Sets number">
            </div>
            <div class="form-group">
                <label for="inspector-reps">Reps</label>
                <input type="text" id="inspector-reps" value="${cardDetails.reps}" placeholder="Reps (e.g. 8 or 5-8)">
            </div>
        </div>
        <div class="form-row">
            <div class="form-group" style="flex-basis: calc(50% - 1rem); flex-grow: 1;">
                <label for="inspector-load-type">Load Type</label>
                <select id="inspector-load-type">
                    <option value="rpe" ${cardDetails.loadType === 'rpe' ? 'selected' : ''}>RPE</option>
                    <option value="%" ${cardDetails.loadType === '%' ? 'selected' : ''}>Percentage (%)</option>
                    <option value="weight" ${cardDetails.loadType === 'weight' ? 'selected' : ''}>Weight (kg)</option>
                    <option value="text" ${cardDetails.loadType === 'text' ? 'selected' : ''}>Text</option>
                </select>
            </div>
            <div class="form-group" style="flex-basis: calc(50% - 1rem); flex-grow: 1;">
                <label for="inspector-load-value">Load Value</label>
                <input type="text" id="inspector-load-value" value="${cardDetails.loadValue}" placeholder="e.g., 8 or 75">
                <div id="load-explanation" style="font-size: 0.75rem; color: var(--text-color); margin-top: 4px; min-height: 1em;"></div>
            </div>
            <div class="form-group" style="flex-basis: 100%;">
                <label for="inspector-rest">Rest</label>
                <input type="text" id="inspector-rest" value="${cardDetails.rest}" placeholder="e.g., 90s or 2m">
            </div>
        </div>
        <div class="form-group full-width">
            <label for="inspector-notes">Notes</label>
            <textarea id="inspector-notes" rows="3">${cardDetails.notes}</textarea>
        </div>
        <hr class="detail-separator">
        <button id="save-card-details" class="cta-button primary-cta">Save Details</button>
        <button id="delete-card" class="cta-button secondary-cta" style="margin-top: 10px; background-color: #555;">Delete Card</button>
    `;
    
    // Add event listeners - clean up old ones and add fresh ones for this card
    const saveBtn = detailsTab.querySelector('#save-card-details');
    const deleteBtn = detailsTab.querySelector('#delete-card');
    const loadInput = detailsTab.querySelector('#inspector-load-value');
    const loadTypeSelect = detailsTab.querySelector('#inspector-load-type');
    
    if (saveBtn) {
        // Use a specific function to target this card explicitly
        saveBtn.addEventListener('click', () => saveWorkoutCardDetails(card));
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteSelectedWorkoutCard(card));
    }
    
    if (loadInput) {
        loadInput.addEventListener('input', () => {
            const loadValue = parseInt(loadInput.value, 10);
            updateLoadValueExplanation(loadValue, detailsTab.querySelector('#load-explanation'));
        });
        
        // Initial update
        const loadValue = parseInt(loadInput.value, 10);
        updateLoadValueExplanation(loadValue, detailsTab.querySelector('#load-explanation'));
    }
    
    if (loadTypeSelect) {
        loadTypeSelect.addEventListener('change', () => {
            // Refresh load explanation when type changes
            const loadValue = parseInt(loadInput.value, 10);
            updateLoadValueExplanation(loadValue, detailsTab.querySelector('#load-explanation'));
        });
    }
    
    // Update the media preview if needed
    updateMediaPreview(card);
    
    // Dispatch event for media input UI
    document.dispatchEvent(new CustomEvent('inspector:detailsTabUpdated', { 
        detail: { element: card }
    }));
    
    // Also update load gauges
    updateInspectorLoadGauges({ selectedElement: card });
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

// Function to update the Adaptive tab based on selection
export function updateAdaptiveTab() {
    const adaptiveTab = document.getElementById('adaptive');
    if (!adaptiveTab) return;
    
    // Get selection context
    const { selectedElement } = getSelectionState ? getSelectionState() : { selectedElement: null };
    
    // Show appropriate sub-tab based on selection type
    const adaptiveExerciseTab = document.getElementById('adaptive-exercise');
    const adaptiveDayTab = document.getElementById('adaptive-day');
    const adaptivePhaseTab = document.getElementById('adaptive-phase');
    
    if (!selectedElement) {
        // Show generic content if nothing is selected
        adaptiveExerciseTab.innerHTML = '<p>Select an item to see adaptation options.</p>';
        adaptiveDayTab.innerHTML = '<p>Select a day to see day-level adaptations.</p>';
        adaptivePhaseTab.innerHTML = '<p>Select a phase to see phase-level adaptations.</p>';
        return;
    }
    
    // Determine which sub-tab to activate based on selection
    let activeSubTab = 'adaptive-exercise'; // Default
    
    if (selectedElement.classList.contains('workout-card')) {
        activeSubTab = 'adaptive-exercise';
        updateAdaptiveExerciseContent(selectedElement, adaptiveExerciseTab);
    } else if (selectedElement.classList.contains('day-cell')) {
        activeSubTab = 'adaptive-day';
        updateAdaptiveDayContent(selectedElement, adaptiveDayTab);
    } else if (selectedElement.classList.contains('phase-bar')) {
        activeSubTab = 'adaptive-phase';
        updateAdaptivePhaseContent(selectedElement, adaptivePhaseTab);
    }
    
    // Activate the appropriate sub-tab
    activateAdaptiveSubTab(activeSubTab);
}

// Function to activate the correct adaptive sub-tab
function activateAdaptiveSubTab(targetTabId) {
    const tabButtons = document.querySelectorAll('.adaptive-tab');
    const tabContents = document.querySelectorAll('.adaptive-tab-content');
    
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === targetTabId);
    });
    
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === targetTabId);
    });
}

// Function to update exercise-level adaptations
function updateAdaptiveExerciseContent(exerciseCard, container) {
    if (!exerciseCard || !container) return;
    
    const exerciseName = exerciseCard.querySelector('.exercise-name')?.textContent || 'Exercise';
    const cardDetails = getStructuredDetails(exerciseCard);
    
    container.innerHTML = `
        <h4>Exercise Adaptations</h4>
        <p class="adaptive-subtitle">Modify "${exerciseName}" based on athlete status</p>
        
        <div class="adaptive-options">
            <div class="adaptive-option">
                <h5>Athlete Readiness</h5>
                <div class="readiness-slider-container">
                    <div class="readiness-levels">
                        <span class="readiness-low">Low</span>
                        <span class="readiness-moderate">Moderate</span>
                        <span class="readiness-high">High</span>
                    </div>
                    <input type="range" id="readiness-slider" min="1" max="10" value="7" class="adaptive-slider">
                </div>
                <div class="adaptive-actions">
                    <button id="apply-readiness" class="cta-button secondary-cta">Apply Adjustments</button>
                </div>
                <div id="readiness-recommendations" class="adaptive-recommendations">
                    <h6>Recommended Adjustments</h6>
                    <ul>
                        <li>Decrease load to <strong>${Math.round(cardDetails.load * 0.9)}%</strong> (-10%)</li>
                        <li>Maintain current set count <strong>(${cardDetails.sets})</strong></li>
                        <li>Increase rest to <strong>${Math.min(180, cardDetails.rest + 30)}s</strong> (+30s)</li>
                    </ul>
                </div>
            </div>
            
            <div class="adaptive-option">
                <h5>Velocity-Based Adaptation</h5>
                <p>Adjust based on velocity loss during sets</p>
                <div class="adaptive-actions">
                    <button id="start-vbt-adjustment" class="cta-button secondary-cta">Start VBT Mode</button>
                </div>
            </div>
            
            <div class="adaptive-option">
                <h5>Exercise Substitution</h5>
                <p>Find alternatives for ${exerciseName}</p>
                <div class="adaptive-actions">
                    <button id="suggest-alternatives" class="cta-button secondary-cta">Suggest Alternatives</button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners for the buttons
    const readinessSlider = container.querySelector('#readiness-slider');
    const applyReadinessBtn = container.querySelector('#apply-readiness');
    const startVbtBtn = container.querySelector('#start-vbt-adjustment');
    const suggestAltBtn = container.querySelector('#suggest-alternatives');
    
    if (readinessSlider) {
        readinessSlider.addEventListener('input', updateReadinessRecommendations);
    }
    
    if (applyReadinessBtn) {
        applyReadinessBtn.addEventListener('click', () => applyReadinessAdjustments(exerciseCard));
    }
    
    if (startVbtBtn) {
        startVbtBtn.addEventListener('click', () => startVbtMode(exerciseCard));
    }
    
    if (suggestAltBtn) {
        suggestAltBtn.addEventListener('click', () => suggestExerciseAlternatives(exerciseCard));
    }
}

// Function to update day-level adaptations
function updateAdaptiveDayContent(dayCell, container) {
    if (!dayCell || !container) return;
    
    // Get the day and week from the day cell
    const dayIndex = Array.from(dayCell.parentNode.children).indexOf(dayCell) - 1; // -1 for the week label
    const weekRow = dayCell.closest('.week-row');
    const weekIndex = Array.from(weekRow.parentNode.children).indexOf(weekRow);
    
    const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIndex];
    const weekNumber = weekIndex + 1;
    
    container.innerHTML = `
        <h4>Day Adaptations</h4>
        <p class="adaptive-subtitle">Modify ${dayName} of Week ${weekNumber}</p>
        
        <div class="adaptive-options">
            <div class="adaptive-option">
                <h5>Day Focus</h5>
                <p>Current focus: <strong id="current-focus">Mixed</strong></p>
                <div class="adaptive-actions">
                    <button id="suggest-focus" class="cta-button secondary-cta">Suggest Focus</button>
                    <button id="optimize-day" class="cta-button secondary-cta">Optimize Structure</button>
                </div>
            </div>
            
            <div class="adaptive-option">
                <h5>Athlete Status</h5>
                <div class="form-group">
                    <label for="athlete-status">Athlete reported:</label>
                    <select id="athlete-status" class="adaptive-select">
                        <option value="normal">Normal - Proceed as planned</option>
                        <option value="fatigued">Fatigued - Reduce intensity</option>
                        <option value="sore">Sore - Modify exercises</option>
                        <option value="missed">Missed - Reschedule session</option>
                    </select>
                </div>
                <div class="adaptive-actions">
                    <button id="apply-athlete-status" class="cta-button secondary-cta">Apply Adjustments</button>
                </div>
            </div>
            
            <div class="adaptive-option">
                <h5>Load Distribution</h5>
                <p>Estimated day load: <strong>${calculateDayLoad(dayCell)}</strong></p>
                <div class="adaptive-actions">
                    <button id="balance-load" class="cta-button secondary-cta">Balance Week Load</button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners for the buttons
    const suggestFocusBtn = container.querySelector('#suggest-focus');
    const optimizeDayBtn = container.querySelector('#optimize-day');
    const applyStatusBtn = container.querySelector('#apply-athlete-status');
    const balanceLoadBtn = container.querySelector('#balance-load');
    
    if (suggestFocusBtn) {
        suggestFocusBtn.addEventListener('click', () => suggestDayFocus(dayCell));
    }
    
    if (optimizeDayBtn) {
        optimizeDayBtn.addEventListener('click', () => optimizeDayStructure(dayCell));
    }
    
    if (applyStatusBtn) {
        applyStatusBtn.addEventListener('click', () => applyAthleteStatus(dayCell));
    }
    
    if (balanceLoadBtn) {
        balanceLoadBtn.addEventListener('click', () => balanceWeekLoad(dayCell));
    }
    
    // Determine current focus if possible
    updateCurrentFocus(dayCell);
}

// Function to update phase-level adaptations
function updateAdaptivePhaseContent(phaseBar, container) {
    if (!phaseBar || !container) return;
    
    // Get the phase name
    const phaseName = phaseBar.querySelector('.phase-bar-label').textContent;
    
    // Calculate phase metrics
    const { startWeek, endWeek } = getPhaseWeekRange(phaseBar, phaseBar.closest('.phase-ribbon'), workCanvas);
    const phaseDurationWeeks = (endWeek - startWeek + 1);
    const currentLoads = getCurrentBlockLoads(workCanvas);
    
    container.innerHTML = `
        <h4>Phase Adaptations</h4>
        <p class="adaptive-subtitle">Modify "${phaseName}" phase (${phaseDurationWeeks} weeks)</p>
        
        <div class="adaptive-options">
            <div class="adaptive-option">
                <h5>Phase Parameters</h5>
                <div class="phase-params">
                    <div class="param-item">
                        <label>Volume</label>
                        <div class="param-controls">
                            <button class="param-btn decrease" data-param="volume">-</button>
                            <span class="param-value">Medium</span>
                            <button class="param-btn increase" data-param="volume">+</button>
                        </div>
                    </div>
                    <div class="param-item">
                        <label>Intensity</label>
                        <div class="param-controls">
                            <button class="param-btn decrease" data-param="intensity">-</button>
                            <span class="param-value">Medium</span>
                            <button class="param-btn increase" data-param="intensity">+</button>
                        </div>
                    </div>
                    <div class="param-item">
                        <label>Frequency</label>
                        <div class="param-controls">
                            <button class="param-btn decrease" data-param="frequency">-</button>
                            <span class="param-value">3-4x/week</span>
                            <button class="param-btn increase" data-param="frequency">+</button>
                        </div>
                    </div>
                </div>
                <div class="adaptive-actions">
                    <button id="apply-phase-params" class="cta-button secondary-cta">Apply Parameters</button>
                </div>
            </div>
            
            <div class="adaptive-option">
                <h5>Load Profile</h5>
                <div class="load-pattern-options">
                    <button class="load-pattern-btn" data-pattern="linear">Linear</button>
                    <button class="load-pattern-btn" data-pattern="step">Step</button>
                    <button class="load-pattern-btn" data-pattern="wave">Wave</button>
                    <button class="load-pattern-btn" data-pattern="undulating">Undulating</button>
                </div>
                <div class="adaptive-actions">
                    <button id="apply-load-pattern" class="cta-button secondary-cta">Apply Pattern</button>
                </div>
            </div>
            
            <div class="adaptive-option">
                <h5>Phase Regeneration</h5>
                <p>Completely rebuild phase content based on goals</p>
                <div class="adaptive-actions">
                    <button id="regenerate-phase" class="cta-button secondary-cta">Regenerate Phase</button>
                </div>
            </div>
        </div>
    `;
    
    // Add event listeners
    const paramButtons = container.querySelectorAll('.param-btn');
    const applyParamsBtn = container.querySelector('#apply-phase-params');
    const patternButtons = container.querySelectorAll('.load-pattern-btn');
    const applyPatternBtn = container.querySelector('#apply-load-pattern');
    const regenerateBtn = container.querySelector('#regenerate-phase');
    
    // Selected pattern tracking
    let selectedPattern = null;
    
    if (paramButtons) {
        paramButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const param = btn.dataset.param;
                const isIncrease = btn.classList.contains('increase');
                updatePhaseParameter(param, isIncrease, btn);
            });
        });
    }
    
    if (patternButtons) {
        patternButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                patternButtons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedPattern = btn.dataset.pattern;
            });
        });
    }
    
    if (applyParamsBtn) {
        applyParamsBtn.addEventListener('click', () => applyPhaseParameters(phaseBar));
    }
    
    if (applyPatternBtn) {
        applyPatternBtn.addEventListener('click', () => {
            if (selectedPattern) {
                applyLoadPattern(phaseBar, selectedPattern);
            } else {
                showToast('Please select a load pattern first', 'warning');
            }
        });
    }
    
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', () => regeneratePhase(phaseBar));
    }
}

// Helper functions for adaptive features

// Update readiness recommendations based on slider value
function updateReadinessRecommendations() {
    const slider = document.getElementById('readiness-slider');
    const recommendations = document.getElementById('readiness-recommendations');
    if (!slider || !recommendations) return;
    
    const readinessValue = parseInt(slider.value, 10);
    const { selectedElement } = getSelectionState ? getSelectionState() : { selectedElement: null };
    if (!selectedElement) return;
    
    const cardDetails = getStructuredDetails(selectedElement);
    if (!cardDetails) return;
    
    let loadAdjustment, setsAdjustment, restAdjustment;
    
    // Determine adjustments based on readiness value
    if (readinessValue <= 3) {
        // Low readiness
        loadAdjustment = { percent: -20, absolute: Math.round(cardDetails.load * 0.8) };
        setsAdjustment = { change: -1, absolute: Math.max(1, cardDetails.sets - 1) };
        restAdjustment = { change: 45, absolute: cardDetails.rest + 45 };
    } else if (readinessValue <= 6) {
        // Moderate readiness
        loadAdjustment = { percent: -10, absolute: Math.round(cardDetails.load * 0.9) };
        setsAdjustment = { change: 0, absolute: cardDetails.sets };
        restAdjustment = { change: 30, absolute: cardDetails.rest + 30 };
    } else {
        // High readiness
        loadAdjustment = { percent: 5, absolute: Math.round(cardDetails.load * 1.05) };
        setsAdjustment = { change: 1, absolute: cardDetails.sets + 1 };
        restAdjustment = { change: 0, absolute: cardDetails.rest };
    }
    
    // Update the recommendations UI
    recommendations.innerHTML = `
        <h6>Recommended Adjustments</h6>
        <ul>
            <li>
                ${loadAdjustment.percent >= 0 ? 'Increase' : 'Decrease'} load to 
                <strong>${loadAdjustment.absolute}%</strong> 
                (${loadAdjustment.percent > 0 ? '+' : ''}${loadAdjustment.percent}%)
            </li>
            <li>
                ${setsAdjustment.change > 0 ? 'Increase' : setsAdjustment.change < 0 ? 'Decrease' : 'Maintain'} sets to 
                <strong>${setsAdjustment.absolute}</strong>
                ${setsAdjustment.change !== 0 ? ` (${setsAdjustment.change > 0 ? '+' : ''}${setsAdjustment.change})` : ''}
            </li>
            <li>
                ${restAdjustment.change > 0 ? 'Increase' : restAdjustment.change < 0 ? 'Decrease' : 'Maintain'} rest to 
                <strong>${restAdjustment.absolute}s</strong>
                ${restAdjustment.change !== 0 ? ` (${restAdjustment.change > 0 ? '+' : ''}${restAdjustment.change}s)` : ''}
            </li>
        </ul>
    `;
}

// Apply readiness-based adjustments to exercise
function applyReadinessAdjustments(exerciseCard) {
    const slider = document.getElementById('readiness-slider');
    if (!slider || !exerciseCard) return;
    
    const readinessValue = parseInt(slider.value, 10);
    const cardDetails = getStructuredDetails(exerciseCard);
    if (!cardDetails) return;
    
    // Apply adjustments to the card fields in the Details tab
    const setsInput = document.getElementById('exercise-sets');
    const loadInput = document.getElementById('exercise-load');
    const restInput = document.getElementById('exercise-rest');
    
    if (readinessValue <= 3) {
        // Low readiness
        if (loadInput) loadInput.value = Math.round(cardDetails.load * 0.8);
        if (setsInput) setsInput.value = Math.max(1, cardDetails.sets - 1);
        if (restInput) restInput.value = cardDetails.rest + 45;
    } else if (readinessValue <= 6) {
        // Moderate readiness
        if (loadInput) loadInput.value = Math.round(cardDetails.load * 0.9);
        if (setsInput) setsInput.value = cardDetails.sets;
        if (restInput) restInput.value = cardDetails.rest + 30;
    } else {
        // High readiness
        if (loadInput) loadInput.value = Math.round(cardDetails.load * 1.05);
        if (setsInput) setsInput.value = cardDetails.sets + 1;
        if (restInput) restInput.value = cardDetails.rest;
    }
    
    // Update the load explanation if needed
    if (loadInput) {
        const loadValue = parseInt(loadInput.value, 10);
        const loadExplanation = document.getElementById('load-explanation');
        if (loadExplanation) {
            updateLoadValueExplanation(loadValue, loadExplanation);
        }
    }
    
    // Show toast notification
    showToast('Readiness adjustments applied. Click Save to update the exercise.', 'info');
}

// Placeholder functions for other adaptive features
function startVbtMode(exerciseCard) {
    showToast('VBT Mode not implemented in this version', 'info');
}

function suggestExerciseAlternatives(exerciseCard) {
    showToast('Fetching alternative exercises...', 'info');
    
    // This would normally call ForgeAssist for suggestions
    // Placeholder for now
    setTimeout(() => {
        const exerciseName = exerciseCard.querySelector('.exercise-name')?.textContent || 'this exercise';
        showToast(`Alternatives for ${exerciseName} would appear here`, 'info');
    }, 1000);
}

function updateCurrentFocus(dayCell) {
    // This would analyze cards in the day cell to determine the focus
    const focusElement = document.getElementById('current-focus');
    if (!focusElement) return;
    
    const cards = dayCell.querySelectorAll('.workout-card');
    if (cards.length === 0) {
        focusElement.textContent = 'Empty';
        return;
    }
    
    // Simple placeholder logic - would be more sophisticated in reality
    const cardCount = cards.length;
    let upperCount = 0;
    let lowerCount = 0;
    
    cards.forEach(card => {
        const className = card.className;
        if (className.includes('upper')) upperCount++;
        if (className.includes('lower')) lowerCount++;
    });
    
    if (upperCount > lowerCount && upperCount > cardCount * 0.5) {
        focusElement.textContent = 'Upper Body';
    } else if (lowerCount > upperCount && lowerCount > cardCount * 0.5) {
        focusElement.textContent = 'Lower Body';
    } else if (upperCount + lowerCount < cardCount * 0.5) {
        focusElement.textContent = 'Conditioning';
    } else {
        focusElement.textContent = 'Mixed';
    }
}

// Placeholder implementations for day-level functions
function suggestDayFocus(dayCell) {
    showToast('Analyzing optimal focus for this day...', 'info');
    
    // This would normally call ForgeAssist/AdaptiveScheduler
    setTimeout(() => {
        showToast('Suggestion: This day would work well as a Lower Body focus day', 'info');
    }, 1000);
}

function optimizeDayStructure(dayCell) {
    showToast('Optimizing day structure...', 'info');
    
    // This would normally call ForgeAssist/AdaptiveScheduler
    setTimeout(() => {
        showToast('Day structure optimization would reorganize exercises for optimal sequence', 'info');
    }, 1000);
}

function applyAthleteStatus(dayCell) {
    const statusSelect = document.getElementById('athlete-status');
    if (!statusSelect) return;
    
    const status = statusSelect.value;
    let message = '';
    
    switch (status) {
        case 'fatigued':
            message = 'Applied fatigue adjustments: Reduced intensity across all exercises by 10%';
            break;
        case 'sore':
            message = 'Applied soreness adjustments: Modified exercise selection to reduce joint stress';
            break;
        case 'missed':
            message = 'Created a rescheduling plan for missed session';
            break;
        default:
            message = 'No adjustments needed - proceeding with planned session';
    }
    
    showToast(message, 'info');
}

function balanceWeekLoad(dayCell) {
    showToast('Analyzing week load distribution...', 'info');
    
    // This would normally call ForgeAssist/AdaptiveScheduler
    setTimeout(() => {
        showToast('Load balancing would redistribute exercises across the week for optimal recovery', 'info');
    }, 1000);
}

// Placeholder implementations for phase-level functions
function updatePhaseParameter(param, isIncrease, button) {
    if (!button) return;
    
    const valueSpan = button.parentElement.querySelector('.param-value');
    if (!valueSpan) return;
    
    const currentValue = valueSpan.textContent;
    let newValue = '';
    
    // Placeholder logic for changing parameter values
    if (param === 'volume') {
        if (currentValue === 'Low' && isIncrease) newValue = 'Medium';
        else if (currentValue === 'Medium' && isIncrease) newValue = 'High';
        else if (currentValue === 'Medium' && !isIncrease) newValue = 'Low';
        else if (currentValue === 'High' && !isIncrease) newValue = 'Medium';
        else newValue = currentValue;
    } else if (param === 'intensity') {
        if (currentValue === 'Low' && isIncrease) newValue = 'Medium';
        else if (currentValue === 'Medium' && isIncrease) newValue = 'High';
        else if (currentValue === 'Medium' && !isIncrease) newValue = 'Low';
        else if (currentValue === 'High' && !isIncrease) newValue = 'Medium';
        else newValue = currentValue;
    } else if (param === 'frequency') {
        if (currentValue === '2-3x/week' && isIncrease) newValue = '3-4x/week';
        else if (currentValue === '3-4x/week' && isIncrease) newValue = '4-5x/week';
        else if (currentValue === '3-4x/week' && !isIncrease) newValue = '2-3x/week';
        else if (currentValue === '4-5x/week' && !isIncrease) newValue = '3-4x/week';
        else newValue = currentValue;
    }
    
    if (newValue) {
        valueSpan.textContent = newValue;
    }
}

function applyPhaseParameters(phaseBar) {
    showToast('Applying phase parameters would update all sessions within the phase', 'info');
}

function applyLoadPattern(phaseBar, pattern) {
    showToast(`Applying ${pattern} load pattern to the phase...`, 'info');
    
    // This would normally call ForgeAssist/AdaptiveScheduler
    setTimeout(() => {
        showToast(`${pattern.charAt(0).toUpperCase() + pattern.slice(1)} load pattern applied to phase`, 'success');
    }, 1000);
}

function regeneratePhase(phaseBar) {
    showToast('Regenerating phase content...', 'info');
    
    // This would normally call ForgeAssist/AdaptiveScheduler
    setTimeout(() => {
        showToast('Phase regeneration would rebuild all sessions based on selected parameters', 'info');
    }, 1000);
}

// Update the initializeInspectorListeners function to include adaptive tab support
export function initializeInspectorListeners() {
    // Tab switching
    inspectorTabsContainer.addEventListener('click', event => {
        if (event.target.classList.contains('tab-link')) {
            const tabId = event.target.getAttribute('data-tab');
            activateTab(tabId);
        }
    });
    
    // Close button
    inspectorCloseBtn.addEventListener('click', closeInspector);
    
    // Initialize adaptive sub-tab switching
    document.addEventListener('click', event => {
        if (event.target.classList.contains('adaptive-tab')) {
            const tabId = event.target.getAttribute('data-tab');
            activateAdaptiveSubTab(tabId);
        }
    });
    
    // Initialize media support
    initMediaSupport();
}

// Function to update the Analytics tab based on selection
export function updateAnalyticsTab() {
    const analyticsTab = document.getElementById('analytics');
    if (!analyticsTab) return;
    
    // Get selection context
    const { selectedElement } = getSelectionState ? getSelectionState() : { selectedElement: null };
    
    // Get references to chart canvas and metrics container
    const chartCanvas = document.getElementById('analytics-chart');
    const metricsContainer = analyticsTab.querySelector('.analytics-metrics');
    
    if (!chartCanvas || !metricsContainer) return;
    
    // Clear previous content
    metricsContainer.innerHTML = '';
    
    // Handle different analytics based on what's selected
    if (!selectedElement) {
        // Show block-level analytics
        renderBlockLevelAnalytics(chartCanvas, metricsContainer);
    } else if (selectedElement.classList.contains('workout-card')) {
        // Show exercise-level analytics
        renderExerciseLevelAnalytics(selectedElement, chartCanvas, metricsContainer);
    } else if (selectedElement.classList.contains('day-cell')) {
        // Show day-level analytics
        renderDayLevelAnalytics(selectedElement, chartCanvas, metricsContainer);
    } else if (selectedElement.classList.contains('phase-bar')) {
        // Show phase-level analytics
        renderPhaseLevelAnalytics(selectedElement, chartCanvas, metricsContainer);
    } else {
        // Default view for unrecognized elements
        renderBlockLevelAnalytics(chartCanvas, metricsContainer);
    }
}

// Function to render block-level analytics
function renderBlockLevelAnalytics(chartCanvas, metricsContainer) {
    // Set chart title
    const chartHeader = document.querySelector('.analytics-header h3');
    if (chartHeader) {
        chartHeader.textContent = 'Block Analytics';
    }
    
    const subtitle = document.querySelector('.analytics-subtitle');
    if (subtitle) {
        subtitle.textContent = 'Overview of your training block';
    }
    
    // Get current block loads
    const currentLoads = getCurrentBlockLoads(workCanvas);
    const weeklyLoads = calculateWeeklyLoads(currentLoads);
    
    // Create chart data object
    const chartData = {
        labels: weeklyLoads.map((_, index) => `Week ${index + 1}`),
        datasets: [{
            label: 'Weekly Load',
            data: weeklyLoads,
            backgroundColor: 'rgba(58, 123, 213, 0.2)',
            borderColor: 'rgba(58, 123, 213, 1)',
            borderWidth: 2,
            tension: 0.4
        }]
    };
    
    // Render chart (using Chart.js or similar library)
    renderChart(chartCanvas, chartData, 'line');
    
    // Calculate key metrics
    const totalLoad = currentLoads.reduce((sum, load) => sum + load, 0);
    const avgWeeklyLoad = weeklyLoads.length > 0 ? 
        Math.round(weeklyLoads.reduce((sum, load) => sum + load, 0) / weeklyLoads.length) : 0;
    const maxWeeklyLoad = weeklyLoads.length > 0 ? Math.max(...weeklyLoads) : 0;
    const weekToWeekChange = calculateWeekToWeekLoadChanges(weeklyLoads);
    
    // Calculate ACWR (placeholder, should use proper calculation)
    const acwr = 1.1; // Placeholder value
    let acwrClass = 'metric-normal';
    if (acwr > 1.5) acwrClass = 'metric-high';
    else if (acwr < 0.8) acwrClass = 'metric-low';
    
    // Render metrics
    metricsContainer.innerHTML = `
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Total Load</div>
                <div class="metric-value">${totalLoad.toLocaleString()}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Avg Weekly</div>
                <div class="metric-value">${avgWeeklyLoad.toLocaleString()}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Peak Week</div>
                <div class="metric-value">${maxWeeklyLoad.toLocaleString()}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">ACWR</div>
                <div class="metric-value ${acwrClass}">${acwr.toFixed(2)}</div>
            </div>
        </div>
        
        <div class="analytics-insights">
            <h4>Key Insights</h4>
            <ul>
                <li>Week-to-week load changes: ${weekToWeekChange}</li>
                <li>Peak load week is ${weeklyLoads.indexOf(maxWeeklyLoad) + 1}</li>
                <li>Block structure follows a ${determineBlockStructure(weeklyLoads)} pattern</li>
            </ul>
        </div>
    `;
}

// Function to render exercise-level analytics
function renderExerciseLevelAnalytics(exerciseCard, chartCanvas, metricsContainer) {
    const exerciseName = exerciseCard.querySelector('.exercise-name')?.textContent || 'Exercise';
    
    // Set chart title
    const chartHeader = document.querySelector('.analytics-header h3');
    if (chartHeader) {
        chartHeader.textContent = 'Exercise Analytics';
    }
    
    const subtitle = document.querySelector('.analytics-subtitle');
    if (subtitle) {
        subtitle.textContent = `Analysis for ${exerciseName}`;
    }
    
    // Get exercise details
    const cardDetails = getStructuredDetails(exerciseCard);
    
    // For real implementation, you would get historical data for this exercise
    // For now, we'll create mock data
    const mockData = {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
        datasets: [{
            label: 'Load (% 1RM)',
            data: [65, 70, 72, 75, 77, cardDetails.load],
            borderColor: 'rgba(255, 112, 59, 1)',
            backgroundColor: 'rgba(255, 112, 59, 0.2)',
            borderWidth: 2,
            tension: 0.3
        }, {
            label: 'Volume (Sets × Reps)',
            data: [24, 24, 20, 20, 15, cardDetails.sets * cardDetails.reps],
            borderColor: 'rgba(58, 123, 213, 1)',
            backgroundColor: 'rgba(58, 123, 213, 0.2)',
            borderWidth: 2,
            tension: 0.3
        }]
    };
    
    // Render chart (using Chart.js or similar library)
    renderChart(chartCanvas, mockData, 'line');
    
    // Calculate metrics based on the mockData
    const currentLoad = cardDetails.load;
    const loadProgression = calculateProgression(mockData.datasets[0].data);
    const volumeProgression = calculateProgression(mockData.datasets[1].data);
    const tonnage = cardDetails.sets * cardDetails.reps * currentLoad;
    
    // Render metrics
    metricsContainer.innerHTML = `
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Current Load</div>
                <div class="metric-value">${currentLoad}% 1RM</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Load Progression</div>
                <div class="metric-value">${loadProgression > 0 ? '+' : ''}${loadProgression}%</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Volume</div>
                <div class="metric-value">${cardDetails.sets} × ${cardDetails.reps}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Tonnage</div>
                <div class="metric-value">${tonnage.toLocaleString()}</div>
            </div>
        </div>
        
        <div class="analytics-insights">
            <h4>Exercise Insights</h4>
            <ul>
                <li>Load has ${loadProgression > 0 ? 'increased' : 'decreased'} by ${Math.abs(loadProgression)}% over time</li>
                <li>Volume has ${volumeProgression > 0 ? 'increased' : 'decreased'} by ${Math.abs(volumeProgression)}% over time</li>
                <li>Current intensity zone: ${determineIntensityZone(currentLoad)}</li>
            </ul>
        </div>
    `;
}

// Function to render day-level analytics
function renderDayLevelAnalytics(dayCell, chartCanvas, metricsContainer) {
    // Get the day and week
    const dayIndex = Array.from(dayCell.parentNode.children).indexOf(dayCell) - 1; // -1 for the week label
    const weekRow = dayCell.closest('.week-row');
    const weekIndex = Array.from(weekRow.parentNode.children).indexOf(weekRow);
    
    const dayName = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayIndex];
    const weekNumber = weekIndex + 1;
    
    // Set chart title
    const chartHeader = document.querySelector('.analytics-header h3');
    if (chartHeader) {
        chartHeader.textContent = 'Day Analytics';
    }
    
    const subtitle = document.querySelector('.analytics-subtitle');
    if (subtitle) {
        subtitle.textContent = `Analysis for ${dayName}, Week ${weekNumber}`;
    }
    
    // Get day's workout cards
    const workoutCards = dayCell.querySelectorAll('.workout-card');
    const cardCount = workoutCards.length;
    
    // Calculate total load for this day
    const dayLoad = calculateDayLoad(dayCell);
    
    // Get week average for comparison
    const weekAvg = calculateWeekAverageLoad(dayCell);
    
    // Create mock data for muscle group distribution
    const muscleGroups = ['Quads', 'Hamstrings', 'Chest', 'Back', 'Shoulders', 'Arms', 'Core'];
    const mockDistribution = [25, 15, 20, 15, 10, 10, 5]; // Percentages should sum to 100
    
    // Create chart data
    const chartData = {
        labels: muscleGroups,
        datasets: [{
            label: 'Distribution (%)',
            data: mockDistribution,
            backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)',
                'rgba(255, 159, 64, 0.7)',
                'rgba(200, 200, 200, 0.7)'
            ],
            borderWidth: 1
        }]
    };
    
    // Render chart (using Chart.js or similar library)
    renderChart(chartCanvas, chartData, 'pie');
    
    // Calculate percentage of week's load
    const weekPercentage = weekAvg > 0 ? Math.round((dayLoad / weekAvg) * 100) : 0;
    
    // Render metrics
    metricsContainer.innerHTML = `
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Total Load</div>
                <div class="metric-value">${dayLoad.toLocaleString()}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Exercise Count</div>
                <div class="metric-value">${cardCount}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">vs. Week Avg</div>
                <div class="metric-value">${weekPercentage}%</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Focus</div>
                <div class="metric-value">${determineDayFocus(muscleGroups, mockDistribution)}</div>
            </div>
        </div>
        
        <div class="analytics-insights">
            <h4>Day Insights</h4>
            <ul>
                <li>This day represents ${weekPercentage}% of the week's total load</li>
                <li>Primary focus is on ${determineDayFocus(muscleGroups, mockDistribution)}</li>
                <li>Day difficulty: ${determineDayDifficulty(dayLoad, weekAvg)}</li>
            </ul>
        </div>
    `;
}

// Function to render phase-level analytics
function renderPhaseLevelAnalytics(phaseBar, chartCanvas, metricsContainer) {
    // Get the phase name
    const phaseName = phaseBar.querySelector('.phase-bar-label').textContent;
    
    // Set chart title
    const chartHeader = document.querySelector('.analytics-header h3');
    if (chartHeader) {
        chartHeader.textContent = 'Phase Analytics';
    }
    
    const subtitle = document.querySelector('.analytics-subtitle');
    if (subtitle) {
        subtitle.textContent = `Analysis for ${phaseName} phase`;
    }
    
    // Calculate phase metrics
    const { startWeek, endWeek } = getPhaseWeekRange(phaseBar, phaseBar.closest('.phase-ribbon'), workCanvas);
    const phaseDurationWeeks = (endWeek - startWeek + 1);
    const phaseWeeklyLoads = [];
    const currentLoads = getCurrentBlockLoads(workCanvas);
    
    for (let w = startWeek; w <= endWeek; w++) {
        const weekStartIndex = (w - 1) * 7;
        const weekLoads = currentLoads.slice(weekStartIndex, weekStartIndex + 7);
        const totalWeekLoad = weekLoads.reduce((sum, load) => sum + load, 0);
        phaseWeeklyLoads.push(totalWeekLoad);
    }
    
    // Create chart data
    const chartData = {
        labels: phaseWeeklyLoads.map((_, index) => `Week ${startWeek + index}`),
        datasets: [{
            label: 'Weekly Load',
            data: phaseWeeklyLoads,
            backgroundColor: 'rgba(204, 43, 94, 0.2)',
            borderColor: 'rgba(204, 43, 94, 1)',
            borderWidth: 2,
            tension: 0.4
        }]
    };
    
    // Render chart (using Chart.js or similar library)
    renderChart(chartCanvas, chartData, 'line');
    
    // Calculate metrics
    const totalPhaseLoad = phaseWeeklyLoads.reduce((sum, load) => sum + load, 0);
    const avgWeeklyLoad = phaseWeeklyLoads.length > 0 ?
        Math.round(phaseWeeklyLoads.reduce((sum, load) => sum + load, 0) / phaseWeeklyLoads.length) : 0;
    const maxWeeklyLoad = phaseWeeklyLoads.length > 0 ? Math.max(...phaseWeeklyLoads) : 0;
    const minWeeklyLoad = phaseWeeklyLoads.length > 0 ? Math.min(...phaseWeeklyLoads) : 0;
    const loadRange = maxWeeklyLoad - minWeeklyLoad;
    
    // Render metrics
    metricsContainer.innerHTML = `
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Total Load</div>
                <div class="metric-value">${totalPhaseLoad.toLocaleString()}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Avg Weekly</div>
                <div class="metric-value">${avgWeeklyLoad.toLocaleString()}</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Duration</div>
                <div class="metric-value">${phaseDurationWeeks} weeks</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Load Range</div>
                <div class="metric-value">${loadRange.toLocaleString()}</div>
            </div>
        </div>
        
        <div class="analytics-insights">
            <h4>Phase Insights</h4>
            <ul>
                <li>Phase represents ${calculatePhasePercentOfBlock(totalPhaseLoad, currentLoads)}% of block load</li>
                <li>Load pattern follows a ${determinePhasePattern(phaseWeeklyLoads)} structure</li>
                <li>Peak load week is Week ${startWeek + phaseWeeklyLoads.indexOf(maxWeeklyLoad)}</li>
            </ul>
        </div>
    `;
}

// Helper functions for analytics

// Calculate week-to-week load changes (as a description)
function calculateWeekToWeekLoadChanges(weeklyLoads) {
    if (weeklyLoads.length < 2) return 'Not enough data';
    
    const changes = [];
    
    for (let i = 1; i < weeklyLoads.length; i++) {
        const previousLoad = weeklyLoads[i - 1];
        const currentLoad = weeklyLoads[i];
        
        if (previousLoad === 0) continue;
        
        const percentChange = ((currentLoad - previousLoad) / previousLoad) * 100;
        changes.push(percentChange);
    }
    
    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    
    if (avgChange > 20) return 'High variability (>20% changes)';
    if (avgChange > 10) return 'Moderate variability (10-20% changes)';
    return 'Low variability (<10% changes)';
}

// Determine block structure pattern based on weekly loads
function determineBlockStructure(weeklyLoads) {
    if (weeklyLoads.length < 3) return 'Unknown';
    
    // Check if it's a linear progression
    let increasing = true;
    let decreasing = true;
    
    for (let i = 1; i < weeklyLoads.length; i++) {
        if (weeklyLoads[i] <= weeklyLoads[i - 1]) {
            increasing = false;
        }
        if (weeklyLoads[i] >= weeklyLoads[i - 1]) {
            decreasing = false;
        }
    }
    
    if (increasing) return 'Linear Progressive';
    if (decreasing) return 'Linear Descending';
    
    // Check if it's a wave pattern
    const diffs = [];
    for (let i = 1; i < weeklyLoads.length; i++) {
        diffs.push(weeklyLoads[i] - weeklyLoads[i - 1]);
    }
    
    let signChanges = 0;
    for (let i = 1; i < diffs.length; i++) {
        if ((diffs[i] > 0 && diffs[i - 1] < 0) || (diffs[i] < 0 && diffs[i - 1] > 0)) {
            signChanges++;
        }
    }
    
    if (signChanges >= Math.floor(diffs.length / 2)) {
        return 'Undulating/Wave';
    }
    
    // Check for step loading
    let steps = 0;
    for (let i = 1; i < weeklyLoads.length; i++) {
        if (Math.abs((weeklyLoads[i] - weeklyLoads[i - 1]) / weeklyLoads[i - 1]) > 0.15) {
            steps++;
        }
    }
    
    if (steps >= Math.floor(weeklyLoads.length / 3)) {
        return 'Step Loading';
    }
    
    return 'Mixed';
}

// Calculate progression percentage
function calculateProgression(data) {
    if (data.length < 2) return 0;
    
    const first = data[0];
    const last = data[data.length - 1];
    
    if (first === 0) return 0;
    
    return Math.round(((last - first) / first) * 100);
}

// Determine intensity zone based on load percentage
function determineIntensityZone(loadPercentage) {
    if (loadPercentage >= 90) return 'Maximum Strength (≥90%)';
    if (loadPercentage >= 80) return 'Strength (80-89%)';
    if (loadPercentage >= 70) return 'Strength-Hypertrophy (70-79%)';
    if (loadPercentage >= 60) return 'Hypertrophy (60-69%)';
    if (loadPercentage >= 50) return 'Hypertrophy-Endurance (50-59%)';
    return 'Endurance (<50%)';
}

// Determine day focus based on muscle group distribution
function determineDayFocus(muscleGroups, distribution) {
    if (!muscleGroups.length || !distribution.length) return 'Unknown';
    
    // Find the dominant muscle group
    let maxIndex = 0;
    for (let i = 1; i < distribution.length; i++) {
        if (distribution[i] > distribution[maxIndex]) {
            maxIndex = i;
        }
    }
    
    // If dominant group is > 30%, it's the focus
    if (distribution[maxIndex] >= 30) {
        return muscleGroups[maxIndex];
    }
    
    // Check for upper/lower body focus
    const upperGroups = ['Chest', 'Back', 'Shoulders', 'Arms'];
    const lowerGroups = ['Quads', 'Hamstrings', 'Glutes', 'Calves'];
    
    let upperTotal = 0;
    let lowerTotal = 0;
    
    for (let i = 0; i < muscleGroups.length; i++) {
        if (upperGroups.includes(muscleGroups[i])) {
            upperTotal += distribution[i];
        } else if (lowerGroups.includes(muscleGroups[i])) {
            lowerTotal += distribution[i];
        }
    }
    
    if (upperTotal >= 50 && upperTotal > lowerTotal * 1.5) {
        return 'Upper Body';
    }
    
    if (lowerTotal >= 50 && lowerTotal > upperTotal * 1.5) {
        return 'Lower Body';
    }
    
    return 'Full Body';
}

// Determine day difficulty based on load
function determineDayDifficulty(dayLoad, weekAvg) {
    if (weekAvg === 0) return 'Unknown';
    
    const ratio = dayLoad / weekAvg;
    
    if (ratio > 1.3) return 'High';
    if (ratio > 0.7) return 'Moderate';
    return 'Light';
}

// Calculate what percentage of the block this phase represents
function calculatePhasePercentOfBlock(phaseLoad, dailyLoads) {
    const totalBlockLoad = dailyLoads.reduce((sum, load) => sum + load, 0);
    if (totalBlockLoad === 0) return 0;
    
    return Math.round((phaseLoad / totalBlockLoad) * 100);
}

// Determine phase pattern
function determinePhasePattern(weeklyLoads) {
    return determineBlockStructure(weeklyLoads); // Reuse block structure function for now
}

// Placeholder function to render chart
// In a real implementation, this would use Chart.js or similar
function renderChart(canvas, data, type) {
    // Safe console log
    try {
        console.log(`Rendering ${type} chart with data:`, data);
    } catch (e) {}
    
    // In a real implementation, you would use Chart.js or similar
    // Example with Chart.js:
    // new Chart(canvas, {
    //     type: type,
    //     data: data,
    //     options: { ... }
    // });
    
    try {
        // For a placeholder visual, draw a basic representation on the canvas
        const ctx = canvas?.getContext && canvas.getContext('2d');
        if (!ctx) return;
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw a placeholder chart based on type
        if (type === 'line') {
            drawPlaceholderLineChart(ctx, canvas.width, canvas.height, data);
        } else if (type === 'pie') {
            drawPlaceholderPieChart(ctx, canvas.width, canvas.height, data);
        } else if (type === 'bar') {
            drawPlaceholderBarChart(ctx, canvas.width, canvas.height, data);
        }
    } catch (error) {
        console.warn('Error rendering placeholder chart:', error);
        // Draw fallback message in the canvas if possible
        try {
            const ctx = canvas?.getContext && canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.font = '12px Arial';
                ctx.fillStyle = '#999';
                ctx.textAlign = 'center';
                ctx.fillText('Chart visualization unavailable', canvas.width / 2, canvas.height / 2);
            }
        } catch (e) {
            // Silently fail if we can't even draw the fallback
        }
    }
}

// Placeholder function to draw a line chart
function drawPlaceholderLineChart(ctx, width, height, data) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    
    if (!values || values.length === 0) return;
    
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Find min and max values
    const maxValue = Math.max(...values);
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Draw data line
    ctx.beginPath();
    ctx.strokeStyle = dataset.borderColor || '#3a7bd5';
    ctx.lineWidth = 2;
    
    // Scale values to fit the chart
    const stepX = chartWidth / (values.length - 1);
    
    for (let i = 0; i < values.length; i++) {
        const x = padding + i * stepX;
        const y = height - padding - (values[i] / maxValue) * chartHeight;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    
    ctx.stroke();
    
    // Fill area under the line
    ctx.lineTo(padding + (values.length - 1) * stepX, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    ctx.fillStyle = dataset.backgroundColor || 'rgba(58, 123, 213, 0.2)';
    ctx.fill();
    
    // Draw x-axis labels
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '10px Arial';
    
    for (let i = 0; i < values.length; i++) {
        const x = padding + i * stepX;
        ctx.fillText(data.labels[i] || `${i+1}`, x, height - padding + 5);
    }
}

// Placeholder function to draw a pie chart
function drawPlaceholderPieChart(ctx, width, height, data) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    const colors = dataset.backgroundColor;
    
    if (!values || values.length === 0) return;
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;
    
    // Calculate total for percentages
    const total = values.reduce((sum, val) => sum + val, 0);
    
    // Draw pie segments
    let startAngle = 0;
    
    for (let i = 0; i < values.length; i++) {
        const sliceAngle = (values[i] / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        
        ctx.fillStyle = Array.isArray(colors) ? colors[i % colors.length] : colors;
        ctx.fill();
        
        startAngle = endAngle;
    }
}

// Placeholder function to draw a bar chart
function drawPlaceholderBarChart(ctx, width, height, data) {
    const dataset = data.datasets[0];
    const values = dataset.data;
    
    if (!values || values.length === 0) return;
    
    const padding = 20;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Find max value
    const maxValue = Math.max(...values);
    
    // Draw axes
    ctx.beginPath();
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Draw bars
    const barWidth = chartWidth / values.length * 0.8;
    const barSpacing = chartWidth / values.length * 0.2;
    
    for (let i = 0; i < values.length; i++) {
        const barHeight = (values[i] / maxValue) * chartHeight;
        const x = padding + i * (barWidth + barSpacing);
        const y = height - padding - barHeight;
        
        ctx.fillStyle = typeof dataset.backgroundColor === 'string' ? 
            dataset.backgroundColor : 
            (Array.isArray(dataset.backgroundColor) ? 
                dataset.backgroundColor[i % dataset.backgroundColor.length] : 
                'rgba(58, 123, 213, 0.7)');
        
        ctx.fillRect(x, y, barWidth, barHeight);
    }
    
    // Draw x-axis labels
    ctx.fillStyle = '#999';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '10px Arial';
    
    for (let i = 0; i < values.length; i++) {
        const x = padding + i * (barWidth + barSpacing) + barWidth / 2;
        ctx.fillText(data.labels[i] || `${i+1}`, x, height - padding + 5);
    }
}

// ... rest of the file ...
