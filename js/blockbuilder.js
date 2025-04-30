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

        const instanceId = PeriodizationModelManager.getModelForDay(dayId);

        // Always remove existing classes first
        dayCellElement.classList.remove('has-model');
        const existingModelTypeClasses = Array.from(dayCellElement.classList).filter(cls => cls.startsWith('model-type-'));
        dayCellElement.classList.remove(...existingModelTypeClasses);

        if (instanceId) {
            const model = PeriodizationModelManager.getModelInstance(instanceId);
            if (model) {
                // Check if any card within the cell is actually model-driven
                // This prevents styling the cell if only independent cards remain after edits
                const modelDrivenCard = dayCellElement.querySelector('.workout-card[data-model-driven="true"]');
import acwr from './acwr.js';
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
            periodizationModels: PeriodizationModelManager.getState() // Get from manager
        };
    }

    // --- Initialize ForgeAssist --- 
    console.log('[BlockBuilder] Initializing ForgeAssist...');
    try {
        ForgeAssist.init({
            workCanvas: workCanvas,
            showToast: showToast, // Assumes showToast is available in this scope
            triggerAnalyticsUpdate: triggerAnalyticsUpdate, // Assumes triggerAnalyticsUpdate is available
            getTotalWeeks: getTotalWeeksHelper,
            getBlockState: getBlockStateHelper,
            exerciseLibrary: exerciseLibraryData, // Assumes exerciseLibraryData holds the loaded library
            // Pass analytics functions
            acwrFunction: acwr, 
            monotonyFunction: monotony,
            // Ensure getCurrentBlockLoads receives workCanvas when called by ForgeAssist/AdaptiveScheduler
            getCurrentBlockLoads: () => getCurrentBlockLoads(workCanvas), // <<< MODIFIED HERE
            simulatedPastLoad: window.simulatedPastLoad || [] // Get from global or default
        });
         console.log('[BlockBuilder] ForgeAssist Initialized.');
    } catch (error) {
        console.error('[BlockBuilder] Error initializing ForgeAssist:', error);
        showToast('ForgeAssist failed to initialize!', 'error');
    }
import monotony from './monotony.js';
// Import the engine module as an object
import * as PeriodizationEngine from './periodizationEngine.js'; 
import vbtAdjust from './velocityAutoReg.js'; // Import VBT adjustment logic
// Import necessary helpers/state functions
import { getStructuredDetails } from './utils/helpers.js'; 
import { triggerSaveState } from './state/storage.js'; 
// import ForgeAssist from './forgeassist.js'; // <<< REMOVED Import ForgeAssist
// import AdaptiveScheduler from './adaptiveScheduler.js'; // REMOVED Import AdaptiveScheduler explicitly
import PeriodizationModelManager from './periodizationModelManager.js'; // <<< UNCOMMENTED Import
import { initializePhaseResizing } from './ui/phaseResize.js'; // <-- Added Phase Resize
import { handleSelection, getSelectionState } from './ui/selection.js';
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
    loadViewMode // Add view mode function
} from './exercises/library.js'; // <-- Added Library import
import ForgeAssist from './forgeassist.js';
import AdaptiveScheduler from './adaptiveScheduler.js';

const hubContainer = document.getElementById('block-builder-hub');
const blockBuilderContainer = document.querySelector('.block-builder-container');

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

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed for blockbuilder.js");

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
    const hubCreateNewBtn = document.getElementById('hub-create-new'); // <<< DEFINE THIS
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

    // Initialize Periodization Model Manager
    if (typeof PeriodizationModelManager !== 'undefined') {
        const periodizationManagerInstance = new PeriodizationModelManager();
        periodizationManagerInstance.init({ showToast, createWorkoutCard, getBlockStateHelper, getTotalWeeksHelper });
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
        // Use the imported ForgeAssist directly
        // Pass necessary functions and data
        const analyticsInterface = { 
            getACWR: () => typeof AnalyticsModule !== 'undefined' && AnalyticsModule.getACWR ? AnalyticsModule.getACWR(AnalyticsModule.getDailyLoads(workCanvas)) : null,
            getMonotony: () => typeof AnalyticsModule !== 'undefined' && AnalyticsModule.getMonotony ? AnalyticsModule.getMonotony(AnalyticsModule.getDailyLoads(workCanvas)) : null,
            getStrain: () => typeof AnalyticsModule !== 'undefined' && AnalyticsModule.getStrain ? AnalyticsModule.getStrain(AnalyticsModule.getDailyLoads(workCanvas)) : null,
            getWeeklyLoad: (weekNum) => typeof AnalyticsModule !== 'undefined' && AnalyticsModule.getWeeklyLoad ? AnalyticsModule.getWeeklyLoad(AnalyticsModule.getDailyLoads(workCanvas), weekNum) : 0,
            getTotalLoad: () => typeof AnalyticsModule !== 'undefined' && AnalyticsModule.getTotalLoad ? AnalyticsModule.getTotalLoad(AnalyticsModule.getDailyLoads(workCanvas)) : 0
        };

        if (typeof ForgeAssist.init === 'function') {
            ForgeAssist.init({
                workCanvas: workCanvas,
                showToast: showToast,
                triggerAnalyticsUpdate: triggerAnalyticsUpdate,
                getTotalWeeks: getTotalWeeksHelper, // Pass helper function
                getBlockState: getBlockStateHelper, // Pass helper function
                exerciseLibrary: libraryData,
                // Pass analytics functions directly or via interface
                acwrFunction: analyticsInterface.getACWR,
                monotonyFunction: analyticsInterface.getMonotony,
                getCurrentBlockLoads: () => typeof AnalyticsModule !== 'undefined' ? AnalyticsModule.getDailyLoads(workCanvas) : [],
                simulatedPastLoad: typeof blockData !== 'undefined' ? blockData.getSimulatedPastLoad() : [],
                // Provide AdaptiveScheduler instance/functions if needed by ForgeAssist
                adaptiveScheduler: AdaptiveScheduler // Pass the global object
            });
            console.log("[BlockBuilder] ForgeAssist initialized successfully.");
        } else {
            console.error("ForgeAssist.init is not a function!");
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
                periodizationModels: PeriodizationModelManager.getState() // Get from manager
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
        const numWeeks = parseInt(newBlockWeeksInput?.value || '8', 10);
        const blockName = newBlockNameModalInput?.value || 'Untitled Block';
        const modelType = newBlockModelSelect?.value || 'blank'; // Get selected model type
        const sessionsPerWeek = parseInt(newBlockSessionsSelect?.value || '3', 10);

        console.log(`Creating new block: ${numWeeks} weeks, ${sessionsPerWeek} sessions/wk, Model: ${modelType}, Name: ${blockName}`);

        // 1. Generate Grid
        generateCalendarGrid(numWeeks);

        // 2. Determine Target Days based on sessionsPerWeek
        let sessionDays = [];
        if (sessionsPerWeek >= 7) sessionDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        else if (sessionsPerWeek >= 6) sessionDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        else if (sessionsPerWeek >= 5) sessionDays = ["Mon", "Tue", "Thu", "Fri", "Sat"];
        else if (sessionsPerWeek >= 4) sessionDays = ["Mon", "Tue", "Thu", "Fri"];
        else if (sessionsPerWeek >= 3) sessionDays = ["Mon", "Wed", "Fri"];
        else if (sessionsPerWeek >= 2) sessionDays = ["Tue", "Thu"];
        else if (sessionsPerWeek >= 1) sessionDays = ["Wed"];

        const targetDayIds = [];
        for (let week = 0; week < numWeeks; week++) {
            sessionDays.forEach(day => {
                const dayId = PeriodizationModelManager.generateDayId(week, day);
                if (dayId) targetDayIds.push(dayId);
            });
        }
        console.log("Target Day IDs for model:", targetDayIds);

        // 3. Create and Apply Model Instance (if not 'blank')
        let instanceId = null;
        if (modelType !== 'blank') {
            // TODO: Get baseParams if needed (e.g., from other modal inputs)
            const baseParams = {}; 
            // <<< MODIFIED: Pass exerciseLibraryData >>>
            instanceId = PeriodizationModelManager.createAndApplyModel(modelType, baseParams, targetDayIds, exerciseLibraryData);
            if (!instanceId) {
                showToast(`Failed to create periodization model: ${modelType}`, 'error');
                // Proceed with blank block? Or stop?
                // For now, just continue without model-driven cards.
            } else {
                console.log(`Model instance ${instanceId} created and applied.`);
                // TODO: Call engine to populate cards based on this instanceId and targetDayIds
                // populateModelDrivenCards(instanceId, targetDayIds);
                populateModelDrivenCards(instanceId, targetDayIds); // Call the new function
            }
        }

        // 4. Reset Phases (Example Default)
        const phases = phaseRibbon.querySelectorAll('.phase-bar');
        if (phases.length === 4) { // Basic check
            phases[0].style.width = '25%';
            phases[1].style.width = '40%';
            phases[2].style.width = '25%';
            phases[3].style.width = '10%';
        }
        updateCalendarPhaseIndicators(phaseRibbon, workCanvas);

        // 5. Clear Settings (Except potentially name)
        const settingsTab = document.getElementById('settings');
        if (settingsTab) {
            settingsTab.querySelectorAll('#prev-planned-rpe, #prev-actual-rpe').forEach(input => input.value = '');
            const nameInput = settingsTab.querySelector('#block-name');
            if(nameInput) nameInput.value = blockName;
        }
        saveSettingsToLocalStorage(); // Save cleared/updated settings

        // 6. Clear Version Tracking & Autosave Keys
        currentLoadedVersionTimestamp = null;
        localStorage.removeItem(SAVE_KEY);
        // Do NOT remove VERSIONS_KEY or RECENT_BLOCKS_KEY

        // 7. Close Modal & Switch View
        if (newBlockOptionsModal) newBlockOptionsModal.classList.remove('is-visible');
        showView('builder');
        showToast(`Created new ${numWeeks}-week block`, 'info', 3000);

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

        const modelInstance = PeriodizationModelManager.getModelInstance(instanceId);
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
        if (!hubContainer || !blockBuilderContainer || !backToHubBtn) {
            console.error("View containers or button not found!");
             return;
        }

        if (viewName === 'builder') {
            hubContainer.style.display = 'none';
            blockBuilderContainer.style.display = 'flex'; // Assuming flex layout for builder
            backToHubBtn.style.display = 'inline'; // Show back button
        } else if (viewName === 'hub') {
            hubContainer.style.display = 'block'; // Or flex, depending on its CSS
            blockBuilderContainer.style.display = 'none';
            backToHubBtn.style.display = 'none'; // Hide back button
        } else {
            console.warn(`Unknown view name: ${viewName}`);
        }
    }

    // <<<--- ADD EVENT LISTENERS HERE --- >>>
    // --- Hub Button Event Listeners ---
    if (hubCreateNewBtn) {
        hubCreateNewBtn.addEventListener('click', () => {
            console.log("Create New button clicked");
        }
    });
    
    // --- Register event listeners for inspector tabs ---

    // <<< NEW: Function to handle workout card clicks (opens modal) >>>
    function handleCardClick(cardElement, isShiftKey) {
        // First handle the selection state
        handleSelection(cardElement, isShiftKey);
        
        // Update the selected context
            const modal = document.getElementById('new-block-options-modal');
            if (modal) {
                modal.classList.add('is-visible');
            }
            // Previously, this might have directly shown the builder view
            // showView('builder'); 
            // generateCalendarGrid(8); // Default 8 weeks
        });
    }

    if (hubBrowseTemplatesBtn) {
        hubBrowseTemplatesBtn.addEventListener('click', () => {
            console.log("Browse Templates button clicked (hub)");
            // showToast("Template browser not yet implemented.", "info"); // <<< REMOVE THIS LINE
            const templatesModal = document.getElementById('templates-modal');
            if (templatesModal) {
                templatesModal.classList.add('is-visible');
            } else {
                console.error("Templates modal not found!");
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

    if (newBlockOptionsCloseBtn && newBlockOptionsModal) {
        newBlockOptionsCloseBtn.addEventListener('click', () => {
        const { selectedElement, selectedElements } = getSelectionState();
        selectedContext.type = 'exercise';
        selectedContext.elements = new Set(selectedElements);
        
        // Update multi-select toolbar visibility
        updateMultiSelectToolbarVisibility();
        
        // Update ForgeAssist context to ensure it has the latest selection
        ForgeAssist.updateContext(selectedElement, selectedElements);
        
        // Open inspector based on selection count
            console.log("Modal close button clicked.");
                 newBlockOptionsModal.classList.remove('is-visible');
             });
        } else {
        if (!newBlockOptionsCloseBtn) console.error("Modal Close button not found!");
    }

    if (browseTemplatesBtn) {
         browseTemplatesBtn.addEventListener('click', () => {
        if (selectedContext.elements.size === 1 && !isShiftKey) {
            // Single selection - show exercise details
            updateInspectorForSelection(); // Ensure details are updated before opening
            openInspector(cardElement);
        } else if (selectedContext.elements.size > 1) {
            // Multi-selection - show multi-select inspector
            openMultiSelectInspector();
            console.log("Browse Templates button clicked");
            const templatesModal = document.getElementById('templates-modal');
            if (templatesModal) {
                templatesModal.classList.add('is-visible');
            } else {
                console.error("Templates modal not found!");
            }
        });
            } else {
        console.error("Browse Templates button not found!");
    }
    // <<<--- END ADDED EVENT LISTENERS --- >>>
        } else {
            // No selection - close inspector
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

    // --- Helper Functions Now Defined INSIDE DOMContentLoaded ---

    /**
     * Creates a workout card DOM element.
     * Utilizes getStructuredDetails, calculateEstimatedLoad, deleteWorkoutCard, 
     * handleSelection, openInspector, updateCardVbtIndicator (needs import/def)
     */
    function createWorkoutCard(exerciseName, details, options = {}) { 
        const card = document.createElement('div');
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
        card.className = 'workout-card';
        card.draggable = true;
        card.id = options.id || `workout-${Date.now()}-${Math.random().toString(16).slice(2)}`; 

        // --- MODIFIED: Use options directly, remove getStructuredDetails call --- 
        // Set dataset attributes directly from options or use defaults
        card.dataset.sets = options.sets || '';
    
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
        card.dataset.reps = options.reps || '';
        card.dataset.loadType = options.loadType || 'rpe'; // Default to RPE or empty? Let's keep RPE default for now
        card.dataset.loadValue = options.loadValue || '';
        card.dataset.rest = options.rest || '';
        card.dataset.exerciseId = options.exerciseId || ''; // <<< ADDED exerciseId
        // Use provided notes from options, fall back to original details string if notes aren't in options
        card.dataset.notes = options.notes || details || ''; 
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
        card.innerHTML = `
            if (exerciseId) {
                const libraryData = exerciseLibraryData.find(ex => ex.id === exerciseId);
            <div class="card-face card-front">
                <!-- Badge Placeholder - content added dynamically -->
                <div class="card-model-badge-indicator" style="display: none;"></div> 
                <!-- Name and Details moved out of wrapper -->
                <div class="exercise-name">${exerciseName}</div>
                <div class="exercise-details">
                    <span class="sets-reps">${card.dataset.sets}x${card.dataset.reps}</span>
                    <span class="load">${card.dataset.loadType} ${card.dataset.loadValue}</span>
                </div>
                <!-- card-main-content wrapper removed -->
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
                <div class="card-actions">
                    <button class="card-action-btn edit-btn" title="Edit Exercise">✏️</button>
                    <button class="card-action-btn delete-btn" title="Delete Exercise">🗑️</button>
                </div>
                 <div class="vbt-indicator" style="display: none;" title="Velocity Loss Target"></div>
        if (!libraryData) return;

        const exerciseName = libraryData.name || 'Exercise';
        if (exerciseDetailTitle) exerciseDetailTitle.textContent = exerciseName;

        // Populate Library Info (Always available)
        if (detailLibraryCategory) detailLibraryCategory.textContent = libraryData.category || '-';
        if (detailLibraryDescription) detailLibraryDescription.textContent = libraryData.description || '-';
            </div>
            <div class="card-face card-back" style="display: none;">
                <!-- Back content for editing/details -->
            </div>
        `;

        // Add event listeners 
        // Needs deleteWorkoutCard definition or import
        card.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering cell selection
            // deleteWorkoutCard(card); // Assuming deleteWorkoutCard is available in this scope or imported
        if (detailLibraryMuscles) detailLibraryMuscles.textContent = (libraryData.primaryMuscles || []).join(', ') || '-';
        if (detailLibraryEquipment) detailLibraryEquipment.textContent = (libraryData.equipmentNeeded || []).join(', ') || '-';
        if (detailLibraryDifficulty) detailLibraryDifficulty.textContent = libraryData.difficulty || '-';
        
        // Enhanced YouTube Video Handling
        const videoContainer = document.getElementById('exercise-video-container');
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
        if (videoContainer) {
            videoContainer.innerHTML = ''; // Clear previous video
            
            if (libraryData.videoUrl && (libraryData.videoUrl.includes('youtube.com') || libraryData.videoUrl.includes('youtu.be'))) {
                let videoId = null;
                
                try {
                    // Extract YouTube video ID from different URL formats
                    const url = new URL(libraryData.videoUrl);
        card.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation(); 
            handleSelection(card, false); // Select only this card
            openInspector(card);
        });

        // NEW: Make clicking the card (not edit/delete) open inspector and select
        card.addEventListener('click', (e) => {
            if (e.target.closest('.edit-btn') || e.target.closest('.delete-btn')) return;
                    
                    if (url.hostname === 'youtu.be') {
                        videoId = url.pathname.substring(1); // Get path after hostname
                    } else if (url.hostname.includes('youtube.com')) {
                        if (url.searchParams.has('v')) {
                            videoId = url.searchParams.get('v');
                        } else if (url.pathname.includes('/embed/')) {
            handleCardClick(card, e.shiftKey);
        });

        // Note: Removed model icon listener and update call

        return card;
    }

    // Helper to estimate load (simplified)
    function calculateEstimatedLoad(dataset) {
        let estimatedLoad = 300; // Base load
        const sets = parseInt(dataset.sets, 10) || 1;
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
        const reps = parseInt(String(dataset.reps).split('-')[0], 10) || 5; // Take first number if range
        const loadVal = parseFloat(dataset.loadValue) || 0;
        estimatedLoad += sets * reps * 5;
        if (dataset.loadType === '%' && loadVal > 0) {
            estimatedLoad *= (loadVal / 100);
        } else if (loadVal > 0) {
            estimatedLoad += loadVal;
        }
                    }
                    
                } catch (e) {
                    console.error("Error parsing video URL:", libraryData.videoUrl, e);
                }

                if (videoId) {
                    // Create enhanced iframe with additional parameters for better UX
                    const iframe = document.createElement('iframe');
                    iframe.width = '100%';
                    iframe.height = '100%';
        return Math.round(estimatedLoad).toString();
    }

    // --- Load Initial Block State into DOM ---
    // Uses workCanvas, loadStateDataFromLocalStorage, showView, generateCalendarGrid, 
    // phaseRibbon, updateCalendarPhaseIndicators, PeriodizationModelManager, 
    // createWorkoutCard, updateCardVbtIndicator, attachListenersToAllSlots, triggerAnalyticsUpdate
    function loadBlockIntoDOM() {
        console.log("Forcing Hub view on initial load.");
                    
                    // Add params for better playback experience
                    const params = new URLSearchParams({
                        rel: '0',              // Don't show related videos from other channels
                        modestbranding: '1',   // Hide YouTube logo
                        enablejsapi: '1',      // Enable JavaScript API
                        origin: window.location.origin, // Security: specify origin
                        playsinline: '1',      // Play inline on mobile devices
                        autoplay: '0',         // Don't autoplay
        showView('hub');
        // --- REMOVE STATE LOADING LOGIC --- 
        /* 
        console.log("Attempting to load block state into DOM...")
        const state = loadStateDataFromLocalStorage(); // Get the raw state data

        // --- MODIFIED CHECK --- 
        // Check not just if state exists, but if it contains meaningful data
        const isValidState = state && 
                           ( (state.slots && Object.keys(state.slots).length > 0) || 
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
                             (state.phases && state.phases.length > 0) ||
                             (state.periodizationModels && Object.keys(state.periodizationModels.modelInstances || {}).length > 0)
                           );

        if (!isValidState) {
            console.log("No valid saved state found or error loading. Showing Hub.");
            showView('hub'); // Show hub if no *valid* state
            // Populate recent blocks for the hub view even if no active state
                    
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
                            <div class="video-icon-placeholder">
                                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="1.5"/>
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

                                    <path d="M15 9L9 15M9 9L15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                                </svg>
                            </div>
                            <p>Could not extract video ID</p>
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
                                id: cardData.id,
                                sets: cardData.sets,
                                reps: cardData.reps,
                                loadType: cardData.loadType,
                                loadValue: cardData.loadValue,
                                <path d="M15.5 12L10 16V8L15.5 12Z" fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <p>No video available</p>
                    </div>
                `;
            }
        }

        // Populate Current Specs & Footer Buttons based on context (card or library)
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
        const currentSpecsSection = exerciseDetailModal.querySelector('.current-specs');
        if (cardData) { // Clicked from a card on the canvas
            if (currentSpecsSection) currentSpecsSection.style.display = ''; // Show
            if (detailCurrentSets) detailCurrentSets.textContent = cardData.sets || '-';
            if (detailCurrentReps) detailCurrentReps.textContent = cardData.reps || '-';
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
            if (detailCurrentLoadType) detailCurrentLoadType.textContent = cardData.loadType || '-';
            if (detailCurrentLoadValue) detailCurrentLoadValue.textContent = cardData.loadValue || '-';
            if (detailCurrentRest) detailCurrentRest.textContent = cardData.rest || '-';
            if (detailCurrentNotes) detailCurrentNotes.textContent = cardData.notes || '-';
        }

        // 6. Update Day Cell DOM Attributes from Loaded Model Manager State
        const loadedMapping = PeriodizationModelManager.dayModelMapping;
        if (loadedMapping && Object.keys(loadedMapping).length > 0 && workCanvas) {
            console.log("Updating day cell DOM attributes from loaded model manager state...");
            Object.entries(loadedMapping).forEach(([dayId, instanceId]) => {
                const cellElement = workCanvas.querySelector(`[data-day-id="${dayId}"]`);

            // Configure buttons for card context
            if (detailModalEditBtn) detailModalEditBtn.style.display = ''; // Show
            if (detailModalSwapBtn) detailModalSwapBtn.textContent = 'Suggest Swap'; // Reset text
            detailModalEditBtn.onclick = () => {
                closeExerciseDetailModal();
                openInspector(document.getElementById(cardData.id)); // Find card by ID
                activateTab('details');
                if (cellElement) {
                    PeriodizationModelManager.updateDayCellDOMAttributes(cellElement, instanceId);
                    // Call updateDayBadge AFTER attributes are set
                    updateDayBadge(cellElement); 
                } else {
                    console.warn(`Could not find day cell element for ${dayId} during post-load update.`);
                }
            });
        }
            };
            detailModalSwapBtn.onclick = () => {
                closeExerciseDetailModal();
                // Get the specific card element for context
                const cardElement = document.getElementById(cardData.id);
                if(cardElement) ForgeAssist.updateContext(cardElement, new Set([cardElement])); // Ensure context is set

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
                const action = ForgeAssist.getContextualActions().find(a => a.id === 'suggest_swap' || a.id === 'find-alternative');
                if (action?.handler) action.handler();
                else showToast('Could not trigger swap suggestion.', 'warning');
            };

        } else { // Clicked from the library list
        console.log("Attempting to load settings into DOM...");
        const settings = loadSettingsDataFromLocalStorage();
        if (!settings) {
            console.log("No saved settings found.");
            return; 
        }
        console.log("Saved settings loaded:", settings);
        
        // Apply settings (Example: block name)
            if (currentSpecsSection) currentSpecsSection.style.display = 'none'; // Hide
            // Clear current specs just in case
            if (detailCurrentSets) detailCurrentSets.textContent = '-';
        if (blockNameInput && settings.blockName) { // blockNameInput is defined in outer scope
            blockNameInput.value = settings.blockName;
        }
        
        // Apply other settings...
        // Example: RPE drift - Need element references
        const prevPlannedRpeInput = document.getElementById('prev-planned-rpe');
        const prevActualRpeInput = document.getElementById('prev-actual-rpe');
            if (detailCurrentReps) detailCurrentReps.textContent = '-';
            if (detailCurrentLoadType) detailCurrentLoadType.textContent = '-';
            if (detailCurrentLoadValue) detailCurrentLoadValue.textContent = '-';
            if (detailCurrentRest) detailCurrentRest.textContent = '-';
            if (detailCurrentNotes) detailCurrentNotes.textContent = '-';
        if (prevPlannedRpeInput && settings.prevPlannedRpe) {
            prevPlannedRpeInput.value = settings.prevPlannedRpe;
        }
        if (prevActualRpeInput && settings.prevActualRpe) {
            prevActualRpeInput.value = settings.prevActualRpe;
        }

        console.log("Settings applied to DOM.");

            // Configure buttons for library context
            if (detailModalEditBtn) detailModalEditBtn.style.display = 'none'; // Hide
            if (detailModalSwapBtn) detailModalSwapBtn.textContent = 'Find Alternatives'; // Change text
            detailModalSwapBtn.onclick = () => {
                closeExerciseDetailModal();
                // Trigger swap using only the ID
                 ForgeAssist.updateContext(null, new Set()); // Clear card context
    }

    // --- Periodization Model Visuals (Badges) ---

    /**
     * Creates or updates the model badge on a day cell.
     * @param {HTMLElement} dayCellElement - The day cell DOM element.
     */
    function updateDayBadge(dayCellElement) {
                 // Directly call the handler if possible (assuming ForgeAssist is accessible)
                 // It might be better to have a dedicated ForgeAssist function that accepts only an ID
                 console.warn('Triggering swap from library context - handler might expect a card element.');
                 const swapAction = ForgeAssist.getContextualActions().find(a => a.id === 'suggest_swap' || a.id === 'find-alternative');
        // console.log(`[updateDayBadge] Updating badge for cell:`, dayCellElement?.dataset.dayId);
                 if(swapAction && typeof swapAction.handler === 'function'){
                    // The handler currently expects currentContext.selectedElement to be the card
                    // This won't work perfectly without refactoring handleSuggestSwap.
                    // For now, we can *try* calling it but it might fail gracefully or require a selected card.
                    // A better approach: ForgeAssist.suggestSwapById(libraryData.id);
                    // Let's just show a toast for now.
        if (!dayCellElement) return;
        const dayId = dayCellElement.dataset.dayId;
        if (!dayId) return;

        const instanceId = PeriodizationModelManager.getModelForDay(dayId);
        // console.log(`[updateDayBadge] Model instanceId for day ${dayId}: ${instanceId}`);
        
        if (instanceId) {
            const model = PeriodizationModelManager.getModelInstance(instanceId);
            // console.log(`[updateDayBadge] Fetched model instance:`, model);
            if (!model) {
                // console.log(`[updateDayBadge] Model instance not found, removing badge.`);
                    showToast(`Alternative suggestions for ${libraryData.name} would appear here. (Needs handler update)`, 'info');
                 } else {
                    showToast('Could not trigger alternative suggestion.', 'warning');
                 }
            };
        }

        // Show Modal
        if (exerciseDetailModal) exerciseDetailModal.classList.add('is-visible');
    }
                removeDayBadgeAndClasses(dayCellElement);
                return;
            }

            // Check if any card within the cell is actually model-driven
            const modelDrivenCard = dayCellElement.querySelector('.workout-card[data-model-driven="true"]');
    // <<< END Central function >>>

    /**
     * Creates a superset container and adds the selected exercise cards to it
     * @param {Array} exerciseCards - Array of workout card DOM elements to group into a superset
     * @returns {HTMLElement} The superset container element 
     */
    function createSuperset(exerciseCards) {
            const hasModelDrivenCard = !!modelDrivenCard;
            // console.log(`[updateDayBadge] Cell has model-driven card: ${hasModelDrivenCard}`, modelDrivenCard);
            
            if (hasModelDrivenCard) {
                let badge = dayCellElement.querySelector('.model-badge');
        if (!exerciseCards || exerciseCards.length < 2) {
            console.error('At least 2 exercise cards are required to create a superset');
            showToast('Select at least 2 exercises to create a superset', 'error');
            return null;
        }
                let createdBadge = false;
                if (!badge) {
                    badge = document.createElement('div');
                    badge.className = 'model-badge';
                    dayCellElement.prepend(badge); 
                    badge.addEventListener('click', handleModelBadgeClick);
                    createdBadge = true;
                }

        // Create the superset container
        const supersetContainer = document.createElement('div');
        supersetContainer.className = 'superset-container';
        supersetContainer.id = `superset-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        
        // Create the header with label and controls
                // console.log(`[updateDayBadge] Badge element ${createdBadge ? 'created' : 'found'}:`, badge);

                const modelType = model.type.toLowerCase();
                const shortType = modelType.substring(0, 3).toUpperCase();
                const icon = getIconForModelType(modelType);
        const supersetHeader = document.createElement('div');
        supersetHeader.className = 'superset-header';
        supersetHeader.innerHTML = `
            <div class="superset-label">Superset</div>
            <div class="superset-controls">
                <button class="superset-edit-btn" title="Edit Superset">✏️</button>
                // console.log(`[updateDayBadge] Model type: ${modelType}, Icon: ${icon}, ShortType: ${shortType}`);
                
                // Update badge content and attributes
                badge.className = `model-badge model-type-${modelType}`; 
                badge.dataset.modelId = instanceId;
                <button class="superset-remove-btn" title="Break Superset">❌</button>
            </div>
        `;
        
        supersetContainer.appendChild(supersetHeader);
        
        // Get the parent element (day cell) of the first card
                badge.innerHTML = `<span class="badge-icon">${icon}</span><span class="badge-text">${shortType}</span>`;
                badge.title = `Model: ${model.type} (${instanceId})\nParams: ${JSON.stringify(model.params)}`;
                badge.style.display = ''; // Ensure badge is visible
        const parentCell = exerciseCards[0].closest('.day-cell');
        if (!parentCell) {
            console.error('Parent day cell not found for exercise cards');
            return null;
        }
        
        // Remove cards from their current location and add to the superset container
                
                // Add classes to the day cell itself for styling
                dayCellElement.classList.add('has-model');
                dayCellElement.classList.add(`model-type-${modelType}`);
 
            } else {
                // console.log(`[updateDayBadge] Model assigned, but no model-driven cards found. Removing badge.`);
        exerciseCards.forEach(card => {
            // If card is already in a superset, remove it from that superset first
            const existingSuperset = card.closest('.superset-container');
            if (existingSuperset) {
                // If this is the only card in the superset, remove the entire superset
                const cardsInExistingSuperset = existingSuperset.querySelectorAll('.workout-card');
                removeDayBadgeAndClasses(dayCellElement);
            }

        } else {
            // console.log(`[updateDayBadge] No model instance assigned to this day. Removing badge.`);
            removeDayBadgeAndClasses(dayCellElement);
        }
    }

    /**
     * Removes the model badge and related classes from a day cell.
                if (cardsInExistingSuperset.length <= 2) {
                    // Move the other card out of the superset before removing it
                    Array.from(cardsInExistingSuperset).forEach(c => {
                        if (c !== card) {
                            existingSuperset.parentNode.insertBefore(c, existingSuperset);
                        }
                    });
                    existingSuperset.remove();
     * @param {HTMLElement} dayCellElement - The day cell DOM element.
     */
    function removeDayBadgeAndClasses(dayCellElement) {
        const badge = dayCellElement?.querySelector('.model-badge');
        if (badge) {
            badge.removeEventListener('click', handleModelBadgeClick);
                } else {
                    // Just remove this card from the existing superset
                    existingSuperset.removeChild(card);
                }
            } else if (card.parentNode) {
                card.parentNode.removeChild(card);
            }
            
            // Add card to new superset container
            badge.remove();
        }
        // Remove classes from the cell itself
        dayCellElement.classList.remove('has-model');
        // Remove any model-type-* class
        const modelTypeClasses = Array.from(dayCellElement.classList).filter(cls => cls.startsWith('model-type-'));
            supersetContainer.appendChild(card);
            
            // Update the card styling for superset
            card.classList.add('in-superset');
        });
        
        // Add event listeners to the superset controls
        supersetContainer.querySelector('.superset-edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
        dayCellElement.classList.remove(...modelTypeClasses);
    }

    /**
     * Click handler for model badges.
     * @param {Event} event 
     */
    function handleModelBadgeClick(event) {
        event.stopPropagation(); // Prevent day cell click
        const badge = event.currentTarget;
            // Open inspector for superset editing
            // This will need to be implemented as part of the inspector functionality
            showToast('Superset editing coming soon!', 'info');
        });
        
        supersetContainer.querySelector('.superset-remove-btn').addEventListener('click', (e) => {
        const instanceId = badge.dataset.modelId;
        const dayCell = badge.closest('.day-cell');
        const dayId = dayCell?.dataset.dayId;

        if (instanceId && dayId && dayCell) {
            e.stopPropagation();
            breakSuperset(supersetContainer);
        });
        
        // Insert the superset container into the day cell
        parentCell.appendChild(supersetContainer);
        
        // Trigger updates
            console.log(`Model badge clicked: Instance ${instanceId}, Day ${dayId}`);
            handleModelContextSelection(instanceId, dayId, dayCell);
        } else {
            console.warn("Could not get modelId, dayId, or dayCell from badge click event.");
        triggerSaveState();
        triggerAnalyticsUpdate(workCanvas);
        
        showToast('Superset created', 'success');
        return supersetContainer;
    }

    /**
     * Breaks a superset, removing the container and returning individual exercise cards to the day cell
     * @param {HTMLElement} supersetContainer - The superset container element to break
        }
    }

    /**
     * Sets the selection context to a specific model on a specific day.
     * @param {string} instanceId - The ID of the selected model instance.
     * @param {string} dayId - The ID of the day cell related to the selection.
     * @param {HTMLElement} dayCellElement - The DOM element of the day cell.
     */
    function handleModelContextSelection(instanceId, dayId, dayCellElement) {
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
        try {
            clearSelectionStyles();
        } catch (error) {
            console.error('[BlockBuilder] Error in clearSelectionStyles (Model Selection):', error);
        }
        handleSelection(dayCellElement, false);
        syncSelectedContext('model', { modelId: instanceId, dayId });
        ForgeAssist.updateContext(dayCellElement, selectedContext.elements);
        const exerciseCards = Array.from(supersetContainer.querySelectorAll('.workout-card'));
        
        // Move cards back to day cell and remove superset container
        exerciseCards.forEach(card => {
            card.classList.remove('in-superset');
            parentCell.appendChild(card);
        });
        
        supersetContainer.remove();
        dayCellElement.classList.add('model-context-selected');
        updateInspectorForSelection();
    }

    /**
     * Helper function to remove all selection-related visual styles.
     */
    function clearSelectionStyles() {
        document.querySelectorAll('.selected, .model-context-selected').forEach(el => {
        
        // Trigger updates
        triggerSaveState();
        triggerAnalyticsUpdate(workCanvas);
        
        showToast('Superset removed', 'success');
    }

    // Add context menu and multi-select toolbar elements
    let contextMenu = null;
            el.classList.remove('selected', 'model-context-selected');
        });
    }

    /**
     * Helper to get an icon for a model type.
     * @param {string} modelType 
     * @returns {string} Emoji icon string
     */
    function getIconForModelType(modelType) {
    let multiSelectToolbar = null;
    
    // Initialize the context menu for workout cards
    function initializeContextMenu() {
        // Create context menu element if it doesn't exist
        if (!contextMenu) {
            contextMenu = document.createElement('div');
            contextMenu.className = 'context-menu';
            contextMenu.style.display = 'none';
            document.body.appendChild(contextMenu);
        switch (modelType.toLowerCase()) {
            case 'linear': return '📈';
            case 'wave': return '🌊';
            case 'triphasic': return '🧱'; // Or maybe ⚡️ ?
            case 'undulating': return '📊';
            default: return '⚙️';
            
            // Close menu on document click
            document.addEventListener('click', (e) => {
                if (!contextMenu.contains(e.target)) {
                    contextMenu.style.display = 'none';
                }
            });
        }
    }
        }
    }

    // --- Phase Ribbon Selection --- 
    phaseRibbon.addEventListener('click', (e) => {
        if (e.target.classList.contains('phase-resize-handle')) {
            return;
        }
        const clickedPhase = e.target.closest('.phase-bar');
        if (clickedPhase) {
    
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
            try {
                clearSelectionStyles();
            } catch (error) {
                console.error('[BlockBuilder] Error in clearSelectionStyles (Phase Click):', error);
            }
            handleSelection(clickedPhase, false);
            syncSelectedContext('phase');
            ForgeAssist.updateContext(clickedPhase, selectedContext.elements);
            menuItem.className = 'context-menu-item';
            menuItem.innerHTML = `<span class="icon">${item.icon}</span> ${item.label}`;
            menuItem.addEventListener('click', () => {
                contextMenu.style.display = 'none';
                item.action();
            });
            contextMenu.appendChild(menuItem);
        });
            updateInspectorForSelection();
            openInspector(clickedPhase);
        }
    });

    // --- Refactored workCanvas Click Listener ---
    workCanvas.addEventListener('click', (e) => {
        if (e.target.closest('.model-badge')) {
            return;
        
        // Position menu
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.style.display = 'block';
        
        // Ensure menu is within viewport
        }
        if (e.target.closest('.card-action-btn')) {
            return;
        }
        const clickedCard = e.target.closest('.workout-card');
        const clickedCell = e.target.closest('.day-cell');
        if (clickedCard) {
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = `${window.innerWidth - rect.width - 5}px`;
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = `${y - rect.height}px`;
        }
    }
    
            handleCardClick(clickedCard, e.shiftKey);
            return;
        }
        if (clickedCell) {
            try {
                clearSelectionStyles();
            } catch (error) {
                console.error('[BlockBuilder] Error in clearSelectionStyles (Cell Click):', error);
    // Initialize multi-select toolbar
    function initializeMultiSelectToolbar() {
        if (!multiSelectToolbar) {
            multiSelectToolbar = document.createElement('div');
            multiSelectToolbar.className = 'multi-select-toolbar';
            multiSelectToolbar.innerHTML = `
                <button class="multi-select-action" id="create-superset-btn">
            }
            handleSelection(clickedCell, e.shiftKey);
            syncSelectedContext('day', { dayId: clickedCell.dataset.dayId });
            ForgeAssist.updateContext(clickedCell, selectedContext.elements);
            updateInspectorForSelection();
            openInspector(clickedCell);
            return;
        }
        if (!e.target.closest('.inspector-panel') && !e.target.closest('.phase-bar')) {
                    <span class="icon">⚡</span> Create Superset
                </button>
                <button class="multi-select-action" id="delete-selected-btn">
                    <span class="icon">🗑️</span> Delete Selected
                </button>
            `;
            document.body.appendChild(multiSelectToolbar);
            
            // Add event listeners
            try {
                clearSelectionStyles();
            } catch (error) {
                console.error('[BlockBuilder] Error in clearSelectionStyles (Background Click):', error);
            }
            handleSelection(null, false);
            syncSelectedContext('none');
            ForgeAssist.updateContext(null, selectedContext.elements);
            document.getElementById('create-superset-btn').addEventListener('click', () => {
                const selectedCards = Array.from(selectedContext.elements);
                if (selectedCards.length >= 2) {
                    createSuperset(selectedCards);
                    // Clear selection after creating superset
                    clearSelectionStyles();
                    selectedContext = { type: 'none', elements: new Set(), modelId: null, dayId: null };
            updateInspectorForSelection();
            closeInspector();
        }
    });

    // --- Inspector Update Logic ---

    // Needs getStructuredDetails, showToast, ForgeAssist // <<< Added ForgeAssist dependency note
    function renderAssistTabContent() {
        const assistTabContent = document.getElementById('assist');
                    updateMultiSelectToolbarVisibility();
                }
            });
            
            document.getElementById('delete-selected-btn').addEventListener('click', () => {
                const selectedCards = Array.from(selectedContext.elements);
                selectedCards.forEach(card => {
        if (!assistTabContent) return;

        // Get actions directly from ForgeAssist
        const actions = ForgeAssist.getContextualActions(); 

        if (!actions || actions.length === 0) {
            assistTabContent.innerHTML = '<p><i>No contextual actions available.</i></p>';
            return;
                    card.remove();
                });
                // Clear selection after deleting
                clearSelectionStyles();
                selectedContext = { type: 'none', elements: new Set(), modelId: null, dayId: null };
                updateMultiSelectToolbarVisibility();
                triggerSaveState();
                triggerAnalyticsUpdate(workCanvas);
                showToast(`Deleted ${selectedCards.length} exercises`, 'success');
        }

        let contentHtml = '<h4>ForgeAssist™ Actions</h4><ul>';
        actions.forEach(action => {
            contentHtml += `<li><button class="assist-action cta-button secondary-cta" 
                                    data-action-id="${action.id}" 
                                    ${action.disabled ? 'disabled' : ''}>
            });
        }
    }
    
    // Update toolbar visibility based on selection
    function updateMultiSelectToolbarVisibility() {
        if (!multiSelectToolbar) {
            initializeMultiSelectToolbar();
        }
        
        if (selectedContext.type === 'exercise' && selectedContext.elements.size >= 2) {
                                ${action.label}
                           </button></li>`;
        });
        contentHtml += '</ul>';
        assistTabContent.innerHTML = contentHtml;

        // Add specific listeners that call the correct handler
        assistTabContent.querySelectorAll('.assist-action').forEach(button => {
            button.addEventListener('click', (e) => {
            multiSelectToolbar.classList.add('active');
        } else {
            multiSelectToolbar.classList.remove('active');
        }
    }
    
    // Enhance the handleCardClick function to support multi-select and context menu
    function handleCardClick(cardElement, isShiftKey) {
        // Original selection handling logic
        handleSelection(cardElement, isShiftKey);
        
                e.stopPropagation(); // Prevent other inspector clicks
                const actionId = e.target.dataset.actionId;
                // Find the original action object
        // Update the selected context
        const { selectedElement, selectedElements } = getSelectionState();
        selectedContext.type = 'exercise';
        selectedContext.elements = new Set(selectedElements);
        
        // Update multi-select toolbar visibility
        updateMultiSelectToolbarVisibility();
        
        // If it's a single card selection, open inspector
                const action = actions.find(a => a.id === actionId);
                
                if (action && action.handler) {
                    if (typeof action.handler === 'function') {
                        console.log(`Executing handler function for action: ${actionId}`);
                        action.handler(); // Execute the function directly
                    } else if (typeof action.handler === 'string') {
        if (selectedContext.elements.size === 1 && !isShiftKey) {
            openInspector(cardElement);
        } else if (selectedContext.elements.size > 1) {
            openMultiSelectInspector();
        }
    }
    
    // Add context menu to workout cards via right-click
    function attachContextMenuToCards() {
        // Use event delegation on workCanvas
                        console.log(`Processing command string for action: ${actionId}`);
                        ForgeAssist.processCommand(action.handler); // Process as command string
                    } else {
                        console.warn(`Unknown handler type for action: ${actionId}`);
                        showToast(`Cannot execute action '${action.label}'.`, 'warning');
                    }
                } else {
                    console.error(`Handler not found for action: ${actionId}`);
        workCanvas.addEventListener('contextmenu', (e) => {
            // Check if right-click happened on a workout card
            const card = e.target.closest('.workout-card');
            if (card) {
                e.preventDefault(); // Prevent default context menu
                
                // Add this card to selection if not already selected
                if (!selectedContext.elements.has(card)) {
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
                    handleCardClick(card, false);
                }
                
                const menuItems = [
                    {
                        icon: '⚡',
                        label: 'Create Superset',
                        action: () => {
                            if (selectedContext.elements.size >= 2) {
                                createSuperset(Array.from(selectedContext.elements));
        if (!recoveryTabContent) return;

        // Default content when no selection
        if (!selectedContext || selectedContext.type === 'none' || selectedContext.elements.size === 0) {
            recoveryTabContent.innerHTML = '<p><i>Select an exercise to see recovery information.</i></p>';
                                clearSelectionStyles();
                                selectedContext = { type: 'none', elements: new Set(), modelId: null, dayId: null };
                                updateMultiSelectToolbarVisibility();
                            } else {
                                showToast('Select at least 2 exercises to create a superset', 'warning');
                            }
                        }
                    },
                    {
            return;
        }

        // Get biomechanical analyzer from ForgeAssist
        const biomechanicalAnalyzer = ForgeAssist.getBiomechanicalAnalyzer?.();
        if (!biomechanicalAnalyzer) {
            recoveryTabContent.innerHTML = '<p><i>Recovery analysis not available.</i></p>';
                        icon: '📋',
                        label: 'Duplicate',
                        action: () => {
                            const clone = card.cloneNode(true);
                            clone.id = `workout-${Date.now()}-${Math.random().toString(16).slice(2)}`;
                            // Add event listeners to the cloned card
                            clone.querySelector('.delete-btn').addEventListener('click', (e) => {
            return;
        }

        // Get current muscle stress levels
        const stressLevels = biomechanicalAnalyzer.getCurrentStressLevels();
        const recoveryLevels = {};
        
        // Convert stress to recovery (1 - stress)
        for (const [muscle, stress] of Object.entries(stressLevels)) {
            recoveryLevels[muscle] = Math.max(0, Math.min(1, 1 - stress));
                                e.stopPropagation();
                                clone.remove();
                                triggerSaveState();
                                triggerAnalyticsUpdate(workCanvas);
                            });
                            
                            clone.querySelector('.edit-btn').addEventListener('click', (e) => {
                                e.stopPropagation();
                                handleSelection(clone, false);
        }

        // Generate content based on selection type
        if (selectedContext.type === 'exercise') {
            const cardElement = selectedContext.elements.size === 1 ? 
                Array.from(selectedContext.elements)[0] : null;
                                openInspector(clone);
                            });
                            
                            clone.addEventListener('click', (e) => {
                                if (e.target.closest('.edit-btn') || e.target.closest('.delete-btn')) return;
                                handleCardClick(clone, e.shiftKey);
            
            if (!cardElement) {
                recoveryTabContent.innerHTML = '<p><i>No exercise selected.</i></p>';
                return;
            }

            // Get exercise ID and find in library
            const exerciseId = cardElement.dataset.exerciseId;
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
            const exerciseName = cardElement.querySelector('.exercise-name')?.textContent || 'Exercise';
            
            if (!exerciseId) {
                recoveryTabContent.innerHTML = '<p><i>Exercise ID not found.</i></p>';
                return;
            }

            // Get recovery recommendation
            const exerciseRecovery = biomechanicalAnalyzer.getExerciseReadiness(exerciseId);
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
                            showToast('Exercise deleted', 'success');
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
                                </div>
                                <button class="swap-to-btn cta-button micro-cta" data-exercise-id="${alt.id}">Use</button>
                            </div>
                        `;
                    });
                    html += '</div>';
                } else {
                    html += `
                        <p>Consider reducing the intensity or volume for this exercise.</p>

    // Show progression options for an exercise card
    function showProgressionModal(exerciseCard) {
        // Create modal if it doesn't exist
        let progressionModal = document.getElementById('progression-modal');
        if (!progressionModal) {
            progressionModal = document.createElement('div');
            progressionModal.id = 'progression-modal';
            progressionModal.className = 'modal-overlay';
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
            
            // Create modal content
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content progression-modal-content';
            
            // Add close button
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close-btn';
            closeBtn.innerHTML = '&times;';
            closeBtn.addEventListener('click', () => {
                progressionModal.classList.remove('is-visible');
                btn.addEventListener('click', e => {
                    const newExerciseId = e.target.dataset.exerciseId;
                    if (newExerciseId) {
                        // Call ForgeAssist to handle the swap
                        ForgeAssist.handleSuggestSwap(newExerciseId);
                    }
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
        
        // Populate modal content
        modalContent.innerHTML = `
            <button class="modal-close-btn">&times;</button>
            <h4>Exercise Progressions</h4>
            <div class="exercise-header">${exerciseName}</div>
            
            <div class="progression-path">
                <div class="progression-title">Choose a Progression Path</div>
                    <p>Select a specific exercise to see detailed recovery recommendations.</p>
                </div>
                
                <hr class="detail-separator">
                
                <h4>Muscle Groups</h4>
                <div class="muscle-recovery-list">
            `;

            // Show general muscle recovery
                <div id="progression-options" class="progression-options">
                    <div class="progression-loading">Loading progression options...</div>
                </div>
            </div>
        `;
        
        // Add event listener to close button
        modalContent.querySelector('.modal-close-btn').addEventListener('click', () => {
            progressionModal.classList.remove('is-visible');
            const majorMuscleGroups = [
                'Quadriceps', 'Hamstrings', 'Glutes', 
                'Chest', 'Back', 'Shoulders', 
                'Biceps', 'Triceps', 'Core'
            ];

            majorMuscleGroups.forEach(muscle => {
                const recoveryPercent = Math.round((recoveryLevels[muscle] || 0.9) * 100);
                const statusClass = recoveryPercent < 50 ? 'fatigued' : 
        });
        
        // Show the modal
        progressionModal.classList.add('is-visible');
        
        // Mock load progression options (would be replaced with actual data)
        setTimeout(() => {
            const progressionOptions = modalContent.querySelector('#progression-options');
            
            // Example progression path based on basic bodyweight progressions
            const mockProgressions = [
                                   recoveryPercent < 80 ? 'recovering' : 'recovered';
                
                recoveryTabContent.innerHTML += `
                    <div class="muscle-recovery-item ${statusClass}">
                        <div class="muscle-name">${muscle}</div>
                        <div class="recovery-bar-container">
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
    function updateInspectorPhaseDetails(phaseElement) {
        const detailsTabContent = document.getElementById('details');
        if (!detailsTabContent || !phaseElement) return;

        const phaseId = phaseElement.id;
        const phaseName = phaseElement.dataset.phaseName || 'Unnamed Phase';
        const startWeek = phaseElement.dataset.startWeek;
        const endWeek = phaseElement.dataset.endWeek;
                    <div class="progression-option-header">
                        <div class="progression-name">${progression.name}</div>
                        <div class="progression-difficulty">${progression.difficulty}</div>
                    </div>
                    <div class="progression-description">${progression.description}</div>
                    <button class="swap-button" data-id="${progression.id}">Swap Exercise</button>
        const goal = phaseElement.dataset.goal || 'Not Set';
        const notes = phaseElement.dataset.notes || '';

        if (inspectorTitle) inspectorTitle.textContent = `Phase: ${phaseName}`;

        detailsTabContent.innerHTML = `
            <h4>${phaseName}</h4>
            <p><small>ID: ${phaseId}</small></p>
            <p><strong>Weeks:</strong> ${startWeek} - ${endWeek}</p>
                </div>
            `).join('');
            
            // Add event listeners to swap buttons
            progressionOptions.querySelectorAll('.swap-button').forEach(button => {
                button.addEventListener('click', (e) => {
                    const progressionId = e.target.dataset.id;
                    const progressionName = mockProgressions.find(p => p.id === progressionId).name;
            <div class="form-group full-width">
                <label for="inspector-phase-name">Phase Name</label>
                <input type="text" id="inspector-phase-name" value="${phaseName}">
            </div>
            <div class="form-group full-width">
                <label for="inspector-phase-goal">Goal</label>
                    
                    // Update the exercise card with the new progression
                    exerciseCard.querySelector('.exercise-name').textContent = `${exerciseName} (${progressionName})`;
                    
                    // Close the modal
                    progressionModal.classList.remove('is-visible');
                    
                    // Show success toast
                    showToast(`Exercise progressed to: ${progressionName}`, 'success');
                    
                <select id="inspector-phase-goal">
                    <option value="" ${goal === 'Not Set' ? 'selected' : ''}>Not Set</option>
                    <option value="hypertrophy" ${goal === 'hypertrophy' ? 'selected' : ''}>Hypertrophy</option>
                    <option value="strength" ${goal === 'strength' ? 'selected' : ''}>Strength</option>
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
                    <option value="power" ${goal === 'power' ? 'selected' : ''}>Power</option>
                    <option value="endurance" ${goal === 'endurance' ? 'selected' : ''}>Endurance</option>
                    <option value="peaking" ${goal === 'peaking' ? 'selected' : ''}>Peaking</option>
                    <option value="maintenance" ${goal === 'maintenance' ? 'selected' : ''}>Maintenance</option>
        contextMenu.innerHTML = '';
        
        // Add menu items
        items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            menuItem.innerHTML = `<span class="icon">${item.icon}</span> ${item.label}`;
            menuItem.addEventListener('click', () => {
                     <option value="other" ${goal === 'other' ? 'selected' : ''}>Other</option>
                 </select>
            </div>
            <div class="form-group full-width">
                 <label for="inspector-phase-notes">Notes</label>
                <textarea id="inspector-phase-notes" rows="3">${notes}</textarea>
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
            </div>
            <hr class="detail-separator">
            <button id="save-phase-details" class="cta-button primary-cta">Save Phase</button>
            <button id="delete-phase" class="cta-button secondary-cta" style="margin-top: 10px; background-color: #555;">Delete Phase</button>
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = `${window.innerWidth - rect.width - 5}px`;
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = `${y - rect.height}px`;
            <button id="split-phase" class="cta-button secondary-cta" style="margin-top: 10px;">Split Phase Here</button>
            `;

         // Add event listeners (needs save/delete/split functions)
         document.getElementById('save-phase-details')?.addEventListener('click', () => {
             console.log('Save Phase clicked'); // Placeholder
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
             // Call actual save function: savePhaseDetails(phaseElement);
             showToast('Save Phase functionality pending.', 'info');
         });
        document.getElementById('delete-phase')?.addEventListener('click', () => {
             console.log('Delete Phase clicked'); // Placeholder
             // Call actual delete function: deletePhase(phaseElement);
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
             showToast('Delete Phase functionality pending.', 'info');
         });
        document.getElementById('split-phase')?.addEventListener('click', () => {
            console.log('Split Phase clicked'); // Placeholder
            // Call actual split function: splitPhase(phaseElement);
             showToast('Split Phase functionality pending.', 'info');
         });
    }

    // Needs activateTab, setTabVisibility, deleteSelectedWorkoutCard (needs import/def)
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
    function openMultiSelectInspector() {
        if (!inspectorPanel.classList.contains('is-visible')) {
            openInspector(); // Open with default view first if closed
        }

        const detailsTab = document.getElementById('details');
        if (!detailsTab) return;
                        label: 'Duplicate',
                        action: () => {
                            const clone = card.cloneNode(true);
                            clone.id = `workout-${Date.now()}-${Math.random().toString(16).slice(2)}`;
                            // Add event listeners to the cloned card

        activateTab('details'); 

        const selectionSize = selectedContext.elements.size;
        if (inspectorTitle) inspectorTitle.textContent = `${selectionSize} Items Selected`;

        detailsTab.innerHTML = `
            <h4>Multiple Items Selected (${selectionSize})</h4>
            <p>Apply bulk actions:</p>
                            clone.querySelector('.delete-btn').addEventListener('click', (e) => {
                                e.stopPropagation();
                                clone.remove();
                                triggerSaveState();
                                triggerAnalyticsUpdate(workCanvas);
                            });
                            
                            clone.querySelector('.edit-btn').addEventListener('click', (e) => {
            <button id="delete-selected-items" class="cta-button secondary-cta" style="background-color: #555;">Delete Selected Cards</button>
            <hr class="detail-separator">
            <p><em>More bulk actions coming soon (e.g., copy, tag).</em></p>
                                e.stopPropagation();
                                handleSelection(clone, false);
                                openInspector(clone);
                            });
                            
                            clone.addEventListener('click', (e) => {
                                if (e.target.closest('.edit-btn') || e.target.closest('.delete-btn')) return;
                                handleCardClick(clone, e.shiftKey);
        `;

        const deleteBtn = detailsTab.querySelector('#delete-selected-items');
        if (deleteBtn) {
            const cardsSelected = Array.from(selectedContext.elements).some(el => el.classList.contains('workout-card'));
            deleteBtn.disabled = !cardsSelected;
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
            if (cardsSelected) {
                deleteBtn.addEventListener('click', () => {
                    // Call delete helper, needs reference
                    if (typeof deleteSelectedWorkoutCard === 'function') {
                        deleteSelectedWorkoutCard(); // Assumes it uses the selection context
        } else {
                        console.warn("deleteSelectedWorkoutCard not available for bulk delete");
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
                    }
        });
            } else {
                deleteBtn.textContent = 'Delete Selected (No Cards)';
            }
        }
        setTabVisibility(['details']); 
    }

    // Needs clearInspectorFocusMessage, getStructuredDetails, updateLoadValueExplanation, 
                            showToast('Exercise deleted', 'success');
                        }
                    }
                ];
                
                showContextMenu(e.pageX, e.pageY, menuItems);
            }
        });
    }

    // --- Event Listeners --- //
    if (hubCreateNewBtn) {
    // saveWorkoutCardDetails, deleteSelectedWorkoutCard, renderAssistTabContent, 
    // updateInspectorPhaseDetails, openMultiSelectInspector, populateInspectorModelView (new)
    function updateInspectorForSelection() {
        // Clear any focus message
        clearInspectorFocusMessage();
        
        // Get the details tab content element
        const detailsTabContent = document.getElementById('details');
        hubCreateNewBtn.addEventListener('click', () => {
            console.log("Create New button clicked");
            const modal = document.getElementById('new-block-options-modal');
            if (modal) {
                modal.classList.add('is-visible');
            }
            // Previously, this might have directly shown the builder view
        
        // Render the ForgeAssist tab content
        renderAssistTabContent();

        // Render the Recovery tab content
        renderRecoveryTabContent();

        // Render the Adaptive tab content with the selected element
        const selectedElement = selectedContext.elements.size === 1 ? 
            Array.from(selectedContext.elements)[0] : null;
            // showView('builder'); 
            // generateCalendarGrid(8); // Default 8 weeks
        });
    }

    if (hubBrowseTemplatesBtn) {
        hubBrowseTemplatesBtn.addEventListener('click', () => {
            console.log("Browse Templates button clicked (hub)");
            // showToast("Template browser not yet implemented.", "info"); // <<< REMOVE THIS LINE
        populateAdaptiveTab(selectedElement);
        
        // No selection, show default view
        if (selectedContext.type === 'none' || selectedContext.elements.size === 0) {
            // Only make changes if the inspector is visible
            if (inspectorPanel.classList.contains('is-visible')) {
                // Hide model-specific tabs, show standard tabs
            const templatesModal = document.getElementById('templates-modal');
            if (templatesModal) {
                templatesModal.classList.add('is-visible');
            } else {
                console.error("Templates modal not found!");
            }
        });
    }
                setTabVisibility(['library', 'details', 'assist', 'recovery', 'adaptive', 'analytics', 'settings']);
                
                // Show block settings in title
                if (inspectorTitle) inspectorTitle.textContent = 'Block Settings';
                
                // Show appropriate content
                activateTab('settings'); 
            }
            return;
        }


    // Listener for the button *within* the new block modal
    if (createBlockFromOptionsBtn) {
        createBlockFromOptionsBtn.addEventListener('click', () => {
             console.log("Create button inside modal clicked.");
             handleCreateBlockFromOptions(); // Call the function to create the block & switch view
        });
        } else {
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
         console.error("Create Block From Options button not found!");
    }

    // Function to load a template into the block builder
    function loadTemplateBlock(template) {
        console.log(`Loading template: ${template.title}`);
        
        // 1. Generate Grid based on template weeks
        generateCalendarGrid(template.weeks || 8);
        
        // 2. Stay in builder view
        showView('builder');
        
        // 3. Set block name based on template
        const blockNameInput = document.getElementById('block-name-input');
        if (blockNameInput) {
            blockNameInput.value = template.title || 'Untitled Block';
        }
        
        // 4. Apply template-specific settings
        // This would be expanded based on template schema
        
        // Return true to indicate success
        return true;
    }

    // Make loadTemplateBlock accessible to other modules
    window.blockBuilder = window.blockBuilder || {};
    window.blockBuilder.loadTemplateBlock = loadTemplateBlock;

    // Signal that the block builder is ready
    window.dispatchEvent(new CustomEvent('blockbuilderReady'));

}); // End DOMContentLoaded 