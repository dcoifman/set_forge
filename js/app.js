import BiomechanicalAnalyzer from './biomechanical-analyzer.js';
import RecoveryInspectorTab from './components/RecoveryInspectorTab.js';

/**
 * Initialize the application
 */
function initializeApp() {
  // Initialize biomechanical analyzer
  const biomechanicalAnalyzer = new BiomechanicalAnalyzer();
  
  // Initialize recovery inspector tab
  const recoveryTabContainer = document.getElementById('recovery-tab-content');
  if (recoveryTabContainer) {
    const recoveryTab = new RecoveryInspectorTab(recoveryTabContainer, biomechanicalAnalyzer);
    recoveryTab.initialize();
  }
  
  // Add event listeners for exercise logging
  setupExerciseLogging(biomechanicalAnalyzer);
  
  // Load any existing exercise data
  loadExistingData(biomechanicalAnalyzer);
  
  console.log("SetForge initialized with biomechanical analysis features");
}

/**
 * Set up event listeners for logging exercises
 */
function setupExerciseLogging(biomechanicalAnalyzer) {
  const exerciseLogForm = document.getElementById('exercise-log-form');
  if (exerciseLogForm) {
    exerciseLogForm.addEventListener('submit', (event) => {
      event.preventDefault();
      
      const exerciseName = document.getElementById('exercise-name').value;
      const muscleGroups = document.getElementById('muscle-groups').value.split(',').map(m => m.trim());
      const intensity = parseInt(document.getElementById('intensity').value, 10);
      const duration = parseInt(document.getElementById('duration').value, 10);
      
      biomechanicalAnalyzer.recordExercise(exerciseName, muscleGroups, intensity, duration);
      
      // Update recovery display
      updateRecoveryDisplay();
      
      // Clear form
      exerciseLogForm.reset();
    });
  }
}

/**
 * Load existing exercise data from storage
 */
function loadExistingData(biomechanicalAnalyzer) {
  biomechanicalAnalyzer.loadHistory();
}

/**
 * Update the recovery display with current data
 */
function updateRecoveryDisplay() {
  const recoveryTabContent = document.getElementById('recovery-tab-content');
  if (recoveryTabContent && recoveryTabContent._recoveryTab) {
    recoveryTabContent._recoveryTab.refreshData();
  }
}

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeApp); 