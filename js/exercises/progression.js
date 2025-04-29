/**
 * Exercise Progression System
 * Handles progression paths between exercises based on difficulty and biomechanics
 */

import { calculateExerciseJointStress } from '../biomechanics.js';

// Progression types for moving between exercise variations
export const PROGRESSION_TYPES = {
  LINEAR: 'linear',               // Straightforward progression path
  BRANCHING: 'branching',         // Multiple possible progressions
  PREREQUISITE: 'prerequisite',   // Requires mastery of another exercise
  LATERAL: 'lateral',             // Similar difficulty, different emphasis
  REGRESSION: 'regression',        // Easier variation of exercise
  LEVERAGE: 'leverage',           // Changing body position to increase/decrease difficulty
  STABILITY: 'stability',         // Changing base of support
  ASSISTANCE: 'assistance',       // Adding/removing assistance (bands, reduced ROM)
  RESISTANCE: 'resistance',       // Adding/modifying external resistance
  COMPLEXITY: 'complexity',       // Adding movement complexity
  INTENSITY: 'intensity',         // Increasing work rate/reducing rest
  VOLUME: 'volume'                // Increasing reps/sets/time under tension
};

// Difficulty levels for exercise proficiency
export const DIFFICULTY_LEVELS = {
  BEGINNER: 1,
  NOVICE: 2,
  INTERMEDIATE: 3,
  ADVANCED: 4,
  ELITE: 5
};

/**
 * Creates a progression path between exercises
 */
export class ProgressionPath {
  /**
   * Creates a new progression path
   * @param {string} fromExerciseId - Starting exercise ID
   * @param {string} toExerciseId - Target exercise ID
   * @param {string} type - Progression type from PROGRESSION_TYPES
   * @param {Object} options - Additional progression options
   */
  constructor(fromExerciseId, toExerciseId, type, options = {}) {
    this.fromExerciseId = fromExerciseId;
    this.toExerciseId = toExerciseId;
    this.type = PROGRESSION_TYPES[type.toUpperCase()] || type;
    this.difficultyIncrease = options.difficultyIncrease || 1;
    this.prerequisiteIds = options.prerequisiteIds || [];
    this.biomechanicalChange = options.biomechanicalChange || {};
    this.notes = options.notes || '';
    this.timeEstimate = options.timeEstimate || '2-4 weeks';
  }
  
  /**
   * Check if user meets the prerequisites for this progression
   * @param {Object} userExerciseHistory - User's exercise history and proficiency
   * @returns {boolean} Whether prerequisites are met
   */
  meetsPrerequisites(userExerciseHistory) {
    if (!this.prerequisiteIds.length) {
      return true;
    }
    
    return this.prerequisiteIds.every(exerciseId => {
      const exercise = userExerciseHistory[exerciseId];
      return exercise && exercise.proficiency >= DIFFICULTY_LEVELS.INTERMEDIATE;
    });
  }
  
  /**
   * Calculate recommended load adjustment for progression
   * @param {number} currentLoad - Current exercise load
   * @returns {number} Recommended new load
   */
  calculateLoadAdjustment(currentLoad) {
    switch(this.type) {
      case PROGRESSION_TYPES.LINEAR:
        return currentLoad * 1.05; // 5% increase
        
      case PROGRESSION_TYPES.BRANCHING:
        return currentLoad * 0.9; // 10% decrease when learning new variation
        
      case PROGRESSION_TYPES.PREREQUISITE:
        return currentLoad * 0.8; // 20% decrease for challenging progressions
        
      case PROGRESSION_TYPES.LATERAL:
        return currentLoad; // Same load for lateral progressions
        
      case PROGRESSION_TYPES.REGRESSION:
        return currentLoad * 1.2; // 20% increase when moving to an easier variation
        
      default:
        return currentLoad * 0.9;
    }
  }
  
  /**
   * Calculate recommended volume adjustment for progression
   * @param {number} currentSets - Current number of sets
   * @param {number} currentReps - Current number of reps
   * @returns {Object} Recommended new sets and reps
   */
  calculateVolumeAdjustment(currentSets, currentReps) {
    switch(this.type) {
      case PROGRESSION_TYPES.LINEAR:
        return {
          sets: currentSets,
          reps: Math.max(Math.floor(currentReps * 0.8), 5) // 20% fewer reps, minimum 5
        };
        
      case PROGRESSION_TYPES.BRANCHING:
        return {
          sets: Math.max(currentSets - 1, 2), // 1 fewer set, minimum 2
          reps: Math.max(Math.floor(currentReps * 0.7), 3) // 30% fewer reps, minimum 3
        };
        
      case PROGRESSION_TYPES.PREREQUISITE:
        return {
          sets: 2, // Start with minimal volume
          reps: 5
        };
        
      case PROGRESSION_TYPES.LATERAL:
        return {
          sets: currentSets,
          reps: currentReps
        };
        
      case PROGRESSION_TYPES.REGRESSION:
        return {
          sets: currentSets,
          reps: currentReps + 2 // Add 2 reps for regressions
        };
        
      default:
        return {
          sets: currentSets,
          reps: currentReps
        };
    }
  }
  
  /**
   * Convert the progression path to a JSON object
   * @returns {Object} JSON representation of the progression path
   */
  toJSON() {
    return {
      fromExerciseId: this.fromExerciseId,
      toExerciseId: this.toExerciseId,
      type: this.type,
      difficultyIncrease: this.difficultyIncrease,
      prerequisiteIds: [...this.prerequisiteIds],
      biomechanicalChange: {...this.biomechanicalChange},
      notes: this.notes,
      timeEstimate: this.timeEstimate
    };
  }
  
  /**
   * Create a ProgressionPath from a JSON object
   * @param {Object} json - JSON representation of the progression path
   * @returns {ProgressionPath} New ProgressionPath instance
   */
  static fromJSON(json) {
    return new ProgressionPath(
      json.fromExerciseId,
      json.toExerciseId,
      json.type,
      {
        difficultyIncrease: json.difficultyIncrease,
        prerequisiteIds: json.prerequisiteIds || [],
        biomechanicalChange: json.biomechanicalChange || {},
        notes: json.notes,
        timeEstimate: json.timeEstimate
      }
    );
  }
}

/**
 * Manages a full progression graph of exercises
 */
export class ProgressionSystem {
  constructor() {
    // Adjacency list representation of progression graph
    this.progressions = {};
    this.exerciseDifficulty = {};
  }
  
  /**
   * Add a progression between exercises
   * @param {ProgressionPath} progressionPath - Progression path to add
   * @returns {ProgressionSystem} This instance for chaining
   */
  addProgression(progressionPath) {
    const { fromExerciseId, toExerciseId } = progressionPath;
    
    // Initialize arrays if they don't exist
    if (!this.progressions[fromExerciseId]) {
      this.progressions[fromExerciseId] = [];
    }
    
    // Add progression to adjacency list
    this.progressions[fromExerciseId].push(progressionPath);
    
    return this;
  }
  
  /**
   * Set difficulty level for an exercise
   * @param {string} exerciseId - Exercise ID
   * @param {number} difficultyLevel - Difficulty level from DIFFICULTY_LEVELS
   * @returns {ProgressionSystem} This instance for chaining
   */
  setExerciseDifficulty(exerciseId, difficultyLevel) {
    this.exerciseDifficulty[exerciseId] = difficultyLevel;
    return this;
  }
  
  /**
   * Get all possible progressions from an exercise
   * @param {string} exerciseId - Starting exercise ID
   * @returns {Array} List of progression paths
   */
  getProgressionsFrom(exerciseId) {
    return this.progressions[exerciseId] || [];
  }
  
  /**
   * Find all exercises that progress to the given exercise
   * @param {string} exerciseId - Target exercise ID
   * @returns {Array} List of progression paths
   */
  getProgressionsTo(exerciseId) {
    const incomingProgressions = [];
    
    // Search all progression lists for paths leading to this exercise
    Object.keys(this.progressions).forEach(fromId => {
      this.progressions[fromId].forEach(progressionPath => {
        if (progressionPath.toExerciseId === exerciseId) {
          incomingProgressions.push(progressionPath);
        }
      });
    });
    
    return incomingProgressions;
  }
  
  /**
   * Find appropriate progression for a user based on their capabilities
   * @param {Object} userProfile - User profile with experience and capabilities
   * @param {string} exerciseId - Current exercise ID
   * @returns {ProgressionPath} Recommended progression path
   */
  findRecommendedProgression(userProfile, exerciseId) {
    const possibleProgressions = this.getProgressionsFrom(exerciseId);
    
    if (!possibleProgressions.length) {
      return null;
    }
    
    // Filter progressions by prerequisites
    const validProgressions = possibleProgressions.filter(
      progression => progression.meetsPrerequisites(userProfile.exerciseHistory)
    );
    
    if (!validProgressions.length) {
      return null;
    }
    
    // Calculate joint stress for user's current exercise data
    const exerciseData = userProfile.exerciseHistory[exerciseId] || {};
    const currentJointStress = calculateExerciseJointStress({
      exerciseId,
      load: exerciseData.load || 0,
      reps: exerciseData.reps || 0,
      sets: exerciseData.sets || 0,
      technique: exerciseData.technique || 'good'
    });
    
    // Find progressions that won't exceed user's biomechanical limits
    const safeProgressions = validProgressions.filter(progression => {
      // Get target exercise data (if user has performed it before)
      const targetExerciseData = userProfile.exerciseHistory[progression.toExerciseId] || {};
      
      // Estimate joint stress for target exercise using load adjustment
      const estimatedLoad = progression.calculateLoadAdjustment(exerciseData.load || 0);
      const volumeAdjustment = progression.calculateVolumeAdjustment(
        exerciseData.sets || 3,
        exerciseData.reps || 10
      );
      
      const estimatedJointStress = calculateExerciseJointStress({
        exerciseId: progression.toExerciseId,
        load: estimatedLoad,
        reps: volumeAdjustment.reps,
        sets: volumeAdjustment.sets,
        technique: 'moderate' // Assume moderate technique for new progression
      });
      
      // Check if increased joint stress stays within user's capabilities
      const jointLimits = userProfile.jointLimits || {};
      
      for (const [joint, stress] of Object.entries(estimatedJointStress)) {
        const userLimit = jointLimits[joint] || 10; // Default limit
        if (stress > userLimit * 0.8) { // More than 80% of user's limit
          return false;
        }
      }
      
      return true;
    });
    
    if (!safeProgressions.length) {
      return null;
    }
    
    // Sort progressions by difficulty and select appropriate one based on user level
    safeProgressions.sort((a, b) => {
      const diffA = this.exerciseDifficulty[a.toExerciseId] || 0;
      const diffB = this.exerciseDifficulty[b.toExerciseId] || 0;
      return diffA - diffB;
    });
    
    const userLevel = userProfile.experienceLevel || 'beginner';
    
    switch(userLevel.toLowerCase()) {
      case 'beginner':
        // Beginners get easiest progression
        return safeProgressions[0];
        
      case 'intermediate':
        // Intermediates get middle difficulty progression
        const midIndex = Math.floor(safeProgressions.length / 2);
        return safeProgressions[midIndex];
        
      case 'advanced':
        // Advanced users get the most challenging progression
        return safeProgressions[safeProgressions.length - 1];
        
      default:
        // Default to easiest progression
        return safeProgressions[0];
    }
  }
  
  /**
   * Calculate a full progression roadmap for a user
   * @param {Object} userProfile - User profile
   * @param {string} startExerciseId - Starting exercise ID
   * @param {string} goalExerciseId - Target exercise ID
   * @returns {Array} Ordered list of progression paths
   */
  calculateProgressionRoadmap(userProfile, startExerciseId, goalExerciseId) {
    // If already at goal, return empty path
    if (startExerciseId === goalExerciseId) {
      return [];
    }
    
    // BFS to find shortest path
    const queue = [{
      exerciseId: startExerciseId,
      path: []
    }];
    const visited = new Set([startExerciseId]);
    
    while (queue.length > 0) {
      const { exerciseId, path } = queue.shift();
      const progressions = this.getProgressionsFrom(exerciseId);
      
      for (const progression of progressions) {
        const nextExerciseId = progression.toExerciseId;
        
        if (nextExerciseId === goalExerciseId) {
          // Found goal, return path
          return [...path, progression];
        }
        
        if (!visited.has(nextExerciseId)) {
          visited.add(nextExerciseId);
          queue.push({
            exerciseId: nextExerciseId,
            path: [...path, progression]
          });
        }
      }
    }
    
    // No path found
    return null;
  }
  
  /**
   * Make a regression recommendation when user struggles with an exercise
   * @param {Object} userProfile - User profile
   * @param {string} exerciseId - Difficult exercise ID
   * @returns {ProgressionPath} Recommended regression
   */
  findRecommendedRegression(userProfile, exerciseId) {
    const incomingProgressions = this.getProgressionsTo(exerciseId);
    
    if (!incomingProgressions.length) {
      return null;
    }
    
    // Find regressions (exercises that lead to this one)
    const regressions = incomingProgressions.map(progression => {
      // Create a reversed regression path
      return new ProgressionPath(
        exerciseId,
        progression.fromExerciseId,
        PROGRESSION_TYPES.REGRESSION,
        {
          difficultyIncrease: -progression.difficultyIncrease,
          biomechanicalChange: progression.biomechanicalChange,
          notes: `Regression from ${exerciseId} to build necessary strength and technique.`,
          timeEstimate: '1-3 weeks'
        }
      );
    });
    
    // Sort by smallest difficulty decrease
    regressions.sort((a, b) => b.difficultyIncrease - a.difficultyIncrease);
    
    // Return the regression with the smallest difficulty decrease
    return regressions[0];
  }
  
  /**
   * Convert the progression system to a JSON object
   * @returns {Object} JSON representation
   */
  toJSON() {
    const serializedProgressions = {};
    
    Object.keys(this.progressions).forEach(fromId => {
      serializedProgressions[fromId] = this.progressions[fromId].map(
        progression => progression.toJSON()
      );
    });
    
    return {
      progressions: serializedProgressions,
      exerciseDifficulty: {...this.exerciseDifficulty}
    };
  }
  
  /**
   * Create a ProgressionSystem from a JSON object
   * @param {Object} json - JSON representation
   * @returns {ProgressionSystem} New ProgressionSystem instance
   */
  static fromJSON(json) {
    const system = new ProgressionSystem();
    
    // Load exercise difficulties
    if (json.exerciseDifficulty) {
      Object.keys(json.exerciseDifficulty).forEach(exerciseId => {
        system.exerciseDifficulty[exerciseId] = json.exerciseDifficulty[exerciseId];
      });
    }
    
    // Load progressions
    if (json.progressions) {
      Object.keys(json.progressions).forEach(fromId => {
        json.progressions[fromId].forEach(progressionData => {
          const progression = ProgressionPath.fromJSON(progressionData);
          system.addProgression(progression);
        });
      });
    }
    
    return system;
  }
}

// Pre-defined progression paths for common exercises
export const DEFAULT_PROGRESSIONS = [
  // Push-up progression
  new ProgressionPath(
    'wall_push_up',
    'incline_push_up',
    PROGRESSION_TYPES.LINEAR,
    {
      difficultyIncrease: 1,
      notes: 'Decrease incline angle gradually over time',
      timeEstimate: '2-4 weeks'
    }
  ),
  new ProgressionPath(
    'incline_push_up',
    'knee_push_up',
    PROGRESSION_TYPES.LINEAR,
    {
      difficultyIncrease: 1,
      notes: 'Focus on maintaining proper plank position',
      timeEstimate: '3-6 weeks'
    }
  ),
  new ProgressionPath(
    'knee_push_up',
    'push_up',
    PROGRESSION_TYPES.LINEAR,
    {
      difficultyIncrease: 1,
      biomechanicalChange: {
        shoulder: 1.2,
        elbow: 1.1
      },
      notes: 'Ensure full scapular protraction at top of movement',
      timeEstimate: '4-8 weeks'
    }
  ),
  new ProgressionPath(
    'push_up',
    'decline_push_up',
    PROGRESSION_TYPES.LINEAR,
    {
      difficultyIncrease: 1,
      biomechanicalChange: {
        shoulder: 1.3,
        wrist: 1.2
      },
      notes: 'Gradually increase decline angle',
      timeEstimate: '4-8 weeks'
    }
  ),
  new ProgressionPath(
    'push_up',
    'diamond_push_up',
    PROGRESSION_TYPES.BRANCHING,
    {
      difficultyIncrease: 1,
      biomechanicalChange: {
        elbow: 1.4,
        wrist: 1.3
      },
      notes: 'Places greater emphasis on triceps',
      timeEstimate: '3-6 weeks'
    }
  ),
  new ProgressionPath(
    'push_up',
    'archer_push_up',
    PROGRESSION_TYPES.BRANCHING,
    {
      difficultyIncrease: 2,
      prerequisiteIds: ['diamond_push_up'],
      biomechanicalChange: {
        shoulder: 1.5,
        elbow: 1.3
      },
      notes: 'Unilateral progression toward one-arm push-up',
      timeEstimate: '6-12 weeks'
    }
  ),
  
  // Squat progression
  new ProgressionPath(
    'chair_assisted_squat',
    'bodyweight_squat',
    PROGRESSION_TYPES.LINEAR,
    {
      difficultyIncrease: 1,
      notes: 'Gradually reduce assistance from chair',
      timeEstimate: '3-6 weeks'
    }
  ),
  new ProgressionPath(
    'bodyweight_squat',
    'goblet_squat',
    PROGRESSION_TYPES.LINEAR,
    {
      difficultyIncrease: 1,
      biomechanicalChange: {
        knee: 1.2,
        hip: 1.1
      },
      notes: 'Start with light weight, focus on depth',
      timeEstimate: '3-5 weeks'
    }
  ),
  new ProgressionPath(
    'goblet_squat',
    'barbell_back_squat',
    PROGRESSION_TYPES.LINEAR,
    {
      difficultyIncrease: 1,
      biomechanicalChange: {
        spine: 1.4,
        knee: 1.2,
        hip: 1.3
      },
      notes: 'Start with empty bar, focus on form',
      timeEstimate: '4-8 weeks'
    }
  ),
  new ProgressionPath(
    'goblet_squat',
    'barbell_front_squat',
    PROGRESSION_TYPES.BRANCHING,
    {
      difficultyIncrease: 1,
      biomechanicalChange: {
        knee: 1.3,
        wrist: 1.4
      },
      notes: 'Requires good mobility, more quad dominant',
      timeEstimate: '5-10 weeks'
    }
  ),
  new ProgressionPath(
    'barbell_back_squat',
    'barbell_box_squat',
    PROGRESSION_TYPES.LATERAL,
    {
      difficultyIncrease: 0,
      notes: 'Helpful for learning proper depth and sitting back',
      timeEstimate: '2-4 weeks'
    }
  ),
  new ProgressionPath(
    'barbell_back_squat',
    'pause_squat',
    PROGRESSION_TYPES.BRANCHING,
    {
      difficultyIncrease: 1,
      notes: 'Hold at bottom position for 2-3 seconds',
      timeEstimate: '3-6 weeks'
    }
  ),
  
  // Pull-up progression
  new ProgressionPath(
    'dead_hang',
    'active_hang',
    PROGRESSION_TYPES.LINEAR,
    {
      difficultyIncrease: 1,
      notes: 'Engage shoulder by pulling scapula down',
      timeEstimate: '2-4 weeks'
    }
  ),
  new ProgressionPath(
    'active_hang',
    'negative_pull_up',
    PROGRESSION_TYPES.LINEAR,
    {
      difficultyIncrease: 1,
      biomechanicalChange: {
        elbow: 1.3,
        shoulder: 1.4
      },
      notes: 'Jump to top position, lower slowly (3-5 seconds)',
      timeEstimate: '4-8 weeks'
    }
  ),
  new ProgressionPath(
    'negative_pull_up',
    'band_assisted_pull_up',
    PROGRESSION_TYPES.LINEAR,
    {
      difficultyIncrease: 1,
      notes: 'Gradually use thinner bands as strength improves',
      timeEstimate: '6-12 weeks'
    }
  ),
  new ProgressionPath(
    'band_assisted_pull_up',
    'pull_up',
    PROGRESSION_TYPES.LINEAR,
    {
      difficultyIncrease: 1,
      biomechanicalChange: {
        elbow: 1.5,
        shoulder: 1.6
      },
      notes: 'Focus on full range of motion',
      timeEstimate: '8-16 weeks'
    }
  ),
  new ProgressionPath(
    'pull_up',
    'weighted_pull_up',
    PROGRESSION_TYPES.LINEAR,
    {
      difficultyIncrease: 1,
      prerequisiteIds: ['pull_up'],
      biomechanicalChange: {
        elbow: 1.7,
        shoulder: 1.8
      },
      notes: 'Start with 5-10% of bodyweight',
      timeEstimate: '6-12 weeks'
    }
  ),
  new ProgressionPath(
    'pull_up',
    'l_sit_pull_up',
    PROGRESSION_TYPES.BRANCHING,
    {
      difficultyIncrease: 2,
      prerequisiteIds: ['pull_up', 'hanging_knee_raise'],
      biomechanicalChange: {
        shoulder: 1.6,
        hip: 1.3,
        abdominals: 1.4
      },
      notes: 'Combines core strength with pulling',
      timeEstimate: '8-16 weeks'
    }
  )
];

/**
 * Initialize a progression system with default progressions
 * @returns {ProgressionSystem} Initialized progression system
 */
export function createDefaultProgressionSystem() {
  const system = new ProgressionSystem();
  
  // Set difficulties for push-up variations
  system.setExerciseDifficulty('wall_push_up', DIFFICULTY_LEVELS.BEGINNER);
  system.setExerciseDifficulty('incline_push_up', DIFFICULTY_LEVELS.BEGINNER);
  system.setExerciseDifficulty('knee_push_up', DIFFICULTY_LEVELS.BEGINNER);
  system.setExerciseDifficulty('push_up', DIFFICULTY_LEVELS.NOVICE);
  system.setExerciseDifficulty('decline_push_up', DIFFICULTY_LEVELS.INTERMEDIATE);
  system.setExerciseDifficulty('diamond_push_up', DIFFICULTY_LEVELS.INTERMEDIATE);
  system.setExerciseDifficulty('archer_push_up', DIFFICULTY_LEVELS.ADVANCED);
  
  // Set difficulties for squat variations
  system.setExerciseDifficulty('chair_assisted_squat', DIFFICULTY_LEVELS.BEGINNER);
  system.setExerciseDifficulty('bodyweight_squat', DIFFICULTY_LEVELS.BEGINNER);
  system.setExerciseDifficulty('goblet_squat', DIFFICULTY_LEVELS.NOVICE);
  system.setExerciseDifficulty('barbell_back_squat', DIFFICULTY_LEVELS.INTERMEDIATE);
  system.setExerciseDifficulty('barbell_front_squat', DIFFICULTY_LEVELS.INTERMEDIATE);
  system.setExerciseDifficulty('barbell_box_squat', DIFFICULTY_LEVELS.INTERMEDIATE);
  system.setExerciseDifficulty('pause_squat', DIFFICULTY_LEVELS.ADVANCED);
  
  // Set difficulties for pull-up variations
  system.setExerciseDifficulty('dead_hang', DIFFICULTY_LEVELS.BEGINNER);
  system.setExerciseDifficulty('active_hang', DIFFICULTY_LEVELS.BEGINNER);
  system.setExerciseDifficulty('negative_pull_up', DIFFICULTY_LEVELS.NOVICE);
  system.setExerciseDifficulty('band_assisted_pull_up', DIFFICULTY_LEVELS.NOVICE);
  system.setExerciseDifficulty('pull_up', DIFFICULTY_LEVELS.INTERMEDIATE);
  system.setExerciseDifficulty('weighted_pull_up', DIFFICULTY_LEVELS.ADVANCED);
  system.setExerciseDifficulty('l_sit_pull_up', DIFFICULTY_LEVELS.ADVANCED);
  
  // Add default progressions
  DEFAULT_PROGRESSIONS.forEach(progression => {
    system.addProgression(progression);
  });
  
  return system;
}

export default {
  PROGRESSION_TYPES,
  DIFFICULTY_LEVELS,
  ProgressionPath,
  ProgressionSystem,
  DEFAULT_PROGRESSIONS,
  createDefaultProgressionSystem
}; 