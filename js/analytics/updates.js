// Import dependencies
import { getCurrentBlockLoads, simulatedPastLoad } from '../state/blockData.js'; 
import acwr from '../acwr.js';
import monotony from '../monotony.js';
import { showToast } from '../ui/toast.js';
import ForgeAssist from '../forgeassist.js';

let updateTimeout;
let consecutiveHighAcwrWeeks = 0;

// Module-level variables for DOM elements (set by initializer)
let acwrGauge, monotonyGauge, strainGauge;

// Function to update analytics gauges and check thresholds
// Now requires workCanvas to be passed
export function triggerAnalyticsUpdate(workCanvas) { 
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() => {
        console.log('Calculating analytics...'); 

        // Ensure DOM elements (set by initializer) and workCanvas are available
        if (!acwrGauge || !monotonyGauge || !strainGauge || !workCanvas) {
            console.warn("Analytics gauges or workCanvas not available, skipping update.");
            return;
        }
        
        // Calculate real values using helper functions
        const currentBlockLoads = getCurrentBlockLoads(workCanvas); // Pass provided workCanvas
        const combinedLoads = [...simulatedPastLoad, ...currentBlockLoads];
        
        let acwrResult = { ratio: NaN, flag: 'red', acute: 0, chronic: 0 };
        let monotonyResult = { monotony: NaN, strain: NaN, flag: 'ok' };
        
        try {
            if (combinedLoads.length >= 28) {
                 acwrResult = acwr(combinedLoads.slice(-28));
            }
        } catch (error) {
             console.error("ACWR Calculation Error:", error);
        }
        try {
             if (currentBlockLoads.length >= 7) {
                  monotonyResult = monotony(currentBlockLoads.slice(-7));
             }
        } catch (error) {
             console.error("Monotony Calculation Error:", error);
        }

        // --- Update Gauges (using module-level variables) --- 
        const newVal = acwrGauge.querySelector('.gauge-value');
        const newBar = acwrGauge.querySelector('.gauge-bar');
        const displayRatio = isFinite(acwrResult.ratio) ? acwrResult.ratio.toFixed(2) : 'N/A';
        if (newVal) newVal.textContent = displayRatio;
        const barWidthPercent = isFinite(acwrResult.ratio) ? Math.min(100, Math.max(0, acwrResult.ratio * 50)) : 0;
        if (newBar) {
            newBar.style.width = `${barWidthPercent}%`; 
            newBar.className = `gauge-bar acwr-${acwrResult.flag === 'amber' ? 'watch' : acwrResult.flag}`;
        }

        const monoVal = monotonyGauge.querySelector('.gauge-value');
        const monoBar = monotonyGauge.querySelector('.gauge-bar');
        const displayMono = isFinite(monotonyResult.monotony) ? monotonyResult.monotony.toFixed(2) : 'N/A';
        if (monoVal) monoVal.textContent = displayMono;
        const monoWidthPercent = isFinite(monotonyResult.monotony) ? Math.min(100, Math.max(0, (monotonyResult.monotony / 3) * 100)) : 0;
        if (monoBar) {
            monoBar.style.width = `${monoWidthPercent}%`;
            monoBar.className = `gauge-bar monotony-${monotonyResult.flag}`; 
        }

        const strainVal = strainGauge.querySelector('.gauge-value');
        const strainBar = strainGauge.querySelector('.gauge-bar');
        const displayStrain = isFinite(monotonyResult.strain) ? monotonyResult.strain.toFixed(0) : 'N/A';
        if (strainVal) strainVal.textContent = displayStrain;
        const strainWidthPercent = isFinite(monotonyResult.strain) ? Math.min(100, Math.max(0, (monotonyResult.strain / 6000) * 100)) : 0;
        if (strainBar) {
            strainBar.style.width = `${strainWidthPercent}%`;
            strainBar.className = `gauge-bar strain-${monotonyResult.flag}`; 
        }

        console.log(`Calculated ACWR: ${displayRatio}, Monotony: ${displayMono}, Strain: ${displayStrain}`);
        
        checkAcwrRisk(acwrResult.ratio, showToast);
        
        // Pass analytics data to ForgeAssist
        ForgeAssist.checkAnalyticsThresholds({
            acwrRatio: acwrResult.ratio,
            acwrFlag: acwrResult.flag,
            monotonyValue: monotonyResult.monotony,
            monotonyFlag: monotonyResult.flag,
            strainValue: monotonyResult.strain
        });
    }, 500);
}

// Initialization function - Now correctly sets module-level variables
export function initializeAnalyticsUpdater(config = {}) {
    acwrGauge = config.acwrGauge; 
    monotonyGauge = config.monotonyGauge;
    strainGauge = config.strainGauge;
    if (acwrGauge && monotonyGauge && strainGauge) {
        console.log("Analytics Updater Initialized with gauge references.");
    } else {
        console.warn("Analytics Updater Initialized but some gauge references might be missing.");
    }
}

// Separate function for ACWR risk check to manage its state
function checkAcwrRisk(currentAcwrRatio, showToast) {
     if (!isFinite(currentAcwrRatio)) return; // Avoid checks if calculation failed
     if (currentAcwrRatio > 1.5) {
         consecutiveHighAcwrWeeks++;
         console.log(`High ACWR (${currentAcwrRatio}) detected. Consecutive weeks: ${consecutiveHighAcwrWeeks}`);
         if (consecutiveHighAcwrWeeks >= 2) {
              showToast( // Dependency
                 `<strong>High Injury Risk Alert!</strong> ACWR > 1.5 for ${consecutiveHighAcwrWeeks} consecutive weeks. Consider adjusting load. <button class='cta-button primary-cta' style='margin-left: 10px; padding: 3px 6px; font-size: 0.8rem;'>Fix (Simulated)</button>`,
                 'error',
                 10000 // Longer duration for error
             );
             // Reset counter after showing the major alert?
             // consecutiveHighAcwrWeeks = 0;
         } else {
              // Show a milder warning for the first week
              showToast( // Dependency
                 `<strong>ACWR Warning:</strong> Ratio (${currentAcwrRatio}) exceeds 1.5. Monitor closely.`,
                 'warning',
                 7000
             );
         }
     } else {
         // Reset counter if ACWR drops back into safe zone
         consecutiveHighAcwrWeeks = 0;
     }
}

// Dependencies:
// - DOM Access
// - Browser Globals (setTimeout, clearTimeout, isFinite, Math)
// - Calculation logic: acwr (imported), monotony (imported)
// - State access: getCurrentBlockLoads (imported), simulatedPastLoad (imported)
// - UI Feedback: showToast (imported)
// - Other modules: ForgeAssist (imported)

// REMOVE Placeholder imports and functions at the end 