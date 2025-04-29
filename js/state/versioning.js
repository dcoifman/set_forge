// Import necessary functions from storage module and potentially others later
import {
    SAVE_KEY,
    SETTINGS_SAVE_KEY,
    loadStateDataFromLocalStorage,
    loadSettingsDataFromLocalStorage
} from './storage.js';
// We will need to import these later from their new locations:
// import { getBlockState } from './state.js'; // Placeholder
// import { showToast } from '../ui/toast.js'; // Placeholder
// import { addBlockToRecents, populateRecentBlocks } from '../ui/hub.js'; // Placeholder
// import { updateCalendarPhaseIndicators } from '../calendar/ui.js'; // Placeholder

// Constants
export const VERSIONS_KEY = 'setforgeBlockVersions_v1'; // Key for versions
export const RECENT_BLOCKS_KEY = 'setforgeRecentBlocks_v1'; // Key for recents list

// State variable (Needs proper management, perhaps passed in or via a state manager)
let currentLoadedVersionTimestamp = null;

// DOM elements (Ideally inject these or use selectors within functions)
// Removed direct DOM grabs - pass necessary elements as arguments
// const versionsModal = document.getElementById('versions-modal');
// const versionsListDiv = document.getElementById('versions-list');

// --- Recents Logic (Moved from blockbuilder) ---

/**
 * Adds a block reference to the list of recently saved/committed blocks.
 * @param {string} timestamp - ISO timestamp string of the version.
 * @param {string} message - Commit message or block name.
 */
function addBlockToRecents(timestamp, message) { // Not exported, used internally by commitVersion
    let recents = JSON.parse(localStorage.getItem(RECENT_BLOCKS_KEY) || '[]');
    // Remove existing entry if it exists
    recents = recents.filter(r => r.timestamp !== timestamp);
    // Add new entry to the front
    recents.unshift({ timestamp, message });
    // Keep only the last 5
    if (recents.length > 5) {
        recents = recents.slice(0, 5);
    }
    localStorage.setItem(RECENT_BLOCKS_KEY, JSON.stringify(recents));
}

/**
 * Populates the recent blocks list in the UI.
 * @param {HTMLElement} recentBlocksListElement - The DOM element to populate.
 */
export function populateRecentBlocks(recentBlocksListElement) {
    if (!recentBlocksListElement) {
        console.warn("Recent blocks list element not provided.");
        return;
    }
    const recents = JSON.parse(localStorage.getItem(RECENT_BLOCKS_KEY) || '[]');
    const allVersions = JSON.parse(localStorage.getItem(VERSIONS_KEY) || '[]');

    if (recents.length === 0) {
         recentBlocksListElement.innerHTML = '<p>Commit a version of a block, and it will appear here.</p>';
         return;
    }

    recentBlocksListElement.innerHTML = ''; // Clear
    recents.forEach(recent => {
        const versionData = allVersions.find(v => v.timestamp === recent.timestamp);
        if (!versionData) return; // Skip if version data is missing

        const card = document.createElement('div');
        card.className = 'recent-block-card';
        card.dataset.timestamp = recent.timestamp;

        const date = new Date(recent.timestamp);
        const formattedDate = date.toLocaleDateString(); // Shorter date

        // Create phase bar preview
        let phasePreviewHtml = '';
        if (versionData.state && versionData.state.phases) {
            versionData.state.phases.forEach(phase => {
                let bgColor = '#555'; // Default
                if (phase.phaseName === 'accum') bgColor = '#3a7bd5';
                else if (phase.phaseName === 'intens') bgColor = '#ff703b';
                else if (phase.phaseName === 'peak') bgColor = '#cc2b5e';
                else if (phase.phaseName === 'taper') bgColor = '#4ca1af';
                else if (phase.phaseName === 'deload') bgColor = '#5f6c81';
                phasePreviewHtml += `<div class="recent-block-phase-segment" style="width: ${phase.width}; background-color: ${bgColor};">&nbsp;</div>`;
            });
        }

        card.innerHTML = `
            <div class="recent-block-info">
                <span class="block-name">${versionData.settings?.blockName || versionData.message || 'Untitled Block'}</span>
                <span class="block-date">Saved: ${formattedDate}</span>
            </div>
            <div class="recent-block-phases">
                ${phasePreviewHtml}
            </div>
        `;

        // Add event listener to load this block
        card.addEventListener('click', () => {
             console.log("Loading recent block:", recent.timestamp);
             // Load the specific version associated with this recent entry
             if (confirm('Load this block version? Unsaved changes will be lost.')) {
                 loadVersion(recent.timestamp, false); // Use function within this module
                 // Need a way to switch view - maybe dispatch event or use callback?
                 // showView('builder'); // This needs to be handled by blockbuilder
                 document.dispatchEvent(new CustomEvent('forge-view:change', { detail: { view: 'builder' } })); // Event-based approach
                 currentLoadedVersionTimestamp = recent.timestamp; // Update state variable
             }
        });

        recentBlocksListElement.appendChild(card);
    });
}

// --- Versioning Logic ---

export function commitVersion() {
    const blockName = document.getElementById('block-name')?.value || ''; // DOM dependency
    const defaultMessage = blockName ? `Changes to ${blockName}` : "Committed changes";
    const commitMessage = prompt("Enter a short message for this version:", defaultMessage);
    if (!commitMessage) return; // User cancelled

    const currentState = getBlockState(); // Dependency: getBlockState
    const currentSettings = JSON.parse(localStorage.getItem(SETTINGS_SAVE_KEY) || '{}');
    const timestamp = new Date().toISOString();

    const versionData = {
        timestamp,
        message: commitMessage,
        state: currentState,
        settings: currentSettings
    };

    const allVersions = JSON.parse(localStorage.getItem(VERSIONS_KEY) || '[]');
    allVersions.unshift(versionData); // Add new version to the beginning

    localStorage.setItem(VERSIONS_KEY, JSON.stringify(allVersions));
    showToast(`Version committed: ${commitMessage}`, 'info'); // Dependency: showToast
    const recentBlocksListElement = document.getElementById('recent-blocks-list'); // Query here or pass in
    addBlockToRecents(timestamp, commitMessage); // Call local function
    populateRecentBlocks(recentBlocksListElement); // Call local function with element
    // Update versions modal if open
    populateVersionsList(); // Dependency: populateVersionsList (within this module)
}

// Function to load a specific version
export function loadVersion(timestampToLoad, confirmLoad = true) { // Added confirmation flag
    if (confirmLoad && !confirm('Loading this version will overwrite your current unsaved changes. Continue?')) return;

    const allVersions = JSON.parse(localStorage.getItem(VERSIONS_KEY) || '[]');
    const versionToLoad = allVersions.find(v => v.timestamp === timestampToLoad);

    if (versionToLoad) {
        console.log('Loading version:', versionToLoad.timestamp);
        // Overwrite current state and settings in localStorage
        localStorage.setItem(SAVE_KEY, JSON.stringify(versionToLoad.state));
        localStorage.setItem(SETTINGS_SAVE_KEY, JSON.stringify(versionToLoad.settings));
        
        // Reload the page or call load functions directly
        // **IMPORTANT**: The actual application of the loaded state/settings to the DOM 
        // needs to happen here or be triggered from here. 
        // Calling loadStateDataFromLocalStorage just gets the data, it doesn't apply it.
        // This likely requires importing and calling functions currently in blockbuilder.js
        // or dispatching an event that blockbuilder listens for.
        
        // Placeholder calls - These might need to change depending on where the applying logic lives
        // const loadedState = loadStateDataFromLocalStorage(); // Get data (Corrected name)
        // applyStateToDOM(loadedState); // Need function to apply state
        // const loadedSettings = loadSettingsDataFromLocalStorage(); // Get data (Corrected name)
        // applySettingsToDOM(loadedSettings); // Need function to apply settings
        
        // **Simplest immediate approach: Reload the page** 
        // This forces blockbuilder.js to re-run its initial load sequence
        window.location.reload(); 
        
        // --- Code below might not execute if page reloads ---
        // closeVersionsModal(); // Dependency: closeVersionsModal (within this module)
        // showToast(`Version restored: ${versionToLoad.message}`, 'info'); // Dependency: showToast
        // currentLoadedVersionTimestamp = timestampToLoad; // Update state variable
        // populateVersionsList(); // Refresh list to show current marker - Added this call
    } else {
        showToast('Error: Could not find the selected version.', 'error'); // Dependency: showToast
    }
}

// Function to delete a version
export function deleteVersion(timestampToDelete) {
     if (!confirm('Are you sure you want to delete this version permanently?')) return;

     let allVersions = JSON.parse(localStorage.getItem(VERSIONS_KEY) || '[]');
     allVersions = allVersions.filter(v => v.timestamp !== timestampToDelete);
     localStorage.setItem(VERSIONS_KEY, JSON.stringify(allVersions));
     showToast('Version deleted.', 'info'); // Dependency: showToast
     populateVersionsList(); // Refresh the list (within this module)
}


// --- Versions Modal Logic ---

export function populateVersionsList() {
    const versionsListDiv = document.getElementById('versions-list'); // Query here or pass in
    if (!versionsListDiv) return; // Uses DOM element reference
    const allVersions = JSON.parse(localStorage.getItem(VERSIONS_KEY) || '[]');

    if (allVersions.length === 0) {
        versionsListDiv.innerHTML = '<p>No versions committed yet.</p>';
        return;
    }

    versionsListDiv.innerHTML = ''; // Clear list
    allVersions.forEach(version => {
        const item = document.createElement('div');
        item.className = 'version-item';
        // Add a class if this is the currently loaded version
        if (version.timestamp === currentLoadedVersionTimestamp) { // Uses state variable
            item.classList.add('currently-loaded');
        }

        const date = new Date(version.timestamp);
        const formattedDate = date.toLocaleString();

        item.innerHTML = `
            <div class="version-info">
                <span class="version-timestamp">${formattedDate}</span>
                <span class="version-message">${version.message || 'No message'}</span>
            </div>
            <div class="version-actions">
                <button class="restore-btn" data-timestamp="${version.timestamp}">Restore</button>
                <button class="delete-btn" data-timestamp="${version.timestamp}">Delete</button>
            </div>
        `;
        // Add tooltip to indicate loaded status
        if (item.classList.contains('currently-loaded')) {
            item.title = 'This version is currently loaded on the canvas';
        }

        versionsListDiv.appendChild(item);
    });

    // Add event listeners to new buttons - These call functions within this module
    versionsListDiv.querySelectorAll('.restore-btn').forEach(btn => {
        btn.addEventListener('click', () => loadVersion(btn.dataset.timestamp));
    });
    versionsListDiv.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteVersion(btn.dataset.timestamp));
    });
}

export function openVersionsModal() {
    const versionsModal = document.getElementById('versions-modal'); // Query here or pass in
    populateVersionsList(); 
    if(versionsModal) versionsModal.classList.add('is-visible');
}

export function closeVersionsModal() {
    const versionsModal = document.getElementById('versions-modal'); // Query here or pass in
    if(versionsModal) versionsModal.classList.remove('is-visible');
}

// Event listeners originally attached in blockbuilder.js need to be handled separately,
// likely importing these functions and attaching listeners in the main setup.
// Example:
// const commitBtn = document.getElementById('commit-block-btn');
// if (commitBtn) commitBtn.addEventListener('click', commitVersion);
// const versionsBtn = document.getElementById('versions-btn');
// if (versionsBtn) versionsBtn.addEventListener('click', openVersionsModal);
// const versionsCloseBtn = document.getElementById('versions-close-btn');
// if (versionsCloseBtn) versionsCloseBtn.addEventListener('click', closeVersionsModal);
// if (versionsModal) {
//     versionsModal.addEventListener('click', (e) => {
//         if (e.target === versionsModal) closeVersionsModal();
//     });
// }

// Dependencies:
// - localStorage global
// - prompt/confirm globals
// - Date global
// - document.getElementById, document.querySelectorAll
// - Functions needing import:
//   - getBlockState
//   - showToast
//   - addBlockToRecents
//   - populateRecentBlocks
//   - updateCalendarPhaseIndicators
//   - loadStateDataFromLocalStorage (imported)
//   - loadSettingsDataFromLocalStorage (imported)
// - State variable `currentLoadedVersionTimestamp` needs proper management.
// - DOM element references (`versionsModal`, `versionsListDiv`) need injection or querying.
// - Event Listeners need re-attachment in the main script.
