// js/state/storage.js

// Import necessary functions (getBlockState might be needed from blockData?)
// Assuming getBlockState and getSettingsState are available elsewhere or passed in
import { getBlockState, getSettingsState } from './blockData.js'; // Placeholder import - adjust if needed

// --- Constants ---
export const SAVE_KEY = 'setforgeSessionState_v1';
export const SETTINGS_SAVE_KEY = 'setforgeSettings_v1';
export const TEMPLATES_KEY = 'setforgeTemplates_v1';

// --- State Loading ---

/**
 * Loads the main block state from localStorage.
 * NOTE: This only loads the data. Applying it to the DOM is handled elsewhere.
 * @returns {object | null} The parsed state object or null.
 */
export function loadStateDataFromLocalStorage() {
    const savedState = localStorage.getItem(SAVE_KEY);
    if (savedState) {
        try {
            return JSON.parse(savedState);
        } catch (e) {
            console.error("Error parsing saved state:", e);
            localStorage.removeItem(SAVE_KEY); // Clear corrupted data
            return null;
        }
    }
    return null;
}

/**
 * Loads the settings state from localStorage.
 * NOTE: This only loads the data. Applying it is handled elsewhere.
 * @returns {object | null} The parsed settings object or null.
 */
export function loadSettingsDataFromLocalStorage() {
    const savedSettings = localStorage.getItem(SETTINGS_SAVE_KEY);
    if (savedSettings) {
        try {
            return JSON.parse(savedSettings);
        } catch (e) {
            console.error("Error parsing saved settings:", e);
            localStorage.removeItem(SETTINGS_SAVE_KEY); // Clear corrupted data
            return null;
        }
    }
    return null;
}


// --- State Saving ---
let saveTimeout;

/**
 * Saves the current block state (phases, cards in slots) to localStorage.
 * Requires a function `getBlockState` to be available (e.g., passed via dependency injection or imported).
 */
export function saveStateToLocalStorage() {
    try {
        // We need access to the function that gathers the current state
        // This needs to be properly injected or imported, assuming getBlockState exists
        const state = getBlockState(); 
        if (state) {
            localStorage.setItem(SAVE_KEY, JSON.stringify(state));
            console.log("Session state autosaved.");
        } else {
            console.warn("Could not save state: getBlockState returned null or undefined.");
        }
    } catch (error) {
        console.error("Error saving state to localStorage:", error);
    }
}

/**
 * Saves the current settings (block name, etc.) to localStorage.
 * Requires a function `getSettingsState` to be available.
 */
export function saveSettingsToLocalStorage() {
     try {
        // Assuming getSettingsState exists and collects relevant settings data
        const settings = getSettingsState(); 
        if (settings) {
             localStorage.setItem(SETTINGS_SAVE_KEY, JSON.stringify(settings));
             console.log("Settings saved.");
        } else {
             console.warn("Could not save settings: getSettingsState returned null or undefined.");
        }
    } catch (error) {
        console.error("Error saving settings to localStorage:", error);
    }
}


/**
 * Triggers a debounced save of the current block state.
 * @param {number} delay - Debounce delay in milliseconds (default: 1000).
 */
export function triggerSaveState(delay = 1000) {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveStateToLocalStorage();
    }, delay);
}

// Initial load functions (might be called by blockbuilder)
// It might be cleaner to have blockbuilder call the load functions directly
// export function initialLoadState() { return loadStateDataFromLocalStorage(); }
// export function initialLoadSettings() { return loadSettingsDataFromLocalStorage(); }

// --- Template Saving ---
/**
 * Saves the current block state and settings as a named template.
 */
export function saveAsTemplate() {
    const templateName = prompt("Enter a name for this template:");
    if (!templateName || templateName.trim() === "") {
        // Maybe show a toast here? Requires importing showToast
        console.log("Template save cancelled.");
        return;
    }

    try {
        const state = getBlockState();
        const settings = getSettingsState();

        if (!state || !settings) {
            console.error("Could not get state or settings to save template.");
            // showToast("Error getting current block data.", "error");
            return;
        }

        let templates = JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]');

        // Check if template name already exists
        const existingIndex = templates.findIndex(t => t.name.toLowerCase() === templateName.trim().toLowerCase());
        if (existingIndex > -1) {
            if (!confirm(`A template named "${templateName}" already exists. Overwrite it?`)) {
                return;
            }
            // Remove existing before adding new
            templates.splice(existingIndex, 1);
        }

        const templateData = {
            name: templateName.trim(),
            timestamp: new Date().toISOString(),
            state: state,
            settings: settings
        };

        templates.push(templateData);
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
        // showToast(`Template "${templateName}" saved.`, "info");
        console.log(`Template "${templateName}" saved.`);

    } catch (error) {
        console.error("Error saving template:", error);
        // showToast("Failed to save template.", "error");
    }
}
