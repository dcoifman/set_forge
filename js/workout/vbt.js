import vbtAdjust from '../velocityAutoReg.js'; // Import the default export

export function updateCardVbtIndicator(card, vbtValue) {
    // Remove any existing VBT classes
    card.classList.remove('vbt-low', 'vbt-moderate', 'vbt-high');

    // Add appropriate class based on VBT target
    const vbtTarget = parseInt(vbtValue, 10);
    if (vbtTarget <= 10) {
        card.classList.add('vbt-low'); // Low velocity loss - power/speed focus
    } else if (vbtTarget >= 30) {
        card.classList.add('vbt-high'); // High velocity loss - hypertrophy focus
    } else {
        card.classList.add('vbt-moderate'); // Moderate - strength focus
    }
}

// Add openVbtModal function below

// Function to calculate recommendation (moved from blockbuilder.js)
function calculateVbtRecommendation(card) {
    // Get current values from card
    const exercise = card.querySelector('.exercise-name').textContent;
    const loadType = card.dataset.loadType || 'rpe';
    const loadValue = parseFloat(card.dataset.loadValue || '0');
    const vbtTarget = parseInt(card.dataset.vbtTarget || '20', 10);

    // Simple model: Different exercises have different "typical" velocities
    let initialVelocity = 0.8; // m/s - default
    let currentWeight = 0;

    // Calculate estimated current weight based on loading method
    if (loadType === 'percent') {
        currentWeight = 100; // Placeholder
    } else if (loadType === 'rpe') {
        currentWeight = 50 + (loadValue * 5); // Arbitrary
    } else if (loadType === 'weight') {
        currentWeight = loadValue;
    }

    // Adjust initial velocity based on exercise
    if (exercise.toLowerCase().includes('squat')) initialVelocity = 0.7;
    else if (exercise.toLowerCase().includes('bench')) initialVelocity = 0.5;
    else if (exercise.toLowerCase().includes('deadlift')) initialVelocity = 0.4;

    // Simulate measuring a rep
    const measuredVelocity = initialVelocity * (1 - (currentWeight / 200) * 0.5);
    const currentVLoss = ((initialVelocity - measuredVelocity) / initialVelocity) * 100;

    // Use vbtAdjust to calculate recommended load adjustment
    const recommendedWeight = vbtAdjust({
        meanVelocity: measuredVelocity,
        initialVelocity: initialVelocity,
        currentLoadKg: currentWeight
    }); // <<< Use the imported function

    // Return the recommendation data
    return {
        initialVelocity,
        measuredVelocity,
        currentVLoss,
        currentWeight,
        recommendedWeight: Math.round(recommendedWeight), // Round the result
        loadDifference: Math.round(recommendedWeight - currentWeight),
        targetVLoss: vbtTarget
    };
}


export function openVbtModal(card) {
    // Create modal if it doesn't exist yet
    let vbtModal = document.getElementById('vbt-modal');
    if (!vbtModal) {
        vbtModal = document.createElement('div');
        vbtModal.id = 'vbt-modal';
        vbtModal.className = 'modal-overlay';
        vbtModal.innerHTML = `
            <div class="modal-content vbt-modal-content">
                <button class="modal-close-btn" id="vbt-modal-close-btn">&times;</button>
                <h4>VBT Load Recommendation</h4>
                <div id="vbt-modal-content"></div>
            </div>
        `;
        document.body.appendChild(vbtModal);

        // Add close button listener
        document.getElementById('vbt-modal-close-btn').addEventListener('click', () => {
            vbtModal.classList.remove('is-visible');
        });
    }

    // Generate recommendation data
    const recommendation = calculateVbtRecommendation(card);
    const exercise = card.querySelector('.exercise-name').textContent;

    // Format recommendation for display
    const contentDiv = document.getElementById('vbt-modal-content');
    contentDiv.innerHTML = `
        <div class="vbt-exercise-header">${exercise}</div>
        <div class="vbt-data-grid">
            <div class="vbt-data-row">
                <div class="vbt-label">Target Velocity Loss:</div>
                <div class="vbt-value">${recommendation.targetVLoss}%</div>
            </div>
            <div class="vbt-data-row">
                <div class="vbt-label">Initial Velocity:</div>
                <div class="vbt-value">${recommendation.initialVelocity.toFixed(2)} m/s</div>
            </div>
            <div class="vbt-data-row">
                <div class="vbt-label">Current Measured Velocity:</div>
                <div class="vbt-value">${recommendation.measuredVelocity.toFixed(2)} m/s</div>
            </div>
            <div class="vbt-data-row">
                <div class="vbt-label">Current Velocity Loss:</div>
                <div class="vbt-value ${recommendation.currentVLoss > recommendation.targetVLoss ? 'vbt-warning' : 'vbt-good'}">
                    ${recommendation.currentVLoss.toFixed(1)}%
                </div>
            </div>
            <div class="vbt-data-row">
                <div class="vbt-label">Current Weight:</div>
                <div class="vbt-value">${recommendation.currentWeight} kg</div>
            </div>
        </div>
        
        <div class="vbt-recommendation">
            <div class="vbt-recommendation-header">Recommendation for Next Set:</div>
            <div class="vbt-recommendation-value">
                ${recommendation.recommendedWeight} kg 
                <span class="vbt-adjustment ${recommendation.loadDifference > 0 ? 'vbt-increase' : recommendation.loadDifference < 0 ? 'vbt-decrease' : ''}">
                    (${recommendation.loadDifference > 0 ? '+' : ''}${recommendation.loadDifference} kg)
                </span>
            </div>
            <div class="vbt-recommendation-text">
                ${recommendation.currentVLoss > recommendation.targetVLoss 
                    ? 'Velocity loss exceeds target. Consider reducing weight for next set.'
                    : recommendation.currentVLoss < recommendation.targetVLoss * 0.5
                        ? 'Velocity loss is well below target. Consider increasing weight for optimal training stimulus.'
                        : 'Current weight is appropriate for your velocity loss target.'}
            </div>
        </div>
        
        <div class="vbt-info-footer">
            <p><small>Based on velocity-based training principles. In a real implementation, 
            connect a VBT device to measure actual bar speed.</small></p>
        </div>
    `;

    // Show the modal
    vbtModal.classList.add('is-visible');
}
