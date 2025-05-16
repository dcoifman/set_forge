/**
 * ForgeAssist Module (Phase 3 Implementation)
 *
 * Responsibilities:
 * - Parse basic commands + suggestions/missed session commands.
 * - Maintain context awareness.
 * - Execute simple reactive commands (clear, shift) with simulation/confirmation.
 * - Handle basic suggestions (swap) and missed session workflows.
 * - Provide feedback via toasts.
 * - Generate contextual actions for the Inspector panel.
 * - Monitor analytics thresholds and provide proactive suggestions.
 */
import _AdaptiveScheduler from './adaptiveScheduler.js';
let AdaptiveScheduler = _AdaptiveScheduler; // Allow reassignment
const __dependencies = { AdaptiveScheduler: _AdaptiveScheduler }; // Store original
const __Rewire__ = (name, value) => { if(name === 'AdaptiveScheduler') AdaptiveScheduler = value; };
const __ResetDependency__ = (name) => { if(name === 'AdaptiveScheduler') AdaptiveScheduler = __dependencies.AdaptiveScheduler; };
 // <<< Import AdaptiveScheduler

import BiomechanicalAnalyzer from './biomechanical-analyzer.js';
import RecoveryRecommender from './components/RecoveryRecommender.js';

const ForgeAssist = (() => {

    let currentContext = {
        selectedElement: null,
        selectedElements: new Set(),
    };

    // Dependencies injected via init()
    let dependencies = {
        workCanvas: null,
        showToast: () => {},
        triggerAnalyticsUpdate: () => {},
        getTotalWeeks: () => 0, // Function to get total weeks from blockbuilder
        getBlockState: () => ({}), // Function to get current block state object
        exerciseLibrary: [], // Added exercise library dependency
    };

    const daysOfWeek = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]; // Lowercase for matching

    // --- Analytics Thresholds (Configurable) ---
    let HIGH_ACWR_THRESHOLD = 1.5;
    let LOW_ACWR_THRESHOLD = 0.8; 
    let HIGH_MONOTONY_THRESHOLD = 2.0;
    let HIGH_STRAIN_THRESHOLD = 5500; 
    // --- End Analytics Thresholds ---

    /**
     * Gets the analytics thresholds from user settings or uses defaults
     * @returns {Object} Object containing threshold values
     */
    function getUserAnalyticsThresholds() {
        let thresholds = {
            highAcwr: HIGH_ACWR_THRESHOLD,
            lowAcwr: LOW_ACWR_THRESHOLD,
            highMonotony: HIGH_MONOTONY_THRESHOLD,
            highStrain: HIGH_STRAIN_THRESHOLD
        };
        
        try {
            // Check if user has custom thresholds in localStorage
            const userSettings = localStorage.getItem('setforgeUserSettings');
            if (userSettings) {
                const settings = JSON.parse(userSettings);
                if (settings.analyticsThresholds) {
                    // Apply user's custom thresholds if available
                    if (typeof settings.analyticsThresholds.highAcwr === 'number') {
                        thresholds.highAcwr = settings.analyticsThresholds.highAcwr;
                    }
                    if (typeof settings.analyticsThresholds.lowAcwr === 'number') {
                        thresholds.lowAcwr = settings.analyticsThresholds.lowAcwr;
                    }
                    if (typeof settings.analyticsThresholds.highMonotony === 'number') {
                        thresholds.highMonotony = settings.analyticsThresholds.highMonotony;
                    }
                    if (typeof settings.analyticsThresholds.highStrain === 'number') {
                        thresholds.highStrain = settings.analyticsThresholds.highStrain;
                    }
                    
                    console.log('[ForgeAssist] Using custom analytics thresholds:', thresholds);
                }
            }
        } catch (error) {
            console.error('[ForgeAssist] Error getting user thresholds:', error);
            // Continue with defaults
        }
        
        return thresholds;
    }
    
    /**
     * Updates analytics thresholds with user-provided values
     * @param {Object} newThresholds - Object containing new threshold values
     */
    function updateAnalyticsThresholds(newThresholds) {
        try {
            // Get current settings or initialize
            let userSettings = {};
            const settingsStr = localStorage.getItem('setforgeUserSettings');
            if (settingsStr) {
                userSettings = JSON.parse(settingsStr);
            }
            
            // Initialize analyticsThresholds if it doesn't exist
            if (!userSettings.analyticsThresholds) {
                userSettings.analyticsThresholds = {};
            }
            
            // Update only provided thresholds
            if (typeof newThresholds.highAcwr === 'number') {
                userSettings.analyticsThresholds.highAcwr = newThresholds.highAcwr;
                HIGH_ACWR_THRESHOLD = newThresholds.highAcwr;
            }
            if (typeof newThresholds.lowAcwr === 'number') {
                userSettings.analyticsThresholds.lowAcwr = newThresholds.lowAcwr;
                LOW_ACWR_THRESHOLD = newThresholds.lowAcwr;
            }
            if (typeof newThresholds.highMonotony === 'number') {
                userSettings.analyticsThresholds.highMonotony = newThresholds.highMonotony;
                HIGH_MONOTONY_THRESHOLD = newThresholds.highMonotony;
            }
            if (typeof newThresholds.highStrain === 'number') {
                userSettings.analyticsThresholds.highStrain = newThresholds.highStrain;
                HIGH_STRAIN_THRESHOLD = newThresholds.highStrain;
            }
            
            // Save updated settings
            localStorage.setItem('setforgeUserSettings', JSON.stringify(userSettings));
            console.log('[ForgeAssist] Updated analytics thresholds:', userSettings.analyticsThresholds);
            
            // Show confirmation toast if available
            if (typeof dependencies.showToast === 'function') {
                dependencies.showToast('Analytics thresholds updated successfully', 'success');
            }
            
            return true;
        } catch (error) {
            console.error('[ForgeAssist] Error updating thresholds:', error);
            
            // Show error toast if available
            if (typeof dependencies.showToast === 'function') {
                dependencies.showToast('Error updating analytics thresholds', 'error');
            }
            
            return false;
        }
    }

    // --- Scratch Pad - Phase 3 ---
    // [X] Create js/adaptiveScheduler.js module.
    // [X] Implement AdaptiveScheduler.calculateImpact(changes): Basic simulation.
    // [X] Implement AdaptiveScheduler.suggestSwap(exerciseId, reason): Basic logic.
    // [X] Integrated basic simulation/confirmation for clear/shift.
    // [X] Added parsing/execution for suggest alternative.
    // [X] Added parsing/execution for missed session.
    // [X] Implement ForgeAssist.getContextualActions(element).
    // [X] Integrate contextual actions UI in blockbuilder.js.
    // [X] Refine simulation/preview.
    // [X] Implement checkAnalyticsThresholds
    // [X] Implement handleProposalAction
    // [X] Enhance intensity modifiers
    // --- End Scratch Pad ---

    // Initialize key components
    let biomechanicalAnalyzer = null;
    let recoveryRecommender = null;

    /**
     * Initializes the module with necessary dependencies.
     * @param {object} deps - Object containing dependencies.
     * @param {HTMLElement} deps.workCanvas - The main canvas element.
     * @param {function} deps.showToast - Function to display toast notifications.
     * @param {function} deps.triggerAnalyticsUpdate - Function to trigger analytics recalculation.
     * @param {function} deps.getTotalWeeks - Function that returns the current number of weeks.
     * @param {function} deps.getBlockState - Function to get current block state object.
     * @param {Array<object>} deps.exerciseLibrary - Array of exercise objects.
     */
    function init(deps) {
        // Check that the required dependencies are provided
        if (!deps) {
            console.error("[ForgeAssist] Init failed: No dependencies provided");
            return;
        }

        dependencies.workCanvas = deps.workCanvas || dependencies.workCanvas;
        dependencies.showToast = deps.showToast || dependencies.showToast;
        dependencies.triggerAnalyticsUpdate = deps.triggerAnalyticsUpdate || dependencies.triggerAnalyticsUpdate;
        dependencies.getTotalWeeks = deps.getTotalWeeks || dependencies.getTotalWeeks;
        dependencies.getBlockState = deps.getBlockState || dependencies.getBlockState;
        dependencies.exerciseLibrary = deps.exerciseLibrary || dependencies.exerciseLibrary || [];
        
        // Set updateCardDetailsString function if provided
        if (deps.updateCardDetailsString) {
            dependencies.updateCardDetailsString = deps.updateCardDetailsString;
        }
        
        // Set triggerSaveState function if provided
        if (deps.triggerSaveState) {
            dependencies.triggerSaveState = deps.triggerSaveState;
        }

        // Initialize AdaptiveScheduler with enhanced analytics capabilities
        if (AdaptiveScheduler && typeof AdaptiveScheduler.init === 'function') {
            try {
                AdaptiveScheduler.init({ 
                    exerciseLibrary: dependencies.exerciseLibrary,
                    acwrFunction: deps.acwrFunction,
                    monotonyFunction: deps.monotonyFunction,
                    getCurrentBlockLoads: deps.getCurrentBlockLoads,
                    simulatedPastLoad: deps.simulatedPastLoad || [],
                    showToast: dependencies.showToast
                });
                console.log('[ForgeAssist] AdaptiveScheduler initialized successfully with enhanced analytics capabilities');
            } catch (error) {
                console.error('[ForgeAssist] Error initializing AdaptiveScheduler:', error);
                // Try to continue anyway
            }
        } else {
            console.warn('[ForgeAssist] AdaptiveScheduler module or init function not available');
        }

        // Initialize BiomechanicalAnalyzer and RecoveryRecommender
        biomechanicalAnalyzer = new BiomechanicalAnalyzer();
        recoveryRecommender = new RecoveryRecommender(biomechanicalAnalyzer, dependencies.exerciseLibrary);
    }

    /**
     * Updates the context based on user selection in the Block Builder.
     * @param {HTMLElement | null} selectedElement - The primary selected element.
     * @param {Set<HTMLElement>} selectedElements - The set of all selected elements.
     */
    function updateContext(selectedElement, selectedElements) {
        // <<< ADDED LOG >>>
        console.log('[ForgeAssist.updateContext] Called with:', selectedElement, selectedElements);
        currentContext.selectedElement = selectedElement;
        currentContext.selectedElements = selectedElements || new Set();
        // console.log('[ForgeAssist] Context Updated:', {
        //     single: selectedElement?.id,
        //     multiple: Array.from(currentContext.selectedElements).map(el => el.id)
        // });
    }

    /**
     * Generates a list of relevant actions based on the currently selected element.
     * @returns {Array<object>} - Array of actions { id: string, label: string, description: string, type: string, handler: function | string }
     */
    function getContextualActions() {
        // <<< ADDED LOG >>>
        console.log('[ForgeAssist.getContextualActions] Reading context:', currentContext.selectedElement);
        const element = currentContext.selectedElement;
        let actions = [];

        if (!element) {
            // Return empty array for no selection
            return actions;
        }

        if (element.classList.contains('workout-card')) {
            // --- Add Check for Model-Driven Exercise First ---
            if (element.dataset.modelDriven === "true") {
                // It's a model-driven exercise
                const exerciseName = element.querySelector('.exercise-name')?.textContent || 'Exercise';
                const exerciseId = findExerciseIdByName(exerciseName);
                
                actions.push({ 
                    id: 'model_view_details', 
                    label: `View Model Details`, 
                    description: 'See how this exercise fits into the periodization model.',
                    type: 'primary',
                    handler: () => {
                        // Find the day-cell and model context
                        const dayCell = element.closest('.day-cell');
                        if (dayCell && dayCell.dataset.periodizationModelId) {
                            // Select the model
                            document.dispatchEvent(new CustomEvent('forge-assist:select-model', {
                                bubbles: true, 
                                detail: {
                                    modelId: dayCell.dataset.periodizationModelId,
                                    dayId: dayCell.dataset.dayId
                                }
                            }));
                            dependencies.showToast('Showing model details for this exercise', 'info');
                        } else {
                            dependencies.showToast('Could not locate model information', 'error');
                        }
                    }
                });
                
                actions.push({ 
                    id: 'model_override', 
                    label: `Override Model Settings`, 
                    description: 'Customize this specific exercise while keeping it linked to the model.',
                    type: 'secondary',
                    handler: () => {
                        // Open exercise editor but mark as override
                        element.dataset.modelOverride = "true";
                        // Trigger exercise editor UI
                        element.querySelector('.edit-btn')?.click();
                        dependencies.showToast('Any changes will be preserved as overrides to the model', 'info');
                    }
                });
                
                // Also keep some standard actions like technique cues
                actions.push({
                    id: 'add-technique-cue', 
                    label: 'Add Technique Cue',
                    description: 'Add a coaching note or technique reminder for better execution.',
                    type: 'coaching',
                    handler: () => handleAddTechniqueCue(element) 
                });
                
                return actions; // Return early for model-driven cards
            }
            
            // --- Check for Placeholder ---
            if (element.dataset.isPlaceholder === 'true') {
                // It's a placeholder card, offer different actions (or none for now)
                actions.push({ 
                    id: 'define_placeholder', 
                    label: 'Define Session Content', 
                    description: 'Replace this placeholder with actual training exercises.',
                    type: 'primary',
                    handler: () => {
                         // Simulate clicking the '+' button or double-clicking
                         const cell = element.closest('.day-cell');
                         if (cell) {
                             cell.dispatchEvent(new CustomEvent('forge-assist:focus-library', { bubbles: true }));
                             dependencies.showToast('Opened Library. Drag exercises to the calendar day.', 'info');
                         }
                     } 
                });
                 actions.push({ 
                    id: 'clear_placeholder', 
                    label: 'Remove Placeholder', 
                    description: 'Delete this placeholder session from the calendar.',
                    type: 'secondary',
                    handler: () => {
                          if (confirm('Remove this session placeholder?')) {
                              element.remove();
                              dependencies.triggerAnalyticsUpdate(); // Placeholder load changes
                              dependencies.showToast('Placeholder removed.', 'info');
                          }
                     } 
                });
            } else {
                // --- It's a regular exercise card --- 
                const exerciseName = element.querySelector('.exercise-name')?.textContent || 'Exercise';
                const exerciseId = findExerciseIdByName(exerciseName); // Helper needed

                // Existing actions
                actions.push({ 
                    id: 'suggest_swap', 
                    label: `Find Alternative for ${exerciseName}`, 
                    description: 'Get suggestions for similar exercises that can replace this one.',
                    type: 'primary',
                    handler: () => handleSuggestSwap(exerciseId) 
                });
                
                actions.push({ 
                    id: 'decrease_intensity', 
                    label: 'Decrease Intensity (10%)', 
                    description: 'Reduce the load/intensity of this exercise to lower overall stress.',
                    type: 'secondary',
                    handler: () => handleChangeIntensity(element, -0.1) 
                });
                
                actions.push({ 
                    id: 'increase_intensity', 
                    label: 'Increase Intensity (10%)', 
                    description: 'Increase the load/intensity of this exercise for greater stimulus.',
                    type: 'secondary',
                    handler: () => handleChangeIntensity(element, 0.1) 
                });
                
                actions.push({ 
                    id: 'simulate_acwr', 
                    label: 'Simulate ACWR Impact', 
                    description: 'See how modifying this exercise would affect your acute-to-chronic workload ratio.',
                    type: 'analytics',
                    handler: () => simulateCardChanges(element) 
                });
                
                // --- Add new actions --- 
                actions.push({
                    id: 'find-alternative', // Matches user query
                    label: 'Find Alternative Exercise',
                    description: 'Discover exercises with similar training effects that might be better suited.',
                    type: 'primary',
                    // Reuse suggestSwap handler
                    handler: () => handleSuggestSwap(exerciseId)
                });
                
                actions.push({
                    id: 'add-technique-cue', // Matches user query
                    label: 'Add Technique Cue',
                    description: 'Add a coaching note or technique reminder for better execution.',
                    type: 'coaching',
                    // Point to new handler function
                    handler: () => handleAddTechniqueCue(element) 
                });
                
                actions.push({
                    id: 'suggest-progression', // Matches user query
                    label: 'Suggest Progression',
                    description: 'Get recommendations on how to progress this exercise in future sessions.',
                    type: 'coaching',
                    // Point to new handler function
                    handler: () => handleSuggestProgression(element) 
                });
            }
        } else if (element.classList.contains('day-cell')) {
            // It's a day cell
            const week = parseInt(element.dataset.week, 10);
            const day = element.dataset.day.toLowerCase();

            // Get workout cards in this cell
            const cards = Array.from(element.querySelectorAll('.workout-card'));
            const hasWorkouts = cards.length > 0;
            const isPlaceholderOnly = cards.length === 1 && cards[0].dataset.isPlaceholder === 'true';

            // First - most common action
            if (!hasWorkouts) {
                actions.push({ 
                    id: 'add_workout',
                    label: 'Add Workout',
                    description: 'Add exercises to this day.',
                    type: 'primary',
                    handler: () => {
                        // Focus the exercise library
                        element.dispatchEvent(new CustomEvent('forge-assist:focus-library', { bubbles: true }));
                        dependencies.showToast('Opened Library. Drag exercises to the calendar day.', 'info');
                    }
                });
            }

            // --- Add Suggest Focus action (previously placeholder) ---
            actions.push({ 
                id: 'suggest_focus', 
                label: 'Suggest Training Focus', 
                description: 'Analyze the training week and suggest an optimal focus for this day.',
                type: 'coaching',
                handler: () => handleSuggestFocus(element)
            });

            // Existing actions
            actions.push({ 
                id: 'missed_session', 
                label: 'Handle Missed Session', 
                description: 'Record that this session was missed and get options to adjust.',
                type: hasWorkouts ? 'primary' : 'secondary',
                handler: () => {
                    handleMissedSession({ week, day });
                    dependencies.showToast(`Handling missed ${day} of week ${week}`, 'info');
                }
            });

            // Existing actions
            if (hasWorkouts && !isPlaceholderOnly) {
                actions.push({ 
                    id: 'clear_day', 
                    label: 'Clear Day', 
                    description: 'Remove all workouts from this day.',
                    type: 'secondary',
                    handler: () => {
                        // Use our simulator to preview changes
                        simulateAndConfirm(
                            'clearDay', 
                            { week, day },
                            `Clearing all workouts from ${day}, week ${week}`,
                            `Are you sure you want to clear all workouts from ${day}, week ${week}?`
                        );
                    }
                });
            }

            // Only offer to convert to rest if there are actual workouts (not just placeholders)
            if (hasWorkouts && !isPlaceholderOnly) {
                actions.push({ 
                    id: 'convert_to_rest', 
                    label: 'Convert to Rest Day', 
                    description: 'Replace all workouts with a programmed rest day.',
                    type: 'secondary',
                    handler: () => handleConvertToRestDay(element)
                });
            }
        } else if (element.classList.contains('phase-bar')) {
            const phaseName = element.dataset.phase || 'Phase';
            actions.push({ 
                id: 'optimize_phase', 
                label: `Optimize ${phaseName} Phase`, 
                description: 'Analyze and adjust the workload distribution across this phase for better progression.',
                type: 'analytics',
                handler: () => handleOptimizePhaseLoad(element) 
            });
            
            actions.push({ 
                id: 'clear_phase', 
                label: `Clear ${phaseName} Phase`, 
                description: 'Remove all workouts from this phase for a fresh start.',
                type: 'secondary',
                handler: () => handleClearPhase(element) 
            });
            
            actions.push({ 
                id: 'generate_phase', 
                label: `Generate ${phaseName} Content`, 
                description: 'Auto-generate a structured training plan for this phase based on goals.',
                type: 'primary',
                handler: () => handleGeneratePhaseContent(element) 
            });
        }

        return actions;
    }

    // Placeholder for new handler function
    function handleOptimizeDayStructure(dayCell) {
        // Implementation to be added in future
        dependencies.showToast("Day structure optimization coming soon in a future update!", "info");
    }
    
    // Placeholder for new handler function
    function handleGeneratePhaseContent(phaseElement) {
        // Implementation to be added in future
        const phaseName = phaseElement.dataset.phase || 'Phase';
        dependencies.showToast(`${phaseName} phase content generation will be available in a future update!`, "info");
    }

     // Helper to find exercise ID (replace with better method if available)
     function findExerciseIdByName(name) {
        // <<< ADDED LOG >>>
        console.log(`[findExerciseIdByName] Searching for name: "${name}" in library with ${dependencies.exerciseLibrary?.length || 0} exercises.`);
        if (!name) return null; // Don't search if name is null/empty
        
        const searchTerm = name.toLowerCase();
        const found = dependencies.exerciseLibrary.find(ex => ex.name && ex.name.toLowerCase() === searchTerm);
        
        // <<< ADDED LOG >>>
        console.log(`[findExerciseIdByName] Found exercise:`, found);
        
        return found ? found.id : null;
     }

     // Handler for contextual action - enhanced for Phase 3
     function handleSuggestSwap(exerciseId, reason = '') {
         if (!exerciseId) {
             dependencies.showToast("Could not identify selected exercise for swap.", "warning");
             return;
         }
         const suggestions = AdaptiveScheduler.suggestSwap(exerciseId, reason);
         
         console.log(`[handleSuggestSwap] Received ${suggestions.length} suggestions for ${exerciseId}`);

         // --- Find the Assist Tab ---
         const assistTabElement = document.getElementById('assist'); 
         if (!assistTabElement) {
             console.error("Could not find the #assist tab element to display swap suggestions.");
             dependencies.showToast("UI Error: Cannot display swap suggestions.", "error");
             return;
         }
         // --- End Find ---

         if (suggestions && suggestions.length > 0) {
             const originalExerciseName = dependencies.exerciseLibrary.find(ex => ex.id === exerciseId)?.name || 'selected exercise';

             // --- NEW: Generate HTML for direct DOM insertion ---
             let suggestionHtml = `
                <div class="swap-suggestion-container">
                    <h4>Swap Options for ${originalExerciseName}</h4> 
                    <div class="swap-suggestion-list">
             `;
             suggestions.forEach((suggestion, index) => {
                 suggestionHtml += `
                    <button class="swap-suggestion-btn cta-button secondary-cta" 
                            data-exercise-id=\"${suggestion.id}\" 
                            data-index=\"${index}\" 
                            title=\"Swap to ${suggestion.name}\">
                        ${suggestion.name}
                    </button>
                 `;
             });
             suggestionHtml += `
                    </div>
                    <hr class="detail-separator">
                    <button class="swap-suggestion-cancel-btn cta-button">Cancel</button> 
                </div>
             `;
             // --- END NEW HTML ---
             
             // --- NEW: Update Assist Tab ---
             assistTabElement.innerHTML = suggestionHtml;
             
             // --- Add event listeners to the new buttons ---
             // Use event delegation on the container
             const container = assistTabElement.querySelector('.swap-suggestion-container');
             if(container){
                container.addEventListener('click', (e) => {
                    if (e.target.classList.contains('swap-suggestion-btn')) {
                        handleSwapSelection(e); // Handle selection
                        // After selection, maybe refresh the inspector to show default actions again?
                        document.body.dispatchEvent(new CustomEvent('forge-assist:render-actions', { bubbles: true })); // Dispatch on body
                    } else if (e.target.classList.contains('swap-suggestion-cancel-btn')) {
                        console.log("[ForgeAssist] Swap cancel button clicked."); 
                        document.body.dispatchEvent(new CustomEvent('forge-assist:render-actions', { bubbles: true })); // Dispatch on body
                        console.log("[ForgeAssist] Dispatched 'forge-assist:render-actions' event on document.body."); // Update log
                    }
                });
             }
             // --- END NEW Update ---
             
             console.log("[ForgeAssist] Swap Suggestions displayed in #assist tab:", suggestions);
         } else {
             dependencies.showToast("No suitable swaps found.", 'info');
         }
     }

     /**
      * Suggests swaps for an exercise by ID without needing a card context
      * @param {string} exerciseId - The ID of the exercise to find swaps for
      * @param {string} reason - Optional reason for the swap suggestion
      * @returns {Array} The suggested exercise swaps
      */
     function suggestSwapById(exerciseId, reason = '') {
         if (!exerciseId) {
             console.error('suggestSwapById called with invalid exerciseId');
             return [];
         }

         // Use the AdaptiveScheduler to get swap suggestions
         const suggestions = AdaptiveScheduler.suggestSwap(exerciseId, reason);
         console.log(`[suggestSwapById] Found ${suggestions.length} suggestions for ${exerciseId}`);
         
         return suggestions;
     }

     /**
      * Handles when a user selects a swap suggestion
      * @param {Event} e - Click event
      */
     function handleSwapSelection(e) {
         const exerciseId = e.target.dataset.exerciseId;
         const index = parseInt(e.target.dataset.index, 10);
         
         if (exerciseId && !isNaN(index)) {
             console.log(`[ForgeAssist] Selected swap: ${exerciseId} (index ${index})`);
             
             // Find the currently selected card
             const card = currentContext.selectedElement;
             if (card && card.classList.contains('workout-card')) {
                 // Get the name element to update
                 const nameEl = card.querySelector('.exercise-name');
                 if (nameEl) {
                     // Find the exercise details
                     const exercise = dependencies.exerciseLibrary.find(ex => ex.id === exerciseId);
                     if (exercise) {
                         // Update the card with the new exercise
                         nameEl.textContent = exercise.name;
                         
                         // Close the toast
                         const toast = e.target.closest('.toast');
                         if (toast) {
                             toast.classList.remove('show');
                             toast.classList.add('hide');
                             setTimeout(() => toast.remove(), 300);
                         }
                         
                         dependencies.showToast(`Swapped to ${exercise.name}`, 'success');
                         dependencies.triggerAnalyticsUpdate();
                     }
                 }
             } else {
                 dependencies.showToast('No workout card selected to apply swap.', 'warning');
             }
         }
     }

     // Handler for contextual action - enhanced for Phase 3
     function handleChangeIntensity(card, delta) {
         if (!card || !card.classList.contains('workout-card')) {
             dependencies.showToast('No valid workout card selected.', 'warning');
             return;
         }
 
         const loadType = card.dataset.loadType || 'rpe';
         const originalLoadValue = parseFloat(card.dataset.loadValue) || 0;
         const originalLoad = parseInt(card.dataset.load, 10) || 0;
         const exerciseName = card.querySelector('.exercise-name')?.textContent || 'exercise';
         
         // <<< ADDED LOG >>>
         console.log(`[handleChangeIntensity] Initial: type=${loadType}, value=${originalLoadValue}, load=${originalLoad}, name=${exerciseName}`);

         let proposedLoadValue;

         // 1. Calculate the proposed new primary intensity value
         if (loadType === 'rpe') {
             // Adjust by 0.5 point for RPE
             proposedLoadValue = Math.min(10, Math.max(5, originalLoadValue + (delta > 0 ? 0.5 : -0.5)));
         } else if (loadType === 'percent' || loadType === '%') {
             // Adjust by 5% for percentage
             const percentChange = delta > 0 ? 5 : -5;
             proposedLoadValue = Math.round(Math.min(100, Math.max(40, originalLoadValue + percentChange))); // Round % to whole number
         } else if (loadType === 'weight') {
             // Adjust by 5% for absolute weight
             const weightChange = originalLoadValue * 0.05 * (delta > 0 ? 1 : -1);
             // Round to nearest 0.5 or 1 depending on magnitude?
             const rounding = originalLoadValue > 20 ? 0.5 : (originalLoadValue > 5 ? 0.25 : 0.1);
             proposedLoadValue = Math.max(0, Math.round((originalLoadValue + weightChange) / rounding) * rounding);
         } else {
             dependencies.showToast(`Cannot adjust intensity for type: ${loadType}`, 'warning');
             return;
         }
         
         // <<< ADDED LOG >>>
         console.log(`[handleChangeIntensity] Calculated proposedLoadValue: ${proposedLoadValue}`);

         // Check if the value actually changed
         if (proposedLoadValue === originalLoadValue) {
             dependencies.showToast(`Intensity for ${exerciseName} is already at its ${delta > 0 ? 'maximum' : 'minimum'} limit for this adjustment type.`, 'info');
             return;
         }

         // 2. Simulate the impact using the *proposed* change
         // Create a temporary card data object with the proposed change
         const simulatedCardData = { ...card.dataset, loadValue: proposedLoadValue.toString() };
         
         // Assume existence of a function to calculate load from card data
         const estimatedNewLoad = dependencies.calculateCardLoad ? dependencies.calculateCardLoad(simulatedCardData) : originalLoad + (delta > 0 ? 50 : -50); // Fallback estimation
         const estimatedLoadChange = estimatedNewLoad - originalLoad;
         
         // <<< ADDED LOG >>>
         console.log(`[handleChangeIntensity] Estimated newLoad=${estimatedNewLoad}, loadChange=${estimatedLoadChange}`);

         const changeDesc = [{
             type: 'modifyIntensity', // More specific type
             cardId: card.id,
             originalLoad: originalLoad,
             newLoad: estimatedNewLoad,
             loadChange: estimatedLoadChange,
             newValue: proposedLoadValue, // Include the specific value change
             loadType: loadType
         }];
         
          // <<< ADDED LOG >>>
         console.log(`[handleChangeIntensity] Generated changeDesc:`, changeDesc);

         // 3. Preview the change
         applyPreviewHighlight(changeDesc); // Highlight the card

         // 4. Calculate overall block impact
         // We pass the estimated load change, not the detailed changeDesc for now
         const impact = AdaptiveScheduler.calculateImpact([{ type: 'modify', loadChange: estimatedLoadChange }], {}); 
         const impactText = `Est. Load Change: ${estimatedLoadChange > 0 ? '+' : ''}${estimatedLoadChange}, Pred. ACWR: ${impact.predictedACWR?.toFixed(2) || 'N/A'}`;
         
          // <<< ADDED LOG >>>
         console.log(`[handleChangeIntensity] Calculated impact:`, impact);
         console.log(`[handleChangeIntensity] Impact text: ${impactText}`);

         // 5. Confirm the change
         const direction = delta > 0 ? 'Increase' : 'Decrease';
         const confirmMessage = `${direction} intensity for ${exerciseName}?`;
         const valueDisplay = (loadType === 'weight' || loadType === 'rpe') ? proposedLoadValue.toFixed(1) : proposedLoadValue.toFixed(0);
         
         // <<< ADDED LOG >>>
         console.log('[handleChangeIntensity] Reaching confirm() dialog...');

         if (confirm(`${confirmMessage}\n\nChange ${loadType.toUpperCase()} from ${originalLoadValue.toFixed(1)} to ${valueDisplay}\n(${impactText})`)) {
             // <<< ADDED LOG >>>
             console.log('[handleChangeIntensity] Confirmed! Calling simulateAndConfirm...');
             // 6. Apply the confirmed change
              // Use simulateAndConfirm to leverage its execution path
              // Pass the detailed change description for accurate application
              simulateAndConfirm('applyIntensityChange', { cardId: card.id }, changeDesc, confirmMessage); // Use specific action name
         } else {
             // <<< ADDED LOG >>>
             console.log('[handleChangeIntensity] Cancelled.');
             dependencies.showToast('Intensity change cancelled.', 'info');
         }

         clearPreviewHighlight();
     }

     /**
      * Simulates changes to a card to see ACWR impact
      * @param {HTMLElement} card - The workout card to simulate
      */
     function simulateCardChanges(card) {
         if (!card || !card.classList.contains('workout-card')) {
             dependencies.showToast('No valid workout card selected.', 'warning');
             return;
         }
         
         const currentLoad = parseInt(card.dataset.load, 10) || 0;
         const exerciseName = card.querySelector('.exercise-name')?.textContent || 'this exercise';
         
         // Create simulations for different scenarios
         const scenarios = [
             { name: 'Remove Exercise', loadChange: -currentLoad, changeType: 'remove' },
             { name: 'Decrease (15%)', loadChange: Math.round(-currentLoad * 0.15), changeType: 'modify' },
             { name: 'Increase (15%)', loadChange: Math.round(currentLoad * 0.15), changeType: 'modify' }
         ];
         
         // Calculate impacts
         const impacts = scenarios.map(scenario => {
             const change = [{
                 type: scenario.changeType,
                 cardId: card.id,
                 loadChange: scenario.loadChange
             }];
             
             const impact = AdaptiveScheduler.calculateImpact(change, {});
             return {
                 ...scenario,
                 impact
             };
         });
         
         // Display the results in a readable format
         let resultsHTML = `<div class="simulation-results"><h4>ACWR Impact Simulation</h4>`;
         resultsHTML += `<p>Simulating changes to <strong>${exerciseName}</strong>:</p>`;
         resultsHTML += `<ul style="text-align: left; padding-left: 20px;">`;
         
         impacts.forEach(item => {
             const acwrValue = item.impact.predictedACWR?.toFixed(2) || 'N/A';
             const acwrClass = item.impact.predictedACWRFlag || 'green';
             resultsHTML += `<li><strong>${item.name}:</strong> ACWR <span class="acwr-${acwrClass}">${acwrValue}</span></li>`;
         });
         
         resultsHTML += `</ul></div>`;
         
         dependencies.showToast(resultsHTML, 'info', 15000);
     }

     /**
      * Handles converting a day to a rest day
      * @param {HTMLElement} dayCell - The day cell to convert
      */
     function handleConvertToRestDay(dayCell) {
         if (!dayCell || !dayCell.classList.contains('day-cell')) {
             dependencies.showToast('Invalid day selected.', 'warning');
             return;
         }
         
         const week = dayCell.dataset.week;
         const day = dayCell.dataset.day;
         const cards = dayCell.querySelectorAll('.workout-card');
         
         if (cards.length === 0) {
             dependencies.showToast(`${day}, Week ${week} is already a rest day.`, 'info');
             return;
         }
         
         // Create change description for removal
         const changeDesc = [];
         cards.forEach(card => {
             changeDesc.push({
                 type: 'remove',
                 cardId: card.id,
                 load: card.dataset.load
             });
         });
         
         // Apply preview
         applyPreviewHighlight(changeDesc);
         
         // Calculate impact
         const impact = AdaptiveScheduler.calculateImpact(changeDesc, {});
         const impactText = `Est. Load Change: ${impact.estimatedLoadChange}, Pred. ACWR: ${impact.predictedACWR?.toFixed(2) || 'N/A'}`;
         
         // Confirm the change
         if (confirm(`Convert ${day}, Week ${week} to a rest day?\n\n${impactText}\n\nThis will remove ${cards.length} exercise(s).`)) {
             // Remove all cards
             cards.forEach(card => card.remove());
             
             dependencies.showToast(`Converted ${day}, Week ${week} to a rest day.`, 'success');
             dependencies.triggerAnalyticsUpdate();
         } else {
             dependencies.showToast('Rest day conversion cancelled.', 'info');
         }
         
         clearPreviewHighlight();
     }

     /**
      * Handles clearing an entire phase
      * @param {HTMLElement} phaseElement - The phase element to clear
      */
     function handleClearPhase(phaseElement) {
         if (!phaseElement || !phaseElement.classList.contains('phase-bar')) {
             dependencies.showToast('Invalid phase selected.', 'warning');
             return;
         }
         
         const phaseName = phaseElement.dataset.phase || 'Phase';
         
         // First, identify which weeks are in this phase
         const { startWeek, endWeek } = dependencies.getPhaseWeekRange?.(phaseName) || { startWeek: 0, endWeek: 0 };
         
         if (startWeek === 0 || endWeek === 0) {
             dependencies.showToast('Could not determine phase week range.', 'warning');
             return;
         }
         
         // Find all cards in this phase
         const changeDesc = [];
         for (let week = startWeek; week <= endWeek; week++) {
             const weekCards = dependencies.workCanvas.querySelectorAll(`.day-cell[data-week="${week}"] .workout-card`);
             weekCards.forEach(card => {
                 changeDesc.push({
                     type: 'remove',
                     cardId: card.id,
                     load: card.dataset.load
                 });
             });
         }
         
         if (changeDesc.length === 0) {
             dependencies.showToast(`${phaseName} phase is already empty.`, 'info');
             return;
         }
         
         // Apply preview
         applyPreviewHighlight(changeDesc);
         
         // Calculate impact
         const impact = AdaptiveScheduler.calculateImpact(changeDesc, {});
         const impactText = `Est. Load Change: ${impact.estimatedLoadChange}, Pred. ACWR: ${impact.predictedACWR?.toFixed(2) || 'N/A'}`;
         
         // Confirm the change
         if (confirm(`Clear all workouts in ${phaseName} phase (weeks ${startWeek}-${endWeek})?\n\n${impactText}\n\nThis will remove ${changeDesc.length} exercise(s).`)) {
             // Remove all cards in the phase
             for (let week = startWeek; week <= endWeek; week++) {
                 const weekCards = dependencies.workCanvas.querySelectorAll(`.day-cell[data-week="${week}"] .workout-card`);
                 weekCards.forEach(card => card.remove());
             }
             
             dependencies.showToast(`Cleared ${phaseName} phase (${changeDesc.length} exercises removed).`, 'success');
             dependencies.triggerAnalyticsUpdate();
         } else {
             dependencies.showToast('Phase clearing cancelled.', 'info');
         }
         
         clearPreviewHighlight();
     }

     /**
      * Handles optimizing load distribution in a phase
      * @param {HTMLElement} phaseElement - The phase element to optimize
      */
     function handleOptimizePhaseLoad(phaseElement) {
         if (!phaseElement || !phaseElement.classList.contains('phase-bar')) {
             dependencies.showToast('Invalid phase selected.', 'warning');
             return;
         }
         
         const phaseName = phaseElement.dataset.phase || 'Phase';
         dependencies.showToast(`Phase load optimization for ${phaseName} will be implemented soon.`, 'info');
         
         // This will be implemented in a future update with more sophisticated load distribution algorithms
     }

    /**
     * Parses the raw text command from the user.
     * @param {string} text - The command text.
     * @returns {object | null} - Object with { action: string, params: object } or null if no match.
     */
    function parseCommand(text) {
        const command = text.trim().toLowerCase();
        let match;
        console.log('[ForgeAssist] Parsing command:', command);

        // Suggest Alternative: "suggest alternative for back squat"
        match = command.match(/^suggest (?:alternative|swap) for (.*)$/);
        if (match) {
            const exerciseName = match[1].trim();
            // We need the ID ideally. Try to find it.
             const exerciseId = findExerciseIdByName(exerciseName); // Case-sensitive match might fail
             if (exerciseId) {
                 return { action: 'suggestSwap', params: { exerciseId: exerciseId, exerciseName: exerciseName } };
             } else {
                  dependencies.showToast(`Could not find exercise "${exerciseName}" in library.`, 'warning');
                  return null;
             }
        }

        // Missed Session: "missed mon wk 3", "athlete missed tuesday week 1"
        match = command.match(/^(?:athlete )?missed (mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday) (?:wk|week) (\d+)$/);
        if (match) {
            const dayShort = match[1].substring(0, 3);
            if (daysOfWeek.includes(dayShort)) {
                return { action: 'handleMissedSession', params: { day: dayShort, week: parseInt(match[2], 10) } };
            }
        }

        // --- NEW COMMANDS ---
        
        // Equipment limitation: "use home basic equipment", "convert to travel equipment"
        match = command.match(/^(?:use|convert to|limit to|switch to) (commercial[ _-]?gym|home[ _-]?basic|home[ _-]?advanced|travel|minimal) (?:equipment|profile|mode)$/);
        if (match) {
            // Normalize profile name
            let profileName = match[1].toLowerCase().replace(/[ -]/g, '_');
            if (profileName === 'commercial_gym' || profileName === 'commercialgym') {
                profileName = 'commercial_gym';
            } else if (profileName === 'home_basic' || profileName === 'homebasic') {
                profileName = 'home_basic';
            } else if (profileName === 'home_advanced' || profileName === 'homeadvanced') {
                profileName = 'home_advanced';
            } 
            // travel and minimal are already correctly formatted
            
            return { action: 'equipmentLimitation', params: { profileName } };
        }
        
        // Exercise rotation: "check rotation for bench press"
        match = command.match(/^(?:check|suggest) (?:rotation|alternative) (?:for )(.+)$/);
        if (match) {
            const exerciseName = match[1].trim();
            return { action: 'checkRotation', params: { exerciseName } };
        }
        
        // Exercise tempo: "add tempo to deadlift"
        match = command.match(/^add tempo (?:to|for) (.+)$/);
        if (match) {
            const exerciseName = match[1].trim();
            return { action: 'addTempo', params: { exerciseName } };
        }
        
        // Exercise progression: "suggest progression for squat"
        match = command.match(/^(?:suggest|apply) (?:progression|progressive overload) (?:for )?(.+)$/);
        if (match) {
            const exerciseName = match[1].trim();
            return { action: 'suggestProgression', params: { exerciseName } };
        }
        
        // --- END NEW COMMANDS ---

        // --- Phase 1 & 2 Commands ---
        match = command.match(/^clear week (\d+)$/);
        if (match) return { action: 'clearWeek', params: { week: parseInt(match[1], 10) } };

        match = command.match(/^clear (mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday) (?:wk|week) (\d+)$/);
        if (match) {
            const dayShort = match[1].substring(0, 3);
            if (daysOfWeek.includes(dayShort)) {
                return { action: 'clearDay', params: { day: dayShort, week: parseInt(match[2], 10) } };
             }
         }

        match = command.match(/^shift week (\d+) (forward|back) (\d+) days?$/);
        if (match) return {
            action: 'shiftWeek',
            params: { week: parseInt(match[1], 10), direction: match[2] === 'forward' ? 1 : -1, days: parseInt(match[3], 10) }
        };

        match = command.match(/^shift (mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday) (?:wk|week) (\d+) (forward|back) (\d+) days?$/);
        if (match) {
             const dayShort = match[1].substring(0, 3);
             if (daysOfWeek.includes(dayShort)) {
                 return { action: 'shiftDay', params: { day: dayShort, week: parseInt(match[2], 10), direction: match[3] === 'forward' ? 1 : -1, days: parseInt(match[4], 10) } };
             }
         }
        // --- End Phase 1 & 2 Commands ---

        // --- Phase 3 Commands ---
        match = command.match(/^optimize (acwr|monotony|strain)$/);
        if (match) {
            return { action: 'optimizeAnalytics', params: { metric: match[1] } };
        }

        match = command.match(/^reduce load week (\d+) by (\d+)%$/);
        if (match) {
            return { 
                action: 'reduceLoad', 
                params: { 
                    week: parseInt(match[1], 10), 
                    percentage: parseInt(match[2], 10) 
                } 
            };
         }
         
        match = command.match(/^convert (mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday) (?:wk|week) (\d+) to rest day$/);
        if (match) {
            const dayShort = match[1].substring(0, 3);
            if (daysOfWeek.includes(dayShort)) {
                return { 
                    action: 'convertToRestDay', 
                    params: { 
                        day: dayShort, 
                        week: parseInt(match[2], 10) 
                    } 
                };
            }
        }
        // --- End Phase 3 Commands ---

        // Add to the parseCommand function within the match rules section
        match = command.match(/^fill week (\d+)(?: using)? (\w+)(?:[ -]?(\w+))?(?: principles| model)?$/);
        if (match) {
            const weekNumber = parseInt(match[1], 10);
            let modelType = match[2].toLowerCase();
            // Handle optional model subtype
            if (match[3]) {
                modelType = `${modelType}-${match[3].toLowerCase()}`;
            }
            return { action: 'generateWeek', params: { week: weekNumber, model: modelType } };
        }

        console.warn('[ForgeAssist] Command not recognized:', command);
        dependencies.showToast(`Command not understood: "${text}"`, 'warning');
        return null;
    }

    /**
     * Simulates and potentially executes an action after confirmation.
     * @param {string} action - The action name.
     * @param {object} params - Parameters for the action.
     * @param {Array<object>} changeDescription - Description of changes for simulation.
     * @param {string} confirmationMessage - Message for the confirm() prompt.
     */
    function simulateAndConfirm(action, params, changeDescription, confirmationMessage) {
         if (!dependencies.workCanvas) {
             console.error("[ForgeAssist] Not initialized.");
             dependencies.showToast("ForgeAssist Error: Not initialized.", "error");
             return;
         }
        
        // Set default confirmation message if none provided
        const messageToShow = confirmationMessage || `Confirm ${action}?`;

        // Enhanced simulation with improved analytics
        const impact = AdaptiveScheduler.calculateImpact(changeDescription, {});
        const impactText = `Est. Load Change: ${impact.estimatedLoadChange}, Pred. ACWR: ${impact.predictedACWR?.toFixed(2) || 'N/A'}, Pred. Monotony: ${impact.predictedMonotony?.toFixed(2) || 'N/A'}`;
        dependencies.showToast(`Impact Preview: ${impactText}`, 'info', 6000);

        applyPreviewHighlight(changeDescription);

        // Use custom confirmation modal instead of browser's native confirm()
        showConfirmationModal(messageToShow, impactText, () => {
            executeActionInternal(action, params, changeDescription); // Call the internal execution logic
        }, () => {
            dependencies.showToast('Action cancelled.', 'info');
        });
        
        // Note: We'll clear highlights after the modal's response
    }

    /**
     * Shows a custom confirmation modal for actions
     * @param {string} title - The title/message to show
     * @param {string} details - Additional details (impact, etc.)
     * @param {Function} onConfirm - Callback for confirm
     * @param {Function} onCancel - Callback for cancel
     */
    function showConfirmationModal(title, details, onConfirm, onCancel) {
        // Remove any existing modal first
        const existingModal = document.getElementById('forge-confirmation-modal');
        if (existingModal) existingModal.remove();
        
        // Create modal container
        const modal = document.createElement('div');
        modal.id = 'forge-confirmation-modal';
        modal.className = 'forge-modal';
        
        // Create modal content
        modal.innerHTML = `
            <div class="forge-modal-content">
                <div class="forge-modal-header">
                    <h3>Confirm Action</h3>
                    <span class="forge-modal-close">&times;</span>
                </div>
                <div class="forge-modal-body">
                    <p>${title}</p>
                    <div class="forge-modal-details">${details}</div>
                </div>
                <div class="forge-modal-footer">
                    <button class="forge-btn forge-btn-confirm">Confirm</button>
                    <button class="forge-btn forge-btn-cancel">Cancel</button>
                </div>
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.forge-modal-close').addEventListener('click', () => {
            modal.remove();
            clearPreviewHighlight(); 
            if (onCancel) onCancel();
        });
        
        modal.querySelector('.forge-btn-cancel').addEventListener('click', () => {
            modal.remove();
            clearPreviewHighlight();
            if (onCancel) onCancel();
        });
        
        modal.querySelector('.forge-btn-confirm').addEventListener('click', () => {
            modal.remove();
            clearPreviewHighlight();
            if (onConfirm) onConfirm();
        });
        
        // Show modal
        setTimeout(() => {
            modal.classList.add('forge-modal-show');
        }, 10);
    }

    /**
     * Internal function to execute actions *after* simulation/confirmation.
     * @param {string} action - The action identifier.
     * @param {object} params - Original parameters associated with the action/proposal.
     * @param {Array<object>} changeDescription - The detailed list of changes calculated and confirmed during simulation.
     */
    function executeActionInternal(action, params, changeDescription) {
        console.log('[ForgeAssist] Executing Action (Internal):', action, 'Params:', params);
        let cardsAffectedCount = 0;
        const totalWeeks = dependencies.getTotalWeeks();

         try {
            switch (action) {
                case 'clearWeek':
                case 'clearDay': { // Combined logic slightly
                    let targetCells;
                    let feedbackScope;
                    if (action === 'clearWeek') {
                         targetCells = dependencies.workCanvas.querySelectorAll(`.day-cell[data-week="${params.week}"]`);
                         feedbackScope = `week ${params.week}`;
                    } else { // clearDay
                         const dayCapitalized = params.day.charAt(0).toUpperCase() + params.day.slice(1);
                         const cell = dependencies.workCanvas.querySelector(`.day-cell[data-week="${params.week}"][data-day="${dayCapitalized}"]`);
                         targetCells = cell ? [cell] : [];
                         feedbackScope = `${dayCapitalized}, Wk ${params.week}`;
                    }

                    if (targetCells.length === 0 && action === 'clearDay') {
                         dependencies.showToast(`Could not find cell for ${feedbackScope}.`, 'warning');
                         break;
                    }

                    targetCells.forEach(cell => {
                        const cards = cell.querySelectorAll('.workout-card');
                        cardsAffectedCount += cards.length;
                        cards.forEach(card => card.remove());
                    });

                    if (cardsAffectedCount > 0) {
                        dependencies.showToast(`Cleared ${cardsAffectedCount} card(s) from ${feedbackScope}.`, 'info');
                        dependencies.triggerAnalyticsUpdate();
                    } else {
                        dependencies.showToast(`${feedbackScope} was already empty.`, 'info');
                    }
                    break;
                }
                 case 'shiftWeek':
                 case 'shiftDay': {
                     const cardsToMove = [];
                     let selector;
                     let feedbackScope;

                     if (action === 'shiftWeek') {
                         selector = `.day-cell[data-week="${params.week}"] .workout-card`;
                         feedbackScope = `week ${params.week}`;
                     } else { // shiftDay
                         const dayCapitalized = params.day.charAt(0).toUpperCase() + params.day.slice(1);
                          selector = `.day-cell[data-week="${params.week}"][data-day="${dayCapitalized}"] .workout-card`;
                          feedbackScope = `${params.day.toUpperCase()} Wk ${params.week}`;
                     }

                     const cards = dependencies.workCanvas.querySelectorAll(selector);
                     cardsAffectedCount = cards.length;

                     cards.forEach(card => {
                         const currentSlot = card.closest('.day-cell');
                         if (!currentSlot) return;
                         const currentDay = currentSlot.dataset.day;
                         const currentWeek = parseInt(currentSlot.dataset.week, 10);
                         const currentDayIndex = daysOfWeek.indexOf(currentDay.toLowerCase());
                         if (currentDayIndex === -1) return;

                         let targetDayIndex = currentDayIndex;
                         let weekAdjustment = 0;
                         for (let i = 0; i < params.days; i++) {
                             targetDayIndex += params.direction;
                             if (targetDayIndex < 0) { targetDayIndex = daysOfWeek.length - 1; weekAdjustment--; }
                             else if (targetDayIndex >= daysOfWeek.length) { targetDayIndex = 0; weekAdjustment++; }
                         }
                         const targetWeek = currentWeek + weekAdjustment;
                         const targetDay = daysOfWeek[targetDayIndex];
                         const targetDayCapitalized = targetDay.charAt(0).toUpperCase() + targetDay.slice(1);

                         if (targetWeek < 1 || targetWeek > totalWeeks) {
                              console.warn(`Target week ${targetWeek} out of bounds for card ${card.id}. Skipping.`);
                              cardsAffectedCount--; return;
                         }
                         const targetSlot = dependencies.workCanvas.querySelector(`.day-cell[data-week="${targetWeek}"][data-day="${targetDayCapitalized}"]`);
                         if (targetSlot) { cardsToMove.push({ card, targetSlot, id: card.id, load: card.dataset.load }); } // Include load
                         else { console.warn(`Target slot not found for card ${card.id}. Skipping.`); cardsAffectedCount--; }
                     });

                     if (cardsToMove.length > 0) {
                         cardsToMove.forEach(move => { move.targetSlot.appendChild(move.card); });
                         dependencies.showToast(`Shifted ${cardsToMove.length} card(s) from ${feedbackScope}.`, 'info');
                         dependencies.triggerAnalyticsUpdate();
                     } else if (cardsAffectedCount === 0) {
                          dependencies.showToast(`No cards found in ${feedbackScope} to shift.`, 'info');
                     } else {
                          dependencies.showToast(`Shift complete. Some cards may not have been moved if target was out of bounds.`, 'warning');
                          dependencies.triggerAnalyticsUpdate();
                     }
                     break;
                 }
                 // --- Actions added in Phase 2 ---
                 case 'suggestSwap':
                     // This action is handled directly by handleSuggestSwap and subsequent UI interaction
                     // No direct execution needed here after confirmation (which happens via UI click)
                     // handleSuggestSwap(params.exerciseId); // Already handles feedback
                     console.log('[ForgeAssist] SuggestSwap action initiated via UI.');
                     break;
                 case 'handleMissedSession':
                     // This action involves a prompt and potential follow-up actions (like shift)
                     // The actual execution (if any) is routed through routeExecution
                     // handleMissedSession(params); // Already handles feedback/prompts
                     console.log('[ForgeAssist] HandleMissedSession action initiated via UI/prompt.');
                     break;
                 // --- End Phase 2 Actions ---
                 
                 // --- Actions from Proposals (Phase 3) ---
                 case 'applyLoadReduction': {
                     // Use the precise changeDescription passed from simulateAndConfirm
                     cardsAffectedCount = 0;
                    if (!changeDescription) {
                        console.error('[ForgeAssist] changeDescription not provided for applyLoadReduction!');
                        dependencies.showToast('Internal error applying load reduction.', 'error');
                        break;
                    }
                     
                     changeDescription.forEach(change => {
                        if (change.type === 'modifyLoad' && change.cardId) {
                            const card = dependencies.workCanvas.querySelector(`#${change.cardId}`);
                            if (card) {
                                const currentLoad = parseInt(card.dataset.load || '0', 10);
                                // Ensure the change makes sense (optional check)
                                if (currentLoad === change.originalLoad) {
                                    card.dataset.load = change.newLoad.toString();
                                    cardsAffectedCount++;
                                    // TODO: Adjust other card details (sets/reps/intensity) based on load change?
                                } else {
                                     console.warn(`[ForgeAssist] Load mismatch for card ${change.cardId} during reduction. Expected ${change.originalLoad}, found ${currentLoad}. Skipping.`);
                                }
                            } else {
                                console.warn(`[ForgeAssist] Card ${change.cardId} not found during load reduction application.`);
                            }
                        }
                     });
 
                     if (cardsAffectedCount > 0) {
                         // Use params for the toast message context
                         const scopeText = params.targetDay ? `${params.targetDay.toUpperCase()}, Week ${params.targetWeek}` : `Week ${params.targetWeek}`;
                         dependencies.showToast(`Applied load reduction (${Math.abs(params.percentageChange)}%) to ${cardsAffectedCount} card(s) in ${scopeText}.`, 'success');
                         dependencies.triggerAnalyticsUpdate();
                     } else {
                         dependencies.showToast(`Load reduction applied, but no effective changes were made.`, 'info'); // Or use original message from proposal
                     }
                      break;
                 }
                 case 'applyLoadIncrease': {
                     // Use the precise changeDescription passed from simulateAndConfirm
                     cardsAffectedCount = 0;
                    if (!changeDescription) {
                        console.error('[ForgeAssist] changeDescription not provided for applyLoadIncrease!');
                        dependencies.showToast('Internal error applying load increase.', 'error');
                        break;
                    }

                     changeDescription.forEach(change => {
                        if (change.type === 'modifyLoad' && change.cardId) {
                            const card = dependencies.workCanvas.querySelector(`#${change.cardId}`);
                            if (card) {
                                const currentLoad = parseInt(card.dataset.load || '0', 10);
                                // Check if original load matches, though less critical for increases
                                if (currentLoad === change.originalLoad) {
                                    card.dataset.load = change.newLoad.toString();
                                    cardsAffectedCount++;
                                    // TODO: Adjust other card details?
                                } else {
                                     console.warn(`[ForgeAssist] Load mismatch for card ${change.cardId} during increase. Expected ${change.originalLoad}, found ${currentLoad}. Applying anyway.`);
                                     card.dataset.load = change.newLoad.toString(); // Apply even if mismatch
                                     cardsAffectedCount++; 
                                }
                            } else {
                                console.warn(`[ForgeAssist] Card ${change.cardId} not found during load increase application.`);
                            }
                        }
                    });

                    if (cardsAffectedCount > 0) {
                        // Use params for the toast message context
                        const scopeText = params.targetDay ? `${params.targetDay.toUpperCase()}, Week ${params.targetWeek}` : `Week ${params.targetWeek}`;
                        dependencies.showToast(`Applied load increase (${Math.abs(params.percentageChange)}%) to ${cardsAffectedCount} card(s) in ${scopeText}.`, 'success');
                        dependencies.triggerAnalyticsUpdate();
                    } else {
                        dependencies.showToast(`Load increase applied, but no effective changes were made.`, 'info');
                    }
                     break;
                 }
                 case 'applyRestDay': {
                    // Use the precise changeDescription passed from simulateAndConfirm
                    cardsAffectedCount = 0;
                    if (!changeDescription) {
                        console.error('[ForgeAssist] changeDescription not provided for applyRestDay!');
                        dependencies.showToast('Internal error applying rest day.', 'error');
                        break;
                    }

                     changeDescription.forEach(change => {
                        if (change.type === 'remove' && change.cardId) {
                            const card = dependencies.workCanvas.querySelector(`#${change.cardId}`);
                            if (card) {
                                card.remove();
                                cardsAffectedCount++;
                            } else {
                                 console.warn(`[ForgeAssist] Card ${change.cardId} not found during rest day application.`);
                            }
                        }
                     });
 
                      if (cardsAffectedCount > 0) {
                         const dayCapitalized = params.day.charAt(0).toUpperCase() + params.day.slice(1);
                         dependencies.showToast(`Converted ${dayCapitalized}, Week ${params.targetWeek} to a rest day (${cardsAffectedCount} cards removed).`, 'success');
                         dependencies.triggerAnalyticsUpdate();
                      } else {
                         const dayCapitalized = params.day.charAt(0).toUpperCase() + params.day.slice(1);
                          dependencies.showToast(`${dayCapitalized}, Week ${params.targetWeek} was already empty.`, 'info');
                      }
                      break;
                 }
                 case 'applyIntensityChange': {
                    // Use the precise changeDescription passed from simulateAndConfirm
                    cardsAffectedCount = 0;
                    if (!changeDescription || changeDescription.length === 0) {
                        console.error('[ForgeAssist] changeDescription not provided for applyIntensityChange!');
                        dependencies.showToast('Internal error applying intensity change.', 'error');
                        break;
                    }
                    
                    // Expecting only one change in the description for this action
                    const change = changeDescription[0]; 
                    if (change.type === 'modifyIntensity' && change.cardId) {
                        const card = dependencies.workCanvas.querySelector(`#${change.cardId}`);
                        if (card) {
                            // Apply the primary value change
                            card.dataset.loadValue = change.newValue.toString();
                            
                            // Apply the recalculated load estimate
                            card.dataset.load = change.newLoad.toString(); 
                            
                            // Update the visual details string on the card front (requires helper)
                            // This assumes a function exists to generate the details string
                            if (dependencies.updateCardDetailsString) {
                                dependencies.updateCardDetailsString(card);
                            } else {
                                // Simple fallback if helper missing - Fix for null reference error
                                const detailsElement = card.querySelector('.details');
                                if (detailsElement) {
                                    detailsElement.textContent = `Updated: ${change.loadType.toUpperCase()} ${change.newValue}`;
                                } else {
                                    console.warn(`[ForgeAssist] Could not find '.details' element on card ${change.cardId}`);
                                }
                            }
                            
                            cardsAffectedCount++;
                            const direction = change.loadChange > 0 ? 'Increased' : 'Decreased';
                            dependencies.showToast(`${direction} intensity. New ${change.loadType.toUpperCase()}: ${change.newValue}`, 'success');
                            dependencies.triggerAnalyticsUpdate();
                        } else {
                             console.warn(`[ForgeAssist] Card ${change.cardId} not found during intensity change application.`);
                              dependencies.showToast('Error applying intensity change: Card not found.', 'error');
                        }
                    } else {
                         console.error('[ForgeAssist] Invalid changeDescription format for applyIntensityChange:', change);
                         dependencies.showToast('Internal error applying intensity change format.', 'error');
                    }
                    break;
                 }
                 case 'applyDaySwap': {
                    // Use the precise changeDescription containing move details
                    cardsAffectedCount = 0;
                    if (!changeDescription || changeDescription.length === 0) {
                        // This might be okay if one or both days were empty
                        dependencies.showToast('No exercises found to swap.', 'info');
                        break;
                    }
                    
                    // Need to find the target cell elements
                    const week = params.targetWeek; 
                    const day1Name = params.day1;
                    const day2Name = params.day2;
                    const day1Cap = day1Name.charAt(0).toUpperCase() + day1Name.slice(1);
                    const day2Cap = day2Name.charAt(0).toUpperCase() + day2Name.slice(1);
                    
                    const day1Cell = dependencies.workCanvas.querySelector(`.day-cell[data-week="${week}"][data-day="${day1Cap}"]`);
                    const day2Cell = dependencies.workCanvas.querySelector(`.day-cell[data-week="${week}"][data-day="${day2Cap}"]`);

                    if (!day1Cell || !day2Cell) {
                         console.error(`[ForgeAssist] Could not find one or both cells for day swap: Wk ${week}, ${day1Cap}/${day2Cap}`);
                         dependencies.showToast('Internal error performing day swap: cells not found.', 'error');
                         break;
                    }

                    // Iterate through the move instructions and append cards to their new parents
                    changeDescription.forEach(change => {
                        if (change.type === 'move' && change.cardId) {
                            const card = dependencies.workCanvas.querySelector(`#${change.cardId}`);
                            if (card) {
                                const targetCell = (change.targetDay === day1Name) ? day1Cell : day2Cell;
                                targetCell.appendChild(card); // Move the card element
                                cardsAffectedCount++;
                            } else {
                                console.warn(`[ForgeAssist] Card ${change.cardId} not found during day swap application.`);
                            }
                        }
                    });

                    if (cardsAffectedCount > 0) {
                        dependencies.showToast(`Swapped exercises between ${day1Cap} and ${day2Cap} in Week ${week}.`, 'success');
                        dependencies.triggerAnalyticsUpdate();
                    } else {
                         dependencies.showToast('Day swap complete, but no exercises were moved.', 'info');
                    }
                    break;
                 }
                 case 'increaseLoad': { // Handles week-scope increase
                    const increaseWeek = proposal.targetWeek;
                    const increasePercentage = Math.abs(proposal.percentageChange) / 100; 
                    const increaseSign = 1; // For increase

                    let increaseSelector = `.day-cell[data-week="${increaseWeek}"] .workout-card`;
                    dependencies.workCanvas.querySelectorAll(increaseSelector).forEach(card => {
                        const currentLoad = parseInt(card.dataset.load || '0', 10);
                        const loadChange = increaseSign * Math.round(currentLoad * increasePercentage);
                        const finalLoadChange = (currentLoad === 0 && loadChange === 0) ? 10 : loadChange;
                        if (finalLoadChange !== 0) {
                             changeDescription.push({
                                type: 'modifyLoad', 
                                cardId: card.id,
                                originalLoad: currentLoad,
                                newLoad: Math.max(0, currentLoad + finalLoadChange), 
                                loadChange: finalLoadChange
                            });
                        }
                    });
                    confirmationMessage = `Increase load by ${Math.abs(proposal.percentageChange)}% for Week ${increaseWeek}?`;
                    action = 'applyLoadIncrease'; 
                    break;
                 }
                case 'increaseLowDay': { // Handles day-scope increase
                    const increaseWeek = proposal.targetWeek;
                    const increasePercentage = Math.abs(proposal.percentageChange) / 100; 
                    const increaseTargetDay = proposal.targetDay; // Only for increaseLowDay
                    const increaseSign = 1; // For increase

                    let increaseSelector = `.day-cell[data-week="${increaseWeek}"]`;
                    if (increaseTargetDay) {
                        const dayCap = increaseTargetDay.charAt(0).toUpperCase() + increaseTargetDay.slice(1);
                        increaseSelector += `[data-day="${dayCap}"]`;
                    }
                    increaseSelector += ' .workout-card';

                     dependencies.workCanvas.querySelectorAll(increaseSelector).forEach(card => {
                        const currentLoad = parseInt(card.dataset.load || '0', 10);
                        const loadChange = increaseSign * Math.round(currentLoad * increasePercentage);
                        const finalLoadChange = (currentLoad === 0 && loadChange === 0) ? 10 : loadChange; 
                        if (finalLoadChange !== 0) {
                             changeDescription.push({
                                type: 'modifyLoad', 
                                cardId: card.id,
                                originalLoad: currentLoad,
                                newLoad: Math.max(0, currentLoad + finalLoadChange), 
                                loadChange: finalLoadChange
                            });
                        }
                    });
                    const scopeText = increaseTargetDay ? `${increaseTargetDay.toUpperCase()}, Week ${increaseWeek}` : `Week ${increaseWeek}`; // Should still have scopeText logic here
                    confirmationMessage = `Increase load by ${Math.abs(proposal.percentageChange)}% for ${scopeText}?`;
                    action = 'applyLoadIncrease'; // Use a general increase action name
                    break;
                 }

                // Placeholder for other proposal types like 'varyLoad'
                case 'varyLoad':
                     // AdaptiveScheduler needs to define how to generate 'varyLoad' proposals first.
                     dependencies.showToast(`Applying suggestion type "${proposal.type}" is not yet fully implemented.`, 'info');
                     console.warn(`Handler for proposal type "${proposal.type}" not yet implemented.`);
                     return; // Don't proceed to simulation

                default:
                    console.error('[ForgeAssist] Unknown action (internal):', action);
                    dependencies.showToast(`Action "${action}" not yet implemented.`, 'error');
                    break;
            }

            if (changeDescription.length === 0 && (proposal.type === 'reduceLoad' || proposal.type === 'reduceSpecificDay' || proposal.type === 'addRestDay')) {
                dependencies.showToast('No changes needed or possible for this suggestion.', 'info');
                return; // Nothing to apply
            }

            // Use simulateAndConfirm to show preview and execute if confirmed
            // We need a way to pass the specific load modification logic to executeActionInternal
            // Let's refine simulateAndConfirm or executeActionInternal to handle this.
            simulateAndConfirm(action, params, changeDescription, confirmationMessage);

        } catch (error) {
            console.error('[ForgeAssist] Error processing proposal action:', error);
            dependencies.showToast('An error occurred while applying the suggestion.', 'error');
        }
    }


    /**
 * Entry point for executing actions based on parsed commands.
 * Routes to simulation/confirmation or directly executes simple actions.
 */
 function routeExecution(action, params) {
     console.log('[ForgeAssist] Routing Execution:', action, params);

      // Actions requiring simulation and confirmation
      const requiresConfirmation = ['clearWeek', 'clearDay', 'shiftWeek', 'shiftDay'];

      if (requiresConfirmation.includes(action)) {
            // TODO: Generate a more accurate change description based on the query
            let changeDescription = [];
            let confirmationMessage = `Confirm ${action}`;

            if (action === 'clearWeek' || action === 'clearDay') {
                 // Estimate based on finding elements - inaccurate but simple for P2
                 const dayCapitalized = params.day ? params.day.charAt(0).toUpperCase() + params.day.slice(1) : null;
                 let selector = action === 'clearWeek'
                       ? `.day-cell[data-week="${params.week}"] .workout-card`
                       : `.day-cell[data-week="${params.week}"][data-day="${dayCapitalized}"] .workout-card`;

                 const cards = dependencies.workCanvas.querySelectorAll(selector);
                 cards.forEach(card => {
                      changeDescription.push({ type: 'remove', cardId: card.id, load: card.dataset.load });
                 });
                 confirmationMessage = `Clear ${cards.length} card(s) from ${action === 'clearWeek' ? `week ${params.week}` : `${dayCapitalized} Wk ${params.week}`}?`;
            } else if (action === 'shiftWeek' || action === 'shiftDay') {
                 // Similarly estimate changes for shift - complex to do accurately here without full logic duplication
                 // Generate a more detailed description for highlighting/simulation
                 const dayCapitalized = params.day ? params.day.charAt(0).toUpperCase() + params.day.slice(1) : null;
                 let selector = action === 'shiftWeek'
                       ? `.day-cell[data-week="${params.week}"] .workout-card`
                       : `.day-cell[data-week="${params.week}"][data-day="${dayCapitalized}"] .workout-card`;
                 const cards = dependencies.workCanvas.querySelectorAll(selector);
                 cards.forEach(card => {
                     // We don't know the exact target slot here without re-calculating,
                     // so the description is limited for preview. Mark the original cards.
                     changeDescription.push({ type: 'move', cardId: card.id, load: card.dataset.load });
                 });
                 confirmationMessage = `Shift cards in ${action === 'shiftWeek' ? `week ${params.week}` : `${dayCapitalized} Wk ${params.week}`}?`;
            }

          simulateAndConfirm(action, params, changeDescription, confirmationMessage);
      } else if (action === 'generateWeek') {
          // Handle week generation by calling the appropriate function
          handleGenerateWeek(params.week, params.model);
      } else {
          // Directly execute actions that don't modify state significantly or handle their own interaction
          executeActionInternal(action, params, []);
      }
 }

     /**
      * Handles the workflow for a missed session.
      * Phase 2: Basic options (Skip, Shift).
      */
     function handleMissedSession(params) {
         const { day, week } = params;
         const dayCapitalized = day.charAt(0).toUpperCase() + day.slice(1);
         const promptMessage = `Athlete missed session on ${dayCapitalized}, Wk ${week}. How to proceed?`;
         const options = "[1] Skip Session\n[2] Shift Session +1 Day"; // Add more later

         const choice = prompt(`${promptMessage}\n\n${options}`);

         if (choice === '1') {
             dependencies.showToast(`Okay, skipping session for ${dayCapitalized}, Wk ${week}. Consider manual adjustments if needed.`, 'info');
             // In future, could slightly reduce load in subsequent sessions automatically.
         } else if (choice === '2') {
             dependencies.showToast(`Okay, attempting to shift session from ${dayCapitalized}, Wk ${week} forward 1 day...`, 'info');
             // Use existing shift logic - requires simulation/confirmation via routing
             routeExecution('shiftDay', { day: day, week: week, direction: 1, days: 1 });
         } else {
             dependencies.showToast('Missed session handling cancelled.', 'info');
         }
     }


    /**
     * Processes a command from the user input.
     * @param {string} commandText - The raw command text.
     * @returns {Promise<string>} - Promise resolving to a response message.
     */
    function processCommand(commandText) {
        console.log('[ForgeAssist] Processing command:', commandText);
        
        // Parse the command to get structured action and params
        const parsedCommand = parseCommand(commandText);
        
        if (!parsedCommand) {
            return Promise.resolve("I don't understand that command. Try something like 'suggest alternative for squat' or 'missed monday week 2'.");
        }
        
        // Execute based on action
        switch (parsedCommand.action) {
            case 'suggestSwap':
                return handleSuggestSwap(parsedCommand.params.exerciseId).then(message => message || `Suggesting alternatives for ${parsedCommand.params.exerciseName}...`);
            
            case 'handleMissedSession':
                return handleMissedSession(parsedCommand.params).then(message => message || `Processing missed session for ${parsedCommand.params.day}, week ${parsedCommand.params.week}...`);
            
            case 'clearWeek':
            case 'clearDay':
            case 'shiftWeek':
            case 'shiftDay':
            case 'optimizeAnalytics':
            case 'reduceLoad':
            case 'convertToRestDay':
                // Use existing internal handlers
                return Promise.resolve(`Processing ${parsedCommand.action}...`);
                
            // --- NEW COMMAND HANDLERS ---
            case 'equipmentLimitation':
                handleEquipmentLimitation(parsedCommand.params.profileName);
                return Promise.resolve(`Processing equipment limitations for ${parsedCommand.params.profileName.replace('_', ' ')} setup...`);
                
            case 'checkRotation':
                return Promise.resolve(handleExerciseRotationCommand(parsedCommand.params.exerciseName));
                
            case 'addTempo':
                const card = findExerciseCardByName(parsedCommand.params.exerciseName);
                if (card) {
                    handleAddTempoCue(card);
                    return Promise.resolve(`Adding tempo options for ${parsedCommand.params.exerciseName}...`);
                } else {
                    return Promise.resolve(`Could not find a card for "${parsedCommand.params.exerciseName}" on the current view.`);
                }
                
            case 'suggestProgression':
                const progressionCard = findExerciseCardByName(parsedCommand.params.exerciseName);
                if (progressionCard) {
                    handleSuggestProgression(progressionCard);
                    return Promise.resolve(`Finding progression options for ${parsedCommand.params.exerciseName}...`);
                } else {
                    return Promise.resolve(`Could not find a card for "${parsedCommand.params.exerciseName}" on the current view.`);
                }
            // --- END NEW COMMAND HANDLERS ---
                
            default:
                return Promise.resolve("I don't know how to do that yet.");
        }
    }
    
    /**
     * Helper function to find an exercise card in the current view by name.
     * @param {string} exerciseName - The name of the exercise to find.
     * @returns {HTMLElement|null} - The card element if found, null otherwise.
     */
    function findExerciseCardByName(exerciseName) {
        if (!dependencies.workCanvas) return null;
        
        const cards = dependencies.workCanvas.querySelectorAll('.workout-card');
        for (const card of cards) {
            const nameElement = card.querySelector('.exercise-name');
            if (nameElement && nameElement.textContent.toLowerCase() === exerciseName.toLowerCase()) {
                return card;
            }
        }
        
        return null;
    }

    // --- Preview Highlighting Helpers ---
    const PREVIEW_CLASS = 'forge-assist-preview-highlight';

    function applyPreviewHighlight(changes) {
        clearPreviewHighlight(); // Clear previous highlights first
        console.log('[ForgeAssist] Applying preview highlight for:', changes);
        changes.forEach(change => {
            if (change.cardId) {
                const cardElement = dependencies.workCanvas?.querySelector(`#${change.cardId}`);
                if (cardElement) {
                    cardElement.classList.add(PREVIEW_CLASS);
                    // Highlight source cell if removing/moving
                    if (change.type === 'remove' || change.type === 'move') {
                        cardElement.closest('.day-cell')?.classList.add(PREVIEW_CLASS);
                    }
                } else {
                    console.warn(`[ForgeAssist] Preview: Could not find card element with ID ${change.cardId}`);
                }
            }
            // TODO: Add highlighting for target cells if adding/moving (needs targetSlotId in description)
        });
    }

    function clearPreviewHighlight() {
        dependencies.workCanvas?.querySelectorAll(`.${PREVIEW_CLASS}`).forEach(el => {
            el.classList.remove(PREVIEW_CLASS);
        });
    }
    // --- End Preview Highlighting ---

    // --- Proactive Analytics Checks ---

    /**
     * Checks analytics data against thresholds and provides proactive suggestions.
     * @param {object} analyticsData - Data from the analytics module (ACWR, monotony, etc.)
     */
    function checkAnalyticsThresholds(analyticsData) {
        console.log('[ForgeAssist] Checking analytics thresholds:', analyticsData);
        
        // Skip if no analytics data available
        if (!analyticsData) return;
        
        // Get user's custom thresholds or defaults
        const thresholds = getUserAnalyticsThresholds();
        
        const proposals = [];
        
        // Check ACWR
        if (analyticsData.acwr) {
            const acwr = analyticsData.acwr.ratio;
            if (acwr > thresholds.highAcwr) {
                console.log(`[ForgeAssist] High ACWR detected: ${acwr.toFixed(2)} (threshold: ${thresholds.highAcwr})`);
                
                // Get proposals for high ACWR
                const acwrProposals = AdaptiveScheduler.proposeAdjustments('highACWR', {
                    acwr: acwr,
                    chronic: analyticsData.acwr.chronic || 0,
                    acute: analyticsData.acwr.acute || 0,
                    currentLoads: analyticsData.dailyLoads || []
                });
                
                proposals.push(...acwrProposals);
            } else if (acwr < thresholds.lowAcwr) {
                console.log(`[ForgeAssist] Low ACWR detected: ${acwr.toFixed(2)} (threshold: ${thresholds.lowAcwr})`);
                
                // Get proposals for low ACWR
                const acwrProposals = AdaptiveScheduler.proposeAdjustments('lowACWR', {
                    acwr: acwr,
                    chronic: analyticsData.acwr.chronic || 0,
                    acute: analyticsData.acwr.acute || 0,
                    currentLoads: analyticsData.dailyLoads || []
                });
                
                proposals.push(...acwrProposals);
            }
        }
        
        // Check Monotony
        if (analyticsData.monotony) {
            const monotony = analyticsData.monotony.value;
            if (monotony > thresholds.highMonotony) {
                console.log(`[ForgeAssist] High Monotony detected: ${monotony.toFixed(2)} (threshold: ${thresholds.highMonotony})`);
                
                // Get proposals for high monotony
                const monotonyProposals = AdaptiveScheduler.proposeAdjustments('highMonotony', {
                    monotony: monotony,
                    currentLoads: analyticsData.dailyLoads || []
                });
                
                proposals.push(...monotonyProposals);
            }
        }
        
        // Check Strain
        if (analyticsData.strain) {
            const strain = analyticsData.strain.value;
            if (strain > thresholds.highStrain) {
                console.log(`[ForgeAssist] High Strain detected: ${strain.toFixed(0)} (threshold: ${thresholds.highStrain})`);
                
                // Get proposals for high strain
                const strainProposals = AdaptiveScheduler.proposeAdjustments('highStrain', {
                    strain: strain,
                    currentLoads: analyticsData.dailyLoads || []
                });
                
                proposals.push(...strainProposals);
            }
        }
        
        // If we have proposals, display them to the user
        if (proposals.length > 0) {
            displayProposals(proposals);
        }
    }

    /**
     * Displays proposals to the user via toast notifications with actionable buttons.
     * @param {Array<object>} proposals - Array of proposal objects from AdaptiveScheduler.
     */
    function displayProposals(proposals) {
        // Simple display for now: show the first few proposals in a single toast
        let proposalHtml = '<div class="assist-proposals"><strong>ForgeAssist Suggestions:</strong><ul>';
        const maxProposalsToShow = 3;

        proposals.slice(0, maxProposalsToShow).forEach((proposal, index) => {
            // Ensure description exists
            const description = proposal.description || `${proposal.type} (details pending)`;
            // Simple unique ID for the button based on index
            const proposalId = `proposal-${Date.now()}-${index}`; 
            
            proposalHtml += `<li>
                ${description}
                <button class="cta-button primary-cta proposal-action-btn" 
                        data-proposal-id="${proposalId}" 
                        data-proposal-type="${proposal.type}"
                        style="margin-left: 10px; padding: 2px 5px; font-size: 0.8rem;">
                    Apply
                </button>
            </li>`;
            
            // Store proposal details temporarily (in a real app, use a more robust state management)
            window._forgeAssistProposals = window._forgeAssistProposals || {};
            window._forgeAssistProposals[proposalId] = proposal; 
        });

        proposalHtml += '</ul></div>';
        dependencies.showToast(proposalHtml, 'info', 20000); // Longer duration for interaction

        // Add event listeners to the newly created buttons
        // Use event delegation on a stable parent if possible, otherwise setTimeout is needed
         setTimeout(() => {
             document.querySelectorAll('.proposal-action-btn').forEach(btn => {
                 btn.addEventListener('click', handleProposalActionClick);
             });
         }, 100); // Wait briefly for toast to render
    }
    
    /**
     * Handles the click event on a proposal action button.
     * @param {Event} event - The click event.
     */
    function handleProposalActionClick(event) {
        const button = event.target;
        const proposalId = button.dataset.proposalId;
        
        // Retrieve the proposal details
        const proposal = window._forgeAssistProposals ? window._forgeAssistProposals[proposalId] : null;
        
        if (proposal) {
            console.log('[ForgeAssist] Handling proposal action:', proposal);
            handleProposalAction(proposal); // Pass the full proposal object
            
            // Optional: Remove the specific proposal or the whole toast
            const toast = button.closest('.toast');
            if (toast) {
                 toast.classList.remove('show');
                 toast.classList.add('hide');
                 setTimeout(() => toast.remove(), 300);
            }
            // Clean up stored proposal
             delete window._forgeAssistProposals[proposalId];
        } else {
            console.error(`[ForgeAssist] Could not find proposal data for ID: ${proposalId}`);
            dependencies.showToast('Error applying suggestion.', 'error');
        }
        
        // Prevent default button behavior if any
        event.preventDefault();
    }

    /**
     * Executes the action defined by a chosen proposal.
     * @param {object} proposal - The proposal object selected by the user.
     */
    function handleProposalAction(proposal) {
        console.log('[ForgeAssist] Executing Proposal Action:', proposal);
        let changeDescription = [];
        let confirmationMessage = `Apply suggestion: ${proposal.description || proposal.type}?`;
        let action = proposal.type; // Use proposal type as the action for simulation/execution
        let params = { ...proposal }; // Pass proposal details as params

        // Generate changeDescription and confirmation message based on proposal type
        try {
            switch (proposal.type) {
                case 'reduceLoad':
                case 'reduceSpecificDay':
                    // Need to find the actual cards and calculate the reduction
                    const week = proposal.targetWeek;
                    // Use Math.abs because proposeLoadChange stores the original sign
                    const percentage = Math.abs(proposal.percentageChange) / 100; 
                    const targetDay = proposal.targetDay; // Only for reduceSpecificDay
                    const changeSign = -1; // For reduction

                    let cardsToModify = [];
                    let selector = `.day-cell[data-week="${week}"]`;
                    if (targetDay) {
                        const dayCapitalized = targetDay.charAt(0).toUpperCase() + targetDay.slice(1);
                        selector += `[data-day="${dayCapitalized}"]`;
                    }
                    selector += ' .workout-card';

                    dependencies.workCanvas.querySelectorAll(selector).forEach(card => {
                        const currentLoad = parseInt(card.dataset.load || '0', 10);
                        if (currentLoad > 0) {
                             // Calculate change based on original percentage, apply correct sign
                            const loadChange = changeSign * Math.round(currentLoad * percentage);
                            if (loadChange !== 0) {
                                changeDescription.push({
                                    type: 'modifyLoad', // Specific type for clarity
                                    cardId: card.id,
                                    originalLoad: currentLoad,
                                    newLoad: Math.max(0, currentLoad + loadChange), // Ensure not negative
                                    loadChange: loadChange
                                });
                            }
                        }
                    });
                    confirmationMessage = `Reduce load by ${Math.abs(proposal.percentageChange)}% for ${targetDay ? targetDay.toUpperCase() + ',' : ''} Week ${week}?`;
                    action = 'applyLoadReduction'; // More specific action name
                    break;
                
                 case 'increaseLoad': { // Handles week-scope increase
                    const increaseWeek = proposal.targetWeek;
                    const increasePercentage = Math.abs(proposal.percentageChange) / 100; 
                    const increaseSign = 1; // For increase

                    let increaseSelector = `.day-cell[data-week="${increaseWeek}"] .workout-card`;
                    dependencies.workCanvas.querySelectorAll(increaseSelector).forEach(card => {
                        const currentLoad = parseInt(card.dataset.load || '0', 10);
                        const loadChange = increaseSign * Math.round(currentLoad * increasePercentage);
                        const finalLoadChange = (currentLoad === 0 && loadChange === 0) ? 10 : loadChange;
                        if (finalLoadChange !== 0) {
                             changeDescription.push({
                                type: 'modifyLoad', 
                                cardId: card.id,
                                originalLoad: currentLoad,
                                newLoad: Math.max(0, currentLoad + finalLoadChange), 
                                loadChange: finalLoadChange
                            });
                        }
                    });
                    confirmationMessage = `Increase load by ${Math.abs(proposal.percentageChange)}% for Week ${increaseWeek}?`;
                    action = 'applyLoadIncrease'; 
                    break;
                 }
                case 'increaseLowDay': { // Handles day-scope increase
                    const increaseWeek = proposal.targetWeek;
                    const increasePercentage = Math.abs(proposal.percentageChange) / 100; 
                    const increaseTargetDay = proposal.targetDay; // Only for increaseLowDay
                    const increaseSign = 1; // For increase

                    let increaseSelector = `.day-cell[data-week="${increaseWeek}"]`;
                    if (increaseTargetDay) {
                        const dayCap = increaseTargetDay.charAt(0).toUpperCase() + increaseTargetDay.slice(1);
                        increaseSelector += `[data-day="${dayCap}"]`;
                    }
                    increaseSelector += ' .workout-card';

                     dependencies.workCanvas.querySelectorAll(increaseSelector).forEach(card => {
                        const currentLoad = parseInt(card.dataset.load || '0', 10);
                        const loadChange = increaseSign * Math.round(currentLoad * increasePercentage);
                        const finalLoadChange = (currentLoad === 0 && loadChange === 0) ? 10 : loadChange; 
                        if (finalLoadChange !== 0) {
                             changeDescription.push({
                                type: 'modifyLoad', 
                                cardId: card.id,
                                originalLoad: currentLoad,
                                newLoad: Math.max(0, currentLoad + finalLoadChange), 
                                loadChange: finalLoadChange
                            });
                        }
                    });
                    const scopeText = increaseTargetDay ? `${increaseTargetDay.toUpperCase()}, Week ${increaseWeek}` : `Week ${increaseWeek}`; // Should still have scopeText logic here
                    confirmationMessage = `Increase load by ${Math.abs(proposal.percentageChange)}% for ${scopeText}?`;
                    action = 'applyLoadIncrease'; // Use a general increase action name
                    break;
                 }

                case 'addRestDay':
                    // AdaptiveScheduler should have determined the best day if not specified
                    // For now, assume the proposal includes the day to clear
                    const restDayWeek = proposal.targetWeek;
                    let restDayDay = proposal.day; // Day determined by AdaptiveScheduler

                    if (!restDayDay) {
                        // Fallback or ask AdaptiveScheduler again? Simple fallback for now.
                         console.warn('[ForgeAssist] AddRestDay proposal missing specific day. Cannot execute.');
                         dependencies.showToast('Cannot determine which day to make a rest day.', 'warning');
                         return; // Cannot proceed
                    }

                    const restDayCapitalized = restDayDay.charAt(0).toUpperCase() + restDayDay.slice(1);
                    const restDaySelector = `.day-cell[data-week="${restDayWeek}"][data-day="${restDayCapitalized}"] .workout-card`;

                    dependencies.workCanvas.querySelectorAll(restDaySelector).forEach(card => {
                        changeDescription.push({
                            type: 'remove',
                            cardId: card.id,
                            load: card.dataset.load || '0'
                        });
                    });
                    confirmationMessage = `Convert ${restDayCapitalized}, Week ${restDayWeek} to a rest day (removes ${changeDescription.length} exercises)?`;
                    action = 'applyRestDay'; // Specific action name
                    break;

                case 'swapDays': {
                    const week = proposal.targetWeek;
                    const day1Name = proposal.day1;
                    const day2Name = proposal.day2;
                    const day1Cap = day1Name.charAt(0).toUpperCase() + day1Name.slice(1);
                    const day2Cap = day2Name.charAt(0).toUpperCase() + day2Name.slice(1);
                    
                    // Find all cards and their loads on each day
                    let day1Cards = [];
                    let day2Cards = [];
                    let day1TotalLoad = 0;
                    let day2TotalLoad = 0;
                    
                    const day1Selector = `.day-cell[data-week="${week}"][data-day="${day1Cap}"] .workout-card`;
                    dependencies.workCanvas.querySelectorAll(day1Selector).forEach(card => {
                        const load = parseInt(card.dataset.load || '0', 10);
                        day1Cards.push({ id: card.id, load: load });
                        day1TotalLoad += load;
                    });
                    
                    const day2Selector = `.day-cell[data-week="${week}"][data-day="${day2Cap}"] .workout-card`;
                      dependencies.workCanvas.querySelectorAll(day2Selector).forEach(card => {
                         const load = parseInt(card.dataset.load || '0', 10);
                         day2Cards.push({ id: card.id, load: load });
                         day2TotalLoad += load;
                     });
                     
                     // Create change description: moving cards from day1 to day2 and vice versa
                     day1Cards.forEach(cardInfo => {
                         changeDescription.push({
                             type: 'move', // Indicate a move for potential highlighting
                             cardId: cardInfo.id,
                             originalDay: day1Name,
                             targetDay: day2Name,
                             week: week,
                             load: cardInfo.load
                         });
                     });
                     day2Cards.forEach(cardInfo => {
                         changeDescription.push({
                             type: 'move',
                             cardId: cardInfo.id,
                             originalDay: day2Name,
                             targetDay: day1Name,
                             week: week,
                             load: cardInfo.load
                         });
                     });

                    confirmationMessage = `Swap all exercises between ${day1Cap} and ${day2Cap} in Week ${week}?`;
                    action = 'applyDaySwap'; // Specific action name
                    break;
                }

                // Placeholder for other proposal types like 'varyLoad'
                case 'varyLoad':
                     // AdaptiveScheduler needs to define how to generate 'varyLoad' proposals first.
                     dependencies.showToast(`Applying suggestion type "${proposal.type}" is not yet fully implemented.`, 'info');
                     console.warn(`Handler for proposal type "${proposal.type}" not yet implemented.`);
                     return; // Don't proceed to simulation

                default:
                    console.warn(`[ForgeAssist] Unknown proposal type in handleProposalAction: ${proposal.type}`);
                    dependencies.showToast(`Cannot apply unknown suggestion type: ${proposal.type}`, 'warning');
                    return; // Don't proceed
            }

            if (changeDescription.length === 0 && (proposal.type === 'reduceLoad' || proposal.type === 'reduceSpecificDay' || proposal.type === 'addRestDay')) {
                dependencies.showToast('No changes needed or possible for this suggestion.', 'info');
                return; // Nothing to apply
            }

            // Use simulateAndConfirm to show preview and execute if confirmed
            // We need a way to pass the specific load modification logic to executeActionInternal
            // Let's refine simulateAndConfirm or executeActionInternal to handle this.
            const confirmMessage = `Confirm applying suggestion: ${proposal.title || proposal.type}?`;
            simulateAndConfirm(action, params, changeDescription, confirmMessage);

        } catch (error) {
            console.error('[ForgeAssist] Error processing proposal action:', error);
            dependencies.showToast('An error occurred while applying the suggestion.', 'error');
        }
    }
    
    /**
     * Previews the effect of a load reduction proposal.
     * (Placeholder - needs implementation)
     * @param {object} reductionDetails - Details from AdaptiveScheduler.proposeLoadReduction.
     */
    function showLoadReductionPreview(reductionDetails) {
        console.log('[ForgeAssist] Showing Load Reduction Preview:', reductionDetails);

        // 1. Generate changeDescription from reductionDetails (assuming it has a 'changes' property)
        const changeDescription = reductionDetails.changes || [];
        if (changeDescription.length === 0) {
            console.warn('[ForgeAssist] No changes specified in load reduction details.');
            dependencies.showToast('Preview unavailable: No specific changes proposed.', 'warning');
            return;
        }

        // 2. Apply preview highlighting
        applyPreviewHighlight(changeDescription);

        // 3. Calculate impact
        const impact = AdaptiveScheduler.calculateImpact(changeDescription, {});
        const impactText = `Est. Load Change: ${impact.estimatedLoadChange}, Pred. ACWR: ${impact.predictedACWR?.toFixed(2) || 'N/A'}, Pred. Monotony: ${impact.predictedMonotony?.toFixed(2) || 'N/A'}`;

        // 4. Show confirmation toast with Apply button
        const proposalId = `proposal-${Date.now()}-loadredux`; // Unique ID for this preview
        const description = reductionDetails.description || 'Proposed load reduction';
        const proposalHtml = `
            <div class="assist-proposals">
                <strong>Preview:</strong> ${description}<br>
                <small>Impact: ${impactText}</small>
                <button class="cta-button primary-cta proposal-action-btn"
                        data-proposal-id="${proposalId}"
                        style="margin-left: 10px; padding: 2px 5px; font-size: 0.8rem;">
                    Apply
                </button>
                 <button class="cta-button secondary-cta proposal-cancel-btn" 
                         data-toast-dismiss="true"
                         style="margin-left: 5px; padding: 2px 5px; font-size: 0.8rem;">
                     Cancel
                 </button>
            </div>`;

        // Store the proposal details for the button handler
        window._forgeAssistProposals = window._forgeAssistProposals || {};
        window._forgeAssistProposals[proposalId] = reductionDetails;

        dependencies.showToast(proposalHtml, 'info', 20000); // Longer duration

        // Add event listeners
        setTimeout(() => {
            const toastElement = document.querySelector(`.toast [data-proposal-id="${proposalId}"]`)?.closest('.toast');
            if (!toastElement) return;

            const applyBtn = toastElement.querySelector('.proposal-action-btn');
            const cancelBtn = toastElement.querySelector('.proposal-cancel-btn');

            if (applyBtn) {
                applyBtn.addEventListener('click', (e) => {
                    handleProposalActionClick(e); // Use existing handler
                    clearPreviewHighlight(); // Clear highlight on apply
                });
            }
             if (cancelBtn) {
                 cancelBtn.addEventListener('click', () => {
                     clearPreviewHighlight(); // Clear highlight on cancel
                     // Toast dismissal is handled by showToast's internal logic or the button's data attribute
                 });
             }

            // Optional: Add listener to clear highlight if toast is dismissed manually
            // Requires modification to showToast or observing toast removal
        }, 100);
    }
    
    /**
     * Previews the effect of inserting a rest day.
     * (Placeholder - needs implementation)
     * @param {object} restDayDetails - Details from AdaptiveScheduler.proposeRestDayInsertion.
     */
    function showRestDayInsertionPreview(restDayDetails) {
        console.log('[ForgeAssist] Showing Rest Day Insertion Preview:', restDayDetails);

        // 1. Generate changeDescription (assuming restDayDetails.changes exists)
        const changeDescription = restDayDetails.changes || [];
         if (changeDescription.length === 0 && !restDayDetails.day) { // Need at least changes or the target day
            console.warn('[ForgeAssist] No changes or target day specified in rest day details.');
            dependencies.showToast('Preview unavailable: No specific changes or target day proposed.', 'warning');
            return;
        }
        
        // If changes weren't pre-calculated, calculate them now based on target day/week
        if (changeDescription.length === 0 && restDayDetails.day && restDayDetails.targetWeek) {
             const dayCapitalized = restDayDetails.day.charAt(0).toUpperCase() + restDayDetails.day.slice(1);
             const selector = `.day-cell[data-week="${restDayDetails.targetWeek}"][data-day="${dayCapitalized}"] .workout-card`;
             dependencies.workCanvas.querySelectorAll(selector).forEach(card => {
                 changeDescription.push({
                     type: 'remove',
                     cardId: card.id,
                     load: card.dataset.load || '0'
                 });
             });
             // Mutate the original object? Or create a copy? Let's add it for consistency.
             restDayDetails.changes = changeDescription; 
        }

        // 2. Apply preview highlighting (will highlight cards to be removed)
        applyPreviewHighlight(changeDescription);

        // 3. Calculate impact
        const impact = AdaptiveScheduler.calculateImpact(changeDescription, {});
        const impactText = `Est. Load Change: ${impact.estimatedLoadChange}, Pred. ACWR: ${impact.predictedACWR?.toFixed(2) || 'N/A'}, Pred. Monotony: ${impact.predictedMonotony?.toFixed(2) || 'N/A'}`;

        // 4. Show confirmation toast
        const proposalId = `proposal-${Date.now()}-restday`;
        const description = restDayDetails.description || `Insert rest day on ${restDayDetails.day?.toUpperCase()} Wk ${restDayDetails.targetWeek}`;
         const proposalHtml = `
            <div class="assist-proposals">
                <strong>Preview:</strong> ${description}<br>
                <small>Impact: ${impactText}</small>
                <button class="cta-button primary-cta proposal-action-btn"
                        data-proposal-id="${proposalId}"
                        style="margin-left: 10px; padding: 2px 5px; font-size: 0.8rem;">
                    Apply
                </button>
                 <button class="cta-button secondary-cta proposal-cancel-btn" 
                         data-toast-dismiss="true"
                         style="margin-left: 5px; padding: 2px 5px; font-size: 0.8rem;">
                     Cancel
                 </button>
            </div>`;

        // Store details
        window._forgeAssistProposals = window._forgeAssistProposals || {};
        window._forgeAssistProposals[proposalId] = restDayDetails;

        dependencies.showToast(proposalHtml, 'info', 20000);

        // Add event listeners
         setTimeout(() => {
            const toastElement = document.querySelector(`.toast [data-proposal-id="${proposalId}"]`)?.closest('.toast');
            if (!toastElement) return;

            const applyBtn = toastElement.querySelector('.proposal-action-btn');
            const cancelBtn = toastElement.querySelector('.proposal-cancel-btn');

            if (applyBtn) {
                applyBtn.addEventListener('click', (e) => {
                    handleProposalActionClick(e); // Use existing handler
                    clearPreviewHighlight();
                });
            }
             if (cancelBtn) {
                 cancelBtn.addEventListener('click', () => {
                     clearPreviewHighlight(); 
                 });
             }
        }, 100);
    }

    /**
     * Handles adding a technique cue to a workout card.
     * @param {HTMLElement} cardElement - The selected workout card element.
     */
    function handleAddTechniqueCue(cardElement) {
        if (!cardElement || !cardElement.classList.contains('workout-card')) {
            dependencies.showToast('Please select a workout card first.', 'warning');
            return;
        }

        try {
            const exerciseName = cardElement.querySelector('.exercise-name')?.textContent || 'Exercise';
            const currentCue = cardElement.dataset.techniqueCue || '';
            
            const newCue = prompt(`Enter technique cue for ${exerciseName}:\n(Leave blank to clear)`, currentCue);

            if (newCue !== null) { // Prompt not cancelled
                const trimmedCue = newCue.trim();
                if (trimmedCue) {
                    cardElement.dataset.techniqueCue = trimmedCue;
                    dependencies.showToast(`Technique cue added to ${exerciseName}.`, 'success');
                     // Optionally update visual details if a field exists for cues
                     if(dependencies.updateCardDetailsString) {
                         dependencies.updateCardDetailsString(cardElement);
                     }
                } else {
                    delete cardElement.dataset.techniqueCue; // Remove attribute if cleared
                    dependencies.showToast(`Technique cue cleared for ${exerciseName}.`, 'info');
                     if(dependencies.updateCardDetailsString) {
                         dependencies.updateCardDetailsString(cardElement);
                     }
                }
                
                // Save state if the function is available
                if (dependencies.triggerSaveState) {
                    dependencies.triggerSaveState(); // Save the change
                }
            } else {
                dependencies.showToast('Add technique cue cancelled.', 'info');
            }
        } catch (error) {
            console.error('[ForgeAssist] Error handling technique cue:', error);
            dependencies.showToast('Error adding technique cue.', 'error');
        }
    }

    /**
     * Handles suggesting progressions for a selected workout card.
     * @param {HTMLElement} cardElement - The selected workout card element.
     */
    function handleSuggestProgression(cardElement) {
        if (!cardElement || !cardElement.classList.contains('workout-card')) {
            dependencies.showToast('Please select a workout card first.', 'warning');
            return;
        }

        const exerciseName = cardElement.querySelector('.exercise-name')?.textContent || 'Exercise';
        const exerciseId = findExerciseIdByName(exerciseName); 

        if (!exerciseId) {
            dependencies.showToast(`Could not identify exercise "${exerciseName}" for progression suggestions.`, 'warning');
            return;
        }

        // Extract current details from the card's dataset
        const currentDetails = {
            sets: parseInt(cardElement.dataset.sets, 10) || 0,
            reps: cardElement.dataset.reps || '0',
            loadType: cardElement.dataset.loadType || 'text',
            loadValue: cardElement.dataset.loadValue || '0'
        };

        try {
            // Check if AdaptiveScheduler is accessible and has the required method
            if (!AdaptiveScheduler || typeof AdaptiveScheduler.proposeExerciseProgression !== 'function') {
                dependencies.showToast('Progression suggestions feature is not available.', 'warning');
                console.error('[ForgeAssist] AdaptiveScheduler or proposeExerciseProgression not found');
                return;
            }

            const suggestions = AdaptiveScheduler.proposeExerciseProgression(exerciseId, currentDetails);

            if (suggestions && suggestions.length > 0) {
                let suggestionsHtml = `<strong>Progression Ideas for ${exerciseName}:</strong><ul>`;
                suggestions.forEach(sugg => {
                    suggestionsHtml += `<li>${sugg}</li>`;
                });
                suggestionsHtml += '</ul>';
                dependencies.showToast(suggestionsHtml, 'info', 10000); // Show toast longer
            } else {
                dependencies.showToast(`No specific progression suggestions found for ${exerciseName}.`, 'info');
            }
        } catch (error) {
            console.error('[ForgeAssist] Error generating progression suggestions:', error);
            dependencies.showToast(`Could not generate progression suggestions: ${error.message}`, 'error');
        }
    }

    /**
     * Updates the user's progress state, typically after completing an exercise.
     * Currently, this records the exercise in the biomechanical analyzer.
     * @param {string} exerciseName - The name of the completed exercise.
     * @param {object} stressMap - The estimated stress map for the exercise.
     */
    function updateProgressState(exerciseName, stressMap = {}) {
        if (!biomechanicalAnalyzer) {
            console.error('[ForgeAssist] Biomechanical Analyzer not initialized. Cannot update progress.');
            dependencies.showToast('Error updating progress state.', 'error');
            return;
        }
        try {
            console.log(`[ForgeAssist.updateProgressState] Recording exercise: ${exerciseName}`);
            biomechanicalAnalyzer.recordExercise(exerciseName, stressMap);
            // Optionally, save history immediately or rely on periodic saves
            // biomechanicalAnalyzer.saveHistory(); 
            dependencies.showToast(`Recorded ${exerciseName} for recovery tracking.`, 'info');
            // Future: Could also interact with a ProgressionSystem if integrated.
        } catch (error) {
            console.error('[ForgeAssist] Error recording exercise in updateProgressState:', error);
            dependencies.showToast('Error recording exercise.', 'error');
        }
    }

    /**
     * Clears the current selection context within ForgeAssist.
     */
    function clearContext() {
        console.log('[ForgeAssist.clearContext] Clearing selection context.');
        currentContext = {
            selectedElement: null,
            selectedElements: new Set(),
        };
        
        // Log the cleared state for debugging
        console.log('[ForgeAssist.clearContext] Context cleared successfully.');
        
        return { success: true, message: 'Context cleared successfully' };
    }
    
    /**
     * Simulates the impact of performing a single session on a given day.
     * Calculates the session load and predicts the effect on analytics (e.g., ACWR).
     * @param {number} week - The week number of the session.
     * @param {string} day - The day of the week (e.g., "Mon", "Tue").
     */
    function simulateOneSession(week, day) {
        if (!dependencies.workCanvas || !AdaptiveScheduler || !dependencies.calculateCardLoad) {
            console.error('[ForgeAssist] Missing dependencies for session simulation.');
            dependencies.showToast('Simulation unavailable: Missing components.', 'warning');
            return;
        }
        
        const dayCapitalized = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
        const selector = `.day-cell[data-week="${week}"][data-day="${dayCapitalized}"] .workout-card`;
        const cards = dependencies.workCanvas.querySelectorAll(selector);

        if (cards.length === 0) {
            dependencies.showToast(`No exercises found for ${dayCapitalized}, Week ${week} to simulate.`, 'info');
            return;
        }

        let sessionTotalLoad = 0;
        let exercisesInSession = [];
        const changeDescription = [];

        cards.forEach(card => {
            // Ensure it's not a placeholder before calculating load
            if (card.dataset.isPlaceholder !== 'true') {
                const cardLoad = dependencies.calculateCardLoad(card.dataset);
                sessionTotalLoad += cardLoad;
                exercisesInSession.push(card.querySelector('.exercise-name')?.textContent || 'Unknown Exercise');
                
                // Create a change description entry for simulation
                // Assuming simulation treats this as adding load
                changeDescription.push({
                    type: 'add', // Or 'simulate_perform' if scheduler supports it
                    cardId: card.id, // Use cardId for reference if needed
                    loadChange: cardLoad, // Simulate adding this load
                    week: week, // Context for scheduler
                    day: day.toLowerCase() 
                });
            }
        });

        if (sessionTotalLoad === 0 && changeDescription.length === 0) {
             dependencies.showToast(`Session for ${dayCapitalized}, Week ${week} contains only placeholders or has zero load.`, 'info');
             return;
        }
        
        console.log(`[ForgeAssist.simulateOneSession] Simulating ${dayCapitalized} Wk ${week}. Load: ${sessionTotalLoad}, Exercises: ${exercisesInSession.join(', ')}`);

        // Use AdaptiveScheduler to calculate the impact of this session's load
        // Pass the change description representing the session load addition
        const impact = AdaptiveScheduler.calculateImpact(changeDescription, {}); 
        const impactText = `Est. Load: ${sessionTotalLoad}, Pred. ACWR: ${impact.predictedACWR?.toFixed(2) || 'N/A'}, Pred. Monotony: ${impact.predictedMonotony?.toFixed(2) || 'N/A'}`;
        
        const resultsHTML = `
            <div class="simulation-results">
                <h4>Session Simulation: ${dayCapitalized}, Wk ${week}</h4>
                <p>Total Estimated Load: <strong>${sessionTotalLoad}</strong></p>
                <p>Predicted ACWR after session: <strong class="acwr-${impact.predictedACWRFlag || 'green'}">${impact.predictedACWR?.toFixed(2) || 'N/A'}</strong></p>
                <p>Predicted Monotony after session: <strong class="monotony-${impact.predictedMonotonyFlag || 'ok'}">${impact.predictedMonotony?.toFixed(2) || 'N/A'}</strong></p>
                <p>Exercises: <small>${exercisesInSession.join(', ')}</small></p>
            </div>`;

        dependencies.showToast(resultsHTML, 'info', 15000); // Show simulation results
    }

    // Public API
    return {
        init,
        updateContext,
        getContextualActions,
        processCommand,
        handleSuggestSwap,
        suggestSwapById,
        updateProgressState,
        clearContext,
        simulateOneSession,
        simulateAndConfirm,
        handleChangeIntensity, // Expose this function
        findExerciseIdByName,  // Was already public, unchanged
        
        // Recovery module accessor functions
        getBiomechanicalAnalyzer: () => biomechanicalAnalyzer,
        getRecoveryAwareAlternatives
    };

})(); // End IIFE

export { __Rewire__, __ResetDependency__ }; 
export default ForgeAssist; // <<< Add default export

/**
 * Add recovery-aware capability to exercise recommendations
 * @param {Array} recommendations - Original recommendations
 * @param {Object} options - Recommendation options
 * @returns {Array} - Enhanced recommendations
 */
function enhanceRecommendationsWithRecovery(recommendations, options = {}) {
    if (!recoveryRecommender) {
        return recommendations; // Can't enhance without recommender
    }
    
    // Get recovery data
    const stressLevels = biomechanicalAnalyzer.getCurrentStressLevels();
    const muscleRecovery = {};
    for (const [muscle, stress] of Object.entries(stressLevels)) {
        muscleRecovery[muscle] = 1 - stress;
    }
    
    // Enhance recommendations with recovery data
    return recommendations.map(rec => {
        // Calculate recovery score
        const recoveryScore = recoveryRecommender.calculateExerciseRecoveryScore(
            rec.exercise,
            muscleRecovery
        );
        
        // Get muscle-specific recovery data
        const muscleRecoveryData = recoveryRecommender.getExerciseMuscleRecovery(
            rec.exercise,
            muscleRecovery
        );
        
        // Add recovery data to recommendation
        return {
            ...rec,
            recoveryScore,
            muscleRecovery: muscleRecoveryData,
            isRecoveryOptimal: recoveryScore >= 0.8, // 80% or higher is optimal
            recoveryWarning: recoveryScore < 0.4 // Warning if under 40%
        };
    })
    .sort((a, b) => {
        // If recovery-first sorting is enabled
        if (options.prioritizeRecovery) {
            return b.recoveryScore - a.recoveryScore;
        }
        return b.score - a.score; // Normal sorting
    });
}

/**
 * Get recovery-optimized exercise alternatives
 * @param {string} exerciseId - Original exercise ID
 * @param {Object} options - Options for alternatives
 * @returns {Array} - Alternative exercises
 */
export function getRecoveryAwareAlternatives(exerciseId, options = {}) {
    if (!recoveryRecommender || !dependencies.exerciseLibrary) {
        return []; // Can't provide alternatives without components
    }
    
    // Get exercise data
    const exercise = dependencies.exerciseLibrary.getExerciseById(exerciseId);
    if (!exercise) {
        return []; // Exercise not found
    }
    
    // Get alternatives
    const alternatives = recoveryRecommender.getSimilarExercises(exercise, {
        count: options.count || 3,
        minRecoveryScore: options.minRecoveryScore || 0.6
    });
    
    return alternatives.map(alt => ({
        id: alt.exercise.id,
        name: alt.exercise.name,
        recoveryScore: alt.recoveryScore,
        effectivenessScore: alt.effectivenessScore,
        recoveryPercentage: Math.round(alt.recoveryScore * 100),
        muscleRecovery: alt.muscleRecovery,
        isRecoveryOptimal: alt.recoveryScore >= 0.8
    }));
}

/**
 * Create a workout that respects muscle recovery
 * @param {Object} options - Workout creation options
 * @returns {Object} - Generated workout
 */
export function createRecoveryAwareWorkout(options = {}) {
    if (!recoveryRecommender || !biomechanicalAnalyzer) {
        return null; // Can't create workout without components
    }
    
    const {
        targetMuscleGroups = [],
        equipment = [],
        difficulty = 'intermediate',
        duration = 60, // minutes
        exerciseCount = 5,
        restBetweenExercises = 60, // seconds
        prioritizeRecovery = true
    } = options;
    
    // Get exercise recommendations with recovery awareness
    const recommendedExercises = recoveryRecommender.getRecommendations({
        count: exerciseCount * 2, // Get more options to choose from
        preferredMuscleGroups: targetMuscleGroups,
        equipment,
        difficulty,
        sortBy: prioritizeRecovery ? 'recovery' : 'effectiveness'
    });
    
    // Select exercises for the workout
    const selectedExercises = [];
    const selectedMuscles = new Set();
    
    // First, add exercises for target muscle groups with high recovery
    for (const group of targetMuscleGroups) {
        const bestForGroup = recommendedExercises.find(rec => 
            recoveryRecommender.exerciseTargetsMuscleGroup(rec.exercise, group) &&
            rec.recoveryScore >= 0.7 &&
            !selectedExercises.includes(rec.exercise)
        );
        
        if (bestForGroup) {
            selectedExercises.push(bestForGroup.exercise);
            
            // Track targeted muscles
            const muscles = recoveryRecommender.getExerciseTargetedMuscles(bestForGroup.exercise);
            muscles.forEach(m => selectedMuscles.add(m));
        }
    }
    
    // Fill remaining slots with diverse exercises
    while (selectedExercises.length < exerciseCount && recommendedExercises.length > 0) {
        // Find exercise with least overlap with already selected muscles
        let bestOption = null;
        let lowestOverlap = Infinity;
        
        for (const rec of recommendedExercises) {
            if (selectedExercises.includes(rec.exercise)) {
                continue; // Skip already selected
            }
            
            // Count muscle overlap
            const targetedMuscles = recoveryRecommender.getExerciseTargetedMuscles(rec.exercise);
            const overlap = targetedMuscles.filter(m => selectedMuscles.has(m)).length;
            
            // If better option (less overlap or higher recovery score if equal)
            if (overlap < lowestOverlap || 
                (overlap === lowestOverlap && 
                 (!bestOption || rec.recoveryScore > bestOption.recoveryScore))) {
                bestOption = rec;
                lowestOverlap = overlap;
            }
        }
        
        if (bestOption) {
            selectedExercises.push(bestOption.exercise);
            
            // Track targeted muscles
            const muscles = recoveryRecommender.getExerciseTargetedMuscles(bestOption.exercise);
            muscles.forEach(m => selectedMuscles.add(m));
            
            // Remove from candidates
            const index = recommendedExercises.findIndex(r => r.exercise.id === bestOption.exercise.id);
            if (index >= 0) {
                recommendedExercises.splice(index, 1);
            }
        } else {
            break; // No more suitable exercises
        }
    }
    
    // Create workout structure
    return {
        name: `Recovery-Optimized ${targetMuscleGroups.join('/')} Workout`,
        exercises: selectedExercises.map(ex => ({
            id: ex.id,
            name: ex.name,
            sets: getRecommendedSets(ex, difficulty),
            reps: getRecommendedReps(ex, difficulty),
            rest: restBetweenExercises,
            recoveryScore: recommendedExercises.find(r => r.exercise.id === ex.id)?.recoveryScore || 1
        })),
        duration,
        targetMuscleGroups,
        recoveryOptimized: true,
        difficulty
    };
}

/**
 * Get recommended sets based on exercise and difficulty
 * @param {Object} exercise - Exercise data
 * @param {string} difficulty - Workout difficulty
 * @returns {number} - Recommended sets
 */
function getRecommendedSets(exercise, difficulty) {
    const baseSets = {
        'beginner': 2,
        'intermediate': 3,
        'advanced': 4
    };
    
    return baseSets[difficulty] || 3;
}

/**
 * Get recommended reps based on exercise and difficulty
 * @param {Object} exercise - Exercise data
 * @param {string} difficulty - Workout difficulty
 * @returns {number} - Recommended reps
 */
function getRecommendedReps(exercise, difficulty) {
    // This would be more sophisticated in a real implementation
    // For now, return standard rep ranges
    const defaultReps = {
        'beginner': 10,
        'intermediate': 8,
        'advanced': 6
    };
    
    return defaultReps[difficulty] || 8;
}

/**
 * Handles the Suggest Focus action on a day cell
 * Analyzes the surrounding training context to suggest an appropriate focus
 * @param {HTMLElement} dayCell - The day cell element
 */
function handleSuggestFocus(dayCell) {
    console.log('[ForgeAssist.handleSuggestFocus] Called for day cell:', dayCell);
    
    // Get the week and day information
    const week = parseInt(dayCell.dataset.week, 10);
    const day = dayCell.dataset.day.toLowerCase();
    
    // Reference the top-level daysOfWeek constant to avoid scope issues
    const localDaysOfWeek = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
    
    // Get all days in this week
    const daysInWeek = [];
    for (const dayName of localDaysOfWeek) {
        const dayCapitalized = dayName.charAt(0).toUpperCase() + dayName.slice(1);
        const dayCellElement = dependencies.workCanvas.querySelector(`.day-cell[data-week="${week}"][data-day="${dayCapitalized}"]`);
        if (dayCellElement) {
            const cards = Array.from(dayCellElement.querySelectorAll('.workout-card'));
            
            // Extract focus information: workout type, primary muscles, etc.
            let dayInfo = {
                day: dayName,
                hasWorkout: cards.length > 0,
                isPrimarilyPlaceholder: cards.length === 1 && cards[0].dataset.isPlaceholder === 'true',
                exerciseNames: [],
                primaryMuscles: new Set(),
                categories: new Set()
            };
            
            // Extract exercise details
            cards.forEach(card => {
                const exerciseName = card.querySelector('.exercise-name')?.textContent;
                if (exerciseName) {
                    dayInfo.exerciseNames.push(exerciseName);
                    
                    // Find exercise in library to get metadata
                    const exercise = dependencies.exerciseLibrary.find(ex => ex.name === exerciseName);
                    if (exercise) {
                        exercise.primaryMuscles?.forEach(muscle => dayInfo.primaryMuscles.add(muscle));
                        if (exercise.category) dayInfo.categories.add(exercise.category);
                    }
                }
            });
            
            daysInWeek.push(dayInfo);
        }
    }
    
    // Analyze context to determine a good focus
    const selectedDayInfo = daysInWeek.find(d => d.day === day);
    const otherDays = daysInWeek.filter(d => d.day !== day);
    
    // Collect all muscle groups trained this week
    const allMusclesThisWeek = new Set();
    const allCategoriesThisWeek = new Set();
    daysInWeek.forEach(dayInfo => {
        dayInfo.primaryMuscles.forEach(muscle => allMusclesThisWeek.add(muscle));
        dayInfo.categories.forEach(cat => allCategoriesThisWeek.add(cat));
    });
    
    // Muscles trained in the surrounding days (day before and day after)
    const surroundingMuscles = new Set();
    const dayIndex = localDaysOfWeek.indexOf(day);
    
    if (dayIndex > 0) {
        const prevDay = daysInWeek.find(d => d.day === localDaysOfWeek[dayIndex - 1]);
        if (prevDay) {
            prevDay.primaryMuscles.forEach(muscle => surroundingMuscles.add(muscle));
        }
    }
    
    if (dayIndex < localDaysOfWeek.length - 1) {
        const nextDay = daysInWeek.find(d => d.day === localDaysOfWeek[dayIndex + 1]);
        if (nextDay) {
            nextDay.primaryMuscles.forEach(muscle => surroundingMuscles.add(muscle));
        }
    }
    
    // Determine focus suggestions based on analysis
    let suggestions = [];
    
    // Check if this day already has a clear focus
    if (selectedDayInfo.hasWorkout && !selectedDayInfo.isPrimarilyPlaceholder) {
        if (selectedDayInfo.categories.size === 1) {
            // Already has a clear category focus
            const category = Array.from(selectedDayInfo.categories)[0];
            suggestions.push({
                focus: `${category} (Current)`,
                reasoning: "This matches your current workout focus."
            });
        } else if (selectedDayInfo.primaryMuscles.size <= 2) {
            // Already has a clear muscle focus
            const muscles = Array.from(selectedDayInfo.primaryMuscles).join(', ');
            suggestions.push({
                focus: `${muscles} (Current)`,
                reasoning: "This matches your current workout focus."
            });
        }
    }
    
    // Find untrained muscle groups
    const untrainedMuscles = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']
        .filter(muscle => !allMusclesThisWeek.has(muscle));
        
    if (untrainedMuscles.length > 0) {
        suggestions.push({
            focus: untrainedMuscles.join(' & '),
            reasoning: "These muscle groups aren't trained elsewhere in your week."
        });
    }
    
    // Avoid muscles trained in surrounding days
    const availableMuscles = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core']
        .filter(muscle => !surroundingMuscles.has(muscle));
        
    if (availableMuscles.length > 0) {
        // Group in logical pairs
        if (availableMuscles.includes('Chest') && availableMuscles.includes('Shoulders')) {
            suggestions.push({
                focus: 'Upper Body Push',
                reasoning: "Good recovery from surrounding days and logical muscle pairing."
            });
        } else if (availableMuscles.includes('Back') && availableMuscles.includes('Arms')) {
            suggestions.push({
                focus: 'Upper Body Pull',
                reasoning: "Good recovery from surrounding days and logical muscle pairing."
            });
        } else if (availableMuscles.includes('Legs') && availableMuscles.includes('Core')) {
            suggestions.push({
                focus: 'Lower Body & Core',
                reasoning: "Good recovery from surrounding days and logical muscle pairing."
            });
        } else {
            // Single muscle focus if no good pairs
            suggestions.push({
                focus: `${availableMuscles[0]} Focus`,
                reasoning: "This muscle group has good recovery potential for this day."
            });
        }
    }
    
    // Check if a rest or active recovery day would be beneficial
    const surroundingWorkoutDays = otherDays.filter(d => 
        d.hasWorkout && !d.isPrimarilyPlaceholder && 
        (localDaysOfWeek.indexOf(d.day) === dayIndex - 1 || localDaysOfWeek.indexOf(d.day) === dayIndex + 1)
    );
    
    if (surroundingWorkoutDays.length === 2) {
        suggestions.push({
            focus: 'Active Recovery',
            reasoning: "This would provide a strategic recovery day between two training sessions."
        });
    }
    
    // If no specific suggestions were generated, provide a general one
    if (suggestions.length === 0) {
        suggestions.push({
            focus: 'Full Body',
            reasoning: "A balanced full-body workout fits well in your current program."
        });
    }
    
    // Display suggestions to the user
    let message = `<strong>Suggested training focus for ${day}, week ${week}:</strong><br>`;
    suggestions.forEach((suggestion, index) => {
        message += `<br>${index + 1}. <strong>${suggestion.focus}</strong><br>`;
        message += `<span class="small text-muted">${suggestion.reasoning}</span><br>`;
    });
    
    dependencies.showToast(message, 'info', 8000);
}

/**
 * Handles generating a full week of workouts using a specific model
 * @param {number} weekNumber - The week number to generate
 * @param {string} modelType - The type of model to use (e.g., 'linear', 'wave', 'undulating')
 */
function handleGenerateWeek(weekNumber, modelType) {
    console.log(`[ForgeAssist] Generating week ${weekNumber} using ${modelType} model`);
    
    // Make sure AdaptiveScheduler is loaded and properly integrated
    if (!AdaptiveScheduler) {
        console.error('[ForgeAssist] AdaptiveScheduler module not loaded');
        dependencies.showToast(`Week generation feature not available. AdaptiveScheduler module not loaded.`, 'error');
        return;
    }
    
    if (typeof AdaptiveScheduler.generateWeek !== 'function') {
        console.error('[ForgeAssist] AdaptiveScheduler.generateWeek function not found');
        dependencies.showToast(`Week generation feature not available. AdaptiveScheduler needs to be updated.`, 'error');
        return;
    }
    
    // Basic configuration for the week generation
    const config = {
        weekNumber: weekNumber,
        model: modelType,
        goal: 'strength', // Default goal
        sessionsPerWeek: 3,    // Default session count
        equipment: {
            hasBarbell: true,
            hasDumbbells: true,
            hasCables: true
        }
    };
    
    // Enhance configuration based on modelType
    if (modelType === 'hypertrophy' || modelType === 'bodybuilding') {
        config.goal = 'hypertrophy';
        config.sessionsPerWeek = 4;
        config.parameters = {
            loadTargets: [70],
            repsPerSet: [8, 10, 12]
        };
    } else if (modelType === 'strength' || modelType === 'powerlifting') {
        config.goal = 'strength';
        config.parameters = {
            loadTargets: [80],
            repsPerSet: [5]
        };
    } else if (modelType === 'endurance' || modelType === 'conditioning') {
        config.goal = 'endurance';
        config.parameters = {
            loadTargets: [60],
            repsPerSet: [15]
        };
    } else if (modelType === 'wave') {
        config.parameters = {
            wavePatternDefinitions: {
                'main': { patternTargets: [75, 80, 85], repsPerStep: [5, 3, 1] }
            }
        };
    } else if (modelType === 'undulating') {
        config.sessionsPerWeek = 3;
        config.dailyTargets = [
            { dayOfWeek: 'mon', focus: 'strength', targets: [85], reps: [5] },
            { dayOfWeek: 'wed', focus: 'hypertrophy', targets: [75], reps: [10] },
            { dayOfWeek: 'fri', focus: 'power', targets: [65], reps: [3] }
        ];
    }
    
    // Prompt user for additional configuration if needed
    const modifyConfig = confirm(`Generate week ${weekNumber} using ${modelType} model?\n\nDefault configuration:\n- Sessions per week: ${config.sessionsPerWeek}\n- Goal: ${config.goal}\n\nClick OK to proceed or Cancel to modify.`);
    
    if (!modifyConfig) {
        // Allow user to customize the configuration
        const sessionCount = prompt(`How many sessions per week? (1-6)`, config.sessionsPerWeek);
        if (sessionCount) {
            config.sessionsPerWeek = Math.min(6, Math.max(1, parseInt(sessionCount, 10)));
        }
        
        const goal = prompt(`What's your primary goal?\n(strength, hypertrophy, endurance)`, config.goal);
        if (goal && ['strength', 'hypertrophy', 'endurance'].includes(goal.toLowerCase())) {
            config.goal = goal.toLowerCase();
        }
    }
    
    try {
        // Generate the week content
        const weekData = AdaptiveScheduler.generateWeek(config);
        
        if (!weekData.success) {
            dependencies.showToast(`Error generating week: ${weekData.message}`, 'error');
            return;
        }
        
        // Apply the generated data to the calendar grid
        applyGeneratedWeek(weekData, weekNumber);
        
        dependencies.showToast(`Successfully generated week ${weekNumber} using ${modelType} model! Your new workouts are ready.`, 'success');
        
        // Update analytics if possible
        if (dependencies.triggerAnalyticsUpdate) {
            try {
                dependencies.triggerAnalyticsUpdate();
                console.log('[ForgeAssist] Analytics update triggered successfully');
            } catch (error) {
                console.error('[ForgeAssist] Error triggering analytics update:', error);
            }
        } else {
            console.warn('[ForgeAssist] Analytics update function not available');
        }
        
        // Save state if the function is available
        if (dependencies.triggerSaveState) {
            try {
                dependencies.triggerSaveState();
                console.log('[ForgeAssist] State saved successfully');
            } catch (error) {
                console.error('[ForgeAssist] Error saving state:', error);
            }
        }
    } catch (error) {
        console.error('[ForgeAssist] Error generating week:', error);
        dependencies.showToast(`Error generating week: ${error.message}`, 'error');
    }
}

/**
 * Applies the generated week data to the calendar grid
 * @param {object} weekData - The generated week data from AdaptiveScheduler
 * @param {number} weekNumber - The week number to apply the data to
 */
function applyGeneratedWeek(weekData, weekNumber) {
    if (!weekData || !weekData.days) return;
    
    // Helper to create a workout card based on exercise data
    const createWorkoutCardForExercise = (exercise, dayCell) => {
        // Format rep scheme
        let repText = exercise.reps;
        if (Array.isArray(exercise.reps)) {
            repText = exercise.reps.join('-');
        }
        
        // Format details string
        let detailsStr = `${exercise.sets}×${repText}`;
        if (exercise.loadType && exercise.loadValue) {
            detailsStr += ` @ ${exercise.loadType === 'percent' ? exercise.loadValue + '%' : exercise.loadType === 'rpe' ? 'RPE ' + exercise.loadValue : exercise.loadValue + 'kg'}`;
        }
        
        // Call the blockbuilder's createWorkoutCard function if available
        if (typeof window.createWorkoutCard === 'function') {
            const card = window.createWorkoutCard(exercise.name, detailsStr);
            card.dataset.modelDriven = 'true'; // Mark as model driven
            dayCell.appendChild(card);
            
            // Add technique notes if available
            if (exercise.notes) {
                card.dataset.techniqueCue = exercise.notes;
            }
            
            return card;
        } else {
            // Fallback if the global function isn't available
            const card = document.createElement('div');
            card.className = 'workout-card';
            card.innerHTML = `
                <div class="exercise-name">${exercise.name}</div>
                <div class="details">${detailsStr}</div>
            `;
            card.dataset.modelDriven = 'true';
            dayCell.appendChild(card);
            
            if (exercise.notes) {
                card.dataset.techniqueCue = exercise.notes;
            }
            
            return card;
        }
    };
    
    // Process each day in the generated week
    for (const [dayKey, dayData] of Object.entries(weekData.days)) {
        // Find the day cell in the calendar
        const dayCapitalized = dayKey.charAt(0).toUpperCase() + dayKey.slice(1);
        const dayCell = dependencies.workCanvas.querySelector(`.day-cell[data-week="${weekNumber}"][data-day="${dayCapitalized}"]`);
        
        if (!dayCell) {
            console.warn(`[ForgeAssist] Could not find day cell for ${dayCapitalized}, week ${weekNumber}`);
            continue;
        }
        
        // Clear existing cards if any
        const existingCards = dayCell.querySelectorAll('.workout-card');
        if (existingCards.length > 0) {
            if (!confirm(`Replace existing cards in ${dayCapitalized}, week ${weekNumber}?`)) {
                console.log(`[ForgeAssist] User cancelled replacing existing cards for ${dayCapitalized}, week ${weekNumber}`);
                continue;
            }
            existingCards.forEach(card => card.remove());
        }
        
        // Add the focus as a header card if present
        if (dayData.focus) {
            const focusCard = document.createElement('div');
            focusCard.className = 'workout-card focus-card';
            focusCard.innerHTML = `
                <div class="exercise-name">FOCUS: ${dayData.focus}</div>
                <div class="details">${dayData.emphasis || ''}</div>
            `;
            focusCard.dataset.isPlaceholder = 'true';
            focusCard.dataset.modelDriven = 'true';
            dayCell.appendChild(focusCard);
        }
        
        // Create workout cards for each exercise
        if (dayData.exercises && dayData.exercises.length > 0) {
            dayData.exercises.forEach(exercise => {
                createWorkoutCardForExercise(exercise, dayCell);
            });
        }
        
        // Tag the day cell with the model information
        dayCell.dataset.periodizationModelType = weekData.model;
    }
}