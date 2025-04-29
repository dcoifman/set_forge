// Import dependencies (placeholders, update paths as needed)
// import { attachDragDropListeners, handleCellClick, handleWeekExpansionToggle } from './events.js'; // Event handling logic
import { createWorkoutCard } from '../workout/card.js';
// REMOVED: import { buildBlock } from '../periodizationEngine.js';
import { triggerAnalyticsUpdate } from '../analytics/updates.js';
import { showToast } from '../ui/toast.js';
import PeriodizationModelManager from '../periodizationModelManager.js';
import RecoveryCalendarIndicator from '../components/RecoveryCalendarIndicator.js';

// DOM References (Inject or query as needed)
const workCanvas = document.getElementById('work-canvas');

export function generateCalendarGrid(numWeeks) {
    if (!workCanvas) return;
    workCanvas.innerHTML = ''; // Clear existing grid
    workCanvas.style.gridTemplateRows = `auto repeat(${numWeeks}, auto)`;
    const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Add day headers
     daysOfWeek.forEach((day, i) => {
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = day;
        header.style.gridColumnStart = i + 2; // Set column explicitly
        workCanvas.appendChild(header);
    });

    // Add week rows
    for (let week = 1; week <= numWeeks; week++) {
        const weekRowContainer = document.createElement('div');
        weekRowContainer.className = 'week-row-container';
        weekRowContainer.style.gridRow = `${week + 1} / span 1`;
        weekRowContainer.style.gridColumn = `1 / -1`;
        weekRowContainer.style.display = 'contents';
        weekRowContainer.dataset.week = week;

        const label = document.createElement('div');
        label.className = 'week-label';
        label.dataset.week = week;
        label.textContent = `Wk ${week}`;
        // label.addEventListener('dblclick', handleWeekExpansionToggle); // Dependency
        weekRowContainer.appendChild(label);

        daysOfWeek.forEach((day, dayIndex) => {
            const cell = document.createElement('div');
            cell.className = 'day-cell session-slot';
            cell.dataset.week = week;
            cell.dataset.day = day;
            // Add the standardized day ID
            const dayId = PeriodizationModelManager.generateDayId(week - 1, day);
            if (dayId) {
                 cell.dataset.dayId = dayId; // e.g., "wk1-mon"
            } else {
                console.error(`Failed to generate day ID for week ${week-1}, day ${day}`);
            }
            // attachDragDropListeners(cell); // Dependency
            // cell.addEventListener('click', handleCellClick); // Dependency
            weekRowContainer.appendChild(cell);
        });

        workCanvas.appendChild(weekRowContainer);
    }
    // Note: sessionSlots querySelectorAll needs to be updated/refactored elsewhere
}

export function initializeCalendarGrid() {
    // ... existing initialization code ...
    
    // Initialize recovery indicators
    const recoveryIndicator = new RecoveryCalendarIndicator(calendarGrid);
    recoveryIndicator.initialize();
    
    // Return any existing return value or the calendar grid
}

export function refreshCalendarGrid() {
    // ... existing refresh code ...
    
    // Update recovery indicators when calendar refreshes
    document.dispatchEvent(new CustomEvent('recovery-status-changed'));
    
    // Return any existing return value
}

export function handleWorkoutAssignment(workoutData, cellElement) {
    // ... existing code ...
    
    // After assigning workout, check recovery impact
    checkRecoveryImpact(workoutData);
    
    // Return any existing return value
}

/**
 * Check the recovery impact of a workout and warn if necessary
 * @param {Object} workoutData - Workout being assigned
 */
function checkRecoveryImpact(workoutData) {
    // Get BiomechanicalAnalyzer instance (assuming it's available globally or passed differently)
    // Note: Direct instantiation here might not be intended if a single instance should be used.
    // Consider passing the analyzer instance if needed.
    
    // If you need to import it here:
    // import BiomechanicalAnalyzer from '../biomechanical-analyzer.js'; 
    // const analyzer = new BiomechanicalAnalyzer();
    
    // Get muscles targeted by this workout
    const targetedMuscles = getWorkoutTargetedMuscles(workoutData);
    
    // Check if any targeted muscles have low recovery
    const stressLevels = analyzer.getCurrentStressLevels();
    const lowRecoveryMuscles = [];
    
    for (const muscle of targetedMuscles) {
        const stress = stressLevels[muscle] || 0;
        const recovery = 1 - stress;
        
        if (recovery < 0.4) { // Less than 40% recovered
            lowRecoveryMuscles.push({
                name: muscle,
                recovery: Math.round(recovery * 100)
            });
        }
    }
    
    // Show warning if low recovery muscles found
    if (lowRecoveryMuscles.length > 0) {
        showRecoveryWarning(lowRecoveryMuscles, workoutData);
    }
}

/**
 * Get muscles targeted by a workout
 * @param {Object} workoutData - Workout data
 * @returns {Array} - List of targeted muscles
 */
function getWorkoutTargetedMuscles(workoutData) {
    const targetedMuscles = new Set();
    
    // Extract exercises from workout
    const exercises = workoutData.exercises || [];
    
    // Add targeted muscles for each exercise
    exercises.forEach(exercise => {
        // Get primary muscles
        const primaryMuscles = getPrimaryMusclesForExercise(exercise.id);
        primaryMuscles.forEach(muscle => targetedMuscles.add(muscle));
    });
    
    return Array.from(targetedMuscles);
}

/**
 * Get primary muscles for an exercise
 * @param {string} exerciseId - Exercise ID
 * @returns {Array} - List of primary muscles
 */
function getPrimaryMusclesForExercise(exerciseId) {
    // This would ideally come from your exercise library
    // Simplified mapping for common exercises
    const muscleMappings = {
        'bench_press': ['Chest', 'Triceps'],
        'squat': ['Quadriceps', 'Glutes'],
        'deadlift': ['Hamstrings', 'Lower_Back'],
        'pull_up': ['Back', 'Biceps'],
        // Add more mappings as needed
    };
    
    return muscleMappings[exerciseId] || [];
}

/**
 * Show a warning about low recovery muscles
 * @param {Array} lowRecoveryMuscles - List of muscles with low recovery
 * @param {Object} workoutData - Workout data
 */
function showRecoveryWarning(lowRecoveryMuscles, workoutData) {
    // Create warning message
    const muscleList = lowRecoveryMuscles.map(m => 
        `${m.name} (${m.recovery}% recovered)`
    ).join(', ');
    
    const warningMessage = `
        <div class="recovery-warning">
            <h4>⚠️ Recovery Warning</h4>
            <p>This workout targets muscles that need more recovery:</p>
            <p class="warning-muscles">${muscleList}</p>
            <p>Consider adjusting intensity or targeting different muscle groups.</p>
        </div>
    `;
    
    // Show warning using your UI system (toast, modal, etc.)
    // This depends on your UI implementation
    if (typeof showToast === 'function') {
        showToast({
            type: 'warning',
            title: 'Recovery Warning',
            message: warningMessage,
            duration: 7000
        });
    } else if (typeof showModal === 'function') {
        showModal({
            title: 'Recovery Warning',
            content: warningMessage,
            okButton: 'Acknowledge',
            cancelButton: 'Modify Workout'
        });
    } else {
        console.warn('Recovery warning:', lowRecoveryMuscles);
    }
    
    // Dispatch event so other components can react
    document.dispatchEvent(new CustomEvent('recovery-warning', {
        detail: {
            muscles: lowRecoveryMuscles,
            workout: workoutData
        }
    }));
}

// Dependencies:
// - DOM querying/manipulation
// - Browser globals (Math)
// - External functions:
//   - attachDragDropListeners, handleCellClick, handleWeekExpansionToggle
//   - createWorkoutCard
//   - buildBlockStructure
//   - triggerAnalyticsUpdate
//   - showToast
// - Event listeners need re-attachment (week label dblclick, cell click, drag/drop)
