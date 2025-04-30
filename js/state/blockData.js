// Simulated Past Load Data (for ACWR/Monotony)
// Generate 28 days of plausible historical load data
// This should probably be managed more robustly, e.g., loaded from user history
export const simulatedPastLoad = Array.from({ length: 28 }, 
    () => Math.random() < 0.2 ? 0 : Math.round(Math.random() * 500 + 200) // ~20% rest days
);
console.log("Simulated Past 28 days load (from blockData.js):", simulatedPastLoad);

// Import the PeriodizationModelManager to get its state
import PeriodizationModelManager from '../periodizationModelManager.js';

// --- Helper: Get Current Block Loads from DOM ---
// Needs the workCanvas element passed in
export function getCurrentBlockLoads(workCanvas) {
    if (!workCanvas) {
        console.warn("Work canvas not provided to getCurrentBlockLoads.");
        return [];
    }
    const loads = [];
    // Use a safer way to determine total weeks - find max week number?
    const allCells = workCanvas.querySelectorAll('.day-cell[data-week]');
    let totalWeeks = 0;
    allCells.forEach(cell => {
        const weekNum = parseInt(cell.dataset.week, 10);
        if (!isNaN(weekNum) && weekNum > totalWeeks) {
            totalWeeks = weekNum;
        }
    });
    // const totalWeeks = workCanvas.querySelectorAll('.week-label').length;
    
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

// --- Helper: Get Full Block State from DOM ---
// Reads phase ribbon, all workout cards in slots, and periodization model state
export function getBlockState() {
    const state = {
        phases: [],
        slots: {},
        periodizationModels: null // Add placeholder for model data
    };
    // Save Phase Widths
    document.querySelectorAll('.phase-ribbon .phase-bar').forEach(phase => {
        state.phases.push({ 
            phase: phase.dataset.phase,
            width: phase.style.width 
        });
    });

    // Save Card Data
    document.querySelectorAll('.session-slot').forEach(slot => {
        // Use closest '.week-row-container' or similar if .week-column is gone
        const weekContainer = slot.closest('[data-week]'); // More robust selector
        const week = weekContainer?.dataset.week;
        const day = slot.dataset.day;

        if (!week || !day) {
            console.warn("Skipping slot without week/day data:", slot);
            return; // Skip if week or day is missing
        }

        const slotKey = `w${week}d${day}`; // Consistent key format
        const cards = [];
        slot.querySelectorAll('.workout-card').forEach(card => {
            cards.push({
                id: card.id, // Keep ID for potential future use
                name: card.querySelector('.exercise-name')?.textContent || 'Unknown',
                sets: card.dataset.sets || '',
                reps: card.dataset.reps || '',
                loadType: card.dataset.loadType || '',
                loadValue: card.dataset.loadValue || '',
                rest: card.dataset.rest || '',
                notes: card.dataset.notes || '',
                load: card.dataset.load || '0',
                // Add model-related data
                modelDriven: card.dataset.modelDriven === 'true', // Convert to boolean
                sourceModelId: card.dataset.sourceModelId || null
            });
        });
        if (cards.length > 0) {
            state.slots[slotKey] = cards;
        }
    });

    // Get Periodization Model State
    try {
        state.periodizationModels = window.periodizationManager ? window.periodizationManager.getState() : null;
    } catch (error) {
        console.error("Error getting periodization model state:", error);
        state.periodizationModels = { modelInstances: {}, dayModelMapping: {} }; // Default empty state on error
    }

    return state;
}

// --- Helper: Get Settings State from DOM ---
// Reads relevant input values from the settings tab
export function getSettingsState() {
    const settings = {};
    const settingsContainer = document.getElementById('settings');
    if (!settingsContainer) {
        console.warn("Settings container not found.");
        return {}; // Return empty object if container isn't there
    }

    // Example: Get block name
    const blockNameInput = settingsContainer.querySelector('#block-name');
    if (blockNameInput) settings.blockName = blockNameInput.value;

    // Example: Get RPE drift values
    const prevPlannedRpeInput = settingsContainer.querySelector('#prev-planned-rpe');
    if (prevPlannedRpeInput) settings.prevPlannedRpe = prevPlannedRpeInput.value;
    const prevActualRpeInput = settingsContainer.querySelector('#prev-actual-rpe');
    if (prevActualRpeInput) settings.prevActualRpe = prevActualRpeInput.value;

    // Add other settings inputs as needed...
    // e.g., const scenarioSelect = settingsContainer.querySelector('#scenario-select');
    // if (scenarioSelect) settings.activeScenario = scenarioSelect.value;

    console.log("Collected settings:", settings);
    return settings;
}

// Dependencies:
// - DOM Access (querySelectorAll, dataset, querySelector, closest, getElementById)
// - Browser Globals (parseInt, isNaN, Math, Array.from, console) 