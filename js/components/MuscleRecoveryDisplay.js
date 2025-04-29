/**
 * Muscle Recovery Display Component
 * Visualizes muscle recovery status from BiomechanicalAnalyzer data
 */

class MuscleRecoveryDisplay {
  constructor(container, biomechanicalAnalyzer) {
    this.container = container;
    this.analyzer = biomechanicalAnalyzer;
    this.element = null;
  }
  
  /**
   * Update the display with current data
   */
  update() {
    this.render();
  }
  
  /**
   * Get color for recovery percentage
   * @param {number} percentage - Recovery percentage (0-100)
   * @returns {string} CSS color
   */
  getRecoveryColor(percentage) {
    if (percentage >= 85) {
      return '#4CAF50'; // Green - fully recovered
    } else if (percentage >= 60) {
      return '#8BC34A'; // Light green - mostly recovered
    } else if (percentage >= 40) {
      return '#FFC107'; // Amber - partially recovered
    } else if (percentage >= 20) {
      return '#FF9800'; // Orange - still recovering
    } else {
      return '#F44336'; // Red - fatigued
    }
  }
  
  /**
   * Render the recovery display
   */
  render() {
    if (!this.container) return;
    
    // Clear previous content
    if (this.element) {
      this.element.remove();
    }
    
    // Create container
    this.element = document.createElement('div');
    this.element.className = 'muscle-recovery-display';
    
    // Add heading
    const heading = document.createElement('h3');
    heading.textContent = 'Muscle Recovery Status';
    this.element.appendChild(heading);
    
    // Get current stress levels
    const stressLevels = this.analyzer.getCurrentStressLevels();
    
    // Create muscle groups display
    const muscleGroups = {
      'Upper Body': ['Chest', 'Shoulders', 'Triceps', 'Biceps', 'Back', 'Forearms'],
      'Core': ['Core', 'Abs', 'Lower_Back', 'Obliques'],
      'Lower Body': ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves']
    };
    
    // Create grid container
    const gridContainer = document.createElement('div');
    gridContainer.className = 'muscle-recovery-grid';
    
    // Iterate through muscle groups
    for (const [groupName, muscles] of Object.entries(muscleGroups)) {
      
      // Create group container
      const groupContainer = document.createElement('div');
      groupContainer.className = 'muscle-group-container';
      
      // Add group title
      const groupTitle = document.createElement('h4');
      groupTitle.className = 'muscle-group-title';
      groupTitle.textContent = groupName;
      groupContainer.appendChild(groupTitle);
      
      // Add muscles
      muscles.forEach(muscle => {
        // Get stress level for this muscle
        const stress = stressLevels[muscle] || 0;
        const recoveryPercentage = Math.round((1 - stress) * 100);
        
        // Create muscle card
        const muscleCard = document.createElement('div');
        muscleCard.className = 'muscle-status';
        
        // Add appropriate class based on recovery state
        if (recoveryPercentage >= 80) {
          muscleCard.classList.add('recovered');
        } else if (recoveryPercentage >= 40) {
          muscleCard.classList.add('recovering');
        } else {
          muscleCard.classList.add('fatigued');
        }
        
        // Add muscle name
        const muscleName = document.createElement('div');
        muscleName.className = 'muscle-name';
        muscleName.textContent = muscle.replace('_', ' ');
        muscleCard.appendChild(muscleName);
        
        // Add recovery bar
        const barContainer = document.createElement('div');
        barContainer.className = 'recovery-bar-container';
        
        const recoveryBar = document.createElement('div');
        recoveryBar.className = 'recovery-bar';
        recoveryBar.style.width = `${recoveryPercentage}%`;
        recoveryBar.style.backgroundColor = this.getRecoveryColor(recoveryPercentage);
        
        barContainer.appendChild(recoveryBar);
        
        // Add percentage text
        const percentageText = document.createElement('div');
        percentageText.className = 'recovery-percentage';
        percentageText.textContent = `${recoveryPercentage}%`;
        barContainer.appendChild(percentageText);
        
        muscleCard.appendChild(barContainer);
        
        // Add recovery details text
        const recoveryDetails = document.createElement('div');
        recoveryDetails.className = 'recovery-details';
        
        if (recoveryPercentage >= 85) {
          recoveryDetails.textContent = 'Fully recovered';
        } else if (recoveryPercentage >= 60) {
          recoveryDetails.textContent = 'Mostly recovered';
        } else if (recoveryPercentage >= 40) {
          recoveryDetails.textContent = 'Partially recovered';
        } else if (recoveryPercentage >= 20) {
          recoveryDetails.textContent = 'Still recovering';
        } else {
          recoveryDetails.textContent = 'Fatigued';
        }
        
        muscleCard.appendChild(recoveryDetails);
        
        // Add to group container
        groupContainer.appendChild(muscleCard);
      });
      
      // Add group to grid
      gridContainer.appendChild(groupContainer);
    }
    
    // Add grid to main element
    this.element.appendChild(gridContainer);
    
    // Add to container
    this.container.appendChild(this.element);
    
    // Add CSS styles
    this.addStyles();
  }
  
  /**
   * Add CSS styles for the component
   */
  addStyles() {
    // Check if styles already exist
    if (document.getElementById('muscle-recovery-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'muscle-recovery-styles';
    styles.textContent = `
      .muscle-recovery-display {
        margin: 20px 0;
        padding: 15px;
        border-radius: 8px;
        background-color: #f8f9fa;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .muscle-recovery-display h3 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #333;
        font-size: 1.4rem;
      }
      
      .muscle-recovery-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;
      }
      
      .muscle-group-container {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      
      .muscle-group-title {
        margin: 0 0 5px 0;
        font-size: 1.1rem;
        color: #555;
        border-bottom: 1px solid #eee;
        padding-bottom: 5px;
      }
      
      .muscle-status {
        background-color: white;
        border-radius: 6px;
        padding: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        transition: transform 0.2s;
      }
      
      .muscle-status:hover {
        transform: translateY(-2px);
      }
      
      .muscle-status.recovered {
        border-left: 4px solid #4CAF50;
      }
      
      .muscle-status.recovering {
        border-left: 4px solid #FFC107;
      }
      
      .muscle-status.fatigued {
        border-left: 4px solid #F44336;
      }
      
      .muscle-name {
        font-weight: 500;
        margin-bottom: 8px;
        color: #333;
      }
      
      .recovery-bar-container {
        height: 8px;
        background-color: #f0f0f0;
        border-radius: 4px;
        margin-bottom: 8px;
        position: relative;
        overflow: hidden;
      }
      
      .recovery-bar {
        height: 100%;
        background-color: #4CAF50;
        border-radius: 4px;
        transition: width 0.3s ease;
      }
      
      .recovery-percentage {
        position: absolute;
        right: 5px;
        top: -4px;
        font-size: 0.75rem;
        color: #333;
        text-shadow: 0 0 2px white;
      }
      
      .recovery-details {
        font-size: 0.8rem;
        color: #666;
      }
      
      @media (max-width: 768px) {
        .muscle-recovery-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
}

export default MuscleRecoveryDisplay; 