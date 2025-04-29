/**
 * RecoveryInspectorTab Component
 * Displays muscle recovery information and recommendations based on biomechanical analyzer data
 */
export default class RecoveryInspectorTab {
  /**
   * Create a new RecoveryInspectorTab
   * @param {HTMLElement} container - The container element to render the tab content
   * @param {BiomechanicalAnalyzer} biomechanicalAnalyzer - The analyzer instance
   */
  constructor(container, biomechanicalAnalyzer) {
    this.container = container;
    this.biomechanicalAnalyzer = biomechanicalAnalyzer;
    
    // Store reference to this component instance on the container
    this.container._recoveryTab = this;
  }
  
  /**
   * Initialize the tab and create UI components
   */
  initialize() {
    this.createTabStructure();
    this.refreshData();
    
    // Add event listeners
    const refreshButton = this.container.querySelector('.refresh-recovery-data');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => this.refreshData());
    }
  }
  
  /**
   * Create the tab UI structure
   */
  createTabStructure() {
    this.container.innerHTML = `
      <div class="recovery-inspector">
        <div class="recovery-header">
          <h3>Muscle Recovery Status</h3>
          <button class="refresh-recovery-data">Refresh</button>
        </div>
        
        <div class="recovery-summary-container">
          <div class="recovery-chart-container">
            <canvas id="muscle-recovery-chart" width="400" height="300"></canvas>
          </div>
          
          <div class="recovery-stats">
            <div class="recovery-stat-item">
              <span class="stat-label">Overall Recovery:</span>
              <span class="stat-value" id="overall-recovery">--</span>
            </div>
            <div class="recovery-stat-item">
              <span class="stat-label">Next Recommended Session:</span>
              <span class="stat-value" id="next-session-time">--</span>
            </div>
          </div>
        </div>
        
        <div class="muscle-groups-container">
          <h4>Muscle Group Details</h4>
          <div id="muscle-groups-list" class="muscle-groups-list"></div>
        </div>
        
        <div class="recommendations-container">
          <h4>Recommendations</h4>
          <ul id="exercise-recommendations" class="recommendations-list"></ul>
        </div>
      </div>
    `;
    
    // Initialize chart if Chart.js is available
    if (window.Chart) {
      this.initializeChart();
    }
  }
  
  /**
   * Initialize the recovery visualization chart
   */
  initializeChart() {
    const ctx = document.getElementById('muscle-recovery-chart').getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: [],
        datasets: [{
          label: 'Recovery Level (%)',
          data: [],
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20
            }
          }
        }
      }
    });
  }
  
  /**
   * Refresh all recovery data and update the UI
   */
  refreshData() {
    // Get current stress levels
    const stressLevels = this.biomechanicalAnalyzer.getCurrentMuscleStress();
    
    // Update muscle group list
    this.updateMuscleGroupsList(stressLevels);
    
    // Update the chart if it exists
    if (this.chart) {
      this.updateChart(stressLevels);
    }
    
    // Update overall recovery stats
    this.updateOverallStats();
    
    // Update recommendations
    this.updateRecommendations();
  }
  
  /**
   * Update the muscle groups list with current recovery data
   * @param {Object} stressLevels - Current muscle stress levels
   */
  updateMuscleGroupsList(stressLevels) {
    const muscleGroupsList = this.container.querySelector('#muscle-groups-list');
    if (!muscleGroupsList) return;
    
    muscleGroupsList.innerHTML = '';
    
    // Sort muscle groups by recovery level (ascending)
    const muscleGroups = Object.keys(stressLevels).sort((a, b) => {
      return this.getRecoveryPercentage(stressLevels[a]) - 
             this.getRecoveryPercentage(stressLevels[b]);
    });
    
    for (const muscleGroup of muscleGroups) {
      const stressLevel = stressLevels[muscleGroup] || 0;
      const recoveryPercent = this.getRecoveryPercentage(stressLevel);
      
      const itemElement = document.createElement('div');
      itemElement.className = 'muscle-group-item';
      
      const statusClass = this.getRecoveryStatusClass(recoveryPercent);
      
      itemElement.innerHTML = `
        <div class="muscle-group-name">${muscleGroup}</div>
        <div class="recovery-bar-container">
          <div class="recovery-bar ${statusClass}" style="width: ${recoveryPercent}%"></div>
        </div>
        <div class="recovery-percentage">${recoveryPercent.toFixed(0)}%</div>
      `;
      
      muscleGroupsList.appendChild(itemElement);
    }
  }
  
  /**
   * Update the radar chart with current recovery data
   * @param {Object} stressLevels - Current muscle stress levels
   */
  updateChart(stressLevels) {
    const muscleGroups = Object.keys(stressLevels);
    const recoveryValues = muscleGroups.map(muscle => 
      this.getRecoveryPercentage(stressLevels[muscle])
    );
    
    this.chart.data.labels = muscleGroups;
    this.chart.data.datasets[0].data = recoveryValues;
    this.chart.update();
  }
  
  /**
   * Update overall recovery statistics
   */
  updateOverallStats() {
    const overallRecoveryElement = this.container.querySelector('#overall-recovery');
    const nextSessionElement = this.container.querySelector('#next-session-time');
    
    if (overallRecoveryElement) {
      const overallRecovery = this.biomechanicalAnalyzer.getOverallRecoveryPercentage();
      overallRecoveryElement.textContent = `${overallRecovery.toFixed(0)}%`;
      
      // Add color class based on recovery status
      overallRecoveryElement.className = 'stat-value ' + 
        this.getRecoveryStatusClass(overallRecovery);
    }
    
    if (nextSessionElement) {
      const readyForWorkout = this.biomechanicalAnalyzer.isReadyForWorkout();
      if (readyForWorkout) {
        nextSessionElement.textContent = 'Ready now';
        nextSessionElement.className = 'stat-value ready';
      } else {
        const hoursToRecover = this.biomechanicalAnalyzer.getEstimatedRecoveryTime();
        nextSessionElement.textContent = this.formatRecoveryTime(hoursToRecover);
        nextSessionElement.className = 'stat-value recovering';
      }
    }
  }
  
  /**
   * Update exercise recommendations
   */
  updateRecommendations() {
    const recommendationsElement = this.container.querySelector('#exercise-recommendations');
    if (!recommendationsElement) return;
    
    recommendationsElement.innerHTML = '';
    
    const recommendations = this.biomechanicalAnalyzer.getRecommendations();
    
    if (recommendations.length === 0) {
      const noRecsItem = document.createElement('li');
      noRecsItem.className = 'recommendation-item';
      noRecsItem.textContent = 'No recommendations available yet. Log more workouts for personalized suggestions.';
      recommendationsElement.appendChild(noRecsItem);
      return;
    }
    
    for (const recommendation of recommendations) {
      const recItem = document.createElement('li');
      recItem.className = 'recommendation-item';
      
      let recIcon = '🏋️';
      if (recommendation.type === 'rest') {
        recIcon = '💤';
      } else if (recommendation.type === 'light') {
        recIcon = '🚶';
      }
      
      recItem.innerHTML = `
        <span class="rec-icon">${recIcon}</span>
        <span class="rec-text">${recommendation.text}</span>
      `;
      
      recommendationsElement.appendChild(recItem);
    }
  }
  
  /**
   * Convert stress level to recovery percentage
   * @param {number} stressLevel - Current stress level
   * @return {number} Recovery percentage (0-100)
   */
  getRecoveryPercentage(stressLevel) {
    // Higher stress means lower recovery
    return Math.max(0, Math.min(100, 100 - (stressLevel || 0)));
  }
  
  /**
   * Get CSS class based on recovery percentage
   * @param {number} recoveryPercent - Recovery percentage
   * @return {string} CSS class name
   */
  getRecoveryStatusClass(recoveryPercent) {
    if (recoveryPercent >= 80) return 'recovered';
    if (recoveryPercent >= 50) return 'recovering';
    return 'fatigued';
  }
  
  /**
   * Format recovery time in a human-readable format
   * @param {number} hours - Hours until recovered
   * @return {string} Formatted time string
   */
  formatRecoveryTime(hours) {
    if (hours < 1) {
      return 'Less than 1 hour';
    } else if (hours < 24) {
      return `~${Math.round(hours)} hour${hours === 1 ? '' : 's'}`;
    } else {
      const days = Math.floor(hours / 24);
      return `~${days} day${days === 1 ? '' : 's'}`;
    }
  }
} 