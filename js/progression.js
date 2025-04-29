/**
 * Exercise Progression System
 * Manages exercise difficulty progressions, paths and recommendations
 */

class ExerciseProgression {
  constructor() {
    this.progressionPaths = {};
    this.userProgress = {};
    this.biomechanicsAnalyzer = new BiomechanicalAnalyzer();
    this.initializeProgressionPaths();
  }

  /**
   * Initialize predefined progression paths for common exercises
   */
  initializeProgressionPaths() {
    // Push progression path
    this.progressionPaths['push'] = {
      name: 'Push Progression',
      description: 'Progressive overload for pushing movements',
      path: [
        {
          id: 'wall_push_up',
          name: 'Wall Push-up',
          level: 'beginner',
          type: 'leverage',
          prerequisites: [],
          stressScore: 1
        },
        {
          id: 'incline_push_up',
          name: 'Incline Push-up',
          level: 'beginner',
          type: 'leverage',
          prerequisites: ['wall_push_up'],
          stressScore: 2
        },
        {
          id: 'knee_push_up',
          name: 'Knee Push-up',
          level: 'beginner',
          type: 'leverage',
          prerequisites: ['incline_push_up'],
          stressScore: 3
        },
        {
          id: 'push_up',
          name: 'Push-up',
          level: 'intermediate',
          type: 'leverage',
          prerequisites: ['knee_push_up'],
          stressScore: 4
        },
        {
          id: 'diamond_push_up',
          name: 'Diamond Push-up',
          level: 'intermediate',
          type: 'leverage',
          prerequisites: ['push_up'],
          stressScore: 5
        },
        {
          id: 'decline_push_up',
          name: 'Decline Push-up',
          level: 'intermediate',
          type: 'leverage',
          prerequisites: ['push_up'],
          stressScore: 5
        },
        {
          id: 'archer_push_up',
          name: 'Archer Push-up',
          level: 'advanced',
          type: 'leverage',
          prerequisites: ['diamond_push_up', 'decline_push_up'],
          stressScore: 6
        },
        {
          id: 'one_arm_push_up_progression',
          name: 'One-arm Push-up Progression',
          level: 'advanced',
          type: 'stability',
          prerequisites: ['archer_push_up'],
          stressScore: 7
        },
        {
          id: 'one_arm_push_up',
          name: 'One-arm Push-up',
          level: 'elite',
          type: 'stability',
          prerequisites: ['one_arm_push_up_progression'],
          stressScore: 8
        }
      ]
    };

    // Pull progression path
    this.progressionPaths['pull'] = {
      name: 'Pull Progression',
      description: 'Progressive overload for pulling movements',
      path: [
        {
          id: 'supine_row',
          name: 'Supine Row (with feet on ground)',
          level: 'beginner',
          type: 'leverage',
          prerequisites: [],
          stressScore: 1
        },
        {
          id: 'incline_row',
          name: 'Incline Row',
          level: 'beginner',
          type: 'leverage',
          prerequisites: ['supine_row'],
          stressScore: 2
        },
        {
          id: 'horizontal_row',
          name: 'Horizontal Row',
          level: 'intermediate',
          type: 'leverage',
          prerequisites: ['incline_row'],
          stressScore: 3
        },
        {
          id: 'wide_row',
          name: 'Wide Row',
          level: 'intermediate',
          type: 'leverage',
          prerequisites: ['horizontal_row'],
          stressScore: 4
        },
        {
          id: 'archer_row',
          name: 'Archer Row',
          level: 'advanced',
          type: 'leverage',
          prerequisites: ['wide_row'],
          stressScore: 5
        },
        {
          id: 'assisted_one_arm_row',
          name: 'Assisted One-arm Row',
          level: 'advanced',
          type: 'stability',
          prerequisites: ['archer_row'],
          stressScore: 6
        },
        {
          id: 'one_arm_row',
          name: 'One-arm Row',
          level: 'elite',
          type: 'stability',
          prerequisites: ['assisted_one_arm_row'],
          stressScore: 7
        }
      ]
    };

    // Squat progression path
    this.progressionPaths['squat'] = {
      name: 'Squat Progression',
      description: 'Progressive overload for squatting movements',
      path: [
        {
          id: 'assisted_squat',
          name: 'Assisted Squat',
          level: 'beginner',
          type: 'assistance',
          prerequisites: [],
          stressScore: 1
        },
        {
          id: 'squat',
          name: 'Bodyweight Squat',
          level: 'beginner',
          type: 'leverage',
          prerequisites: ['assisted_squat'],
          stressScore: 2
        },
        {
          id: 'split_squat',
          name: 'Split Squat',
          level: 'intermediate',
          type: 'leverage',
          prerequisites: ['squat'],
          stressScore: 3
        },
        {
          id: 'bulgarian_split_squat',
          name: 'Bulgarian Split Squat',
          level: 'intermediate',
          type: 'leverage',
          prerequisites: ['split_squat'],
          stressScore: 4
        },
        {
          id: 'shrimp_squat_progression',
          name: 'Shrimp Squat Progression',
          level: 'advanced',
          type: 'stability',
          prerequisites: ['bulgarian_split_squat'],
          stressScore: 5
        },
        {
          id: 'pistol_squat_progression',
          name: 'Pistol Squat Progression',
          level: 'advanced',
          type: 'stability',
          prerequisites: ['bulgarian_split_squat'],
          stressScore: 5
        },
        {
          id: 'shrimp_squat',
          name: 'Shrimp Squat',
          level: 'elite',
          type: 'stability',
          prerequisites: ['shrimp_squat_progression'],
          stressScore: 6
        },
        {
          id: 'pistol_squat',
          name: 'Pistol Squat',
          level: 'elite',
          type: 'stability',
          prerequisites: ['pistol_squat_progression'],
          stressScore: 6
        }
      ]
    };

    // Hinge progression path
    this.progressionPaths['hinge'] = {
      name: 'Hinge Progression',
      description: 'Progressive overload for hip hinge movements',
      path: [
        {
          id: 'glute_bridge',
          name: 'Glute Bridge',
          level: 'beginner',
          type: 'leverage',
          prerequisites: [],
          stressScore: 1
        },
        {
          id: 'elevated_glute_bridge',
          name: 'Elevated Glute Bridge',
          level: 'beginner',
          type: 'leverage',
          prerequisites: ['glute_bridge'],
          stressScore: 2
        },
        {
          id: 'single_leg_glute_bridge',
          name: 'Single-leg Glute Bridge',
          level: 'intermediate',
          type: 'stability',
          prerequisites: ['elevated_glute_bridge'],
          stressScore: 3
        },
        {
          id: 'romanian_deadlift',
          name: 'Romanian Deadlift',
          level: 'intermediate',
          type: 'leverage',
          prerequisites: ['single_leg_glute_bridge'],
          stressScore: 4
        },
        {
          id: 'single_leg_romanian_deadlift',
          name: 'Single-leg Romanian Deadlift',
          level: 'advanced',
          type: 'stability',
          prerequisites: ['romanian_deadlift'],
          stressScore: 5
        },
        {
          id: 'nordic_curl_progression',
          name: 'Nordic Curl Progression',
          level: 'advanced',
          type: 'leverage',
          prerequisites: ['single_leg_romanian_deadlift'],
          stressScore: 6
        },
        {
          id: 'nordic_curl',
          name: 'Nordic Curl',
          level: 'elite',
          type: 'leverage',
          prerequisites: ['nordic_curl_progression'],
          stressScore: 7
        }
      ]
    };
  }

  /**
   * Get all available progression paths
   * @returns {Object} All progression paths
   */
  getAllProgressionPaths() {
    return this.progressionPaths;
  }

  /**
   * Get a specific progression path by ID
   * @param {string} pathId - The ID of the progression path
   * @returns {Object|null} The progression path or null if not found
   */
  getProgressionPath(pathId) {
    return this.progressionPaths[pathId] || null;
  }

  /**
   * Calculate the user's current position in a specific progression path
   * @param {string} pathId - The ID of the progression path
   * @returns {Object} User's position and recommended next exercises
   */
  getUserProgressionStatus(pathId) {
    const path = this.getProgressionPath(pathId);
    if (!path) return null;

    // Initialize if not yet set
    if (!this.userProgress[pathId]) {
      this.userProgress[pathId] = {
        completed: [],
        current: path.path[0].id,
        locked: []
      };
    }

    const progress = this.userProgress[pathId];
    const result = {
      completedExercises: [],
      currentExercise: null,
      nextExercises: [],
      lockedExercises: []
    };

    // Map exercises to their status
    path.path.forEach(exercise => {
      const exerciseWithStatus = { ...exercise };
      
      if (progress.completed.includes(exercise.id)) {
        exerciseWithStatus.status = 'completed';
        result.completedExercises.push(exerciseWithStatus);
      } else if (exercise.id === progress.current) {
        exerciseWithStatus.status = 'current';
        result.currentExercise = exerciseWithStatus;
      } else if (this.isExerciseUnlocked(exercise, progress.completed)) {
        exerciseWithStatus.status = 'next';
        result.nextExercises.push(exerciseWithStatus);
      } else {
        exerciseWithStatus.status = 'locked';
        result.lockedExercises.push(exerciseWithStatus);
      }
    });

    return result;
  }

  /**
   * Check if an exercise is unlocked based on completed prerequisites
   * @param {Object} exercise - The exercise to check
   * @param {Array} completedExercises - Array of completed exercise IDs
   * @returns {boolean} Whether the exercise is unlocked
   */
  isExerciseUnlocked(exercise, completedExercises) {
    if (!exercise.prerequisites || exercise.prerequisites.length === 0) {
      return true;
    }

    // An exercise is unlocked if at least one of its prerequisites is completed
    return exercise.prerequisites.some(prereq => completedExercises.includes(prereq));
  }

  /**
   * Mark an exercise as completed
   * @param {string} pathId - The progression path ID
   * @param {string} exerciseId - The exercise ID to mark as completed
   */
  completeExercise(pathId, exerciseId) {
    if (!this.progressionPaths[pathId]) return false;
    
    // Initialize if not yet set
    if (!this.userProgress[pathId]) {
      this.userProgress[pathId] = {
        completed: [],
        current: this.progressionPaths[pathId].path[0].id,
        locked: []
      };
    }

    const progress = this.userProgress[pathId];
    
    // Already completed
    if (progress.completed.includes(exerciseId)) {
      return true;
    }
    
    // Add to completed
    progress.completed.push(exerciseId);
    
    // Find next exercise that's not completed yet
    const path = this.progressionPaths[pathId].path;
    const nextExercises = path.filter(ex => 
      !progress.completed.includes(ex.id) && 
      this.isExerciseUnlocked(ex, progress.completed)
    );
    
    if (nextExercises.length > 0) {
      // Sort by level and choose the first one
      nextExercises.sort((a, b) => {
        const levelOrder = { 'beginner': 0, 'intermediate': 1, 'advanced': 2, 'elite': 3 };
        return levelOrder[a.level] - levelOrder[b.level];
      });
      
      progress.current = nextExercises[0].id;
    } else {
      progress.current = null; // All exercises completed
    }
    
    return true;
  }

  /**
   * Set the current exercise for a progression path
   * @param {string} pathId - The progression path ID
   * @param {string} exerciseId - The exercise ID to set as current
   * @returns {boolean} Success status
   */
  setCurrentExercise(pathId, exerciseId) {
    if (!this.progressionPaths[pathId]) return false;
    
    // Initialize if not yet set
    if (!this.userProgress[pathId]) {
      this.userProgress[pathId] = {
        completed: [],
        current: this.progressionPaths[pathId].path[0].id,
        locked: []
      };
    }
    
    const path = this.progressionPaths[pathId].path;
    const exercise = path.find(ex => ex.id === exerciseId);
    
    if (!exercise) return false;
    
    // Check if exercise is unlocked
    if (!this.isExerciseUnlocked(exercise, this.userProgress[pathId].completed)) {
      return false;
    }
    
    this.userProgress[pathId].current = exerciseId;
    return true;
  }

  /**
   * Calculate recommended exercises based on progression status and biomechanical stress
   * @returns {Object} Recommended exercises for each progression path
   */
  getRecommendedExercises() {
    const recommendations = {};
    
    for (const pathId in this.progressionPaths) {
      const status = this.getUserProgressionStatus(pathId);
      if (!status) continue;
      
      const recoveryStatuses = this.biomechanicsAnalyzer.getAllMuscleRecoveryStatuses();
      const currentExercise = status.currentExercise;
      const nextExercises = status.nextExercises;
      
      // Calculate which exercises are suitable based on recovery status
      let suitableExercises = [];
      
      if (currentExercise) {
        const exerciseAttributes = this.getExerciseAttributes(currentExercise.id);
        const isRecovered = this.biomechanicsAnalyzer.canPerformExercise(exerciseAttributes);
        
        if (isRecovered) {
          suitableExercises.push({
            ...currentExercise,
            isRecovered: true,
            recoveryStatus: 100
          });
        } else {
          const recoveryPercent = this.biomechanicsAnalyzer.getExerciseRecoveryPercentage(exerciseAttributes);
          suitableExercises.push({
            ...currentExercise,
            isRecovered: false,
            recoveryStatus: recoveryPercent
          });
        }
      }
      
      // Also check next exercises
      nextExercises.forEach(exercise => {
        const exerciseAttributes = this.getExerciseAttributes(exercise.id);
        const isRecovered = this.biomechanicsAnalyzer.canPerformExercise(exerciseAttributes);
        const recoveryPercent = this.biomechanicsAnalyzer.getExerciseRecoveryPercentage(exerciseAttributes);
        
        suitableExercises.push({
          ...exercise,
          isRecovered: isRecovered,
          recoveryStatus: recoveryPercent
        });
      });
      
      // Sort by recovery status and then by progression order
      suitableExercises.sort((a, b) => {
        if (a.isRecovered && !b.isRecovered) return -1;
        if (!a.isRecovered && b.isRecovered) return 1;
        
        // If both are recovered or both are not, sort by progression order
        const indexA = this.progressionPaths[pathId].path.findIndex(ex => ex.id === a.id);
        const indexB = this.progressionPaths[pathId].path.findIndex(ex => ex.id === b.id);
        return indexA - indexB;
      });
      
      recommendations[pathId] = {
        pathName: this.progressionPaths[pathId].name,
        exercises: suitableExercises
      };
    }
    
    return recommendations;
  }

  /**
   * Get exercise attributes for biomechanical analysis
   * @param {string} exerciseId - The exercise ID
   * @returns {Object|null} Exercise attributes for biomechanical analysis
   */
  getExerciseAttributes(exerciseId) {
    // Find the exercise in all progression paths
    for (const pathId in this.progressionPaths) {
      const exercise = this.progressionPaths[pathId].path.find(ex => ex.id === exerciseId);
      if (exercise) {
        // Map to biomechanical attributes format
        // This is a simplified version - in a real app, you would have more detailed attributes
        return {
          name: exercise.name,
          primaryMuscles: this.mapExerciseToPrimaryMuscles(exercise.id, pathId),
          secondaryMuscles: this.mapExerciseToSecondaryMuscles(exercise.id, pathId),
          stressScore: exercise.stressScore || 3,
          recoveryTime: this.mapExerciseToRecoveryTime(exercise.id, exercise.level)
        };
      }
    }
    
    return null;
  }

  /**
   * Map exercise to primary muscles based on progression path
   * @param {string} exerciseId - The exercise ID
   * @param {string} pathId - The progression path ID
   * @returns {Array} Primary muscles worked
   */
  mapExerciseToPrimaryMuscles(exerciseId, pathId) {
    // This is a simplified mapping - would be more detailed in a real app
    const muscleGroups = {
      'push': [BiomechanicalAnalyzer.MUSCLE_GROUPS.CHEST, BiomechanicalAnalyzer.MUSCLE_GROUPS.TRICEPS, BiomechanicalAnalyzer.MUSCLE_GROUPS.SHOULDERS],
      'pull': [BiomechanicalAnalyzer.MUSCLE_GROUPS.BACK, BiomechanicalAnalyzer.MUSCLE_GROUPS.BICEPS, BiomechanicalAnalyzer.MUSCLE_GROUPS.REAR_DELTS],
      'squat': [BiomechanicalAnalyzer.MUSCLE_GROUPS.QUADS, BiomechanicalAnalyzer.MUSCLE_GROUPS.GLUTES],
      'hinge': [BiomechanicalAnalyzer.MUSCLE_GROUPS.HAMSTRINGS, BiomechanicalAnalyzer.MUSCLE_GROUPS.GLUTES, BiomechanicalAnalyzer.MUSCLE_GROUPS.LOWER_BACK]
    };
    
    return muscleGroups[pathId] || [];
  }

  /**
   * Map exercise to secondary muscles based on progression path
   * @param {string} exerciseId - The exercise ID
   * @param {string} pathId - The progression path ID
   * @returns {Array} Secondary muscles worked
   */
  mapExerciseToSecondaryMuscles(exerciseId, pathId) {
    // This is a simplified mapping - would be more detailed in a real app
    const secondaryMuscles = {
      'push': [BiomechanicalAnalyzer.MUSCLE_GROUPS.CORE, BiomechanicalAnalyzer.MUSCLE_GROUPS.UPPER_BACK],
      'pull': [BiomechanicalAnalyzer.MUSCLE_GROUPS.CORE, BiomechanicalAnalyzer.MUSCLE_GROUPS.FOREARMS],
      'squat': [BiomechanicalAnalyzer.MUSCLE_GROUPS.CORE, BiomechanicalAnalyzer.MUSCLE_GROUPS.HAMSTRINGS, BiomechanicalAnalyzer.MUSCLE_GROUPS.CALVES],
      'hinge': [BiomechanicalAnalyzer.MUSCLE_GROUPS.CORE, BiomechanicalAnalyzer.MUSCLE_GROUPS.QUADS, BiomechanicalAnalyzer.MUSCLE_GROUPS.CALVES]
    };
    
    return secondaryMuscles[pathId] || [];
  }

  /**
   * Map exercise to recovery time based on difficulty level
   * @param {string} exerciseId - The exercise ID
   * @param {string} level - The difficulty level
   * @returns {number} Recovery time in hours
   */
  mapExerciseToRecoveryTime(exerciseId, level) {
    // This is a simplified mapping - would be more detailed in a real app
    const recoveryTimes = {
      'beginner': 24,
      'intermediate': 36,
      'advanced': 48,
      'elite': 72
    };
    
    return recoveryTimes[level] || 48;
  }

  /**
   * Record an exercise performed by the user
   * @param {string} exerciseId - The exercise ID
   * @param {Object} performanceData - Data about the exercise performance
   */
  recordExercisePerformance(exerciseId, performanceData) {
    // Find the exercise
    const exerciseAttributes = this.getExerciseAttributes(exerciseId);
    if (!exerciseAttributes) return false;
    
    // Record in biomechanics analyzer
    this.biomechanicsAnalyzer.recordExercisePerformed(exerciseAttributes, performanceData);
    
    return true;
  }

  /**
   * Generate HTML for rendering a progression path
   * @param {string} pathId - The progression path ID
   * @returns {string} HTML for rendering the progression path
   */
  renderProgressionPathHTML(pathId) {
    const path = this.getProgressionPath(pathId);
    if (!path) return '<div>Progression path not found</div>';
    
    const status = this.getUserProgressionStatus(pathId);
    
    let html = `
      <div class="progression-container">
        <h3 class="progression-title">${path.name}</h3>
        <div class="progression-path">
    `;
    
    path.path.forEach((exercise, index) => {
      let statusClass = '';
      let statusActions = '';
      
      if (status.completedExercises.find(ex => ex.id === exercise.id)) {
        statusClass = 'completed';
        statusActions = `<span class="progression-action" onclick="progressionSystem.setCurrentExercise('${pathId}', '${exercise.id}')">Train Again</span>`;
      } else if (status.currentExercise && status.currentExercise.id === exercise.id) {
        statusClass = 'current';
        statusActions = `<span class="progression-action" onclick="progressionSystem.completeExercise('${pathId}', '${exercise.id}')">Mark Complete</span>`;
      } else if (status.nextExercises.find(ex => ex.id === exercise.id)) {
        statusClass = 'next';
        statusActions = `<span class="progression-action" onclick="progressionSystem.setCurrentExercise('${pathId}', '${exercise.id}')">Train This</span>`;
      } else {
        statusClass = 'locked';
        
        // Get prerequisite names
        const prerequisites = exercise.prerequisites.map(prereqId => {
          const prereq = path.path.find(ex => ex.id === prereqId);
          return prereq ? prereq.name : prereqId;
        }).join(', ');
        
        statusActions = `<span class="progression-node-type">Prerequisites: ${prerequisites}</span>`;
      }
      
      html += `
        <div class="progression-node ${statusClass}">
          <div class="progression-node-content">
            <div class="progression-node-left">
              <span class="progression-node-name">${exercise.name}</span>
              <span class="progression-node-level level-${exercise.level}">${exercise.level}</span>
              <span class="type-badge type-${exercise.type}">${exercise.type}</span>
            </div>
            <div class="progression-node-right">
              <div class="stress-indicator">
                <div class="stress-dot ${exercise.stressScore > 5 ? 'stress-high' : (exercise.stressScore > 3 ? 'stress-medium' : 'stress-low')}"></div>
                <span>Stress: ${exercise.stressScore}/10</span>
              </div>
              ${statusActions}
            </div>
          </div>
        </div>
      `;
      
      // Add arrow except for the last item
      if (index < path.path.length - 1) {
        html += `<div class="progression-arrow">↓</div>`;
      }
    });
    
    html += `
        </div>
      </div>
    `;
    
    return html;
  }

  /**
   * Generate HTML for rendering recommended exercises
   * @returns {string} HTML for recommended exercises
   */
  renderRecommendedExercisesHTML() {
    const recommendations = this.getRecommendedExercises();
    
    let html = `<div class="progression-container">
      <h3 class="progression-title">Recommended Exercises</h3>`;
    
    for (const pathId in recommendations) {
      const rec = recommendations[pathId];
      
      html += `
        <div class="progression-section">
          <h4>${rec.pathName}</h4>
          <div class="progression-recommendations">
      `;
      
      if (rec.exercises.length === 0) {
        html += `<p>No suitable exercises found in this path.</p>`;
      } else {
        rec.exercises.slice(0, 3).forEach(exercise => {
          const recoveryClass = exercise.isRecovered ? 'stress-low' : 'stress-medium';
          
          html += `
            <div class="progression-node ${exercise.isRecovered ? 'current' : 'future'}">
              <div class="progression-node-content">
                <div class="progression-node-left">
                  <span class="progression-node-name">${exercise.name}</span>
                  <span class="progression-node-level level-${exercise.level}">${exercise.level}</span>
                </div>
                <div class="progression-node-right">
                  <div class="stress-indicator">
                    <div class="stress-dot ${recoveryClass}"></div>
                    <span>Recovery: ${Math.round(exercise.recoveryStatus)}%</span>
                  </div>
                  <span class="progression-action" onclick="progressionSystem.setCurrentExercise('${pathId}', '${exercise.id}')">Select</span>
                </div>
              </div>
            </div>
          `;
        });
      }
      
      html += `
          </div>
        </div>
      `;
    }
    
    html += `</div>`;
    
    return html;
  }
}

// Initialize the progression system when the page loads
let progressionSystem;
document.addEventListener('DOMContentLoaded', () => {
  progressionSystem = new ExerciseProgression();
  
  // Render progression paths if containers exist
  const pushContainer = document.getElementById('push-progression');
  const pullContainer = document.getElementById('pull-progression');
  const squatContainer = document.getElementById('squat-progression');
  const hingeContainer = document.getElementById('hinge-progression');
  const recommendationsContainer = document.getElementById('exercise-recommendations');
  
  if (pushContainer) {
    pushContainer.innerHTML = progressionSystem.renderProgressionPathHTML('push');
  }
  
  if (pullContainer) {
    pullContainer.innerHTML = progressionSystem.renderProgressionPathHTML('pull');
  }
  
  if (squatContainer) {
    squatContainer.innerHTML = progressionSystem.renderProgressionPathHTML('squat');
  }
  
  if (hingeContainer) {
    hingeContainer.innerHTML = progressionSystem.renderProgressionPathHTML('hinge');
  }
  
  if (recommendationsContainer) {
    recommendationsContainer.innerHTML = progressionSystem.renderRecommendedExercisesHTML();
  }
}); 