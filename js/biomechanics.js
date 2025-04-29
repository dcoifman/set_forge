/**
 * Biomechanics Module
 * Handles biomechanical stress scoring, recovery modeling, and exercise attributes
 */

/**
 * Muscle groups
 */
export const MUSCLE_GROUPS = {
  CHEST: 'chest',
  BACK: 'back',
  SHOULDERS: 'shoulders',
  BICEPS: 'biceps',
  TRICEPS: 'triceps',
  QUADS: 'quads',
  HAMSTRINGS: 'hamstrings',
  GLUTES: 'glutes',
  CALVES: 'calves',
  CORE: 'core',
  LOWER_BACK: 'lower_back',
  FOREARMS: 'forearms',
  NECK: 'neck',
  HIP_FLEXORS: 'hip_flexors',
  ADDUCTORS: 'adductors',
  ABDUCTORS: 'abductors',
  ROTATOR_CUFF: 'rotator_cuff'
};

/**
 * Movement patterns
 */
export const MOVEMENT_PATTERNS = {
  PUSH: 'push',
  PULL: 'pull',
  SQUAT: 'squat',
  HINGE: 'hinge',
  LUNGE: 'lunge',
  ROTATION: 'rotation',
  CARRY: 'carry',
  LOCOMOTION: 'locomotion',
  STABILITY: 'stability'
};

/**
 * Exercise equipment types
 */
export const EQUIPMENT_TYPES = {
  NONE: 'none',
  BARBELL: 'barbell',
  DUMBBELL: 'dumbbell',
  KETTLEBELL: 'kettlebell',
  CABLE: 'cable',
  MACHINE: 'machine',
  BANDS: 'bands',
  SUSPENSION: 'suspension',
  MEDICINE_BALL: 'medicine_ball',
  SANDBAG: 'sandbag',
  PLAYGROUND: 'playground',
  OTHER: 'other'
};

/**
 * Joint actions
 */
export const JOINT_ACTIONS = {
  FLEXION: 'flexion',
  EXTENSION: 'extension',
  ABDUCTION: 'abduction',
  ADDUCTION: 'adduction',
  ROTATION_INT: 'internal_rotation',
  ROTATION_EXT: 'external_rotation',
  ELEVATION: 'elevation',
  DEPRESSION: 'depression',
  PROTRACTION: 'protraction',
  RETRACTION: 'retraction',
  PRONATION: 'pronation',
  SUPINATION: 'supination',
  DORSIFLEXION: 'dorsiflexion',
  PLANTARFLEXION: 'plantarflexion',
  EVERSION: 'eversion',
  INVERSION: 'inversion'
};

/**
 * Exercise attributes database
 * Contains biomechanical data for exercises
 */
export const EXERCISE_ATTRIBUTES = {
  // Push-up variations
  'standard_pushup': {
    primaryMuscles: [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.TRICEPS, MUSCLE_GROUPS.SHOULDERS],
    secondaryMuscles: [MUSCLE_GROUPS.CORE],
    movement: MOVEMENT_PATTERNS.PUSH,
    equipment: EQUIPMENT_TYPES.NONE,
    force: 'push',
    stressScore: {
      [MUSCLE_GROUPS.CHEST]: 9,
      [MUSCLE_GROUPS.TRICEPS]: 7,
      [MUSCLE_GROUPS.SHOULDERS]: 6,
      [MUSCLE_GROUPS.CORE]: 4
    },
    joints: {
      'shoulder': [JOINT_ACTIONS.FLEXION, JOINT_ACTIONS.PROTRACTION],
      'elbow': [JOINT_ACTIONS.EXTENSION],
      'wrist': [JOINT_ACTIONS.EXTENSION]
    },
    stabilityDemand: 7,
    recoveryTime: 24,  // Hours until full recovery
  },
  
  'diamond_pushup': {
    primaryMuscles: [MUSCLE_GROUPS.TRICEPS, MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.SHOULDERS],
    secondaryMuscles: [MUSCLE_GROUPS.CORE],
    movement: MOVEMENT_PATTERNS.PUSH,
    equipment: EQUIPMENT_TYPES.NONE,
    force: 'push',
    stressScore: {
      [MUSCLE_GROUPS.CHEST]: 7,
      [MUSCLE_GROUPS.TRICEPS]: 9,
      [MUSCLE_GROUPS.SHOULDERS]: 6,
      [MUSCLE_GROUPS.CORE]: 4
    },
    joints: {
      'shoulder': [JOINT_ACTIONS.FLEXION, JOINT_ACTIONS.PROTRACTION],
      'elbow': [JOINT_ACTIONS.EXTENSION],
      'wrist': [JOINT_ACTIONS.EXTENSION]
    },
    stabilityDemand: 8,
    recoveryTime: 24
  },
  
  'decline_pushup': {
    primaryMuscles: [MUSCLE_GROUPS.CHEST, MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.TRICEPS],
    secondaryMuscles: [MUSCLE_GROUPS.CORE],
    movement: MOVEMENT_PATTERNS.PUSH,
    equipment: EQUIPMENT_TYPES.NONE,
    force: 'push',
    stressScore: {
      [MUSCLE_GROUPS.CHEST]: 10,
      [MUSCLE_GROUPS.TRICEPS]: 7,
      [MUSCLE_GROUPS.SHOULDERS]: 8,
      [MUSCLE_GROUPS.CORE]: 5
    },
    joints: {
      'shoulder': [JOINT_ACTIONS.FLEXION, JOINT_ACTIONS.PROTRACTION],
      'elbow': [JOINT_ACTIONS.EXTENSION],
      'wrist': [JOINT_ACTIONS.EXTENSION]
    },
    stabilityDemand: 9,
    recoveryTime: 48
  },
  
  // Squat variations
  'bodyweight_squat': {
    primaryMuscles: [MUSCLE_GROUPS.QUADS, MUSCLE_GROUPS.GLUTES],
    secondaryMuscles: [MUSCLE_GROUPS.HAMSTRINGS, MUSCLE_GROUPS.CORE, MUSCLE_GROUPS.LOWER_BACK],
    movement: MOVEMENT_PATTERNS.SQUAT,
    equipment: EQUIPMENT_TYPES.NONE,
    force: 'push',
    stressScore: {
      [MUSCLE_GROUPS.QUADS]: 7,
      [MUSCLE_GROUPS.GLUTES]: 6,
      [MUSCLE_GROUPS.HAMSTRINGS]: 3,
      [MUSCLE_GROUPS.CORE]: 3,
      [MUSCLE_GROUPS.LOWER_BACK]: 2
    },
    joints: {
      'hip': [JOINT_ACTIONS.FLEXION, JOINT_ACTIONS.EXTENSION],
      'knee': [JOINT_ACTIONS.FLEXION, JOINT_ACTIONS.EXTENSION],
      'ankle': [JOINT_ACTIONS.DORSIFLEXION]
    },
    stabilityDemand: 6,
    recoveryTime: 24
  },
  
  'goblet_squat': {
    primaryMuscles: [MUSCLE_GROUPS.QUADS, MUSCLE_GROUPS.GLUTES],
    secondaryMuscles: [MUSCLE_GROUPS.HAMSTRINGS, MUSCLE_GROUPS.CORE, MUSCLE_GROUPS.LOWER_BACK, MUSCLE_GROUPS.FOREARMS],
    movement: MOVEMENT_PATTERNS.SQUAT,
    equipment: EQUIPMENT_TYPES.DUMBBELL,
    force: 'push',
    stressScore: {
      [MUSCLE_GROUPS.QUADS]: 8,
      [MUSCLE_GROUPS.GLUTES]: 7,
      [MUSCLE_GROUPS.HAMSTRINGS]: 4,
      [MUSCLE_GROUPS.CORE]: 5,
      [MUSCLE_GROUPS.LOWER_BACK]: 3,
      [MUSCLE_GROUPS.FOREARMS]: 3
    },
    joints: {
      'hip': [JOINT_ACTIONS.FLEXION, JOINT_ACTIONS.EXTENSION],
      'knee': [JOINT_ACTIONS.FLEXION, JOINT_ACTIONS.EXTENSION],
      'ankle': [JOINT_ACTIONS.DORSIFLEXION]
    },
    stabilityDemand: 7,
    recoveryTime: 36
  },
  
  'barbell_squat': {
    primaryMuscles: [MUSCLE_GROUPS.QUADS, MUSCLE_GROUPS.GLUTES],
    secondaryMuscles: [MUSCLE_GROUPS.HAMSTRINGS, MUSCLE_GROUPS.CORE, MUSCLE_GROUPS.LOWER_BACK],
    movement: MOVEMENT_PATTERNS.SQUAT,
    equipment: EQUIPMENT_TYPES.BARBELL,
    force: 'push',
    stressScore: {
      [MUSCLE_GROUPS.QUADS]: 10,
      [MUSCLE_GROUPS.GLUTES]: 9,
      [MUSCLE_GROUPS.HAMSTRINGS]: 6,
      [MUSCLE_GROUPS.CORE]: 7,
      [MUSCLE_GROUPS.LOWER_BACK]: 6
    },
    joints: {
      'hip': [JOINT_ACTIONS.FLEXION, JOINT_ACTIONS.EXTENSION],
      'knee': [JOINT_ACTIONS.FLEXION, JOINT_ACTIONS.EXTENSION],
      'ankle': [JOINT_ACTIONS.DORSIFLEXION]
    },
    stabilityDemand: 8,
    recoveryTime: 48
  },
  
  // Pull-up variations
  'pull_up': {
    primaryMuscles: [MUSCLE_GROUPS.BACK, MUSCLE_GROUPS.BICEPS],
    secondaryMuscles: [MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.FOREARMS, MUSCLE_GROUPS.CORE],
    movement: MOVEMENT_PATTERNS.PULL,
    equipment: EQUIPMENT_TYPES.PLAYGROUND,
    force: 'pull',
    stressScore: {
      [MUSCLE_GROUPS.BACK]: 9,
      [MUSCLE_GROUPS.BICEPS]: 7,
      [MUSCLE_GROUPS.SHOULDERS]: 5,
      [MUSCLE_GROUPS.FOREARMS]: 6,
      [MUSCLE_GROUPS.CORE]: 3
    },
    joints: {
      'shoulder': [JOINT_ACTIONS.EXTENSION, JOINT_ACTIONS.DEPRESSION],
      'elbow': [JOINT_ACTIONS.FLEXION],
      'wrist': [JOINT_ACTIONS.FLEXION]
    },
    stabilityDemand: 7,
    recoveryTime: 48
  },
  
  'chin_up': {
    primaryMuscles: [MUSCLE_GROUPS.BICEPS, MUSCLE_GROUPS.BACK],
    secondaryMuscles: [MUSCLE_GROUPS.SHOULDERS, MUSCLE_GROUPS.FOREARMS, MUSCLE_GROUPS.CORE],
    movement: MOVEMENT_PATTERNS.PULL,
    equipment: EQUIPMENT_TYPES.PLAYGROUND,
    force: 'pull',
    stressScore: {
      [MUSCLE_GROUPS.BACK]: 8,
      [MUSCLE_GROUPS.BICEPS]: 9,
      [MUSCLE_GROUPS.SHOULDERS]: 5,
      [MUSCLE_GROUPS.FOREARMS]: 6,
      [MUSCLE_GROUPS.CORE]: 3
    },
    joints: {
      'shoulder': [JOINT_ACTIONS.EXTENSION, JOINT_ACTIONS.DEPRESSION],
      'elbow': [JOINT_ACTIONS.FLEXION],
      'wrist': [JOINT_ACTIONS.FLEXION]
    },
    stabilityDemand: 7,
    recoveryTime: 48
  },
  
  // Add more exercises as needed...
};

/**
 * BiomechanicalAnalyzer class
 * Analyzes exercise stress, fatigue, and recovery
 */
export class BiomechanicalAnalyzer {
  constructor() {
    this.exerciseData = EXERCISE_ATTRIBUTES;
    this.muscleGroups = MUSCLE_GROUPS;
    this.recoveryState = this._initializeRecoveryState();
  }
  
  /**
   * Initialize recovery state for all muscle groups
   * @returns {Object} Initial recovery state
   * @private
   */
  _initializeRecoveryState() {
    const recoveryState = {};
    Object.values(this.muscleGroups).forEach(muscle => {
      recoveryState[muscle] = {
        currentFatigue: 0,
        lastExercised: null,
        recoveryLevel: 100 // 0-100%, 100% means fully recovered
      };
    });
    return recoveryState;
  }
  
  /**
   * Get stress profile for a specific exercise
   * @param {string} exerciseId - The ID of the exercise
   * @returns {Object} Stress profile
   */
  getExerciseStressProfile(exerciseId) {
    if (!this.exerciseData[exerciseId]) {
      return null;
    }
    
    return {
      stressScores: this.exerciseData[exerciseId].stressScore,
      recoveryTime: this.exerciseData[exerciseId].recoveryTime,
      stabilityDemand: this.exerciseData[exerciseId].stabilityDemand,
      primaryMuscles: this.exerciseData[exerciseId].primaryMuscles,
      secondaryMuscles: this.exerciseData[exerciseId].secondaryMuscles
    };
  }
  
  /**
   * Record exercise completion and calculate fatigue
   * @param {string} exerciseId - The ID of the exercise
   * @param {Object} params - Exercise parameters (sets, reps, weight)
   */
  recordExercise(exerciseId, params = {}) {
    const { sets = 3, reps = 10, intensity = 7, date = new Date() } = params;
    
    if (!this.exerciseData[exerciseId]) {
      return;
    }
    
    // Calculate volume multiplier
    const volumeMultiplier = (sets * reps) / 30; // Normalized to 3x10
    
    // Get stress scores
    const { stressScore } = this.exerciseData[exerciseId];
    
    // Apply fatigue to all involved muscles
    Object.entries(stressScore).forEach(([muscle, score]) => {
      // Calculate actual fatigue added
      const fatigue = score * volumeMultiplier * (intensity / 10);
      
      // Update recovery state
      if (this.recoveryState[muscle]) {
        this.recoveryState[muscle].currentFatigue += fatigue;
        this.recoveryState[muscle].lastExercised = date;
        this.recoveryState[muscle].recoveryLevel = Math.max(
          0, 
          100 - this.recoveryState[muscle].currentFatigue
        );
      }
    });
    
    return this.getMuscleRecoveryStatus();
  }
  
  /**
   * Get the current recovery status of all muscle groups
   * @returns {Object} Recovery status
   */
  getMuscleRecoveryStatus() {
    const now = new Date();
    const recoveryStatus = {};
    
    Object.entries(this.recoveryState).forEach(([muscle, state]) => {
      if (!state.lastExercised) {
        recoveryStatus[muscle] = {
          recoveryLevel: 100,
          fatigueLevel: 0,
          ready: true
        };
        return;
      }
      
      // Calculate hours since last exercise
      const hoursSince = (now - new Date(state.lastExercised)) / 1000 / 60 / 60;
      
      // Model recovery based on recovery curve
      // Simple linear model: 2% recovery per hour
      const recoveryRate = 2; // % per hour
      const recoveredAmount = Math.min(100, hoursSince * recoveryRate);
      
      // Update recovery level
      const updatedFatigue = Math.max(0, state.currentFatigue - recoveredAmount);
      const recoveryLevel = 100 - updatedFatigue;
      
      // Save updated state
      this.recoveryState[muscle].currentFatigue = updatedFatigue;
      this.recoveryState[muscle].recoveryLevel = recoveryLevel;
      
      recoveryStatus[muscle] = {
        recoveryLevel: Math.round(recoveryLevel),
        fatigueLevel: Math.round(updatedFatigue),
        ready: recoveryLevel >= 85 // Consider ready at 85% recovery
      };
    });
    
    return recoveryStatus;
  }
  
  /**
   * Reset recovery state for testing
   */
  resetRecoveryState() {
    this.recoveryState = this._initializeRecoveryState();
  }
  
  /**
   * Analyze compatibility between multiple exercises
   * @param {Array} exerciseIds - Exercise IDs to analyze
   * @returns {Object} Compatibility analysis
   */
  analyzeCompatibility(exerciseIds) {
    // Check if all exercises exist
    const validExercises = exerciseIds.filter(id => this.exerciseData[id]);
    if (validExercises.length !== exerciseIds.length) {
      return {
        compatible: false,
        reason: 'One or more exercises not found in database'
      };
    }
    
    // Get all stress scores and involved muscles
    const exerciseProfiles = validExercises.map(id => ({
      id,
      name: id.replace(/_/g, ' '),
      stressScore: this.exerciseData[id].stressScore,
      primaryMuscles: this.exerciseData[id].primaryMuscles,
      secondaryMuscles: this.exerciseData[id].secondaryMuscles,
      movement: this.exerciseData[id].movement
    }));
    
    // Check for overlapping primary muscles
    const primaryMuscleMap = {};
    let hasPrimaryOverlap = false;
    let overlapMuscles = [];
    
    exerciseProfiles.forEach(profile => {
      profile.primaryMuscles.forEach(muscle => {
        if (primaryMuscleMap[muscle]) {
          hasPrimaryOverlap = true;
          overlapMuscles.push(muscle);
        } else {
          primaryMuscleMap[muscle] = true;
        }
      });
    });
    
    // Calculate overall stress on each muscle group
    const totalStress = {};
    exerciseProfiles.forEach(profile => {
      Object.entries(profile.stressScore).forEach(([muscle, score]) => {
        totalStress[muscle] = (totalStress[muscle] || 0) + score;
      });
    });
    
    // Check for excessive stress on any muscle group (>15)
    const excessiveStressMuscles = Object.entries(totalStress)
      .filter(([_, score]) => score > 15)
      .map(([muscle]) => muscle);
    
    // Check for opposing movement patterns
    const movementPatterns = exerciseProfiles.map(profile => profile.movement);
    const hasOpposingPatterns = (
      (movementPatterns.includes(MOVEMENT_PATTERNS.PUSH) && 
       movementPatterns.includes(MOVEMENT_PATTERNS.PULL)) ||
      (movementPatterns.includes(MOVEMENT_PATTERNS.SQUAT) && 
       movementPatterns.includes(MOVEMENT_PATTERNS.HINGE))
    );
    
    // Determine compatibility
    let compatible = true;
    const reasons = [];
    
    if (hasPrimaryOverlap) {
      compatible = false;
      reasons.push(`Overlapping primary muscles: ${overlapMuscles.join(', ')}`);
    }
    
    if (excessiveStressMuscles.length > 0) {
      compatible = false;
      reasons.push(`Excessive stress on: ${excessiveStressMuscles.join(', ')}`);
    }
    
    return {
      compatible,
      reasons: reasons.length > 0 ? reasons : ['Exercises are compatible'],
      exerciseProfiles,
      totalStress,
      hasOpposingPatterns
    };
  }
  
  /**
   * Recommend exercises based on recovery state
   * @param {Object} options - Options for recommendations
   * @returns {Array} Recommended exercises
   */
  recommendBasedOnRecovery(options = {}) {
    const {
      targetMuscles = [],
      excludeMuscles = [],
      minRecovery = 85, // minimum recovery percentage
      equipment = [],
      maxResults = 5
    } = options;
    
    // Get current recovery status
    const recoveryStatus = this.getMuscleRecoveryStatus();
    
    // Filter out muscles that are not recovered enough
    const recoveredMuscles = Object.entries(recoveryStatus)
      .filter(([_, status]) => status.recoveryLevel >= minRecovery)
      .map(([muscle]) => muscle);
    
    // Filter exercises based on recovered muscles
    const candidates = Object.entries(this.exerciseData)
      .filter(([_, data]) => {
        // Check if primary muscles are recovered
        const primaryRecovered = data.primaryMuscles.every(muscle => 
          recoveredMuscles.includes(muscle) || excludeMuscles.includes(muscle)
        );
        
        if (!primaryRecovered) return false;
        
        // Check for target muscles if specified
        if (targetMuscles.length > 0) {
          const hasTargetMuscle = data.primaryMuscles.some(muscle => 
            targetMuscles.includes(muscle)
          );
          
          if (!hasTargetMuscle) return false;
        }
        
        // Check equipment if specified
        if (equipment.length > 0) {
          return equipment.includes(data.equipment);
        }
        
        return true;
      })
      .map(([id, data]) => ({
        id,
        name: id.replace(/_/g, ' '),
        primaryMuscles: data.primaryMuscles,
        secondaryMuscles: data.secondaryMuscles,
        equipment: data.equipment,
        movement: data.movement,
        recoveryStatus: data.primaryMuscles.map(muscle => ({
          muscle,
          recovery: recoveryStatus[muscle]?.recoveryLevel || 100
        }))
      }));
    
    // Sort by best match (highest average recovery)
    candidates.sort((a, b) => {
      const aRecovery = a.recoveryStatus.reduce((sum, status) => sum + status.recovery, 0) / 
                       a.recoveryStatus.length;
      const bRecovery = b.recoveryStatus.reduce((sum, status) => sum + status.recovery, 0) / 
                       b.recoveryStatus.length;
      
      return bRecovery - aRecovery;
    });
    
    return candidates.slice(0, maxResults);
  }
}

export default {
  BiomechanicalAnalyzer,
  MUSCLE_GROUPS,
  MOVEMENT_PATTERNS,
  EQUIPMENT_TYPES,
  JOINT_ACTIONS,
  EXERCISE_ATTRIBUTES
}; 