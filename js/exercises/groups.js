/**
 * Exercise Grouping and Superset System
 * Handles logical grouping of exercises for program design
 */

// Group types for exercise combinations
export const GROUP_TYPES = {
  SUPERSET: 'superset',           // Alternating exercises with minimal rest
  COMPLEX: 'complex',             // Series of exercises performed sequentially as one unit
  GIANT_SET: 'giant-set',         // 3+ exercises performed in sequence
  CIRCUIT: 'circuit',             // Multiple exercises performed in sequence with stations
  COMPOUND_SET: 'compound-set',   // Exercises targeting same muscle group
  ANTAGONIST_PAIR: 'antagonist-pair' // Exercises targeting opposing muscle groups
};

// Exercise relationship types
export const RELATIONSHIP_TYPES = {
  AGONIST: 'agonist',             // Same muscle group
  ANTAGONIST: 'antagonist',       // Opposing muscle group
  SYNERGIST: 'synergist',         // Assists primary mover
  UNRELATED: 'unrelated'          // Different muscle groups with minimal overlap
};

/**
 * Exercise group class for creating and managing exercise combinations
 */
export class ExerciseGroup {
  /**
   * Create a new exercise group
   * @param {string} id - Unique identifier for the group
   * @param {string} name - Display name for the group
   * @param {string} type - Group type from GROUP_TYPES
   * @param {Array} exerciseIds - Array of exercise IDs in this group
   * @param {Object} options - Additional options for the group
   */
  constructor(id, name, type, exerciseIds = [], options = {}) {
    this.id = id;
    this.name = name;
    this.type = GROUP_TYPES[type.toUpperCase()] || type;
    this.exerciseIds = [...exerciseIds];
    this.restBetweenExercises = options.restBetweenExercises || 0;
    this.restAfterRound = options.restAfterRound || 60;
    this.rounds = options.rounds || 1;
    this.notes = options.notes || '';
    this.relationships = options.relationships || this._defaultRelationships();
    this.biomechanicalBalance = options.biomechanicalBalance || 'balanced';
  }
  
  /**
   * Create default relationships map for exercises
   * @returns {Object} Map of exercise relationships
   * @private
   */
  _defaultRelationships() {
    const relationships = {};
    
    // Create pairs of exercises to define relationships
    for (let i = 0; i < this.exerciseIds.length; i++) {
      for (let j = i + 1; j < this.exerciseIds.length; j++) {
        const pair = `${this.exerciseIds[i]}_${this.exerciseIds[j]}`;
        relationships[pair] = RELATIONSHIP_TYPES.UNRELATED;
      }
    }
    
    return relationships;
  }
  
  /**
   * Add an exercise to the group
   * @param {string} exerciseId - Exercise ID to add
   * @returns {ExerciseGroup} This group instance for chaining
   */
  addExercise(exerciseId) {
    if (!this.exerciseIds.includes(exerciseId)) {
      this.exerciseIds.push(exerciseId);
      
      // Update relationships for the new exercise
      this.exerciseIds.forEach(existingId => {
        if (existingId !== exerciseId) {
          const pair = `${existingId}_${exerciseId}`;
          this.relationships[pair] = RELATIONSHIP_TYPES.UNRELATED;
        }
      });
    }
    
    return this;
  }
  
  /**
   * Remove an exercise from the group
   * @param {string} exerciseId - Exercise ID to remove
   * @returns {ExerciseGroup} This group instance for chaining
   */
  removeExercise(exerciseId) {
    const index = this.exerciseIds.indexOf(exerciseId);
    if (index !== -1) {
      this.exerciseIds.splice(index, 1);
      
      // Remove relationships involving this exercise
      Object.keys(this.relationships).forEach(pair => {
        if (pair.includes(exerciseId)) {
          delete this.relationships[pair];
        }
      });
    }
    
    return this;
  }
  
  /**
   * Set the relationship between two exercises
   * @param {string} exerciseId1 - First exercise ID
   * @param {string} exerciseId2 - Second exercise ID
   * @param {string} relationship - Relationship type from RELATIONSHIP_TYPES
   * @returns {ExerciseGroup} This group instance for chaining
   */
  setRelationship(exerciseId1, exerciseId2, relationship) {
    if (!this.exerciseIds.includes(exerciseId1) || !this.exerciseIds.includes(exerciseId2)) {
      return this;
    }
    
    // Ensure consistent pair ordering
    const pair = [exerciseId1, exerciseId2].sort().join('_');
    this.relationships[pair] = RELATIONSHIP_TYPES[relationship.toUpperCase()] || relationship;
    
    return this;
  }
  
  /**
   * Get the relationship between two exercises
   * @param {string} exerciseId1 - First exercise ID
   * @param {string} exerciseId2 - Second exercise ID
   * @returns {string} Relationship type
   */
  getRelationship(exerciseId1, exerciseId2) {
    const pair = [exerciseId1, exerciseId2].sort().join('_');
    return this.relationships[pair] || RELATIONSHIP_TYPES.UNRELATED;
  }
  
  /**
   * Calculate total time required for the group
   * @param {Object} exerciseData - Map of exercise data with duration info
   * @returns {number} Total time in seconds
   */
  calculateTotalTime(exerciseData) {
    let totalTime = 0;
    
    // Time for each round
    for (let round = 0; round < this.rounds; round++) {
      // Add time for each exercise
      this.exerciseIds.forEach((exerciseId, index) => {
        const exercise = exerciseData[exerciseId] || {};
        const exerciseTime = exercise.timePerSet || 30;
        const sets = exercise.sets || 1;
        
        totalTime += exerciseTime * sets;
        
        // Add rest between exercises (except after the last one)
        if (index < this.exerciseIds.length - 1) {
          totalTime += this.restBetweenExercises;
        }
      });
      
      // Add rest after round (except after the last round)
      if (round < this.rounds - 1) {
        totalTime += this.restAfterRound;
      }
    }
    
    return totalTime;
  }
  
  /**
   * Get instructions for performing the group
   * @returns {Array} Array of instruction strings
   */
  getInstructions() {
    const instructions = [];
    
    switch(this.type) {
      case GROUP_TYPES.SUPERSET:
        instructions.push(
          `Perform ${this.rounds} rounds of these exercises with minimal rest (${this.restBetweenExercises}s) between them.`,
          `Rest ${this.restAfterRound} seconds after completing each round.`
        );
        break;
        
      case GROUP_TYPES.COMPLEX:
        instructions.push(
          `Perform all ${this.exerciseIds.length} exercises in sequence as a single unit.`,
          `Complete ${this.rounds} total rounds with ${this.restAfterRound}s rest between rounds.`
        );
        break;
        
      case GROUP_TYPES.GIANT_SET:
        instructions.push(
          `Perform all ${this.exerciseIds.length} exercises in sequence with ${this.restBetweenExercises}s rest between movements.`,
          `Complete ${this.rounds} total rounds with ${this.restAfterRound}s rest between rounds.`
        );
        break;
        
      case GROUP_TYPES.CIRCUIT:
        instructions.push(
          `Move through all ${this.exerciseIds.length} stations in order.`,
          `Rest ${this.restBetweenExercises}s between stations and ${this.restAfterRound}s after completing each round.`,
          `Complete ${this.rounds} total rounds.`
        );
        break;
        
      case GROUP_TYPES.COMPOUND_SET:
        instructions.push(
          `Perform these exercises back-to-back targeting the same muscle group.`,
          `Complete ${this.rounds} rounds with ${this.restAfterRound}s rest between rounds.`
        );
        break;
        
      case GROUP_TYPES.ANTAGONIST_PAIR:
        instructions.push(
          `Alternate between these opposing muscle group exercises.`,
          `Rest ${this.restBetweenExercises}s between exercises and ${this.restAfterRound}s after completing both.`,
          `Complete ${this.rounds} total rounds.`
        );
        break;
        
      default:
        instructions.push(
          `Perform ${this.rounds} rounds of these ${this.exerciseIds.length} exercises.`,
          `Rest ${this.restBetweenExercises}s between exercises and ${this.restAfterRound}s between rounds.`
        );
    }
    
    if (this.notes) {
      instructions.push(this.notes);
    }
    
    return instructions;
  }
  
  /**
   * Convert the group to a JSON object
   * @returns {Object} JSON representation of the group
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      exerciseIds: [...this.exerciseIds],
      restBetweenExercises: this.restBetweenExercises,
      restAfterRound: this.restAfterRound,
      rounds: this.rounds,
      notes: this.notes,
      relationships: { ...this.relationships },
      biomechanicalBalance: this.biomechanicalBalance
    };
  }
  
  /**
   * Create an ExerciseGroup from a JSON object
   * @param {Object} json - JSON representation of the group
   * @returns {ExerciseGroup} New ExerciseGroup instance
   */
  static fromJSON(json) {
    return new ExerciseGroup(
      json.id,
      json.name,
      json.type,
      json.exerciseIds || [],
      {
        restBetweenExercises: json.restBetweenExercises,
        restAfterRound: json.restAfterRound,
        rounds: json.rounds,
        notes: json.notes,
        relationships: json.relationships,
        biomechanicalBalance: json.biomechanicalBalance
      }
    );
  }
}

/**
 * Create a superset between two exercises
 * @param {string} id - Unique identifier for the group
 * @param {string} name - Display name for the group
 * @param {string} exercise1Id - First exercise ID
 * @param {string} exercise2Id - Second exercise ID
 * @param {Object} options - Additional options for the group
 * @returns {ExerciseGroup} New ExerciseGroup instance
 */
export function createSuperset(id, name, exercise1Id, exercise2Id, options = {}) {
  return new ExerciseGroup(
    id,
    name,
    GROUP_TYPES.SUPERSET,
    [exercise1Id, exercise2Id],
    {
      restBetweenExercises: options.restBetweenExercises || 10,
      restAfterRound: options.restAfterRound || 60,
      rounds: options.rounds || 3,
      ...options
    }
  );
}

/**
 * Create an antagonist pair between two exercises
 * @param {string} id - Unique identifier for the group
 * @param {string} name - Display name for the group
 * @param {string} agonistExerciseId - Agonist exercise ID
 * @param {string} antagonistExerciseId - Antagonist exercise ID
 * @param {Object} options - Additional options for the group
 * @returns {ExerciseGroup} New ExerciseGroup instance
 */
export function createAntagonistPair(id, name, agonistExerciseId, antagonistExerciseId, options = {}) {
  const group = new ExerciseGroup(
    id,
    name,
    GROUP_TYPES.ANTAGONIST_PAIR,
    [agonistExerciseId, antagonistExerciseId],
    {
      restBetweenExercises: options.restBetweenExercises || 30,
      restAfterRound: options.restAfterRound || 90,
      rounds: options.rounds || 3,
      ...options
    }
  );
  
  // Set the relationship type
  group.setRelationship(agonistExerciseId, antagonistExerciseId, RELATIONSHIP_TYPES.ANTAGONIST);
  
  return group;
}

/**
 * Validate if exercises can be effectively grouped together
 * @param {Array} exerciseIds - Array of exercise IDs
 * @param {string} groupType - Group type from GROUP_TYPES
 * @param {Object} exerciseData - Map of exercise data with muscle and equipment info
 * @returns {Object} Validation result with isValid flag and reasons
 */
export function validateGroupCompatibility(exerciseIds, groupType, exerciseData) {
  if (!exerciseIds || exerciseIds.length < 2 || !groupType) {
    return {
      isValid: false,
      reasons: ['Need at least two exercises for a group']
    };
  }
  
  const reasons = [];
  let isValid = true;
  
  // Check equipment conflicts
  const equipment = new Set();
  exerciseIds.forEach(id => {
    const exercise = exerciseData[id];
    if (exercise && exercise.equipment) {
      equipment.add(exercise.equipment);
    }
  });
  
  // For circuits, different equipment is good
  if (groupType === GROUP_TYPES.CIRCUIT && equipment.size < exerciseIds.length) {
    reasons.push('Circuit should use different equipment for each station');
    isValid = false;
  }
  
  // For compound sets, check if targeting same muscle group
  if (groupType === GROUP_TYPES.COMPOUND_SET) {
    const muscleGroups = new Set();
    exerciseIds.forEach(id => {
      const exercise = exerciseData[id];
      if (exercise && exercise.primaryMuscleGroup) {
        muscleGroups.add(exercise.primaryMuscleGroup);
      }
    });
    
    if (muscleGroups.size > 1) {
      reasons.push('Compound sets should target the same muscle group');
      isValid = false;
    }
  }
  
  // For antagonist pairs, check if targeting opposing muscle groups
  if (groupType === GROUP_TYPES.ANTAGONIST_PAIR && exerciseIds.length === 2) {
    const ex1 = exerciseData[exerciseIds[0]];
    const ex2 = exerciseData[exerciseIds[1]];
    
    if (ex1 && ex2) {
      const isAntagonistic = isAntagonistPair(ex1.primaryMuscleGroup, ex2.primaryMuscleGroup);
      
      if (!isAntagonistic) {
        reasons.push('Antagonist pairs should target opposing muscle groups');
        isValid = false;
      }
    }
  }
  
  // Check for exercise sequence compatibility
  if (groupType === GROUP_TYPES.COMPLEX) {
    // Check if exercises can be performed in sequence with same equipment
    let previousEquipment = null;
    
    for (const id of exerciseIds) {
      const exercise = exerciseData[id];
      if (exercise) {
        if (previousEquipment && exercise.equipment !== previousEquipment) {
          reasons.push('Complex should use the same equipment for smooth transitions');
          isValid = false;
          break;
        }
        previousEquipment = exercise.equipment;
      }
    }
  }
  
  return {
    isValid,
    reasons
  };
}

/**
 * Check if two muscle groups are antagonistic pairs
 * @param {string} muscle1 - First muscle group
 * @param {string} muscle2 - Second muscle group
 * @returns {boolean} True if muscles are antagonistic
 */
function isAntagonistPair(muscle1, muscle2) {
  const antagonistPairs = {
    'chest': ['back', 'rhomboids', 'lats'],
    'biceps': ['triceps'],
    'quadriceps': ['hamstrings'],
    'abs': ['lower_back'],
    'hip_flexors': ['glutes'],
    'anterior_deltoid': ['posterior_deltoid'],
    'tibialis_anterior': ['calves']
  };
  
  // Check both directions
  return (antagonistPairs[muscle1] && antagonistPairs[muscle1].includes(muscle2)) ||
         (antagonistPairs[muscle2] && antagonistPairs[muscle2].includes(muscle1));
}

/**
 * Generate an exercise group based on a goal and available exercises
 * @param {string} goal - Training goal (strength, hypertrophy, endurance, etc.)
 * @param {Array} availableExercises - Array of available exercises
 * @returns {ExerciseGroup} Generated exercise group
 */
export function generateGroupForGoal(goal, availableExercises) {
  if (!availableExercises || availableExercises.length < 2) {
    throw new Error('Need at least two exercises to create a group');
  }
  
  const id = `group_${Date.now()}`;
  let groupType, name, options;
  
  switch(goal.toLowerCase()) {
    case 'strength':
      groupType = GROUP_TYPES.ANTAGONIST_PAIR;
      name = 'Strength Pair';
      options = { 
        restBetweenExercises: 60,
        restAfterRound: 180,
        rounds: 4
      };
      
      // Find antagonist exercises
      for (let i = 0; i < availableExercises.length; i++) {
        for (let j = i + 1; j < availableExercises.length; j++) {
          const ex1 = availableExercises[i];
          const ex2 = availableExercises[j];
          
          if (isAntagonistPair(ex1.primaryMuscleGroup, ex2.primaryMuscleGroup)) {
            return createAntagonistPair(id, name, ex1.id, ex2.id, options);
          }
        }
      }
      
      // If no antagonist pair found, create a basic pair
      return createSuperset(id, 'Strength Combo', 
        availableExercises[0].id, 
        availableExercises[1].id, 
        options
      );
      
    case 'hypertrophy':
      groupType = GROUP_TYPES.COMPOUND_SET;
      name = 'Muscle Builder';
      options = {
        restBetweenExercises: 10,
        restAfterRound: 90,
        rounds: 3
      };
      
      // Group by same muscle
      const muscleGroups = {};
      availableExercises.forEach(ex => {
        if (!muscleGroups[ex.primaryMuscleGroup]) {
          muscleGroups[ex.primaryMuscleGroup] = [];
        }
        muscleGroups[ex.primaryMuscleGroup].push(ex);
      });
      
      // Find a muscle group with multiple exercises
      for (const [muscle, exercises] of Object.entries(muscleGroups)) {
        if (exercises.length >= 2) {
          const group = new ExerciseGroup(
            id,
            `${muscle.charAt(0).toUpperCase() + muscle.slice(1)} Builder`,
            groupType,
            exercises.slice(0, 3).map(ex => ex.id),
            options
          );
          
          return group;
        }
      }
      
      // Fallback to first two exercises
      return new ExerciseGroup(
        id,
        name,
        groupType,
        [availableExercises[0].id, availableExercises[1].id],
        options
      );
      
    case 'endurance':
      groupType = GROUP_TYPES.CIRCUIT;
      name = 'Endurance Circuit';
      options = {
        restBetweenExercises: 15,
        restAfterRound: 60,
        rounds: 3
      };
      
      // Take up to 5 exercises for the circuit
      const circuitExercises = availableExercises.slice(0, 5);
      return new ExerciseGroup(
        id,
        name,
        groupType,
        circuitExercises.map(ex => ex.id),
        options
      );
      
    case 'power':
      groupType = GROUP_TYPES.COMPLEX;
      name = 'Power Complex';
      options = {
        restBetweenExercises: 0,
        restAfterRound: 120,
        rounds: 5,
        notes: 'Perform each exercise with maximum power and speed, maintaining proper form.'
      };
      
      // Group exercises by equipment
      const equipmentGroups = {};
      availableExercises.forEach(ex => {
        if (!equipmentGroups[ex.equipment]) {
          equipmentGroups[ex.equipment] = [];
        }
        equipmentGroups[ex.equipment].push(ex);
      });
      
      // Find equipment with multiple exercises
      for (const [equip, exercises] of Object.entries(equipmentGroups)) {
        if (exercises.length >= 2) {
          return new ExerciseGroup(
            id,
            `${equip} Complex`,
            groupType,
            exercises.slice(0, 3).map(ex => ex.id),
            options
          );
        }
      }
      
      // Fallback
      return createSuperset(id, name, 
        availableExercises[0].id, 
        availableExercises[1].id, 
        options
      );
      
    default:
      // General fitness - create a superset
      return createSuperset(id, 'Fitness Combo', 
        availableExercises[0].id, 
        availableExercises[1].id, 
        {
          restBetweenExercises: 20,
          restAfterRound: 60,
          rounds: 3
        }
      );
  }
}

// Pre-defined exercise groupings
export const PREDEFINED_GROUPS = [
  new ExerciseGroup(
    'upper_body_push_pull',
    'Upper Body Push/Pull',
    GROUP_TYPES.ANTAGONIST_PAIR,
    ['bench_press', 'bent_over_row'],
    {
      restBetweenExercises: 45,
      restAfterRound: 120,
      rounds: 4,
      notes: 'Focus on full range of motion for both pushing and pulling movements.'
    }
  ),
  
  new ExerciseGroup(
    'lower_body_circuit',
    'Lower Body Power Circuit',
    GROUP_TYPES.CIRCUIT,
    ['squat', 'deadlift', 'lunge', 'calf_raise'],
    {
      restBetweenExercises: 30,
      restAfterRound: 90,
      rounds: 3,
      notes: 'Start with the most complex movement (squat) and progress to simpler exercises.'
    }
  ),
  
  new ExerciseGroup(
    'core_complex',
    'Core Complex',
    GROUP_TYPES.COMPLEX,
    ['plank', 'ab_rollout', 'russian_twist', 'hanging_leg_raise'],
    {
      restBetweenExercises: 0,
      restAfterRound: 60,
      rounds: 3,
      notes: 'Move immediately from one exercise to the next within each round.'
    }
  ),
  
  new ExerciseGroup(
    'arm_superset',
    'Arm Blaster',
    GROUP_TYPES.SUPERSET,
    ['bicep_curl', 'tricep_extension'],
    {
      restBetweenExercises: 10,
      restAfterRound: 60,
      rounds: 4,
      notes: 'Perform bicep curl immediately followed by tricep extension to maximize the pump.'
    }
  ),
  
  new ExerciseGroup(
    'push_day_giant',
    'Push Day Giant Set',
    GROUP_TYPES.GIANT_SET,
    ['bench_press', 'shoulder_press', 'tricep_dip', 'chest_fly'],
    {
      restBetweenExercises: 20,
      restAfterRound: 120,
      rounds: 3,
      notes: 'Start with compound movements and finish with isolation work.'
    }
  )
];

export default {
  GROUP_TYPES,
  RELATIONSHIP_TYPES,
  ExerciseGroup,
  createSuperset,
  createAntagonistPair,
  validateGroupCompatibility,
  generateGroupForGoal,
  PREDEFINED_GROUPS
}; 