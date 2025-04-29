/**
 * Biomechanical Stress Scoring System
 * Tracks and analyzes joint stress across workouts
 */

// Define joint types for stress tracking
export const JOINT_TYPES = {
  SHOULDER: 'shoulder',
  ELBOW: 'elbow',
  WRIST: 'wrist',
  SPINE: 'spine',
  HIP: 'hip',
  KNEE: 'knee',
  ANKLE: 'ankle'
};

// Define stress levels
export const STRESS_LEVELS = {
  LOW: 'low',           // 0-25% - Minimal impact, suitable for recovery
  MODERATE: 'moderate', // 26-50% - Regular training stimulus
  HIGH: 'high',         // 51-75% - Significant training stimulus, watch volume
  VERY_HIGH: 'very-high' // 76-100% - Maximum stimulus, limit frequency
};

// Maps stress levels to numeric values for calculations
const STRESS_VALUES = {
  [STRESS_LEVELS.LOW]: 1,
  [STRESS_LEVELS.MODERATE]: 2,
  [STRESS_LEVELS.HIGH]: 3,
  [STRESS_LEVELS.VERY_HIGH]: 4
};

/**
 * Calculate joint stress score based on exercise parameters
 * @param {Object} exercise - Exercise data
 * @param {Object} performanceData - Sets, reps, weight, etc.
 * @returns {Object} Joint stress scores by joint type
 */
export function calculateExerciseJointStress(exercise, performanceData = {}) {
  if (!exercise || !exercise.biomechanics) {
    return {};
  }
  
  const { sets = 1, reps = 1, weight = 0, rpe = 5 } = performanceData;
  
  // Calculate volume factor (sets × reps × weight)
  const volumeFactor = sets * reps * (1 + (weight / 100));
  
  // Calculate intensity factor (RPE based)
  const intensityFactor = rpe / 10;
  
  // Calculate total exercise stress score
  const exerciseStressScore = volumeFactor * intensityFactor;
  
  // Distribute stress across joints based on exercise biomechanics
  const jointStress = {};
  
  for (const [joint, impactLevel] of Object.entries(exercise.biomechanics)) {
    const impactFactor = STRESS_VALUES[impactLevel] / 4; // Normalize to 0.25-1
    jointStress[joint] = exerciseStressScore * impactFactor;
  }
  
  return jointStress;
}

/**
 * Aggregate joint stress across multiple exercises
 * @param {Array} exercises - Array of exercises with their biomechanics data
 * @param {Array} performanceData - Array of performance data matching exercises
 * @returns {Object} Aggregated joint stress scores by joint type
 */
export function calculateWorkoutJointStress(exercises, performanceData = []) {
  if (!exercises || !exercises.length) {
    return {};
  }
  
  // Initialize stress accumulator for each joint type
  const totalJointStress = Object.values(JOINT_TYPES).reduce((acc, joint) => {
    acc[joint] = 0;
    return acc;
  }, {});
  
  // Calculate and aggregate stress for each exercise
  exercises.forEach((exercise, index) => {
    if (!exercise || !exercise.biomechanics) return;
    
    const performance = performanceData[index] || {};
    const exerciseStress = calculateExerciseJointStress(exercise, performance);
    
    // Add exercise stress to total
    for (const [joint, stress] of Object.entries(exerciseStress)) {
      if (totalJointStress[joint] !== undefined) {
        totalJointStress[joint] += stress;
      }
    }
  });
  
  return totalJointStress;
}

/**
 * Calculate stress balance ratio across joint pairs
 * @param {Object} jointStress - Aggregated joint stress data
 * @returns {Object} Balance ratios for related joint pairs
 */
export function calculateJointStressBalance(jointStress) {
  // Define related joint pairs to compare
  const jointPairs = [
    { name: 'upper/lower', joints: ['shoulder', 'elbow', 'wrist'], vs: ['hip', 'knee', 'ankle'] },
    { name: 'push/pull', joints: ['shoulder_push', 'elbow_push'], vs: ['shoulder_pull', 'elbow_pull'] },
    { name: 'anterior/posterior', joints: ['knee', 'shoulder_anterior'], vs: ['hip', 'shoulder_posterior'] }
  ];
  
  const balanceRatios = {};
  
  jointPairs.forEach(pair => {
    // Sum stress for first group
    const group1Stress = pair.joints.reduce((sum, joint) => {
      return sum + (jointStress[joint] || 0);
    }, 0);
    
    // Sum stress for second group
    const group2Stress = pair.vs.reduce((sum, joint) => {
      return sum + (jointStress[joint] || 0);
    }, 0);
    
    // Calculate ratio (avoid division by zero)
    let ratio = 1;
    if (group1Stress === 0 && group2Stress === 0) {
      ratio = 1; // Balanced if both are zero
    } else if (group2Stress === 0) {
      ratio = group1Stress > 0 ? 5 : 1; // Max imbalance if denominator is zero
    } else {
      ratio = group1Stress / group2Stress;
    }
    
    balanceRatios[pair.name] = {
      ratio,
      isBalanced: ratio >= 0.7 && ratio <= 1.3,
      group1: group1Stress,
      group2: group2Stress
    };
  });
  
  return balanceRatios;
}

/**
 * Categorize joint stress levels
 * @param {Object} jointStress - Joint stress data
 * @returns {Object} Categorized stress levels by joint
 */
export function categorizeJointStress(jointStress) {
  if (!jointStress) return {};
  
  // Find max stress value for normalization
  const maxStress = Math.max(
    0.1, // Avoid division by zero
    ...Object.values(jointStress)
  );
  
  const categorized = {};
  
  for (const [joint, stress] of Object.entries(jointStress)) {
    // Normalize stress value to 0-100%
    const normalizedStress = (stress / maxStress) * 100;
    
    // Categorize based on normalized value
    let level;
    if (normalizedStress <= 25) {
      level = STRESS_LEVELS.LOW;
    } else if (normalizedStress <= 50) {
      level = STRESS_LEVELS.MODERATE;
    } else if (normalizedStress <= 75) {
      level = STRESS_LEVELS.HIGH;
    } else {
      level = STRESS_LEVELS.VERY_HIGH;
    }
    
    categorized[joint] = {
      raw: stress,
      normalized: normalizedStress,
      level
    };
  }
  
  return categorized;
}

/**
 * Get recommendations based on joint stress analysis
 * @param {Object} categorizedStress - Categorized joint stress data
 * @param {Object} balanceRatios - Balance ratios between joint groups
 * @returns {Array} Array of recommendation objects
 */
export function getJointStressRecommendations(categorizedStress, balanceRatios) {
  const recommendations = [];
  
  // Check for high stress joints
  const highStressJoints = Object.entries(categorizedStress)
    .filter(([_, data]) => data.level === STRESS_LEVELS.HIGH || data.level === STRESS_LEVELS.VERY_HIGH)
    .map(([joint, _]) => joint);
  
  if (highStressJoints.length > 0) {
    recommendations.push({
      type: 'warning',
      title: 'High Joint Stress Detected',
      message: `Consider reducing volume or intensity for exercises targeting: ${highStressJoints.join(', ')}`,
      joints: highStressJoints
    });
  }
  
  // Check balance ratios
  for (const [pairName, data] of Object.entries(balanceRatios)) {
    if (!data.isBalanced) {
      const imbalanceDirection = data.ratio > 1 ? 'first' : 'second';
      const imbalanceRatio = data.ratio > 1 ? data.ratio : 1 / data.ratio;
      
      // Only flag significant imbalances
      if (imbalanceRatio > 1.5) {
        recommendations.push({
          type: 'imbalance',
          title: `${pairName.charAt(0).toUpperCase() + pairName.slice(1)} Imbalance`,
          message: `Your ${pairName} ratio is ${imbalanceRatio.toFixed(1)}:1, favoring the ${imbalanceDirection} group`,
          data: data
        });
      }
    }
  }
  
  // Recovery recommendations for overall stress
  const totalStress = Object.values(categorizedStress).reduce((sum, data) => sum + data.raw, 0);
  if (totalStress > 30) {
    recommendations.push({
      type: 'recovery',
      title: 'Recovery Needed',
      message: 'High overall joint stress detected. Consider a recovery day or deload week.',
      stress: totalStress
    });
  }
  
  return recommendations;
}

/**
 * Track joint stress over time for a user
 * @param {string} userId - User ID
 * @param {Object} workoutStress - Joint stress from current workout
 * @param {Object} userStressHistory - Previous stress history
 * @returns {Object} Updated stress history
 */
export function trackJointStressHistory(userId, workoutStress, userStressHistory = {}) {
  if (!userId || !workoutStress) return userStressHistory;
  
  const history = { ...userStressHistory };
  const today = new Date().toISOString().split('T')[0];
  
  // Initialize user history if needed
  if (!history[userId]) {
    history[userId] = {
      dailyStress: {},
      weeklyAverages: {},
      accumulation: { ...workoutStress }
    };
  }
  
  // Add today's stress
  history[userId].dailyStress[today] = workoutStress;
  
  // Update accumulation
  for (const [joint, stress] of Object.entries(workoutStress)) {
    if (!history[userId].accumulation[joint]) {
      history[userId].accumulation[joint] = 0;
    }
    history[userId].accumulation[joint] += stress;
  }
  
  // Calculate weekly averages
  const last7Days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push(date.toISOString().split('T')[0]);
  }
  
  const weeklyData = {};
  for (const joint of Object.keys(JOINT_TYPES)) {
    let total = 0;
    let days = 0;
    
    for (const day of last7Days) {
      if (history[userId].dailyStress[day] && history[userId].dailyStress[day][joint]) {
        total += history[userId].dailyStress[day][joint];
        days++;
      }
    }
    
    weeklyData[joint] = days > 0 ? total / days : 0;
  }
  
  history[userId].weeklyAverages = weeklyData;
  
  return history;
}

export default {
  JOINT_TYPES,
  STRESS_LEVELS,
  calculateExerciseJointStress,
  calculateWorkoutJointStress,
  calculateJointStressBalance,
  categorizeJointStress,
  getJointStressRecommendations,
  trackJointStressHistory
}; 