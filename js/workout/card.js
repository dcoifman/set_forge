// Import dependencies (placeholders, update paths as needed)
import { getStructuredDetails } from '../utils/helpers.js';
import { openInspector, closeInspector, activateTab, openMultiSelectInspector } from '../inspector/inspector.js';
import { handleSelection, getSelectionState } from '../ui/selection.js';
import { updateCardVbtIndicator, openVbtModal } from './vbt.js';
import { showToast } from '../ui/toast.js';
import { triggerAnalyticsUpdate } from '../analytics/updates.js';
import { triggerSaveState } from '../state/storage.js';

// Global state (Needs refactoring, likely passed in or managed centrally)
// let draggedItem = null; 

export function createWorkoutCard(exerciseName, details = '3x5 @ RPE 8') { 
    console.log('[createWorkoutCard] Starting for:', exerciseName, 'with details:', details); // <<< Log Start
    const card = document.createElement('div');
    card.className = 'workout-card';
    card.draggable = true;
    card.id = `workout-${Date.now()}-${Math.random().toString(16).slice(2)}`; 
    
    // Store initial details in dataset (try parsing)
    card.dataset.notes = details; // Store original string as note initially
    const parsedDetails = getStructuredDetails(card); // Dependency: getStructuredDetails
    card.dataset.sets = parsedDetails.sets;
    card.dataset.reps = parsedDetails.reps;
    card.dataset.loadType = parsedDetails.loadType;
    card.dataset.loadValue = parsedDetails.loadValue;
    card.dataset.rest = parsedDetails.rest;
    card.dataset.vbtTarget = "20"; // Default VBT velocity loss target (%)

    // ADDING data-load attribute - use calculation similar to save function
    let estimatedLoad = 300; // Base load
    const sets = parseInt(parsedDetails.sets, 10) || 1;
    const reps = parseInt(String(parsedDetails.reps).split('-')[0], 10) || 5; // Take first number if range
    const loadVal = parseFloat(parsedDetails.loadValue) || 0;
    
    estimatedLoad += sets * reps * 5; // Simple volume contribution
    
    if (parsedDetails.loadType === 'rpe' && loadVal > 7) estimatedLoad *= (1 + (loadVal - 7) * 0.15);
    if (parsedDetails.loadType === 'percent' && loadVal > 70) estimatedLoad *= (1 + (loadVal - 70) * 0.015);
     if (parsedDetails.loadType === 'weight') estimatedLoad = Math.max(estimatedLoad, loadVal * sets * reps * 0.5); // Factor in absolute weight
     
    if (exerciseName.toLowerCase().includes('squat') || exerciseName.toLowerCase().includes('deadlift')) estimatedLoad *= 1.2;
    if (exerciseName.toLowerCase().includes('press')) estimatedLoad *= 0.8;
    card.dataset.load = Math.round(estimatedLoad);

    // Card Inner Structure for Flipping
    const cardHtml = `
        <div class="card-inner">
            <div class="card-face card-front">
                <span class="exercise-name">${exerciseName}</span>
                <span class="details">${details}</span> 
                <div class="card-actions">
                     <button class="card-action-btn edit-btn" title="Edit">&hellip;</button>
                     <button class="card-action-btn info-btn" title="More Info">&#x2139;</button>
                </div>
             </div>
            <div class="card-face card-back">
                <p><strong>Sets:</strong><span class="detail-val" data-bind="sets">${card.dataset.sets || 'N/A'}</span></p>
                <p><strong>Reps:</strong><span class="detail-val" data-bind="reps">${card.dataset.reps || 'N/A'}</span></p>
                <p><strong>Load:</strong><span class="detail-val" data-bind="load">${card.dataset.loadValue ? (card.dataset.loadType === 'rpe' ? 'RPE ' : '') + card.dataset.loadValue + (card.dataset.loadType === 'percent' ? '%' : card.dataset.loadType === 'weight' ? 'kg' : '') : 'N/A'}</span></p>
                <p><strong>Rest:</strong><span class="detail-val" data-bind="rest">${card.dataset.rest || 'N/A'}</span></p>
                <p><strong>Notes:</strong> <span class="detail-val" data-bind="notes">${card.dataset.notes || 'N/A'}</span></p>
                <hr style="border-color: rgba(255,255,255,0.1); margin: 5px 0;">
                <div class="vbt-controls">
                     <label for="vbt-target-${card.id}">Target VLoss (%):</label>
                     <input type="range" id="vbt-target-${card.id}" name="vbt-target" min="0" max="40" value="20" step="5" class="vbt-slider">
                     <span class="vbt-value">20%</span>
                     <button class="vbt-recommend-btn" title="Get VBT Recommendation">Recommend</button>
                 </div>
                <button class="card-action-btn close-back-btn" title="Close">&times;</button>
             </div>
        </div>
    `;
    console.log('[createWorkoutCard] Generated HTML:', cardHtml); // <<< Log HTML
    card.innerHTML = cardHtml;
    
    // Add event listeners
    
    // Flip card when info button is clicked
    const infoBtn = card.querySelector('.info-btn');
    const innerCard = card.querySelector('.card-inner');
    const closeBackBtn = card.querySelector('.close-back-btn');
    
    if (infoBtn && innerCard) {
        infoBtn.addEventListener('click', e => {
            e.stopPropagation(); // Prevent event bubbling
            innerCard.classList.toggle('is-flipped');
        });
    }
    
    if (closeBackBtn && innerCard) {
        closeBackBtn.addEventListener('click', e => {
            e.stopPropagation(); // Prevent event bubbling
            innerCard.classList.remove('is-flipped');
        });
    }
    
    // Open inspector when edit button is clicked
    const editBtn = card.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const { selectedElement } = getSelectionState();
            if (selectedElement) selectedElement.classList.remove('selected');
            card.classList.add('selected');
            handleSelection(card, e.shiftKey);
            openInspector(card);
            activateTab('details');
        });
    }

    // Add VBT slider functionality
    const vbtSlider = card.querySelector('.vbt-slider');
    const vbtValue = card.querySelector('.vbt-value');
    const vbtRecommendBtn = card.querySelector('.vbt-recommend-btn');
    if (vbtSlider && vbtValue) {
        vbtSlider.addEventListener('input', e => {
            const val = e.target.value;
            vbtValue.textContent = val + '%';
            card.dataset.vbtTarget = val;
            // Update card appearance based on VBT setting
            updateCardVbtIndicator(card, val); // Dependency: updateCardVbtIndicator
        });
        
        // Set initial indicator
        updateCardVbtIndicator(card, vbtSlider.value); // Dependency: updateCardVbtIndicator
    }
    
    // Add VBT recommendation button click handler
    if (vbtRecommendBtn) {
        vbtRecommendBtn.addEventListener('click', e => {
            e.stopPropagation();
            openVbtModal(card); // Dependency: openVbtModal
        });
    }

    // Still allow selecting the card itself for drag/drop context
    card.addEventListener('click', (e) => {
        if (card.classList.contains('dragging')) return;

        const { selectedElement, selectedElements } = getSelectionState();
        if (selectedElement) selectedElement.classList.remove('selected');
        handleSelection(card, e.shiftKey);

        const updatedSelection = getSelectionState();

        if (updatedSelection.selectedElements.size === 1) {
            openInspector(card);
        } else if (updatedSelection.selectedElements.size > 1) {
            openMultiSelectInspector();
        } else {
            closeInspector();
        }
    });

    // Make card draggable
    card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.id);
    });

    card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
    });
    
    console.log('[createWorkoutCard] Returning card element:', card); // <<< Log Return
    return card;
  }

export function deleteSelectedWorkoutCard() {
    const { selectedElement, selectedElements } = getSelectionState();

    const itemsToDelete = Array.from(selectedElements).filter(el => el.classList.contains('workout-card'));
    if (itemsToDelete.length === 0) {
        showToast('No workout cards selected to delete.', 'warning');
        return;
    }
    
    const message = itemsToDelete.length === 1 
                   ? 'Are you sure you want to delete this workout card?' 
                   : `Are you sure you want to delete these ${itemsToDelete.length} workout cards?`;

     if (confirm(message)) {
        itemsToDelete.forEach(item => item.remove());
        // Clear selection via handleSelection? Or directly?
        // For now, assume handleSelection(null) or similar might be needed externally
        // selectedElements.clear(); // Need proper way to update selection state
        // selectedElement = null;
        closeInspector(); // Keep this
        // triggerAnalyticsUpdate(); // <<< REMOVED Call
        triggerSaveState(); // Keep this
        showToast(`${itemsToDelete.length} card(s) deleted.`, 'info', 1500); // Keep this
    }
}

// Dependencies:
// - document.createElement, document.querySelectorAll etc.
// - Date, Math, parseInt, parseFloat globals
// - confirm global
// - Functions needing import:
//   - getStructuredDetails
//   - handleSelection
//   - openInspector, closeInspector, activateTab, openMultiSelectInspector
//   - updateCardVbtIndicator, openVbtModal
//   - showToast
//   - triggerAnalyticsUpdate
//   - triggerSaveState
// - State variables needing management/injection:
//   - selectedElement, selectedElements
//   - draggedItem
