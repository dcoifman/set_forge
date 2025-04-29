import { calculateWorkoutJointStress, evaluateWorkoutBalance } from '../exercises/library.js';

// Component to display joint stress information for a workout
export class JointStressDisplay {
  constructor(container, exercises = [], settings = {}) {
    this.container = container;
    this.exercises = exercises;
    this.settings = settings;
    this.element = null;
  }
  
  update(exercises, settings = {}) {
    this.exercises = exercises || this.exercises;
    this.settings = settings || this.settings;
    this.render();
  }
  
  getStressColor(level) {
    switch(level) {
      case 'low': return '#4CAF50'; // Green
      case 'moderate': return '#FFC107'; // Amber
      case 'high': return '#FF9800'; // Orange
      case 'very_high': return '#F44336'; // Red
      default: return '#9E9E9E'; // Gray
    }
  }
  
  renderJointVisualization(jointData) {
    // Create a simple human body joint visualization
    const svgWrapper = document.createElement('div');
    svgWrapper.className = 'joint-stress-svg-wrapper';
    
    // Basic SVG outline of human body with joint points
    const svg = `
      <svg viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg">
        <!-- Simple body outline -->
        <path d="M50,20 C65,20 70,30 70,40 C70,50 65,60 60,70 L60,100 L70,130 L65,170 M50,20 C35,20 30,30 30,40 C30,50 35,60 40,70 L40,100 L30,130 L35,170 M40,70 L60,70 L60,110 L40,110 Z" 
          stroke="#ccc" stroke-width="1" fill="none" />
        
        <!-- Joint points with dynamic colors -->
        <circle cx="50" cy="30" r="5" fill="${this.getStressColor(jointData.shoulders)}" title="Shoulders" class="joint-point" data-joint="shoulders" />
        <circle cx="35" cy="50" r="3" fill="${this.getStressColor(jointData.elbows)}" title="Left Elbow" class="joint-point" data-joint="elbows" />
        <circle cx="65" cy="50" r="3" fill="${this.getStressColor(jointData.elbows)}" title="Right Elbow" class="joint-point" data-joint="elbows" />
        <circle cx="30" cy="60" r="2" fill="${this.getStressColor(jointData.wrists)}" title="Left Wrist" class="joint-point" data-joint="wrists" />
        <circle cx="70" cy="60" r="2" fill="${this.getStressColor(jointData.wrists)}" title="Right Wrist" class="joint-point" data-joint="wrists" />
        <circle cx="50" cy="75" r="4" fill="${this.getStressColor(jointData.spine)}" title="Spine" class="joint-point" data-joint="spine" />
        <circle cx="40" cy="110" r="4" fill="${this.getStressColor(jointData.hips)}" title="Left Hip" class="joint-point" data-joint="hips" />
        <circle cx="60" cy="110" r="4" fill="${this.getStressColor(jointData.hips)}" title="Right Hip" class="joint-point" data-joint="hips" />
        <circle cx="35" cy="140" r="3" fill="${this.getStressColor(jointData.knees)}" title="Left Knee" class="joint-point" data-joint="knees" />
        <circle cx="65" cy="140" r="3" fill="${this.getStressColor(jointData.knees)}" title="Right Knee" class="joint-point" data-joint="knees" />
        <circle cx="35" cy="170" r="2" fill="${this.getStressColor(jointData.ankles)}" title="Left Ankle" class="joint-point" data-joint="ankles" />
        <circle cx="65" cy="170" r="2" fill="${this.getStressColor(jointData.ankles)}" title="Right Ankle" class="joint-point" data-joint="ankles" />
      </svg>
    `;
    
    svgWrapper.innerHTML = svg;
    return svgWrapper;
  }
  
  render() {
    if (!this.container) return;
    
    // Clear previous content
    if (this.element) {
      this.element.remove();
    }
    
    // Create container
    this.element = document.createElement('div');
    this.element.className = 'joint-stress-display';
    
    // Add heading
    const heading = document.createElement('h3');
    heading.textContent = 'Biomechanical Joint Stress';
    this.element.appendChild(heading);
    
    // Calculate joint stress
    const stressData = calculateWorkoutJointStress(this.exercises, this.settings);
    const balanceData = evaluateWorkoutBalance(stressData);
    
    // Create display container
    const displayContainer = document.createElement('div');
    displayContainer.className = 'joint-stress-display-container';
    
    // Add body visualization on the left
    const visualizationContainer = document.createElement('div');
    visualizationContainer.className = 'joint-stress-visualization';
    
    // Add joint visualization
    visualizationContainer.appendChild(this.renderJointVisualization(stressData.riskLevels));
    
    // Add legend
    const legend = document.createElement('div');
    legend.className = 'joint-stress-legend';
    legend.innerHTML = `
      <div class="legend-item">
        <span class="legend-color" style="background-color: ${this.getStressColor('low')}"></span>
        <span class="legend-label">Low</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background-color: ${this.getStressColor('moderate')}"></span>
        <span class="legend-label">Moderate</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background-color: ${this.getStressColor('high')}"></span>
        <span class="legend-label">High</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background-color: ${this.getStressColor('very_high')}"></span>
        <span class="legend-label">Very High</span>
      </div>
    `;
    visualizationContainer.appendChild(legend);
    
    // Add details on the right
    const detailsContainer = document.createElement('div');
    detailsContainer.className = 'joint-stress-details';
    
    // Add overall balance status
    const balanceStatus = document.createElement('div');
    balanceStatus.className = `balance-status ${balanceData.isBalanced ? 'balanced' : 'imbalanced'}`;
    balanceStatus.textContent = balanceData.isBalanced ? 
      'Workout is well-balanced' : 
      'Workout has potential joint stress imbalances';
    detailsContainer.appendChild(balanceStatus);
    
    // Add joint stress breakdown
    const breakdownContainer = document.createElement('div');
    breakdownContainer.className = 'joint-stress-breakdown';
    
    Object.entries(stressData.riskLevels).forEach(([joint, level]) => {
      const jointRow = document.createElement('div');
      jointRow.className = `joint-row ${level}`;
      
      const jointName = document.createElement('span');
      jointName.className = 'joint-name';
      jointName.textContent = joint.charAt(0).toUpperCase() + joint.slice(1);
      
      const jointLevel = document.createElement('span');
      jointLevel.className = 'joint-level';
      jointLevel.textContent = level.replace('_', ' ');
      jointLevel.style.color = this.getStressColor(level);
      
      jointRow.appendChild(jointName);
      jointRow.appendChild(jointLevel);
      breakdownContainer.appendChild(jointRow);
    });
    
    detailsContainer.appendChild(breakdownContainer);
    
    // Add recommendations if any
    if (balanceData.recommendations && balanceData.recommendations.length > 0) {
      const recommendationsContainer = document.createElement('div');
      recommendationsContainer.className = 'joint-stress-recommendations';
      
      const recommendationsTitle = document.createElement('h4');
      recommendationsTitle.textContent = 'Recommendations';
      recommendationsContainer.appendChild(recommendationsTitle);
      
      const recommendationsList = document.createElement('ul');
      balanceData.recommendations.forEach(rec => {
        const item = document.createElement('li');
        item.textContent = rec;
        recommendationsList.appendChild(item);
      });
      
      recommendationsContainer.appendChild(recommendationsList);
      detailsContainer.appendChild(recommendationsContainer);
    }
    
    // Add everything to the display container
    displayContainer.appendChild(visualizationContainer);
    displayContainer.appendChild(detailsContainer);
    this.element.appendChild(displayContainer);
    
    // Append to container
    this.container.appendChild(this.element);
    
    // Add CSS styles
    this.addStyles();
  }
  
  addStyles() {
    // Check if styles already exist
    if (document.getElementById('joint-stress-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'joint-stress-styles';
    styles.textContent = `
      .joint-stress-display {
        margin: 20px 0;
        padding: 15px;
        border-radius: 8px;
        background-color: #f8f9fa;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .joint-stress-display h3 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #333;
      }
      
      .joint-stress-display-container {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
      }
      
      .joint-stress-visualization {
        flex: 1;
        min-width: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .joint-stress-svg-wrapper {
        width: 150px;
        margin-bottom: 15px;
      }
      
      .joint-stress-svg-wrapper svg {
        width: 100%;
        height: auto;
      }
      
      .joint-point {
        cursor: pointer;
        transition: r 0.2s;
      }
      
      .joint-point:hover {
        r: 6;
      }
      
      .joint-stress-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 10px;
        justify-content: center;
      }
      
      .legend-item {
        display: flex;
        align-items: center;
        margin-right: 10px;
      }
      
      .legend-color {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        margin-right: 5px;
      }
      
      .joint-stress-details {
        flex: 2;
        min-width: 250px;
      }
      
      .balance-status {
        padding: 8px 12px;
        border-radius: 4px;
        margin-bottom: 15px;
        font-weight: bold;
      }
      
      .balance-status.balanced {
        background-color: rgba(76, 175, 80, 0.2);
        color: #2E7D32;
      }
      
      .balance-status.imbalanced {
        background-color: rgba(255, 152, 0, 0.2);
        color: #E65100;
      }
      
      .joint-stress-breakdown {
        margin-bottom: 15px;
      }
      
      .joint-row {
        display: flex;
        justify-content: space-between;
        padding: 5px 0;
        border-bottom: 1px solid #eee;
      }
      
      .joint-stress-recommendations h4 {
        margin-top: 0;
        margin-bottom: 10px;
        color: #555;
      }
      
      .joint-stress-recommendations ul {
        margin: 0;
        padding-left: 20px;
      }
      
      .joint-stress-recommendations li {
        margin-bottom: 5px;
      }
    `;
    
    document.head.appendChild(styles);
  }
}

export default JointStressDisplay; 