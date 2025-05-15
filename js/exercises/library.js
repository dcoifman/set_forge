// Import dependencies (placeholders)
// import { showToast } from '../ui/toast.js';
// import { parseCsvString } from '../utils/parser.js'; // Helper for form submit

// --- State ---
export let exerciseLibraryData = []; // Holds merged default + user exercises
export let exerciseFavorites = new Set();
export let exerciseFrequency = {};

// --- Constants ---
const USER_EXERCISES_KEY = 'setforgeUserExercises_v1';
const EXERCISE_FAVORITES_KEY = 'setforgeExerciseFavorites_v1';
const EXERCISE_FREQUENCY_KEY = 'setforgeExerciseFrequency_v1';
const VIEW_MODE_KEY = 'setforgeLibraryViewMode_v1'; // Key for storing view mode

// --- DOM References (Needs injection or querying) ---
let exerciseListElement = null;
let inspectorSearchElement = null;
let categoryFilterElement = null;
let equipmentFilterElement = null;
let sortElement = null;
let favoritesToggleElement = null;
let exerciseListContainerElement = null; // For view mode
let exerciseModalElement = null;
let exerciseModalCloseBtnElement = null;
let exerciseModalFormElement = null;
let exerciseModalTitleElement = null;
// Add refs for form fields inside the modal
let exerciseModalIdInput, exerciseModalNameInput, exerciseModalCategoryInput, exerciseModalMusclesInput, exerciseModalEquipmentInput, exerciseModalTagsInput, exerciseModalDifficultyInput, exerciseModalDescriptionInput, exerciseModalVideoInput;

// --- Initialization ---
export function initializeLibrary(config) {
    exerciseListElement = config.exerciseList || document.querySelector('.exercise-list');
    inspectorSearchElement = config.inspectorSearch || document.getElementById('inspector-search');
    categoryFilterElement = config.categoryFilter || document.getElementById('library-filter-category');
    equipmentFilterElement = config.equipmentFilter || document.getElementById('library-filter-equipment');
    sortElement = config.sort || document.getElementById('library-sort');
    favoritesToggleElement = config.favoritesToggle || document.getElementById('library-toggle-favorites');
    exerciseListContainerElement = config.exerciseListContainer || document.querySelector('.exercise-list-container');
    
    // Modal elements
    exerciseModalElement = config.exerciseModal || document.getElementById('exercise-modal');
    exerciseModalCloseBtnElement = config.exerciseModalCloseBtn || document.getElementById('exercise-modal-close-btn');
    exerciseModalFormElement = config.exerciseModalForm || document.getElementById('exercise-modal-form');
    exerciseModalTitleElement = config.exerciseModalTitle || document.getElementById('exercise-modal-title');
    
    // Modal form fields
    if (exerciseModalFormElement) {
        exerciseModalIdInput = exerciseModalFormElement.querySelector('#exercise-modal-id');
        exerciseModalNameInput = exerciseModalFormElement.querySelector('#exercise-modal-name');
        exerciseModalCategoryInput = exerciseModalFormElement.querySelector('#exercise-modal-category');
        exerciseModalMusclesInput = exerciseModalFormElement.querySelector('#exercise-modal-muscles');
        exerciseModalEquipmentInput = exerciseModalFormElement.querySelector('#exercise-modal-equipment');
        exerciseModalTagsInput = exerciseModalFormElement.querySelector('#exercise-modal-tags');
        exerciseModalDifficultyInput = exerciseModalFormElement.querySelector('#exercise-modal-difficulty');
        exerciseModalDescriptionInput = exerciseModalFormElement.querySelector('#exercise-modal-description');
        exerciseModalVideoInput = exerciseModalFormElement.querySelector('#exercise-modal-video');
    }

    console.log("Exercise Library module initialized.");
    // Load data and populate UI after initialization
    return loadExerciseLibrary(); // Return the promise
}

// --- Core Library Logic ---
export async function loadExerciseLibrary() {
    console.log("loadExerciseLibrary: Starting...");
    let defaultExercises = [];
    let userExercises = [];

    // 1. Fetch default exercises
    try {
        console.log("loadExerciseLibrary: Fetching exercises.json...");
        const response = await fetch('exercises.json');
        console.log(`loadExerciseLibrary: Fetch response status: ${response.status}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const jsonText = await response.text();
        console.log("loadExerciseLibrary: exercises.json fetched, attempting parse...");
        try {
            defaultExercises = JSON.parse(jsonText);
            defaultExercises = defaultExercises.map(ex => ({ ...ex, isDefault: true }));
            console.log(`loadExerciseLibrary: Parsed ${defaultExercises.length} default exercises.`);
        } catch (parseError) {
            console.error('Error parsing exercises.json:', parseError);
            console.error('Received text:', jsonText.substring(0, 500) + '...');
            throw new Error('Failed to parse exercises.json');
        }
    } catch (error) {
        console.error('Error fetching or parsing default exercises:', error);
    }

    // 2. Load user exercises from localStorage
    try {
        console.log("loadExerciseLibrary: Loading user exercises from localStorage...");
        const storedUserExercises = localStorage.getItem(USER_EXERCISES_KEY);
        userExercises = JSON.parse(storedUserExercises || '[]');
        userExercises = userExercises.map(ex => ({ ...ex, isDefault: false }));
        console.log(`loadExerciseLibrary: Loaded ${userExercises.length} user exercises from localStorage.`);
    } catch (error) {
        console.error("Error loading or parsing user exercises from localStorage:", error);
        // showToast("Error loading custom exercises.", "warning"); // Dependency
        userExercises = [];
    }

    // 3. Merge and store
    console.log("loadExerciseLibrary: Merging exercises...");
    exerciseLibraryData = [...defaultExercises, ...userExercises];
    exerciseLibraryData.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`Exercise library merged: ${exerciseLibraryData.length} total exercises.`);

    // 4. Populate UI
    console.log("loadExerciseLibrary: Loading favorites, frequency, filters, and populating UI...");
    loadFavorites();
    loadFrequencyData();
    populateFilterOptions();
    populateExerciseListUI();
    console.log("loadExerciseLibrary: UI population attempted.");
    return exerciseLibraryData; // Return the loaded data
}

export function populateExerciseListUI() {
    if (!exerciseListElement) return;

    const filteredAndSortedData = filterAndSortExercises(exerciseLibraryData);
    
    // Ensure container has a view mode class
    if (exerciseListContainerElement && !exerciseListContainerElement.classList.contains('view-standard') && !exerciseListContainerElement.classList.contains('view-compact')) {
         exerciseListContainerElement.classList.add('view-standard'); 
    }

    exerciseListElement.innerHTML = ''; // Clear existing items

    if (filteredAndSortedData.length === 0) {
        exerciseListElement.innerHTML = '<li>No exercises match the current filters.</li>';
        return;
    }

    const fragment = document.createDocumentFragment();
    filteredAndSortedData.forEach(ex => {
        fragment.appendChild(createExerciseListItem(ex));
    });
    exerciseListElement.appendChild(fragment);
}

function createExerciseListItem(ex) {
    const li = document.createElement('li');
    li.className = 'exercise-item';
    li.draggable = true;
    li.dataset.exerciseId = ex.id;
    const category = ex.category || 'Uncategorized';
    li.dataset.category = category;
    li.dataset.equipment = (ex.equipmentNeeded || []).join(',');

    const categorySlug = category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    if (categorySlug) {
        li.classList.add(`category-${categorySlug}`);
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'exercise-item-content';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'exercise-list-name';
    nameSpan.textContent = ex.name;
    contentDiv.appendChild(nameSpan);

    if (ex.description) {
        const descriptionSpan = document.createElement('span');
        descriptionSpan.className = 'exercise-list-description';
        descriptionSpan.textContent = ex.description;
        contentDiv.appendChild(descriptionSpan);
    }

    const tagsDiv = document.createElement('div');
    tagsDiv.className = 'exercise-tags';

    const catTag = document.createElement('span');
    catTag.className = 'exercise-tag tag-category';
    catTag.textContent = category;
    tagsDiv.appendChild(catTag);

    if (ex.equipmentNeeded && ex.equipmentNeeded.length > 0) {
         const equipTag = document.createElement('span');
         equipTag.className = 'exercise-tag tag-equipment';
         equipTag.textContent = ex.equipmentNeeded[0];
         tagsDiv.appendChild(equipTag);
    }
    if (tagsDiv.children.length > 0) {
        contentDiv.appendChild(tagsDiv);
    }
    li.appendChild(contentDiv); 

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'exercise-list-item-actions';

    const favButton = document.createElement('button');
    favButton.className = 'exercise-favorite-btn';
    favButton.innerHTML = '&#9734;';
    favButton.title = 'Toggle Favorite';
    if (exerciseFavorites.has(ex.id)) {
        favButton.classList.add('is-favorite');
        favButton.innerHTML = '&#9733;';
    }
    favButton.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(ex.id);
    });
    actionsDiv.appendChild(favButton);

    if (!ex.isDefault) {
        const userTag = document.createElement('span');
        userTag.className = 'exercise-user-tag';
        userTag.textContent = 'Custom';
        userTag.title = 'User-added exercise';
        actionsDiv.appendChild(userTag);

        const editBtn = document.createElement('button');
        editBtn.className = 'exercise-edit-btn';
        editBtn.innerHTML = '&#9998;';
        editBtn.title = 'Edit custom exercise';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            openExerciseModal(ex.id);
        });
        actionsDiv.appendChild(editBtn);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'exercise-delete-btn';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.title = 'Delete custom exercise';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteUserExercise(ex.id);
        });
        actionsDiv.appendChild(deleteBtn);
    }
    li.appendChild(actionsDiv);

    // <<< NEW: Add click listener to show detail modal >>>
    li.addEventListener('click', (e) => {
        // Prevent interfering with button clicks inside the item
        if (e.target.closest('button')) return; 
        
        console.log(`Library item clicked: ${ex.id}`);
        // Dispatch a custom event with the exercise ID
        const detailEvent = new CustomEvent('forge-library:show-detail', { 
            detail: { exerciseId: ex.id },
            bubbles: true, // Allow event to bubble up
            composed: true // Allow event to cross shadow DOM boundaries (if any)
        });
        li.dispatchEvent(detailEvent);
        console.log(`Dispatched forge-library:show-detail for ${ex.id}`);
    });
    // <<< END NEW >>>

    return li;
}

export function filterExerciseLibrary() { // Export this as it's called by listener
    populateExerciseListUI(); // The filtering is done inside here now
}

function filterAndSortExercises(exercises) {
    const searchTerm = inspectorSearchElement?.value.toLowerCase() || '';
    const categoryFilter = categoryFilterElement?.value || 'all';
    const equipmentFilter = equipmentFilterElement?.value || 'all';
    const sortMethod = sortElement?.value || 'alpha-name';
    const favoritesOnly = favoritesToggleElement?.classList.contains('active');

    let filtered = exercises.filter(ex => {
        const nameMatch = searchTerm ? ex.name.toLowerCase().includes(searchTerm) : true;
        const categoryMatch = categoryFilter === 'all' || (ex.category || 'Uncategorized') === categoryFilter;
        const equipmentMatch = equipmentFilter === 'all' || (ex.equipmentNeeded || []).some(eq => eq === equipmentFilter);
        const favoriteMatch = !favoritesOnly || exerciseFavorites.has(ex.id);
        return nameMatch && categoryMatch && equipmentMatch && favoriteMatch;
    });

    if (sortMethod === 'frequency') {
        filtered.sort((a, b) => (exerciseFrequency[b.id] || 0) - (exerciseFrequency[a.id] || 0));
    } else if (sortMethod === 'category') {
        filtered.sort((a, b) => {
            const catA = a.category || 'Uncategorized';
            const catB = b.category || 'Uncategorized';
            if (catA !== catB) {
                return catA.localeCompare(catB);
            }
            return a.name.localeCompare(b.name);
        });
    } else {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    return filtered;
}

function populateFilterOptions() {
    if (!categoryFilterElement || !equipmentFilterElement) return;

    const categories = new Set();
    const equipment = new Set();
    exerciseLibraryData.forEach(ex => {
        if (ex.category) categories.add(ex.category);
        if (ex.equipmentNeeded && Array.isArray(ex.equipmentNeeded)) {
            ex.equipmentNeeded.forEach(eq => equipment.add(eq));
        }
    });

    categoryFilterElement.innerHTML = '<option value="all">All Categories</option>';
    Array.from(categories).sort().forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categoryFilterElement.appendChild(option);
    });

    equipmentFilterElement.innerHTML = '<option value="all">All Equipment</option>';
    Array.from(equipment).sort().forEach(eq => {
        const option = document.createElement('option');
        option.value = eq;
        option.textContent = eq;
        equipmentFilterElement.appendChild(option);
    });
}

// --- Favorites Logic ---
function loadFavorites() {
    const storedFavorites = localStorage.getItem(EXERCISE_FAVORITES_KEY);
    if (storedFavorites) {
        try {
            exerciseFavorites = new Set(JSON.parse(storedFavorites));
        } catch (e) {
            console.error("Error parsing favorites:", e);
            exerciseFavorites = new Set();
        }
    }
}

function saveFavorites() {
    localStorage.setItem(EXERCISE_FAVORITES_KEY, JSON.stringify(Array.from(exerciseFavorites)));
}

function toggleFavorite(exerciseId) {
    const favButton = exerciseListElement?.querySelector(`.exercise-item[data-exercise-id="${exerciseId}"] .exercise-favorite-btn`);
    if (exerciseFavorites.has(exerciseId)) {
        exerciseFavorites.delete(exerciseId);
        favButton?.classList.remove('is-favorite');
        if(favButton) favButton.innerHTML = '&#9734;';
    } else {
        exerciseFavorites.add(exerciseId);
        favButton?.classList.add('is-favorite');
        if(favButton) favButton.innerHTML = '&#9733;';
    }
    saveFavorites();
    if (favoritesToggleElement?.classList.contains('active')) {
        populateExerciseListUI();
    }
}

export function toggleFavoritesFilter() {
    favoritesToggleElement?.classList.toggle('active');
    populateExerciseListUI();
}

// --- Frequency Logic ---
function loadFrequencyData() {
    const storedFrequency = localStorage.getItem(EXERCISE_FREQUENCY_KEY);
    if (storedFrequency) {
        try {
            exerciseFrequency = JSON.parse(storedFrequency);
        } catch (e) {
            console.error("Error parsing frequency data:", e);
            exerciseFrequency = {};
        }
    }
}

function saveFrequencyData() {
    localStorage.setItem(EXERCISE_FREQUENCY_KEY, JSON.stringify(exerciseFrequency));
}

export function incrementExerciseFrequency(exerciseId) {
    exerciseFrequency[exerciseId] = (exerciseFrequency[exerciseId] || 0) + 1;
    saveFrequencyData();
}

// --- Add/Edit Modal Logic ---
export function openExerciseModal(exerciseId = null) {
    if (!exerciseModalElement || !exerciseModalFormElement || !exerciseModalTitleElement) return;
    exerciseModalFormElement.reset();

    if (exerciseId) {
        const exercise = exerciseLibraryData.find(ex => ex.id === exerciseId && !ex.isDefault);
        if (exercise) {
            exerciseModalTitleElement.textContent = 'Edit Custom Exercise';
            if(exerciseModalIdInput) exerciseModalIdInput.value = exercise.id;
            if(exerciseModalNameInput) exerciseModalNameInput.value = exercise.name;
            if(exerciseModalCategoryInput) exerciseModalCategoryInput.value = exercise.category || '';
            if(exerciseModalMusclesInput) exerciseModalMusclesInput.value = (exercise.primaryMuscles || []).join(', ');
            if(exerciseModalEquipmentInput) exerciseModalEquipmentInput.value = (exercise.equipmentNeeded || []).join(', ');
            if(exerciseModalTagsInput) exerciseModalTagsInput.value = (exercise.tags || []).join(', ');
            if(exerciseModalDifficultyInput) exerciseModalDifficultyInput.value = exercise.difficulty || '';
            if(exerciseModalDescriptionInput) exerciseModalDescriptionInput.value = exercise.description || '';
            if(exerciseModalVideoInput) exerciseModalVideoInput.value = exercise.videoUrl || '';
        } else {
            // showToast('Cannot edit default exercises or exercise not found.', 'error'); // Dependency
            return;
        }
    } else {
        exerciseModalTitleElement.textContent = 'Add Custom Exercise';
        if(exerciseModalIdInput) exerciseModalIdInput.value = '';
    }
    exerciseModalElement.classList.add('is-visible');
}

export function closeExerciseModal() {
    exerciseModalElement?.classList.remove('is-visible');
}

export function handleExerciseFormSubmit(event) {
    event.preventDefault();
    const form = event.target; // Should be exerciseModalFormElement
    const exerciseId = exerciseModalIdInput?.value;

    // Helper to parse CSV strings (needs import or local definition)
    const parseCsvString = (str) => str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];

    const exerciseData = {
        id: exerciseId || `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: exerciseModalNameInput?.value.trim(),
        category: exerciseModalCategoryInput?.value.trim() || 'Custom',
        primaryMuscles: parseCsvString(exerciseModalMusclesInput?.value),
        equipmentNeeded: parseCsvString(exerciseModalEquipmentInput?.value),
        tags: parseCsvString(exerciseModalTagsInput?.value),
        difficulty: exerciseModalDifficultyInput?.value || null,
        description: exerciseModalDescriptionInput?.value.trim() || null,
        videoUrl: exerciseModalVideoInput?.value.trim() || null,
        isDefault: false
    };

    if (!exerciseData.name) {
        // showToast('Exercise name is required.', 'warning'); // Dependency
        return;
    }

    try {
        let userExercises = JSON.parse(localStorage.getItem(USER_EXERCISES_KEY) || '[]');
        const existingIndex = userExercises.findIndex(ex => ex.id === exerciseData.id);

        if (existingIndex > -1) {
            userExercises[existingIndex] = exerciseData;
            // showToast(`Exercise "${exerciseData.name}" updated.`, 'info'); // Dependency
        } else {
            if (userExercises.some(ex => ex.name.toLowerCase() === exerciseData.name.toLowerCase())) {
                if (!confirm(`An exercise named "${exerciseData.name}" already exists. Save anyway?`)) {
                    return;
                }
            }
            userExercises.push(exerciseData);
            // showToast(`Exercise "${exerciseData.name}" added.`, 'info'); // Dependency
        }

        localStorage.setItem(USER_EXERCISES_KEY, JSON.stringify(userExercises));
        closeExerciseModal();
        loadExerciseLibrary(); // Reload and refresh UI
    } catch (error) {
        console.error("Error saving exercise:", error);
        // showToast("Failed to save exercise.", "error"); // Dependency
    }
}

// --- Import/Export Logic ---
export function exportUserExercises() {
    try {
        const userExercises = localStorage.getItem(USER_EXERCISES_KEY) || '[]';
        const blob = new Blob([userExercises], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'setforge_custom_exercises.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        // showToast('Custom exercises exported.', 'info'); // Dependency
    } catch (error) {
        console.error("Export failed:", error);
        // showToast('Failed to export custom exercises.', 'error'); // Dependency
    }
}

export function handleExerciseImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (!Array.isArray(importedData)) {
                throw new Error('Invalid file format: Must be a JSON array.');
            }

            const validExercises = importedData.filter(ex => ex && typeof ex.name === 'string' && typeof ex.id === 'string');
            const invalidCount = importedData.length - validExercises.length;

            if (validExercises.length === 0) {
                 // showToast('No valid exercises found in the imported file.', 'error'); // Dependency
                 return;
            }

            let userExercises = JSON.parse(localStorage.getItem(USER_EXERCISES_KEY) || '[]');
            let addedCount = 0;
            let updatedCount = 0;

            validExercises.forEach(importedEx => {
                importedEx.isDefault = false; 
                const existingIndex = userExercises.findIndex(ex => ex.id === importedEx.id);
                if (existingIndex > -1) {
                    userExercises[existingIndex] = importedEx;
                    updatedCount++;
                } else {
                    if (!userExercises.some(ex => ex.name.toLowerCase() === importedEx.name.toLowerCase())) {
                        userExercises.push(importedEx);
                        addedCount++;
                    } else {
                        console.warn(`Skipping import of "${importedEx.name}" due to name conflict with an existing custom exercise.`);
                    }
                }
            });

            localStorage.setItem(USER_EXERCISES_KEY, JSON.stringify(userExercises));
            let message = `Import successful: ${addedCount} added, ${updatedCount} updated.`;
            if (invalidCount > 0) message += ` ${invalidCount} invalid entries skipped.`;
            // showToast(message, 'info'); // Dependency
            loadExerciseLibrary(); // Refresh library

        } catch (error) {
            console.error("Import failed:", error);
            // showToast(`Import failed: ${error.message}`, 'error'); // Dependency
        } finally {
             event.target.value = null; 
        }
    };
    reader.onerror = function() {
         // showToast('Error reading file.', 'error'); // Dependency
         event.target.value = null;
    };
    reader.readAsText(file);
}

// --- Suggestion Logic (Placeholder) ---
export function suggestAlternatives(exerciseId) {
    const currentExercise = exerciseLibraryData.find(ex => ex.id === exerciseId);
    if (!currentExercise) {
        // showToast("Cannot suggest alternatives: Original exercise not found.", "warning"); // Dependency
        return;
    }
    
    console.log("Suggesting alternatives for:", currentExercise.name);
    // showToast(`Suggesting alternatives for ${currentExercise.name} (feature coming soon!).`, 'info'); // Dependency
    // TODO: Implement actual suggestion logic
}

// --- View Mode Logic (Example) ---
export function setViewMode(mode) { // 'standard' or 'compact'
    if (!exerciseListContainerElement) return;
    exerciseListContainerElement.classList.remove('view-standard', 'view-compact');
    exerciseListContainerElement.classList.add(`view-${mode}`);
    localStorage.setItem(VIEW_MODE_KEY, mode); // Persist preference
}

export function loadViewMode() {
    if (!exerciseListContainerElement) return;
    const savedMode = localStorage.getItem(VIEW_MODE_KEY) || 'standard';
    exerciseListContainerElement.classList.add(`view-${savedMode}`);
}

// Dependencies:
// - Browser Globals: fetch, localStorage, JSON, console, setTimeout, URL, Blob, FileReader, confirm, Date, Math
// - DOM Access: document.getElementById, querySelector, createElement, etc.
// - External Functions: showToast (needs import)
// - Helper Functions: parseCsvString (needs import or definition)

/**
 * Get the current exercise library data. Used by other modules to access exercise data.
 * @returns {Array} The current exercise library data
 */
export function getExercises() {
    return exerciseLibraryData;
}
