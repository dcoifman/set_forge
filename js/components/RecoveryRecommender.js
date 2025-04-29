/**
 * RecoveryRecommender
 * Provides exercise recommendations based on muscle recovery status
 */

class RecoveryRecommender {
  constructor(analyzer, exerciseLibrary) {
    this.analyzer = analyzer;
    this.exerciseLibrary = exerciseLibrary;
  }
  
  /**
   * Get recommended exercises based on recovery status
   * @param {Object} options - Recommendation options
   * @returns {Array} - List of recommended exercises
   */
  getRecommendations(options = {}) {
    const {
      count = 5,
      minRecoveryThreshold = 0.7,
      preferredMuscleGroups = [],
      equipment = [],
      difficulty = 'all',
      sortBy = 'recovery' // 'recovery', 'effectiveness', 'popularity'
    } = options;
    
    // Get current stress levels
    const stressLevels = this.analyzer.getCurrentStressLevels();
    
    // Calculate recovery for each muscle
    const muscleRecovery = {};
    for (const [muscle, stress] of Object.entries(stressLevels)) {
      muscleRecovery[muscle] = 1 - stress;
    }
    
    // Prepare recommendations
    const recommendations = [];
    
    // Get all available exercises
    const allExercises = this.getAllExercises();
    
    // Score each exercise based on recovery status
    allExercises.forEach(exercise => {
      // Skip if equipment doesn't match
      if (equipment.length > 0 && !this.matchesEquipment(exercise, equipment)) {
        return;
      }
      
      // Skip if difficulty doesn't match
      if (difficulty !== 'all' && exercise.difficulty !== difficulty) {
        return;
      }
      
      // Get recovery score for this exercise
      const recoveryScore = this.calculateExerciseRecoveryScore(exercise, muscleRecovery);
      
      // Skip if below minimum threshold
      if (recoveryScore < minRecoveryThreshold) {
        return;
      }
      
      // Calculate additional scores
      const effectivenessScore = this.calculateEffectivenessScore(exercise);
      const popularityScore = exercise.popularity || 0.5;
      
      // Calculate final score based on sort preference
      let finalScore;
      switch (sortBy) {
        case 'recovery':
          finalScore = recoveryScore * 0.7 + effectivenessScore * 0.2 + popularityScore * 0.1;
          break;
        case 'effectiveness':
          finalScore = recoveryScore * 0.3 + effectivenessScore * 0.6 + popularityScore * 0.1;
          break;
        case 'popularity':
          finalScore = recoveryScore * 0.3 + effectivenessScore * 0.2 + popularityScore * 0.5;
          break;
        default:
          finalScore = recoveryScore * 0.7 + effectivenessScore * 0.2 + popularityScore * 0.1;
      }
      
      // Add preference bonus for preferred muscle groups
      if (preferredMuscleGroups.length > 0) {
        const targetsMuscleGroup = preferredMuscleGroups.some(group => 
          this.exerciseTargetsMuscleGroup(exercise, group)
        );
        
        if (targetsMuscleGroup) {
          finalScore += 0.2; // Bonus for targeting preferred muscles
        }
      }
      
      // Add to recommendations
      recommendations.push({
        exercise,
        recoveryScore,
        effectivenessScore,
        popularityScore,
        finalScore,
        muscleRecovery: this.getExerciseMuscleRecovery(exercise, muscleRecovery)
      });
    });
    
    // Sort by final score (highest first)
    recommendations.sort((a, b) => b.finalScore - a.finalScore);
    
    // Return top N recommendations
    return recommendations.slice(0, count);
  }
  
  /**
   * Get all exercises from the library
   * @returns {Array} - List of all exercises
   */
  getAllExercises() {
    // This would integrate with your exercise library
    // Return all exercises
    return this.exerciseLibrary.getAllExercises();
  }
  
  /**
   * Calculate recovery score for an exercise
   * @param {Object} exercise - Exercise data
   * @param {Object} muscleRecovery - Recovery levels per muscle
   * @returns {number} - Recovery score (0-1)
   */
  calculateExerciseRecoveryScore(exercise, muscleRecovery) {
    // Get targeted muscles
    const targetedMuscles = this.getExerciseTargetedMuscles(exercise);
    
    if (targetedMuscles.length === 0) {
      return 1; // No targeted muscles, assume fully recovered
    }
    
    // Calculate average recovery for targeted muscles
    let totalRecovery = 0;
    let primaryCount = 0;
    
    targetedMuscles.forEach(muscle => {
      const recovery = muscleRecovery[muscle] || 1;
      totalRecovery += recovery;
      primaryCount++;
    });
    
    return primaryCount > 0 ? totalRecovery / primaryCount : 1;
  }
  
  /**
   * Calculate effectiveness score for an exercise
   * @param {Object} exercise - Exercise data
   * @returns {number} - Effectiveness score (0-1)
   */
  calculateEffectivenessScore(exercise) {
    // This would be based on your exercise metadata
    // For now, return a default or random value
    return exercise.effectiveness || 0.7;
  }
  
  /**
   * Get targeted muscles for an exercise
   * @param {Object} exercise - Exercise data
   * @returns {Array} - List of targeted muscles
   */
  getExerciseTargetedMuscles(exercise) {
    // This would come from your exercise metadata
    return exercise.targetMuscles || [];
  }
  
  /**
   * Check if exercise targets a specific muscle group
   * @param {Object} exercise - Exercise data
   * @param {string} muscleGroup - Muscle group name
   * @returns {boolean} - True if exercise targets the muscle group
   */
  exerciseTargetsMuscleGroup(exercise, muscleGroup) {
    // Define muscle group mappings
    const muscleGroups = {
      'push': ['Chest', 'Triceps', 'Shoulders'],
      'pull': ['Back', 'Biceps', 'Forearms'],
      'legs': ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
      'core': ['Core', 'Abs', 'Lower_Back', 'Obliques']
    };
    
    // Get muscles in the group
    const musclesInGroup = muscleGroups[muscleGroup.toLowerCase()] || [];
    
    // Get targeted muscles for the exercise
    const targetedMuscles = this.getExerciseTargetedMuscles(exercise);
    
    // Check if any targeted muscle is in the group
    return targetedMuscles.some(muscle => musclesInGroup.includes(muscle));
  }
  
  /**
   * Check if exercise matches equipment constraints
   * @param {Object} exercise - Exercise data
   * @param {Array} equipment - Available equipment
   * @returns {boolean} - True if exercise matches equipment
   */
  matchesEquipment(exercise, equipment) {
    // If no equipment required, always matches
    if (!exercise.equipment || exercise.equipment === 'bodyweight') {
      return true;
    }
    
    // Check if required equipment is available
    return equipment.includes(exercise.equipment);
  }
  
  /**
   * Get recovery status for each muscle targeted by an exercise
   * @param {Object} exercise - Exercise data
   * @param {Object} muscleRecovery - Recovery levels per muscle
   * @returns {Object} - Recovery status per muscle
   */
  getExerciseMuscleRecovery(exercise, muscleRecovery) {
    const result = {};
    const targetedMuscles = this.getExerciseTargetedMuscles(exercise);
    
    targetedMuscles.forEach(muscle => {
      result[muscle] = {
        recovery: muscleRecovery[muscle] || 1,
        percentage: Math.round((muscleRecovery[muscle] || 1) * 100)
      };
    });
    
    return result;
  }
  
  /**
   * Get similar exercises that are optimized for recovery
   * @param {Object} exercise - The original exercise
   * @param {Object} options - Options for finding alternatives
   * @returns {Array} - Similar exercises with recovery scores
   */
  getSimilarExercises(exercise, options = {}) {
    if (!exercise || !this.exerciseLibrary) {
      console.error('[RecoveryRecommender] Cannot find similar exercises: Missing exercise data or library');
      return [];
    }
    
    const {
      count = 5,
      minRecoveryScore = 0.5,
      sameCategory = true,
      sameLevel = false,
      minEffectivenessScore = 0.7
    } = options;
    
    // Get current muscle recovery levels
    const stressLevels = this.analyzer.getCurrentStressLevels();
    const muscleRecovery = {};
    for (const [muscle, stress] of Object.entries(stressLevels)) {
      muscleRecovery[muscle] = 1 - stress;
    }
    
    // Get target muscles of the original exercise
    const targetMuscles = this.getExerciseTargetedMuscles(exercise);
    const category = exercise.category || '';
    
    // Get all exercises from library
    const allExercises = this.getAllExercises();
    
    // Filter and score alternatives
    const alternatives = allExercises
      .filter(alt => {
        // Exclude the original exercise
        if (alt.id === exercise.id) return false;
        
        // Respect category constraint
        if (sameCategory && alt.category !== category) return false;
        
        // Respect level constraint if needed
        if (sameLevel && alt.level !== exercise.level) return false;
        
        return true;
      })
      .map(alt => {
        // Calculate recovery score for this alternative
        const recoveryScore = this.calculateExerciseRecoveryScore(alt, muscleRecovery);
        
        // Calculate muscle similarity score (how well it targets the same muscles)
        const altTargetMuscles = this.getExerciseTargetedMuscles(alt);
        const muscleSimilarity = this.calculateMuscleSimilarity(targetMuscles, altTargetMuscles);
        
        // Calculate effectiveness score
        const effectivenessScore = this.calculateEffectivenessScore(alt);
        
        // Calculate final score - balance between recovery and similarity
        const finalScore = recoveryScore * 0.6 + muscleSimilarity * 0.3 + effectivenessScore * 0.1;
        
        return {
          exercise: alt,
          recoveryScore,
          muscleSimilarity,
          effectivenessScore,
          finalScore,
          muscleRecovery: this.getExerciseMuscleRecovery(alt, muscleRecovery)
        };
      })
      .filter(alt => {
        // Only keep alternatives with good recovery and effectiveness
        return alt.recoveryScore >= minRecoveryScore && 
               alt.effectivenessScore >= minEffectivenessScore;
      });
    
    // Sort by final score (highest first)
    alternatives.sort((a, b) => b.finalScore - a.finalScore);
    
    // Return top N alternatives
    return alternatives.slice(0, count);
  }
  
  /**
   * Calculate similarity between muscle groups
   * @param {Array} muscles1 - First set of muscles
   * @param {Array} muscles2 - Second set of muscles
   * @returns {number} - Similarity score (0-1)
   */
  calculateMuscleSimilarity(muscles1, muscles2) {
    if (!muscles1 || !muscles2 || muscles1.length === 0 || muscles2.length === 0) {
      return 0;
    }
    
    // Count muscles in both sets
    const intersection = muscles1.filter(m => muscles2.includes(m)).length;
    // Use Jaccard similarity: intersection over union
    const union = new Set([...muscles1, ...muscles2]).size;
    
    return union > 0 ? intersection / union : 0;
  }
}

export default RecoveryRecommender; 