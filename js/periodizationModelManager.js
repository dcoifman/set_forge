/**
 * Periodization Model Manager
 *
 * Responsibilities:
 * - Tracking active periodization model instances within a block.
 * - Storing and retrieving parameters for each model instance.
 * - Applying models to day cells.
 * - Detaching models from day cells.
 * - Providing data about models for UI display and calculations.
 */
class PeriodizationModelManager {
    constructor() {
        // Stores details of each model instance applied to the block.
        // Key: instanceId (e.g., "linear_1678886400000_abc12")
        // Value: { type: string, params: object, scope: { targetWeeks: number[], targetDaysOfWeek: string[] } }
        this.modelInstances = {};

        // Maps day cell IDs to the model instance governing them.
        // Key: dayId (e.g., "wk1-mon")
        // Value: instanceId
        this.dayModelMapping = {};

        // Dependencies injected via init()
        this.dependencies = {
            workCanvas: null,
            showToast: null,
            triggerAnalyticsUpdate: null,
            getPeriodizationEngine: null,
        };
    }

    /**
     * Initializes the manager with necessary dependencies.
     * @param {object} deps - Dependencies required by the manager.
     * @param {HTMLElement} deps.workCanvas - The main canvas element.
     * @param {function} deps.showToast - Function to display notifications.
     * @param {function} deps.triggerAnalyticsUpdate - Function to trigger analytics.
     * @param {function} deps.getPeriodizationEngine - Function to access the periodization engine.
     */
    init(deps) {
        console.log("Initializing PeriodizationModelManager...");
        this.dependencies = { ...this.dependencies, ...deps };
        // Basic validation
        if (!this.dependencies.workCanvas || typeof this.dependencies.getPeriodizationEngine !== 'function') {
            console.error("PeriodizationModelManager init failed: Missing critical dependencies.");
            this.dependencies.workCanvas?.dispatchEvent(new CustomEvent('forge-assist:error', { detail: { message: 'Periodization Manager failed to initialize.' } }));
        }
        console.log("PeriodizationModelManager Initialized with deps:", Object.keys(this.dependencies).filter(k => this.dependencies[k]));
    }

    /**
     * Returns the current state of the manager for saving.
     * @returns {object} The state object { modelInstances, dayModelMapping }.
     */
    getState() {
        return {
            modelInstances: JSON.parse(JSON.stringify(this.modelInstances)), // Deep copy
            dayModelMapping: { ...this.dayModelMapping }, // Shallow copy is fine
        };
    }

    /**
     * Loads state into the manager.
     * @param {object} state - The state object to load.
     * @param {object} [state.modelInstances] - Saved model instances.
     * @param {object} [state.dayModelMapping] - Saved day-to-model mapping.
     */
    loadState(state) {
        console.log("PeriodizationModelManager loading state:", state);
        this.modelInstances = state?.modelInstances ? JSON.parse(JSON.stringify(state.modelInstances)) : {};
        this.dayModelMapping = state?.dayModelMapping ? { ...state.dayModelMapping } : {};
        console.log("PeriodizationModelManager state loaded:", this.modelInstances, this.dayModelMapping);
        // Note: DOM attribute updates need to happen in blockbuilder.js AFTER
        // the grid is rebuilt and this state is loaded.
    }

    /**
     * Generates a unique ID for a model instance.
     * @param {string} modelType - The type of the model (e.g., "linear").
     * @returns {string} A unique instance ID.
     */
    _generateInstanceId(modelType) {
        const timestamp = Date.now();
        const randomPart = Math.random().toString(36).substring(2, 7); // 5 random chars
        return `${modelType}_${timestamp}_${randomPart}`;
    }

     /**
     * Generates a standard day ID string.
     * @param {number} weekIndex - The 0-based week index.
     * @param {string} dayAbbreviation - The 3-letter day abbreviation (e.g., "mon").
     * @returns {string} The day ID (e.g., "wk1-mon").
     */
    generateDayId(weekIndex, dayAbbreviation) {
        if (typeof weekIndex !== 'number' || weekIndex < 0 || typeof dayAbbreviation !== 'string' || dayAbbreviation.length !== 3) {
            console.warn(`Invalid input for generateDayId: week ${weekIndex}, day ${dayAbbreviation}`);
            return null;
        }
        return `wk${weekIndex + 1}-${dayAbbreviation.toLowerCase()}`;
    }

    /**
     * Updates the necessary data attributes on a day cell element based on model mapping.
     * Should be called after loading state or applying/detaching models.
     * @param {HTMLElement} dayCellElement - The day cell DOM element.
     * @param {string|null} instanceId - The ID of the model applied, or null if none.
     */
    updateDayCellDOMAttributes(dayCellElement, instanceId) {
        if (!dayCellElement || !(dayCellElement instanceof HTMLElement)) return;

        if (instanceId && this.modelInstances[instanceId]) {
            const model = this.modelInstances[instanceId];
            dayCellElement.dataset.periodizationModelId = instanceId;
            dayCellElement.dataset.periodizationModelType = model.type;
            try {
                // Store all params for now, per plan. Consider deriving day-specific params later.
                dayCellElement.dataset.periodizationParams = JSON.stringify(model.params);
            } catch (error) {
                console.error(`Error stringifying params for model ${instanceId}:`, model.params, error);
                dayCellElement.removeAttribute('data-periodization-params');
            }
            // TODO: Update badge visuals (Phase 3)
        } else {
            dayCellElement.removeAttribute('data-periodization-model-id');
            dayCellElement.removeAttribute('data-periodization-model-type');
            dayCellElement.removeAttribute('data-periodization-params');
            // TODO: Remove badge visuals (Phase 3)
        }
    }

    /**
     * Removes model-related data attributes from a day cell element.
     * @param {HTMLElement} dayCellElement - The day cell DOM element.
     */
    removeDayCellDOMAttributes(dayCellElement) {
       this.updateDayCellDOMAttributes(dayCellElement, null);
    }

    /**
     * Creates a new periodization model instance, stores it, and applies it to target days.
     * @param {string} modelType - The type of the model (e.g., "linear").
     * @param {object} baseParams - Base parameters provided by the user (merged with defaults).
     * @param {string[]} targetDayIds - Array of day IDs (e.g., ["wk1-mon", "wk1-wed", ...]).
     * @param {Array<object>} [exerciseLibrary=[]] - The current exercise library data.
     * @returns {string|null} The generated instance ID, or null on failure.
     */
    createAndApplyModel(modelType, baseParams = {}, targetDayIds = [], exerciseLibrary = []) {
        const engine = this.dependencies.getPeriodizationEngine();
        if (!engine || typeof engine.getModelDefaults !== 'function') {
            console.error("[PeriodizationModelManager] Periodization Engine not available or lacks getModelDefaults.");
            this.dependencies.showToast?.('Error: Cannot get model defaults from engine.', 'error');
            return null;
        }

        const modelDefaults = engine.getModelDefaults(modelType);
        if (!modelDefaults) {
            console.error(`[PeriodizationModelManager] Unknown model type or no defaults returned: ${modelType}`);
            this.dependencies.showToast?.(`Error: Unknown periodization model type "${modelType}".`, 'error');
            return null;
        }

        const instanceId = this._generateInstanceId(modelType);
        const mergedParams = { ...modelDefaults, ...baseParams }; // User params override defaults

        // Basic scope definition from target days (can be refined later)
        const scope = this._calculateScopeFromDayIds(targetDayIds);

        this.modelInstances[instanceId] = {
            type: modelType,
            params: mergedParams,
            scope: scope,
            library: exerciseLibrary
        };

        console.log(`[PeriodizationModelManager] Created model instance ${instanceId}:`, this.modelInstances[instanceId]);

        // Apply to target days and update DOM
        targetDayIds.forEach(dayId => {
            this.dayModelMapping[dayId] = instanceId;
            const dayCell = this.dependencies.workCanvas?.querySelector(`[data-day-id="${dayId}"]`);
            if (dayCell) {
                this.updateDayCellDOMAttributes(dayCell, instanceId);
            } else {
                console.warn(`[PeriodizationModelManager] Could not find day cell element for ${dayId} during model application.`);
            }
        });

        this.dependencies.triggerAnalyticsUpdate?.(); // Trigger analytics as model application might affect load
        // Consider dispatching a custom event: model-applied

        return instanceId;
    }

    /**
     * Helper to determine the week/day scope from a list of day IDs.
     * @param {string[]} dayIds - Array of day IDs.
     * @returns {object} Scope object { targetWeeks: number[], targetDaysOfWeek: string[] }.
     */
    _calculateScopeFromDayIds(dayIds) {
        const targetWeeks = new Set();
        const targetDaysOfWeek = new Set();
        dayIds.forEach(id => {
            const match = id.match(/wk(\d+)-(\w+)/);
            if (match) {
                targetWeeks.add(parseInt(match[1], 10));
                targetDaysOfWeek.add(match[2]);
            }
        });
        return {
            targetWeeks: Array.from(targetWeeks).sort((a, b) => a - b),
            targetDaysOfWeek: Array.from(targetDaysOfWeek) // Order might not matter here
        };
    }

    detachModelFromDay(dayId) {
        // Phase 9: Implement detachment logic and event dispatch
        console.log(`[PeriodizationModelManager] Attempting to detach model from day: ${dayId}`);
        const instanceId = this.dayModelMapping[dayId];
        if (instanceId) {
            delete this.dayModelMapping[dayId];
            // Find the day cell element and update its attributes
            const dayCell = this.dependencies.workCanvas?.querySelector(`[data-day-id="${dayId}"]`);
            if (dayCell) {
                this.removeDayCellDOMAttributes(dayCell);
            } else {
                console.warn(`[PeriodizationModelManager] Day cell ${dayId} not found in DOM during detach.`);
            }
            
            // Dispatch custom event for blockbuilder.js to react
            if (this.dependencies.workCanvas) {
                this.dependencies.workCanvas.dispatchEvent(new CustomEvent('forge-assist:model-detached', {
                    detail: { dayId: dayId, instanceId: instanceId },
                    bubbles: true // Allow event to bubble up if needed
                }));
                console.log(`[PeriodizationModelManager] Dispatched forge-assist:model-detached for day ${dayId}`);
            } else {
                 console.error("[PeriodizationModelManager] workCanvas dependency missing, cannot dispatch event.");
            }
            
            // Trigger analytics/save potentially? Or let the listener handle it?
            // this.dependencies.triggerAnalyticsUpdate?.(); 
            // For now, let blockbuilder handle save/analytics after UI updates.

            return true;
        }
        console.log(`[PeriodizationModelManager] No model found assigned to day ${dayId}.`);
        return false;
    }

    updateModelParams(instanceId, newParams, scope = 'all') {
        // TODO: Phase 7 - Implement parameter updates with scope handling
        console.warn("updateModelParams not implemented yet.");
    }

    getModelInstance(instanceId) {
        return this.modelInstances[instanceId] || null;
    }

    getModelForDay(dayId) {
        // Just return the instance ID string from the mapping
        return this.dayModelMapping[dayId] || null;
    }

}

// Export the class (or create an instance if using as a singleton immediately)
const periodizationModelManager = new PeriodizationModelManager();
export default periodizationModelManager;
// If not using modules, assign to a global variable:
// window.periodizationModelManager = new PeriodizationModelManager(); 