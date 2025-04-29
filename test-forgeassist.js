// Basic Node.js Test Script for ForgeAssist

// --- Mocks ---

// Mock AdaptiveScheduler
const MockAdaptiveScheduler = {
    init: () => console.log('[MockAdaptiveScheduler] Initialized'),
    calculateImpact: (changes) => {
        console.log('[MockAdaptiveScheduler] calculateImpact called with:', changes);
        const loadChange = changes.reduce((acc, change) => {
             if (change.type === 'remove') return acc - (parseInt(change.load || change.newLoad || '0', 10));
             if (change.type === 'add') return acc + (parseInt(change.load || change.newLoad || '0', 10));
             if (change.type === 'modifyLoad') return acc + (parseInt(change.loadChange || '0', 10));
             return acc;
        }, 0);
        return { 
            estimatedLoadChange: loadChange, 
            predictedACWR: 1.1 + (loadChange * 0.001), 
            predictedACWRFlag: 'green',
            predictedMonotony: 1.5,
            predictedMonotonyFlag: 'ok',
            predictedStrain: 2500 + loadChange 
        };
    },
    suggestSwap: (exerciseId, reason) => {
        console.log(`[MockAdaptiveScheduler] suggestSwap called for ${exerciseId}, reason: ${reason}`);
        return [{ id: 'ex_alt1', name: 'Alternative 1' }, { id: 'ex_alt2', name: 'Alternative 2' }];
    },
    proposeAdjustments: (triggerEvent, context) => {
        console.log(`[MockAdaptiveScheduler] proposeAdjustments called for ${triggerEvent}`, context);
         if (triggerEvent === 'highACWR') return [{ type: 'reduceLoad', description: 'Mock Reduce Load Wk 1', targetWeek: 1, percentage: 15, success: true }];
         if (triggerEvent === 'lowLoad') return [{ type: 'increaseLoad', description: 'Mock Increase Load Wk 1', targetWeek: 1, percentage: 10, success: true }];
         if (triggerEvent === 'highMonotony') return [{ type: 'swapDays', description: 'Mock Swap Days Wk 1', targetWeek: 1, day1: 'mon', day2: 'tue', success: true }];
         return [{ type: 'message', message: `No mock proposals for ${triggerEvent}` }];
    },
    proposePhaseOptimizations: (phaseName, startWeek, endWeek) => {
        console.log(`[MockAdaptiveScheduler] proposePhaseOptimizations called for ${phaseName} (${startWeek}-${endWeek})`);
        return [{ type: 'increaseLoad', description: 'Mock Phase Smooth Wk 2', targetWeek: startWeek+1, percentage: 5, success: true }];
    },
    // We need proposeLoadChange for the missed session suggestion
    proposeLoadChange: (percentageChange, scope, params) => {
        console.log(`[MockAdaptiveScheduler] proposeLoadChange called: ${percentageChange}% scope: ${scope}`, params);
        return {
            type: percentageChange < 0 ? 'reduceSpecificDay' : 'increaseLowDay',
            description: `Mock ${percentageChange}% ${scope} ${params.day} Wk ${params.week}`,
            targetWeek: params.week,
            targetDay: params.day,
            percentage: Math.abs(percentageChange),
            changes: [{ change: percentageChange * 10 }], // Dummy change
            impact: { predictedACWR: 1.1, predictedMonotony: 1.5 },
            success: true
        };
    },
    proposeRestDayInsertion: (week) => {
         console.log(`[MockAdaptiveScheduler] proposeRestDayInsertion called for Wk ${week}`);
         return { type: 'addRestDay', description: 'Mock Rest Day Wk 1', targetWeek: week, day: 'wed', success: true };
    }
};

// Mock DOM Elements
const mockCanvas = {
    querySelector: (selector) => {
        console.log(`[MockCanvas] querySelector: ${selector}`);
        if (selector.includes('.day-cell') && selector.includes('data-day')) {
            const weekMatch = selector.match(/data-week=\"(\d+)\"/);
            const dayMatch = selector.match(/data-day=\"(\w+)\"/);
            if (weekMatch && dayMatch) {
                 return createMockDayCell(weekMatch[1], dayMatch[1]);
            }
        }
        if (selector.includes('.workout-card') || selector.startsWith('#card-')) {
             // Find which card is requested
             if (selector.includes(mockPlaceholderCard.id)) return mockPlaceholderCard;
             return mockWorkoutCard; // Default to main card
        }
         if (selector.includes('.phase-bar')) {
             return mockPhaseBar;
         }
        console.warn(`[MockCanvas] querySelector returning null for: ${selector}`);
        return null;
    },
    querySelectorAll: (selector) => {
        console.log(`[MockCanvas] querySelectorAll: ${selector}`);
        if (selector.includes('.day-cell[data-week=')) {
             const weekMatch = selector.match(/data-week=\"(\d+)\"/);
             if (weekMatch) {
                 // Return mocks for all 7 days of that week for simplicity
                 return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => createMockDayCell(weekMatch[1], day));
             }
        }
        if (selector.includes('.workout-card')) {
            // Crude: Just return the main card for any workout card query
            return [ mockWorkoutCard ];
        }
        if (selector.includes('.phase-bar')) return [ mockPhaseBar ];
         if (selector === '.forge-assist-preview-highlight') { 
             console.log('[MockCanvas] querySelectorAll: .forge-assist-preview-highlight returning []');
             return []; // Assume clear clears nothing initially
         }
         console.warn(`[MockCanvas] querySelectorAll returning [] for: ${selector}`);
        return [];
    },
     // Mock event listeners for preview highlights
     _listeners: {},
     addEventListener: (type, listener) => { mockCanvas._listeners[type] = listener; },
     dispatchEvent: (event) => { 
         console.log(`[MockCanvas] dispatchEvent: ${event.type}`);
         if(mockCanvas._listeners[event.type]) mockCanvas._listeners[event.type](event); 
     },
};

const mockWorkoutCard = {
    id: 'card-123',
    classList: { // Mocking DOMTokenList methods used
        _classes: new Set(['workout-card']), // Internal state
        contains: function(cls) { return this._classes.has(cls); },
        add: function(cls) { 
            console.log(`  [MockCard ${mockWorkoutCard.id}] addClass: ${cls}`); 
            this._classes.add(cls); 
        },
        remove: function(cls) { 
            console.log(`  [MockCard ${mockWorkoutCard.id}] removeClass: ${cls}`); 
            this._classes.delete(cls); 
        },
     },
    dataset: {
        load: '350',
        loadValue: '8',
        loadType: 'rpe',
        isPlaceholder: 'false',
    },
    querySelector: (selector) => {
        if (selector === '.exercise-name') return { textContent: 'Mock Exercise' };
        if (selector === '.details') return { textContent: '3 sets x 5 reps @ RPE 8' };
        return null;
    },
    closest: (selector) => {
         if (selector === '.day-cell') return createMockDayCell('1', 'Mon'); // Returns a new mock cell obj
         return null;
    },
    remove: () => console.log(`  [MockCard ${mockWorkoutCard.id}] REMOVED`),
};

const mockPlaceholderCard = { 
    ...mockWorkoutCard, // Spread first
    id: 'card-placeholder', 
    classList: { // Need separate classList state
        _classes: new Set(['workout-card']), 
        contains: function(cls) { return this._classes.has(cls); },
        add: function(cls) { console.log(`  [MockCard ${mockPlaceholderCard.id}] addClass: ${cls}`); this._classes.add(cls); },
        remove: function(cls) { console.log(`  [MockCard ${mockPlaceholderCard.id}] removeClass: ${cls}`); this._classes.delete(cls); },
    },
    dataset: {...mockWorkoutCard.dataset, isPlaceholder: 'true'}, 
    querySelector: () => null 
};

const mockPhaseBar = {
     id: 'phase-bar-1',
     classList: { // Mocking DOMTokenList methods used
        _classes: new Set(['phase-bar']), 
        contains: function(cls) { return this._classes.has(cls); },
        add: function(cls) { console.log(`  [MockPhase ${mockPhaseBar.id}] addClass: ${cls}`); this._classes.add(cls); },
        remove: function(cls) { console.log(`  [MockPhase ${mockPhaseBar.id}] removeClass: ${cls}`); this._classes.delete(cls); },
     },
     dataset: { phase: 'Base', startWeek: '1', endWeek: '4' },
     closest: () => null,
};

// Need to return a *new* mock cell object each time querySelector finds one,
// so their classLists are independent.
function createMockDayCell(week, day) {
    const id = `cell-w${week}-d${day}`;
    return {
         id: id,
         classList: { // Mocking DOMTokenList methods used
            _classes: new Set(['day-cell']), 
            contains: function(cls) { return this._classes.has(cls); },
            add: function(cls) { console.log(`  [MockCell ${id}] addClass: ${cls}`); this._classes.add(cls); },
            remove: function(cls) { console.log(`  [MockCell ${id}] removeClass: ${cls}`); this._classes.delete(cls); },
         },
         dataset: { week: week, day: day },
         querySelectorAll: (selector) => {
             console.log(`  [MockCell ${id}] querySelectorAll: ${selector}`);
             // Simple mock: Assume Mon Wk 1 has the main card, others empty unless specific card requested
             if (week === '1' && day === 'Mon' && selector === '.workout-card') return [mockWorkoutCard];
             if (selector === `#${mockWorkoutCard.id}` && week === '1' && day === 'Mon') return [mockWorkoutCard]; 
             return [];
         },
         dispatchEvent: (event) => console.log(`  [MockCell ${id}] dispatchEvent: ${event.type}`),
    };
}

// Mock Dependencies object
const mockDependencies = {
    workCanvas: mockCanvas,
    showToast: (message, type = 'info', duration = 3000) => {
        console.log(`[Toast] (${type}, ${duration}ms):`, message.replace(/<[^>]*>?/gm, '')); // Strip basic HTML
    },
    triggerAnalyticsUpdate: () => {
        console.log('[ForgeAssist] triggerAnalyticsUpdate called');
    },
    getTotalWeeks: () => 4, // Example
    getBlockState: () => {
        console.log('[ForgeAssist] getBlockState called');
        return { /* some mock state if needed */ }; 
    },
    getCurrentBlockLoads: () => { // Needed by scheduler mocks and missed session
         console.log('[ForgeAssist->Scheduler] getCurrentBlockLoads called');
         // Example: 4 weeks, mostly non-zero loads, day 9 (Tue Wk 2) is zero
         return [300, 400, 0, 500, 450, 0, 600, 350, 0, 550, 500, 0, 700, 400, 450, 0, 600, 550, 0, 750, 450, 500, 0, 650, 600, 0, 800]; 
    }, 
    exerciseLibrary: [
        { id: 'ex1', name: 'Mock Exercise', category: 'Squat', primaryMuscles: ['Quads', 'Glutes'], equipment: 'barbell' },
        { id: 'ex2', name: 'Bench Press', category: 'Press', primaryMuscles: ['Pectorals', 'Triceps'], equipment: 'barbell' },
        { id: 'ex_alt1', name: 'Alternative 1', category: 'Squat', primaryMuscles: ['Quads'], equipment: 'bodyweight' },
        { id: 'ex_alt2', name: 'Alternative 2', category: 'Squat', primaryMuscles: ['Glutes'], equipment: 'dumbbell' },
    ],
    getPhaseWeekRange: (phaseName) => {
         console.log(`[ForgeAssist] getPhaseWeekRange called for ${phaseName}`);
         if (phaseName === 'Base') return { startWeek: 1, endWeek: 4 };
         return { startWeek: 0, endWeek: 0 };
    },
     // Mock analytics functions (passed via init -> AdaptiveScheduler.init)
     acwrFunction: (loads) => {
         console.log('[MockAnalytics] acwrFunction called');
         // Simplified mock calculation
         const chronic = loads.slice(0, 21).reduce((a, b) => a + b, 0) / 21;
         const acute = loads.slice(-7).reduce((a, b) => a + b, 0) / 7;
         const ratio = chronic > 0 ? acute / chronic : 1;
         return { ratio: ratio, flag: ratio > 1.5 ? 'red' : ratio < 0.8 ? 'amber' : 'green' };
     },
     monotonyFunction: (loads) => {
         console.log('[MockAnalytics] monotonyFunction called');
         // Simplified mock calculation
         const weeklyTotal = loads.reduce((a, b) => a + b, 0);
         const meanDaily = weeklyTotal / loads.length;
         if (meanDaily === 0) return { monotony: 0, strain: 0, flag: 'ok' };
         const stdDev = Math.sqrt(loads.reduce((sum, load) => sum + Math.pow(load - meanDaily, 2), 0) / loads.length);
         const monotony = stdDev > 0 ? meanDaily / stdDev : 0;
         const strain = weeklyTotal * monotony;
         return { monotony: monotony, strain: strain, flag: monotony > 2.0 ? 'high' : 'ok' };
     },
     simulatedPastLoad: new Array(21).fill(300), // Mock 3 weeks of past load
     // --- Added mocks based on recent changes ---
     updateCardDetailsString: (card) => { console.log(`[ForgeAssist] updateCardDetailsString called for card ${card.id}`); },
     calculateCardLoad: (cardData) => { 
         console.log(`[ForgeAssist] calculateCardLoad called`);
         // Simple mock based on RPE * 100 maybe?
         return (parseFloat(cardData.loadValue) || 0) * 50; 
      }
};

// --- Test Runner ---
async function runTests() {
    console.log('--- Initializing ForgeAssist ---');
    const { default: ForgeAssist } = await import('./js/forgeassist.js');
    
    ForgeAssist.init(mockDependencies);
    console.log('\\n--- Initialization Complete ---');
    
    // Test Context Updates
    console.log('\\n--- Testing Context ---');
    ForgeAssist.updateContext(null, new Set());
    console.log('Context with null selection.');
    ForgeAssist.updateContext(mockWorkoutCard, new Set([mockWorkoutCard]));
    console.log('Context with workout card selection.');
    // Create a mock day cell instance for testing
    const testDayCell = createMockDayCell('1', 'Tue'); 
    ForgeAssist.updateContext(testDayCell, new Set([testDayCell]));
     console.log('Context with day cell selection.');
     ForgeAssist.updateContext(mockPhaseBar, new Set([mockPhaseBar]));
     console.log('Context with phase bar selection.');
     ForgeAssist.updateContext(mockPlaceholderCard, new Set([mockPlaceholderCard]));
     console.log('Context with placeholder card selection.');
     
    // Test Contextual Actions (just check they run without error)
     console.log('\\n--- Testing Contextual Actions ---');
     console.log('Actions for null selection:', ForgeAssist.getContextualActions());
     ForgeAssist.updateContext(mockWorkoutCard, new Set([mockWorkoutCard]));
     console.log('Actions for workout card:', ForgeAssist.getContextualActions());
     // Use the created mock cell instance here too
     ForgeAssist.updateContext(testDayCell, new Set([testDayCell])); 
     console.log('Actions for day cell:', ForgeAssist.getContextualActions());
      ForgeAssist.updateContext(mockPhaseBar, new Set([mockPhaseBar]));
     console.log('Actions for phase bar:', ForgeAssist.getContextualActions());
      ForgeAssist.updateContext(mockPlaceholderCard, new Set([mockPlaceholderCard]));
     console.log('Actions for placeholder card:', ForgeAssist.getContextualActions());
     ForgeAssist.updateContext(null, new Set()); // Reset context

    // Test Command Processing (no confirm/prompt mocking)
    console.log('\\n--- Testing processCommand ---');
    ForgeAssist.processCommand('clear week 1'); // Requires confirmation (skipped)
    ForgeAssist.processCommand('clear mon wk 1'); // Requires confirmation (skipped)
    ForgeAssist.processCommand('shift tue wk 2 forward 1 day'); // Requires confirmation (skipped)
    ForgeAssist.processCommand('suggest swap for Mock Exercise'); // Should run fine
    // ForgeAssist.processCommand('missed wed wk 2'); // Requires prompt (skipped)
    console.log("Skipping 'missed' command due to prompt().");
    ForgeAssist.processCommand('optimize acwr'); // Should be parsed now
    ForgeAssist.processCommand('reduce load week 1 by 10%'); // Should be parsed
    ForgeAssist.processCommand('convert thu wk 1 to rest day'); // Should be parsed
    ForgeAssist.processCommand('invalid command'); // Shows warning

    // Test Analytics Check
    console.log('\\n--- Testing checkAnalyticsThresholds ---');
    ForgeAssist.checkAnalyticsThresholds({ acwrRatio: 1.8, monotonyValue: 1.5, strainValue: 3000 }); // High ACWR
    ForgeAssist.checkAnalyticsThresholds({ acwrRatio: 1.1, monotonyValue: 2.5, strainValue: 4000 }); // High Monotony
    ForgeAssist.checkAnalyticsThresholds({ acwrRatio: 0.5, monotonyValue: 1.0, strainValue: 2000 }); // Low ACWR
    ForgeAssist.checkAnalyticsThresholds({ acwrRatio: 1.1, monotonyValue: 1.5, strainValue: 6000 }); // High Strain (triggers highACWR proposal)
    ForgeAssist.checkAnalyticsThresholds({ acwrRatio: 1.1, monotonyValue: 1.5, strainValue: 3000 }); // Normal

    // Cannot easily test handleProposalAction, handleMissedSession etc. due to UI/confirm/prompt
    console.log('\\n--- Basic Tests Complete ---');
     console.log('Note: Actions requiring confirm() or prompt() were not fully executed.');
     console.log('Note: DOM manipulation results are based on console logs from mocks.');

}

runTests()
    .catch(err => console.error("Test execution failed:", err)); 