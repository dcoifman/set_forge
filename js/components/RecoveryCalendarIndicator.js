/**
 * RecoveryCalendarIndicator
 * Displays muscle recovery status indicators in calendar cells
 */

import BiomechanicalAnalyzer from '../biomechanical-analyzer.js';

class RecoveryCalendarIndicator {
  constructor(calendarGrid) {
    this.calendarGrid = calendarGrid;
    this.analyzer = new BiomechanicalAnalyzer();
    this.dayElements = {};
    this.initialized = false;
  }

  /**
   * Initialize the recovery indicators
   */
  initialize() {
    if (this.initialized) return;
    this.initialized = true;
    
    // Add styles
    this.addStyles();
    
    // Create day element map
    const dayCells = document.querySelectorAll('.day-cell');
    dayCells.forEach(cell => {
      const dateAttr = cell.getAttribute('data-date');
      if (dateAttr) {
        this.dayElements[dateAttr] = cell;
      }
    });
    
    // Listen for changes to exercise history
    document.addEventListener('exercise-recorded', this.updateAllIndicators.bind(this));
    document.addEventListener('recovery-status-changed', this.updateAllIndicators.bind(this));
    
    // Initial update
    this.updateAllIndicators();
  }
  
  /**
   * Update all day cell indicators
   */
  updateAllIndicators() {
    const currentDate = new Date();
    const stressLevels = this.analyzer.getCurrentStressLevels();
    
    // Define muscle groups
    const muscleGroups = {
      'push': ['Chest', 'Triceps', 'Shoulders'],
      'pull': ['Back', 'Biceps', 'Forearms'],
      'legs': ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'],
      'core': ['Core', 'Abs', 'Lower_Back', 'Obliques']
    };
    
    // Calculate current recovery status for each muscle group
    const groupRecovery = {};
    for (const [group, muscles] of Object.entries(muscleGroups)) {
      let totalRecovery = 0;
      let muscleCount = 0;
      
      muscles.forEach(muscle => {
        const stress = stressLevels[muscle] || 0;
        const recovery = 1 - stress;
        totalRecovery += recovery;
        muscleCount++;
      });
      
      const avgRecovery = muscleCount > 0 ? totalRecovery / muscleCount : 1;
      groupRecovery[group] = avgRecovery;
    }
    
    // Project recovery for next 14 days
    for (const dateKey in this.dayElements) {
      const dayCell = this.dayElements[dateKey];
      const dateParts = dateKey.split('-');
      const cellDate = new Date(
        parseInt(dateParts[0]), 
        parseInt(dateParts[1]) - 1, 
        parseInt(dateParts[2])
      );
      
      // Calculate days from now
      const dayDiff = Math.floor((cellDate - currentDate) / (24 * 60 * 60 * 1000));
      
      // Only process current and future days
      if (dayDiff >= 0) {
        // Remove any existing indicators
        const existingIndicators = dayCell.querySelectorAll('.recovery-indicator');
        existingIndicators.forEach(ind => ind.remove());
        
        // Create indicator container
        const indicatorContainer = document.createElement('div');
        indicatorContainer.className = 'recovery-indicator-container';
        
        // Add indicators for each muscle group
        for (const [group, recovery] of Object.entries(groupRecovery)) {
          // Project recovery for this day in the future
          // Assuming a recovery rate that increases recovery by 20% per day (simplified model)
          const projectedRecovery = Math.min(1, recovery + (dayDiff * 0.2));
          
          // Create indicator dot
          const indicator = document.createElement('div');
          indicator.className = `recovery-indicator recovery-${group}`;
          
          // Set color based on recovery percentage
          const recoveryPercent = Math.round(projectedRecovery * 100);
          indicator.style.opacity = (projectedRecovery * 0.7) + 0.3; // Min opacity 0.3
          
          // Add tooltip
          indicator.setAttribute('title', `${group.charAt(0).toUpperCase() + group.slice(1)}: ${recoveryPercent}% recovered`);
          
          indicatorContainer.appendChild(indicator);
        }
        
        // Add to day cell
        dayCell.appendChild(indicatorContainer);
        
        // Add recovery status class to cell
        this.updateCellRecoveryClass(dayCell, groupRecovery);
      }
    }
  }
  
  /**
   * Update a cell's recovery class based on muscle group recovery
   * @param {Element} cell - Day cell element
   * @param {Object} groupRecovery - Recovery levels per muscle group
   */
  updateCellRecoveryClass(cell, groupRecovery) {
    // Remove existing classes
    cell.classList.remove('low-recovery', 'medium-recovery', 'high-recovery');
    
    // Calculate average recovery across all groups
    let totalRecovery = 0;
    let groupCount = 0;
    
    for (const recovery of Object.values(groupRecovery)) {
      totalRecovery += recovery;
      groupCount++;
    }
    
    const avgRecovery = groupCount > 0 ? totalRecovery / groupCount : 1;
    
    // Add appropriate class
    if (avgRecovery < 0.4) {
      cell.classList.add('low-recovery');
    } else if (avgRecovery < 0.7) {
      cell.classList.add('medium-recovery');
    } else {
      cell.classList.add('high-recovery');
    }
  }
  
  /**
   * Add custom styles
   */
  addStyles() {
    // Check if styles already exist
    if (document.getElementById('recovery-calendar-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'recovery-calendar-styles';
    styles.textContent = `
      .recovery-indicator-container {
        position: absolute;
        top: 5px;
        right: 5px;
        display: flex;
        gap: 3px;
        z-index: 2;
      }
      
      .recovery-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }
      
      .recovery-push {
        background-color: #4CAF50;
      }
      
      .recovery-pull {
        background-color: #2196F3;
      }
      
      .recovery-legs {
        background-color: #9C27B0;
      }
      
      .recovery-core {
        background-color: #FF9800;
      }
      
      .day-cell.low-recovery {
        border: 1px solid rgba(244, 67, 54, 0.5);
      }
      
      .day-cell.medium-recovery {
        border: 1px solid rgba(255, 152, 0, 0.5);
      }
      
      .day-cell.high-recovery {
        border: 1px solid rgba(76, 175, 80, 0.5);
      }
      
      .day-cell.week-expanded .recovery-indicator-container {
        top: 10px;
        right: 10px;
      }
      
      .day-cell.week-expanded .recovery-indicator {
        width: 10px;
        height: 10px;
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  /**
   * Get recovery level label for a percentage
   * @param {number} percentage - Recovery percentage
   * @returns {string} - Recovery level label
   */
  getRecoveryLevelLabel(percentage) {
    if (percentage >= 85) {
      return 'Fully recovered';
    } else if (percentage >= 60) {
      return 'Mostly recovered';
    } else if (percentage >= 40) {
      return 'Partially recovered';
    } else if (percentage >= 20) {
      return 'Still recovering';
    } else {
      return 'Fatigued';
    }
  }
}

export default RecoveryCalendarIndicator; 