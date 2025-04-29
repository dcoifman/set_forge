/**
 * Biomechanical Analyzer
 * Tracks and analyzes muscle stress, recovery, and biomechanical load
 */

class BiomechanicalAnalyzer {
  
  // Muscle group constants
  static MUSCLE_GROUPS = {
    // Upper body
    CHEST: 'chest',
    TRICEPS: 'triceps',
    SHOULDERS: 'shoulders',
    BICEPS: 'biceps',
    BACK: 'back',
    REAR_DELTS: 'rear_delts',
    FOREARMS: 'forearms',
    UPPER_BACK: 'upper_back',
    
    // Core
    CORE: 'core',
    ABS: 'abs',
    LOWER_BACK: 'lower_back',
    OBLIQUES: 'obliques',
    
    // Lower body
    QUADS: 'quads',
    HAMSTRINGS: 'hamstrings',
    GLUTES: 'glutes',
    CALVES: 'calves'
  };
  
  constructor() {
    this.muscleStressHistory = {};
    this.exerciseHistory = [];
    this.recoveryRates = {
      // Default recovery rates (stress units per hour)
      'Chest': 0.0417, // Full recovery in ~24h
      'Back': 0.0417,
      'Shoulders': 0.0417,
      'Triceps': 0.05, // Full recovery in ~20h
      'Biceps': 0.05,
      'Forearms': 0.0625, // Full recovery in ~16h
      'Core': 0.0833, // Full recovery in ~12h
      'Quadriceps': 0.0417,
      'Hamstrings': 0.0417,
      'Glutes': 0.05,
      'Calves': 0.0625
    };
    
    // Load history if available
    this.loadHistory();
  }
  
  /**
   * Records an exercise and its muscle stress impact
   * @param {string} exerciseName - Name of the exercise
   * @param {Object} stressMap - Map of muscles to stress values (0-1)
   */
  recordExercise(exerciseName, stressMap = {}) {
    const timestamp = new Date().getTime();
    
    // Record in exercise history
    this.exerciseHistory.push({
      name: exerciseName,
      timestamp,
      stressMap
    });
    
    // Update muscle stress
    for (const muscle in stressMap) {
      if (!this.muscleStressHistory[muscle]) {
        this.muscleStressHistory[muscle] = [];
      }
      
      this.muscleStressHistory[muscle].push({
        timestamp,
        stress: stressMap[muscle],
        source: exerciseName
      });
    }
    
    // Limit history size (keep last 50 entries)
    if (this.exerciseHistory.length > 50) {
      this.exerciseHistory = this.exerciseHistory.slice(-50);
    }
    
    // Clean up old stress history (older than 5 days)
    const cutoffTime = timestamp - (5 * 24 * 60 * 60 * 1000);
    for (const muscle in this.muscleStressHistory) {
      this.muscleStressHistory[muscle] = this.muscleStressHistory[muscle].filter(
        entry => entry.timestamp >= cutoffTime
      );
    }
    
    // Save updated history
    this.saveHistory();
  }
  
  /**
   * Calculates current muscle stress levels
   * @returns {Object} - Map of muscles to current stress levels
   */
  getCurrentStressLevels() {
    const now = new Date().getTime();
    const stressLevels = {};
    
    for (const muscle in this.muscleStressHistory) {
      const history = this.muscleStressHistory[muscle];
      if (!history || history.length === 0) {
        stressLevels[muscle] = 0;
        continue;
      }
      
      // Calculate current stress based on recovery time
      let cumulativeStress = 0;
      const recoveryRate = this.recoveryRates[muscle] || 0.0417; // Default to 24h recovery
      
      history.forEach(entry => {
        const hoursSince = (now - entry.timestamp) / (1000 * 60 * 60);
        const remainingStress = Math.max(0, entry.stress - (hoursSince * recoveryRate));
        cumulativeStress += remainingStress;
      });
      
      // Cap at 1.0 (100% stress)
      stressLevels[muscle] = Math.min(1.0, cumulativeStress);
    }
    
    return stressLevels;
  }
  
  /**
   * Gets current muscle stress levels for compatibility with RecoveryInspectorTab
   * @returns {Object} - Map of muscles to current stress levels
   */
  getCurrentMuscleStress() {
    return this.getCurrentStressLevels();
  }
  
  /**
   * Calculates the overall recovery percentage across all muscle groups
   * @returns {number} - Overall recovery percentage (0-100)
   */
  getOverallRecoveryPercentage() {
    const stressLevels = this.getCurrentStressLevels();
    if (Object.keys(stressLevels).length === 0) {
      return 100; // If no stress data, assume fully recovered
    }
    
    // Calculate average recovery across all tracked muscles
    let totalRecovery = 0;
    let muscleCount = 0;
    
    for (const muscle in stressLevels) {
      totalRecovery += (1 - stressLevels[muscle]);
      muscleCount++;
    }
    
    return muscleCount > 0 ? (totalRecovery / muscleCount) * 100 : 100;
  }
  
  /**
   * Determines if the user is ready for a workout based on recovery status
   * @returns {boolean} - True if recovered enough for a workout
   */
  isReadyForWorkout() {
    const overallRecovery = this.getOverallRecoveryPercentage();
    return overallRecovery >= 70; // Ready if at least 70% recovered
  }
  
  /**
   * Estimates time in hours until sufficiently recovered for a workout
   * @returns {number} - Estimated hours until recovered
   */
  getEstimatedRecoveryTime() {
    const stressLevels = this.getCurrentStressLevels();
    if (Object.keys(stressLevels).length === 0) {
      return 0; // If no stress data, assume no recovery time needed
    }
    
    // Find the most stressed muscle and its recovery rate
    let maxRecoveryTime = 0;
    
    for (const muscle in stressLevels) {
      const currentStress = stressLevels[muscle];
      const recoveryRate = this.recoveryRates[muscle] || 0.0417;
      
      // Calculate stress reduction needed to reach 70% recovery
      const targetStress = 0.3; // 70% recovery = 30% stress
      
      if (currentStress > targetStress) {
        const stressToRecover = currentStress - targetStress;
        const hoursNeeded = stressToRecover / recoveryRate;
        
        maxRecoveryTime = Math.max(maxRecoveryTime, hoursNeeded);
      }
    }
    
    return Math.ceil(maxRecoveryTime);
  }
  
  /**
   * Gets exercise and recovery recommendations based on current status
   * @returns {Array} - Array of recommendation objects
   */
  getRecommendations() {
    const stressLevels = this.getCurrentStressLevels();
    const recommendations = [];
    const overallRecovery = this.getOverallRecoveryPercentage();
    
    // Generate general recommendations based on overall recovery
    if (overallRecovery >= 90) {
      recommendations.push({
        type: 'workout',
        text: 'You are fully recovered. Ideal time for a high-intensity workout targeting any muscle group.'
      });
    } else if (overallRecovery >= 70) {
      recommendations.push({
        type: 'workout',
        text: 'Good recovery level. Ready for a normal training session.'
      });
    } else if (overallRecovery >= 50) {
      recommendations.push({
        type: 'light',
        text: 'Moderate fatigue detected. Consider a lighter workout or focus on less-fatigued muscle groups.'
      });
    } else {
      recommendations.push({
        type: 'rest',
        text: 'High fatigue detected. Rest or active recovery recommended today.'
      });
    }
    
    // Add muscle-specific recommendations
    const muscleGroupRecommendations = this.getMuscleGroupRecommendations(stressLevels);
    recommendations.push(...muscleGroupRecommendations);
    
    return recommendations;
  }
  
  /**
   * Generates muscle-specific training recommendations
   * @param {Object} stressLevels - Current muscle stress levels
   * @returns {Array} - Muscle-specific recommendations
   */
  getMuscleGroupRecommendations(stressLevels) {
    const recommendations = [];
    
    // Find most recovered muscle groups
    const muscleRecovery = {};
    for (const muscle in stressLevels) {
      muscleRecovery[muscle] = 1 - stressLevels[muscle];
    }
    
    // Sort muscles by recovery level (highest first)
    const sortedMuscles = Object.keys(muscleRecovery).sort(
      (a, b) => muscleRecovery[b] - muscleRecovery[a]
    );
    
    // Recommend training for the most recovered muscles
    if (sortedMuscles.length > 0) {
      const topMuscle = sortedMuscles[0];
      const recoveryPercent = Math.round(muscleRecovery[topMuscle] * 100);
      
      if (recoveryPercent >= 85) {
        recommendations.push({
          type: 'workout',
          text: `${topMuscle} is well-recovered (${recoveryPercent}%). Optimal for training today.`
        });
      }
    }
    
    // Warn about under-recovered muscles
    const underRecoveredMuscles = sortedMuscles.filter(
      muscle => muscleRecovery[muscle] < 0.4
    ).slice(0, 2); // Limit to 2 warnings
    
    for (const muscle of underRecoveredMuscles) {
      const recoveryPercent = Math.round(muscleRecovery[muscle] * 100);
      recommendations.push({
        type: 'rest',
        text: `Avoid training ${muscle} today (only ${recoveryPercent}% recovered).`
      });
    }
    
    return recommendations;
  }
  
  /**
   * Checks if user can perform a specific exercise
   * @param {string} exerciseName - Name of the exercise to check
   * @returns {Object} - {canPerform, reason, muscleReadiness}
   */
  canPerformExercise(exerciseName) {
    // Find the exercise in predefined exercises or recent history
    const exerciseInfo = this.findExerciseInfo(exerciseName);
    if (!exerciseInfo) {
      return { 
        canPerform: true, 
        reason: "No data about this exercise",
        muscleReadiness: {}
      };
    }
    
    const currentStress = this.getCurrentStressLevels();
    const muscleReadiness = {};
    let limitingMuscle = null;
    let lowestReadiness = 1.0;
    
    for (const muscle in exerciseInfo.stressMap) {
      // Calculate readiness as 1 - currentStress
      const readiness = 1 - (currentStress[muscle] || 0);
      muscleReadiness[muscle] = readiness;
      
      if (readiness < lowestReadiness) {
        lowestReadiness = readiness;
        limitingMuscle = muscle;
      }
    }
    
    // If any primary muscle is below 40% readiness, don't recommend
    if (lowestReadiness < 0.4) {
      return {
        canPerform: false,
        reason: `${limitingMuscle} needs more recovery (${Math.round(lowestReadiness * 100)}% ready)`,
        muscleReadiness
      };
    }
    
    return {
      canPerform: true,
      muscleReadiness
    };
  }
  
  /**
   * Get personalized exercise recommendations based on recovery status
   * @returns {Array} - List of recommended exercises
   */
  getRecommendedExercises() {
    const stressLevels = this.getCurrentStressLevels();
    const recommendations = [];
    
    // Define muscle groups
    const muscleGroups = {
      'Push': ['Chest', 'Triceps', 'Shoulders'],
      'Pull': ['Back', 'Biceps', 'Forearms'],
      'Legs': ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
      'Core': ['Core']
    };
    
    // Check readiness of each muscle group
    for (const group in muscleGroups) {
      const muscles = muscleGroups[group];
      let groupReadiness = 0;
      let limitingMuscle = null;
      let limitingReadiness = 1.0;
      
      // Calculate average group readiness
      muscles.forEach(muscle => {
        const stress = stressLevels[muscle] || 0;
        const readiness = 1 - stress;
        groupReadiness += readiness;
        
        if (readiness < limitingReadiness) {
          limitingReadiness = readiness;
          limitingMuscle = muscle;
        }
      });
      
      groupReadiness = groupReadiness / muscles.length;
      
      // Round to whole percentage
      const recoveryPercentage = Math.round(groupReadiness * 100);
      
      // Create recommendation based on readiness
      let type = 'Not Recommended';
      if (groupReadiness >= 0.85) {
        type = 'Optimal Training';
      } else if (groupReadiness >= 0.7) {
        type = 'Ready for Training';
      } else if (groupReadiness >= 0.5) {
        type = 'Light Training';
      } else if (groupReadiness >= 0.3) {
        type = 'Active Recovery';
      }
      
      recommendations.push({
        type,
        name: `${group} Muscles`,
        details: limitingMuscle ? `Limiting factor: ${limitingMuscle} (${Math.round(limitingReadiness * 100)}% recovered)` : '',
        recoveryPercentage,
        primaryMuscles: muscles
      });
    }
    
    // Sort by readiness (highest first)
    return recommendations.sort((a, b) => b.recoveryPercentage - a.recoveryPercentage);
  }
  
  /**
   * Finds exercise information from history or predefined data
   * @param {string} exerciseName - Name of the exercise
   * @returns {Object|null} - Exercise information or null if not found
   */
  findExerciseInfo(exerciseName) {
    // First check our own history
    const historyEntry = this.exerciseHistory.find(entry => entry.name === exerciseName);
    if (historyEntry && Object.keys(historyEntry.stressMap).length > 0) {
      return {
        name: exerciseName,
        stressMap: historyEntry.stressMap
      };
    }
    
    // If not in history, check if it's a known exercise in any progression path
    // This requires us to look through all predefined paths
    const paths = {
      'pushup': ProgressionPath.createPath('pushup').exercises,
      'squat': ProgressionPath.createPath('squat').exercises,
      'pullup': ProgressionPath.createPath('pullup').exercises
    };
    
    for (const pathName in paths) {
      const exercises = paths[pathName];
      const match = exercises.find(ex => ex.name === exerciseName);
      if (match && match.stress) {
        return {
          name: exerciseName,
          stressMap: match.stress
        };
      }
    }
    
    return null;
  }
  
  /**
   * Saves history to localStorage
   */
  saveHistory() {
    localStorage.setItem('biomechanical_history', JSON.stringify({
      exerciseHistory: this.exerciseHistory,
      muscleStressHistory: this.muscleStressHistory
    }));
  }
  
  /**
   * Loads history from localStorage
   */
  loadHistory() {
    const saved = localStorage.getItem('biomechanical_history');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.exerciseHistory = data.exerciseHistory || [];
        this.muscleStressHistory = data.muscleStressHistory || {};
      } catch (e) {
        console.error('Failed to load biomechanical history:', e);
      }
    }
  }
  
  /**
   * Clears all history data
   */
  clearHistory() {
    this.exerciseHistory = [];
    this.muscleStressHistory = {};
    localStorage.removeItem('biomechanical_history');
  }
}

export default BiomechanicalAnalyzer; 