export function getStructuredDetails(cardElement) {
    // Default structure
    let details = {
        name: cardElement.querySelector('.exercise-name')?.textContent || 'Workout',
        sets: cardElement.dataset.sets || '',
        reps: cardElement.dataset.reps || '',
        loadType: cardElement.dataset.loadType || 'rpe', // Default to RPE
        loadValue: cardElement.dataset.loadValue || '',
        rest: cardElement.dataset.rest || '',
        notes: cardElement.dataset.notes || '', // Simple notes field
        // Add additional context properties
        isGDAP: cardElement.dataset.goalDriven === 'true' || cardElement.hasAttribute('data-source-goal-id'),
        isModelDriven: cardElement.dataset.modelDriven === 'true' || cardElement.hasAttribute('data-source-model-id'),
        exerciseId: cardElement.dataset.exerciseId || '',
        sourceModelId: cardElement.dataset.sourceModelId || '',
        sourceGoalId: cardElement.dataset.sourceGoalId || ''
    };

    // Fallback: Try to parse old details string if dataset is empty
    if (!cardElement.dataset.sets && !cardElement.dataset.reps && !cardElement.dataset.loadValue) {
         const oldDetailsText = cardElement.querySelector('.details')?.textContent || '';
         // Basic parsing attempt (Can be enhanced)
         const setsMatch = oldDetailsText.match(/(\d+)\s*x/i);
         const repsMatch = oldDetailsText.match(/x\s*([^@\(]+)/i); // Match reps after 'x', before '@' or '('
         const rpeMatch = oldDetailsText.match(/@\s*rpe\s*(\d+(\.\d+)?)/i);
         const percMatch = oldDetailsText.match(/@\s*(\d+(\.\d+)?)%/i); // Match percentage
         const weightMatch = oldDetailsText.match(/@\s*(\d+(\.\d+)?)\s*kg/i); // Match weight in kg
         const restMatch = oldDetailsText.match(/\(\s*([^\)]+?)\s*(?:rest)?\)/i); // Match content in parentheses as rest

         if (setsMatch) details.sets = setsMatch[1].trim();
         if (repsMatch) details.reps = repsMatch[1].trim();
         
         if (rpeMatch) {
             details.loadType = 'rpe';
             details.loadValue = rpeMatch[1].trim();
         } else if (percMatch) {
             details.loadType = 'percent';
             details.loadValue = percMatch[1].trim();
         } else if (weightMatch) {
             details.loadType = 'weight';
             details.loadValue = weightMatch[1].trim();
         } else {
             // Try to extract any load value after @ if no specific type found
             const genericLoadMatch = oldDetailsText.match(/@\s*(.+)/);
             if (genericLoadMatch && !restMatch) { // Avoid capturing rest in parentheses as load
                 details.loadType = 'text'; // Default to text if type unknown
                 details.loadValue = genericLoadMatch[1].trim();
             }
         }

         if (restMatch) {
            details.rest = restMatch[1].trim();
             // If load value captured part of the rest, remove it
             if (details.loadValue.endsWith(restMatch[0])) {
                 details.loadValue = details.loadValue.replace(restMatch[0], '').trim();
             }
         }
         
         // If notes are still empty, use the original string (minus parsed parts?)
         // For simplicity, just keep original as notes if dataset was empty
         details.notes = oldDetailsText; 
    }
    
    return details;
}

// Dependencies:
// - DOM querying (querySelector)
