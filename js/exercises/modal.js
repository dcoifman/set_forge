// Import dependencies (placeholders, update paths as needed)
// import { exerciseLibraryData, populateExerciseListUI } from './library.js';
// import { showToast } from '../ui/toast.js';
// import { USER_EXERCISES_KEY } from './constants.js'; // Need to create this

// DOM References (Inject or query as needed)
const exerciseModal = document.getElementById('exercise-modal');
const exerciseForm = document.getElementById('exercise-form');
const exerciseModalTitle = document.getElementById('exercise-modal-title');
const exerciseIdInput = document.getElementById('exercise-id');
const exerciseNameInput = document.getElementById('exercise-name');
const exerciseCategoryInput = document.getElementById('exercise-category');
const exerciseEquipmentInput = document.getElementById('exercise-equipment');
const exerciseAliasesInput = document.getElementById('exercise-aliases');
const exerciseNotesInput = document.getElementById('exercise-notes');
const exerciseModalCloseBtn = document.getElementById('exercise-modal-close-btn');
const deleteExerciseBtn = document.getElementById('delete-exercise-btn');

// --- Exercise Modal Logic ---

export function openExerciseModal(exerciseId = null) {
    if (!exerciseModal || !exerciseForm) return;
    exerciseForm.reset(); // Clear previous data
    exerciseIdInput.value = exerciseId || ''; // Set ID if editing

    if (exerciseId) {
        // Editing existing exercise
        const exercise = exerciseLibraryData.find(ex => ex.id === exerciseId);
        if (exercise) {
            if (exerciseModalTitle) exerciseModalTitle.textContent = 'Edit Exercise';
            if (exerciseNameInput) exerciseNameInput.value = exercise.name || '';
            if (exerciseCategoryInput) exerciseCategoryInput.value = exercise.category || '';
            if (exerciseEquipmentInput) exerciseEquipmentInput.value = (exercise.equipmentNeeded || []).join(', ');
            if (exerciseAliasesInput) exerciseAliasesInput.value = (exercise.aliases || []).join(', ');
            if (exerciseNotesInput) exerciseNotesInput.value = exercise.notes || '';
            if (deleteExerciseBtn) {
                 deleteExerciseBtn.style.display = exercise.isDefault ? 'none' : 'inline-block'; // Show delete only for user exercises
                 // Add listener if not already attached (handle in initialization)
                 // deleteExerciseBtn.onclick = () => handleDeleteExercise(exerciseId); // Example direct assignment
            }
        } else {
            showToast(`Error: Exercise with ID ${exerciseId} not found.`, 'error');
            return; // Don't open modal if exercise not found
        }
    } else {
        // Adding new exercise
        if (exerciseModalTitle) exerciseModalTitle.textContent = 'Add New Exercise';
        if (deleteExerciseBtn) deleteExerciseBtn.style.display = 'none'; // Hide delete button for new exercises
    }

    exerciseModal.classList.add('is-visible');
}

export function closeExerciseModal() {
    if (exerciseModal) exerciseModal.classList.remove('is-visible');
}

export function handleExerciseFormSubmit(event) {
    event.preventDefault();
    if (!exerciseNameInput || !exerciseNameInput.value.trim()) {
        showToast('Exercise name is required.', 'warning');
        return;
    }

    const exerciseData = {
        id: exerciseIdInput.value || `user-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: exerciseNameInput.value.trim(),
        category: exerciseCategoryInput.value.trim() || 'Uncategorized',
        equipmentNeeded: exerciseEquipmentInput.value.split(',').map(e => e.trim()).filter(e => e),
        aliases: exerciseAliasesInput.value.split(',').map(a => a.trim()).filter(a => a),
        notes: exerciseNotesInput.value.trim(),
        isDefault: false // User-added/edited exercises are never default
    };

    // Load current user exercises
    let userExercises = [];
     try {
         userExercises = JSON.parse(localStorage.getItem(USER_EXERCISES_KEY) || '[]');
     } catch (e) {
         console.error("Error parsing user exercises, starting fresh.", e);
         userExercises = [];
     }

    const existingIndex = userExercises.findIndex(ex => ex.id === exerciseData.id);

    if (existingIndex > -1) {
        // Update existing exercise
        userExercises[existingIndex] = exerciseData;
    } else {
        // Add new exercise
        userExercises.push(exerciseData);
    }

    // Save updated user exercises to localStorage
    localStorage.setItem(USER_EXERCISES_KEY, JSON.stringify(userExercises));

    // Reload the entire library to reflect changes
    loadExerciseLibrary().then(() => { // Dependency
         showToast(`Exercise "${exerciseData.name}" saved successfully!`, 'info');
         closeExerciseModal();
         populateExerciseListUI(); // Refresh the list immediately
    });
}

function handleDeleteExercise(exerciseId) {
    if (!exerciseId) return;
    if (!confirm('Are you sure you want to delete this custom exercise?')) return;

    let userExercises = JSON.parse(localStorage.getItem(USER_EXERCISES_KEY) || '[]');
    const initialLength = userExercises.length;
    userExercises = userExercises.filter(ex => ex.id !== exerciseId);

    if (userExercises.length < initialLength) {
        localStorage.setItem(USER_EXERCISES_KEY, JSON.stringify(userExercises));
        loadExerciseLibrary().then(() => { // Reload library
            showToast('Exercise deleted.', 'info');
            closeExerciseModal();
            populateExerciseListUI(); // Refresh list
        });
    } else {
        showToast('Exercise not found or could not be deleted.', 'warning');
    }
}

// Initialization function to attach listeners
export function initializeExerciseModalListeners() {
     if (exerciseForm) exerciseForm.addEventListener('submit', handleExerciseFormSubmit);
     if (exerciseModalCloseBtn) exerciseModalCloseBtn.addEventListener('click', closeExerciseModal);
     if (exerciseModal) {
         exerciseModal.addEventListener('click', (e) => {
            if (e.target === exerciseModal) {
                 closeExerciseModal();
            }
         });
     }
     // Attach listener for delete button (needs to be dynamic or use event delegation if button is recreated)
      if (deleteExerciseBtn) {
          deleteExerciseBtn.addEventListener('click', () => {
             const idToDelete = exerciseIdInput.value;
             if (idToDelete) {
                 handleDeleteExercise(idToDelete);
             }
          });
      }
}

// --- Import/Export User Exercises ---

export function exportUserExercises() {
    let userExercises = [];
    try {
        userExercises = JSON.parse(localStorage.getItem(USER_EXERCISES_KEY) || '[]');
    } catch (e) {
        showToast('Error loading exercises for export.', 'error');
        return;
    }
    if (userExercises.length === 0) {
        showToast('No custom exercises to export.', 'info');
        return;
    }

    const dataStr = JSON.stringify(userExercises, null, 2); // Pretty print JSON
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'setforge_user_exercises.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('User exercises exported.', 'info');
}

export function handleExerciseImport(event) {
    const file = event.target.files[0];
    if (!file) {
        showToast('No file selected for import.', 'warning');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedExercises = JSON.parse(e.target.result);
            if (!Array.isArray(importedExercises)) {
                throw new Error('Imported file is not a valid JSON array.');
            }

            // Basic validation (check for name property)
            if (!importedExercises.every(ex => ex && typeof ex.name === 'string')) {
                throw new Error('Imported data missing required fields (e.g., name).');
            }

            // Load existing user exercises
            let userExercises = [];
            try {
                userExercises = JSON.parse(localStorage.getItem(USER_EXERCISES_KEY) || '[]');
            } catch (parseError) {
                console.error("Error parsing existing exercises during import:", parseError);
                // Decide how to handle: Overwrite or fail?
                if (!confirm("Could not load existing exercises. Overwrite with imported file?")) {
                    return; // Cancel import
                }
                userExercises = [];
            }

            // Merge logic (simple append, could add overwrite confirmation later)
            let addedCount = 0;
            let skippedCount = 0;
            importedExercises.forEach(importedEx => {
                // Ensure unique ID (or handle potential clashes)
                 // Simple clash check: if ID exists, skip (could prompt to overwrite)
                if (userExercises.some(existing => existing.id === importedEx.id) || exerciseLibraryData.some(existing => existing.id === importedEx.id)) {
                    console.log(`Skipping import for exercise with potentially duplicate ID: ${importedEx.name} (${importedEx.id})`);
                    skippedCount++;
                } else {
                     // Assign a new user ID if it's missing or looks like a default one
                     if (!importedEx.id || !String(importedEx.id).startsWith('user-')) {
                         importedEx.id = `user-${Date.now()}-${Math.random().toString(16).slice(2)}-${addedCount}`;
                     }
                    importedEx.isDefault = false; // Ensure imported are marked as user
                    userExercises.push(importedEx);
                    addedCount++;
                }
            });

            localStorage.setItem(USER_EXERCISES_KEY, JSON.stringify(userExercises));
            showToast(`${addedCount} exercises imported successfully. ${skippedCount} skipped (potential duplicates).`, 'info');

            // Reload library and refresh UI
            loadExerciseLibrary().then(() => {
                populateExerciseListUI();
            });

        } catch (error) {
            console.error('Error processing imported file:', error);
            showToast(`Import failed: ${error.message}`, 'error');
        }
    };

    reader.onerror = function() {
        showToast('Error reading import file.', 'error');
    };

    reader.readAsText(file);

    // Reset file input to allow importing the same file again if needed
    event.target.value = null;
}

// Dependencies:
// - Browser globals: localStorage, JSON, Date, Math, confirm
// - DOM References: exerciseModal, exerciseForm, etc.
// - External state/data: exerciseLibraryData
// - External functions: loadExerciseLibrary, populateExerciseListUI, showToast
// - Constants: USER_EXERCISES_KEY
// - Initialization needed: initializeExerciseModalListeners
