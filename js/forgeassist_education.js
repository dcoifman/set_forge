document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('fa-education-modal');
    const openBtn = document.getElementById('open-fa-education-btn'); // Assumes button exists in main HTML
    const closeBtns = modal.querySelectorAll('.fa-close-btn');
    const tabLinks = modal.querySelectorAll('.fa-tab-link');
    const tabContents = modal.querySelectorAll('.fa-tab-content');
    let currentTabId = 'intro'; // Track current tab for slide direction
    let activeConnectorLine = null; // Track the connector line SVG

    // --- Modal Control ---
    function openModal() {
        modal.style.display = 'flex';
        // Reset to intro tab when opened
        switchTab('intro', true); // Force reset without animation
        resetAllSimulations();
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    // Event listener for the main open button (if it exists)
    // Add a small delay to ensure the button is definitely available
    setTimeout(() => {
        const openBtnDelayed = document.getElementById('open-fa-education-btn');
        if (openBtnDelayed) {
            openBtnDelayed.addEventListener('click', openModal);
        } else {
            console.warn("ForgeAssist Education: Could not find open button. Modal can only be opened programmatically.");
        }
    }, 100); // 100ms delay

    // Event listeners for close buttons (header and footer)
    closeBtns.forEach(btn => btn.addEventListener('click', closeModal));

    // Close modal if clicking outside the content
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // --- Tab Control ---
    function switchTab(tabId, isInitial = false) {
        if (tabId === currentTabId && !isInitial) return;

        const newTabContent = modal.querySelector(`#${tabId}`);
        const oldTabContent = modal.querySelector(`#${currentTabId}`);
        const newTabLink = modal.querySelector(`.fa-tab-link[data-tab="${tabId}"]`);
        const oldTabLink = modal.querySelector(`.fa-tab-link[data-tab="${currentTabId}"]`);

        if (!newTabContent) return;

        // Update links
        if (oldTabLink) oldTabLink.classList.remove('active');
        if (newTabLink) newTabLink.classList.add('active');

        // Animate tabs
        if (oldTabContent && !isInitial) {
            oldTabContent.classList.remove('active', 'slide-in');
            oldTabContent.classList.add('slide-out');
            // Remove from DOM after animation to prevent interference
            oldTabContent.addEventListener('animationend', () => {
                oldTabContent.style.display = 'none';
                oldTabContent.classList.remove('slide-out');
            }, { once: true });
        }

        // Prepare the new tab
        newTabContent.style.display = 'block'; // Needs to be block for animation
        newTabContent.classList.remove('slide-out');
        if (!isInitial) {
             newTabContent.classList.add('slide-in');
             newTabContent.addEventListener('animationend', () => {
                 // Once slide-in finishes, set to active (relative positioning)
                 // Remove explicit style.display if needed
                 newTabContent.classList.add('active');
                 newTabContent.classList.remove('slide-in');
             }, { once: true });
        } else {
            newTabContent.classList.add('active'); // Set active immediately for initial load
        }

        currentTabId = tabId;
         // Reset simulations when switching tabs
         resetAllSimulations();
    }

    tabLinks.forEach(link => {
        link.addEventListener('click', () => switchTab(link.dataset.tab));
    });

    // --- Simulation Logic ---
    const simulationAreas = modal.querySelectorAll('.fa-simulation-area');

    function resetSimulation(simArea) {
        const outputArea = simArea.querySelector('.fa-sim-output');
        const blockArea = simArea.querySelector('.fa-sim-block');
        const inspectorArea = simArea.querySelector('.fa-sim-inspector');
        const contextActionsArea = simArea.querySelector('.fa-sim-context-actions');

        if (outputArea) outputArea.innerHTML = '<p>(ForgeAssist Output Area)</p>';
        if (blockArea) {
             // Reset gauges
             blockArea.querySelectorAll('.fa-sim-gauge-container').forEach(gauge => {
                 const gaugeType = gauge.dataset.gauge;
                 gauge.dataset.state = 'normal';
                 const valueEl = gauge.querySelector('.fa-sim-gauge-value');
                 if (valueEl) valueEl.textContent = `${gaugeType.toUpperCase()}: ${gaugeType === 'acwr' ? '1.20' : '1.3'}`;
             });

             // Reset grid cells visually - Restore entire original cell content
             simArea.querySelectorAll('.fa-sim-day-cell').forEach(cell => {
                 cell.classList.remove('cleared', 'highlight-swap');
                 if (cell.dataset.originalContent) {
                     cell.innerHTML = cell.dataset.originalContent;
                 } else {
                     // Fallback if original content wasn't saved for some reason
                     cell.innerHTML = '<div class="fa-sim-day-content">(Content Error)</div>';
                 }
                 // Note: No need to specifically handle contentWrapper or loadBar here anymore,
                 // as they are restored as part of cell.innerHTML
             });

             // General reset if no specific grid was found initially
             if (!simArea.querySelector('.fa-sim-grid') && !simArea.querySelector('.fa-sim-gauge-container')) {
                 blockArea.innerHTML = '<p>(Simulated Block Area)</p>';
             }
        }
         if (inspectorArea && contextActionsArea) {
             contextActionsArea.innerHTML = '(Contextual Actions Appear Here)';
             removeConnectorLine(); // Remove connector line on reset
             simArea.querySelectorAll('.fa-sim-element-highlight').forEach(el => el.classList.remove('fa-sim-element-highlight'));
         }
    }

    // Save original day CELL content for easy reset
    modal.querySelectorAll('.fa-sim-day-cell').forEach(cell => {
        cell.dataset.originalContent = cell.innerHTML; // Save entire cell innerHTML
    });

    function resetAllSimulations() {
        simulationAreas.forEach(resetSimulation);
    }

    // --- Scenario Handlers ---

    // Scenario: High ACWR
    const acwrTriggerBtn = modal.querySelector('#scenario-acwr button[data-action="trigger-acwr"]');
    const acwrSimArea = document.getElementById('scenario-acwr')?.querySelector('.fa-simulation-area');

    if (acwrTriggerBtn && acwrSimArea) {
        acwrTriggerBtn.addEventListener('click', () => {
            resetSimulation(acwrSimArea);
            const outputArea = acwrSimArea.querySelector('.fa-sim-output');
            const gauge = acwrSimArea.querySelector('.fa-sim-gauge-container[data-gauge="acwr"]');
            const gaugeValue = gauge?.querySelector('.fa-sim-gauge-value');

            // 1. Simulate High ACWR state (Update gauge visually)
            if (gauge) gauge.dataset.state = 'danger';
            if (gaugeValue) gaugeValue.textContent = 'ACWR: 1.65';

            outputArea.innerHTML = ''; // Clear default text

            // 2. Show simulated toast with proposals and icons
            const toastHtml = `
                <div class="fa-sim-toast error">
                    <span class="toast-icon"></span>
                    <div>
                        <strong>High Injury Risk Alert!</strong> ACWR > 1.5 detected.
                        <button class="fa-sim-proposal primary-cta" data-proposal-type="reduceLoad">Reduce Load 15%</button>
                        <button class="fa-sim-proposal secondary-cta" data-proposal-type="addRestDay">Insert Rest Day</button>
                    </div>
                </div>
            `;
            outputArea.insertAdjacentHTML('beforeend', toastHtml);

             // Add listeners to the new proposal buttons
             addProposalListeners(outputArea);
        });
    }

    // Scenario: High Monotony
    const monotonyTriggerBtn = modal.querySelector('#scenario-monotony button[data-action="trigger-monotony"]');
    const monotonySimArea = document.getElementById('scenario-monotony')?.querySelector('.fa-simulation-area');

    if (monotonyTriggerBtn && monotonySimArea) {
        monotonyTriggerBtn.addEventListener('click', () => {
            resetSimulation(monotonySimArea);
            const outputArea = monotonySimArea.querySelector('.fa-sim-output');
            const gauge = monotonySimArea.querySelector('.fa-sim-gauge-container[data-gauge="monotony"]');
            let gaugeValue = null;
            if (gauge) {
                gauge.dataset.state = 'danger'; // Use danger state for high monotony visually
                gaugeValue = gauge.querySelector('.fa-sim-gauge-value');
                if (gaugeValue) gaugeValue.textContent = 'Monotony: 2.3';
            }

            outputArea.innerHTML = '';

            // 2. Show simulated toast with proposals and icons
            const toastHtml = `
                 <div class="fa-sim-toast warning">
                    <span class="toast-icon"></span>
                    <div>
                        <strong>High Monotony Alert!</strong> Consider varying load.
                        <button class="fa-sim-proposal primary-cta" data-proposal-type="swapDays">Swap High/Low Days</button>
                        <button class="fa-sim-proposal secondary-cta" data-proposal-type="reduceHighDay">Reduce Load on Highest Day</button>
                    </div>
                </div>
            `;
            outputArea.insertAdjacentHTML('beforeend', toastHtml);

            // Add listeners to the new proposal buttons
             addProposalListeners(outputArea);
        });
    }

    // Scenario: Contextual Actions
    const contextualSimArea = document.getElementById('scenario-contextual')?.querySelector('.fa-simulation-area');
    if (contextualSimArea) {
        const clickableElements = contextualSimArea.querySelectorAll('.fa-sim-clickable');
        const contextActionsArea = contextualSimArea.querySelector('.fa-sim-context-actions');
        const outputArea = contextualSimArea.querySelector('.fa-sim-output');

        clickableElements.forEach(element => {
            element.addEventListener('click', () => {
                // Highlight clicked element
                contextualSimArea.querySelectorAll('.fa-sim-element-highlight').forEach(el => el.classList.remove('fa-sim-element-highlight'));
                element.classList.add('fa-sim-element-highlight');
                // Draw connector line
                drawConnectorLine(element, contextActionsArea);
                // Handle logic
                handleSimulatedContextClick(element.dataset.type, contextActionsArea, outputArea);
            });
        });
    }

    // --- Connector Line Logic --- //
    function drawConnectorLine(startElement, endElement) {
        removeConnectorLine(); // Remove previous line
        const simArea = startElement.closest('.fa-simulation-area');
        if (!simArea) return;

        const startRect = startElement.getBoundingClientRect();
        const endRect = endElement.getBoundingClientRect();
        const areaRect = simArea.getBoundingClientRect();

        // Calculate coordinates relative to the simulation area
        const x1 = startRect.left + startRect.width / 2 - areaRect.left;
        const y1 = startRect.bottom - areaRect.top + 5; // Start slightly below the button
        const x2 = endRect.left + 30 - areaRect.left; // Target a point inside the area
        const y2 = endRect.top + 15 - areaRect.top;

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        svg.setAttribute('class', 'fa-sim-connector-line');
        svg.setAttribute('viewBox', `0 0 ${areaRect.width} ${areaRect.height}`);

        const line = document.createElementNS(svgNS, "line");
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);

        svg.appendChild(line);
        simArea.appendChild(svg);
        activeConnectorLine = svg;
    }

    function removeConnectorLine() {
        if (activeConnectorLine) {
            activeConnectorLine.remove();
            activeConnectorLine = null;
        }
    }
    // --- End Connector Line Logic --- //

    function handleSimulatedContextClick(elementType, actionsArea, outputArea) {
        // Reset only the output/actions, keep highlight/line until next click/reset
        actionsArea.innerHTML = '';
        outputArea.innerHTML = '<p>(ForgeAssist Output Area)</p>';

        let actionsHtml = '';
        if (elementType === 'workout-card') {
            actionsHtml = `
                <button class="fa-sim-context-action" data-action-type="suggestSwap">Suggest Swap for Bench Press</button>
                <button class="fa-sim-context-action" data-action-type="decreaseIntensity">Decrease Intensity (10%)</button>
                <button class="fa-sim-context-action" data-action-type="increaseIntensity">Increase Intensity (10%)</button>
                <button class="fa-sim-context-action" data-action-type="simulateAcwr">Simulate ACWR Impact</button>
            `;
        } else if (elementType === 'day-cell') {
             actionsHtml = `
                <button class="fa-sim-context-action" data-action-type="handleMissed">Handle Missed Session (Wed Wk 2)</button>
                <button class="fa-sim-context-action" data-action-type="clearDay">Clear Wed Wk 2</button>
                <button class="fa-sim-context-action" data-action-type="convertToRest">Convert to Rest Day</button>
            `;
        }

        actionsArea.innerHTML = actionsHtml;

        // Add listeners to the new action buttons
        actionsArea.querySelectorAll('.fa-sim-context-action').forEach(button => {
            // Simple listener removal/re-add (could be improved with AbortController)
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            newButton.addEventListener('click', handleSimulatedContextActionClick);
        });
    }

    function handleSimulatedContextActionClick(event) {
        const button = event.target;
        const actionType = button.dataset.actionType;
        const simArea = button.closest('.fa-simulation-area');
        const outputArea = simArea.querySelector('.fa-sim-output');

        outputArea.innerHTML = ''; // Clear default text
        let outputHtml = '';
        let toastType = 'info'; // Default toast type

        switch (actionType) {
            case 'suggestSwap':
                 toastType = 'info';
                outputHtml = `
                    <span class="toast-icon"></span>
                    <div>
                        <strong>Swap Options for Bench Press:</strong><br>
                        <button class="fa-sim-swap-option">Incline DB Press</button>
                        <button class="fa-sim-swap-option">Weighted Dips</button>
                        <button class="fa-sim-swap-option">Close Grip Bench</button>
                    </div>
                `;
                break;
            case 'decreaseIntensity':
                toastType = 'success';
                outputHtml = `<span class="toast-icon"></span><div>Simulated: Decreased intensity for Bench Press.</div>`;
                 break;
             case 'increaseIntensity':
                 toastType = 'success';
                 outputHtml = `<span class="toast-icon"></span><div>Simulated: Increased intensity for Bench Press.</div>`;
                 break;
            case 'simulateAcwr':
                toastType = 'info';
                outputHtml = `
                    <span class="toast-icon"></span>
                    <div>
                        <strong>ACWR Impact Simulation:</strong><br>
                        - Remove Exercise: ACWR <span style="color: #34a853;">1.15</span><br>
                        - Decrease (15%): ACWR <span style="color: #34a853;">1.25</span><br>
                        - Increase (15%): ACWR <span style="color: #fbbc05;">1.40</span>
                    </div>
                 `;
                 break;
            case 'handleMissed':
                 toastType = 'info';
                 outputHtml = `
                    <span class="toast-icon"></span>
                    <div>
                        <strong>Handle Missed Session (Wed Wk 2):</strong><br>
                        <button class="fa-sim-missed-option">Skip Session</button>
                        <button class="fa-sim-missed-option">Shift Session +1 Day</button>
                        <button class="fa-sim-missed-option">Reduce Load Next Session</button>
                    </div>
                 `;
                 break;
             case 'clearDay':
                  toastType = 'success';
                  outputHtml = `<span class="toast-icon"></span><div>Simulated: Cleared all exercises from Wed Wk 2.</div>`;
                  // Simulate visual clearing (requires target cell info)
                  clearDayVisually(simArea, 2, 'wed');
                  break;
             case 'convertToRest':
                 toastType = 'success';
                 outputHtml = `<span class="toast-icon"></span><div>Simulated: Converted Wed Wk 2 to a rest day.</div>`;
                 // Simulate visual clearing and add REST text (requires target cell info)
                 convertDayToRestVisually(simArea, 2, 'wed');
                 break;
            default:
                 toastType = 'warning';
                outputHtml = `<span class="toast-icon"></span><div>Simulated action '${actionType}' clicked.</div>`;
        }

        const fullToastHtml = `<div class="fa-sim-toast ${toastType}">${outputHtml}</div>`;
        outputArea.innerHTML = fullToastHtml;
        // Could add further interaction listeners for swap/missed options here if desired
    }

    // --- Helper Functions for Simulations ---
    function addProposalListeners(outputArea) {
         outputArea.querySelectorAll('.fa-sim-proposal').forEach(button => {
             // Remove existing listener before adding a new one (important for resets)
             button.replaceWith(button.cloneNode(true)); // Simple way to remove listeners
         });
         // Add listeners to the *new* buttons
          outputArea.querySelectorAll('.fa-sim-proposal').forEach(button => {
             button.addEventListener('click', handleSimulatedProposalClick);
         });
    }

    function handleSimulatedProposalClick(event) {
        const button = event.target;
        const proposalType = button.dataset.proposalType;
        const simArea = button.closest('.fa-simulation-area');
        const outputArea = simArea.querySelector('.fa-sim-output');
        const blockArea = simArea.querySelector('.fa-sim-block');
        const gaugeContainer = blockArea?.querySelector('.fa-sim-gauge-container');
        let gaugeValue = null;
        if (gaugeContainer) {
            gaugeValue = gaugeContainer.querySelector('.fa-sim-gauge-value');
        }

        // Remove the toast containing the button
        button.closest('.fa-sim-toast')?.remove();

        // Simulate applying the proposal
        let resultMessage = '';
        if (proposalType === 'reduceLoad') {
            resultMessage = 'Simulated: Load reduced by 15% across the week.';
            if(gaugeContainer && gaugeContainer.dataset.gauge === 'acwr') { // Update relevant gauge
                gaugeContainer.dataset.state = 'warning';
                if (gaugeValue) gaugeValue.textContent = 'ACWR: 1.35';
            }
            // Simulate reducing load visually - apply class, CSS transition handles animation
            blockArea?.querySelectorAll('.fa-sim-load').forEach(load => {
                load.classList.add('reduced');
            });
        } else if (proposalType === 'addRestDay') {
            resultMessage = 'Simulated: Cleared lowest load day to insert rest day.';
             if(gaugeContainer && gaugeContainer.dataset.gauge === 'acwr') {
                gaugeContainer.dataset.state = 'normal';
                 if (gaugeValue) gaugeValue.textContent = 'ACWR: 1.15';
            }
            // Simulate clearing a low load day (e.g., Wed Wk 1 - needs a grid)
            convertDayToRestVisually(simArea, 1, 'wed');
        } else if (proposalType === 'swapDays') {
             resultMessage = 'Simulated: Swapped highest and lowest load days.';
             if(gaugeContainer && gaugeContainer.dataset.gauge === 'monotony') {
                gaugeContainer.dataset.state = 'normal';
                 if (gaugeValue) gaugeValue.textContent = 'Monotony: 1.6';
            }
            // Simulate swapping Mon Wk1 (high) and Wed Wk1 (low)
             swapDaysVisually(simArea, 1, 'mon', 1, 'wed');
        } else if (proposalType === 'reduceHighDay') {
             resultMessage = 'Simulated: Reduced load on the highest load day.';
             if(gaugeContainer && gaugeContainer.dataset.gauge === 'monotony') {
                gaugeContainer.dataset.state = 'warning'; // Still might be warning
                 if (gaugeValue) gaugeValue.textContent = 'Monotony: 1.8';
            }
            // Simulate reducing load on Mon Wk1 (high) in the sample HTML
            const highDayCell = blockArea?.querySelector('.fa-sim-day-cell[data-week="1"][data-day="mon"]');
            if (highDayCell) {
                const highDayLoad = highDayCell.querySelector('.fa-sim-load');
                if (highDayLoad) {
                    highDayLoad.classList.add('reduced');
                }
            }
        }

        // Show result feedback with icon
        const resultToast = `<div class="fa-sim-toast success"><span class="toast-icon"></span><div>${resultMessage}</div></div>`;
        outputArea.insertAdjacentHTML('beforeend', resultToast);
    }

    // --- Visual Effect Helpers --- //

    function clearDayVisually(simArea, week, day) {
        const dayToClear = simArea?.querySelector(`.fa-sim-day-cell[data-week="${week}"][data-day="${day}"]`);
        if (dayToClear) {
            const contentWrapper = dayToClear.querySelector('.fa-sim-day-content');
            if (contentWrapper) {
                contentWrapper.classList.add('clearing');
                contentWrapper.addEventListener('animationend', () => {
                    contentWrapper.innerHTML = ''; // Clear content after animation
                    dayToClear.classList.add('cleared');
                }, { once: true });
            }
            // Hide load bar immediately or fade it? - Use if check instead of optional chaining
            const loadIndicator = dayToClear.querySelector('.fa-sim-load');
            if (loadIndicator) {
                loadIndicator.style.opacity = '0';
            }
        }
    }

    function convertDayToRestVisually(simArea, week, day) {
        const dayToClear = simArea?.querySelector(`.fa-sim-day-cell[data-week="${week}"][data-day="${day}"]`);
         if (dayToClear) {
            const contentWrapper = dayToClear.querySelector('.fa-sim-day-content');
            if (contentWrapper) {
                contentWrapper.classList.add('clearing');
                contentWrapper.addEventListener('animationend', () => {
                    contentWrapper.innerHTML = '<span class="fa-rest-day-indicator">REST</span>'; // Add REST indicator
                    dayToClear.classList.add('cleared');
                }, { once: true });
            }
            // Use if check instead of optional chaining
            const loadIndicator = dayToClear.querySelector('.fa-sim-load');
            if (loadIndicator) {
                loadIndicator.style.opacity = '0';
            }
        }
    }

     function swapDaysVisually(simArea, week1, day1, week2, day2) {
        const cell1 = simArea?.querySelector(`.fa-sim-day-cell[data-week="${week1}"][data-day="${day1}"]`);
        const cell2 = simArea?.querySelector(`.fa-sim-day-cell[data-week="${week2}"][data-day="${day2}"]`);
        // Use if checks instead of optional chaining
        let content1 = null;
        if (cell1) {
            content1 = cell1.querySelector('.fa-sim-day-content');
        }
        let content2 = null;
        if (cell2) {
            content2 = cell2.querySelector('.fa-sim-day-content');
        }

        // --- Debugging Logs ---
        // console.log(`[Swap Debug] Trying to swap Wk${week1}-${day1} with Wk${week2}-${day2}`);
        // console.log(`[Swap Debug] cell1:`, cell1);
        // console.log(`[Swap Debug] cell2:`, cell2);
        // console.log(`[Swap Debug] content1:`, content1);
        // console.log(`[Swap Debug] content2:`, content2);
        // --- End Debugging Logs ---

        if (!cell1 || !cell2 || !content1 || !content2) {
            console.warn('Swap failed: Could not find cells or content wrappers.');
            return;
        }

        // Defensive check for getBoundingClientRect method
        if (typeof cell1.getBoundingClientRect !== 'function' || typeof cell2.getBoundingClientRect !== 'function') {
            console.error('Swap failed: getBoundingClientRect is not a function on one or both cells.');
            return;
        }

        const rect1 = cell1.getBoundingClientRect();
        const rect2 = cell2.getBoundingClientRect();

        // Defensive check for valid rect objects
        if (!rect1 || !rect2) {
            console.error('Swap failed: getBoundingClientRect did not return valid rect objects.');
            return;
        }

        const gridElement = cell1.closest('.fa-sim-grid'); // Find the grid element first

        if (!gridElement) { // Add check for grid element
            console.error('Swap failed: Could not find parent .fa-sim-grid');
            return;
        }
        const parentRect = gridElement.getBoundingClientRect(); // Now get the rect

        // Calculate relative positions
        const relX1 = rect1.left - parentRect.left;
        const relY1 = rect1.top - parentRect.top;
        const relX2 = rect2.left - parentRect.left;
        const relY2 = rect2.top - parentRect.top;

        // Calculate translations needed
        const translateX1 = relX2 - relX1;
        const translateY1 = relY2 - relY1;
        const translateX2 = relX1 - relX2;
        const translateY2 = relY1 - relY2;

        // Apply absolute positioning and transforms to start animation
        content1.classList.add('swapping');
        content2.classList.add('swapping');
        content1.style.transform = `translate(${translateX1}px, ${translateY1}px)`;
        content2.style.transform = `translate(${translateX2}px, ${translateY2}px)`;
        content1.style.top = `${relY1}px`;
        content1.style.left = `${relX1}px`;
        content2.style.top = `${relY2}px`;
        content2.style.left = `${relX2}px`;

        // Add highlight during swap
        cell1.classList.add('highlight-swap');
        cell2.classList.add('highlight-swap');

        // Wait for animation to finish, then swap actual content
        setTimeout(() => {
            // Swap the actual child nodes instead of innerHTML
            const children1 = Array.from(content1.childNodes);
            const children2 = Array.from(content2.childNodes);

            // Clear existing content
            while (content1.firstChild) content1.removeChild(content1.firstChild);
            while (content2.firstChild) content2.removeChild(content2.firstChild);

            // Append swapped content
            children2.forEach(node => content1.appendChild(node));
            children1.forEach(node => content2.appendChild(node));

            // Reset styles and classes
            content1.classList.remove('swapping');
            content2.classList.remove('swapping');
            content1.style.transform = '';
            content2.style.transform = '';
            content1.style.top = '';
            content1.style.left = '';
            content2.style.top = '';
            content2.style.left = '';
            cell1.classList.remove('highlight-swap');
            cell2.classList.remove('highlight-swap');
        }, 500); // Corresponds to CSS transition duration
    }

    // --- End Visual Effect Helpers --- //

    // Scenario: Natural Language Commands
    const commandsSimArea = document.getElementById('scenario-commands')?.querySelector('.fa-simulation-area');
    if (commandsSimArea) {
        const commandButtons = commandsSimArea.querySelectorAll('.fa-sim-command');
        const outputArea = commandsSimArea.querySelector('.fa-sim-output');

        commandButtons.forEach(button => {
            button.addEventListener('click', () => {
                handleSimulatedCommandClick(button.dataset.command, outputArea);
            });
        });
    }

    function handleSimulatedCommandClick(command, outputArea) {
        resetSimulation(outputArea.closest('.fa-simulation-area')); // Reset this sim area
        outputArea.innerHTML = ''; // Clear default text

        let confirmationMessage = '';
        let impactText = 'Est. Load Change: -250, Pred. ACWR: 1.15'; // Example impact
        let commandAction = 'genericConfirm'; // Default action for confirm button

        if (command.includes('clear week')) {
            confirmationMessage = `Clear all exercises from Week 3?`;
            impactText = 'Est. Load Change: -2400, Pred. ACWR: 0.95';
            commandAction = 'clearWeek3';
        } else if (command.includes('shift mon wk 2')) {
            confirmationMessage = `Shift exercises from Mon Wk 2 forward 1 day?`;
             impactText = 'Est. Load Change: 0, Pred. ACWR: 1.20'; // No load change, just moving
             commandAction = 'shiftMonWk2';
        }

        const confirmationHtml = `
            <div class="fa-sim-toast info">
                <span class="toast-icon"></span>
                <div>
                    ${confirmationMessage}<br>
                    <small>(${impactText})</small><br><br>
                    <button class="fa-sim-confirm primary-cta" data-command-action="${commandAction}">Confirm</button>
                    <button class="fa-sim-cancel secondary-cta">Cancel</button>
                </div>
            </div>
        `;
        outputArea.innerHTML = confirmationHtml;

        // Add listeners to confirm/cancel buttons
         addConfirmCancelListeners(outputArea);
    }

     function addConfirmCancelListeners(outputArea) {
         // Use cloning to remove previous listeners effectively
         outputArea.querySelectorAll('.fa-sim-confirm, .fa-sim-cancel').forEach(button => {
             button.replaceWith(button.cloneNode(true));
         });
         // Add new listeners
          outputArea.querySelectorAll('.fa-sim-confirm').forEach(button => {
             button.addEventListener('click', handleSimulatedConfirmClick);
         });
         outputArea.querySelectorAll('.fa-sim-cancel').forEach(button => {
             button.addEventListener('click', handleSimulatedCancelClick);
         });
    }

    function handleSimulatedConfirmClick(event) {
        const button = event.target;
        const commandAction = button.dataset.commandAction;
        const outputArea = button.closest('.fa-sim-output');
        const simArea = outputArea.closest('.fa-simulation-area');

        outputArea.innerHTML = ''; // Clear confirmation toast
        let resultMessage = 'Simulated: Action confirmed and applied.';

        if (commandAction === 'clearWeek3') {
            resultMessage = 'Simulated: Cleared Week 3.';
            // Animate clearing week 3
            // Use if check instead of optional chaining
            const simBlock = simArea?.querySelector('.fa-sim-block');
            if (simBlock) {
                simBlock.querySelectorAll('.fa-sim-day-cell[data-week="3"]').forEach((cell, index) => {
                    // Stagger the animation slightly
                    setTimeout(() => clearDayVisually(simArea, 3, cell.dataset.day), index * 50);
                });
            }
        } else if (commandAction === 'shiftMonWk2') {
             resultMessage = 'Simulated: Shifted Mon Wk 2 exercises to Tuesday.';
             // Animate the shift
             swapDaysVisually(simArea, 2, 'mon', 2, 'tue'); // Use swap for visual effect
        }

        const resultToast = `<div class="fa-sim-toast success"><span class="toast-icon"></span><div>${resultMessage}</div></div>`;
        outputArea.innerHTML = resultToast;
    }

    function handleSimulatedCancelClick(event) {
        const button = event.target;
        const outputArea = button.closest('.fa-sim-output');
        outputArea.innerHTML = ''; // Clear confirmation toast
        const resultToast = `<div class="fa-sim-toast info"><span class="toast-icon"></span><div>Simulated: Action cancelled.</div></div>`;
        outputArea.innerHTML = resultToast;
    }

    // Initialize
    resetAllSimulations(); // Ensure clean state on load
    // Activate intro tab on initial load without animation
    switchTab('intro', true);

}); 