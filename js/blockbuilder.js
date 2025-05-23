import acwr from './acwr.js';
import monotony from './monotony.js';
import AdaptiveScheduler from './adaptiveScheduler.js';
// Change from star import to named imports
import { 
  getModelDefaults, 
  getModelParameterDefinitions, 
  getAvailableModelTypes, 
  calculateExercisesForDay, 
  getProjectionData, 
  simulateParameterChange, 
  simulateModelSwap 
} from './periodizationEngine.js';
import vbtAdjust from './velocityAutoReg.js'; // Import VBT adjustment logic
// Import necessary helpers/state functions
import { getStructuredDetails } from './utils/helpers.js'; 
import { triggerSaveState } from './state/storage.js'; 
// import ForgeAssist from './forgeassist.js'; // <<< REMOVED Import ForgeAssist
// import AdaptiveScheduler from './adaptiveScheduler.js'; // REMOVED Import AdaptiveScheduler explicitly
import PeriodizationModelManager from './periodizationModelManager.js'; // <<< UNCOMMENTED Import
import { initializePhaseResizing } from './ui/phaseResize.js'; // <-- Added Phase Resize
import { handleSelection, getSelectionState } from './ui/selection.js';
import { initializeMarqueeSelection } from './ui/marquee.js';
import {
    handleExerciseDragStart,
    handleExerciseDragEnd, // Need this one too
    handleCardDragStart,
    handleCardDragEnd,
    attachDragDropListeners, // For dynamic slots
    handleAltKeyDown,
    handleAltKeyUp,
    handleWindowBlur,
    initializeDragDrop
} from './calendar/dragdrop.js'; // <-- Added Drag/Drop Handlers
import { updateCalendarPhaseIndicators } from './calendar/indicators.js'; // <-- Added import
import { generateCalendarGrid } from './calendar/grid.js'; // <-- Added import
import { showToast } from './ui/toast.js'; // <-- Added import
import { getCurrentBlockLoads } from './state/blockData.js'; // <-- Added import
import { initializeAnalyticsUpdater, triggerAnalyticsUpdate } from './analytics/updates.js'; // <-- Added import
import { commitVersion, openVersionsModal, closeVersionsModal, populateRecentBlocks } from './state/versioning.js'; // <<< Added versioning imports
import { SAVE_KEY, SETTINGS_SAVE_KEY, loadStateDataFromLocalStorage, loadSettingsDataFromLocalStorage, saveSettingsToLocalStorage, saveAsTemplate } from './state/storage.js'; // <<< Added storage imports
import { openInspector, closeInspector, activateTab, initializeInspectorListeners, saveWorkoutCardDetails as saveDetailsFromInspector, setTabVisibility, clearInspectorFocusMessage } from './inspector/inspector.js'; // <<< Re-adding setTabVisibility, Added clearInspectorFocusMessage
import {
    initializeLibrary,
    loadExerciseLibrary, // Keep this if called directly
    populateExerciseListUI,
    toggleFavoritesFilter,
    filterExerciseLibrary,
    openExerciseModal,
    closeExerciseModal,
    handleExerciseFormSubmit,
    exportUserExercises,
    handleExerciseImport,
    setViewMode, // Add view mode function
    loadViewMode, // Add view mode function
    getExercises // Added to access exercises directly
} from './exercises/library.js'; // <-- Added Library import
import ForgeAssist from './forgeassist.js';
import ProgressionPathwayOrchestrator from './progressionPathwayOrchestrator.js';

const hubContainer = document.getElementById('block-builder-hub');
const blockBuilderContainer = document.querySelector('.block-builder-container');
const createNewBtn = document.getElementById('hub-create-new'); // Added missing reference
const browseTemplatesBtn = document.getElementById('hub-browse-templates'); // Added missing reference

// Global variables for managing state
let currentLoadedVersionTimestamp = null;
// Global variable to hold exercise library data - accessible to all functions
window.exerciseLibraryData = []; // Initialize the timestamp variable

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed for blockbuilder.js");
    
    const gdapModal = document.getElementById('gdapModal');
    const gdapCloseBtn = document.getElementById('gdapCloseBtn');
    const gdapForm = document.getElementById('gdapForm');
    const gdapPrimaryExercisesContainer = document.getElementById('gdapPrimaryExercisesContainer');
    const gdapAddExerciseBtn = document.getElementById('gdapAddExerciseBtn');
    const gdapPeriodizationModelSelect = document.getElementById('gdapPeriodizationModel');
    let exerciseSlotCount = 1;
    const MAX_GDAP_EXERCISES = 3;

    // --- GDAP Variables ---
    let activeGoalInstance = null; // For Phase 1, store a single active goal.

    // --- GDAP Modal Logic ---
    // The newGoalDrivenBlockBtn code is removed as we're using the hub button instead

    if (gdapCloseBtn) {
        gdapCloseBtn.addEventListener('click', () => {
            gdapModal.classList.remove('is-visible');
        });
    }

    // Close modal if user clicks outside of it
    window.addEventListener('click', (event) => {
        if (event.target === gdapModal) {
            gdapModal.classList.remove('is-visible');
        }
    });

    // Add escape key handling
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && gdapModal.classList.contains('is-visible')) {
            gdapModal.classList.remove('is-visible');
        }
    });

    if (gdapAddExerciseBtn) {
        gdapAddExerciseBtn.addEventListener('click', () => {
            if (exerciseSlotCount < MAX_GDAP_EXERCISES) {
                exerciseSlotCount++;
                const newSlot = createGDAPExerciseSlot(exerciseSlotCount);
                gdapPrimaryExercisesContainer.appendChild(newSlot);
                populateExerciseDropdownForGDAP(newSlot.querySelector('.gdap-exercise-select'));
                if (exerciseSlotCount === MAX_GDAP_EXERCISES) {
                    gdapAddExerciseBtn.style.display = 'none';
                }
            }
        });
    }
    
    function createGDAPExerciseSlot(slotNumber) {
        const slotDiv = document.createElement('div');
        slotDiv.className = 'gdap-exercise-slot';
        slotDiv.id = `gdapExerciseSlot${slotNumber}`;
        slotDiv.innerHTML = `
            <h4>Exercise ${slotNumber} <button type="button" class="cta-button secondary-cta remove-gdap-exercise-btn" data-slot-id="${slotNumber}" style="float: right; display: ${slotNumber > 1 ? 'inline-block' : 'none'};">✕ Remove</button></h4>
            <div class="form-group">
                <label for="gdapTargetExercise${slotNumber}">Exercise:</label>
                <select id="gdapTargetExercise${slotNumber}" name="targetExercise${slotNumber}" class="gdap-exercise-select" required>
                    </select>
            </div>
            <div class="form-group">
                <label for="gdapCurrentPerf${slotNumber}">Current Performance (e.g., Est. 1RM):</label>
                <input type="number" id="gdapCurrentPerf${slotNumber}" name="currentPerf${slotNumber}" class="gdap-current-perf" step="0.1" required>
            </div>
            <div class="form-group">
                <label for="gdapTargetPerf${slotNumber}">Target Performance:</label>
                <input type="number" id="gdapTargetPerf${slotNumber}" name="targetPerf${slotNumber}" class="gdap-target-perf" step="0.1" required>
            </div>
        `;
        const removeBtn = slotDiv.querySelector('.remove-gdap-exercise-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', () => {
                slotDiv.remove();
                exerciseSlotCount--; // Decrement before re-evaluating add button
                 // Renumber remaining slots if needed (complex, skip for now or implement later)
                if (exerciseSlotCount < MAX_GDAP_EXERCISES) {
                    gdapAddExerciseBtn.style.display = 'inline-block';
                }
                // Re-label H4s
                const slots = gdapPrimaryExercisesContainer.querySelectorAll('.gdap-exercise-slot');
                slots.forEach((slot, index) => {
                    slot.querySelector('h4').childNodes[0].nodeValue = `Exercise ${index + 1} `;
                });

            });
        }
        return slotDiv;
    }

    function resetGDAPForm() {
        gdapForm.reset();
        // Remove dynamically added exercise slots beyond the first one
        const slots = gdapPrimaryExercisesContainer.querySelectorAll('.gdap-exercise-slot');
        for (let i = slots.length - 1; i > 0; i--) {
            slots[i].remove();
        }
        exerciseSlotCount = 1;
        gdapAddExerciseBtn.style.display = 'inline-block'; // Show add button
         const firstSlotRemoveBtn = document.querySelector('#gdapExerciseSlot1 .remove-gdap-exercise-btn');
        if(firstSlotRemoveBtn) firstSlotRemoveBtn.style.display = 'none';
    }

    function populateExerciseDropdownForGDAP(selectElement) {
        if (!selectElement) return;
        
        // Try to use the getExercises function first (most reliable)
        if (typeof getExercises === 'function') {
            const exercises = getExercises();
            if (exercises && Array.isArray(exercises) && exercises.length > 0) {
                selectElement.innerHTML = '<option value="">Select an exercise...</option>';
                exercises.sort((a, b) => a.name.localeCompare(b.name));
                exercises.forEach(exercise => {
                    const option = document.createElement('option');
                    option.value = exercise.id;
                    option.textContent = exercise.name;
                    selectElement.appendChild(option);
                });
                console.log('GDAP: Populated exercise dropdown using getExercises with', exercises.length, 'exercises');
                return;
            }
        }
        
        // Fallback to direct data access
        if (exerciseLibraryData && Array.isArray(exerciseLibraryData) && exerciseLibraryData.length > 0) {
            const exercises = exerciseLibraryData;
            selectElement.innerHTML = '<option value="">Select an exercise...</option>';
            exercises.sort((a, b) => a.name.localeCompare(b.name));
            exercises.forEach(exercise => {
                const option = document.createElement('option');
                option.value = exercise.id;
                option.textContent = exercise.name;
                selectElement.appendChild(option);
            });
            console.log('GDAP: Populated exercise dropdown with', exercises.length, 'exercises');
        } 
        // Final attempt - try loading the library directly
        else if (typeof loadExerciseLibrary === 'function') {
            console.log('GDAP: Exercise library not directly accessible, loading again...');
            loadExerciseLibrary().then(exercises => {
                if (exercises && Array.isArray(exercises)) {
                    selectElement.innerHTML = '<option value="">Select an exercise...</option>';
                    exercises.sort((a, b) => a.name.localeCompare(b.name));
                    exercises.forEach(exercise => {
                        const option = document.createElement('option');
                        option.value = exercise.id;
                        option.textContent = exercise.name;
                        selectElement.appendChild(option);
                    });
                    console.log('GDAP: Populated exercise dropdown after loading, with', exercises.length, 'exercises');
                }
            }).catch(err => {
                console.error('GDAP: Failed to load exercise library:', err);
                selectElement.innerHTML = '<option value="" disabled>Failed to load library</option>';
            });
        } else {
            console.warn('Exercise Library data not available for GDAP modal.');
            selectElement.innerHTML = '<option value="" disabled>Exercise library not loaded</option>';
        }
    }

    function populatePeriodizationModelDropdown() {
        if (typeof getAvailableModelTypes === 'function') {
        const modelTypes = getAvailableModelTypes();
            gdapPeriodizationModelSelect.innerHTML = '<option value="">None (Simple Linear Progression)</option>';
            modelTypes.forEach(type => {
                // Capitalize first letter for display
                const displayName = type.charAt(0).toUpperCase() + type.slice(1);
                const option = document.createElement('option');
                option.value = type;
                option.textContent = displayName;
                gdapPeriodizationModelSelect.appendChild(option);
            });
        } else {
            console.warn('PeriodizationEngine not available for GDAP modal.');
            gdapPeriodizationModelSelect.innerHTML = '<option value="" disabled>Models not loaded</option>';
        }
    }

    if (gdapForm) {
        gdapForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            
            // Close the modal first to allow overlay to show
            if (gdapModal.classList) {
                gdapModal.classList.remove('is-visible');
            } else {
                gdapModal.style.display = 'none';
            }
            
            // Force switch to builder view
            document.body.classList.add('show-builder');
            document.body.classList.remove('show-hub');
            
            // Get references to containers and update their display style
            const hubContainer = document.getElementById('block-builder-hub');
            const blockBuilderContainer = document.querySelector('.block-builder-container');
            
            if (hubContainer) hubContainer.style.display = 'none';
            if (blockBuilderContainer) blockBuilderContainer.style.display = 'flex';
            
            console.log("GDAP: Form submitted, switching to builder view");
            
            // Then run the GDAP generation process
            await handleGDAPFormSubmit();
            
            // Force the builder view to be visible with direct DOM manipulation as backup
            const hubElement = document.getElementById('block-builder-hub');
            const builderElement = document.querySelector('.block-builder-container');
            
            if (hubElement) {
                hubElement.classList.add('force-hidden');
                hubElement.style.display = 'none';
            }
            
            if (builderElement) {
                builderElement.classList.add('force-visible');
                builderElement.style.display = 'flex';
                builderElement.style.visibility = 'visible';
                builderElement.style.opacity = '1';
            }
            
            // Show success notification explicitly
            if (typeof showToast === 'function') {
                showToast('GDAP program generated successfully!', 'success');
            } else {
                console.warn('showToast function not available');
            }
        });
    }

    async function handleGDAPFormSubmit() {
        const formData = new FormData(gdapForm);
        
        // Create an array to track generated cards
        const generatedCards = [];
        
        console.log("GDAP form submitted - starting generation process");
        
        // Show the generation animation overlay
        const generationOverlay = document.getElementById('gdapGenerationOverlay');
        if (generationOverlay) {
            generationOverlay.classList.add('is-visible');
        } else {
            console.error("Generation overlay element not found");
        }
        
        // Create goal instance from form
        const goalInstance = {
            id: `gdap-${Date.now()}`,
            overallGoalType: formData.get('goalType'),
            timeframeWeeks: parseInt(formData.get('timeframe')),
            athleteLevel: formData.get('athleteLevel'),
            periodizationModelName: formData.get('periodizationModel') || null,
            targetExercises: []
        };
        
        // Update overlay message with goal type
        const generationMessage = document.querySelector('.gdap-generation-message');
        if (generationMessage) {
            generationMessage.textContent = `Creating a ${goalInstance.timeframeWeeks}-week ${goalInstance.overallGoalType} program for ${goalInstance.athleteLevel} athletes...`;
        }
        
        // Collect target exercises
        for (let i = 1; i <= exerciseSlotCount; i++) {
            const exerciseId = formData.get(`targetExercise${i}`);
            if (exerciseId) {
                const selectEl = document.getElementById(`gdapTargetExercise${i}`);
                const exerciseName = selectEl.options[selectEl.selectedIndex].text;
                const currentPerf = parseFloat(formData.get(`currentPerf${i}`));
                const targetPerf = parseFloat(formData.get(`targetPerf${i}`));
                
                // Collect optional exercise-specific goal settings
                const exGoalType = formData.get(`goalType${i}`) || goalInstance.overallGoalType;
                const exAthleteLevel = formData.get(`athleteLevel${i}`) || goalInstance.athleteLevel;
                
                goalInstance.targetExercises.push({
                    exerciseId: exerciseId,
                    exerciseName: exerciseName,
                    currentPerf: currentPerf,
                    targetPerf: targetPerf,
                    goalType: exGoalType,
                    athleteLevel: exAthleteLevel
                });
            }
        }
        
        if (goalInstance.targetExercises.length === 0) {
            alert("Please select at least one primary target exercise.");
            generationOverlay.classList.remove('is-visible'); // Hide overlay on error
            return;
        }

        console.log('GDAP Goal Instance Created:', goalInstance);

        // Artificial delay for dramatic effect (minimum 1.5 seconds)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // --- Main Pathway Calculation ---
        const pathwaysData = ProgressionPathwayOrchestrator.calculateGoalDrivenPathways(goalInstance);

        if (!pathwaysData || pathwaysData.length === 0) {
            alert("Could not generate pathways with the provided inputs.");
            generationOverlay.classList.remove('is-visible'); // Hide overlay on error
            return;
        }

        // Update the overlay progress
        const progressFill = document.querySelector('.gdap-progress-fill');
        if (progressFill) {
            progressFill.style.width = '75%';
        }
        
        // Switch to the block builder view (but keep overlay visible)
        // Force direct view switching with multiple methods for redundancy
        document.body.classList.add('show-builder');
        document.body.classList.remove('show-hub');
        
        const hubContainer = document.getElementById('block-builder-hub');
        const blockBuilderContainer = document.querySelector('.block-builder-container');
        
        if (hubContainer) hubContainer.style.display = 'none';
        if (blockBuilderContainer) {
            blockBuilderContainer.style.display = 'flex';
            blockBuilderContainer.style.visibility = 'visible';
            blockBuilderContainer.style.opacity = '1';
        }
        
        // Debugging log to track view state
        console.log("GDAP: Forcing builder view - Class list:", document.body.classList);
        console.log("GDAP: Builder container display:", blockBuilderContainer ? blockBuilderContainer.style.display : 'element not found');
        
        // Add generating class to trigger animation
        document.body.classList.add('gdap-program-generating');
        console.log("GDAP: Added gdap-program-generating class to body");
        
        // --- Clear and Regenerate Calendar ---
        if (window.BlockBuilder && typeof window.BlockBuilder.clearCalendar === 'function') {
            window.BlockBuilder.clearCalendar();
        } else if (typeof clearCalendar === 'function') {
            clearCalendar();
        } else {
            console.warn('clearCalendar function not found.');
            const workCanvas = document.getElementById('work-canvas');
            if (workCanvas) {
                workCanvas.innerHTML = '';
            }
        }

        if (window.BlockBuilder && window.BlockBuilder.CONFIG) {
            window.BlockBuilder.CONFIG.totalWeeks = goalInstance.timeframeWeeks;
            window.BlockBuilder.generateCalendarGrid();
        } else if (typeof generateCalendarGrid === 'function') {
             // Assuming generateCalendarGrid uses a global totalWeeks or takes it as an arg
             window.totalWeeks = goalInstance.timeframeWeeks; // Ensure global is set if used
             generateCalendarGrid(goalInstance.timeframeWeeks);
        } else {
            alert("Error: Could not generate calendar grid.");
            generationOverlay.classList.remove('is-visible'); // Hide overlay on error
            document.body.classList.remove('gdap-program-generating');
            return;
        }
        
        // --- Apply Overall Periodization Model to Days ---
        if (goalInstance.periodizationModelName && typeof PeriodizationModelManagerInstance !== 'undefined') {
            // If a model is selected, apply it to all days in the block
            const allDayIdsInBlock = [];
            for (let w = 0; w < goalInstance.timeframeWeeks; w++) {
                ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach(dayAbbr => {
                    // Use the PMM's day ID generator to match its format
                    allDayIdsInBlock.push(PeriodizationModelManagerInstance.generateDayId(w, dayAbbr));
                });
            }
            
            // Get model defaults
            const modelDefaults = getModelDefaults(goalInstance.periodizationModelName);
            
            // Create and apply model to all days
            PeriodizationModelManagerInstance.createAndApplyModel(
                goalInstance.periodizationModelName,
                modelDefaults || {}, // Use defaults or empty object as fallback
                allDayIdsInBlock,
                ExerciseLibrary.getExercises() // Need library for models to work with
            );
        }

        // --- Store accessory suggestions per day for the Inspector ---
        const accessorySuggestionsByDayId = {}; // e.g., { "week-0-day-0": [suggestions] }
        
        // Update the overlay progress to 100%
        if (progressFill) {
            progressFill.style.width = '100%';
        }
        
        // Allow some time for the progress to be visible
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Hide the generation overlay
        generationOverlay.classList.remove('is-visible');
        
        // --- Populate Block with Primary Workout Cards ---
        let cardEntryDelay = 100; // Starting delay for staggered animation
        
        // Function to create and animate a card with delay
        const createAndAnimateCard = (cardConfig, targetCell, delay) => {
            // Create the card
            let card;
            if (typeof window.createWorkoutCard === 'function') {
                card = window.createWorkoutCard(
                    cardConfig.name, 
                    cardConfig.detailsString, 
                    {
                        ...cardConfig.options,
                        id: `gdap-card-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
                    }
                );
            } else {
                card = document.createElement('div');
                card.className = 'workout-card';
                card.textContent = `${cardConfig.name}: ${cardConfig.detailsString}`;
                card.draggable = true;
                card.id = `gdap-card-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
                if (window.DragDrop && typeof window.DragDrop.makeDraggable === 'function') {
                    window.DragDrop.makeDraggable(card);
                }
            }
            
            // Add data attributes and classes for animation
            card.dataset.goalDriven = "true";
            if (cardConfig.options && cardConfig.options.sourceGoalId) {
                card.dataset.sourceGoalId = cardConfig.options.sourceGoalId;
            }
            if (cardConfig.options && cardConfig.options.exerciseId) {
                card.dataset.exerciseId = cardConfig.options.exerciseId;
            }
            
            // Add classes for animation
            card.classList.add('gdap-card-entry');
            
            if (targetCell) {
                // Append the card to its container
                targetCell.appendChild(card);
                
                // Track the card for potential further operations
                generatedCards.push(card);
                
                // Animate after a delay
                setTimeout(() => {
                    card.classList.add('animate-in');
                }, delay);
                
                // Return the card for reference
                return card;
            }
            return null;
        };
        
        pathwaysData.forEach(weeklyTarget => {
            // Weekly target contains exercises (primaries) and suggestedAccessories
            
            // Process primary exercises first
            weeklyTarget.exercises.forEach(exTarget => {
                // Convert week number (1-based) and day preference (mon, tue, etc.) to grid cell ID
                const weekNumber = weeklyTarget.week; // 1-based from PPO
                const dayAbbreviation = exTarget.dayPreference; // mon, tue, etc.
                
                // Capitalize first letter for data-day attribute
                const cellWeek = weekNumber;
                const cellDay = dayAbbreviation.charAt(0).toUpperCase() + dayAbbreviation.slice(1);
                const targetCell = document.querySelector(`.day-cell[data-week='${cellWeek}'][data-day='${cellDay}']`);
                
                if (targetCell) {
                    // Create workout card with exercise details for primary exercise
                    const cardConfig = {
                        name: exTarget.exerciseName,
                        detailsString: exTarget.detailsString,
                        options: {
                            exerciseId: exTarget.exerciseId,
                            load: exTarget.load, 
                            sets: exTarget.sets,
                            reps: exTarget.reps,
                            primaryTarget: true,
                            targetExercise: true,
                            isPrimary: true
                        }
                    };
                    
                    const card = createAndAnimateCard(cardConfig, targetCell, cardEntryDelay);
                    cardEntryDelay += 100; // Increment delay for staggered effect
                    
                    if (card) {
                        // Store card reference in cards array for later access
                        generatedCards.push(card);
                    
                        // Now add accessory exercises for this day if available
                        const dayAccessories = weeklyTarget.suggestedAccessories?.filter(acc => 
                            acc.dayPreference === dayAbbreviation) || [];
                        
                        if (dayAccessories.length > 0) {
                            console.log(`Adding ${dayAccessories.length} accessory exercises to ${cellDay} of Week ${cellWeek}`);
                            
                            dayAccessories.forEach(accessory => {
                                const accessoryConfig = {
                                    name: accessory.exerciseName,
                                    detailsString: accessory.detailsString || `${accessory.sets}x${accessory.reps}`,
                                    options: {
                                        exerciseId: accessory.exerciseId,
                                        load: accessory.load || '',
                                        sets: accessory.sets || 3,
                                        reps: accessory.reps || 10,
                                        primaryTarget: false,
                                        targetExercise: false,
                                        isPrimary: false,
                                        isAccessory: true
                                    }
                                };
                                
                                const accessoryCard = createAndAnimateCard(accessoryConfig, targetCell, cardEntryDelay);
                                cardEntryDelay += 100; // Increment delay for each card
                                
                                if (accessoryCard) {
                                    generatedCards.push(accessoryCard);
                                }
                            });
                        }
                    }
                } else {
                    console.warn(`GDAP: Target cell not found for ${exTarget.name} on ${cellDay} of Week ${cellWeek}.`);
                }
            });

            // Process accessory suggestions for this week
            // Group by day for this week
            const daySuggestionsByDayPref = {};
            weeklyTarget.suggestedAccessories.forEach(accSugg => {
                if (!daySuggestionsByDayPref[accSugg.dayPreference]) {
                    daySuggestionsByDayPref[accSugg.dayPreference] = [];
                }
                daySuggestionsByDayPref[accSugg.dayPreference].push(accSugg);
            });
            
            // Map day preference to cell ID and store
            for (const [dayPref, suggestions] of Object.entries(daySuggestionsByDayPref)) {
                // Convert to the format that matches our HTML structure
                const weekNumber = weeklyTarget.week; // 1-based from PPO
                const dayCapitalized = dayPref.charAt(0).toUpperCase() + dayPref.slice(1);
                
                // Find the cell using the proper selector
                const targetCell = document.querySelector(`.day-cell[data-week='${weekNumber}'][data-day='${dayCapitalized}']`);
                
                if (targetCell) {
                    // Generate a dayId that matches the normal grid ID format
                    const dayIdNormalized = convertToDayId(weekNumber, dayPref);
                    
                    if (dayIdNormalized) {
                        // Store the suggestions for this day
                        accessorySuggestionsByDayId[dayIdNormalized] = [...suggestions];
                    }
                }
            }
        });

        // After all cards are created, remove the generating class 
        setTimeout(() => {
            document.body.classList.remove('gdap-program-generating');
            
            // Ensure we're still in builder view
            document.body.classList.add('show-builder');
            document.body.classList.remove('show-hub');
            
            // Extra check for DOM visibility
            const builderElement = document.querySelector('.block-builder-container');
            const hubElement = document.getElementById('block-builder-hub');
            
            if (builderElement && builderElement.style.display !== 'flex') {
                console.log("GDAP: Re-forcing builder container visibility");
                builderElement.style.display = 'flex';
                builderElement.style.visibility = 'visible';
                builderElement.style.opacity = '1';
                builderElement.classList.add('force-visible');
            }
            
            if (hubElement && hubElement.style.display !== 'none') {
                console.log("GDAP: Re-forcing hub container to be hidden");
                hubElement.style.display = 'none';
                hubElement.style.visibility = 'hidden';
                hubElement.style.opacity = '0';
                hubElement.classList.add('force-hidden');
            }
            
            // Hide the generation overlay
            const generationOverlay = document.getElementById('gdapGenerationOverlay');
            if (generationOverlay) {
                generationOverlay.classList.remove('is-visible');
            }
            
            // Display a success toast
            if (typeof showToast === 'function') {
                showToast(`Created your ${goalInstance.overallGoalType} program!`, 'success');
            } else {
                console.warn('showToast function not available');
                alert(`Created your ${goalInstance.overallGoalType} program!`);
            }
        }, cardEntryDelay + 1000); // Give time for all card animations to complete
        
        // Store accessory suggestions in the work canvas for inspector access
        const workCanvas = document.getElementById('work-canvas');
        if (workCanvas) {
            workCanvas.dataset.gdapAccessorySuggestions = JSON.stringify(accessorySuggestionsByDayId);
            console.log("GDAP: Stored accessory suggestions for inspectors:", Object.keys(accessorySuggestionsByDayId).length, "days with suggestions");
        }
        
        // --- Update State & Analytics ---
        if (typeof saveStateToLocalStorage === 'function') {
            saveStateToLocalStorage();
        } else if (window.BlockBuilder && typeof window.BlockBuilder.saveState === 'function') {
            window.BlockBuilder.saveState();
        }
        
        if (typeof updateAnalytics === 'function') {
            updateAnalytics();
        } else if (window.Analytics && typeof window.Analytics.update === 'function') {
            window.Analytics.update();
        }
        
        // Add event listeners to day cells for the Inspector to display accessory suggestions
        setupAccessorySuggestionListeners();
        
        // Initial population of accessory suggestions in the inspector (if cell is already selected)
        updateInspectorContents(); // Refresh inspector to show content for any currently selected cell
    }
    
    // Function to set up event listeners for accessory suggestions
    function setupAccessorySuggestionListeners() {
        const dayCells = document.querySelectorAll('.day-cell');
        
        dayCells.forEach(cell => {
            cell.addEventListener('click', function(event) {
                // Only handle if not clicking on a card
                if (!event.target.closest('.workout-card')) {
                    updateAccessorySuggestionsInInspector(this.id);
                }
            });
            
            // Also handle case where a card is clicked
            const cardsInCell = cell.querySelectorAll('.workout-card');
            cardsInCell.forEach(card => {
                card.addEventListener('click', function(event) {
                    event.stopPropagation(); // Stop bubbling to cell
                    updateAccessorySuggestionsInInspector(cell.id);
                });
            });
        });
    }
    
    // Function to update the inspector with accessory suggestions for a day cell
    function updateAccessorySuggestionsInInspector(cellId) {
        const suggestionContainer = document.getElementById('accessory-suggestions-container');
        if (!suggestionContainer) return;
        
        // Clear existing content
        suggestionContainer.innerHTML = '';
        
        // Get the calendar grid and check for suggestions
        const calendarGrid = document.getElementById('work-canvas');
        if (!calendarGrid || !calendarGrid.dataset.gdapAccessorySuggestions) {
            suggestionContainer.innerHTML = '<p>No accessory suggestions available.</p>';
            return;
        }
        
        try {
            // Parse the stored suggestions
            const allSuggestions = JSON.parse(calendarGrid.dataset.gdapAccessorySuggestions);
            const suggestionsForCell = allSuggestions[cellId];
            
            if (!suggestionsForCell || suggestionsForCell.length === 0) {
                suggestionContainer.innerHTML = '<p>No specific accessory suggestions for this day.</p>';
                return;
            }
            
            // Create the title
            const title = document.createElement('h4');
            title.textContent = 'Suggested Accessories:';
            suggestionContainer.appendChild(title);
            
            // Create the list
            const list = document.createElement('ul');
            list.className = 'accessory-suggestion-list';
            
            // Add each suggestion as a list item
            suggestionsForCell.forEach(suggestion => {
                const item = document.createElement('li');
                item.className = 'accessory-suggestion-item';
                item.textContent = `${suggestion.exerciseName} (${suggestion.sets}x${suggestion.reps}) - ${suggestion.notes}`;
                
                // Make it draggable
                item.draggable = true;
                item.dataset.exerciseId = suggestion.exerciseId;
                item.dataset.exerciseName = suggestion.exerciseName;
                item.dataset.defaultSets = suggestion.sets;
                item.dataset.defaultReps = suggestion.reps;
                item.dataset.dragType = 'accessory-suggestion';
                
                // Add drag event handler
                item.addEventListener('dragstart', function(event) {
                    const data = {
                        id: this.dataset.exerciseId,
                        name: this.dataset.exerciseName,
                        sets: this.dataset.defaultSets,
                        reps: this.dataset.defaultReps,
                        notes: `Accessory: ${this.dataset.exerciseName}`
                    };
                    
                    event.dataTransfer.setData('application/json', JSON.stringify(data));
                    event.dataTransfer.setData('text/plain', this.dataset.exerciseId);
                    event.dataTransfer.effectAllowed = 'copy';
                    
                    console.log('Dragging accessory suggestion:', data);
                });
                
                list.appendChild(item);
            });
            
            suggestionContainer.appendChild(list);
            
        } catch (error) {
            console.error('Error displaying accessory suggestions:', error);
            suggestionContainer.innerHTML = '<p>Error loading accessory suggestions.</p>';
        }
    }

    // --- DOM Element References ---
    const workCanvas = document.getElementById('work-canvas');
    const inspectorPanel = document.getElementById('inspector-panel');
    const inspectorTitle = document.getElementById('inspector-title');
    const inspectorContent = inspectorPanel ? inspectorPanel.querySelector('.inspector-content') : null;
    const inspectorCloseBtn = document.getElementById('inspector-close-btn');
    const libraryTab = document.querySelector('.tab-link[data-tab="library"]');
    const detailsTab = document.querySelector('.tab-link[data-tab="details"]');
    const libraryContent = document.getElementById('library');
    const detailsContent = document.getElementById('details');
    const exerciseListUl = libraryContent ? libraryContent.querySelector('.exercise-list') : null;
    const inspectorSearchInput = document.getElementById('inspector-search');
    const phaseRibbon = document.getElementById('phase-ribbon');
    const timelineFooter = document.getElementById('timeline-footer');
    const acwrGaugeValue = document.getElementById('acwr-gauge .gauge-value');
    const acwrGaugeBar = document.getElementById('acwr-gauge .gauge-bar');
    const monotonyGaugeValue = document.getElementById('monotony-gauge .gauge-value');
    const monotonyGaugeBar = document.getElementById('monotony-gauge .gauge-bar');
    const strainGaugeValue = document.getElementById('strain-gauge .gauge-value');
    const strainGaugeBar = document.getElementById('strain-gauge .gauge-bar');
    const blockNameInput = document.getElementById('block-name'); // In settings tab
    const prevPlannedRpeInput = document.getElementById('prev-planned-rpe');
    const prevActualRpeInput = document.getElementById('prev-actual-rpe');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const toastContainer = document.getElementById('toast-container');
    const mobilePreviewBtn = document.getElementById('mobile-preview-btn');
    const mobilePreviewModal = document.getElementById('mobile-preview-modal');
    const mobilePreviewCloseBtn = document.getElementById('mobile-preview-close-btn');
    const mobilePreviewBody = document.getElementById('mobile-preview-body');
    const commitBlockBtn = document.getElementById('commit-block-btn');
    const versionsBtn = document.getElementById('versions-btn');
    const versionsModal = document.getElementById('versions-modal');
    const versionsCloseBtn = document.getElementById('versions-close-btn');
    const versionsList = document.getElementById('versions-list');
    const newBlockOptionsModal = document.getElementById('new-block-options-modal');
    const newBlockOptionsCloseBtn = document.getElementById('new-block-options-close-btn');
    const createBlockFromOptionsBtn = document.getElementById('create-block-from-options-btn');
    const newBlockWeeksInput = document.getElementById('new-block-weeks');
    const newBlockModelSelect = document.getElementById('new-block-model');
    const newBlockSessionsSelect = document.getElementById('new-block-sessions');
    const newBlockNameModalInput = document.getElementById('new-block-name-modal');
    
    // --- Hub View Elements ---
    const blockBuilderHub = document.getElementById('block-builder-hub');
    const hubBrowseTemplatesBtn = document.getElementById('hub-browse-templates');
    const recentBlocksList = document.getElementById('recent-blocks-list');
    const backToHubBtn = document.getElementById('back-to-hub-btn');
    
    // --- Exercise Modals ---
    const exerciseModal = document.getElementById('exercise-modal');
    const exerciseModalCloseBtn = document.getElementById('exercise-modal-close-btn');
    const exerciseModalForm = document.getElementById('exercise-modal-form');
    const addExerciseBtn = document.getElementById('add-exercise-btn');
    const exerciseModalTitle = document.getElementById('exercise-modal-title');
    const exerciseDetailModal = document.getElementById('exercise-detail-modal');
    const exerciseDetailCloseBtn = document.getElementById('exercise-detail-close-btn');
    const detailModalEditBtn = document.getElementById('detail-modal-edit-btn');
    const detailModalSwapBtn = document.getElementById('detail-modal-swap-btn');

    // --- Library Controls ---
    const libraryFilterCategory = document.getElementById('library-filter-category');
    const libraryFilterEquipment = document.getElementById('library-filter-equipment');
    const librarySort = document.getElementById('library-sort');
    const libraryToggleFavorites = document.getElementById('library-toggle-favorites');
    const viewModeStandardBtn = document.getElementById('view-mode-standard');
    const viewModeCompactBtn = document.getElementById('view-mode-compact');
    const exerciseListContainer = document.querySelector('.exercise-list-container');
    const importExercisesInput = document.getElementById('import-exercises-input');
    const importExercisesLabel = document.getElementById('import-exercises-label');
    const exportExercisesBtn = document.getElementById('export-exercises-btn');

    // --- ForgeAssist Chat Elements ---
    const forgeChatContainer = document.getElementById('forge-chat-container');
    const forgeChatToggle = document.getElementById('forge-chat-toggle');
    const forgeChatPanel = document.getElementById('forge-chat-panel');
    const forgeChatMinimize = document.getElementById('forge-chat-minimize');
    const forgeChatMessages = document.getElementById('forge-chat-messages');
    const forgeChatInput = document.getElementById('forge-chat-input');
    const forgeChatSend = document.getElementById('forge-chat-send');
    const forgeChatSuggestions = document.querySelector('.forge-chat-suggestions');

    // --- Global State Variables ---
    let exerciseLibraryData = []; // Holds the full library
    let selectedContext = { type: 'none', elements: new Set(), modelId: null, dayId: null };
    let isInspectorOpen = false;
    let currentBlockState = {}; // Holds the state for saving/loading
    // let multiSelectToolbar = null; // Initialize toolbar reference - REMOVED Redeclaration
    // let contextMenu = null; // Initialize context menu reference - REMOVED Redeclaration

    // --- Initialize Modules & Load Data ---
    // Initialize Phase Resizing (if available)
    if (typeof initializePhaseResizing === 'function') {
        initializePhaseResizing(phaseRibbon, workCanvas);
    } else {
        console.warn("Phase resizing module not found or failed to load.");
    }
    
    // Initialize Drag & Drop
    if (typeof initializeDragDrop === 'function') {
        initializeDragDrop(workCanvas);
    } else {
        console.warn("Drag and drop module not found.");
    }
    
    // Initialize Marquee Selection
    if (typeof initializeMarqueeSelection === 'function') {
        initializeMarqueeSelection(workCanvas);
    } else {
        console.warn("Marquee selection module not found.");
    }

    // Initialize Periodization Model Manager
    if (typeof PeriodizationModelManager !== 'undefined') {
        const periodizationManagerInstance = new PeriodizationModelManager();
        periodizationManagerInstance.init({ 
            showToast, 
            createWorkoutCard, 
            getBlockStateHelper, 
            getTotalWeeksHelper,
            getPeriodizationEngine // Add the missing dependency function
        });
        // Make the instance available globally if needed by other parts (optional)
        window.periodizationManager = periodizationManagerInstance; 
    } else {
        console.error("PeriodizationModelManager Class is not defined!");
    }

    // Initialize Analytics Updater (if available)
    if (typeof initializeAnalyticsUpdater === 'function') {
        initializeAnalyticsUpdater();
    } else {
        console.warn("Analytics updater module not found or failed to load.");
    }
    
    // Load initial block state from storage
    // loadBlockIntoDOM(); 
    // Load settings
    loadSettingsIntoDOM();
    
    // --- Initialize Core Systems AFTER loading library ---
    loadExerciseLibrary().then(loadedData => {
        console.log("Library initialized and data loaded successfully.");
        exerciseLibraryData = loadedData; // Assign loaded data to the outer scope variable
        console.log("[BlockBuilder .then()] Inspecting loadedData:", loadedData);
        console.log("[BlockBuilder .then()] Inspecting outer scope exerciseLibraryData AFTER assignment:", exerciseLibraryData);
        
        // Now initialize ForgeAssist with the loaded library
        initializeForgeAssistSystem(exerciseLibraryData); 
        // Now initialize Adaptive Training
        initializeAdaptiveTraining(exerciseLibraryData); 
        
        // Potentially populate recent blocks here if needed after library load
        // populateRecentBlocks(); 

    }).catch(error => {
        console.error("Failed to load exercise library:", error);
        showToast("Error loading exercise library. Some features might be limited.", "error");
         // Initialize other systems even if library fails?
         initializeForgeAssistSystem([]); // Initialize with empty library
         initializeAdaptiveTraining([]);
    });

    // Function to initialize ForgeAssist and related systems
    function initializeForgeAssistSystem(libraryData) {
        console.log("[BlockBuilder] Initializing ForgeAssist...");
        try {
            // Use the imported ForgeAssist directly
            // Pass necessary functions and data
            const analyticsInterface = { 
                getACWR: () => typeof AnalyticsModule !== 'undefined' && AnalyticsModule.getACWR ? AnalyticsModule.getACWR(AnalyticsModule.getDailyLoads(workCanvas)) : null,
                getMonotony: () => typeof AnalyticsModule !== 'undefined' && AnalyticsModule.getMonotony ? AnalyticsModule.getMonotony(AnalyticsModule.getDailyLoads(workCanvas)) : null,
                getStrain: () => typeof AnalyticsModule !== 'undefined' && AnalyticsModule.getStrain ? AnalyticsModule.getStrain(AnalyticsModule.getDailyLoads(workCanvas)) : null,
                getWeeklyLoad: (weekNum) => typeof AnalyticsModule !== 'undefined' && AnalyticsModule.getWeeklyLoad ? AnalyticsModule.getWeeklyLoad(AnalyticsModule.getDailyLoads(workCanvas), weekNum) : 0,
                getTotalLoad: () => typeof AnalyticsModule !== 'undefined' && AnalyticsModule.getTotalLoad ? AnalyticsModule.getTotalLoad(AnalyticsModule.getDailyLoads(workCanvas)) : 0
            };
    
            // Define current block loads function
            const getCurrentBlockLoads = () => {
                return typeof AnalyticsModule !== 'undefined' ? AnalyticsModule.getDailyLoads(workCanvas) : [];
            };
    
            if (typeof ForgeAssist.init === 'function') {
                ForgeAssist.init({
                    workCanvas: workCanvas,
                    showToast: showToast,
                    triggerAnalyticsUpdate: triggerAnalyticsUpdate,
                    getTotalWeeks: getTotalWeeksHelper, // Pass helper function
                    getBlockState: getBlockStateHelper, // Pass helper function
                    exerciseLibrary: libraryData || [],
                    // Pass analytics functions directly or via interface
                    acwrFunction: analyticsInterface.getACWR,
                    monotonyFunction: analyticsInterface.getMonotony,
                    getCurrentBlockLoads: getCurrentBlockLoads,
                    simulatedPastLoad: typeof blockData !== 'undefined' ? blockData.getSimulatedPastLoad() : [],
                    // Provide AdaptiveScheduler instance/functions if needed by ForgeAssist
                    adaptiveScheduler: AdaptiveScheduler // Pass the global object
                });
                console.log("[BlockBuilder] ForgeAssist initialized successfully.");
            } else {
                console.error("ForgeAssist.init is not a function!");
            }
        } catch (error) {
            console.error("Failed to load exercise library:", error);
            if (typeof showToast === 'function') {
                showToast('Error initializing ForgeAssist. Some features may not work.', 'error');
            }
        }
    }

    // --- Initialize Library Module ---
    // Find all necessary elements first
    const libraryConfig = {
        exerciseList: document.querySelector('.exercise-list'),
        inspectorSearch: document.getElementById('inspector-search'),
        categoryFilter: document.getElementById('library-filter-category'),
        equipmentFilter: document.getElementById('library-filter-equipment'),
        sort: document.getElementById('library-sort'),
        favoritesToggle: document.getElementById('library-toggle-favorites'),
        exerciseListContainer: document.querySelector('.exercise-list-container'),
        exerciseModal: document.getElementById('exercise-modal'),
        exerciseModalCloseBtn: document.getElementById('exercise-modal-close-btn'),
        exerciseModalForm: document.getElementById('exercise-modal-form'),
        exerciseModalTitle: document.getElementById('exercise-modal-title'),
        addExerciseBtn: document.getElementById('add-exercise-btn'), // Need button ref for listener
        exportExercisesBtn: document.getElementById('export-exercises-btn'), // Need button ref for listener
        importExercisesInput: document.getElementById('import-exercises-input'), // Need button ref for listener
        viewModeStandardBtn: document.getElementById('view-mode-standard'), // Need button ref for listener
        viewModeCompactBtn: document.getElementById('view-mode-compact') // Need button ref for listener
    };

    // Initialize the library, which returns a promise that resolves when exercises are loaded
    initializeLibrary(libraryConfig).then(loadedData => {
        console.log("Library initialized and data loaded successfully.");
        
        // <<< ADDED LOGS to inspect data sources >>>
        console.log("[BlockBuilder .then()] Inspecting loadedData:", loadedData);
        // <<< ASSIGN loadedData to outer scope variable >>>
        exerciseLibraryData = loadedData; 
        console.log("[BlockBuilder .then()] Inspecting outer scope exerciseLibraryData AFTER assignment:", exerciseLibraryData);
        // <<< END ASSIGNMENT & LOG >>>

        // Now that the library is loaded, we can proceed with loading saved state/settings
        // loadStateDataFromLocalStorage(); // Example: Load block state after library
        // loadSettingsDataFromLocalStorage(); // Example: Load settings after library
        
        // <<<--- MOVED ForgeAssist Initialization HERE --- >>>
        // --- Helper Functions for Dependencies ---
        function getTotalWeeksHelper() {
            return workCanvas.querySelectorAll('.week-label').length;
        }
        
        function getBlockStateHelper() {
            // Placeholder: Needs implementation to gather state from DOM/manager
            // This is complex and depends on how state is managed elsewhere
            console.warn('[ForgeAssist Init] getBlockStateHelper not fully implemented.');
            return {
                slots: {}, // Populate from workCanvas
                phases: [], // Populate from phaseRibbon
                periodizationModels: window.periodizationManager?.getState() || {} // Get from manager
            };
        }

        // --- Initialize ForgeAssist --- 
        console.log('[BlockBuilder] Initializing ForgeAssist...');
        try {
            // Make sure exerciseLibraryData is properly assigned from loadedData if necessary
            // Assuming initializeLibrary updates the outer scope exerciseLibraryData 
            // or loadedData itself contains the library
            // Let's be safe and use loadedData if it looks like the library
            const libraryToUse = Array.isArray(loadedData) ? loadedData : exerciseLibraryData; // <<< CORRECTED LOGIC
            console.log(`[BlockBuilder] Using exercise library with ${libraryToUse.length} items for ForgeAssist init.`);

            ForgeAssist.init({
                workCanvas: workCanvas,
                showToast: showToast, // Assumes showToast is available in this scope
                triggerAnalyticsUpdate: triggerAnalyticsUpdate, // Assumes triggerAnalyticsUpdate is available
                getTotalWeeks: getTotalWeeksHelper,
                getBlockState: getBlockStateHelper,
                exerciseLibrary: libraryToUse, // Use the determined library
                // Pass analytics functions
                acwrFunction: acwr, 
                monotonyFunction: monotony,
                // Ensure getCurrentBlockLoads receives workCanvas when called by ForgeAssist/AdaptiveScheduler
                getCurrentBlockLoads: () => getCurrentBlockLoads(workCanvas), // <<< MODIFIED HERE
                simulatedPastLoad: window.simulatedPastLoad || [] // Get from global or default
            });
            
            // Initialize Adaptive Training System
            initializeAdaptiveTraining(libraryToUse);
            
            console.log('[BlockBuilder] ForgeAssist initialized successfully.');
        } catch (error) {
            console.error('[BlockBuilder] Error initializing ForgeAssist:', error);
            showToast('ForgeAssist failed to initialize!', 'error');
        }
        // <<<--- END MOVED CODE --- >>>

    }).catch(error => {
        console.error("Failed to initialize exercise library:", error);
        showToast('Error loading exercise library. Some features may not work.', 'error');
    });
    // --- End Library Init ---

    /**
     * Initializes the Adaptive Training System features.
     * @param {Array} exerciseLibrary - The loaded exercise library.
     */
    function initializeAdaptiveTraining(exerciseLibrary) {
        console.log('[BlockBuilder] Initializing Adaptive Training System...');
        
        // Register event listener for analytics monitoring
        const originalTriggerAnalytics = triggerAnalyticsUpdate;
        window.triggerAnalyticsUpdate = function() {
            originalTriggerAnalytics();
            setTimeout(checkAnalyticsForDeloadNeed, 500); // Check after analytics update
        };
        
        // First load any stored performance history from localStorage
        try {
            if (localStorage.getItem('setforgePerformanceHistory')) {
                console.log('[AdaptiveTraining] Performance history loaded from localStorage');
            }
        } catch (error) {
            console.error("Error accessing localStorage:", error);
        }
        
        console.log('[BlockBuilder] Adaptive Training System initialized');
    }
    
    /**
     * Populates the Adaptive tab based on the selected element.
     * @param {HTMLElement} element - The selected element.
     */
    function populateAdaptiveTab(element) {
        const adaptiveTab = document.getElementById('adaptive');
        if (!adaptiveTab) return;
        
        if (!element) {
            adaptiveTab.innerHTML = '<p>Select a workout card, day, or phase to see adaptive training options.</p>';
            return;
        }
        
        if (element.classList.contains('workout-card')) {
            // Handle workout card selection
            populateAdaptiveExerciseTab(element, adaptiveTab);
        } else if (element.classList.contains('day-cell')) {
            // Handle day cell selection
            populateAdaptiveDayTab(element, adaptiveTab);
        } else if (element.classList.contains('phase-bar')) {
            // Handle phase bar selection
            populateAdaptivePhaseTab(element, adaptiveTab);
        } else {
            adaptiveTab.innerHTML = '<p>Select a workout card, day, or phase to see adaptive training options.</p>';
        }
    }
    
    /**
     * Populates the Adaptive tab for an exercise/workout card.
     * @param {HTMLElement} element - The selected workout card.
     * @param {HTMLElement} adaptiveTab - The adaptive tab content container.
     */
    function populateAdaptiveExerciseTab(element, adaptiveTab) {
        // Get exercise details from the card
        const details = getStructuredDetails(element);
        const exerciseName = details.name;
        
        // Find exercise in library
        const exerciseId = findExerciseIdByName(exerciseName);
        if (!exerciseId) {
            adaptiveTab.innerHTML = '<p>Error: Could not find exercise in library.</p>';
            return;
        }
        
        adaptiveTab.innerHTML = `
            <h4>Performance Feedback</h4>
            <div class="form-group">
                <label for="rpe-feedback">How difficult was this exercise? (RPE)</label>
                <select id="rpe-feedback">
                    <option value="">Select RPE</option>
                    ${[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map(rpe => 
                        `<option value="${rpe}">${rpe}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="reps-completed">Reps Completed (last set)</label>
                <input type="number" id="reps-completed" min="0" max="100">
            </div>
            <button id="submit-feedback" class="cta-button primary-cta">Submit Feedback</button>
            <div id="load-recommendation" class="recommendation-box" style="display:none; margin-top: 10px; padding: 10px; background: var(--accent-color-light); border-radius: 4px;"></div>
            
            <hr class="detail-separator">
            
            <h4>Exercise Rotation</h4>
            <p>Suggested alternatives to maintain variety:</p>
            <div id="rotation-suggestions" class="suggestion-list"></div>
            
            <hr class="detail-separator">
            
            <h4>Accessory Recommendations</h4>
            <p>Suggested accessories to complement this exercise:</p>
            <div id="accessory-suggestions" class="accessory-list"></div>
        `;
        
        // Add listener for feedback submission
        document.getElementById('submit-feedback').addEventListener('click', () => {
            const rpe = document.getElementById('rpe-feedback').value;
            const reps = document.getElementById('reps-completed').value;
            
            if (!rpe || !reps) {
                showToast('Please provide both RPE and reps completed', 'warning');
                return;
            }
            
            // Store feedback on the card
            element.dataset.lastRpe = rpe;
            element.dataset.lastRepsCompleted = reps;
            
            // Call AdaptiveScheduler to get load adjustment
            const adjustment = AdaptiveScheduler.adjustLoadBasedOnFeedback(
                exerciseId, 
                parseFloat(rpe), 
                parseInt(reps, 10)
            );
            
            // Show recommendation
            const recBox = document.getElementById('load-recommendation');
            recBox.innerHTML = `
                <strong>Recommendation:</strong> 
                ${adjustment.loadAdjustment > 0 ? 'Increase' : 'Decrease'} load by 
                ${Math.abs(adjustment.loadAdjustment * 100).toFixed(1)}% 
                (${adjustment.reason})
                <button id="apply-adjustment" class="cta-button secondary-cta">Apply</button>
            `;
            recBox.style.display = 'block';
            
            // Add listener for applying the adjustment
            document.getElementById('apply-adjustment').addEventListener('click', () => {
                // Use ForgeAssist.handleChangeIntensity function
                ForgeAssist.handleChangeIntensity(element, adjustment.loadAdjustment);
                showToast('Load adjusted based on your feedback', 'success');
            });
        });
        
        // Get rotation suggestions
        const weekIndex = parseInt(element.closest('.day-cell').dataset.week, 10) - 1; // 0-based
        const rotationOptions = AdaptiveScheduler.suggestExerciseRotation(exerciseId, weekIndex);
        
        const suggestionsContainer = document.getElementById('rotation-suggestions');
        
        // Check if rotationOptions is an array and has items
        if (!rotationOptions || !Array.isArray(rotationOptions) || rotationOptions.length === 0) {
            suggestionsContainer.innerHTML = '<p><em>No suitable alternatives found</em></p>';
        } else {
            suggestionsContainer.innerHTML = rotationOptions.map(option => `
                <div class="suggestion-item" style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 8px; background: var(--bg-color-secondary); border-radius: 4px;">
                    <div>
                        <span class="suggestion-name" style="font-weight: bold;">${option.name}</span>
                        <span class="suggestion-reason" style="display: block; font-size: 0.8em; color: var(--text-color-secondary);">${option.reason}</span>
                    </div>
                    <button class="apply-rotation cta-button micro-cta" data-exercise-id="${option.id}">Apply</button>
                </div>
            `).join('');
            
            // Add listeners for rotation buttons
            suggestionsContainer.querySelectorAll('.apply-rotation').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const newExerciseId = e.target.dataset.exerciseId;
                    const newExercise = findExerciseById(newExerciseId);
                    
                    if (newExercise) {
                        // Update workout card with new exercise
                        const nameElement = element.querySelector('.exercise-name');
                        if (nameElement) {
                            nameElement.textContent = newExercise.name;
                            element.dataset.exerciseId = newExerciseId;
                            
                            // Update other card attributes if needed
                            triggerAnalyticsUpdate();
                            showToast(`Exercise rotated to ${newExercise.name}`, 'success');
                        }
                    }
                });
            });
        }
        
        // Similar check for accessory suggestions
        const accessorySuggestions = AdaptiveScheduler.suggestAccessories(
            exerciseId,
            {} // Empty user performance for now
        );
        
        const accessoryContainer = document.getElementById('accessory-suggestions');
        
        if (!accessorySuggestions || !Array.isArray(accessorySuggestions) || accessorySuggestions.length === 0) {
            accessoryContainer.innerHTML = '<p><em>No accessory exercises suggested</em></p>';
        } else {
            accessoryContainer.innerHTML = accessorySuggestions.map(acc => `
                <div class="accessory-item" style="display: flex; justify-content: space-between; margin-bottom: 8px; padding: 8px; background: var(--bg-color-secondary); border-radius: 4px;">
                    <div>
                        <span class="accessory-name" style="font-weight: bold;">${acc.name}</span>
                        <span class="accessory-detail" style="display: block; font-size: 0.8em;">${acc.sets}x${acc.reps}</span>
                        <span class="accessory-reason" style="display: block; font-size: 0.8em; color: var(--text-color-secondary);">${acc.reason}</span>
                    </div>
                    <button class="add-accessory cta-button micro-cta" 
                            data-exercise="${acc.name}" 
                            data-sets="${acc.sets}" 
                            data-reps="${acc.reps}">
                        Add
                    </button>
                </div>
            `).join('');
            
            // Add listeners for accessory buttons
            accessoryContainer.querySelectorAll('.add-accessory').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const exerciseName = e.target.dataset.exercise;
                    const sets = e.target.dataset.sets;
                    const reps = e.target.dataset.reps;
                    
                    const dayCellElement = element.closest('.day-cell');
                    if (dayCellElement) {
                        const newCardDetails = {
                            sets: sets,
                            reps: reps,
                            loadType: 'rpe',
                            loadValue: '7',
                            rest: '60s',
                            notes: 'Accessory exercise'
                        };
                        
                        const newCard = createWorkoutCard(exerciseName, newCardDetails);
                        dayCellElement.appendChild(newCard);
                        triggerAnalyticsUpdate();
                        showToast(`Added ${exerciseName} as accessory`, 'success');
                    }
                });
            });
        }
    }
    
    /**
     * Populates the Adaptive tab for a day cell.
     * @param {HTMLElement} element - The selected day cell.
     * @param {HTMLElement} adaptiveTab - The adaptive tab content container.
     */
    function populateAdaptiveDayTab(element, adaptiveTab) {
        const week = parseInt(element.dataset.week, 10);
        const day = element.dataset.day;
        
        adaptiveTab.innerHTML = `
            <h4>Day Optimization (Week ${week}, ${day})</h4>
            <p>Options for optimizing this training day:</p>
            
            <div class="day-actions" style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
                <button id="balance-day-load" class="cta-button secondary-cta">Balance Load Distribution</button>
                <button id="optimize-exercise-selection" class="cta-button secondary-cta">Optimize Exercise Selection</button>
                <button id="adjust-for-readiness" class="cta-button secondary-cta">Adjust for Readiness Score</button>
            </div>
            
            <hr class="detail-separator">
            
            <h4>Volume/Intensity Balance</h4>
            <div class="balance-sliders">
                <div class="form-group">
                    <label for="volume-slider">Volume</label>
                    <input type="range" id="volume-slider" min="1" max="10" value="5" class="slider">
                    <span id="volume-value">Medium</span>
                </div>
                <div class="form-group">
                    <label for="intensity-slider">Intensity</label>
                    <input type="range" id="intensity-slider" min="1" max="10" value="5" class="slider">
                    <span id="intensity-value">Medium</span>
                </div>
                <button id="apply-vi-balance" class="cta-button primary-cta">Apply Balance</button>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('balance-day-load').addEventListener('click', () => {
            showToast('Balancing load distribution...', 'info');
            // Implementation would go here
        });
        
        document.getElementById('optimize-exercise-selection').addEventListener('click', () => {
            showToast('Optimizing exercise selection...', 'info');
            // Implementation would go here
        });
        
        document.getElementById('adjust-for-readiness').addEventListener('click', () => {
            showToast('Adjusting for readiness...', 'info');
            // Implementation would go here
        });
        
        // Slider event listeners
        const volumeSlider = document.getElementById('volume-slider');
        const intensitySlider = document.getElementById('intensity-slider');
        const volumeValue = document.getElementById('volume-value');
        const intensityValue = document.getElementById('intensity-value');
        
        // Map slider values to text
        const valueMap = {
            1: 'Very Low',
            2: 'Low',
            3: 'Low-Medium',
            4: 'Medium-Low',
            5: 'Medium',
            6: 'Medium-High',
            7: 'High-Medium',
            8: 'High',
            9: 'Very High',
            10: 'Maximum'
        };
        
        volumeSlider.addEventListener('input', () => {
            volumeValue.textContent = valueMap[volumeSlider.value];
        });
        
        intensitySlider.addEventListener('input', () => {
            intensityValue.textContent = valueMap[intensitySlider.value];
        });
        
        document.getElementById('apply-vi-balance').addEventListener('click', () => {
            showToast(`Applying new volume/intensity balance: Volume ${valueMap[volumeSlider.value]}, Intensity ${valueMap[intensitySlider.value]}`, 'success');
            // Implementation would go here
        });
    }
    
    /**
     * Populates the Adaptive tab for a phase bar.
     * @param {HTMLElement} element - The selected phase bar.
     * @param {HTMLElement} adaptiveTab - The adaptive tab content container.
     */
    function populateAdaptivePhaseTab(element, adaptiveTab) {
        const phaseName = element.dataset.phaseName || 'Phase';
        const goal = element.dataset.goal || 'general';
        
        // Mock metrics for prototype - would be calculated from real data
        const strengthProgress = 75;
        const hypertrophyProgress = 60;
        const powerProgress = 40;
        
        adaptiveTab.innerHTML = `
            <h4>Phase Progress Analysis: ${phaseName}</h4>
            <div id="phase-metrics" style="margin-bottom: 20px;">
                <div class="metric-item" style="margin-bottom: 10px;">
                    <span class="metric-label">Strength Progress:</span>
                    <div class="progress-bar" style="background: #eee; height: 10px; border-radius: 5px; margin: 5px 0;">
                        <div class="progress-fill" style="background: var(--accent-color); height: 100%; width: ${strengthProgress}%; border-radius: 5px;"></div>
                    </div>
                    <span class="metric-value">${strengthProgress.toFixed(1)}%</span>
                </div>
                
                <div class="metric-item" style="margin-bottom: 10px;">
                    <span class="metric-label">Hypertrophy Progress:</span>
                    <div class="progress-bar" style="background: #eee; height: 10px; border-radius: 5px; margin: 5px 0;">
                        <div class="progress-fill" style="background: var(--accent-color); height: 100%; width: ${hypertrophyProgress}%; border-radius: 5px;"></div>
                    </div>
                    <span class="metric-value">${hypertrophyProgress.toFixed(1)}%</span>
                </div>
                
                <div class="metric-item" style="margin-bottom: 10px;">
                    <span class="metric-label">Power Development:</span>
                    <div class="progress-bar" style="background: #eee; height: 10px; border-radius: 5px; margin: 5px 0;">
                        <div class="progress-fill" style="background: var(--accent-color); height: 100%; width: ${powerProgress}%; border-radius: 5px;"></div>
                    </div>
                    <span class="metric-value">${powerProgress.toFixed(1)}%</span>
                </div>
            </div>
            
            <div id="phase-recommendations">
                <!-- Show recommendation based on progress -->
                ${strengthProgress > 70 ? 
                    `<div class="alert-box recommendation" style="background: var(--accent-color-light); padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                        <h3 style="margin-top: 0;">Phase Transition Recommended</h3>
                        <p>Based on your progress, it's time to transition to: Power Phase</p>
                        <button id="transition-phase" class="cta-button primary-cta">Apply Transition</button>
                    </div>` 
                : ''}
            </div>
            
            <hr class="detail-separator">
            
            <h4>Phase Optimization</h4>
            <div class="phase-actions" style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
                <button id="optimize-phase-load" class="cta-button secondary-cta">Optimize Phase Load Distribution</button>
                <button id="add-deload-week" class="cta-button secondary-cta">Add Strategic Deload Week</button>
                <button id="realign-progressions" class="cta-button secondary-cta">Realign Exercise Progressions</button>
            </div>
        `;
        
        // Add event listeners for phase transition
        const transitionBtn = document.getElementById('transition-phase');
        if (transitionBtn) {
            transitionBtn.addEventListener('click', () => {
                // Set new goal for the phase
                element.dataset.goal = 'power';
                
                // Update styles or indicators if needed
                if (element.querySelector('.phase-goal')) {
                    element.querySelector('.phase-goal').textContent = 'Power';
                }
                
                showToast('Phase transitioned to Power', 'success');
                
                // Reload adaptive tab
                populateAdaptivePhaseTab(element, adaptiveTab);
            });
        }
        
        // Add event listeners for phase actions
        document.getElementById('optimize-phase-load').addEventListener('click', () => {
            showToast('Optimizing phase load distribution...', 'info');
            // Implementation would go here
        });
        
        document.getElementById('add-deload-week').addEventListener('click', () => {
            showToast('Adding strategic deload week...', 'info');
            // Implementation would go here
        });
        
        document.getElementById('realign-progressions').addEventListener('click', () => {
            showToast('Realigning exercise progressions...', 'info');
            // Implementation would go here
        });
    }
    
    /**
     * Helper function to check analytics for deload needs.
     */
    function checkAnalyticsForDeloadNeed() {
        // Get analytics data from gauges
        const acwrValue = parseFloat(document.getElementById('acwr-gauge').dataset.value || 0);
        const monotonyValue = parseFloat(document.getElementById('monotony-gauge').dataset.value || 0);
        const strainValue = parseFloat(document.getElementById('strain-gauge').dataset.value || 0);
        
        // Calculate performance metrics - these would need to be gathered from actual data
        const performanceDeclineDuration = 0; // Placeholder
        const rpeIncreaseRate = 0; // Placeholder
        
        // Call AdaptiveScheduler to check for deload need
        const deloadAssessment = AdaptiveScheduler.detectDeloadNeed({
            acwr: acwrValue,
            monotony: monotonyValue,
            strain: strainValue,
            performanceDeclineDuration,
            rpeIncreaseRate
        });
        
        // If deload needed, add notification to Adaptive tab
        if (deloadAssessment.needsDeload) {
            const adaptiveTabLink = document.querySelector('.tab-link[data-tab="adaptive"]');
            if (adaptiveTabLink && !adaptiveTabLink.querySelector('.notification-badge')) {
                const badge = document.createElement('span');
                badge.className = 'notification-badge';
                badge.textContent = '!';
                badge.style.backgroundColor = 'red';
                badge.style.color = 'white';
                badge.style.borderRadius = '50%';
                badge.style.padding = '2px 6px';
                badge.style.fontSize = '0.7em';
                badge.style.position = 'absolute';
                badge.style.top = '0';
                badge.style.right = '0';
                adaptiveTabLink.style.position = 'relative';
                adaptiveTabLink.appendChild(badge);
            }
        }
    }
    
    /**
     * Helper function to find an exercise by name.
     * @param {string} name - The exercise name.
     * @returns {string|null} - The exercise ID or null if not found.
     */
    function findExerciseIdByName(name) {
        const exercise = exerciseLibraryData.find(ex => ex.name === name);
        return exercise ? exercise.id : null;
    }
    
    /**
     * Helper function to find an exercise by ID.
     * @param {string} id - The exercise ID.
     * @returns {object|null} - The exercise object or null if not found.
     */
    function findExerciseById(id) {
        return exerciseLibraryData.find(ex => ex.id === id);
    }

    // --- Initialize UI Components & Systems ---
    initializeInspectorListeners(); // Initialize Inspector
    initializePhaseResizing(phaseRibbon, workCanvas); // Initialize Phase Resizing
    initializeDragDrop(workCanvas, showToast, triggerAnalyticsUpdate); // Initialize Drag & Drop system

    // --- Initialize Periodization Model Manager --- 
    function getPeriodizationEngine() {
        // Return the imported engine module object
        return PeriodizationEngine;
    }
    
    // PeriodizationModelManager.init({ // <<< REMOVE THIS BLOCK
    //     workCanvas: workCanvas,
    //     showToast: showToast,
    //     triggerAnalyticsUpdate: triggerAnalyticsUpdate,
    //     getPeriodizationEngine: getPeriodizationEngine
    // });

    // --- Analytics Initialization ---
    initializeAnalyticsUpdater(workCanvas); // Use imported function

    // --- Add Back to Hub Button Listener ---
    if (backToHubBtn) {
        backToHubBtn.addEventListener('click', () => {
            console.log("'Back to Hub' button clicked.");
            showView('hub');
        });
    } else {
        console.error("'Back to Hub' button (backToHubBtn) not found!");
    }
    // --- End Listener Addition ---

    // --- Add Week Expand/Collapse Listener ---
    if (workCanvas) {
        workCanvas.addEventListener('click', (e) => {
            // Remove previous log
            // console.log("[Week Toggle] click event captured on workCanvas. Target:", e.target);

            // --- MODIFIED: Look for the label, then find its container ---
            const weekLabel = e.target.closest('.week-label'); // Target must be the week label itself

            // console.log("[Week Toggle] Clicked target:", e.target, "Found .week-label element:", weekLabel);
            if (weekLabel) {
                const weekNumber = weekLabel.dataset.week;
                if (!weekNumber) return;

                // Find the parent container for this week
                const weekContainer = weekLabel.closest('.week-row-container');
                if (!weekContainer) {
                    console.warn(`[Week Toggle] Could not find .week-row-container for week ${weekNumber}`);
                    return;
                }

                // console.log(`[Week Toggle] Clicked Week ${weekNumber} label.`);

                // Toggle the class only on the container
                weekContainer.classList.toggle('week-expanded');

                // --- REMOVED toggling on individual elements ---
                // const isCurrentlyExpanded = weekLabel.classList.contains('week-expanded');
                // const weekElements = workCanvas.querySelectorAll(
                //     `.week-label[data-week="${weekNumber}"], .day-cell[data-week="${weekNumber}"]`
                // );
                // weekElements.forEach(el => {
                //     el.classList.toggle('week-expanded', !isCurrentlyExpanded);
                // });
                // --- END REMOVAL ---
            }
        });
    }
    // --- End Week Expand/Collapse Listener ---

    // --- Load Initial Data ---
    loadBlockIntoDOM();
    loadSettingsIntoDOM(); // Assume a similar function exists or needs creation for settings

    // --- Function to handle creating a new block from modal options ---
    function handleCreateBlockFromOptions() {
        // Get values from modal
        const weeksInput = document.getElementById('new-block-weeks');
        const sessionsSelect = document.getElementById('new-block-sessions');
        const modelSelect = document.getElementById('new-block-model');
        const nameInput = document.getElementById('new-block-name-modal');
        
        const weeks = parseInt(weeksInput.value) || 8;
        const sessions = parseInt(sessionsSelect.value) || 3;
        const model = modelSelect.value || 'linear';
        const name = nameInput.value || 'Untitled Block';
        
        console.log(`Creating new block: ${weeks} weeks, ${sessions} sessions/wk, Model: ${model}, Name: ${name}`);
        
        // Create day IDs ahead of time
        const targetDayIds = [];
        
        // Determine which days to include based on selected sessions per week
        let daysToUse;
        switch(sessions) {
            case 1: daysToUse = ['Mon']; break;
            case 2: daysToUse = ['Mon', 'Thu']; break;
            case 3: daysToUse = ['Mon', 'Wed', 'Fri']; break;
            case 4: daysToUse = ['Mon', 'Tue', 'Thu', 'Fri']; break;
            case 5: daysToUse = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']; break;
            case 6: daysToUse = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']; break;
            case 7: daysToUse = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; break;
            default: daysToUse = ['Mon', 'Wed', 'Fri']; // Default to 3 days if invalid
        }
        
        // Generate day IDs in the correct format for each week and selected day
        for (let week = 1; week <= weeks; week++) {
            for (const day of daysToUse) {
                // Use the correct format: "wk{weekNum}-{dayAbbr}" (lowercase day abbreviation)
                const dayAbbr = day.substring(0, 3).toLowerCase();
                const dayId = `wk${week}-${dayAbbr}`;
                targetDayIds.push(dayId);
            }
        }
        
        // 1. Generate Grid
        generateCalendarGrid(weeks);

        // 2. Determine Target Days based on sessionsPerWeek
        let sessionDays = [];
        if (sessions >= 7) sessionDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        else if (sessions >= 6) sessionDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        else if (sessions >= 5) sessionDays = ["Mon", "Tue", "Thu", "Fri", "Sat"];
        else if (sessions >= 4) sessionDays = ["Mon", "Tue", "Thu", "Fri"];
        else if (sessions >= 3) sessionDays = ["Mon", "Wed", "Fri"];
        else if (sessions >= 2) sessionDays = ["Tue", "Thu"];
        else if (sessions >= 1) sessionDays = ["Wed"];

        console.log("Target Day IDs for model:", targetDayIds);

        // 3. Create and Apply Model Instance (if not 'blank')
        let instanceId = null;
        if (model !== 'blank') {
            // TODO: Get baseParams if needed (e.g., from other modal inputs)
            const baseParams = {}; 
            // Use the instance created earlier instead of static method
            if (window.periodizationManager && typeof window.periodizationManager.createAndApplyModel === 'function') {
                instanceId = window.periodizationManager.createAndApplyModel(model, baseParams, targetDayIds, exerciseLibraryData);
                if (!instanceId) {
                    showToast(`Failed to create periodization model: ${model}`, 'error');
                    // Proceed with blank grid
                }
            } else {
                console.error('PeriodizationModelManager or createAndApplyModel is not available.');
                showToast('Error creating training model', 'error');
            }
        }
        
        console.log("Model instance " + instanceId + " created and applied.");
        
        // 4. Generate Cards using the Model (if created)
        if (instanceId) {
            populateModelDrivenCards(instanceId, targetDayIds);
        }

        // 5. Clear Settings (Except potentially name)
        const settingsTab = document.getElementById('settings');
        if (settingsTab) {
            settingsTab.querySelectorAll('#prev-planned-rpe, #prev-actual-rpe').forEach(input => input.value = '');
            const nameInput = settingsTab.querySelector('#block-name');
            if(nameInput) nameInput.value = name;
        }
        saveSettingsToLocalStorage(); // Save cleared/updated settings

        // 6. Clear Version Tracking & Autosave Keys
        // We've now initialized currentLoadedVersionTimestamp globally, so we don't need to set it here
        localStorage.removeItem(SAVE_KEY);
        // Do NOT remove VERSIONS_KEY or RECENT_BLOCKS_KEY

        // 7. Close Modal & Switch View
        if (newBlockOptionsModal) newBlockOptionsModal.classList.remove('is-visible');
        showView('builder');
        showToast(`Created new ${weeks}-week block`, 'info', 3000);

        // Attach listeners to the newly generated grid
        attachListenersToAllSlots();

        // Trigger analytics update after grid is populated
        triggerAnalyticsUpdate(workCanvas); // <<< Added call here

        // --- NEW: Update badges for affected days ---
        console.log("[handleCreateBlockFromOptions] Updating badges for affected days...");
        targetDayIds.forEach(dayId => {
            const cell = workCanvas.querySelector(`[data-day-id="${dayId}"]`);
            if (cell) {
                updateDayBadge(cell); // Call badge update for each cell
            } else {
                console.warn(`[handleCreateBlockFromOptions] Could not find cell for dayId ${dayId} to update badge.`);
            }
        });
        // --- END Badge Update ---
    }

    // --- Function to populate cards based on a model instance ---
    function populateModelDrivenCards(instanceId, targetDayIds) {
        if (!instanceId || !targetDayIds || targetDayIds.length === 0) return;

        // Use the instance method instead of trying to use it as a static method
        const modelInstance = window.periodizationManager.getModelInstance(instanceId);
        const engine = getPeriodizationEngine(); // Assume this gives access to calculation functions

        if (!modelInstance) {
            console.error(`Cannot populate cards: Model instance ${instanceId} not found.`);
            showToast('Error finding model data to populate cards.', 'error');
            return;
        }
        if (!engine || typeof engine.calculateExercisesForDay !== 'function') {
            console.error(`Cannot populate cards: Engine or calculateExercisesForDay function not available.`);
            showToast('Error accessing calculation engine.', 'error');
            return;
        }

        console.log(`Populating cards for model ${instanceId} (${modelInstance.type}) on ${targetDayIds.length} days.`);

        targetDayIds.forEach(dayId => {
            const match = dayId.match(/wk(\d+)-(\w+)/);
            if (!match) {
                console.warn(`Could not parse week/day from dayId: ${dayId}`);
                return;
            }
            const weekNum = parseInt(match[1], 10);
            const dayName = match[2]; // e.g., "mon"

            const cell = workCanvas.querySelector(`[data-day-id="${dayId}"]`);
            if (!cell) {
                console.warn(`Could not find cell for dayId: ${dayId}`);
                return;
            }

            // Clear any existing cards (e.g., if replacing placeholders later)
            // cell.innerHTML = ''; 

            try {
                // Calculate exercises for this specific day using the engine
                // We pass the full instance (type, params) and the specific week/day context
                const exercises = engine.calculateExercisesForDay(modelInstance, weekNum, dayName); 

                if (exercises && exercises.length > 0) {
                    // Find the main exercise defined in the structure for this day
                    const structureEntry = modelInstance.params.weeklyStructure?.find(entry => entry.dayOfWeek === dayName);
                    const mainExerciseName = structureEntry?.mainExercise;
                    const isMainExerciseWaved = structureEntry?.applyWave === true;
                    
                    exercises.forEach(exData => {
                        // Get badge info ONLY if this is the main waved exercise
                        let badgeContent = null;
                        let badgeColorClass = null;
                        if (exData.exerciseName === mainExerciseName && isMainExerciseWaved) {
                             badgeContent = getIconForModelType(modelInstance.type, true); 
                             badgeColorClass = `model-color-${modelInstance.type}`.toLowerCase(); 
                        }

                        // Create card using the specific exercise name from the engine
                        // <<< ADD LOGGING >>>
                        console.log(`[populateModelDrivenCards] Creating card for ${dayId}. Exercise Data:`, exData);
                        if (!exData.id) {
                             console.warn(`[populateModelDrivenCards] Missing ID in exData for ${exData.exerciseName || 'unknown exercise'}`);
                        }
                        // <<< END LOGGING >>>
                        const card = createWorkoutCard(exData.exerciseName, exData.detailsString, {
                            sets: exData.sets,
                            reps: exData.reps,
                            loadValue: exData.loadValue,
                            loadType: exData.loadType,
                            rest: exData.rest,
                            modelDriven: true, // Mark card as model-driven
                            modelInstanceId: instanceId, // Link to the source model
                            targetDayId: dayId,
                            exerciseId: exData.id // <<< ADDED exerciseId
                        });

                        // Update the badge element inside the card ONLY if badgeContent is set
                        if (badgeContent) { // Keep this check, maybe rename badgeContent to reflects it's just for triggering?
                            const badgeElement = card.querySelector('.card-model-badge-indicator');
                            if (badgeElement) {
                                // badgeElement.textContent = badgeContent; // REMOVE THIS LINE
                                badgeElement.style.display = 'inline-block'; // Make it visible (as a colored block)
                                badgeElement.classList.add(badgeColorClass); // Add color class 
                            }
                        } // Else, the badge div remains hidden

                        cell.appendChild(card);
                    });
                } else {
                    console.log(`No exercises calculated for ${dayId} by model ${instanceId}.`);
                }
            } catch (error) {
                console.error(`Error calculating exercises for ${dayId}:`, error);
                showToast(`Error calculating exercises for ${dayId}`, 'error');
                // Optionally add an error indicator to the cell
            }
        });

        triggerAnalyticsUpdate(workCanvas); // Update analytics after adding cards
        triggerSaveState(); // Save the state with the new cards
    }

    // --- Simulated Past Load Data (for ACWR/Monotony) --- (Moved to js/state/blockData.js)
    /*
    const simulatedPastLoad = Array.from({ length: 28 }, 
        () => Math.random() < 0.2 ? 0 : Math.round(Math.random() * 500 + 200) // ~20% rest days
    );
    console.log("Simulated Past 28 days load:", simulatedPastLoad);
    */

    // --- Helper function to attach drag/drop listeners to all current slots ---
    function attachListenersToAllSlots() {
        const currentSlots = workCanvas.querySelectorAll('.day-cell');
        console.log(`Attaching drag/drop listeners to ${currentSlots.length} slots.`);
        currentSlots.forEach(slot => {
            // Remove existing listeners first to prevent duplicates (optional but safer)
            // slot.removeEventListener('dragover', handleDragOver); // Assuming handleDragOver is imported/available
            // slot.removeEventListener('dragleave', handleDragLeave);
            // slot.removeEventListener('drop', handleDrop);
            // Attach the listeners from the dragdrop module
            attachDragDropListeners(slot); // Use the imported function
        });
    }

    // --- Helper: Get Current Block Loads from DOM --- (Moved to js/state/blockData.js)
    /*
    function getCurrentBlockLoads() {
        const loads = [];
        const totalWeeks = workCanvas.querySelectorAll('.week-label').length;
        for (let week = 1; week <= totalWeeks; week++) {
            const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            for (const day of daysOfWeek) {
                const cell = workCanvas.querySelector(`.day-cell[data-week="${week}"][data-day="${day}"]`);
                 let dailyLoad = 0;
                 if (cell) {
                    cell.querySelectorAll('.workout-card').forEach(card => {
                        dailyLoad += parseInt(card.dataset.load || '0', 10);
                    });
                 }
                 loads.push(dailyLoad);
            }
        }
        return loads;
    }
    */

    // --- View Management --- 
    function showView(viewName) { // 'hub' or 'builder'
        console.log(`Switching to ${viewName} view`);
        
        // Get references inside the function to ensure they're current
        const hubContainer = document.getElementById('block-builder-hub');
        const blockBuilderContainer = document.querySelector('.block-builder-container');
        const backToHubBtn = document.getElementById('back-to-hub-btn');
        
        if (!hubContainer || !blockBuilderContainer) {
            console.error("View containers not found!");
            return;
        }

        if (viewName === 'builder') {
            // Update both style and classes for better animation compatibility
            hubContainer.style.display = 'none';
            blockBuilderContainer.style.display = 'flex'; // Assuming flex layout for builder
            
            // Add body classes for consistent state management
            document.body.classList.add('show-builder');
            document.body.classList.remove('show-hub');
            
            if (backToHubBtn) backToHubBtn.style.display = 'inline'; // Show back button
        } else if (viewName === 'hub') {
            hubContainer.style.display = 'block'; // Or flex, depending on its CSS
            blockBuilderContainer.style.display = 'none';
            
            // Update body classes
            document.body.classList.add('show-hub');
            document.body.classList.remove('show-builder');
            document.body.classList.remove('gdap-program-generating'); // Ensure this is removed when going back
            
            if (backToHubBtn) backToHubBtn.style.display = 'none'; // Hide back button
        } else {
            console.warn(`Unknown view name: ${viewName}`);
        }
    }

    // <<<--- ADD EVENT LISTENERS HERE --- >>>
    // --- Hub Button Event Listeners ---
    if (createNewBtn && newBlockOptionsModal) {
        createNewBtn.addEventListener('click', () => {
            console.log("Create New Block button clicked - showing options modal.");
            newBlockOptionsModal.classList.add('is-visible');
                     });
                } else {
        if (!createNewBtn) console.error("Create New button not found!");
        if (!newBlockOptionsModal) console.error("New Block Options Modal not found!");
    }

    if (createBlockFromOptionsBtn) {
        createBlockFromOptionsBtn.addEventListener('click', () => {
             console.log("Create button inside modal clicked.");
             handleCreateBlockFromOptions(); // Call the function to create the block & switch view
        });
        } else {
         console.error("Create Block From Options button not found!");
    }

     if (newBlockOptionsCloseBtn && newBlockOptionsModal) {
        newBlockOptionsCloseBtn.addEventListener('click', () => {
            console.log("Modal close button clicked.");
                 newBlockOptionsModal.classList.remove('is-visible');
             });
        } else {
        if (!newBlockOptionsCloseBtn) console.error("Modal Close button not found!");
    }

    if (browseTemplatesBtn) {
         browseTemplatesBtn.addEventListener('click', () => {
            console.log("Browse Templates button clicked");
            // Use the templates module's showModal function if it exists
            if (typeof window.templates !== 'undefined' && typeof window.templates.showModal === 'function') {
                window.templates.showModal();
            } else {
                // Fallback - find the modal directly
                const templatesModal = document.getElementById('templates-modal');
                if (templatesModal) {
                    templatesModal.classList.add('is-visible');
                } else {
                    console.error("Templates modal not found!");
                }
            }
        });
    } else {
        console.error("Browse Templates button not found!");
    }
    
    // Add goal-driven program button event listener
    const goalDrivenBtn = document.getElementById('hub-goal-driven');
    if (goalDrivenBtn && gdapModal) {
        goalDrivenBtn.addEventListener('click', () => {
            resetGDAPForm(); // Reset form to initial state
            
            // Make sure we have the exercises loaded before showing the modal
            const tryPopulateExercises = () => {
                // First try using getExercises
                if (typeof getExercises === 'function') {
                    const exercises = getExercises();
                    if (exercises && Array.isArray(exercises) && exercises.length > 0) {
                        // We have the data from getExercises, populate and show modal
                        console.log("GDAP: Using exercises from getExercises with", exercises.length, "exercises");
                        populateExerciseDropdownForGDAP(document.getElementById('gdapTargetExercise1'));
                        populatePeriodizationModelDropdown();
                        gdapModal.classList.add('is-visible');
                        return;
                    }
                }
                
                // Fallback to exerciseLibraryData
                if (exerciseLibraryData && Array.isArray(exerciseLibraryData) && exerciseLibraryData.length > 0) {
                    // We have the data, populate and show modal
                    console.log("GDAP: Using loaded exercise library with", exerciseLibraryData.length, "exercises");
                    populateExerciseDropdownForGDAP(document.getElementById('gdapTargetExercise1'));
                    populatePeriodizationModelDropdown();
                    gdapModal.classList.add('is-visible');
                } else {
                    // Try to load the library first
                    console.log("GDAP: Exercise library not found, attempting to load");
                    if (typeof loadExerciseLibrary === 'function') {
                        loadExerciseLibrary().then(loadedData => {
                            if (loadedData) {
                                exerciseLibraryData = loadedData;  // Save it for future use
                                console.log("GDAP: Successfully loaded exercise library with", loadedData.length, "exercises");
                                populateExerciseDropdownForGDAP(document.getElementById('gdapTargetExercise1'));
                                populatePeriodizationModelDropdown();
                                gdapModal.classList.add('is-visible');
                            }
                        }).catch(err => {
                            console.error("GDAP: Failed to load exercise library", err);
                            // Show modal anyway
                            populateExerciseDropdownForGDAP(document.getElementById('gdapTargetExercise1'));
                            populatePeriodizationModelDropdown();
                            gdapModal.classList.add('is-visible');
                        });
                    } else {
                        // No way to load the library, just show modal with error
                        populateExerciseDropdownForGDAP(document.getElementById('gdapTargetExercise1'));
                        populatePeriodizationModelDropdown();
                        gdapModal.classList.add('is-visible');
                    }
                }
            };
            
            tryPopulateExercises();
        });
    }
    // <<<--- END ADDED EVENT LISTENERS --- >>>

    // --- Helper Functions Now Defined INSIDE DOMContentLoaded ---

    /**
     * Converts a week number and day preference to a standardized dayId format
     * @param {number} weekNumber - The week number (1-based)
     * @param {string} dayPref - The day preference (e.g., 'mon', 'tue')
     * @returns {string} The standardized dayId format (e.g., 'week-0-day-0')
     */
    function convertToDayId(weekNumber, dayPref) {
        // Convert 1-based week to 0-based for the dayId format
        const weekIndex = weekNumber - 1;
        
        // Convert day abbreviation to day index (0 = Monday, 1 = Tuesday, etc.)
        const dayMap = {
            'mon': 0, 'tue': 1, 'wed': 2, 'thu': 3, 'fri': 4, 'sat': 5, 'sun': 6
        };
        
        const dayIndex = dayMap[dayPref.toLowerCase()];
        
        if (dayIndex === undefined) {
            console.warn(`Invalid day preference: ${dayPref}`);
            return null;
        }
        
        return `week-${weekIndex}-day-${dayIndex}`;
    }

    /**
     * Creates a workout card DOM element.
     * Utilizes getStructuredDetails, calculateEstimatedLoad, deleteWorkoutCard, 
     * handleSelection, openInspector, updateCardVbtIndicator (needs import/def)
     */
    function createWorkoutCard(exerciseName, details, options = {}) { 
        const card = document.createElement('div');
        card.className = 'workout-card';
        card.draggable = true;
        card.id = options.id || `workout-${Date.now()}-${Math.random().toString(16).slice(2)}`; 

        // If exerciseName is not provided but there's an exerciseId, try to get it from the library
        if (!exerciseName && options.exerciseId) {
            const exercise = typeof findExerciseById === 'function' 
                ? findExerciseById(options.exerciseId)
                : (typeof ExerciseLibrary !== 'undefined' && typeof ExerciseLibrary.getExerciseById === 'function'
                    ? ExerciseLibrary.getExerciseById(options.exerciseId)
                    : null);
            
            if (exercise) {
                exerciseName = exercise.name;
            }
        }

        // Default to "Unknown Exercise" if still not found
        exerciseName = exerciseName || "Unknown Exercise";

        // --- MODIFIED: Use options directly, remove getStructuredDetails call --- 
        // Set dataset attributes directly from options or use defaults
        card.dataset.sets = options.sets || '';
        card.dataset.reps = options.reps || '';
        card.dataset.loadType = options.loadType || 'rpe'; // Default to RPE or empty? Let's keep RPE default for now
        card.dataset.loadValue = options.loadValue || '';
        card.dataset.rest = options.rest || '';
        card.dataset.exerciseId = options.exerciseId || ''; // <<< ADDED exerciseId
        // Use provided notes from options, fall back to original details string if notes aren't in options
        card.dataset.notes = options.notes || details || ''; 
        // Calculate or use provided load
        card.dataset.load = options.load || calculateEstimatedLoad(card.dataset);
        // --- END MODIFICATION --- 

        // --- Periodization Data ---
        card.dataset.modelDriven = options.modelDriven === true ? 'true' : 'false';
        if (options.sourceModelId) {
            card.dataset.sourceModelId = options.sourceModelId;
        }
        // TODO: Add visual icon if modelDriven is true (Phase 4)

        // --- Card Content ---
        // Compose intensity string based on loadType and loadValue
        let intensityText = '';
        const loadType = options.loadType || card.dataset.loadType || '';
        const loadValue = options.loadValue || card.dataset.loadValue || '';
        if (loadType && loadValue) {
            if (loadType === 'rpe') {
                intensityText = `RPE ${loadValue}`;
            } else if (loadType === 'percent' || loadType === '%') {
                intensityText = `${loadValue}%`;
            } else if (loadType === 'weight' || loadType === 'kg' || loadType === 'lb') {
                intensityText = `${loadValue}${loadType === 'kg' || loadType === 'weight' ? 'kg' : loadType === 'lb' ? 'lb' : ''}`;
            } else {
                intensityText = `${loadValue} ${loadType}`;
            }
        } else {
            intensityText = '-';
        }
        const repsText = options.sets && options.reps ? `${options.sets}×${options.reps}` : (card.dataset.sets && card.dataset.reps ? `${card.dataset.sets}×${card.dataset.reps}` : '-');
        card.innerHTML = `
            <div class="exercise-name">${exerciseName}</div>
            <div class="card-details-row">
                <span class="card-reps">${repsText}</span>
                <span class="card-intensity">${intensityText}</span>
            </div>
            <div class="card-actions">
                <button class="card-action-btn edit-btn" title="Edit Exercise">✏️</button>
                <button class="card-action-btn delete-btn" title="Delete Exercise">🗑️</button>
            </div>
            <div class="vbt-indicator" style="display: none;" title="Velocity Loss Target"></div>
        `;

        // Add event listeners 
        // Needs deleteWorkoutCard definition or import
        card.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering cell selection
            // deleteWorkoutCard(card); // Assuming deleteWorkoutCard is available in this scope or imported
             if (typeof deleteWorkoutCard === 'function') {
                 deleteWorkoutCard(card);
             } else {
                 console.warn('deleteWorkoutCard function not available. Removing card directly.');
                 card.remove();
                 triggerSaveState(); 
                 triggerAnalyticsUpdate(workCanvas);
             }
        });
        
        // Needs handleSelection, openInspector 
        card.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation(); 
            handleSelection(card, false); // Select only this card
            openInspector(card);
        });

        // NEW: Make clicking the card (not edit/delete) open inspector and select
        card.addEventListener('click', (e) => {
            if (e.target.closest('.edit-btn') || e.target.closest('.delete-btn')) return;
            handleCardClick(card, e.shiftKey);
        });

        // Note: Removed model icon listener and update call

        return card;
    }

    // Helper to estimate load (simplified)
    function calculateEstimatedLoad(dataset) {
        let estimatedLoad = 300; // Base load
        const sets = parseInt(dataset.sets, 10) || 1;
        const reps = parseInt(String(dataset.reps).split('-')[0], 10) || 5; // Take first number if range
        const loadVal = parseFloat(dataset.loadValue) || 0;
        estimatedLoad += sets * reps * 5;
        if (dataset.loadType === '%' && loadVal > 0) {
            estimatedLoad *= (loadVal / 100);
        } else if (loadVal > 0) {
            estimatedLoad += loadVal;
        }
        return Math.round(estimatedLoad).toString();
    }

    // --- Load Initial Block State into DOM ---
    // Uses workCanvas, loadStateDataFromLocalStorage, showView, generateCalendarGrid, 
    // phaseRibbon, updateCalendarPhaseIndicators, PeriodizationModelManager, 
    // createWorkoutCard, updateCardVbtIndicator, attachListenersToAllSlots, triggerAnalyticsUpdate
    function loadBlockIntoDOM() {
        console.log("Forcing Hub view on initial load.");
        showView('hub');
        // --- REMOVE STATE LOADING LOGIC --- 
        /* 
        console.log("Attempting to load block state into DOM...")
        const state = loadStateDataFromLocalStorage(); // Get the raw state data

        // --- MODIFIED CHECK --- 
        // Check not just if state exists, but if it contains meaningful data
        const isValidState = state && 
                           ( (state.slots && Object.keys(state.slots).length > 0) || 
                             (state.phases && state.phases.length > 0) ||
                             (state.periodizationModels && Object.keys(state.periodizationModels.modelInstances || {}).length > 0)
                           );

        if (!isValidState) {
            console.log("No valid saved state found or error loading. Showing Hub.");
            showView('hub'); // Show hub if no *valid* state
            // Populate recent blocks for the hub view even if no active state
            // This might need adjustment depending on where populateRecentBlocks is called
            // if (typeof populateRecentBlocks === 'function') populateRecentBlocks(); 
            return;
        }
        // --- END MODIFIED CHECK ---

        console.log("Valid saved state loaded:", state);

        // 1. Clear existing canvas
        if (workCanvas) workCanvas.innerHTML = '';
        else { console.error("loadBlockIntoDOM: workCanvas not found!"); return; }

        // Determine number of weeks
        let maxWeek = 0;
        if (state.slots) {
            Object.keys(state.slots).forEach(key => {
                const match = key.match(/w(\d+)d/);
                if (match && parseInt(match[1], 10) > maxWeek) {
                    maxWeek = parseInt(match[1], 10);
                }
            });
        }
        if (maxWeek === 0) maxWeek = 8;
        console.log(`Generating grid for ${maxWeek} weeks based on loaded state.`);

        // 2. Generate Grid Structure
        generateCalendarGrid(maxWeek);

        // 3. Restore Phases
        if (state.phases && state.phases.length > 0 && phaseRibbon) {
            const phaseBars = phaseRibbon.querySelectorAll('.phase-bar');
            if (phaseBars.length === state.phases.length) {
                state.phases.forEach((phaseData, index) => {
                    phaseBars[index].style.width = phaseData.width;
                });
                updateCalendarPhaseIndicators(phaseRibbon, workCanvas);
            } else {
                console.warn("Mismatch between saved phases and default ribbon structure.");
            }
        }

        // 4. Load Periodization Model State
        if (state.periodizationModels) {
            PeriodizationModelManager.loadState(state.periodizationModels);
        } else {
            PeriodizationModelManager.loadState({}); // Clear manager state if none saved
        }

        // 5. Restore Workout Cards
        if (state.slots && workCanvas) {
            Object.entries(state.slots).forEach(([slotKey, cardsData]) => {
                const match = slotKey.match(/w(\d+)d(\w+)/);
                if (match) {
                    const week = match[1];
                    const day = match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase();
                    const cell = workCanvas.querySelector(`.day-cell[data-week="${week}"][data-day="${day}"]`);
                    if (cell) {
                        cardsData.forEach(cardData => {
                            const newCard = createWorkoutCard(cardData.name, cardData.notes, { 
                                id: cardData.id,
                                sets: cardData.sets,
                                reps: cardData.reps,
                                loadType: cardData.loadType,
                                loadValue: cardData.loadValue,
                                rest: cardData.rest,
                                load: cardData.load,
                                modelDriven: cardData.modelDriven,
                                sourceModelId: cardData.sourceModelId
                            });
                            cell.appendChild(newCard);
                            // VBT Indicator Update (check if function exists)
                            if (typeof updateCardVbtIndicator === 'function') {
                                updateCardVbtIndicator(newCard, newCard.dataset.vbtTarget);
        } else {
                                // console.warn("updateCardVbtIndicator not available");
                            }
                            // Update icon state after loading card
                            updateCardIcon(newCard); 
                        });
                    } else {
                        console.warn(`Slot element not found for key ${slotKey} (Week: ${week}, Day: ${day})`);
                    }
                } else {
                     console.warn(`Could not parse slot key: ${slotKey}`);
                }
            });
        }

        // 6. Update Day Cell DOM Attributes from Loaded Model Manager State
        const loadedMapping = PeriodizationModelManager.dayModelMapping;
        if (loadedMapping && Object.keys(loadedMapping).length > 0 && workCanvas) {
            console.log("Updating day cell DOM attributes from loaded model manager state...");
            Object.entries(loadedMapping).forEach(([dayId, instanceId]) => {
                const cellElement = workCanvas.querySelector(`[data-day-id="${dayId}"]`);
                if (cellElement) {
                    PeriodizationModelManager.updateDayCellDOMAttributes(cellElement, instanceId);
                    // Call updateDayBadge AFTER attributes are set
                    updateDayBadge(cellElement); 
                } else {
                    console.warn(`Could not find day cell element for ${dayId} during post-load update.`);
                }
            });
        }

        // 7. Re-attach listeners
        attachListenersToAllSlots(); // Uses attachDragDropListeners

        // 8. Trigger analytics
        triggerAnalyticsUpdate(workCanvas);

        // 9. Show the builder view
        showView('builder'); 
        console.log("Block state loaded and applied to DOM.")
        */
        // --- END REMOVED STATE LOADING LOGIC ---
    }

    // --- Load Settings Into DOM ---
    // Uses loadSettingsDataFromLocalStorage
    function loadSettingsIntoDOM() {
        console.log("Attempting to load settings into DOM...");
        const settings = loadSettingsDataFromLocalStorage();
        if (!settings) {
            console.log("No saved settings found.");
            return; 
        }
        console.log("Saved settings loaded:", settings);
        
        // Apply settings (Example: block name)
        if (blockNameInput && settings.blockName) { // blockNameInput is defined in outer scope
            blockNameInput.value = settings.blockName;
        }
        
        // Apply other settings...
        // Example: RPE drift - Need element references
        const prevPlannedRpeInput = document.getElementById('prev-planned-rpe');
        const prevActualRpeInput = document.getElementById('prev-actual-rpe');
        if (prevPlannedRpeInput && settings.prevPlannedRpe) {
            prevPlannedRpeInput.value = settings.prevPlannedRpe;
        }
        if (prevActualRpeInput && settings.prevActualRpe) {
            prevActualRpeInput.value = settings.prevActualRpe;
        }

        console.log("Settings applied to DOM.");
    }

    // --- Periodization Model Visuals (Badges) ---

    /**
     * Creates or updates the model badge on a day cell.
     * @param {HTMLElement} dayCellElement - The day cell DOM element.
     */
    function updateDayBadge(dayCellElement) {
        // console.log(`[updateDayBadge] Updating badge for cell:`, dayCellElement?.dataset.dayId);
        if (!dayCellElement) return;
        const dayId = dayCellElement.dataset.dayId;
        if (!dayId) return;

        const instanceId = window.periodizationManager?.getModelForDay(dayId) || null;
        // console.log(`[updateDayBadge] Model instanceId for day ${dayId}: ${instanceId}`);
        
        if (instanceId) {
            const model = window.periodizationManager?.getModelInstance(instanceId);
            // console.log(`[updateDayBadge] Fetched model instance:`, model);
            if (!model) {
                // console.log(`[updateDayBadge] Model instance not found, removing badge.`);
                removeDayBadgeAndClasses(dayCellElement);
                return;
            }

            // Check if any card within the cell is actually model-driven
            const modelDrivenCard = dayCellElement.querySelector('.workout-card[data-model-driven="true"]');
            const hasModelDrivenCard = !!modelDrivenCard;
            // console.log(`[updateDayBadge] Cell has model-driven card: ${hasModelDrivenCard}`, modelDrivenCard);
            
            if (hasModelDrivenCard) {
                let badge = dayCellElement.querySelector('.model-badge');
                let createdBadge = false;
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'model-badge';
                    dayCellElement.prepend(badge); 
                    badge.addEventListener('click', handleModelBadgeClick);
                    createdBadge = true;
                }
                // console.log(`[updateDayBadge] Badge element ${createdBadge ? 'created' : 'found'}:`, badge);

                const modelType = model.type.toLowerCase();
                const shortType = modelType.substring(0, 3).toUpperCase();
                const icon = getIconForModelType(modelType);
                // console.log(`[updateDayBadge] Model type: ${modelType}, Icon: ${icon}, ShortType: ${shortType}`);
                
                // Update badge content and attributes
                badge.className = `model-badge model-type-${modelType}`; 
                badge.dataset.modelId = instanceId;
                badge.innerHTML = `<span class="badge-icon">${icon}</span><span class="badge-text">${shortType}</span>`;
                badge.title = `Model: ${model.type} (${instanceId})\nParams: ${JSON.stringify(model.params)}`;
                badge.style.display = ''; // Ensure badge is visible
                
                // Add classes to the day cell itself for styling
                dayCellElement.classList.add('has-model');
                dayCellElement.classList.add(`model-type-${modelType}`);
 
            } else {
                // console.log(`[updateDayBadge] Model assigned, but no model-driven cards found. Removing badge.`);
                removeDayBadgeAndClasses(dayCellElement);
            }

        } else {
            // console.log(`[updateDayBadge] No model instance assigned to this day. Removing badge.`);
            removeDayBadgeAndClasses(dayCellElement);
        }
    }

    /**
     * Removes the model badge and related classes from a day cell.
     * @param {HTMLElement} dayCellElement - The day cell DOM element.
     */
    function removeDayBadgeAndClasses(dayCellElement) {
        const badge = dayCellElement?.querySelector('.model-badge');
        if (badge) {
            badge.removeEventListener('click', handleModelBadgeClick);
            badge.remove();
        }
        // Remove classes from the cell itself
        dayCellElement.classList.remove('has-model');
        // Remove any model-type-* class
        const modelTypeClasses = Array.from(dayCellElement.classList).filter(cls => cls.startsWith('model-type-'));
        dayCellElement.classList.remove(...modelTypeClasses);
    }

    /**
     * Click handler for model badges.
     * @param {Event} event 
     */
    function handleModelBadgeClick(event) {
        event.stopPropagation(); // Prevent day cell click
        const badge = event.currentTarget;
        const instanceId = badge.dataset.modelId;
        const dayCell = badge.closest('.day-cell');
        const dayId = dayCell?.dataset.dayId;

        if (instanceId && dayId && dayCell) {
            console.log(`Model badge clicked: Instance ${instanceId}, Day ${dayId}`);
            handleModelContextSelection(instanceId, dayId, dayCell);
        } else {
            console.warn("Could not get modelId, dayId, or dayCell from badge click event.");
        }
    }

    /**
     * Sets the selection context to a specific model on a specific day.
     * @param {string} instanceId - The ID of the selected model instance.
     * @param {string} dayId - The ID of the day cell related to the selection.
     * @param {HTMLElement} dayCellElement - The DOM element of the day cell.
     */
    function handleModelContextSelection(instanceId, dayId, dayCellElement) {
        try {
            clearSelectionStyles();
        } catch (error) {
            console.error('[BlockBuilder] Error in clearSelectionStyles (Model Selection):', error);
        }
        handleSelection(dayCellElement, false);
        syncSelectedContext('model', { modelId: instanceId, dayId });
        ForgeAssist.updateContext(dayCellElement, selectedContext.elements);
        dayCellElement.classList.add('model-context-selected');
        updateInspectorForSelection();
    }

    /**
     * Helper function to remove all selection-related visual styles.
     */
    function clearSelectionStyles() {
        document.querySelectorAll('.selected, .model-context-selected').forEach(el => {
            el.classList.remove('selected', 'model-context-selected');
        });
    }

    /**
     * Helper to get an icon for a model type.
     * @param {string} modelType 
     * @returns {string} Emoji icon string
     */
    function getIconForModelType(modelType) {
        switch (modelType.toLowerCase()) {
            case 'linear': return '📈';
            case 'wave': return '🌊';
            case 'triphasic': return '🧱'; // Or maybe ⚡️ ?
            case 'undulating': return '📊';
            default: return '⚙️';
        }
    }

    // --- Phase Ribbon Selection --- 
    phaseRibbon.addEventListener('click', (e) => {
        if (e.target.classList.contains('phase-resize-handle')) {
            return;
        }
        const clickedPhase = e.target.closest('.phase-bar');
        if (clickedPhase) {
            try {
                clearSelectionStyles();
            } catch (error) {
                console.error('[BlockBuilder] Error in clearSelectionStyles (Phase Click):', error);
            }
            handleSelection(clickedPhase, false);
            syncSelectedContext('phase');
            ForgeAssist.updateContext(clickedPhase, selectedContext.elements);
            updateInspectorForSelection();
            openInspector(clickedPhase);
        }
    });

    // --- Refactored workCanvas Click Listener ---
    workCanvas.addEventListener('click', (e) => {
        if (e.target.closest('.model-badge')) {
            return;
        }
        if (e.target.closest('.card-action-btn')) {
            return;
        }
        const clickedCard = e.target.closest('.workout-card');
        const clickedCell = e.target.closest('.day-cell');
        if (clickedCard) {
            handleCardClick(clickedCard, e.shiftKey);
            return;
        }
        if (clickedCell) {
            try {
                clearSelectionStyles();
            } catch (error) {
                console.error('[BlockBuilder] Error in clearSelectionStyles (Cell Click):', error);
            }
            handleSelection(clickedCell, e.shiftKey);
            syncSelectedContext('day', { dayId: clickedCell.dataset.dayId });
            ForgeAssist.updateContext(clickedCell, selectedContext.elements);
            updateInspectorForSelection();
            openInspector(clickedCell);
            return;
        }
        if (!e.target.closest('.inspector-panel') && !e.target.closest('.phase-bar')) {
            try {
                clearSelectionStyles();
            } catch (error) {
                console.error('[BlockBuilder] Error in clearSelectionStyles (Background Click):', error);
            }
            handleSelection(null, false);
            syncSelectedContext('none');
            ForgeAssist.updateContext(null, selectedContext.elements);
            updateInspectorForSelection();
            closeInspector();
        }
    });

    // --- Inspector Update Logic ---

    // Needs getStructuredDetails, showToast, ForgeAssist // <<< Added ForgeAssist dependency note
    function renderAssistTabContent() {
        const assistTabContent = document.getElementById('assist');
        if (!assistTabContent) return;

        // Get actions directly from ForgeAssist
        const actions = ForgeAssist.getContextualActions(); 

        if (!actions || actions.length === 0) {
            assistTabContent.innerHTML = '<p><i>No contextual actions available.</i></p>';
            return;
        }

        let contentHtml = '<h4>ForgeAssist™ Actions</h4><ul>';
        actions.forEach(action => {
            contentHtml += `<li><button class="assist-action cta-button secondary-cta" 
                                    data-action-id="${action.id}" 
                                    ${action.disabled ? 'disabled' : ''}>
                                ${action.label}
                           </button></li>`;
        });
        contentHtml += '</ul>';
        assistTabContent.innerHTML = contentHtml;

        // Add specific listeners that call the correct handler
        assistTabContent.querySelectorAll('.assist-action').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent other inspector clicks
                const actionId = e.target.dataset.actionId;
                // Find the original action object
                const action = actions.find(a => a.id === actionId);
                
                if (action && action.handler) {
                    if (typeof action.handler === 'function') {
                        console.log(`Executing handler function for action: ${actionId}`);
                        action.handler(); // Execute the function directly
                    } else if (typeof action.handler === 'string') {
                        console.log(`Processing command string for action: ${actionId}`);
                        ForgeAssist.processCommand(action.handler); // Process as command string
                    } else {
                        console.warn(`Unknown handler type for action: ${actionId}`);
                        showToast(`Cannot execute action '${action.label}'.`, 'warning');
                    }
                } else {
                    console.error(`Handler not found for action: ${actionId}`);
                    showToast(`Action '${action.label || actionId}' could not be executed.`, 'error');
                }
            });
        });
    }

    /**
     * Renders the Recovery tab content based on the current selection context
     * Using data from the BiomechanicalAnalyzer
     */
    function renderRecoveryTabContent() {
        const recoveryTabContent = document.getElementById('recovery');
        if (!recoveryTabContent) return;

        // Default content when no selection
        if (!selectedContext || selectedContext.type === 'none' || selectedContext.elements.size === 0) {
            recoveryTabContent.innerHTML = '<p><i>Select an exercise to see recovery information.</i></p>';
            return;
        }

        // Get biomechanical analyzer from ForgeAssist
        const biomechanicalAnalyzer = ForgeAssist.getBiomechanicalAnalyzer?.();
        if (!biomechanicalAnalyzer) {
            recoveryTabContent.innerHTML = '<p><i>Recovery analysis not available.</i></p>';
            return;
        }

        // Get current muscle stress levels
        const stressLevels = biomechanicalAnalyzer.getCurrentStressLevels();
        const recoveryLevels = {};
        
        // Convert stress to recovery (1 - stress)
        for (const [muscle, stress] of Object.entries(stressLevels)) {
            recoveryLevels[muscle] = Math.max(0, Math.min(1, 1 - stress));
        }

        // Generate content based on selection type
        if (selectedContext.type === 'exercise') {
            const cardElement = selectedContext.elements.size === 1 ? 
                Array.from(selectedContext.elements)[0] : null;
            
            if (!cardElement) {
                recoveryTabContent.innerHTML = '<p><i>No exercise selected.</i></p>';
                return;
            }

            // Get exercise ID and find in library
            const exerciseId = cardElement.dataset.exerciseId;
            const exerciseName = cardElement.querySelector('.exercise-name')?.textContent || 'Exercise';
            
            if (!exerciseId) {
                recoveryTabContent.innerHTML = '<p><i>Exercise ID not found.</i></p>';
                return;
            }

            // Get recovery recommendation
            const exerciseRecovery = biomechanicalAnalyzer.getExerciseReadiness(exerciseId);
            const isReady = exerciseRecovery.isReady;
            const readinessScore = exerciseRecovery.readinessScore;
            const limitingMuscles = exerciseRecovery.limitingMuscles || [];

            // Build HTML content
            let html = `
                <h4>Recovery Analysis: ${exerciseName}</h4>
                <div class="recovery-status ${isReady ? 'recovered' : 'fatigued'}">
                    <div class="recovery-indicator"></div>
                    <div class="recovery-text">
                        <strong>Status:</strong> ${isReady ? 'Ready for Training' : 'Recovery Recommended'}
                    </div>
                </div>
                <div class="readiness-score">
                    <strong>Readiness Score:</strong> ${Math.round(readinessScore * 100)}%
                </div>
                
                <hr class="detail-separator">
                
                <h4>Muscle Recovery</h4>
                <div class="muscle-recovery-list">
            `;

            // Add muscle-specific data
            const affectedMuscles = biomechanicalAnalyzer.getExerciseTargetedMuscles(exerciseId);
            
            if (affectedMuscles && affectedMuscles.length > 0) {
                affectedMuscles.forEach(muscle => {
                    const recoveryPercent = Math.round((recoveryLevels[muscle] || 0.9) * 100);
                    const isLimiting = limitingMuscles.includes(muscle);
                    
                    html += `
                        <div class="muscle-recovery-item ${isLimiting ? 'limiting' : ''}">
                            <div class="muscle-name">${muscle}</div>
                            <div class="recovery-bar-container">
                                <div class="recovery-bar" style="width: ${recoveryPercent}%"></div>
                            </div>
                            <div class="recovery-percentage">${recoveryPercent}%</div>
                        </div>
                    `;
                });
            } else {
                html += '<p><i>No muscle data available for this exercise.</i></p>';
            }

            html += `
                </div>
                
                <hr class="detail-separator">
                
                <h4>Recommendations</h4>
            `;

            if (!isReady) {
                // Get alternative exercises
                const alternatives = ForgeAssist.getRecoveryAwareAlternatives?.(exerciseId, { count: 3 }) || [];
                
                if (alternatives.length > 0) {
                    html += '<div class="recommendations-list">';
                    alternatives.forEach(alt => {
                        html += `
                            <div class="recommendation-item">
                                <div class="recommendation-content">
                                    <strong>${alt.name}</strong>
                                    <div>Recovery: ${alt.recoveryPercentage}%</div>
                                </div>
                                <button class="swap-to-btn cta-button micro-cta" data-exercise-id="${alt.id}">Use</button>
                            </div>
                        `;
                    });
                    html += '</div>';
                } else {
                    html += `
                        <p>Consider reducing the intensity or volume for this exercise.</p>
                        <button id="reduce-intensity-btn" class="cta-button secondary-cta">Reduce Intensity</button>
                    `;
                }
            } else {
                html += '<p>This exercise is ready to be performed as scheduled.</p>';
            }

            // Set the HTML content
            recoveryTabContent.innerHTML = html;

            // Add event listeners
            recoveryTabContent.querySelectorAll('.swap-to-btn').forEach(btn => {
                btn.addEventListener('click', e => {
                    const newExerciseId = e.target.dataset.exerciseId;
                    if (newExerciseId) {
                        // Call ForgeAssist to handle the swap
                        ForgeAssist.handleSuggestSwap(newExerciseId);
                    }
                });
            });

            const reduceIntensityBtn = document.getElementById('reduce-intensity-btn');
            if (reduceIntensityBtn) {
                reduceIntensityBtn.addEventListener('click', () => {
                    // Call ForgeAssist to reduce intensity
                    ForgeAssist.handleChangeIntensity(cardElement, -1);
                });
            }
        } else {
            // Default view for non-exercise selections
            recoveryTabContent.innerHTML = `
                <h4>Current Recovery Status</h4>
                <div class="global-recovery-status">
                    <p>Select a specific exercise to see detailed recovery recommendations.</p>
                </div>
                
                <hr class="detail-separator">
                
                <h4>Muscle Groups</h4>
                <div class="muscle-recovery-list">
            `;

            // Show general muscle recovery
            const majorMuscleGroups = [
                'Quadriceps', 'Hamstrings', 'Glutes', 
                'Chest', 'Back', 'Shoulders', 
                'Biceps', 'Triceps', 'Core'
            ];

            majorMuscleGroups.forEach(muscle => {
                const recoveryPercent = Math.round((recoveryLevels[muscle] || 0.9) * 100);
                const statusClass = recoveryPercent < 50 ? 'fatigued' : 
                                   recoveryPercent < 80 ? 'recovering' : 'recovered';
                
                recoveryTabContent.innerHTML += `
                    <div class="muscle-recovery-item ${statusClass}">
                        <div class="muscle-name">${muscle}</div>
                        <div class="recovery-bar-container">
                            <div class="recovery-bar" style="width: ${recoveryPercent}%"></div>
                        </div>
                        <div class="recovery-percentage">${recoveryPercent}%</div>
                    </div>
                `;
            });

            recoveryTabContent.innerHTML += '</div>';
        }
    }

    // Needs activateTab, setTabVisibility 
    function updateInspectorPhaseDetails(phaseElement) {
        const detailsTabContent = document.getElementById('details');
        if (!detailsTabContent || !phaseElement) return;

        const phaseId = phaseElement.id;
        const phaseName = phaseElement.dataset.phaseName || 'Unnamed Phase';
        const startWeek = phaseElement.dataset.startWeek;
        const endWeek = phaseElement.dataset.endWeek;
        const goal = phaseElement.dataset.goal || 'Not Set';
        const notes = phaseElement.dataset.notes || '';

        if (inspectorTitle) inspectorTitle.textContent = `Phase: ${phaseName}`;

        detailsTabContent.innerHTML = `
            <h4>${phaseName}</h4>
            <p><small>ID: ${phaseId}</small></p>
            <p><strong>Weeks:</strong> ${startWeek} - ${endWeek}</p>
            <div class="form-group full-width">
                <label for="inspector-phase-name">Phase Name</label>
                <input type="text" id="inspector-phase-name" value="${phaseName}">
            </div>
            <div class="form-group full-width">
                <label for="inspector-phase-goal">Goal</label>
                <select id="inspector-phase-goal">
                    <option value="" ${goal === 'Not Set' ? 'selected' : ''}>Not Set</option>
                    <option value="hypertrophy" ${goal === 'hypertrophy' ? 'selected' : ''}>Hypertrophy</option>
                    <option value="strength" ${goal === 'strength' ? 'selected' : ''}>Strength</option>
                    <option value="power" ${goal === 'power' ? 'selected' : ''}>Power</option>
                    <option value="endurance" ${goal === 'endurance' ? 'selected' : ''}>Endurance</option>
                    <option value="peaking" ${goal === 'peaking' ? 'selected' : ''}>Peaking</option>
                    <option value="maintenance" ${goal === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                     <option value="other" ${goal === 'other' ? 'selected' : ''}>Other</option>
                 </select>
            </div>
            <div class="form-group full-width">
                 <label for="inspector-phase-notes">Notes</label>
                <textarea id="inspector-phase-notes" rows="3">${notes}</textarea>
            </div>
            <hr class="detail-separator">
            <button id="save-phase-details" class="cta-button primary-cta">Save Phase</button>
            <button id="delete-phase" class="cta-button secondary-cta" style="margin-top: 10px; background-color: #555;">Delete Phase</button>
            <button id="split-phase" class="cta-button secondary-cta" style="margin-top: 10px;">Split Phase Here</button>
            `;

         // Add event listeners (needs save/delete/split functions)
         document.getElementById('save-phase-details')?.addEventListener('click', () => {
             console.log('Save Phase clicked'); // Placeholder
             // Call actual save function: savePhaseDetails(phaseElement);
             showToast('Save Phase functionality pending.', 'info');
         });
        document.getElementById('delete-phase')?.addEventListener('click', () => {
             console.log('Delete Phase clicked'); // Placeholder
             // Call actual delete function: deletePhase(phaseElement);
             showToast('Delete Phase functionality pending.', 'info');
         });
        document.getElementById('split-phase')?.addEventListener('click', () => {
            console.log('Split Phase clicked'); // Placeholder
            // Call actual split function: splitPhase(phaseElement);
             showToast('Split Phase functionality pending.', 'info');
         });
    }

    // Needs activateTab, setTabVisibility, deleteSelectedWorkoutCard (needs import/def)
    function openMultiSelectInspector() {
        if (!inspectorPanel.classList.contains('is-visible')) {
            openInspector(); // Open with default view first if closed
        }

        const detailsTab = document.getElementById('details');
        if (!detailsTab) return;

        activateTab('details'); 

        const selectionSize = selectedContext.elements.size;
        if (inspectorTitle) inspectorTitle.textContent = `${selectionSize} Items Selected`;

        detailsTab.innerHTML = `
            <h4>Multiple Items Selected (${selectionSize})</h4>
            <p>Apply bulk actions:</p>
            <button id="delete-selected-items" class="cta-button secondary-cta" style="background-color: #555;">Delete Selected Cards</button>
            <hr class="detail-separator">
            <p><em>More bulk actions coming soon (e.g., copy, tag).</em></p>
        `;

        const deleteBtn = detailsTab.querySelector('#delete-selected-items');
        if (deleteBtn) {
            const cardsSelected = Array.from(selectedContext.elements).some(el => el.classList.contains('workout-card'));
            deleteBtn.disabled = !cardsSelected;
            if (cardsSelected) {
                deleteBtn.addEventListener('click', () => {
                    // Call delete helper, needs reference
                    if (typeof deleteSelectedWorkoutCard === 'function') {
                        deleteSelectedWorkoutCard(); // Assumes it uses the selection context
        } else {
                        console.warn("deleteSelectedWorkoutCard not available for bulk delete");
                    }
        });
            } else {
                deleteBtn.textContent = 'Delete Selected (No Cards)';
            }
        }
        setTabVisibility(['details']); 
    }

    // Needs clearInspectorFocusMessage, getStructuredDetails, updateLoadValueExplanation, 
    // saveWorkoutCardDetails, deleteSelectedWorkoutCard, renderAssistTabContent, 
    // updateInspectorPhaseDetails, openMultiSelectInspector, populateInspectorModelView (new)
    function updateInspectorForSelection() {
        // Clear any focus message
        clearInspectorFocusMessage();
        
        // Get the details tab content element
        const detailsTabContent = document.getElementById('details');
        
        // Render the ForgeAssist tab content
        renderAssistTabContent();

        // Render the Recovery tab content
        renderRecoveryTabContent();

        // Render the Adaptive tab content with the selected element
        const selectedElement = selectedContext.elements.size === 1 ? 
            Array.from(selectedContext.elements)[0] : null;
        populateAdaptiveTab(selectedElement);
        
        // No selection, show default view
        if (selectedContext.type === 'none' || selectedContext.elements.size === 0) {
            // Only make changes if the inspector is visible
            if (inspectorPanel.classList.contains('is-visible')) {
                // Hide model-specific tabs, show standard tabs
                setTabVisibility(['library', 'details', 'assist', 'recovery', 'adaptive', 'analytics', 'settings']);
                
                // Show block settings in title
                if (inspectorTitle) inspectorTitle.textContent = 'Block Settings';
                
                // Show appropriate content
                activateTab('settings'); 
            }
            return;
        }

        // Ensure inspector is visible if we have a valid single selection type
        if (!inspectorPanel.classList.contains('is-visible')) {
            openInspector(selectedElement); // Make sure openInspector is available
        }
        
        // --- Handle Different Selection Types ---
        switch (selectedContext.type) {
            case 'exercise':
                // Add the recovery tab to the visible tabs
                setTabVisibility(['library', 'details', 'assist', 'recovery', 'adaptive', 'analytics', 'settings']);
                activateTab('details');
                const cardElement = selectedElement; // Alias for clarity
                const structuredDetails = getStructuredDetails(cardElement);
                const parentCell = cardElement.closest('.day-cell');
                const week = parentCell?.dataset.week || '?';
                const day = parentCell?.dataset.day || '?';
                const cardLoad = parseInt(cardElement.dataset.load || '0', 10);

                // Update title and details content
                if (inspectorTitle) {
                    // Add origin indicator for GDAP or model-driven exercises
                    let titlePrefix = '';
                    if (structuredDetails.isGDAP) {
                        titlePrefix = '[GDAP] ';
                    } else if (structuredDetails.isModelDriven) {
                        titlePrefix = '[Model] ';
                    }
                    inspectorTitle.textContent = `Edit: ${titlePrefix}${structuredDetails.name}`;
                }
                
                // Highlight GDAP or model status if applicable
                let statusHtml = '';
                if (structuredDetails.isGDAP) {
                    statusHtml = `<div style="margin-bottom: 10px; padding: 8px; background-color: rgba(255, 112, 59, 0.1); border-left: 3px solid var(--accent-color); font-size: 0.9rem;">
                        <strong>Goal-Driven Exercise:</strong> This exercise is part of your goal-driven program.
                    </div>`;
                } else if (structuredDetails.isModelDriven) {
                    const modelType = cardElement.dataset.modelType || 'Custom';
                    statusHtml = `<div style="margin-bottom: 10px; padding: 8px; background-color: rgba(58, 123, 213, 0.1); border-left: 3px solid #3a7bd5; font-size: 0.9rem;">
                        <strong>${modelType} Model Exercise:</strong> This exercise is generated by a periodization model.
                    </div>`;
                }

                detailsTabContent.innerHTML = `
                    <p><small>Location: Week ${week}, ${day}</small></p>
                    <p><small>Est. Load Contribution: ${cardLoad} units</small></p>
                    ${statusHtml}
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
                                <input type="text" id="inspector-reps" value="${structuredDetails.reps}">
                            </div>
                        </div>
                        <div style="display: flex; gap: 1rem; width: 100%; margin-bottom: 1rem;">
                            <div class="form-group" style="flex-basis: calc(50% - 1rem); flex-grow: 1;">
                                <label for="inspector-load-type">Load Type</label>
                                <select id="inspector-load-type">
                                   <option value="rpe" ${structuredDetails.loadType === 'rpe' ? 'selected' : ''}>RPE (Rate of Perceived Exertion)</option>
                                   <option value="percent" ${structuredDetails.loadType === 'percent' ? 'selected' : ''}>Percentage (%)</option>
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
                // Add listeners
                document.getElementById('save-card-details')?.addEventListener('click', saveWorkoutCardDetails); 
                document.getElementById('delete-card')?.addEventListener('click', () => {
                    if(typeof deleteSelectedWorkoutCard === 'function') deleteSelectedWorkoutCard(cardElement);
                    else console.warn('deleteSelectedWorkoutCard not available');
                }); 
                const loadTypeSelect = document.getElementById('inspector-load-type');
                if (loadTypeSelect && typeof updateLoadValueExplanation === 'function') {
                    loadTypeSelect.addEventListener('change', updateLoadValueExplanation);
                    updateLoadValueExplanation(); 
                }
                break;

            case 'day':
                // Add the recovery tab to the visible tabs
                setTabVisibility(['library', 'details', 'assist', 'recovery', 'adaptive', 'analytics', 'settings']);
                activateTab('details');
                const dayCellElement = selectedElement;
                const week_day = dayCellElement.dataset.week;
                const day_day = dayCellElement.dataset.day;

                if (inspectorTitle) inspectorTitle.textContent = `Day Details: Wk ${week_day}, ${day_day}`;

                let totalDayLoad = 0;
                let cardCount = 0;
                let exerciseNames = [];
                dayCellElement.querySelectorAll('.workout-card:not(.session-placeholder-card)').forEach(card => {
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
                detailsTabContent.innerHTML = `<h4>Week ${week_day}, ${day_day}</h4>`;
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
                break;

            case 'phase':
                // Add the recovery tab to the visible tabs
                setTabVisibility(['library', 'details', 'assist', 'recovery', 'adaptive', 'analytics', 'settings']);
                activateTab('details');
                updateInspectorPhaseDetails(selectedElement); 
                break;
           
            case 'model':
                 // New case for model context selection
                 console.log("Updating inspector for MODEL context");
                 // Explicitly clear/hide the standard details tab content
                 if (detailsTabContent) {
                    detailsTabContent.innerHTML = ''; 
                    detailsTabContent.classList.remove('active');
                 }
                 // Set visibility for model tabs - USE CORRECT IDs WITH -content
                 setTabVisibility(['model-status-content', 'model-config-content', 'model-sim-content']);
                 activateTab('model-status-content'); // Default to status tab - USE CORRECT ID
                 // Call a new function to populate the model-specific view
                 populateInspectorModelView(selectedContext.modelId, selectedContext.dayId);
                 break;

            default: // Includes 'none'
                 if (inspectorPanel.classList.contains('is-visible')) {
                    detailsTabContent.innerHTML = '<p>Select an item on the canvas to see details.</p>';
                    if (inspectorTitle) inspectorTitle.textContent = 'Block Settings';
                    setTabVisibility(['library', 'details', 'assist', 'analytics', 'settings']);
                    activateTab('settings'); 
                }
                break;
        }

        // Update ForgeAssist Contextual Actions for all valid selections
        // <<< REMOVED call from here, moved to top of function >>>
        // renderAssistTabContent(); 
    }

    // Save function for workout card details (Local function)
    // Needs triggerAnalyticsUpdate, triggerSaveState references
    function saveWorkoutCardDetails() {
        // Use selectedContext to find the card (should be type 'exercise' with 1 element)
        if (selectedContext.type !== 'exercise' || selectedContext.elements.size !== 1) {
             console.warn("Save called without a single exercise card selected.");
             return;
         }
        const cardElement = Array.from(selectedContext.elements)[0];
        if (!cardElement || !cardElement.classList.contains('workout-card')) return;

        const nameInput = document.getElementById('inspector-exercise-name');
        const setsInput = document.getElementById('inspector-sets');
        const repsInput = document.getElementById('inspector-reps');
        const loadTypeSelect = document.getElementById('inspector-load-type');
        const loadValueInput = document.getElementById('inspector-load-value');
        const restInput = document.getElementById('inspector-rest');
        const notesInput = document.getElementById('inspector-notes');

        // Gather updated data from the form
        const updatedData = {
            name: nameInput?.value,
            sets: setsInput?.value,
            reps: repsInput?.value,
            loadType: loadTypeSelect?.value,
            loadValue: loadValueInput?.value,
            rest: restInput?.value,
            notes: notesInput?.value
        };

        // --- Phase 12: Edit Tracking ---
        let madeIndependent = false;
        if (cardElement.dataset.modelDriven === 'true') {
            console.log("[Edit Tracking] Checking model-driven card:", cardElement.id);
            // Define which fields trigger detachment
            const fieldsToCheck = ['name', 'sets', 'reps', 'loadType', 'loadValue'];
            let changed = false;
            for (const field of fieldsToCheck) {
                let currentValue = '';
                if (field === 'name') {
                    currentValue = cardElement.querySelector('.exercise-name')?.textContent || '';
             } else {
                    currentValue = cardElement.dataset[field] || '';
                }
                const newValue = updatedData[field] || ''; // Ensure newValue is defined
                
                // Log values being compared
                // console.log(`[Edit Tracking] Comparing field '${field}': Current='${currentValue}' (${typeof currentValue}), New='${newValue}' (${typeof newValue})`);
                
                // Use strict inequality check (!==) after ensuring types are comparable if necessary
                // For simplicity, start with != but log types, switch to !== if needed.
                if (newValue != currentValue) { 
                    console.log(`[Edit Tracking] Change DETECTED in field '${field}': '${currentValue}' -> '${newValue}'`);
                    changed = true;
                    break; // Stop checking once a change is found
                }
            }

            if (changed) {
                console.log(`[Edit Tracking] Model-driven card ${cardElement.id} edited. Setting modelDriven=false.`);
                cardElement.dataset.modelDriven = 'false';
                madeIndependent = true;
                updateCardIcon(cardElement); // Hide icon
                const dayCell = cardElement.closest('.day-cell');
                if (dayCell) {
                    updateDayBadge(dayCell); // Update badge (might hide if last model card)
             }
         } else {
                 console.log("[Edit Tracking] No changes detected in key fields.");
            }
        }
        // --- End Phase 12 ---

        // Call the imported, aliased function from inspector.js
        if (typeof saveDetailsFromInspector === 'function') {
            saveDetailsFromInspector(cardElement, updatedData);
            console.log("Called imported saveDetailsFromInspector with:", updatedData);
             } else {
            console.error("Imported saveDetailsFromInspector function not found!");
            showToast("Error saving card details.", "error");
        }
    }

    // Placeholder for the function that populates the model inspector view
    function populateInspectorModelView(modelId, dayId) {
        console.log(`[populateInspectorModelView] Populating for model ${modelId}, day ${dayId}`);
        
        // Find the model configuration in our stored models
        const modelConfig = PeriodizationModelManager.getModelById(modelId);
        if (!modelConfig) {
            console.error(`[populateInspectorModelView] Model config not found for ID: ${modelId}`);
            return;
        }

        // Find the day cell that has this model applied
        const dayCell = document.querySelector(`.day-cell[data-day-id="${dayId}"][data-periodization-model-id="${modelId}"]`);
        if (!dayCell) {
            console.error(`[populateInspectorModelView] Day cell not found for day ID: ${dayId}`);
            return;
        }

        // Get all workout cards in this day - separate model-driven from independent
        const allCards = Array.from(dayCell.querySelectorAll('.workout-card'));
        const modelDrivenCards = allCards.filter(card => card.dataset.modelDriven === "true");
        const independentCards = allCards.filter(card => card.dataset.modelDriven !== "true");
        
        // Get tab elements
        const modelStatusTab = document.getElementById('model-status-content');
        const modelConfigTab = document.getElementById('model-config-content');
        const modelSimTab = document.getElementById('model-sim-content');
        
        // Update inspectorTitle
        if (inspectorTitle) {
            const dayData = dayCell.dataset;
            inspectorTitle.textContent = `Model: ${modelConfig.type} (${dayData.week}, ${dayData.day})`;
        }
        
        // Populate the status tab (summary of current state)
        if (modelStatusTab) {
            // Extract model parameters from dayCell dataset
            const params = JSON.parse(dayCell.dataset.periodizationParams || '{}');
            const weeklyStructure = params.weeklyStructure || [];
            const currentDayConfig = weeklyStructure.find(day => 
                day.dayOfWeek.toLowerCase() === dayCell.dataset.day.toLowerCase().slice(0,3)
            ) || {};
            
            // Get more detailed information about exercises
            const mainExercise = currentDayConfig.mainExercise || 'None specified';
            
            // Create HTML content with expanded information and highlighting the current exercise information
            let statusHTML = `
                <h4>Model Status</h4>
                <div class="model-summary">
                    <p><strong>Type:</strong> ${modelConfig.type}</p>
                    <p><strong>Day:</strong> Week ${dayCell.dataset.week}, ${dayCell.dataset.day}</p>
                    <p><strong>Main Exercise:</strong> ${mainExercise}</p>
                    <p><strong>Wave Position:</strong> 
                        ${params.wavePatternDefinitions ? 
                            `Week ${dayCell.dataset.week} (${
                                (parseInt(dayCell.dataset.week) % 3) === 1 ? 'Light' : 
                                (parseInt(dayCell.dataset.week) % 3) === 2 ? 'Medium' : 'Heavy'
                            })` 
                            : 'N/A'}
                    </p>
                </div>
                    
                    <div class="exercise-list-container">
                    <h6>Model-Driven Exercises (${modelDrivenCards.length}) <span class="status-icon model-icon" title="Driven by Periodization Model">⚙️</span></h6>
                    <div class="exercise-list-scroll">
                        ${modelDrivenCards.length > 0 ? `
                        <ul class="inspector-card-list model-driven-list">
                            ${modelDrivenCards.map(card => {
                                const name = card.querySelector('.exercise-name')?.textContent || 'Unknown';
                                const sets = card.dataset.sets || '?';
                                const reps = card.dataset.reps || '?';
                                const loadType = card.dataset.loadType || '';
                                const loadValue = card.dataset.loadValue || '';
                                const details = `${sets}x${reps} ${loadType ? (loadType + ' ' + loadValue) : ''}`.trim();
                                return `<li data-card-id="${card.id}" class="model-card-item" title="Click to highlight on canvas">
                                            <span class="exercise-item-name">${name}</span> 
                                            <small class="exercise-item-details">${details}</small>
                                            <div class="card-item-hover-actions">
                                                <button class="card-action-btn edit-override" title="Override settings">Edit</button>
                                                <button class="card-action-btn view-details" title="View exercise details">Info</button>
                                            </div>
                                        </li>`;
                            }).join('')}
                        </ul>
                        ` : '<p><small>No model-driven exercises found.</small></p>'}
                    </div>

                    <div class="exercise-list-container">
                        <h6>Independent (${independentCards.length}) <span class="status-icon independent-icon" title="Manually Edited/Added">✏️</span></h6>
                        <div class="exercise-list-scroll">
                         ${independentCards.length > 0 ? `
                        <ul class="inspector-card-list independent-list">
                             ${independentCards.map(card => {
                                const name = card.querySelector('.exercise-name')?.textContent || 'Unknown';
                                    const details = card.dataset.notes || '';
                                return `<li data-card-id="${card.id}" title="Click to highlight on canvas">
                                             <span class="exercise-item-name">${name}</span> 
                                             <small class="exercise-item-details">${details}</small>
                                         </li>`;
                            }).join('')}
                         </ul>
                            ` : '<p><small>No independent exercises found.</small></p>'}
                        </div>
                     </div>
                </div>

                <div class="model-actions">
                    <button id="regenerate-model-btn" class="cta-button primary-cta">Regenerate Exercises</button>
                    <button id="modify-model-btn" class="cta-button secondary-cta">Modify Model</button>
                </div>
            `;
            
            modelStatusTab.innerHTML = statusHTML;
            
            // Add event listeners for the model-driven card items
            modelStatusTab.querySelectorAll('.model-card-item').forEach(item => {
                const cardId = item.dataset.cardId;
                const cardElement = document.getElementById(cardId);
                
                // Highlight the card when clicked
                item.addEventListener('click', () => {
                    // Remove highlight from all cards
                    document.querySelectorAll('.workout-card.highlighted').forEach(c => 
                        c.classList.remove('highlighted')
                    );
                    
                    // Highlight this card
                    if (cardElement) {
                        cardElement.classList.add('highlighted');
                        cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
                
                // Edit override button
                item.querySelector('.edit-override')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (cardElement) {
                        cardElement.dataset.modelOverride = "true";
                        handleSelection(cardElement);
                        openInspector(cardElement);
                    }
                });
                
                // View details button
                item.querySelector('.view-details')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (cardElement) {
                        // Show exercise details modal or info panel
                        const exerciseName = cardElement.querySelector('.exercise-name')?.textContent;
                        const exerciseId = cardElement.dataset.exerciseId;
                        if (exerciseId) {
                            const exerciseData = dependencies.exerciseLibrary.find(ex => ex.id === exerciseId);
                            if (exerciseData) {
                                // Use existing function to show modal if available
                                if (typeof showExerciseDetailModal === 'function') {
                                    showExerciseDetailModal(exerciseData);
                                } else {
                                    // Or show basic info
                                    showToast(`Exercise: ${exerciseName}`, 'info');
                                }
                            }
                        }
                    }
                });
            });
            
            // Add event listeners for the action buttons
            modelStatusTab.querySelector('#regenerate-model-btn')?.addEventListener('click', () => {
                if (confirm('Regenerate all model-driven exercises for this day? This will reset any overrides.')) {
                    // Call model regeneration function
                    PeriodizationModelManager.regenerateDay(modelId, dayId);
                    // Update the inspector view
                    populateInspectorModelView(modelId, dayId);
                    showToast('Model exercises regenerated', 'success');
                }
            });
            
            modelStatusTab.querySelector('#modify-model-btn')?.addEventListener('click', () => {
                // Show model configuration interface
                activateTab('model-config-content');
            });
        }
        
        // Populate the config tab (editable parameters)
        if (modelConfigTab) {
            // Extract model parameters for editing
            const params = JSON.parse(dayCell.dataset.periodizationParams || '{}');
            
            let configHTML = `
                <h4>Model Configuration</h4>
                <p class="description-text">Adjust the model parameters below to customize the periodization. Changes will affect all days using this model.</p>
                
                <form id="model-config-form" class="model-config-form">
                    <div class="form-group">
                        <label for="model-base-metric">Base Load Metric</label>
                        <select id="model-base-metric" name="baseLoadMetric">
                            <option value="1rm" ${params.baseLoadMetric === '1rm' ? 'selected' : ''}>1RM (One Rep Max)</option>
                            <option value="rpe" ${params.baseLoadMetric === 'rpe' ? 'selected' : ''}>RPE (Rate of Perceived Exertion)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="model-increment-value">Increment Value</label>
                        <input type="number" id="model-increment-value" name="incrementValue" value="${params.incrementValue || 0}" min="0" max="10" step="0.5">
                </div>
                    
                    <div class="form-group">
                        <label for="model-increment-unit">Increment Unit</label>
                        <select id="model-increment-unit" name="incrementUnit">
                            <option value="%" ${params.incrementUnit === '%' ? 'selected' : ''}>Percent (%)</option>
                            <option value="kg" ${params.incrementUnit === 'kg' ? 'selected' : ''}>Kilograms (kg)</option>
                            <option value="lb" ${params.incrementUnit === 'lb' ? 'selected' : ''}>Pounds (lb)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="model-increment-frequency">Increment Frequency</label>
                        <select id="model-increment-frequency" name="incrementFrequency">
                            <option value="weekly" ${params.incrementFrequency === 'weekly' ? 'selected' : ''}>Weekly</option>
                            <option value="biweekly" ${params.incrementFrequency === 'biweekly' ? 'selected' : ''}>Bi-weekly</option>
                            <option value="monthly" ${params.incrementFrequency === 'monthly' ? 'selected' : ''}>Monthly</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <button type="submit" class="cta-button primary-cta">Save Changes</button>
                        <button type="button" id="cancel-model-config" class="cta-button secondary-cta">Cancel</button>
                    </div>
                </form>
            `;
            
            modelConfigTab.innerHTML = configHTML;
            
            // Add event listeners for the form
            modelConfigTab.querySelector('#model-config-form')?.addEventListener('submit', (e) => {
                e.preventDefault();
                
                // Collect form data
                const formData = new FormData(e.target);
                const updatedParams = { ...params };
                
                // Update params object with form values
                for (const [key, value] of formData.entries()) {
                    if (key === 'incrementValue') {
                        updatedParams[key] = parseFloat(value);
                    } else {
                        updatedParams[key] = value;
                    }
                }
                
                // Update the model
                PeriodizationModelManager.updateModelParams(modelId, updatedParams);
                
                // Return to status tab
                activateTab('model-status-content');
                showToast('Model configuration updated', 'success');
            });
            
            modelConfigTab.querySelector('#cancel-model-config')?.addEventListener('click', () => {
                activateTab('model-status-content');
            });
        }
        
        // Populate the simulation tab (future projections)
        if (modelSimTab) {
            let simHTML = `
                <h4>Model Simulation</h4>
                <p class="description-text">View projected loads and progress over time for this periodization model.</p>
                
                <div class="sim-chart-container">
                    <p><small>Simulation feature coming soon...</small></p>
                    <div class="placeholder-chart" style="height: 200px; background: rgba(255,255,255,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <span>Projection Chart Placeholder</span>
                    </div>
                </div>
            `;
            
            modelSimTab.innerHTML = simHTML;
        }
    }

    // --- Helper Function to Add Config Tab Listeners (Phase 7) ---
    function addConfigTabListeners(configTabContent, instanceId) {
        const form = configTabContent.querySelector('#model-params-form');
        const previewConfigBtn = configTabContent.querySelector('#preview-config-changes');
        const swapTypeSelect = configTabContent.querySelector('#swap-model-type');
        const previewSwapBtn = configTabContent.querySelector('#preview-model-swap');

        // Listener for parameter form inputs
        if (form && previewConfigBtn) {
            form.addEventListener('input', () => {
                // Basic check: enable button if any value differs from its original value
                let changed = false;
                form.querySelectorAll('input, select').forEach(input => {
                    if (input.value != input.dataset.originalValue) { // Use != for type coercion comparison initially
                        changed = true;
                    }
                });
                previewConfigBtn.disabled = !changed;
            });
        }

        // Listener for swap model type selection
        if (swapTypeSelect && previewSwapBtn) {
            swapTypeSelect.addEventListener('change', () => {
                previewSwapBtn.disabled = !swapTypeSelect.value; // Enable if a type is selected
            });
        }

        // Listener for Preview Config Changes button
        if (previewConfigBtn) {
            previewConfigBtn.addEventListener('click', () => {
                const formData = new FormData(form);
                const newParams = Object.fromEntries(formData.entries());
                const scope = configTabContent.querySelector('input[name="param-scope"]:checked')?.value || 'day';
                console.log("Preview Config Changes Clicked", { instanceId, newParams, scope });
                showToast("Configuration change simulation not yet implemented.", "info");
                // TODO: Implement Phase 7 - Simulation & Confirmation Logic
                // 1. Call engine.simulateParameterChange(instanceId, currentDayId, newParams, scope)
                // 2. Display simulation results (modal or toast)
                // 3. If confirmed:
                //    - Call PeriodizationModelManager.updateModelParams(instanceId, newParams, scope)
                //    - Trigger recalculation/DOM updates for affected days/cards
                //    - Re-populate inspector
                //    - triggerAnalyticsUpdate(), triggerSaveState()
            });
        }

        // Listener for Preview Model Swap button
        if (previewSwapBtn) {
            previewSwapBtn.addEventListener('click', () => {
                const newModelType = swapTypeSelect.value;
                const scope = configTabContent.querySelector('input[name="swap-scope"]:checked')?.value || 'day';
                const currentDayId = selectedContext.dayId; // Get dayId from current selection context
                
                console.log("Preview Model Swap Clicked", { instanceId, currentDayId, newModelType, scope });
                if (!currentDayId) {
                     console.error("Cannot perform swap: Current dayId context is missing.");
                     showToast("Error: Missing day context for swap.", "error");
             return;
        }

                // 1. Call simulation (placeholder)
                const engine = getPeriodizationEngine();
                let simulationResult = { summary: "Swap simulation not implemented.", changes: [] };
                if (engine && typeof engine.simulateModelSwap === 'function') {
                    try {
                         simulationResult = engine.simulateModelSwap(instanceId, currentDayId, newModelType, scope);
                    } catch (error) {
                         console.error("Error during model swap simulation:", error);
                         showToast("Error simulating model swap.", "error");
                         simulationResult.summary = "Error during simulation.";
                    }
        } else {
                    console.warn("simulateModelSwap function not found on engine.");
                }

                // 2. Display simulation results and confirm
                // Ensure variables are interpolated correctly within the template literal
                const confirmationMessage = `Simulated Impact: ${simulationResult.summary}\n\nProceed with swapping to ${newModelType} model for scope: ${scope}?`;
                
                if (confirm(confirmationMessage)) {
                     console.log("User confirmed model swap. Proceeding with execution...");
                    // TODO: Implement Execution Logic (Phase 11)
                    // a. Identify affected dayIds based on scope and currentDayId
                    // b. Get parameters for the new model (use defaults for now)
                    // c. Detach old model for scope (PeriodizationModelManager.detachModelFromDay for each affected dayId)
                    // d. Create new model instance (PeriodizationModelManager.createAndApplyModel)
                    // e. Generate new cards (populateModelDrivenCards or similar, clearing old cards first)
                    // f. Update Inspector view
                    // g. triggerAnalyticsUpdate(), triggerSaveState()
                    // Ensure template literal interpolation is correct
                    showToast(`Model swap execution logic not yet implemented for ${newModelType}.`, "info");

                } else {
                     console.log("User cancelled model swap.");
                     showToast("Model swap cancelled.", "info");
                 }
            });
        }
    }

    // --- Action Button Handler for Model Inspector ---
    function handleModelActionButtonClick(event) {
        const button = event.currentTarget;
        const action = button.dataset.action;
        const instanceId = button.dataset.instanceId;
        const dayId = button.dataset.dayId;

        console.log(`[Model Action] Clicked: ${action}, Instance: ${instanceId}, Day: ${dayId}`);

        if (!instanceId || !dayId) {
            console.error("Missing instanceId or dayId for model action button.");
            showToast("Error performing action: Missing context.", "error");
             return;
        }

        // Find the day cell element - ensure template literal is correct
        const dayCell = workCanvas.querySelector(`[data-day-id="${dayId}"]`);
        if (!dayCell) {
            console.error(`Could not find day cell for ${dayId}`); // Ensure template literal is correct
            showToast("Error performing action: Day cell not found.", "error");
            return;
        }

        switch (action) {
            case 'revert-to-model':
                if (confirm("Revert all independently edited exercises on this day back to the model's calculated state?")) {
                    console.log("TODO: Implement Revert to Model logic");
                    showToast("Revert functionality not yet implemented.", "info");
                    // 1. Find independent cards in dayCell
                    // 2. For each, call engine.calculateExercisesForDay(modelInstance, week, day)
                    // 3. Update card DOM (name, details, dataset)
                    // 4. Set card.dataset.modelDriven = 'true'
                    // 5. Call updateCardIcon(card)
                    // 6. Call updateDayBadge(dayCell)
                    // 7. Re-populate inspector: populateInspectorModelView(instanceId, dayId)
                    // 8. triggerSaveState(), triggerAnalyticsUpdate()
                }
                break;

            case 'make-all-independent':
                 if (confirm("Make all exercises on this day independent from the model? They will no longer automatically update.")) {
                    console.log("Making all cards independent for day", dayId);
                    let changed = false;
                    dayCell.querySelectorAll('.workout-card[data-model-driven="true"]').forEach(card => {
                        card.dataset.modelDriven = 'false';
                        updateCardIcon(card);
                        changed = true;
                    });
                    if (changed) {
                        updateDayBadge(dayCell); // Badge might disappear if no model-driven cards remain
                        populateInspectorModelView(instanceId, dayId); // Refresh the inspector view
                        triggerSaveState();
                        showToast("All cards on this day are now independent.", "success");
                } else {
                        showToast("No model-driven cards found to make independent.", "info");
                    }
                 }
                break;

            case 'detach-day':
                if (confirm("Completely detach this day from the periodization model? All exercises will become independent.")) {
                    // Call the manager function. The event listener will handle UI updates.
                    const detached = PeriodizationModelManager.detachModelFromDay(dayId);
                    if (detached) {
                         console.log(`[Model Action] Successfully initiated detachment for day ${dayId}`); // Ensure template literal is correct
                         showToast(`Day ${dayId} detached from model ${instanceId}.`, "success"); // Ensure template literal is correct
                         // UI updates are handled by the event listener
        } else {
                         console.error(`[Model Action] Failed to detach day ${dayId}.`); // Ensure template literal is correct
                         showToast(`Error detaching day ${dayId} from model.`, "error"); // Ensure template literal is correct
                    }
                 }
                break;

            default:
                console.warn(`Unknown model action: ${action}`); // Ensure template literal is correct
        }
    }

    // --- Card List Click Handler for Inspector ---
    function handleInspectorCardListClick(event) {
        const listItem = event.currentTarget;
        const cardId = listItem.dataset.cardId;
        if (!cardId) return;

        const cardElement = document.getElementById(cardId);
        if (cardElement) {
            console.log(`Highlighting card: ${cardId}`); // Ensure template literal is correct
            // Remove previous highlights
            document.querySelectorAll('.highlight-card').forEach(el => el.classList.remove('highlight-card'));
            // Add highlight
            cardElement.classList.add('highlight-card');
            // Scroll into view
            cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            // Remove highlight after a delay
            setTimeout(() => { 
                cardElement.classList.remove('highlight-card'); 
            }, 1500); // Highlight for 1.5 seconds
        } else {
            console.warn(`Card element with ID ${cardId} not found on canvas.`); // Ensure template literal is correct
        }
    }

    // Helper function to delete the currently selected workout card (if single selection)
    // Needs selectedContext, closeInspector, triggerSaveState, triggerAnalyticsUpdate
    function deleteSelectedWorkoutCard() {
         if (selectedContext.type === 'exercise' && selectedContext.elements.size === 1) {
            const cardElement = Array.from(selectedContext.elements)[0];
            console.log(`Deleting selected card: ${cardElement.id}`); // Ensure template literal is correct
            cardElement.remove();
            selectedContext = { type: 'none', elements: new Set(), modelId: null, dayId: null }; // Reset selection
            closeInspector();
            triggerSaveState();
            triggerAnalyticsUpdate(workCanvas); // Pass workCanvas if needed by the function
            showToast("Workout card deleted.", "success");
            } else {
            console.warn("Delete called but no single exercise card selected.");
            showToast("Select a single card to delete.", "warning");
        }
    }

    // Add a temporary CSS rule for highlighting
    const highlightStyle = document.createElement('style');
    highlightStyle.innerHTML = `
    /* Existing highlight */
    .highlight-card {
        outline: 3px solid var(--accent-color) !important;
        box-shadow: 0 0 15px var(--accent-color) !important;
        transition: outline 0.2s ease-out, box-shadow 0.2s ease-out;
    }
    /* Model Inspector Status Styles */
    .model-status-section { margin-bottom: 1.5rem; }
    .model-status-section .section-header { 
        display: flex; justify-content: space-between; align-items: center; 
        margin-bottom: 0.5rem; border-bottom: 1px solid rgba(204, 209, 217, 0.1); padding-bottom: 0.5rem;
    }
    .model-status-section .section-header h4 { margin: 0; color: var(--primary-accent); }
    .model-status-section .instance-id { font-size: 0.8rem; opacity: 0.7; cursor: help; }
    .model-status-section h5 { 
        margin-top: 0; margin-bottom: 0.8rem; color: var(--accent-color); font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .model-status-section h6 {
        margin-top: 0.5rem; margin-bottom: 0.3rem; font-size: 0.85rem; color: var(--cool-steel); display: flex; align-items: center; gap: 0.5em;
    }
    .status-details { display: flex; flex-direction: column; gap: 0.5rem; }
    .status-item { display: flex; justify-content: space-between; font-size: 0.9rem; }
    .status-item strong { color: var(--text-color); opacity: 0.8; }
    .status-item .status-value { font-weight: 500; }

    /* Wave Specific */
    .wave-pattern-info h5 { margin-bottom: 0.5rem; font-size: 0.9rem; }
    .wave-pattern-info .pattern-name { font-weight: normal; color: var(--primary-accent); background-color: rgba(255,255,255,0.05); padding: 2px 5px; border-radius: 3px; }
    .wave-pattern-display { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 10px; padding: 5px; background-color: rgba(0,0,0,0.1); border-radius: 4px; }
    .wave-step { 
        flex: 1; /* Try to make them equal width */
        min-width: 60px; /* Prevent shrinking too much */
        padding: 6px 8px; border: 1px solid rgba(204, 209, 217, 0.2); border-radius: 3px; font-size: 0.8em; 
        text-align: center; cursor: help; transition: all 0.2s ease; background-color: rgba(27, 28, 34, 0.7);
    }
    .wave-step .step-number { display: block; font-weight: bold; margin-bottom: 2px; font-size: 0.9em; }
    .wave-step .step-details { display: block; font-size: 0.85em; opacity: 0.8; }
    .wave-step.active { 
        background-color: var(--accent-color); color: var(--bg-color); border-color: var(--accent-color); font-weight: bold;
        transform: scale(1.05); box-shadow: 0 0 8px rgba(255, 112, 59, 0.3);
    }
    .wave-step.active .step-details { opacity: 1; }
    .wave-summary { display: flex; justify-content: space-around; font-size: 0.85rem; margin-top: 5px; padding-top: 5px; border-top: 1px dashed rgba(204, 209, 217, 0.1); }
    .wave-summary span { opacity: 0.9; }
    .wave-summary strong { color: var(--text-color); }

    /* Inspector Card List */
    .exercise-list-container { margin-bottom: 1rem; }
    ul.inspector-card-list {
        list-style: none; padding: 0; margin: 0; max-height: 150px; overflow-y: auto; 
        background-color: rgba(0,0,0,0.15); border-radius: 4px; padding: 5px;
    }
    ul.inspector-card-list li {
        padding: 0.4rem 0.6rem; margin-bottom: 3px; background-color: rgba(27, 28, 34, 0.7);
        border-radius: 3px; cursor: pointer; font-size: 0.85rem; transition: background-color 0.2s;
        display: flex; justify-content: space-between; align-items: center;
    }
    ul.inspector-card-list li:hover { background-color: rgba(255, 112, 59, 0.15); }
    .exercise-item-name { font-weight: 500; }
    .exercise-item-details { opacity: 0.7; font-size: 0.9em; }
    .status-icon { font-size: 0.9em; opacity: 0.7; cursor: help; }

    /* Action Buttons */
    .action-buttons-container { display: flex; flex-direction: column; gap: 0.5rem; }
    .model-action-btn {
        /*display: block; width: 100%; margin-bottom: 0.5rem; Now handled by flex gap */
        padding: 0.6rem 0.8rem; background-color: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(204, 209, 217, 0.2); color: var(--text-color);
        border-radius: 4px; cursor: pointer; font-size: 0.85rem; text-align: left; transition: all 0.2s ease;
    }
    .model-action-btn:hover { background-color: rgba(255, 255, 255, 0.15); border-color: rgba(204, 209, 217, 0.4); }
    .model-action-btn.detach-btn:hover { background-color: rgba(255, 80, 80, 0.2); border-color: rgba(255, 80, 80, 0.5); color: #ffcccc; }
    `; // <<< Added missing closing backtick
    document.head.appendChild(highlightStyle);

    /* Add styles for the new config elements */
    const configStyle = document.createElement('style');
    configStyle.innerHTML = `
    .config-section h5 {
        margin-top: 0;
        margin-bottom: 0.8rem;
        color: var(--accent-color);
        font-size: 0.9rem;
        text-transform: uppercase;
    }
    .form-group.small-margin {
        margin-bottom: 0.8rem;
    }
    .form-group label {
        display: block;
        margin-bottom: 0.3rem;
        font-weight: 500;
        color: var(--cool-steel);
        font-size: 0.85rem;
    }
    .form-group input[type="text"],
    .form-group input[type="number"],
    .form-group select {
        width: 100%;
        padding: 0.5rem 0.7rem;
        border-radius: 4px;
        border: 1px solid rgba(204, 209, 217, 0.2);
        background-color: rgba(27, 28, 34, 0.7);
        color: var(--text-color);
        font-size: 0.9rem;
    }
    .form-group select {
        appearance: none;
        background-image: url('data:image/svg+xml;utf8,<svg fill="%23CCD1D9" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>');
        background-repeat: no-repeat;
        background-position: right 8px center;
        background-size: 1em;
        padding-right: 2em;
    }
    .param-description {
        font-size: 0.75rem;
        color: var(--text-color);
        opacity: 0.7;
        display: block;
        margin-top: 3px;
    }
    .scope-selection label {
        display: inline-block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--cool-steel);
    }
    .scope-selection .radio-group {
        display: flex;
        gap: 1rem;
        align-items: center;
    }
    .scope-selection .radio-group input[type="radio"] {
        margin-right: 0.3rem;
    }
    .scope-selection .radio-group label {
        margin-bottom: 0; /* Reset margin for radio labels */
        font-weight: normal;
        color: var(--text-color);
        font-size: 0.9rem;
    }
    #preview-config-changes:disabled,
    #preview-model-swap:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background-color: rgba(255, 255, 255, 0.05);
    }
    `; // <<< Added missing closing backtick
    document.head.appendChild(configStyle);

    // --- Periodization Model Visuals (Day Cell Classes) --- // Renamed section

    /**
     * Updates the CSS classes on a day cell to reflect its model governance.
     * @param {HTMLElement} dayCellElement - The day cell DOM element.
     */
    function updateDayCellModelClasses(dayCellElement) {
        if (!dayCellElement) return;
        const dayId = dayCellElement.dataset.dayId;
        if (!dayId) return;

        const instanceId = window.periodizationManager?.getModelForDay(dayId) || null;

        // Always remove existing classes first
        dayCellElement.classList.remove('has-model');
        const existingModelTypeClasses = Array.from(dayCellElement.classList).filter(cls => cls.startsWith('model-type-'));
        dayCellElement.classList.remove(...existingModelTypeClasses);

        if (instanceId) {
            const model = window.periodizationManager?.getModelInstance(instanceId);
            if (model) {
                // Check if any card within the cell is actually model-driven
                // This prevents styling the cell if only independent cards remain after edits
                const modelDrivenCard = dayCellElement.querySelector('.workout-card[data-model-driven="true"]');
                if (modelDrivenCard) {
                    const modelType = model.type.toLowerCase();
                    dayCellElement.classList.add('has-model');
                    dayCellElement.classList.add(`model-type-${modelType}`); // Ensure template literal interpolation is correct
                }
            }
        }
    }

    // --- Helper Functions for Dependencies ---
    function getTotalWeeksHelper() {
        return workCanvas.querySelectorAll('.week-label').length;
    }
    
    function getBlockStateHelper() {
        // Placeholder: Needs implementation to gather state from DOM/manager
        // This is complex and depends on how state is managed elsewhere
        console.warn('[ForgeAssist Init] getBlockStateHelper not fully implemented.');
        return {
            slots: {}, // Populate from workCanvas
            phases: [], // Populate from phaseRibbon
            periodizationModels: window.periodizationManager?.getState() || {} // Get from manager
        };
    }

    // --- Initialize ForgeAssist --- 
    console.log('[BlockBuilder] Initializing ForgeAssist...');
    try {
        // Define analytics functions locally to avoid ReferenceError
        const acwr = () => {
            return typeof AnalyticsModule !== 'undefined' && AnalyticsModule.getACWR 
                ? AnalyticsModule.getACWR(AnalyticsModule.getDailyLoads(workCanvas)) 
                : null;
        };
        
        const monotony = () => {
            return typeof AnalyticsModule !== 'undefined' && AnalyticsModule.getMonotony 
                ? AnalyticsModule.getMonotony(AnalyticsModule.getDailyLoads(workCanvas)) 
                : null;
        };
        
        const getCurrentBlockLoads = (canvas) => {
            return typeof AnalyticsModule !== 'undefined' && AnalyticsModule.getDailyLoads 
                ? AnalyticsModule.getDailyLoads(canvas) 
                : [];
        };
        
        ForgeAssist.init({
            workCanvas: workCanvas,
            showToast: showToast,
            triggerAnalyticsUpdate: triggerAnalyticsUpdate,
            getTotalWeeks: getTotalWeeksHelper,
            getBlockState: getBlockStateHelper,
            exerciseLibrary: exerciseLibraryData || [], // Provide empty array fallback
            // Pass analytics functions
            acwrFunction: acwr,
            monotonyFunction: monotony,
            // Ensure getCurrentBlockLoads receives workCanvas when called by ForgeAssist/AdaptiveScheduler
            getCurrentBlockLoads: () => getCurrentBlockLoads(workCanvas),
            simulatedPastLoad: window.simulatedPastLoad || [] // Get from global or default
        });
        console.log('[BlockBuilder] ForgeAssist Initialized.');
    } catch (error) {
        console.error('[BlockBuilder] Error initializing ForgeAssist:', error);
        showToast('ForgeAssist failed to initialize!', 'error');
    }

    // --- Inspector Update Logic ---

    // <<< NEW: Listen for event to re-render assist actions >>>
    const inspectorElement = document.getElementById('inspector');
    
    // Listen for the select-model event from ForgeAssist
    document.addEventListener('forge-assist:select-model', (event) => {
        if (event.detail && event.detail.modelId && event.detail.dayId) {
            console.log(`[forge-assist:select-model] Selecting model ${event.detail.modelId} for day ${event.detail.dayId}`);
            handleModelContextSelection(event.detail.modelId, event.detail.dayId);
        } else {
            console.error('[forge-assist:select-model] Event missing modelId or dayId', event.detail);
        }
    });
    
    // --- Register event listeners for inspector tabs ---

    // <<< NEW: Function to handle workout card clicks (opens modal) >>>
    function handleCardClick(cardElement, isShiftKey) {
        console.log('[handleCardClick] Card clicked:', cardElement?.id, 'Shift:', isShiftKey);
        // Original selection handling logic
        handleSelection(cardElement, isShiftKey);
        const { selectedElement, selectedElements } = getSelectionState();
        console.log('[handleCardClick] After handleSelection, selectedElement:', selectedElement?.id, 'selectedElements:', Array.from(selectedElements).map(e => e.id));
        selectedContext.type = 'exercise';
        selectedContext.elements = new Set(selectedElements);
        updateMultiSelectToolbarVisibility();
        // Always update inspector for selection
        updateInspectorForSelection();
        // If it's a single card selection, open inspector
        if (selectedContext.elements.size === 1 && !isShiftKey) {
            openInspector(cardElement);
        } else if (selectedContext.elements.size > 1) {
            openMultiSelectInspector();
        } else {
            closeInspector();
        }
    }
    // <<< END MODIFIED Handler >>>

    // <<< Add Exercise Detail Modal Close Listener >>>
    function closeExerciseDetailModal() {
        if (exerciseDetailModal) {
            exerciseDetailModal.classList.remove('is-visible');
            
            // Stop any playing videos when closing the modal
            const videoIframe = exerciseDetailModal.querySelector('iframe');
            if (videoIframe && videoIframe.src) {
                // Pause YouTube videos by reloading the iframe
                const currentSrc = videoIframe.src;
                videoIframe.src = currentSrc;
            }
        }
    }
    
    // Make sure we have all necessary elements before attaching listeners
    if (exerciseDetailCloseBtn) {
        exerciseDetailCloseBtn.addEventListener('click', closeExerciseDetailModal);
    }
    
    // Also close modal on overlay click
    if (exerciseDetailModal) {
        exerciseDetailModal.addEventListener('click', (e) => {
            if (e.target === exerciseDetailModal) { // Clicked on the overlay itself
                closeExerciseDetailModal();
            }
        });
        
        // Add escape key listener for better UX
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && exerciseDetailModal.classList.contains('is-visible')) {
                closeExerciseDetailModal();
            }
        });
    }
    // <<< End Close Listener >>>

    // <<< NEW: Listener for library item clicks >>>
    const inspectorPanelElement = document.getElementById('inspector-panel');
    if (inspectorPanelElement) {
        inspectorPanelElement.addEventListener('forge-library:show-detail', (e) => {
            const exerciseId = e.detail.exerciseId;
            console.log(`[BlockBuilder] Caught forge-library:show-detail event for ID: ${exerciseId}`);
            if (exerciseId) {
                const libraryData = exerciseLibraryData.find(ex => ex.id === exerciseId);
                if (libraryData) {
                    // Call the modal population function, passing only library data
                    populateAndShowExerciseDetailModal(libraryData, null); 
                } else {
                    console.warn(`Exercise data not found in library for ID: ${exerciseId}`);
                    showToast('Could not find exercise details.', 'warning');
                }
            } else {
                console.error('forge-library:show-detail event missing exerciseId.');
            }
        });
    }
    // <<< END NEW LISTENER >>>

    // <<< NEW: Central function to populate and show the modal >>>
    function populateAndShowExerciseDetailModal(libraryData, cardData) {
        if (!libraryData) return;

        // Initialize DOM element references that were causing errors
        const exerciseDetailTitle = document.getElementById('exercise-detail-title');
        const detailLibraryCategory = document.getElementById('detail-library-category');
        const detailLibraryDescription = document.getElementById('detail-library-description');
        const detailLibraryMuscles = document.getElementById('detail-library-muscles');
        const detailLibraryEquipment = document.getElementById('detail-library-equipment');
        const detailLibraryDifficulty = document.getElementById('detail-library-difficulty');
        const detailCurrentSets = document.getElementById('detail-current-sets');
        const detailCurrentReps = document.getElementById('detail-current-reps');
        const detailCurrentLoadType = document.getElementById('detail-current-load-type');
        const detailCurrentLoadValue = document.getElementById('detail-current-load-value');
        const detailCurrentRest = document.getElementById('detail-current-rest');
        const detailCurrentNotes = document.getElementById('detail-current-notes');
        
        const exerciseDetailModal = document.getElementById('exercise-detail-modal');
        const detailModalEditBtn = document.getElementById('detail-modal-edit-btn');
        const detailModalSwapBtn = document.getElementById('detail-modal-swap-btn');

        const exerciseName = libraryData.name || 'Exercise';
        if (exerciseDetailTitle) exerciseDetailTitle.textContent = exerciseName;

        // Populate Library Info (Always available)
        if (detailLibraryCategory) detailLibraryCategory.textContent = libraryData.category || '-';
        if (detailLibraryDescription) detailLibraryDescription.textContent = libraryData.description || '-';
        if (detailLibraryMuscles) detailLibraryMuscles.textContent = (libraryData.primaryMuscles || []).join(', ') || '-';
        if (detailLibraryEquipment) detailLibraryEquipment.textContent = (libraryData.equipmentNeeded || []).join(', ') || '-';
        if (detailLibraryDifficulty) detailLibraryDifficulty.textContent = libraryData.difficulty || '-';
        
        // Enhanced YouTube Video Handling
        const videoContainer = document.getElementById('exercise-video-container');
        if (videoContainer) {
            videoContainer.innerHTML = ''; // Clear previous video
            
            if (libraryData.videoUrl && (libraryData.videoUrl.includes('youtube.com') || libraryData.videoUrl.includes('youtu.be'))) {
                let videoId = null;
                
                try {
                    // Extract YouTube video ID from different URL formats
                    const url = new URL(libraryData.videoUrl);
                    
                    if (url.hostname === 'youtu.be') {
                        videoId = url.pathname.substring(1); // Get path after hostname
                    } else if (url.hostname.includes('youtube.com')) {
                        if (url.searchParams.has('v')) {
                            videoId = url.searchParams.get('v');
                        } else if (url.pathname.includes('/embed/')) {
                            videoId = url.pathname.split('/embed/')[1];
                        } else if (url.pathname.includes('/v/')) {
                            videoId = url.pathname.split('/v/')[1];
                        }
                    }
                    
                    // Handle any additional parameters in the videoId
                    if (videoId && videoId.includes('&')) {
                        videoId = videoId.split('&')[0];
                    }
                    if (videoId && videoId.includes('?')) {
                        videoId = videoId.split('?')[0];
                    }
                    
                } catch (e) {
                    console.error("Error parsing video URL:", libraryData.videoUrl, e);
                }

                if (videoId) {
                    // Create enhanced iframe with additional parameters for better UX
                    const iframe = document.createElement('iframe');
                    iframe.width = '100%';
                    iframe.height = '100%';
                    
                    // Add params for better playback experience
                    const params = new URLSearchParams({
                        rel: '0',              // Don't show related videos from other channels
                        modestbranding: '1',   // Hide YouTube logo
                        enablejsapi: '1',      // Enable JavaScript API
                        origin: window.location.origin, // Security: specify origin
                        playsinline: '1',      // Play inline on mobile devices
                        autoplay: '0',         // Don't autoplay
                        fs: '1',               // Show fullscreen button
                        color: 'white',        // Use white progress bar
                        hl: 'en',              // English interface
                        iv_load_policy: '3'    // Hide annotations
                    });
                    
                    iframe.src = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
                    iframe.title = `${exerciseName} video demonstration`;
                    iframe.loading = "lazy"; // Lazy load iframe for performance
                    iframe.frameBorder = '0';
                    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen';
                    iframe.allowFullscreen = true;
                    
                    // Add a loading animation while the video loads
                    const loadingWrapper = document.createElement('div');
                    loadingWrapper.className = 'video-loading-wrapper';
                    
                    // Create the loading animation
                    const loadingAnimation = document.createElement('div');
                    loadingAnimation.className = 'video-loading-animation';
                    loadingAnimation.innerHTML = '<div></div><div></div><div></div>';
                    
                    loadingWrapper.appendChild(loadingAnimation);
                    loadingWrapper.appendChild(iframe);
                    videoContainer.appendChild(loadingWrapper);
                    
                    // Hide loading animation when iframe loads
                    iframe.onload = () => {
                        loadingAnimation.style.display = 'none';
                    };
                } else {
                    // Show placeholder with error message
                    videoContainer.innerHTML = `
                        <div class="video-placeholder">
                            <div class="video-icon-placeholder">
                                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1.5"/>
                                    <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                </svg>
                            </div>
                            <p>Could not extract video ID</p>
                        </div>
                    `;
                }
            } else {
                // No video available placeholder
                videoContainer.innerHTML = `
                    <div class="video-placeholder">
                        <div class="video-icon-placeholder">
                            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1.5"/>
                                <path d="M15.5 12L10 16V8L15.5 12Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <p>No video available</p>
                    </div>
                `;
            }
        }

        // Populate Current Specs & Footer Buttons based on context (card or library)
        const currentSpecsSection = exerciseDetailModal.querySelector('.current-specs');
        if (cardData) { // Clicked from a card on the canvas
            if (currentSpecsSection) currentSpecsSection.style.display = ''; // Show
            if (detailCurrentSets) detailCurrentSets.textContent = cardData.sets || '-';
            if (detailCurrentReps) detailCurrentReps.textContent = cardData.reps || '-';
            if (detailCurrentLoadType) detailCurrentLoadType.textContent = cardData.loadType || '-';
            if (detailCurrentLoadValue) detailCurrentLoadValue.textContent = cardData.loadValue || '-';
            if (detailCurrentRest) detailCurrentRest.textContent = cardData.rest || '-';
            if (detailCurrentNotes) detailCurrentNotes.textContent = cardData.notes || '-';

            // Configure buttons for card context
            if (detailModalEditBtn) detailModalEditBtn.style.display = ''; // Show
            if (detailModalSwapBtn) detailModalSwapBtn.textContent = 'Suggest Swap'; // Reset text
            detailModalEditBtn.onclick = () => {
                closeExerciseDetailModal();
                const cardElement = document.getElementById(cardData.id);
                if (cardElement) {
                    handleSelection(cardElement); // Set selection context
                    updateInspectorForSelection(); // Render correct details
                    openInspector(cardElement);
                    activateTab('details');
                }
            };
            detailModalSwapBtn.onclick = () => {
                closeExerciseDetailModal();
                // Get the specific card element for context
                const cardElement = document.getElementById(cardData.id);
                if(cardElement) ForgeAssist.updateContext(cardElement, new Set([cardElement])); // Ensure context is set
                const action = ForgeAssist.getContextualActions().find(a => a.id === 'suggest_swap' || a.id === 'find-alternative');
                if (action?.handler) action.handler();
                else showToast('Could not trigger swap suggestion.', 'warning');
            };

        } else { // Clicked from the library list
            if (currentSpecsSection) currentSpecsSection.style.display = 'none'; // Hide
            // Clear current specs just in case
            if (detailCurrentSets) detailCurrentSets.textContent = '-';
            if (detailCurrentReps) detailCurrentReps.textContent = '-';
            if (detailCurrentLoadType) detailCurrentLoadType.textContent = '-';
            if (detailCurrentLoadValue) detailCurrentLoadValue.textContent = '-';
            if (detailCurrentRest) detailCurrentRest.textContent = '-';
            if (detailCurrentNotes) detailCurrentNotes.textContent = '-';

            // Configure buttons for library context
            if (detailModalEditBtn) detailModalEditBtn.style.display = 'none'; // Hide
            if (detailModalSwapBtn) detailModalSwapBtn.textContent = 'Find Alternatives'; // Change text
            detailModalSwapBtn.onclick = () => {
                closeExerciseDetailModal();
                // Get swap suggestions for this exercise
                const suggestions = (typeof ForgeAssist.suggestSwapById === 'function')
                    ? ForgeAssist.suggestSwapById(libraryData.id)
                    : [];
                if (suggestions && suggestions.length > 0) {
                    let html = `<div class='swap-suggestion-list'><strong>Alternatives for ${libraryData.name}:</strong><ul style='margin:0;padding-left:1.2em;'>`;
                    suggestions.forEach(sugg => {
                        html += `<li style='margin-bottom:0.5em;'><span>${sugg.name}</span> <button class='cta-button micro-cta add-alt-btn' data-exercise-id='${sugg.id}' data-exercise-name='${sugg.name}'>Add</button></li>`;
                    });
                    html += '</ul></div>';
                    showToast(html, 'info', 15000);
                    // Add event listeners to the add buttons after toast renders
                    setTimeout(() => {
                        document.querySelectorAll('.add-alt-btn').forEach(btn => {
                            btn.addEventListener('click', (e) => {
                                const exId = btn.dataset.exerciseId;
                                const exName = btn.dataset.exerciseName;
                                // TODO: Implement logic to add the exercise to the current block/day
                                showToast(`Added ${exName} to your block (demo only).`, 'success');
                                // Optionally, close the toast
                                const toast = btn.closest('.toast');
                                if (toast) {
                                    toast.classList.remove('show');
                                    toast.classList.add('hide');
                                    setTimeout(() => toast.remove(), 300);
                                }
                            });
                        });
                    }, 200);
                } else {
                    showToast('No suitable alternatives found.', 'info');
                }
            };
        }

        // Show Modal
        if (exerciseDetailModal) exerciseDetailModal.classList.add('is-visible');
    }
    // <<< END Central function >>>

    /**
     * Creates a superset container and adds the selected exercise cards to it
     * @param {Array} exerciseCards - Array of workout card DOM elements to group into a superset
     * @returns {HTMLElement} The superset container element 
     */
    function createSuperset(exerciseCards) {
        if (!exerciseCards || exerciseCards.length < 2) {
            console.error('At least 2 exercise cards are required to create a superset');
            showToast('Select at least 2 exercises to create a superset', 'error');
            return null;
        }

        // Create the superset container
        const supersetContainer = document.createElement('div');
        supersetContainer.className = 'superset-container';
        supersetContainer.id = `superset-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        
        // Create the header with label and controls
        const supersetHeader = document.createElement('div');
        supersetHeader.className = 'superset-header';
        supersetHeader.innerHTML = `
            <div class="superset-label">Superset</div>
            <div class="superset-controls">
                <button class="superset-edit-btn" title="Edit Superset">✏️</button>
                <button class="superset-remove-btn" title="Break Superset">❌</button>
            </div>
        `;
        
        supersetContainer.appendChild(supersetHeader);
        
        // Get the parent element (day cell) of the first card
        const parentCell = exerciseCards[0].closest('.day-cell');
        if (!parentCell) {
            console.error('Parent day cell not found for exercise cards');
            return null;
        }
        
        // Remove cards from their current location and add to the superset container
        exerciseCards.forEach(card => {
            // If card is already in a superset, remove it from that superset first
            const existingSuperset = card.closest('.superset-container');
            if (existingSuperset) {
                // If this is the only card in the superset, remove the entire superset
                const cardsInExistingSuperset = existingSuperset.querySelectorAll('.workout-card');
                if (cardsInExistingSuperset.length <= 2) {
                    // Move the other card out of the superset before removing it
                    Array.from(cardsInExistingSuperset).forEach(c => {
                        if (c !== card) {
                            existingSuperset.parentNode.insertBefore(c, existingSuperset);
                        }
                    });
                    existingSuperset.remove();
                } else {
                    // Just remove this card from the existing superset
                    existingSuperset.removeChild(card);
                }
            } else if (card.parentNode) {
                card.parentNode.removeChild(card);
            }
            
            // Add card to new superset container
            supersetContainer.appendChild(card);
            
            // Update the card styling for superset
            card.classList.add('in-superset');
        });
        
        // Add event listeners to the superset controls
        supersetContainer.querySelector('.superset-edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            // Open inspector for superset editing
            // This will need to be implemented as part of the inspector functionality
            showToast('Superset editing coming soon!', 'info');
        });
        
        supersetContainer.querySelector('.superset-remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            breakSuperset(supersetContainer);
        });
        
        // Insert the superset container into the day cell
        parentCell.appendChild(supersetContainer);
        
        // Trigger updates
        triggerSaveState();
        triggerAnalyticsUpdate(workCanvas);
        
        showToast('Superset created', 'success');
        return supersetContainer;
    }

    /**
     * Breaks a superset, removing the container and returning individual exercise cards to the day cell
     * @param {HTMLElement} supersetContainer - The superset container element to break
     */
    function breakSuperset(supersetContainer) {
        if (!supersetContainer || !supersetContainer.classList.contains('superset-container')) {
            console.error('Invalid superset container provided');
            return;
        }
        
        const parentCell = supersetContainer.closest('.day-cell');
        if (!parentCell) {
            console.error('Parent day cell not found for superset');
            return;
        }
        
        // Get all workout cards in the superset
        const exerciseCards = Array.from(supersetContainer.querySelectorAll('.workout-card'));
        
        // Move cards back to day cell and remove superset container
        exerciseCards.forEach(card => {
            card.classList.remove('in-superset');
            parentCell.appendChild(card);
        });
        
        supersetContainer.remove();
        
        // Trigger updates
        triggerSaveState();
        triggerAnalyticsUpdate(workCanvas);
        
        showToast('Superset removed', 'success');
    }
    
    /**
     * Generic function to break any exercise group (superset, circuit, complex)
     * @param {HTMLElement} groupContainer - The group container to break
     */
    function breakExerciseGroup(groupContainer) {
        // Check if this is a superset, circuit, or complex container
        if (groupContainer.classList.contains('superset-container')) {
            breakSuperset(groupContainer);
        } else if (groupContainer.classList.contains('circuit-container')) {
            // Handle circuit breaking
            const parentCell = groupContainer.closest('.day-cell');
            if (!parentCell) {
                console.error('Parent day cell not found for circuit');
                return;
            }
            
            // Get all workout cards in the circuit
            const exerciseCards = Array.from(groupContainer.querySelectorAll('.workout-card'));
            
            // Move cards back to day cell and remove circuit container
            exerciseCards.forEach(card => {
                card.classList.remove('in-superset');
                parentCell.appendChild(card);
            });
            
            groupContainer.remove();
            
            // Trigger updates
            triggerSaveState();
            triggerAnalyticsUpdate(workCanvas);
            
            showToast('Circuit removed', 'success');
        } else if (groupContainer.classList.contains('complex-container')) {
            // Handle complex breaking
            const parentCell = groupContainer.closest('.day-cell');
            if (!parentCell) {
                console.error('Parent day cell not found for complex');
                return;
            }
            
            // Get all workout cards in the complex
            const exerciseCards = Array.from(groupContainer.querySelectorAll('.workout-card'));
            
            // Move cards back to day cell and remove complex container
            exerciseCards.forEach(card => {
                card.classList.remove('in-superset');
                parentCell.appendChild(card);
            });
            
            groupContainer.remove();
            
            // Trigger updates
            triggerSaveState();
            triggerAnalyticsUpdate(workCanvas);
            
            showToast('Complex removed', 'success');
        }
    }
    
    /**
     * Creates a circuit container and adds the selected exercise cards to it
     * @param {Array} exerciseCards - Array of workout card DOM elements to group into a circuit
     * @returns {HTMLElement} The circuit container element
     */
    function createCircuit(exerciseCards) {
        if (!exerciseCards || exerciseCards.length < 3) {
            console.error('At least 3 exercise cards are required to create a circuit');
            showToast('Select at least 3 exercises to create a circuit', 'error');
            return null;
        }

        // Create the circuit container
        const circuitContainer = document.createElement('div');
        circuitContainer.className = 'superset-container circuit-container';
        circuitContainer.id = `circuit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        
        // Create the header with label and controls
        const circuitHeader = document.createElement('div');
        circuitHeader.className = 'superset-header';
        
        circuitHeader.innerHTML = `
            <div class="group-label circuit-label">Circuit<span class="group-details-badge">${exerciseCards.length} exercises, 15s rest</span></div>
            <div class="superset-controls">
                <button class="superset-edit-btn" title="Edit Circuit">✏️</button>
                <button class="superset-remove-btn" title="Break Circuit">❌</button>
            </div>
        `;
        
        circuitContainer.appendChild(circuitHeader);
        
        // Get the parent element (day cell) of the first card
        const parentCell = exerciseCards[0].closest('.day-cell');
        if (!parentCell) {
            console.error('Parent day cell not found for circuit');
            return null;
        }
        
        // Process the exercise cards
        exerciseCards.forEach(card => {
            // Remove from current parent
            if (card.parentNode) {
                card.parentNode.removeChild(card);
            }
            
            // Add to circuit container
            card.classList.add('in-superset');
            circuitContainer.appendChild(card);
        });
        
        circuitContainer.querySelector('.superset-remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            breakExerciseGroup(circuitContainer);
        });
        
        // Insert the circuit container into the day cell
        parentCell.appendChild(circuitContainer);
        
        // Trigger updates
        triggerSaveState();
        triggerAnalyticsUpdate(workCanvas);
        
        showToast('Circuit created', 'success');
        return circuitContainer;
    }

    /**
     * Creates a complex container and adds the selected exercise cards to it
     * @param {Array} exerciseCards - Array of workout card DOM elements to group into a complex
     * @returns {HTMLElement} The complex container element
     */
    function createComplex(exerciseCards) {
        if (!exerciseCards || exerciseCards.length < 2) {
            console.error('At least 2 exercise cards are required to create a complex');
            showToast('Select at least 2 exercises to create a complex', 'error');
            return null;
        }

        // Create the complex container
        const complexContainer = document.createElement('div');
        complexContainer.className = 'superset-container complex-container';
        complexContainer.id = `complex-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        
        // Create the header with label and controls
        const complexHeader = document.createElement('div');
        complexHeader.className = 'superset-header';
        
        complexHeader.innerHTML = `
            <div class="group-label complex-label">Complex<span class="group-details-badge">${exerciseCards.length} exercises, 0s transition</span></div>
            <div class="superset-controls">
                <button class="superset-edit-btn" title="Edit Complex">✏️</button>
                <button class="superset-remove-btn" title="Break Complex">❌</button>
            </div>
        `;
        
        complexContainer.appendChild(complexHeader);
        
        // Get the parent element (day cell) of the first card
        const parentCell = exerciseCards[0].closest('.day-cell');
        if (!parentCell) {
            console.error('Parent day cell not found for complex');
            return null;
        }
        
        // Process the exercise cards
        exerciseCards.forEach(card => {
            // Remove from current parent
            if (card.parentNode) {
                card.parentNode.removeChild(card);
            }
            
            // Add to complex container
            card.classList.add('in-superset');
            complexContainer.appendChild(card);
        });
        
        complexContainer.querySelector('.superset-remove-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            breakExerciseGroup(complexContainer);
        });
        
        // Insert the complex container into the day cell
        parentCell.appendChild(complexContainer);
        
        // Trigger updates
        triggerSaveState();
        triggerAnalyticsUpdate(workCanvas);
        
        showToast('Complex created', 'success');
        return complexContainer;
    }

    // Add context menu and multi-select toolbar elements
    let contextMenu = null;
    let multiSelectToolbar = null;
    
    // Initialize the context menu for workout cards
    function initializeContextMenu() {
        // Create context menu element if it doesn't exist
        if (!contextMenu) {
            contextMenu = document.createElement('div');
            contextMenu.className = 'context-menu';
            contextMenu.style.display = 'none';
            document.body.appendChild(contextMenu);
            
            // Close menu on document click
            document.addEventListener('click', (e) => {
                if (!contextMenu.contains(e.target)) {
                    contextMenu.style.display = 'none';
                }
            });
        }
    }
    
    // Show context menu for workout card
    function showContextMenu(x, y, items) {
        if (!contextMenu) {
            initializeContextMenu();
        }
        
        // Clear previous items
        contextMenu.innerHTML = '';
        
        // Add menu items
        items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            menuItem.innerHTML = `<span class="icon">${item.icon}</span> ${item.label}`;
            menuItem.addEventListener('click', () => {
                contextMenu.style.display = 'none';
                item.action();
            });
            contextMenu.appendChild(menuItem);
        });
        
        // Position menu
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.style.display = 'block';
        
        // Ensure menu is within viewport
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = `${window.innerWidth - rect.width - 5}px`;
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = `${y - rect.height}px`;
        }
    }
    
    // Initialize multi-select toolbar
    function initializeMultiSelectToolbar() {
        if (!multiSelectToolbar) {
            multiSelectToolbar = document.createElement('div');
            multiSelectToolbar.className = 'multi-select-toolbar';
            multiSelectToolbar.innerHTML = `
                <button class="multi-select-action" id="create-superset-btn">
                    <span class="icon">⚡</span> Create Superset
                </button>
                <button class="multi-select-action" id="create-circuit-btn">
                    <span class="icon">🔄</span> Create Circuit
                </button>
                <button class="multi-select-action" id="create-complex-btn">
                    <span class="icon">🔗</span> Create Complex
                </button>
                <button class="multi-select-action" id="delete-selected-btn">
                    <span class="icon">🗑️</span> Delete Selected
                </button>
            `;
            document.body.appendChild(multiSelectToolbar);
            
            // Add event listeners
            document.getElementById('create-superset-btn').addEventListener('click', () => {
                const selectedCards = Array.from(selectedContext.elements);
                if (selectedCards.length >= 2) {
                    createSuperset(selectedCards);
                    // Clear selection after creating superset
                    clearSelectionStyles();
                    selectedContext = { type: 'none', elements: new Set(), modelId: null, dayId: null };
                    updateMultiSelectToolbarVisibility();
                }
            });
            
            document.getElementById('create-circuit-btn').addEventListener('click', () => {
                const selectedCards = Array.from(selectedContext.elements);
                if (selectedCards.length >= 3) {
                    createCircuit(selectedCards);
                    // Clear selection after creating circuit
                    clearSelectionStyles();
                    selectedContext = { type: 'none', elements: new Set(), modelId: null, dayId: null };
                    updateMultiSelectToolbarVisibility();
                } else {
                    showToast('Select at least 3 exercises to create a circuit', 'warning');
                }
            });
            
            document.getElementById('create-complex-btn').addEventListener('click', () => {
                const selectedCards = Array.from(selectedContext.elements);
                if (selectedCards.length >= 2) {
                    createComplex(selectedCards);
                    // Clear selection after creating complex
                    clearSelectionStyles();
                    selectedContext = { type: 'none', elements: new Set(), modelId: null, dayId: null };
                    updateMultiSelectToolbarVisibility();
                }
            });
            
            document.getElementById('delete-selected-btn').addEventListener('click', () => {
                const selectedCards = Array.from(selectedContext.elements);
                selectedCards.forEach(card => {
                    card.remove();
                });
                // Clear selection after deleting
                clearSelectionStyles();
                selectedContext = { type: 'none', elements: new Set(), modelId: null, dayId: null };
                updateMultiSelectToolbarVisibility();
                triggerSaveState();
                triggerAnalyticsUpdate(workCanvas);
                showToast(`Deleted ${selectedCards.length} exercises`, 'success');
            });
            
            // Listen for marquee selection complete event
            document.addEventListener('marquee-selection-complete', (e) => {
                if (e.detail && e.detail.selectedElements && e.detail.selectedElements.size > 0) {
                    selectedContext.type = 'exercise';
                    selectedContext.elements = new Set(e.detail.selectedElements);
                    updateMultiSelectToolbarVisibility();
                    if (selectedContext.elements.size > 1) {
                        openMultiSelectInspector();
                    }
                }
            });
        }
    }
    
    // Update toolbar visibility based on selection
    function updateMultiSelectToolbarVisibility() {
        if (!multiSelectToolbar) {
            initializeMultiSelectToolbar();
        }
        
        if (selectedContext.type === 'exercise' && selectedContext.elements.size >= 2) {
            multiSelectToolbar.classList.add('active');
        } else {
            multiSelectToolbar.classList.remove('active');
        }
    }
    
    // Enhance the handleCardClick function to support multi-select and context menu
    function handleCardClick(cardElement, isShiftKey) {
        // Original selection handling logic
        handleSelection(cardElement, isShiftKey);
        
        // Update the selected context
        const { selectedElement, selectedElements } = getSelectionState();
        selectedContext.type = 'exercise';
        selectedContext.elements = new Set(selectedElements);
        
        // Update multi-select toolbar visibility
        updateMultiSelectToolbarVisibility();
        
        // If it's a single card selection, open inspector
        if (selectedContext.elements.size === 1 && !isShiftKey) {
            openInspector(cardElement);
        } else if (selectedContext.elements.size > 1) {
            openMultiSelectInspector();
        }
    }
    
    // Add context menu to workout cards via right-click
    function attachContextMenuToCards() {
        // Use event delegation on workCanvas
        workCanvas.addEventListener('contextmenu', (e) => {
            // Check if right-click happened on a workout card
            const card = e.target.closest('.workout-card');
            if (card) {
                e.preventDefault(); // Prevent default context menu
                
                // Add this card to selection if not already selected
                if (!selectedContext.elements.has(card)) {
                    handleCardClick(card, false);
                }
                
                const menuItems = [
                    {
                        icon: '⚡',
                        label: 'Create Superset',
                        action: () => {
                            if (selectedContext.elements.size >= 2) {
                                createSuperset(Array.from(selectedContext.elements));
                                clearSelectionStyles();
                                selectedContext = { type: 'none', elements: new Set(), modelId: null, dayId: null };
                                updateMultiSelectToolbarVisibility();
                            } else {
                                showToast('Select at least 2 exercises to create a superset', 'warning');
                            }
                        }
                    },
                    {
                        icon: '📋',
                        label: 'Duplicate',
                        action: () => {
                            const clone = card.cloneNode(true);
                            clone.id = `workout-${Date.now()}-${Math.random().toString(16).slice(2)}`;
                            // Add event listeners to the cloned card
                            clone.querySelector('.delete-btn').addEventListener('click', (e) => {
                                e.stopPropagation();
                                clone.remove();
                                triggerSaveState();
                                triggerAnalyticsUpdate(workCanvas);
                            });
                            
                            clone.querySelector('.edit-btn').addEventListener('click', (e) => {
                                e.stopPropagation();
                                handleSelection(clone, false);
                                openInspector(clone);
                            });
                            
                            clone.addEventListener('click', (e) => {
                                if (e.target.closest('.edit-btn') || e.target.closest('.delete-btn')) return;
                                handleCardClick(clone, e.shiftKey);
                            });
                            
                            // Insert after original card
                            card.parentNode.insertBefore(clone, card.nextSibling);
                            triggerSaveState();
                            triggerAnalyticsUpdate(workCanvas);
                            showToast('Exercise duplicated', 'success');
                        }
                    },
                    {
                        icon: '🔄',
                        label: 'Find Progression',
                        action: () => {
                            showProgressionModal(card);
                        }
                    },
                    {
                        icon: '🗑️',
                        label: 'Delete',
                        action: () => {
                            card.remove();
                            triggerSaveState();
                            triggerAnalyticsUpdate(workCanvas);
                            showToast('Exercise deleted', 'success');
                        }
                    }
                ];
                
                showContextMenu(e.pageX, e.pageY, menuItems);
            }
        });
    }
    
    // Call initialization functions
    initializeContextMenu();
    initializeMultiSelectToolbar();
    
    // Attach context menu to workout cards when calendar is loaded
    attachContextMenuToCards();

    // Show progression options for an exercise card
    function showProgressionModal(exerciseCard) {
        // Create modal if it doesn't exist
        let progressionModal = document.getElementById('progression-modal');
        if (!progressionModal) {
            progressionModal = document.createElement('div');
            progressionModal.id = 'progression-modal';
            progressionModal.className = 'modal-overlay';
            
            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content progression-modal-content';
            
            // Add close button
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close-btn';
            closeBtn.innerHTML = '&times;';
            closeBtn.addEventListener('click', () => {
                progressionModal.classList.remove('is-visible');
            });
            
            modalContent.appendChild(closeBtn);
            progressionModal.appendChild(modalContent);
            document.body.appendChild(progressionModal);
        }
        
        // Get the modal content element
        const modalContent = progressionModal.querySelector('.progression-modal-content');
        
        // Get exercise details
        const exerciseName = exerciseCard.querySelector('.exercise-name').textContent;
        const exerciseId = exerciseCard.dataset.exerciseId || '';
        
        // Populate modal content
        modalContent.innerHTML = `
            <button class="modal-close-btn">&times;</button>
            <h4>Exercise Progressions</h4>
            <div class="exercise-header">${exerciseName}</div>
            
            <div class="progression-path">
                <div class="progression-title">Choose a Progression Path</div>
                <div id="progression-options" class="progression-options">
                    <div class="progression-loading">Loading progression options...</div>
                </div>
            </div>
        `;
        
        // Add event listener to close button
        modalContent.querySelector('.modal-close-btn').addEventListener('click', () => {
            progressionModal.classList.remove('is-visible');
        });
        
        // Show the modal
        progressionModal.classList.add('is-visible');
        
        // Mock load progression options (would be replaced with actual data)
        setTimeout(() => {
            const progressionOptions = modalContent.querySelector('#progression-options');
            
            // Example progression path based on basic bodyweight progressions
            const mockProgressions = [
                {
                    id: 'easier_variation',
                    name: 'Easier Variation',
                    difficulty: 'Beginner',
                    description: 'A simpler version of this exercise with reduced range of motion or leverage.'
                },
                {
                    id: 'harder_variation',
                    name: 'Harder Variation',
                    difficulty: 'Advanced',
                    description: 'A more challenging version with increased range of motion or leverage.'
                },
                {
                    id: 'weighted_variation',
                    name: 'Add Weight',
                    difficulty: 'Intermediate',
                    description: 'Same exercise pattern with added external resistance.'
                }
            ];
            
            // Generate HTML for progression options
            progressionOptions.innerHTML = mockProgressions.map(progression => `
                <div class="progression-option" data-id="${progression.id}">
                    <div class="progression-option-header">
                        <div class="progression-name">${progression.name}</div>
                        <div class="progression-difficulty">${progression.difficulty}</div>
                    </div>
                    <div class="progression-description">${progression.description}</div>
                    <button class="swap-button" data-id="${progression.id}">Swap Exercise</button>
                </div>
            `).join('');
            
            // Add event listeners to swap buttons
            progressionOptions.querySelectorAll('.swap-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    const progressionId = e.target.dataset.id;
                    const progressionName = mockProgressions.find(p => p.id === progressionId).name;
                    
                    // Update the exercise card with the new progression
                    exerciseCard.querySelector('.exercise-name').textContent = `${exerciseName} (${progressionName})`;
                    
                    // Close the modal
                    progressionModal.classList.remove('is-visible');
                    
                    // Show success toast
                    showToast(`Exercise progressed to: ${progressionName}`, 'success');
                    
                    // Trigger save state and analytics update
                    triggerSaveState();
                    triggerAnalyticsUpdate(workCanvas);
                });
            });
        }, 500); // Simulate loading delay
    }

    // Update context menu to use the new progression modal
    function showContextMenu(x, y, items) {
        if (!contextMenu) {
            initializeContextMenu();
        }
        
        // Clear previous items
        contextMenu.innerHTML = '';
        
        // Add menu items
        items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            menuItem.innerHTML = `<span class="icon">${item.icon}</span> ${item.label}`;
            menuItem.addEventListener('click', () => {
                contextMenu.style.display = 'none';
                item.action();
            });
            contextMenu.appendChild(menuItem);
        });
        
        // Position menu
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.style.display = 'block';
        
        // Ensure menu is within viewport
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = `${window.innerWidth - rect.width - 5}px`;
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = `${y - rect.height}px`;
        }
    }

    // Update context menu handler for cards to include progression
    function attachContextMenuToCards() {
        // Use event delegation on workCanvas
        workCanvas.addEventListener('contextmenu', (e) => {
            // Check if right-click happened on a workout card
            const card = e.target.closest('.workout-card');
            if (card) {
                e.preventDefault(); // Prevent default context menu
                
                // Add this card to selection if not already selected
                if (!selectedContext.elements.has(card)) {
                    handleCardClick(card, false);
                }
                
                const menuItems = [
                    {
                        icon: '⚡',
                        label: 'Create Superset',
                        action: () => {
                            if (selectedContext.elements.size >= 2) {
                                createSuperset(Array.from(selectedContext.elements));
                                clearSelectionStyles();
                                selectedContext = { type: 'none', elements: new Set(), modelId: null, dayId: null };
                                updateMultiSelectToolbarVisibility();
                            } else {
                                showToast('Select at least 2 exercises to create a superset', 'warning');
                            }
                        }
                    },
                    {
                        icon: '📋',
                        label: 'Duplicate',
                        action: () => {
                            const clone = card.cloneNode(true);
                            clone.id = `workout-${Date.now()}-${Math.random().toString(16).slice(2)}`;
                            // Add event listeners to the cloned card
                            clone.querySelector('.delete-btn').addEventListener('click', (e) => {
                                e.stopPropagation();
                                clone.remove();
                                triggerSaveState();
                                triggerAnalyticsUpdate(workCanvas);
                            });
                            
                            clone.querySelector('.edit-btn').addEventListener('click', (e) => {
                                e.stopPropagation();
                                handleSelection(clone, false);
                                openInspector(clone);
                            });
                            
                            clone.addEventListener('click', (e) => {
                                if (e.target.closest('.edit-btn') || e.target.closest('.delete-btn')) return;
                                handleCardClick(clone, e.shiftKey);
                            });
                            
                            // Insert after original card
                            card.parentNode.insertBefore(clone, card.nextSibling);
                            triggerSaveState();
                            triggerAnalyticsUpdate(workCanvas);
                            showToast('Exercise duplicated', 'success');
                        }
                    },
                    {
                        icon: '🔄',
                        label: 'Find Progression',
                        action: () => {
                            showProgressionModal(card);
                        }
                    },
                    {
                        icon: '🗑️',
                        label: 'Delete',
                        action: () => {
                            card.remove();
                            triggerSaveState();
                            triggerAnalyticsUpdate(workCanvas);
                            showToast('Exercise deleted', 'success');
                        }
                    }
                ];
                
                showContextMenu(e.pageX, e.pageY, menuItems);
            }
        });
    }

    // --- Event Listeners --- //
    if (createNewBtn) { // <-- Corrected variable name
        createNewBtn.addEventListener('click', () => { // <-- Corrected variable name
            console.log("Create New button clicked");
            const modal = document.getElementById('new-block-options-modal');
            if (modal) {
                modal.classList.add('is-visible');
            }
            // Previously, this might have directly shown the builder view
            // showView('builder'); 
            // generateCalendarGrid(8); // Default 8 weeks
        });
    }

    if (browseTemplatesBtn) { // <-- Corrected variable name
        browseTemplatesBtn.addEventListener('click', () => { // <-- Corrected variable name
            console.log("Browse Templates button clicked (hub)");
            // Use the templates module's showModal function if it exists
            if (typeof window.templates !== 'undefined' && typeof window.templates.showModal === 'function') {
                window.templates.showModal();
            } else {
                // Fallback - find the modal directly
                const templatesModal = document.getElementById('templates-modal');
                if (templatesModal) {
                    templatesModal.classList.add('is-visible');
                } else {
                    console.error("Templates modal not found!");
                }
            }
        });
    }

    // Listener for the button *within* the new block modal
    if (createBlockFromOptionsBtn) {
        createBlockFromOptionsBtn.addEventListener('click', () => {
             console.log("Create button inside modal clicked.");
             handleCreateBlockFromOptions(); // Call the function to create the block & switch view
        });
        } else {
         console.error("Create Block From Options button not found!");
    }

    // Function to load a template into the block builder
    function loadTemplateBlock(template) {
        console.log(`Loading template: ${template.title}`);
        try {
            // 1. Generate Grid based on template weeks
            generateCalendarGrid(template.weeks || 8);
            
            // 2. Stay in builder view
            showView('builder');
            
            // 3. Set block name based on template
            const blockNameInput = document.getElementById('block-name-input');
            if (blockNameInput) {
                blockNameInput.value = template.title || 'Untitled Block';
            }
            
            // 4. Process schedule and add exercises
            if (template.schedule && template.schedule.length > 0) {
                console.log(`Loading schedule data for ${template.schedule.length} weeks`);
                
                // Get a reference to the work canvas
                const workCanvas = document.getElementById('work-canvas');
                if (!workCanvas) {
                    console.error("Work canvas not found when trying to populate template");
                    return false;
                }
                
                // Process each week in the schedule
                template.schedule.forEach(weekData => {
                    const weekNum = weekData.week;
                    console.log(`Processing template week ${weekNum}`);
                    
                    // Process each day in the week
                    weekData.days.forEach(dayData => {
                        const dayName = dayData.day;
                        console.log(`Processing day: ${dayName} in week ${weekNum}`);
                        
                        // Convert day name to abbreviated format (mon, tue, etc.)
                        const dayAbbr = dayName.substring(0, 3).toLowerCase();
                        
                        // Generate day ID using the correct format
                        const dayId = `wk${weekNum}-${dayAbbr}`;
                        console.log(`Looking for day cell with ID: ${dayId}`);
                        
                        // Find the day cell for this specific day
                        const dayCell = workCanvas.querySelector(`[data-day-id="${dayId}"]`);
                        
                        if (!dayCell) {
                            console.warn(`Could not find day cell for ${dayId}`);
                            return; // Skip this day
                        }
                        
                        // Add the workout title as a header to the day
                        if (dayData.title && dayData.title !== 'Rest') {
                            const headerCard = document.createElement('div');
                            headerCard.className = 'day-header';
                            headerCard.textContent = dayData.title;
                            dayCell.appendChild(headerCard);
                        }
                        
                        // Create exercise cards for this day
                        if (dayData.exercises && dayData.exercises.length > 0) {
                            dayData.exercises.forEach(exerciseText => {
                                if (exerciseText) {
                                    try {
                                        // Parse the exercise text (e.g., "Bench Press 4x8 @70%" or "Squat 3x10 @RPE8")
                                        // Split by spaces but be careful with the @RPE or @% notation
                                        const parts = exerciseText.split(' ');
                                        
                                        // Extract sets and reps from the notation like "4x8"
                                        let sets = '';
                                        let reps = '';
                                        let loadType = 'weight'; // Default load type
                                        let loadValue = '';
                                        let exerciseName = '';
                                        
                                        const setsRepsIndex = parts.findIndex(part => part.includes('x') && /\d+x\d+/.test(part));
                                        
                                        if (setsRepsIndex > -1) {
                                            const setsReps = parts[setsRepsIndex].split('x');
                                            if (setsReps.length === 2) {
                                                sets = setsReps[0];
                                                reps = setsReps[1];
                                            }
                                        }
                                        
                                        // Look for intensity notation like "@70%" or "@RPE8"
                                        const intensityIndex = parts.findIndex(part => part.startsWith('@'));
                                        if (intensityIndex > -1) {
                                            const intensityPart = parts[intensityIndex].substring(1); // Remove the @ symbol
                                            
                                            if (intensityPart.includes('RPE')) {
                                                loadType = 'rpe';
                                                loadValue = intensityPart.replace('RPE', '');
                                            } else if (intensityPart.includes('%')) {
                                                loadType = 'percent';
                                                loadValue = intensityPart.replace('%', '');
                                            } else {
                                                // If format is just @75 without % or RPE, assume it's percent
                                                loadType = 'percent';
                                                loadValue = intensityPart;
                                            }
                                        }
                                        
                                        // Build the exercise name from the remaining parts
                                        // Exclude the parts that are sets/reps and intensity
                                        exerciseName = parts
                                            .filter((part, index) => index !== setsRepsIndex && index !== intensityIndex)
                                            .join(' ');
                                        
                                        console.log(`Creating card for ${exerciseName} (${sets}x${reps}) with ${loadType}=${loadValue}`);
                                        
                                        // Create workout card with all details
                                        let card;
                                        if (typeof window.createWorkoutCard === 'function') {
                                            card = window.createWorkoutCard(exerciseName, null, {
                                                sets: sets,
                                                reps: reps,
                                                loadType: loadType,
                                                loadValue: loadValue,
                                                rest: '90s'
                                            });
                                            
                                            if (card) {
                                                dayCell.appendChild(card);
                                                console.log(`Added exercise "${exerciseName}" to ${dayId}`);
                                            } else {
                                                console.warn(`Failed to create card for ${exerciseName}`);
                                            }
                                        } else {
                                            console.error("createWorkoutCard function not available");
                                            
                                            // Fallback to basic card creation
                                            card = document.createElement('div');
                                            card.className = 'workout-card';
                                            
                                            // Create intensity text based on load type
                                            let intensityText = '';
                                            if (loadType === 'rpe' && loadValue) {
                                                intensityText = `RPE ${loadValue}`;
                                            } else if (loadType === 'percent' && loadValue) {
                                                intensityText = `${loadValue}%`;
                                            }
                                            
                                            card.innerHTML = `
                                                <div class="exercise-name">${exerciseName}</div>
                                                <div class="card-details-row">
                                                    <span class="card-reps">${sets}×${reps}</span>
                                                    <span class="card-intensity">${intensityText}</span>
                                                </div>
                                                <div class="card-actions">
                                                    <button class="card-action-btn edit-btn" title="Edit Exercise">✏️</button>
                                                    <button class="card-action-btn delete-btn" title="Delete Exercise">🗑️</button>
                                                </div>
                                            `;
                                            card.draggable = true;
                                            dayCell.appendChild(card);
                                            console.log(`Added basic card for "${exerciseName}" to ${dayId}`);
                                        }
                                    } catch (error) {
                                        console.error(`Error creating card for ${exerciseText}:`, error);
                                    }
                                }
                            });
                        }
                    });
                });
                
                // Trigger analytics update if available
                if (typeof triggerAnalyticsUpdate === 'function') {
                    triggerAnalyticsUpdate(workCanvas);
                }
            } else {
                console.warn("No schedule data found in template");
            }
            
            // Return true to indicate success
            return true;
        } catch (error) {
            console.error("Error loading template:", error);
            return false;
        }
    }

    // Make loadTemplateBlock accessible to other modules
    window.blockBuilder = window.blockBuilder || {};
    window.blockBuilder.loadTemplateBlock = loadTemplateBlock;

    // Signal that the block builder is ready
    window.dispatchEvent(new CustomEvent('blockbuilderReady'));

    // Listener for double-click to enable inline editing
    workCanvas.addEventListener('dblclick', (e) => {
        const card = e.target.closest('.workout-card');
        const target = e.target;

        if (card && (target.classList.contains('exercise-name') || target.classList.contains('card-reps') || target.classList.contains('card-intensity'))) {
            makeEditable(target);
        }
    });

    // Function to make an element editable
    function makeEditable(element) {
        // Prevent re-making editable if already in edit mode
        if (element.querySelector('input')) return;

        const originalText = element.textContent;
        const inputType = (element.classList.contains('card-reps') || element.classList.contains('card-intensity')) ? 'text' : 'text'; // Could be number for reps/intensity if strict parsing is desired
        const input = document.createElement('input');
        input.type = inputType;
        input.className = 'inline-edit-field';
        input.value = originalText;
        element.textContent = ''; // Clear original text
        element.appendChild(input);
        input.focus();
        element.classList.add('inline-edit-active');

        // Save on blur or Enter key
        input.addEventListener('blur', () => saveInlineEdit(element, input, originalText));
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                input.blur(); // Trigger blur to save
            } else if (e.key === 'Escape') {
                // Revert and remove input
                element.textContent = originalText;
                element.classList.remove('inline-edit-active');
            }
        });
    }

    // Function to save the inline edit
    function saveInlineEdit(element, input, originalText) {
        const newValue = input.value.trim();
        const card = element.closest('.workout-card');

        if (newValue && newValue !== originalText) {
            element.textContent = newValue;
            // Update card data based on which field was edited
            if (element.classList.contains('exercise-name')) {
                card.querySelector('.exercise-name').textContent = newValue; // Update visual
                // Potentially update card.dataset.exerciseName if used
            } else if (element.classList.contains('card-reps')) {
                // This needs to parse sets and reps, e.g., "3x10"
                const parts = newValue.match(/(\d+)[xX×](\d+)/);
                if (parts && parts.length === 3) {
                    card.dataset.sets = parts[1];
                    card.dataset.reps = parts[2];
                } else {
                    // Handle simple reps or invalid format
                    card.dataset.reps = newValue;
                    // card.dataset.sets might need clearing or special handling
                }
            } else if (element.classList.contains('card-intensity')) {
                // This needs to parse load type and value, e.g., "RPE 8", "75%", "100kg"
                const rpeMatch = newValue.match(/RPE\s*(\d+\.?\d*)/i);
                const percentMatch = newValue.match(/(\d+\.?\d*)\s*%/);
                const weightMatchKg = newValue.match(/(\d+\.?\d*)\s*kg/i);
                const weightMatchLb = newValue.match(/(\d+\.?\d*)\s*lb/i);
                // Basic weight match if no unit
                const weightMatchNumeric = newValue.match(/^(\d+\.?\d*)$/);


                if (rpeMatch) {
                    card.dataset.loadType = 'rpe';
                    card.dataset.loadValue = rpeMatch[1];
                } else if (percentMatch) {
                    card.dataset.loadType = 'percent';
                    card.dataset.loadValue = percentMatch[1];
                } else if (weightMatchKg) {
                    card.dataset.loadType = 'weight'; // Or 'kg'
                    card.dataset.loadValue = weightMatchKg[1];
                } else if (weightMatchLb) {
                    card.dataset.loadType = 'lb';
                    card.dataset.loadValue = weightMatchLb[1];
                } else if (weightMatchNumeric) { // Default to weight if just a number
                    card.dataset.loadType = 'weight'; 
                    card.dataset.loadValue = weightMatchNumeric[1];
                } else {
                    // Fallback for text or unparsed
                    card.dataset.loadType = 'text';
                    card.dataset.loadValue = newValue;
                }
            }

            // Update estimated load and save state
            card.dataset.load = calculateEstimatedLoad(card.dataset);
            triggerSaveState();
            triggerAnalyticsUpdate(workCanvas);
            showToast('Exercise updated', 'success');
        } else {
            // No change or empty, revert to original
            element.textContent = originalText;
        }
        element.classList.remove('inline-edit-active');
    }

    // <<< NEW: Central function to populate and show the modal >>>

    // --- PHASE 4: Dynamic Goal Adjustment & Block Regeneration ---

    const editGoalBtn = document.getElementById('editGoalBtn');
    const calendarGridEl = document.getElementById('calendar-grid');

    // --- GDAP State Variables ---
    let activeGDAPInstance = null; // Stores the current GDAP goal object if one is active
    let isEditingGDAP = false; // Flag to indicate if the modal is open for editing

    // --- Event Listener for Edit Goal Button ---
    if (editGoalBtn) {
        editGoalBtn.addEventListener('click', () => {
            if (activeGDAPInstance) {
                isEditingGDAP = true;
                populateGDAPModalForEditing(activeGDAPInstance);
                gdapModal.style.display = 'flex';
            } else {
                if (typeof showToast === 'function') {
                    showToast("No active GDAP goal to edit.", "info");
                } else {
                    alert("No active GDAP goal to edit.");
                }
            }
        });
    }

    // --- Function to pre-fill GDAP modal for editing ---
    function populateGDAPModalForEditing(goalInstance) {
        resetGDAPForm(); // Clear form first
        // Set overall goal type, timeframe, athlete level
        if(gdapForm.elements.goalType) gdapForm.elements.goalType.value = goalInstance.overallGoalType;
        if(gdapForm.elements.timeframe) gdapForm.elements.timeframe.value = goalInstance.timeframeWeeks;
        if(gdapForm.elements.athleteLevel) gdapForm.elements.athleteLevel.value = goalInstance.athleteLevel;
        if(gdapForm.elements.periodizationModel) gdapForm.elements.periodizationModel.value = goalInstance.periodizationModelName || "";
        // Populate primary exercises
        goalInstance.targetExercises.forEach((exGoal, index) => {
            const slotNumber = index + 1;
            let currentSlot;
            if (slotNumber > 1) {
                if (exerciseSlotCount < slotNumber) {
                    gdapAddExerciseBtn.click();
                }
            }
            currentSlot = document.getElementById(`gdapExerciseSlot${slotNumber}`);
            if (currentSlot) {
                const exerciseSelect = currentSlot.querySelector(`#gdapTargetExercise${slotNumber}`);
                const currentPerfInput = currentSlot.querySelector(`#gdapCurrentPerf${slotNumber}`);
                const targetPerfInput = currentSlot.querySelector(`#gdapTargetPerf${slotNumber}`);
                if (exerciseSelect) {
                    populateExerciseDropdownForGDAP(exerciseSelect);
                    exerciseSelect.value = exGoal.exerciseId;
                }
                if (currentPerfInput) currentPerfInput.value = exGoal.currentPerf;
                if (targetPerfInput) targetPerfInput.value = exGoal.targetPerf;
            }
        });
    }

    // --- Modify handleGDAPFormSubmit ---
    const originalHandleGDAPFormSubmit = handleGDAPFormSubmit;
    handleGDAPFormSubmit = async function() {
        if (isEditingGDAP) {
            const confirmed = confirm("Editing this goal will regenerate the program, clearing existing GDAP-generated exercises and suggestions. Any manual changes to these items may be lost. Continue?");
            if (!confirmed) {
                isEditingGDAP = false;
                gdapModal.style.display = 'none';
                return;
            }
        }
        const formData = new FormData(gdapForm);
        const newGoalInstance = {
            id: `gdap-${Date.now()}`,
            originalId: isEditingGDAP && activeGDAPInstance ? activeGDAPInstance.id : null,
            overallGoalType: formData.get('goalType'),
            timeframeWeeks: parseInt(formData.get('timeframe')),
            athleteLevel: formData.get('athleteLevel'),
            periodizationModelName: formData.get('periodizationModel') || null,
            targetExercises: []
        };
        for (let i = 1; i <= exerciseSlotCount; i++) {
            const exerciseId = formData.get(`targetExercise${i}`);
            if (exerciseId) {
                const selectEl = document.getElementById(`gdapTargetExercise${i}`);
                newGoalInstance.targetExercises.push({
                    exerciseId: exerciseId,
                    exerciseName: selectEl.options[selectEl.selectedIndex].text,
                    currentPerf: parseFloat(formData.get(`currentPerf${i}`)),
                    targetPerf: parseFloat(formData.get(`targetPerf${i}`)),
                });
            }
        }
        if (newGoalInstance.targetExercises.length === 0) {
            alert("Please select at least one primary target exercise.");
            isEditingGDAP = false;
            return;
        }
        // Dependency checks
        if (typeof ProgressionPathwayOrchestrator === 'undefined' || typeof PeriodizationEngine === 'undefined' || typeof ExerciseLibrary === 'undefined') {
            alert("Critical error: PPO, Engine or Library not available."); isEditingGDAP = false; return;
        }
        // --- Clear existing content BEFORE regeneration ---
        if (window.BlockBuilder && typeof window.BlockBuilder.clearCalendar === 'function') {
            window.BlockBuilder.clearCalendar();
        } else {
            if(calendarGridEl) calendarGridEl.innerHTML = '';
        }
        if (calendarGridEl) {
            calendarGridEl.removeAttribute('data-gdap-day-accessory-suggestions');
        }
        document.querySelectorAll('.day-cell').forEach(cell => {
            // Remove any GDAP-specific data attributes if needed
        });
        // --- Regenerate Calendar Grid ---
        if (window.BlockBuilder && window.BlockBuilder.CONFIG) {
            window.BlockBuilder.CONFIG.totalWeeks = newGoalInstance.timeframeWeeks;
            window.BlockBuilder.generateCalendarGrid();
        } else if (typeof generateCalendarGrid === 'function') {
            window.totalWeeks = newGoalInstance.timeframeWeeks; generateCalendarGrid(newGoalInstance.timeframeWeeks);
        } else {
            alert("Error: Could not generate calendar grid."); isEditingGDAP = false; return;
        }
        // --- Pathway Calculation ---
        const pathwaysData = ProgressionPathwayOrchestrator.calculateGoalDrivenPathways(
            newGoalInstance, PeriodizationEngine, ExerciseLibrary
        );
        if (!pathwaysData || pathwaysData.length === 0) {
            alert("Could not generate pathways with the new inputs."); isEditingGDAP = false; return;
        }
        // --- Apply Overall Periodization Model to Days (if selected) ---
        if (newGoalInstance.periodizationModelName && window.PeriodizationModelManagerInstance) {
            const allDayIdsInBlock = [];
            for (let w = 0; w < newGoalInstance.timeframeWeeks; w++) {
                ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].forEach(dayAbbr => {
                    allDayIdsInBlock.push(window.PeriodizationModelManagerInstance.generateDayId(w, dayAbbr));
                });
            }
            const modelDefaults = getModelDefaults(newGoalInstance.periodizationModelName);
            window.PeriodizationModelManagerInstance.createAndApplyModel(
                newGoalInstance.periodizationModelName, modelDefaults || {}, allDayIdsInBlock, ExerciseLibrary.getExercises()
            );
        }
        // --- Store accessory suggestions and populate cards (from Phase 3) ---
        const accessorySuggestionsByDayId = {};
        pathwaysData.forEach(weeklyTarget => {
            weeklyTarget.exercises.forEach(exTarget => {
                const weekNumber = weeklyTarget.week;
                const dayAbbreviation = exTarget.dayPreference;
                const dayIndices = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };
                const dayIndex = dayIndices[dayAbbreviation] !== undefined ? dayIndices[dayAbbreviation] : 0;
                const cellId = `week-${weekNumber - 1}-day-${dayIndex}`;
                const targetCell = document.getElementById(cellId);
                if (targetCell) {
                    const cardData = {
                        exerciseId: exTarget.exerciseId, exerciseName: exTarget.exerciseName,
                        sets: [{ sets: exTarget.sets, reps: exTarget.reps, weight: exTarget.load, rpe: exTarget.loadType === 'rpe' ? exTarget.load : '', notes: exTarget.loadType && exTarget.loadType !== 'weight' && exTarget.loadType !== 'rpe' ? exTarget.loadType.toUpperCase() : '' }],
                        notes: exTarget.detailsString || `Goal: ${newGoalInstance.overallGoalType}`,
                        isGoalDriven: true, goalInstanceId: newGoalInstance.id
                    };
                    let card;
                    if (typeof window.createWorkoutCard === 'function') {
                        card = window.createWorkoutCard(cardData.exerciseName, cardData.sets, cardData.notes, cardData.exerciseId, null, null, null, null, null, null, `card-gdap-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
                    } else {
                        card = document.createElement('div'); card.className = 'workout-card'; card.textContent = `${exTarget.exerciseName}: ${exTarget.detailsString}`; card.draggable = true; card.id = `gdap-card-${Date.now()}-${Math.random()}`;
                        if (window.DragDrop && typeof window.DragDrop.makeDraggable === 'function') { window.DragDrop.makeDraggable(card); }
                    }
                    card.dataset.goalDriven = "true";
                    card.dataset.sourceGoalId = newGoalInstance.id;
                    card.dataset.exerciseId = exTarget.exerciseId;
                    targetCell.appendChild(card);
                }
            });
            const daySuggestionsMapForWeek = {};
            weeklyTarget.suggestedAccessories.forEach(accSugg => {
                if (!daySuggestionsMapForWeek[accSugg.dayPreference]) daySuggestionsMapForWeek[accSugg.dayPreference] = [];
                daySuggestionsMapForWeek[accSugg.dayPreference].push(accSugg);
            });
            for (const [dayAbbr, suggestions] of Object.entries(daySuggestionsMapForWeek)) {
                const dayIndices = { mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6 };
                const dayIndex = dayIndices[dayAbbr] !== undefined ? dayIndices[dayAbbr] : 0;
                const cellId = `week-${weeklyTarget.week - 1}-day-${dayIndex}`;
                if (!accessorySuggestionsByDayId[cellId]) accessorySuggestionsByDayId[cellId] = [];
                accessorySuggestionsByDayId[cellId].push(...suggestions);
            }
        });
        if (calendarGridEl) {
            calendarGridEl.dataset.gdapDayAccessorySuggestions = JSON.stringify(accessorySuggestionsByDayId);
            calendarGridEl.dataset.activeGdapInstanceId = newGoalInstance.id;
        }
        activeGDAPInstance = newGoalInstance;
        if (editGoalBtn) editGoalBtn.style.display = 'block';
        isEditingGDAP = false;
        if (typeof saveStateToLocalStorage === 'function') saveStateToLocalStorage();
        if (typeof updateAnalytics === 'function') updateAnalytics();
        // Use the imported showToast function directly
        if (typeof showToast === 'function') {
            showToast('GDAP program regenerated!', 'success');
        } else {
            // Fallback to alert if showToast is not available
            console.warn('showToast function not available for notification');
            alert('GDAP program regenerated!');
        }
        
        // Handle modal closing properly
        if (gdapModal) {
            if (gdapModal.classList) {
                gdapModal.classList.remove('is-visible');
            }
            gdapModal.style.display = 'none';
        }
    }

    // Function to update the visibility of the editGoalBtn
    window.updateEditGoalButtonVisibility = () => {
        if (activeGDAPInstance && calendarGridEl && calendarGridEl.dataset.activeGdapInstanceId === activeGDAPInstance.id) {
            if(editGoalBtn) editGoalBtn.style.display = 'block';
        } else {
            if(editGoalBtn) editGoalBtn.style.display = 'none';
            activeGDAPInstance = null;
            if(calendarGridEl) calendarGridEl.removeAttribute('data-active-gdap-instance-id');
        }
    };

    window.createWorkoutCard = createWorkoutCard;
}); // End DOMContentLoaded 

// Expose required functions for template integration
window.blockBuilder = {
    loadTemplateBlock: function(template) {
        console.log("Loading template block:", template.title);
        
        try {
            // Switch to builder view
            document.body.classList.add('show-builder');
            document.body.classList.remove('show-hub');
            
            const backToHubBtn = document.getElementById('back-to-hub-btn');
            if (backToHubBtn) {
                backToHubBtn.style.display = 'inline-block';
            }
            
            // Set the block name from template
            const blockNameInput = document.getElementById('block-name');
            if (blockNameInput) {
                blockNameInput.value = template.title;
            }
            
            // Configure phases based on template
            if (template.phases && template.phases.length > 0) {
                // Clear existing phases
                const phaseRibbon = document.getElementById('phase-ribbon');
                if (phaseRibbon) {
                    phaseRibbon.innerHTML = '';
                    
                    // Add phases from template
                    let totalWidth = 100;
                    template.phases.forEach((phase, index) => {
                        const isLast = index === template.phases.length - 1;
                        const phaseWidth = phase.duration / template.weeks * 100;
                        
                        const phaseBar = document.createElement('div');
                        phaseBar.className = `phase-bar phase-${phase.color}`;
                        phaseBar.style.width = `${phaseWidth}%`;
                        phaseBar.setAttribute('data-phase', phase.color);
                        
                        const phaseLabel = document.createElement('span');
                        phaseLabel.className = 'phase-bar-label';
                        phaseLabel.textContent = phase.name;
                        phaseBar.appendChild(phaseLabel);
                        
                        if (!isLast) {
                            const resizeHandle = document.createElement('div');
                            resizeHandle.className = 'phase-resize-handle';
                            phaseBar.appendChild(resizeHandle);
                        }
                        
                        phaseRibbon.appendChild(phaseBar);
                    });
                    
                    // Reinitialize phase resizing
                    if (typeof initializePhaseResizing === 'function') {
                        initializePhaseResizing();
                    }
                }
            }
            
            // Generate grid with template weeks - using the method from this object
            const gridResult = this.generateCalendarGrid(template.weeks || 8);
            if (!gridResult) {
                console.error("Failed to generate calendar grid");
                return false;
            }
            
            // Load the template data - Create workout cards from the template schedule
            if (template.schedule && template.schedule.length > 0) {
                console.log("Found schedule data in template - creating workout cards");
                
                // Get a reference to the workCanvas
                const workCanvas = document.getElementById('work-canvas');
                console.log("Got workCanvas reference:", workCanvas ? "Found" : "Missing");
                
                if (!workCanvas) {
                    console.error("Work canvas not found when trying to populate template");
                    return false;
                }
                
                // Process each week in the schedule
                template.schedule.forEach(weekData => {
                    const weekNum = weekData.week;
                    console.log(`Processing template week ${weekNum}`);
                    
                    // Process each day in the week
                    weekData.days.forEach(dayData => {
                        const dayName = dayData.day; // e.g., "Monday"
                        console.log(`Processing day: ${dayName} in week ${weekNum}`);
                        
                        // Convert day name to abbreviated format (Mon, Tue, etc.)
                        const dayAbbr = dayName.substring(0, 3).toLowerCase();
                        
                        // Generate day ID using the correct format
                        const dayId = `wk${weekNum}-${dayAbbr}`;
                        console.log(`Looking for day cell with ID: ${dayId}`);
                        
                        // Find the day cell for this specific day
                        const dayCell = workCanvas.querySelector(`[data-day-id="${dayId}"]`);
                        
                        if (!dayCell) {
                            console.warn(`Could not find day cell for ${dayId}`);
                            return; // Skip this day
                        }
                        
                        // Add the workout title as a header to the day
                        if (dayData.title && dayData.title !== 'Rest') {
                            const headerCard = document.createElement('div');
                            headerCard.className = 'day-header';
                            headerCard.textContent = dayData.title;
                            dayCell.appendChild(headerCard);
                        }
                        
                        // Create exercise cards for this day
                        if (dayData.exercises && dayData.exercises.length > 0) {
                            dayData.exercises.forEach(exerciseText => {
                                if (exerciseText) {
                                    try {
                                        // Parse the exercise text (e.g., "Bench Press 4x8")
                                        const parts = exerciseText.split(' ');
                                        
                                        // Extract sets and reps if available
                                        const lastPart = parts[parts.length - 1];
                                        let sets = '';
                                        let reps = '';
                                        
                                        // Check for common pattern like 3x10, 5x5, etc.
                                        if (lastPart.includes('x')) {
                                            const setsReps = lastPart.split('x');
                                            if (setsReps.length === 2) {
                                                sets = setsReps[0];
                                                reps = setsReps[1];
                                                // Remove the sets/reps part from exercise name
                                                parts.pop();
                                            }
                                        }
                                        
                                        // Join the remaining parts as the exercise name
                                        const exerciseName = parts.join(' ');
                                        
                                        // Use the globally available createWorkoutCard function
                                        if (typeof window.createWorkoutCard === 'function') {
                                            const card = window.createWorkoutCard(exerciseName, `${sets || ''}x${reps || ''}`, {
                                                sets: sets,
                                                reps: reps,
                                                loadValue: '',
                                                loadType: 'weight',
                                                rest: '90s',
                                                notes: '',
                                                dayId: dayId
                                            });
                                            
                                            if (card) {
                                                dayCell.appendChild(card);
                                                console.log(`Added exercise "${exerciseName}" to ${dayId}`);
                                            } else {
                                                console.warn(`Failed to create card for ${exerciseName}`);
                                            }
                                        } else {
                                            console.error("createWorkoutCard function not available globally");
                                        }
                                    } catch (error) {
                                        console.error(`Error creating card for ${exerciseText}:`, error);
                                    }
                                }
                            });
                        }
                    });
                });
                
                // Trigger analytics update
                if (typeof window.triggerAnalyticsUpdate === 'function') {
                    window.triggerAnalyticsUpdate(workCanvas);
                }
                
                return true;
            } else {
                console.warn("No schedule data found in template");
                return true; // Still return true as the template was loaded, just without schedule data
            }
        } catch (error) {
            console.error("Error loading template block:", error);
            return false;
        }
    },
    
    generateCalendarGrid: function(weeks) {
        console.log(`Generating calendar grid for ${weeks} weeks`);
        
        const workCanvas = document.getElementById('work-canvas');
        if (!workCanvas) {
            console.error("Work canvas not found");
            return false;
        }
        
        // Check if we've already generated the grid
        const existingWeekLabels = workCanvas.querySelectorAll('.week-label');
        if (existingWeekLabels.length >= weeks) {
            console.log(`Grid already exists with ${existingWeekLabels.length} weeks, keeping it`);
            return true;
        }
        
        // Clear existing grid if any
        workCanvas.innerHTML = '';
        
        // Add day headers
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        days.forEach(day => {
            const header = document.createElement('div');
            header.className = 'calendar-header';
            header.textContent = day;
            workCanvas.appendChild(header);
        });
        
        // Generate week rows
        for (let week = 1; week <= weeks; week++) {
            // Week label
            const weekLabel = document.createElement('div');
            weekLabel.className = 'week-label';
            weekLabel.setAttribute('data-week', week);
            weekLabel.textContent = `Wk ${week}`;
            workCanvas.appendChild(weekLabel);
            
            // Day cells for this week
            days.forEach(day => {
                const dayCell = document.createElement('div');
                dayCell.className = 'day-cell session-slot';
                dayCell.setAttribute('data-week', week);
                dayCell.setAttribute('data-day', day);
                
                // Create a standardized day ID (important for template loading)
                const dayId = `wk${week}-${day.toLowerCase()}`;
                dayCell.setAttribute('data-day-id', dayId);
                
                workCanvas.appendChild(dayCell);
            });
        }
        
        // Reattach drag-drop listeners to new grid
        if (typeof attachDragDropListeners === 'function') {
            attachDragDropListeners();
        }
        
        console.log(`Calendar grid generated with ${weeks} weeks`);
        return true;
    }
};

// Dispatch blockbuilderReady event when initialization is complete
document.addEventListener('DOMContentLoaded', function() {
    // After all initialization is complete
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('blockbuilderReady'));
        console.log('blockbuilderReady event dispatched');
    }, 500); // Short delay to ensure everything is loaded
});

function syncSelectedContext(contextType, data = {}) {
    // Define and call internal clearSelectionStyles function to avoid reference error
    function clearSelectionStylesInternal() {
        document.querySelectorAll('.selected, .model-context-selected').forEach(el => {
            el.classList.remove('selected', 'model-context-selected');
        });
    }
    
    // Update the UI based on selection context
    clearSelectionStylesInternal();
    
    // Store current selection context
    window.currentContext = {
        type: contextType,
        ...data
    };
    
    // Apply visual styles based on context type
    if (contextType === 'model') {
        const { modelId, dayId } = data;
        const dayCells = document.querySelectorAll('.day-cell');
        dayCells.forEach(cell => {
            if (cell.dataset.dayId === dayId) {
                cell.classList.add('model-selected');
            }
        });
    } else if (contextType === 'phase') {
        // Handle phase selection UI updates
        const phaseElements = document.querySelectorAll('.phase-container');
        phaseElements.forEach(phase => {
            phase.classList.add('phase-context-active');
        });
    } else if (contextType === 'day') {
        // Handle day selection UI updates
        const { dayId } = data;
        const dayCell = document.querySelector(`.day-cell[data-day-id="${dayId}"]`);
        if (dayCell) {
            dayCell.classList.add('day-selected');
        }
    }
    
    // Update inspector or other UI elements as needed
    if (typeof updateInspectorForSelection === 'function') {
        updateInspectorForSelection();
    }
}