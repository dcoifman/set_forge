// Add UI related helpers here

export function updateLoadValueExplanation() {
    const loadTypeSelect = document.getElementById('inspector-load-type');
    const explanationDiv = document.getElementById('load-value-explanation');
    if (!loadTypeSelect || !explanationDiv) return;

    const selectedType = loadTypeSelect.value;
    let explanationText = '';

    switch (selectedType) {
        case 'rpe':
            explanationText = 'Rated Perceived Exertion (e.g., 7, 8.5)';
            break;
        case 'percent':
            explanationText = 'Percentage of 1 Rep Max (e.g., 75, 80)';
            break;
        case 'weight':
            explanationText = 'Absolute weight in kilograms (e.g., 100, 22.5)';
            break;
        case 'text':
            explanationText = 'Descriptive text (e.g., Bodyweight, Max Effort)';
            break;
        default:
            explanationText = '';
    }

    explanationDiv.textContent = explanationText;
}

// Dependencies:
// - document.getElementById
