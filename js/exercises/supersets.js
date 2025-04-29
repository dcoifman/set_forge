/**
 * Exercise Supersets and Groupings Module
 * Handles creating, managing, and recommending exercise combinations
 */

import { checkExerciseCompatibility, EXERCISE_ATTRIBUTES } from '../biomechanics.js';

/**
 * Types of exercise groupings
 */
export const GROUPING_TYPES = {
  SUPERSET: 'superset',           // Alternating exercises with minimal rest
  CIRCUIT: 'circuit',             // 3+ exercises performed in sequence
  COMPOUND_SET: 'compound_set',   // Multiple exercises for same muscle group
  COMPLEX: 'complex',             // Multiple exercises with same equipment/weight
  GIANT_SET: 'giant_set',         // 4+ exercises for same muscle group
  EMOM: 'emom',                   // Every Minute On the Minute
  AMRAP: 'amrap'                  // As Many Rounds As Possible
};

/**
 * Goals for exercise groupings
 */
export const GROUPING_GOALS = {
  EFFICIENCY: 'efficiency',       // Save time
  INTENSITY: 'intensity',         // Increase workout intensity
  BALANCE: 'balance',             // Create balanced muscle development
  RECOVERY: 'recovery',           // Facilitate active recovery
  SPECIALIZATION: 'specialization' // Focus on particular muscle/movement pattern
};

/**
 * Exercise grouping class
 */
export class ExerciseGrouping {
  constructor(options = {}) {
    this.id = options.id || `grouping_${Date.now()}`;
    this.name = options.name || 'Unnamed Grouping';
    this.type = options.type || GROUPING_TYPES.SUPERSET;
    this.goal = options.goal || GROUPING_GOALS.EFFICIENCY;
    this.exercises = options.exercises || [];
    this.restBetweenExercises = options.restBetweenExercises || 0; // in seconds
    this.restBetweenRounds = options.restBetweenRounds || 60; // in seconds
    this.rounds = options.rounds || 3;
    this.notes = options.notes || '';
    this.compatibilityScore = null; // Will be calculated on demand
  }

  /**
   * Add an exercise to the grouping
   * @param {Object} exercise - Exercise to add
   */
  addExercise(exercise) {
    this.exercises.push(exercise);
    this.compatibilityScore = null; // Reset score since grouping changed
    return this;
  }

  /**
   * Remove an exercise from the grouping
   * @param {string} exerciseId - ID of exercise to remove
   */
  removeExercise(exerciseId) {
    this.exercises = this.exercises.filter(ex => ex.id !== exerciseId);
    this.compatibilityScore = null; // Reset score since grouping changed
    return this;
  }

  /**
   * Set the rest period between exercises
   * @param {number} seconds - Rest time in seconds
   */
  setRestBetweenExercises(seconds) {
    this.restBetweenExercises = seconds;
    return this;
  }

  /**
   * Set the rest period between rounds
   * @param {number} seconds - Rest time in seconds
   */
  setRestBetweenRounds(seconds) {
    this.restBetweenRounds = seconds;
    return this;
  }

  /**
   * Set the number of rounds
   * @param {number} rounds - Number of rounds
   */
  setRounds(rounds) {
    this.rounds = rounds;
    return this;
  }

  /**
   * Check if the grouping is biomechanically sound
   * @returns {Object} Compatibility assessment
   */
  checkCompatibility() {
    if (this.exercises.length <= 1) {
      return {
        compatible: true,
        score: 10,
        warnings: []
      };
    }

    const warnings = [];
    let totalScore = 0;
    let comparisons = 0;

    // Check each pair of exercises
    for (let i = 0; i < this.exercises.length; i++) {
      for (let j = i + 1; j < this.exercises.length; j++) {
        const ex1 = this.exercises[i];
        const ex2 = this.exercises[j];

        // Skip if either exercise doesn't have an id
        if (!ex1.id || !ex2.id) continue;

        const compatibility = checkExerciseCompatibility(ex1.id, ex2.id);
        
        if (!compatibility.compatible) {
          warnings.push({
            exercise1: ex1.id,
            exercise2: ex2.id,
            reason: compatibility.reason
          });
        }
        
        totalScore += compatibility.compatibilityScore || 0;
        comparisons++;
      }
    }

    const avgScore = comparisons > 0 ? totalScore / comparisons : 10;
    this.compatibilityScore = avgScore;

    return {
      compatible: warnings.length === 0,
      score: avgScore,
      warnings
    };
  }

  /**
   * Calculate the total time this grouping will take
   * @param {Object} options - Calculation options
   * @returns {number} Time in seconds
   */
  calculateTotalTime(options = {}) {
    const defaultExerciseTime = options.defaultExerciseTime || 45; // seconds per set
    const exerciseCount = this.exercises.length;
    
    if (exerciseCount === 0) return 0;
    
    let totalTime = 0;
    
    for (let round = 0; round < this.rounds; round++) {
      // Add time for each exercise
      for (let i = 0; i < exerciseCount; i++) {
        const exercise = this.exercises[i];
        const exerciseTime = exercise.timePerSet || defaultExerciseTime;
        
        totalTime += exerciseTime;
        
        // Add rest time between exercises (except after the last one in a round)
        if (i < exerciseCount - 1) {
          totalTime += this.restBetweenExercises;
        }
      }
      
      // Add rest time between rounds (except after the last round)
      if (round < this.rounds - 1) {
        totalTime += this.restBetweenRounds;
      }
    }
    
    return totalTime;
  }

  /**
   * Convert the grouping to JSON
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      goal: this.goal,
      exercises: this.exercises,
      restBetweenExercises: this.restBetweenExercises,
      restBetweenRounds: this.restBetweenRounds,
      rounds: this.rounds,
      notes: this.notes
    };
  }

  /**
   * Create a grouping from JSON
   * @param {Object} json - JSON representation
   * @returns {ExerciseGrouping} New grouping
   */
  static fromJSON(json) {
    return new ExerciseGrouping(json);
  }
}

/**
 * Superset recommendation system
 */
export class SupersetRecommender {
  constructor() {
    this.exerciseDatabase = EXERCISE_ATTRIBUTES;
  }

  /**
   * Recommend a superset based on a primary exercise
   * @param {string} primaryExerciseId - Exercise to base recommendations on
   * @param {Object} options - Recommendation options
   * @returns {Array} Recommended exercises for superset
   */
  recommendSuperset(primaryExerciseId, options = {}) {
    const {
      goal = GROUPING_GOALS.EFFICIENCY,
      minCompatibilityScore = 7,
      maxExercises = 2,
      equipment = []
    } = options;
    
    // Get primary exercise attributes
    const primaryExercise = this.exerciseDatabase[primaryExerciseId];
    if (!primaryExercise) {
      return {
        success: false,
        message: `Exercise ${primaryExerciseId} not found in database`
      };
    }
    
    const recommendations = [];
    
    // Iterate through all exercises
    for (const [exerciseId, attributes] of Object.entries(this.exerciseDatabase)) {
      // Skip the primary exercise
      if (exerciseId === primaryExerciseId) continue;
      
      // Skip if equipment constraint doesn't match
      if (equipment.length > 0 && 
          attributes.equipment !== 'none' &&
          !equipment.includes(attributes.equipment)) {
        continue;
      }
      
      // Check compatibility
      const compatibility = checkExerciseCompatibility(primaryExerciseId, exerciseId);
      
      // Skip incompatible exercises or those with low scores
      if (!compatibility.compatible || 
          compatibility.compatibilityScore < minCompatibilityScore) {
        continue;
      }
      
      // Add to recommendations
      recommendations.push({
        exerciseId,
        attributes,
        compatibilityScore: compatibility.compatibilityScore,
        complementaryFactors: compatibility.complementaryFactors || []
      });
    }
    
    // Sort by compatibility score
    recommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    
    // Take top recommendations up to maxExercises
    const topRecommendations = recommendations.slice(0, maxExercises - 1);
    
    // Build the grouping
    const grouping = new ExerciseGrouping({
      name: `${primaryExerciseId} Superset`,
      type: GROUPING_TYPES.SUPERSET,
      goal,
      exercises: [
        { id: primaryExerciseId, attributes: primaryExercise },
        ...topRecommendations.map(rec => ({ 
          id: rec.exerciseId,
          attributes: rec.attributes
        }))
      ]
    });
    
    return {
      success: true,
      grouping,
      compatibility: grouping.checkCompatibility()
    };
  }

  /**
   * Generate a full-body circuit
   * @param {Object} options - Circuit options
   * @returns {ExerciseGrouping} Exercise circuit
   */
  generateFullBodyCircuit(options = {}) {
    const {
      exerciseCount = 6,
      equipment = [],
      includeUpperBody = true,
      includeLowerBody = true,
      includeCore = true
    } = options;
    
    const selectedExercises = [];
    
    // Helper function to get exercises by movement pattern
    const getExercisesByMovement = (movement, count = 1) => {
      const matches = Object.entries(this.exerciseDatabase)
        .filter(([_, attrs]) => {
          const equipmentMatch = equipment.length === 0 || 
                               attrs.equipment === 'none' || 
                               equipment.includes(attrs.equipment);
          return attrs.movement === movement && equipmentMatch;
        })
        .map(([id, attrs]) => ({ id, attributes: attrs }));
      
      // Randomly select exercises
      const selected = [];
      while (selected.length < count && matches.length > 0) {
        const randomIndex = Math.floor(Math.random() * matches.length);
        selected.push(matches[randomIndex]);
        matches.splice(randomIndex, 1);
      }
      
      return selected;
    };
    
    // Add upper body exercises
    if (includeUpperBody) {
      selectedExercises.push(...getExercisesByMovement('PUSH', 1));
      selectedExercises.push(...getExercisesByMovement('PULL', 1));
    }
    
    // Add lower body exercises
    if (includeLowerBody) {
      selectedExercises.push(...getExercisesByMovement('SQUAT', 1));
      selectedExercises.push(...getExercisesByMovement('HINGE', 1));
    }
    
    // Fill remaining slots with a mix
    const remainingCount = exerciseCount - selectedExercises.length;
    if (remainingCount > 0) {
      const movementPatterns = [];
      
      if (includeCore) {
        movementPatterns.push('ROTATION');
      }
      
      if (includeLowerBody) {
        movementPatterns.push('LUNGE');
      }
      
      if (includeUpperBody) {
        // Add more upper body if needed
        movementPatterns.push('PUSH', 'PULL');
      }
      
      // Add random exercises from the movement patterns
      for (let i = 0; i < remainingCount && movementPatterns.length > 0; i++) {
        const randomPatternIndex = Math.floor(Math.random() * movementPatterns.length);
        const pattern = movementPatterns[randomPatternIndex];
        
        const exercises = getExercisesByMovement(pattern, 1);
        if (exercises.length > 0) {
          selectedExercises.push(...exercises);
        }
        
        // Remove this pattern to avoid duplicates
        movementPatterns.splice(randomPatternIndex, 1);
      }
    }
    
    // Create the circuit
    const circuit = new ExerciseGrouping({
      name: 'Full Body Circuit',
      type: GROUPING_TYPES.CIRCUIT,
      goal: GROUPING_GOALS.EFFICIENCY,
      exercises: selectedExercises,
      restBetweenExercises: 15,
      restBetweenRounds: 60,
      rounds: 3
    });
    
    return {
      success: true,
      grouping: circuit,
      compatibility: circuit.checkCompatibility()
    };
  }
}

export default {
  ExerciseGrouping,
  SupersetRecommender,
  GROUPING_TYPES,
  GROUPING_GOALS
}; 