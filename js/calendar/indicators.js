// --- Calendar Phase Indicator Logic ---
// Needs DOM elements: phaseRibbon, workCanvas
export function updateCalendarPhaseIndicators(phaseRibbon, workCanvas) {
    if (!phaseRibbon || !workCanvas) {
        console.warn("Phase ribbon or work canvas not provided for indicator update.");
        return;
    }
    const phases = Array.from(phaseRibbon.querySelectorAll('.phase-bar'));
    // Ensure week-column exists before querying. Use week-row-container as fallback?
    const weekElements = workCanvas.querySelectorAll('.week-column, .week-row-container');
    const totalWeeks = weekElements.length > 0 ? parseInt(weekElements[weekElements.length - 1].dataset.week, 10) : 0;
    
    //const totalWeeks = workCanvas.querySelectorAll('.week-column').length; // Assuming week labels = total weeks
    if (totalWeeks === 0) {
        console.log("No weeks found on canvas, cannot update indicators.");
        return;
    }

    let weekCounter = 0;
    let phaseBoundaries = [];
    let cumulativePercent = 0;

    phases.forEach(phase => {
        const phaseName = phase.dataset.phase;
        const percentWidth = parseFloat(phase.style.width) || 0;
        cumulativePercent += percentWidth;
        // Calculate the week number this phase *ends* at (approximately)
        // Using Math.ceil might push boundary slightly early if percents aren't exact
        const endWeek = Math.round((cumulativePercent / 100) * totalWeeks);
        phaseBoundaries.push({ phaseName, endWeek });
    });
    
    // console.log('Phase Boundaries (End Weeks):', phaseBoundaries);

    let currentPhaseIndex = 0;
    for (let week = 1; week <= totalWeeks; week++) {
        // Determine current phase
        while (currentPhaseIndex < phaseBoundaries.length -1 && week > phaseBoundaries[currentPhaseIndex].endWeek) {
            currentPhaseIndex++;
        }
        const currentPhaseName = phaseBoundaries[currentPhaseIndex]?.phaseName || 'unknown';
        const phaseClass = `in-phase-${currentPhaseName}`;
        
        // Apply class to all cells in this week
        const weekCells = workCanvas.querySelectorAll(`.day-cell[data-week="${week}"]`);
         weekCells.forEach(cell => {
             // Remove old phase classes
             cell.className = cell.className.replace(/\bin-phase-\S+/g, '').trim();
             // Add new phase class
             cell.classList.add(phaseClass);
         });
    }
}

// NEW FUNCTION: Calculate start and end week for a specific phase element
export function getPhaseWeekRange(phaseElement, phaseRibbon, workCanvas) {
    if (!phaseElement || !phaseRibbon || !workCanvas) {
        console.warn("Missing elements for getPhaseWeekRange calculation.");
        return { startWeek: 0, endWeek: 0 };
    }

    const phases = Array.from(phaseRibbon.querySelectorAll('.phase-bar'));
    const targetPhaseIndex = phases.indexOf(phaseElement);
    if (targetPhaseIndex === -1) {
        console.warn("Target phase element not found in ribbon.");
        return { startWeek: 0, endWeek: 0 };
    }

    const weekElements = workCanvas.querySelectorAll('.week-column, .week-row-container');
    const totalWeeks = weekElements.length > 0 ? parseInt(weekElements[weekElements.length - 1].dataset.week, 10) : 0;
    if (totalWeeks === 0) {
        console.warn("No weeks found for phase range calculation.");
        return { startWeek: 0, endWeek: 0 };
    }

    let cumulativePercentStart = 0;
    for (let i = 0; i < targetPhaseIndex; i++) {
        cumulativePercentStart += parseFloat(phases[i].style.width) || 0;
    }

    const phasePercentWidth = parseFloat(phaseElement.style.width) || 0;
    const cumulativePercentEnd = cumulativePercentStart + phasePercentWidth;

    // Calculate start week (round the start boundary percentage)
    const startWeek = targetPhaseIndex === 0 ? 1 : Math.round((cumulativePercentStart / 100) * totalWeeks) + 1;
    // Calculate end week (round the end boundary percentage)
    const endWeek = Math.round((cumulativePercentEnd / 100) * totalWeeks);
    
    // Ensure startWeek is not greater than endWeek, and within bounds
    const finalStartWeek = Math.max(1, Math.min(startWeek, endWeek, totalWeeks));
    const finalEndWeek = Math.max(1, Math.min(endWeek, totalWeeks));


    // console.log(`Phase ${phaseElement.dataset.phase}: Start ${cumulativePercentStart}%, End ${cumulativePercentEnd}%, Weeks ${finalStartWeek}-${finalEndWeek}`);
    return { startWeek: finalStartWeek, endWeek: finalEndWeek };
}

// Dependencies:
// - DOM Access (querySelectorAll, dataset, style, className, classList, indexOf)
// - Browser Globals (parseFloat, Math, parseInt, Array.from) 