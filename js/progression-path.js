class ProgressionPath {
  constructor(pathName, exercises = [], userId = null) {
    this.pathName = pathName;
    this.exercises = exercises; // Array of exercise objects with progression details
    this.userId = userId;
    this.currentExerciseIndex = 0;
    this.completedExercises = new Set();
    this.biomechanicalAnalyzer = new BiomechanicalAnalyzer();
    
    // Load user progress if userId is provided
    if (userId) {
      this.loadUserProgress();
    }
  }
  
  /**
   * Loads saved user progress from localStorage
   */
  loadUserProgress() {
    const savedProgress = localStorage.getItem(`progression_${this.userId}_${this.pathName}`);
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      this.currentExerciseIndex = progress.currentExerciseIndex || 0;
      this.completedExercises = new Set(progress.completedExercises || []);
    }
  }
  
  /**
   * Saves current progress to localStorage
   */
  saveProgress() {
    if (!this.userId) return;
    
    const progress = {
      currentExerciseIndex: this.currentExerciseIndex,
      completedExercises: Array.from(this.completedExercises)
    };
    
    localStorage.setItem(`progression_${this.userId}_${this.pathName}`, JSON.stringify(progress));
  }
  
  /**
   * Checks if user can progress to the next exercise
   * @param {number} exerciseIndex - Index of the exercise to check
   * @returns {Object} - Object with {canProgress, reason}
   */
  canProgressToExercise(exerciseIndex) {
    if (exerciseIndex === 0) return { canProgress: true };
    
    // Check if previous exercise is completed
    const previousIndex = exerciseIndex - 1;
    if (!this.isExerciseCompleted(previousIndex)) {
      return {
        canProgress: false,
        reason: "Complete previous exercise first"
      };
    }
    
    // Check if the user's muscles are recovered enough
    const exercise = this.exercises[exerciseIndex];
    const muscleReadiness = this.biomechanicalAnalyzer.canPerformExercise(exercise.name);
    if (!muscleReadiness.canPerform) {
      return {
        canProgress: false,
        reason: `Insufficient recovery: ${muscleReadiness.reason}`
      };
    }
    
    return { canProgress: true };
  }
  
  /**
   * Get the next exercise in the progression path
   * @returns {Object} - Next exercise or null if at the end
   */
  getNextExercise() {
    if (this.currentExerciseIndex >= this.exercises.length - 1) {
      return null;
    }
    return this.exercises[this.currentExerciseIndex + 1];
  }
  
  /**
   * Get the current exercise in the progression path
   * @returns {Object} - Current exercise
   */
  getCurrentExercise() {
    return this.exercises[this.currentExerciseIndex];
  }
  
  /**
   * Marks an exercise as completed
   * @param {number} index - Index of the exercise
   */
  completeExercise(index) {
    const exercise = this.exercises[index];
    if (!exercise) return;
    
    this.completedExercises.add(index);
    
    // Record the exercise in the biomechanical analyzer
    this.biomechanicalAnalyzer.recordExercise(exercise.name, exercise.stress || {});
    
    // If this is the current exercise, move to the next one
    if (index === this.currentExerciseIndex) {
      this.currentExerciseIndex++;
    }
    
    this.saveProgress();
  }
  
  /**
   * Checks if an exercise is completed
   * @param {number} index - Index of the exercise
   * @returns {boolean} - True if completed
   */
  isExerciseCompleted(index) {
    return this.completedExercises.has(index);
  }
  
  /**
   * Renders the progression path HTML
   * @param {string} containerId - ID of the container element
   */
  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    const pathElement = document.createElement('div');
    pathElement.className = 'progression-path';
    
    this.exercises.forEach((exercise, index) => {
      const isCompleted = this.isExerciseCompleted(index);
      const isCurrent = index === this.currentExerciseIndex;
      const progressCheck = this.canProgressToExercise(index);
      const isLocked = !progressCheck.canProgress;
      
      // Create exercise node
      const exerciseNode = document.createElement('div');
      exerciseNode.className = `progression-exercise ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`;
      
      // Create icon
      const icon = document.createElement('div');
      icon.className = `exercise-icon ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`;
      icon.innerHTML = isCompleted ? '✓' : (isLocked ? '🔒' : (index + 1));
      
      // Create details
      const details = document.createElement('div');
      details.className = 'exercise-details';
      
      const name = document.createElement('div');
      name.className = 'exercise-name';
      name.textContent = exercise.name;
      
      const level = document.createElement('div');
      level.className = 'exercise-level';
      level.textContent = `Level: ${exercise.level || 'Beginner'}`;
      
      const stress = document.createElement('div');
      stress.className = 'exercise-stress';
      stress.textContent = this.formatStressLevel(exercise.stress);
      
      details.appendChild(name);
      details.appendChild(level);
      details.appendChild(stress);
      
      // Create actions
      const actions = document.createElement('div');
      actions.className = 'exercise-actions';
      
      if (!isCompleted) {
        const button = document.createElement('button');
        button.className = `exercise-button ${isLocked ? 'locked' : (isCurrent ? 'start' : 'complete')}`;
        button.textContent = isLocked ? 'Locked' : (isCurrent ? 'Start' : 'Complete');
        
        if (isLocked) {
          button.title = progressCheck.reason;
        } else {
          button.addEventListener('click', () => this.completeExercise(index));
        }
        
        actions.appendChild(button);
      }
      
      // Assemble the node
      exerciseNode.appendChild(icon);
      exerciseNode.appendChild(details);
      exerciseNode.appendChild(actions);
      
      // Add connector if not the last exercise
      if (index < this.exercises.length - 1) {
        const connector = document.createElement('div');
        connector.className = 'progression-path-connector';
        pathElement.appendChild(exerciseNode);
        pathElement.appendChild(connector);
      } else {
        pathElement.appendChild(exerciseNode);
      }
    });
    
    container.appendChild(pathElement);
    
    // Add recommendations section
    this.renderRecommendations(container);
  }
  
  /**
   * Renders exercise recommendations based on muscle recovery
   * @param {Element} container - Container element
   */
  renderRecommendations(container) {
    const recommendationsSection = document.createElement('div');
    recommendationsSection.className = 'recommended-exercises';
    
    const title = document.createElement('div');
    title.className = 'recommendations-title';
    title.textContent = 'Recommended Exercises';
    
    const grid = document.createElement('div');
    grid.className = 'recommendations-grid';
    
    // Get recommendations from biomechanical analyzer
    const recommendations = this.biomechanicalAnalyzer.getRecommendedExercises();
    
    recommendations.forEach(rec => {
      const card = document.createElement('div');
      card.className = 'recommendation-card';
      
      const type = document.createElement('div');
      type.className = 'recommendation-type';
      type.textContent = rec.type || 'Ready for Training';
      
      const name = document.createElement('div');
      name.className = 'recommendation-name';
      name.textContent = rec.name;
      
      const details = document.createElement('div');
      details.className = 'recommendation-details';
      details.textContent = rec.details || '';
      
      const recovery = document.createElement('div');
      recovery.className = 'recommendation-recovery';
      
      const indicator = document.createElement('div');
      indicator.className = 'recovery-indicator';
      
      const value = document.createElement('div');
      value.className = 'recovery-value';
      value.style.width = `${rec.recoveryPercentage}%`;
      
      const text = document.createElement('div');
      text.className = 'recovery-text';
      text.textContent = `${rec.recoveryPercentage}% Ready`;
      
      indicator.appendChild(value);
      recovery.appendChild(indicator);
      recovery.appendChild(text);
      
      card.appendChild(type);
      card.appendChild(name);
      card.appendChild(details);
      card.appendChild(recovery);
      
      grid.appendChild(card);
    });
    
    recommendationsSection.appendChild(title);
    recommendationsSection.appendChild(grid);
    
    container.appendChild(recommendationsSection);
  }
  
  /**
   * Formats the stress level object into a readable string
   * @param {Object} stress - Stress level object
   * @returns {string} - Formatted stress description
   */
  formatStressLevel(stress) {
    if (!stress) return 'Stress: Low overall';
    
    const stressPoints = [];
    for (const muscle in stress) {
      if (stress[muscle] > 0.6) {
        stressPoints.push(`${muscle} (High)`);
      } else if (stress[muscle] > 0.3) {
        stressPoints.push(`${muscle} (Medium)`);
      }
    }
    
    return stressPoints.length > 0 
      ? `Primary stress: ${stressPoints.join(', ')}` 
      : 'Stress: Balanced';
  }
  
  /**
   * Static method to create predefined progression paths
   * @param {string} pathName - Name of the path
   * @param {string} userId - User ID
   * @returns {ProgressionPath} - Configured progression path
   */
  static createPath(pathName, userId = null) {
    const paths = {
      'pushup': [
        {
          name: 'Wall Pushups',
          level: 'Beginner',
          stress: { 'Chest': 0.2, 'Triceps': 0.2, 'Shoulders': 0.2 }
        },
        {
          name: 'Incline Pushups',
          level: 'Beginner',
          stress: { 'Chest': 0.3, 'Triceps': 0.3, 'Shoulders': 0.3 }
        },
        {
          name: 'Knee Pushups',
          level: 'Beginner',
          stress: { 'Chest': 0.4, 'Triceps': 0.4, 'Shoulders': 0.3 }
        },
        {
          name: 'Full Pushups',
          level: 'Intermediate',
          stress: { 'Chest': 0.5, 'Triceps': 0.5, 'Shoulders': 0.4, 'Core': 0.3 }
        },
        {
          name: 'Diamond Pushups',
          level: 'Intermediate',
          stress: { 'Chest': 0.5, 'Triceps': 0.7, 'Shoulders': 0.4, 'Core': 0.3 }
        },
        {
          name: 'Decline Pushups',
          level: 'Advanced',
          stress: { 'Chest': 0.7, 'Triceps': 0.6, 'Shoulders': 0.5, 'Core': 0.4 }
        },
        {
          name: 'One-Arm Pushup Progression',
          level: 'Advanced',
          stress: { 'Chest': 0.8, 'Triceps': 0.7, 'Shoulders': 0.6, 'Core': 0.5 }
        }
      ],
      'squat': [
        {
          name: 'Assisted Squats',
          level: 'Beginner',
          stress: { 'Quadriceps': 0.2, 'Hamstrings': 0.2, 'Glutes': 0.2 }
        },
        {
          name: 'Box Squats',
          level: 'Beginner',
          stress: { 'Quadriceps': 0.3, 'Hamstrings': 0.3, 'Glutes': 0.3 }
        },
        {
          name: 'Body Weight Squats',
          level: 'Beginner',
          stress: { 'Quadriceps': 0.4, 'Hamstrings': 0.4, 'Glutes': 0.4, 'Core': 0.2 }
        },
        {
          name: 'Split Squats',
          level: 'Intermediate',
          stress: { 'Quadriceps': 0.5, 'Hamstrings': 0.4, 'Glutes': 0.5, 'Core': 0.3 }
        },
        {
          name: 'Goblet Squats',
          level: 'Intermediate',
          stress: { 'Quadriceps': 0.6, 'Hamstrings': 0.5, 'Glutes': 0.6, 'Core': 0.4 }
        },
        {
          name: 'Pistol Squat Progression',
          level: 'Advanced',
          stress: { 'Quadriceps': 0.7, 'Hamstrings': 0.5, 'Glutes': 0.7, 'Core': 0.6 }
        },
        {
          name: 'Pistol Squats',
          level: 'Advanced',
          stress: { 'Quadriceps': 0.8, 'Hamstrings': 0.6, 'Glutes': 0.8, 'Core': 0.7 }
        }
      ],
      'pullup': [
        {
          name: 'Dead Hangs',
          level: 'Beginner',
          stress: { 'Forearms': 0.3, 'Shoulders': 0.2, 'Back': 0.1 }
        },
        {
          name: 'Scapular Pulls',
          level: 'Beginner',
          stress: { 'Back': 0.3, 'Shoulders': 0.3, 'Forearms': 0.3 }
        },
        {
          name: 'Negative Pullups',
          level: 'Beginner',
          stress: { 'Back': 0.4, 'Biceps': 0.4, 'Forearms': 0.4, 'Shoulders': 0.3 }
        },
        {
          name: 'Assisted Pullups',
          level: 'Intermediate',
          stress: { 'Back': 0.5, 'Biceps': 0.5, 'Forearms': 0.4, 'Shoulders': 0.4 }
        },
        {
          name: 'Chin-ups',
          level: 'Intermediate',
          stress: { 'Biceps': 0.7, 'Back': 0.5, 'Forearms': 0.5, 'Shoulders': 0.4 }
        },
        {
          name: 'Full Pullups',
          level: 'Advanced',
          stress: { 'Back': 0.7, 'Biceps': 0.6, 'Forearms': 0.6, 'Shoulders': 0.5 }
        },
        {
          name: 'Weighted Pullups',
          level: 'Advanced',
          stress: { 'Back': 0.8, 'Biceps': 0.7, 'Forearms': 0.7, 'Shoulders': 0.6 }
        }
      ]
    };
    
    if (!paths[pathName]) {
      throw new Error(`Unknown progression path: ${pathName}`);
    }
    
    return new ProgressionPath(pathName, paths[pathName], userId);
  }
} 