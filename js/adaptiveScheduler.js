/**
 * Adaptive Scheduler Module (Phase 3 Implementation)
 *
 * Responsibilities:
 * - Simulate the impact of proposed changes on block analytics.
 * - Provide exercise swap suggestions.
 * - Propose intelligent adjustments to the training block based on analytics thresholds.
 * - Offer load reduction and rest day insertion strategies.
 * - NEW: Provide autoregulation and adaptive training features
 */
const AdaptiveScheduler = (() => {

    // Dependencies (analytics functions and exercise data)
    let dependencies = {
        exerciseLibrary: [],
        acwrFunction: null,      // Will be injected
        monotonyFunction: null,  // Will be injected
        getCurrentBlockLoads: null, // Function to get current loads from blockbuilder
        simulatedPastLoad: []    // Historical load data
    };

    // Performance tracking for autoregulation
    let performanceHistory = {};

    // --- Scratch Pad - Phase 3 ---
    // [X] Create js/adaptiveScheduler.js module.
    // [X] Implement AdaptiveScheduler.calculateImpact(changes): Basic simulation.
    // [X] Implement AdaptiveScheduler.suggestSwap(exerciseId, reason): Basic logic.
    // [ ] Enhance calculateImpact to use real analytics functions
    // [ ] Implement proposeAdjustments(triggerEvent, context)
    // [ ] Add support for load reduction proposals
    // [ ] Add support for rest day insertion
    // --- End Scratch Pad ---

    /**
     * Initializes the module with necessary dependencies.
     * @param {object} deps - Object containing dependencies.
     * @param {Array} deps.exerciseLibrary - The loaded exercise library data.
     * @param {function} deps.acwrFunction - The ACWR calculation function
     * @param {function} deps.monotonyFunction - The monotony calculation function
     * @param {function} deps.getCurrentBlockLoads - Function to get current block loads
     * @param {Array} deps.simulatedPastLoad - Historical load data
     */
    function init(deps) {
        dependencies.exerciseLibrary = deps.exerciseLibrary || [];
        dependencies.acwrFunction = deps.acwrFunction;
        dependencies.monotonyFunction = deps.monotonyFunction;
        dependencies.getCurrentBlockLoads = deps.getCurrentBlockLoads;
        dependencies.simulatedPastLoad = deps.simulatedPastLoad || [];
        
        // Load performance history from localStorage if available
        try {
            const storedHistory = localStorage.getItem('setforgePerformanceHistory');
            if (storedHistory) {
                performanceHistory = JSON.parse(storedHistory);
            }
        } catch (error) {
            console.error("Error loading performance history:", error);
        }
        
        console.log('[AdaptiveScheduler] Initialized with analytics functions and adaptive training features.');
    }

    /**
     * Simulates the impact of proposed changes on the block state.
     * (Phase 3: More accurate analytics prediction)
     * @param {Array<object>} changes - An array of change descriptions.
     * @param {object} currentBlockState - The current state object (from getBlockState).
     * @returns {object} - Predicted analytics impact.
     */
    function calculateImpact(changes, currentBlockState) {
        console.log('[AdaptiveScheduler] Simulating impact for changes:', changes);
        const daysPerWeek = 7;
        const dayNames = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']; // Keep consistent day name mapping

        // Initialize impact with defaults
        let impact = {
            estimatedLoadChange: 0,
            predictedACWR: NaN,
            predictedACWRFlag: 'green',
            predictedMonotony: NaN,
            predictedMonotonyFlag: 'ok',
            predictedStrain: NaN
        };

        // If analytics functions are available, use them for more accurate predictions
        if (dependencies.getCurrentBlockLoads && 
           (dependencies.acwrFunction || dependencies.monotonyFunction)) {
            
            try {
                // Get the current load pattern
                const currentLoads = dependencies.getCurrentBlockLoads();
                const originalTotalLoad = currentLoads.reduce((sum, load) => sum + (load || 0), 0);
                const modifiedLoads = [...currentLoads]; // Start with a copy

                // Apply detailed changes to the load array
                changes.forEach(change => {
                    let loadIndex = -1;
                    let currentLoadAtIndex = 0;

                    // Determine the index in the load array
                    if (typeof change.week === 'number' && typeof change.day === 'string') {
                        const dayIndex = dayNames.indexOf(change.day.toLowerCase());
                        if (change.week >= 1 && dayIndex !== -1) {
                            loadIndex = (change.week - 1) * daysPerWeek + dayIndex;
                        } else {
                            console.warn(`[AdaptiveScheduler] Invalid week/day for change:`, change);
                        }
                    } else if (typeof change.loadIndex === 'number' && change.loadIndex >= 0) { 
                        // Allow caller to provide direct index if known
                        loadIndex = change.loadIndex;
                    } else {
                         // Cannot determine index for this change, skip it
                         console.warn(`[AdaptiveScheduler] Cannot determine load index for simulation change:`, change);
                         return; // Skip this change object
                    }

                    // Ensure index is within bounds
                    if (loadIndex >= 0 && loadIndex < modifiedLoads.length) {
                        currentLoadAtIndex = modifiedLoads[loadIndex] || 0;
                        let newLoad = currentLoadAtIndex; // Start with current value

                        // Apply change based on type
                        switch (change.type) {
                            case 'remove':
                                const loadToRemove = parseInt(change.load, 10) || 0;
                                newLoad = Math.max(0, currentLoadAtIndex - loadToRemove);
                                break;
                            case 'add':
                                // Use newLoad if provided (e.g. from a new card), otherwise fallback
                                const loadToAdd = parseInt(change.newLoad ?? change.load, 10) || 0; 
                                newLoad = currentLoadAtIndex + loadToAdd;
                                break;
                            case 'modifyLoad':
                                // Prefer newLoad if specified, otherwise use loadChange
                                if (typeof change.newLoad === 'number') {
                                    newLoad = Math.max(0, change.newLoad);
                                } else if (typeof change.loadChange === 'number') {
                                    newLoad = Math.max(0, currentLoadAtIndex + change.loadChange);
                    } else {
                                     console.warn(`[AdaptiveScheduler] modifyLoad change missing newLoad or loadChange:`, change);
                                }
                                break;
                             case 'move':
                                // For simulation, 'move' is complex. Assume the caller provided
                                // separate 'remove' and 'add' changes or appropriate 'modifyLoad' 
                                // changes for the source and destination.
                                console.warn(`[AdaptiveScheduler] 'move' change type ignored in simulation; expect specific add/remove/modifyLoad changes.`);
                                break;
                            default:
                                console.warn(`[AdaptiveScheduler] Unknown change type for simulation: ${change.type}`);
                        }
                        
                        // Update the load at the calculated index
                        modifiedLoads[loadIndex] = newLoad;

                    } else {
                        // Handle cases where index might be out of bounds (e.g., shifting past end)
                        console.warn(`[AdaptiveScheduler] Calculated load index ${loadIndex} is out of bounds (0-${modifiedLoads.length - 1}). Change skipped:`, change);
                    }
                });
                
                const finalTotalLoad = modifiedLoads.reduce((sum, load) => sum + (load || 0), 0);
                impact.estimatedLoadChange = finalTotalLoad - originalTotalLoad;

                // --- Calculate analytics using modifiedLoads --- 
                const combinedLoads = [...dependencies.simulatedPastLoad, ...modifiedLoads];
                
                // Calculate ACWR if possible
                if (dependencies.acwrFunction && combinedLoads.length >= 28) {
                    try {
                        const acwrResult = dependencies.acwrFunction(combinedLoads.slice(-28));
                        impact.predictedACWR = acwrResult.ratio;
                        impact.predictedACWRFlag = acwrResult.flag;
                    } catch (error) {
                        console.error("ACWR Prediction Error:", error);
                    }
                }

                // Calculate Monotony if possible
                if (dependencies.monotonyFunction && modifiedLoads.length >= 7) {
                    try {
                        const monotonyResult = dependencies.monotonyFunction(modifiedLoads.slice(-7));
                        impact.predictedMonotony = monotonyResult.monotony;
                        impact.predictedMonotonyFlag = monotonyResult.flag;
                        impact.predictedStrain = monotonyResult.strain; // Assign predicted strain
                    } catch (error) {
                        console.error("Monotony Prediction Error:", error);
                    }
                }

                return impact; // Return the calculated impact object

            } catch (error) {
                console.error("[AdaptiveScheduler] Impact simulation error:", error);
                // Fall back to basic estimation if anything above failed
                impact.estimatedLoadChange = changes.reduce((acc, ch) => acc + (ch.loadChange || 0), 0); // Simple sum fallback
                // Keep default NaN/green/ok flags from initialization
                return impact;
            }
        } else {
             // Analytics functions not available, return basic estimate
             impact.estimatedLoadChange = changes.reduce((acc, ch) => acc + (ch.loadChange || (ch.type === 'remove' ? -(parseInt(ch.load,10)||0) : (ch.type === 'add' ? (parseInt(ch.newLoad ?? ch.load, 10)||0) : 0))), 0);
             // Keep default NaN/green/ok flags
             return impact;
        }
    }

    /**
     * Suggests alternative exercises based on primary muscles and equipment.
     * (Phase 3: Basic recommendation, to be enhanced)
     * @param {string} exerciseId - The ID of the exercise to find alternatives for.
     * @param {string} reason - Optional reason for the swap (e.g., 'equipment', 'recovery').
     * @returns {Array<object>} - Array of suggested alternatives.
     */
    function suggestSwap(exerciseId, reason = '', contextualConstraints = {}) {
        console.log('[AdaptiveScheduler] Suggesting swap for exercise ID:', exerciseId, 'Reason:', reason);
        
        // Get the base exercise
        const baseExercise = dependencies.exerciseLibrary.find(ex => ex.id === exerciseId);
        if (!baseExercise) {
            console.warn(`[AdaptiveScheduler] Exercise with ID ${exerciseId} not found for swap.`);
            return [];
        }
        
        // Generate contextual constraints based on reason
        const combinedConstraints = {...contextualConstraints};
        
        if (reason === 'equipment') {
            combinedConstraints.excludeEquipment = baseExercise.equipmentNeeded || [];
        } else if (reason === 'recovery') {
            combinedConstraints.maxDifficulty = baseExercise.difficulty === 'Advanced' ? 'Intermediate' : 'Beginner';
        } else if (reason === 'progression') {
            combinedConstraints.minDifficulty = baseExercise.difficulty === 'Beginner' ? 'Intermediate' : 'Advanced';
        }
        
        // Use the enhanced library function if available
        if (typeof window.exerciseLibrary?.suggestAlternatives === 'function') {
            return window.exerciseLibrary.suggestAlternatives(exerciseId, combinedConstraints);
        }
        
        // Fallback to basic implementation if library function not available
        const alternatives = [];
        
        // Filter the exercise library 
        const candidateExercises = dependencies.exerciseLibrary.filter(ex => {
            // Don't suggest the same exercise
            if (ex.id === exerciseId) return false;
            
            // Check equipment constraints
            if (combinedConstraints.excludeEquipment && 
                ex.equipmentNeeded && 
                ex.equipmentNeeded.some(eq => combinedConstraints.excludeEquipment.includes(eq))) {
                return false;
            }
            
            // Check difficulty constraints
            if (combinedConstraints.maxDifficulty) {
                const difficultyOrder = { "Beginner": 1, "Intermediate": 2, "Advanced": 3 };
                if (difficultyOrder[ex.difficulty] > difficultyOrder[combinedConstraints.maxDifficulty]) {
                    return false;
                }
            }
            
            if (combinedConstraints.minDifficulty) {
                const difficultyOrder = { "Beginner": 1, "Intermediate": 2, "Advanced": 3 };
                if (difficultyOrder[ex.difficulty] < difficultyOrder[combinedConstraints.minDifficulty]) {
                    return false;
                }
            }
            
            // Basic muscle matching (if no advanced similarity function)
            const hasCommonPrimaryMuscle = (baseExercise.primaryMuscles || []).some(
                muscle => (ex.primaryMuscles || []).includes(muscle)
            );
            
            return hasCommonPrimaryMuscle;
        });
        
        // Sort by primary muscle match count (basic prioritization)
        candidateExercises.sort((a, b) => {
            const aPrimaryMatches = (baseExercise.primaryMuscles || []).filter(
                m => (a.primaryMuscles || []).includes(m)
            ).length;
            
            const bPrimaryMatches = (baseExercise.primaryMuscles || []).filter(
                m => (b.primaryMuscles || []).includes(m)
            ).length;
            
            return bPrimaryMatches - aPrimaryMatches;
        });
        
        // Return top alternatives (limited to 5)
        return candidateExercises.slice(0, 5).map(ex => ({
            exercise: ex,
            similarityScore: 0, // Not calculated in basic version
            matchesConstraints: true
        }));
    }

    /**
     * Adjusts training load based on athlete feedback.
     * @param {string} exerciseId - The ID of the exercise.
     * @param {number} rpeValue - RPE value from athlete feedback (1-10).
     * @param {number} setCompletion - Reps completed on the final set.
     * @returns {object} - Load adjustment recommendation.
     */
    function adjustLoadBasedOnFeedback(exerciseId, rpeValue, setCompletion) {
        console.log(`[AdaptiveScheduler] Adjusting load based on feedback: ExerciseID=${exerciseId}, RPE=${rpeValue}, Reps=${setCompletion}`);
        
        // Initialize performance history for this exercise if it doesn't exist
        if (!performanceHistory[exerciseId]) {
            performanceHistory[exerciseId] = {
                recentRPEs: [],
                recentCompletions: [],
                targetRPE: 8.0, // Default target RPE
                lastAdjustment: 0
            };
        }
        
        // Get history for this exercise
        const history = performanceHistory[exerciseId];
        
        // Record this performance
        history.recentRPEs.push(rpeValue);
        history.recentCompletions.push(setCompletion);
        
        // Keep only recent history (last 5 sessions)
        if (history.recentRPEs.length > 5) {
            history.recentRPEs.shift();
            history.recentCompletions.shift();
        }
        
        // Calculate average RPE of recent sessions
        const avgRPE = history.recentRPEs.reduce((sum, rpe) => sum + rpe, 0) / history.recentRPEs.length;
        
        // Calculate appropriate load adjustment
        let loadAdjustment = 0;
        let reason = "";
        
        if (rpeValue < history.targetRPE - 1.5) {
            // RPE is much lower than target - increase significantly
            loadAdjustment = 0.075; // 7.5% increase
            reason = "RPE too low - significant increase needed";
        } else if (rpeValue < history.targetRPE - 0.5) {
            // RPE is moderately lower than target
            loadAdjustment = 0.05; // 5% increase
            reason = "RPE below target - moderate increase recommended";
        } else if (rpeValue > history.targetRPE + 1.5) {
            // RPE is much higher than target - decrease significantly
            loadAdjustment = -0.075; // 7.5% decrease
            reason = "RPE too high - significant decrease needed";
        } else if (rpeValue > history.targetRPE + 0.5) {
            // RPE is moderately higher than target
            loadAdjustment = -0.05; // 5% decrease
            reason = "RPE above target - moderate decrease recommended";
        } else {
            // RPE is close to target
            loadAdjustment = 0.02; // 2% maintenance increase
            reason = "RPE on target - minimal progression";
        }
        
        // Record this adjustment
        history.lastAdjustment = loadAdjustment;
        
        // Save updated performance history to localStorage
        try {
            localStorage.setItem('setforgePerformanceHistory', JSON.stringify(performanceHistory));
        } catch (error) {
            console.error("Error saving performance history:", error);
        }
        
        return {
            loadAdjustment,
            reason,
            targetRPE: history.targetRPE,
            avgRecentRPE: avgRPE
        };
    }

    /**
     * Suggests exercise rotation to prevent adaptation and plateaus.
     * @param {string} currentExerciseId - The current exercise ID to consider for rotation.
     * @param {number} weekIndex - Current week index (1-based).
     * @returns {object} - Rotation recommendation with options.
     */
    function suggestExerciseRotation(currentExerciseId, weekIndex) {
        console.log(`[AdaptiveScheduler] Checking rotation for exercise ID: ${currentExerciseId}`);
        
        // Get the exercise usage data
        const exerciseUsage = trackExerciseUsage();
        const currentExercise = dependencies.exerciseLibrary.find(ex => ex.id === currentExerciseId);
        
        if (!currentExercise) {
            console.warn(`[AdaptiveScheduler] Exercise with ID ${currentExerciseId} not found for rotation check.`);
            return { shouldRotate: false };
        }
        
        // If exercise has been used for more than 6 weeks, suggest rotation
        if (exerciseUsage[currentExerciseId] && exerciseUsage[currentExerciseId].consecutiveWeeks >= 6) {
            const reason = "preventing_adaptation";
            
            // Define rotation constraints
            const rotationConstraints = {
                excludeExerciseIds: [currentExerciseId], // Don't suggest the same exercise
                preservePrimaryMuscles: true,            // Target same primary muscles
                preferNovelStimulus: true,               // Prefer different movement pattern
                similarDifficulty: true                  // Keep similar difficulty level
            };
            
            // Get alternatives matching rotation criteria
            const rotationOptions = suggestSwap(currentExerciseId, reason, rotationConstraints);
            
            // Return rotation recommendation
            return {
                shouldRotate: true,
                reason: "This exercise has been used consistently for 6+ weeks. Rotation recommended to prevent adaptation plateau.",
                currentExerciseName: currentExercise.name,
                weeksUsed: exerciseUsage[currentExerciseId].consecutiveWeeks,
                options: rotationOptions
            };
        }
        
        // No rotation needed yet
        return { 
            shouldRotate: false,
            currentExerciseName: currentExercise.name,
            weeksUsed: exerciseUsage[currentExerciseId]?.consecutiveWeeks || 0,
            weeksUntilRotation: Math.max(0, 6 - (exerciseUsage[currentExerciseId]?.consecutiveWeeks || 0))
        };
    }

    /**
     * Tracks exercise usage patterns across the program.
     * @returns {object} - Usage statistics for each exercise.
     */
    function trackExerciseUsage() {
        const usage = {};
        
        // Use block state if available through dependencies
        if (!dependencies.getBlockState) {
            console.warn('[AdaptiveScheduler] getBlockState dependency not available for tracking exercise usage');
            return usage;
        }
        
        // Get the current program state
        const blockState = dependencies.getBlockState();
        
        // Validate block state structure
        if (!blockState || !blockState.weeks || !Array.isArray(blockState.weeks)) {
            console.warn('[AdaptiveScheduler] Invalid block state for tracking exercise usage');
            return usage;
        }
        
        // Iterate through all weeks and days
        blockState.weeks.forEach((week, weekIndex) => {
            if (!week.days || !Array.isArray(week.days)) return;
            
            week.days.forEach(day => {
                if (!day.exercises || !Array.isArray(day.exercises)) return;
                
                day.exercises.forEach(exercise => {
                    const exerciseId = exercise.id;
                    if (!exerciseId) return;
                    
                    // Initialize if first encounter
                    if (!usage[exerciseId]) {
                        usage[exerciseId] = {
                            totalWeeks: 0,
                            consecutiveWeeks: 0,
                            weekPattern: []
                        };
                    }
                    
                    // Mark this week as used (using 1-based week numbers)
                    const weekNumber = weekIndex + 1;
                    if (!usage[exerciseId].weekPattern.includes(weekNumber)) {
                        usage[exerciseId].weekPattern.push(weekNumber);
                    }
                });
            });
        });
        
        // Calculate metrics for each exercise
        Object.keys(usage).forEach(exerciseId => {
            const pattern = usage[exerciseId].weekPattern.sort((a, b) => a - b);
            usage[exerciseId].totalWeeks = pattern.length;
            
            // Calculate consecutive weeks
            let maxConsecutive = 1;
            let currentConsecutive = 1;
            
            for (let i = 1; i < pattern.length; i++) {
                if (pattern[i] === pattern[i-1] + 1) {
                    currentConsecutive++;
                } else {
                    maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
                    currentConsecutive = 1;
                }
            }
            
            maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
            usage[exerciseId].consecutiveWeeks = maxConsecutive;
        });
        
        return usage;
    }

    /**
     * Detects when deloads are needed based on performance metrics.
     * @param {object} metrics - Performance and fatigue metrics.
     * @returns {object} - Deload recommendation.
     */
    function detectDeloadNeed(metrics) {
        console.log('[AdaptiveScheduler] Checking deload need with metrics:', metrics);
        
        // Set threshold values
        const HIGH_ACWR_THRESHOLD = 1.5;
        const HIGH_MONOTONY_THRESHOLD = 2.0;
        const HIGH_STRAIN_THRESHOLD = 5000;
        const FATIGUE_THRESHOLD = 3; // Number of consecutive sessions with increasing RPE
        
        let needsDeload = false;
        let recommendedStrategy = '';
        let reason = '';
        
        // Check each potential deload trigger
        if (metrics.acwr > HIGH_ACWR_THRESHOLD) {
            needsDeload = true;
            recommendedStrategy = 'volume';
            reason = `ACWR is high (${metrics.acwr.toFixed(2)}) - risk of overtraining`;
        } 
        else if (metrics.monotony > HIGH_MONOTONY_THRESHOLD) {
            needsDeload = true;
            recommendedStrategy = 'schedule';
            reason = `Training monotony is high (${metrics.monotony.toFixed(2)}) - need schedule variety`;
        }
        else if (metrics.strain > HIGH_STRAIN_THRESHOLD) {
            needsDeload = true;
            recommendedStrategy = 'intensity';
            reason = `Training strain is high (${metrics.strain.toFixed(0)}) - reduce intensity`;
        }
        else if (metrics.performanceDeclineDuration >= FATIGUE_THRESHOLD) {
            needsDeload = true;
            recommendedStrategy = 'full';
            reason = `Performance decline over ${metrics.performanceDeclineDuration} sessions - full deload needed`;
        }
        else if (metrics.rpeIncreaseRate > 0.5) {
            needsDeload = true;
            recommendedStrategy = 'intensity';
            reason = `RPE increasing rapidly (${metrics.rpeIncreaseRate.toFixed(2)} per session) - reduce intensity`;
        }
        
        return {
            needsDeload,
            recommendedStrategy,
            reason
        };
    }

    /**
     * Analyzes phase progress and recommends transitions.
     * @param {string} currentPhase - The current phase goal ('strength', 'hypertrophy', etc.).
     * @param {object} metrics - Progress metrics for different qualities.
     * @returns {object} - Phase transition recommendation.
     */
    function checkPhaseProgression(currentPhase, metrics) {
        console.log(`[AdaptiveScheduler] Checking phase progression: ${currentPhase}`, metrics);
        
        let shouldTransition = false;
        let nextPhase = '';
        let reason = '';
        
        // Define phase progression logic based on current phase
        switch (currentPhase) {
            case 'strength':
                if (metrics.strengthGains < 0.5 && metrics.strengthGains > 0) {
                    shouldTransition = true;
                    nextPhase = 'power';
                    reason = 'Strength gains plateauing, time to transition to power phase';
                }
                break;
                
            case 'hypertrophy':
                if (metrics.hypertrophyProgress > 80) {
                    shouldTransition = true;
                    nextPhase = 'strength';
                    reason = 'Sufficient hypertrophy achieved, time to develop maximal strength';
                }
                break;
                
            case 'power':
                if (metrics.powerDevelopment > 85) {
                    shouldTransition = true;
                    nextPhase = 'peaking';
                    reason = 'Power development near optimal, time to peak for competition';
                }
                break;
                
            case 'endurance':
                if (metrics.enduranceProgress > 90) {
                    shouldTransition = true;
                    nextPhase = 'hypertrophy';
                    reason = 'Endurance base established, time to build muscle';
                }
                break;
                
            case 'peaking':
                // Peaking phases should be short and followed by deload/transition
                shouldTransition = true;
                nextPhase = 'maintenance';
                reason = 'Peaking phase complete, transition to maintenance phase';
                break;
                
            default:
                shouldTransition = false;
        }
        
        return {
            shouldTransition,
            nextPhase,
            reason,
            currentProgress: metrics
        };
    }

    /**
     * Suggests accessory exercises to complement a main lift.
     * @param {string} mainExerciseId - The ID of the main exercise.
     * @param {object} userPerformance - Performance data for the user.
     * @returns {Array<object>} - List of suggested accessory exercises.
     */
    function suggestAccessories(mainExerciseId, userPerformance = {}) {
        console.log(`[AdaptiveScheduler] Suggesting accessories for: ${mainExerciseId}`);
        
        if (!dependencies.exerciseLibrary || !dependencies.exerciseLibrary.length) {
            console.warn('[AdaptiveScheduler] Exercise library not available. Cannot suggest accessories.');
            return [];
        }

        // Find the main exercise
        const mainExercise = dependencies.exerciseLibrary.find(ex => ex.id === mainExerciseId);
        if (!mainExercise) {
            console.warn(`[AdaptiveScheduler] Exercise with ID ${mainExerciseId} not found in library.`);
            return [];
        }
        
        // Standard accessory recommendations based on main lifts
        const accessoryMappings = {
            'Squat': [
                { name: 'Leg Press', reason: 'quad development', sets: 3, reps: '8-12' },
                { name: 'Romanian Deadlift', reason: 'posterior chain', sets: 3, reps: '8-10' },
                { name: 'Ab Wheel Rollout', reason: 'core stability', sets: 3, reps: '10-15' }
            ],
            'Bench Press': [
                { name: 'Tricep Pushdown', reason: 'lockout strength', sets: 3, reps: '10-15' },
                { name: 'Dumbbell Fly', reason: 'chest development', sets: 3, reps: '10-12' },
                { name: 'Face Pulls', reason: 'shoulder health', sets: 3, reps: '15-20' }
            ],
            'Deadlift': [
                { name: 'Pull Ups', reason: 'back strength', sets: 3, reps: '6-10' },
                { name: 'Barbell Row', reason: 'upper back', sets: 3, reps: '8-10' },
                { name: 'Glute Ham Raise', reason: 'posterior chain', sets: 3, reps: '8-12' }
            ],
            'Overhead Press': [
                { name: 'Lateral Raise', reason: 'deltoid development', sets: 3, reps: '12-15' },
                { name: 'Tricep Extension', reason: 'tricep strength', sets: 3, reps: '10-12' },
                { name: 'Face Pulls', reason: 'shoulder health', sets: 3, reps: '15-20' }
            ]
        };
        
        // Check for direct match in our mappings
        let accessories = [];
        for (const [key, recommendations] of Object.entries(accessoryMappings)) {
            if (mainExercise.name.includes(key)) {
                accessories = [...recommendations];
                break;
            }
        }
        
        // If no direct match, suggest based on category
        if (accessories.length === 0) {
            switch (mainExercise.category) {
                case 'Squat/Lunge':
                    accessories = [
                        { name: 'Split Squat', reason: 'unilateral strength', sets: 3, reps: '8-10' },
                        { name: 'Leg Extension', reason: 'quad isolation', sets: 3, reps: '12-15' }
                    ];
                    break;
                case 'Push':
                    accessories = [
                        { name: 'Pushups', reason: 'general development', sets: 3, reps: '10-20' },
                        { name: 'Dips', reason: 'tricep emphasis', sets: 3, reps: '8-12' }
                    ];
                    break;
                case 'Pull':
                    accessories = [
                        { name: 'Pull Ups', reason: 'vertical pull', sets: 3, reps: '6-10' },
                        { name: 'Dumbbell Row', reason: 'unilateral strength', sets: 3, reps: '8-12' }
                    ];
                    break;
                case 'Hinge':
                    accessories = [
                        { name: 'Good Morning', reason: 'posterior chain', sets: 3, reps: '8-12' },
                        { name: 'Back Extension', reason: 'lower back', sets: 3, reps: '10-15' }
                    ];
                    break;
                default:
                    accessories = [
                        { name: 'Face Pulls', reason: 'shoulder health', sets: 3, reps: '15-20' },
                        { name: 'Plank', reason: 'core stability', sets: 3, reps: '30-60s' }
                    ];
            }
        }
        
        // Personalize based on user performance if available
        if (userPerformance.weaknesses) {
            // Example: Add exercises targeting weak points
            if (userPerformance.weaknesses.includes('lockout')) {
                accessories.unshift({ 
                    name: 'Close Grip Bench Press', 
                    reason: 'improve lockout strength', 
                    sets: 3, 
                    reps: '6-8' 
                });
            }
            
            if (userPerformance.weaknesses.includes('bottom')) {
                accessories.unshift({ 
                    name: 'Pause Squats', 
                    reason: 'improve bottom position', 
                    sets: 3, 
                    reps: '5-8' 
                });
            }
        }
        
        return accessories;
    }

    /**
     * Proposes adaptive adjustments based on trigger events and analytics data.
     * (Phase 3: Enhanced decision-making for adjustments)
     * @param {string} triggerEvent - The event that triggered the adjustments (e.g., 'highACWR', 'highMonotony').
     * @param {Object} context - Context data for the adjustment proposals (e.g., { acwr, monotony, strain, weeklyLoads }).
     * @returns {Array<Object>} - Array of proposed adjustments.
     */
    function proposeAdjustments(triggerEvent, context = {}) {
        console.log('[AdaptiveScheduler] Proposing adjustments for:', triggerEvent, context);
        
        const proposals = [];
        
        // Make sure we have enough context information
        if (!context.weeklyLoads && !context.currentLoads) {
            console.warn('[AdaptiveScheduler] Insufficient context for adjustment proposals.');
            return [{ type: 'message', message: 'Insufficient data to propose specific adjustments.' }];
        }
        
        // Use provided loads or fetch them
        const currentLoads = context.currentLoads || 
                          (typeof dependencies.getCurrentBlockLoads === 'function' ? 
                           dependencies.getCurrentBlockLoads() : []);
        
        // If we still don't have loads, we can't proceed
        if (!currentLoads || currentLoads.length === 0) {
            return [{ type: 'message', message: 'Unable to access current training loads for assessment.' }];
        }
        
        switch (triggerEvent) {
            case 'highACWR':
                // Identify the highest acute load days
                proposals.push(...proposeHighACWRAdjustments(context, currentLoads));
                break;
                
            case 'lowACWR':
                // Find opportunities to increase load
                proposals.push(...proposeLowACWRAdjustments(context, currentLoads));
                break;
                
            case 'highMonotony':
                // Identify ways to add variability
                proposals.push(...proposeHighMonotonyAdjustments(context, currentLoads));
                break;
                
            case 'highStrain':
                // Reduce overall training stress
                proposals.push(...proposeHighStrainAdjustments(context, currentLoads));
                break;
                
            case 'lowLoad':
                // Suggest load increase for hypertrophy/strength goals
                const targetWeek = identifyLowestLoadWeek(currentLoads);
                if (targetWeek > 0) {
                    const loadProposal = proposeLoadChange(15, 'week', { 
                        week: targetWeek,
                        message: `Increasing load in Week ${targetWeek} to maintain progressive overload`
                    });
                    if (loadProposal.success) proposals.push(loadProposal);
                }
                break;
                
            case 'deloadNeeded':
                // Extensive exhaustion indicators detected
                const deloadWeek = identifyOptimalDeloadWeek(currentLoads, context);
                if (deloadWeek > 0) {
                    const deloadProposal = proposeLoadChange(-40, 'week', { 
                        week: deloadWeek,
                        message: `Strategic deload in Week ${deloadWeek} to enhance recovery and supercompensation`
                    });
                    if (deloadProposal.success) proposals.push(deloadProposal);
                    
                    // Also suggest a rest day insertion
                    const restDayProposal = proposeRestDayInsertion(deloadWeek);
                    if (restDayProposal.success) proposals.push(restDayProposal);
                }
                break;
                
            case 'injuryRisk':
                // When injury risk is detected (perhaps through RPE/difficulty feedback)
                const riskWeek = context.riskWeek || identifyHighestLoadWeek(currentLoads);
                if (riskWeek > 0) {
                    // Significant reduction + technique focus
                    const loadProposal = proposeLoadChange(-25, 'week', { 
                        week: riskWeek,
                        message: `Risk reduction: Reducing load in Week ${riskWeek} while maintaining technical quality`
                    });
                    if (loadProposal.success) proposals.push(loadProposal);
                    
                    // Also suggest accessory work for injury prevention
                    proposals.push({
                        type: 'message',
                        message: 'Consider adding targeted prehab/rehab exercises for affected muscle groups'
                    });
                }
                break;
                
            // Handle other trigger events as needed
            
            default:
                console.warn(`[AdaptiveScheduler] Unknown trigger event: ${triggerEvent}`);
                proposals.push({ 
                    type: 'message', 
                    message: `No specific adjustments available for ${triggerEvent}.` 
                });
        }
        
        // If no specific proposals were generated, provide a general suggestion
        if (proposals.length === 0) {
            proposals.push({ 
                type: 'message', 
                message: 'Consider reviewing your training plan for better load management.' 
            });
        }
        
        return proposals;
    }
    
    /**
     * Proposes adjustments specifically for high ACWR situations
     * @param {Object} context - Analytics context including ACWR value
     * @param {Array} currentLoads - Current load array
     * @returns {Array} Adjustment proposals
     */
    function proposeHighACWRAdjustments(context, currentLoads) {
        const proposals = [];
        const acwr = context.acwr || 0;
        
        // Calculate acute window (latest 7 days)
        const acuteWindow = currentLoads.slice(-7);
        if (acuteWindow.length < 7) {
            return [{ type: 'message', message: 'Insufficient data to analyze acute loads.' }];
        }
        
        // Find the highest load day in the acute window
        const highestLoad = Math.max(...acuteWindow);
        const highestLoadIndex = acuteWindow.indexOf(highestLoad);
        
        // Map to week/day
        const daysPerWeek = 7;
        const absoluteIndex = currentLoads.length - 7 + highestLoadIndex;
        const targetWeek = Math.floor(absoluteIndex / daysPerWeek) + 1;
        const targetDay = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][absoluteIndex % daysPerWeek];
        
        // Calculate the reduction needed to bring ACWR to safer levels
        // Simple heuristic: Aim to bring ACWR to 1.3 (still developmental but safer)
        const currentAcuteAvg = acuteWindow.reduce((sum, load) => sum + load, 0) / 7;
        const safeAcuteAvg = context.chronic * 1.3; // Target ACWR of 1.3
        const reductionNeeded = Math.max(0, Math.round(((currentAcuteAvg - safeAcuteAvg) / currentAcuteAvg) * 100));
        
        // Only propose reduction if significant
        if (reductionNeeded >= 10) {
            // Propose reduction for the highest load day
            const specificDayReduction = proposeLoadChange(-reductionNeeded, 'day', {
                week: targetWeek,
                day: targetDay,
                message: `Reduce load on ${targetDay}, Week ${targetWeek} by ${reductionNeeded}% to lower ACWR from ${acwr.toFixed(2)} to a safer level`
            });
            
            if (specificDayReduction.success) {
                proposals.push(specificDayReduction);
            }
        } else {
            // If the highest day isn't disproportionately high, reduce the week
            const mostRecentWeekIndex = Math.floor((currentLoads.length - 1) / daysPerWeek);
            const weekReduction = proposeLoadChange(-15, 'week', {
                week: mostRecentWeekIndex + 1,
                message: `Reduce overall load in Week ${mostRecentWeekIndex + 1} by 15% to lower ACWR from ${acwr.toFixed(2)}`
            });
            
            if (weekReduction.success) {
                proposals.push(weekReduction);
            }
        }
        
        // Always offer a rest day insertion option as well
        const restProposal = proposeRestDayInsertion(targetWeek);
        if (restProposal.success) {
            proposals.push(restProposal);
        }
        
        return proposals;
    }
    
    /**
     * Proposes adjustments specifically for low ACWR situations (undertraining)
     * @param {Object} context - Analytics context including ACWR value
     * @param {Array} currentLoads - Current load array
     * @returns {Array} Adjustment proposals
     */
    function proposeLowACWRAdjustments(context, currentLoads) {
        const proposals = [];
        const acwr = context.acwr || 0;
        
        // Calculate acute window (latest 7 days)
        const acuteWindow = currentLoads.slice(-7);
        if (acuteWindow.length < 7) {
            return [{ type: 'message', message: 'Insufficient data to analyze acute loads.' }];
        }
        
        // Find the lowest load days that aren't zero (rest days)
        const nonZeroLoads = acuteWindow.filter(load => load > 0);
        if (nonZeroLoads.length === 0) {
            // All zeros - suggest adding training days
            const daysPerWeek = 7;
            const absoluteIndex = currentLoads.length - 7;
            const targetWeek = Math.floor(absoluteIndex / daysPerWeek) + 1;
            
            proposals.push({
                type: 'message',
                message: `ACWR is very low (${acwr.toFixed(2)}). Consider adding training sessions to Week ${targetWeek}.`
            });
            return proposals;
        }
        
        const lowestLoad = Math.min(...nonZeroLoads);
        const lowestLoadIndex = acuteWindow.indexOf(lowestLoad);
        
        // Map to week/day
        const daysPerWeek = 7;
        const absoluteIndex = currentLoads.length - 7 + lowestLoadIndex;
        const targetWeek = Math.floor(absoluteIndex / daysPerWeek) + 1;
        const targetDay = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][absoluteIndex % daysPerWeek];
        
        // Calculate the increase needed to bring ACWR to more optimal levels
        // Simple heuristic: Aim to bring ACWR to 1.0 (balanced training)
        const currentAcuteAvg = acuteWindow.reduce((sum, load) => sum + load, 0) / 7;
        const optimalAcuteAvg = context.chronic; // Target ACWR of 1.0
        const increaseNeeded = Math.max(0, Math.round(((optimalAcuteAvg - currentAcuteAvg) / currentAcuteAvg) * 100));
        
        // Only propose increase if significant
        if (increaseNeeded >= 10) {
            // Propose increase for the lowest load training day
            const specificDayIncrease = proposeLoadChange(increaseNeeded, 'day', {
                week: targetWeek,
                day: targetDay,
                message: `Increase load on ${targetDay}, Week ${targetWeek} by ${increaseNeeded}% to raise ACWR from ${acwr.toFixed(2)} to a more optimal level`
            });
            
            if (specificDayIncrease.success) {
                proposals.push(specificDayIncrease);
            }
            
            // Also suggest overall week increase
            const weekIncrease = proposeLoadChange(Math.min(increaseNeeded, 20), 'week', {
                week: targetWeek,
                message: `Increase overall load in Week ${targetWeek} to optimize training stimulus and ACWR`
            });
            
            if (weekIncrease.success) {
                proposals.push(weekIncrease);
            }
        } else {
            // If we don't need a major increase, suggest a more general approach
                proposals.push({
                    type: 'message',
                message: `Your ACWR is ${acwr.toFixed(2)}, indicating room for increased training load. Consider adding volume to workouts.`
            });
        }
        
        return proposals;
    }
    
    /**
     * Proposes adjustments specifically for high monotony situations
     * @param {Object} context - Analytics context including monotony value
     * @param {Array} currentLoads - Current load array
     * @returns {Array} Adjustment proposals
     */
    function proposeHighMonotonyAdjustments(context, currentLoads) {
        const proposals = [];
        const monotony = context.monotony || 0;
        
        // Calculate week window (latest 7 days)
        const weekWindow = currentLoads.slice(-7);
        if (weekWindow.length < 7) {
            return [{ type: 'message', message: 'Insufficient data to analyze weekly loads.' }];
        }
        
        // Analyze the pattern - are loads too similar?
        const avgLoad = weekWindow.reduce((sum, load) => sum + load, 0) / 7;
        const deviation = Math.sqrt(weekWindow.reduce((sum, load) => sum + Math.pow(load - avgLoad, 2), 0) / 7);
        
        // Calculate coefficient of variation (normal is ~30-40% for training)
        const cv = (deviation / avgLoad) * 100;
        
        // Find highest and lowest load days
        const highestLoad = Math.max(...weekWindow);
        const lowestNonZeroLoad = Math.min(...weekWindow.filter(load => load > 0)) || 0;
        
        const highestLoadIndex = weekWindow.indexOf(highestLoad);
        const lowestLoadIndex = weekWindow.indexOf(lowestNonZeroLoad);
        
        // Map to week/day
        const daysPerWeek = 7;
        const absHighIndex = currentLoads.length - 7 + highestLoadIndex;
        const absLowIndex = currentLoads.length - 7 + lowestLoadIndex;
        
        const highWeek = Math.floor(absHighIndex / daysPerWeek) + 1;
        const highDay = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][absHighIndex % daysPerWeek];
        
        const lowWeek = Math.floor(absLowIndex / daysPerWeek) + 1;
        const lowDay = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][absLowIndex % daysPerWeek];
        
        // If CV is very low, loads are too similar
        if (cv < 30) {
            // Create more variation by adjusting highest and lowest days
            const highDayReduction = proposeLoadChange(-20, 'day', {
                week: highWeek,
                day: highDay,
                message: `Reduce load on ${highDay}, Week ${highWeek} by 20% to increase training variability and lower monotony from ${monotony.toFixed(2)}`
            });
            
            if (highDayReduction.success) {
                proposals.push(highDayReduction);
            }
            
            const lowDayIncrease = proposeLoadChange(25, 'day', {
                week: lowWeek,
                day: lowDay,
                message: `Increase load on ${lowDay}, Week ${lowWeek} by 25% to create more daily variation and reduce monotony`
            });
            
            if (lowDayIncrease.success && lowDay !== highDay) { // Avoid conflicting proposals
                proposals.push(lowDayIncrease);
            }
            
            // Also suggest rest day if appropriate
            const restProposal = proposeRestDayInsertion(highWeek); // Target the week with the highest load
            if (restProposal.success) {
                proposals.push(restProposal);
            }
        } else {
            // If the issue isn't load similarity, suggest redistributing load
            proposals.push({
                type: 'message',
                message: `Training monotony is high (${monotony.toFixed(2)}). Consider alternating heavy and light training days to create better undulation.`
            });
        }
        
        return proposals;
    }
    
    /**
     * Proposes adjustments specifically for high strain situations
     * @param {Object} context - Analytics context including strain value
     * @param {Array} currentLoads - Current load array
     * @returns {Array} Adjustment proposals
     */
    function proposeHighStrainAdjustments(context, currentLoads) {
        const proposals = [];
        const strain = context.strain || 0;
        
        // For high strain, we mainly want overall training load reduction
        // Find most recent completed week
        const daysPerWeek = 7;
        const recentWeekIndex = Math.floor((currentLoads.length - 1) / daysPerWeek);
        const targetWeek = recentWeekIndex + 1;
        
        // Significant overall reduction
        const weekReduction = proposeLoadChange(-30, 'week', {
                                week: targetWeek,
            message: `Reduce overall load in Week ${targetWeek} by 30% to lower training strain from ${Math.round(strain)} and prevent overtraining`
        });
        
        if (weekReduction.success) {
            proposals.push(weekReduction);
        }
        
        // Rest day suggestion is critical for high strain
        const restProposal = proposeRestDayInsertion(targetWeek);
        if (restProposal.success) {
            proposals.push(restProposal);
        }
        
        // Additional recovery suggestions
        proposals.push({
            type: 'message',
            message: 'High training strain detected. Consider enhancing recovery with dedicated recovery sessions, better sleep hygiene, and nutrition support.'
        });
        
        return proposals;
    }
    
    /**
     * Identifies the week with the lowest training load
     * @param {Array} loads - Array of daily loads
     * @returns {number} Week number (1-based)
     */
    function identifyLowestLoadWeek(loads) {
        if (!loads || loads.length === 0) return 0;
        
        const daysPerWeek = 7;
        const weekCount = Math.ceil(loads.length / daysPerWeek);
        
        // Calculate total load for each week
        const weeklyLoads = [];
        for (let week = 0; week < weekCount; week++) {
            const startIdx = week * daysPerWeek;
            const endIdx = Math.min(startIdx + daysPerWeek, loads.length);
            const weekLoads = loads.slice(startIdx, endIdx);
            const totalLoad = weekLoads.reduce((sum, load) => sum + (load || 0), 0);
            weeklyLoads.push({ week: week + 1, load: totalLoad });
        }
        
        // Filter out weeks with zero load (incomplete data)
        const validWeeks = weeklyLoads.filter(w => w.load > 0);
        if (validWeeks.length === 0) return 0;
        
        // Find the lowest load week
        validWeeks.sort((a, b) => a.load - b.load);
        return validWeeks[0].week;
    }
    
    /**
     * Identifies the week with the highest training load
     * @param {Array} loads - Array of daily loads
     * @returns {number} Week number (1-based)
     */
    function identifyHighestLoadWeek(loads) {
        if (!loads || loads.length === 0) return 0;
        
        const daysPerWeek = 7;
        const weekCount = Math.ceil(loads.length / daysPerWeek);
        
        // Calculate total load for each week
        const weeklyLoads = [];
        for (let week = 0; week < weekCount; week++) {
            const startIdx = week * daysPerWeek;
            const endIdx = Math.min(startIdx + daysPerWeek, loads.length);
            const weekLoads = loads.slice(startIdx, endIdx);
            const totalLoad = weekLoads.reduce((sum, load) => sum + (load || 0), 0);
            weeklyLoads.push({ week: week + 1, load: totalLoad });
        }
        
        // Find the highest load week
        weeklyLoads.sort((a, b) => b.load - a.load);
        return weeklyLoads[0].week;
    }
    
    /**
     * Identifies the optimal week for a deload based on loading patterns
     * @param {Array} loads - Array of daily loads
     * @param {Object} context - Additional context
     * @returns {number} Week number (1-based)
     */
    function identifyOptimalDeloadWeek(loads, context) {
        // First check if there's a specific week suggested in context
        if (context.suggestedDeloadWeek) {
            return context.suggestedDeloadWeek;
        }
        
        // Default to the week after the current highest load week
        const highestWeek = identifyHighestLoadWeek(loads);
        return Math.min(highestWeek + 1, Math.ceil(loads.length / 7));
    }

    /**
     * Suggests potential progressions for a given exercise based on its current details and performance history.
     * Enhanced to provide more specific, personalized progression recommendations based on training history.
     * @param {string} exerciseId - The ID of the exercise.
     * @param {object} currentDetails - Object containing current set/rep/load details.
     * @param {number} currentDetails.sets - Current number of sets
     * @param {string|number} currentDetails.reps - Current rep scheme (may be a range like "8-12")
     * @param {string} currentDetails.loadType - Type of loading (e.g., 'rpe', 'percent', 'weight')
     * @param {string|number} currentDetails.loadValue - Current load value
     * @param {object} currentDetails.performance - Optional performance tracking data
     * @returns {Array<string>} - Array of progression suggestions with detailed explanations.
     */
    function proposeExerciseProgression(exerciseId, currentDetails = {}) {
        console.log(`[AdaptiveScheduler] Proposing progression for ${exerciseId}`, currentDetails);
        
        // Array to hold progression suggestion strings
        const suggestions = [];
        
        // Retrieve the exercise from the library
        const exercise = dependencies.exerciseLibrary.find(ex => ex.id === exerciseId);
        if (!exercise) {
            console.warn('[AdaptiveScheduler] Exercise not found for progression proposal.');
            return ["Cannot find exercise in library. Please verify the exercise exists."];
        }
        
        // Parse current exercise parameters
        const sets = parseInt(currentDetails.sets, 10) || 0;
        
        // Parse reps (handle ranges like "8-12")
        let minReps = 0;
        let maxReps = 0;
        if (typeof currentDetails.reps === 'string' && currentDetails.reps.includes('-')) {
            const [min, max] = currentDetails.reps.split('-').map(r => parseInt(r.trim(), 10));
            minReps = min || 0;
            maxReps = max || 0;
        } else {
            minReps = parseInt(currentDetails.reps, 10) || 0;
            maxReps = minReps;
        }
        
        const loadType = currentDetails.loadType || '';
        const loadValue = parseFloat(currentDetails.loadValue) || 0;
        
        // Get performance history from storage
        let performanceHistory = {};
        try {
            const historyStr = localStorage.getItem('setforgePerformanceHistory');
            if (historyStr) {
                const allHistory = JSON.parse(historyStr);
                performanceHistory = allHistory[exerciseId] || {};
            }
        } catch (error) {
            console.error('[AdaptiveScheduler] Error reading performance history:', error);
        }
        
        // Get last session performance from current details or history
        const lastPerformance = currentDetails.performance || performanceHistory.lastSession || {};
        const completedReps = lastPerformance.completedReps || maxReps; // Assume completed if no data
        const perceivedExertion = lastPerformance.perceivedExertion || 0;
        
        // Get user's goal if available (from currentDetails)
        const goal = currentDetails.goal?.toLowerCase() || '';
        
        // Attempt to determine training goal from current parameters if not explicitly provided
        let trainingGoal = goal;
        if (!trainingGoal) {
            if (maxReps <= 5) {
                trainingGoal = 'strength';
            } else if (maxReps <= 12) {
                trainingGoal = 'hypertrophy';
            } else {
                trainingGoal = 'endurance';
            }
        }
        
        // Determine if exercise is compound or isolation
        const isCompound = ['Squat', 'Bench', 'Deadlift', 'Press', 'Pull', 'Clean', 'Snatch', 'Jerk'].some(
            category => exercise.category?.includes(category) || exercise.name?.includes(category)
        );
        
        // --- PROGRESSION ASSESSMENT LOGIC ---
        
        // Assess readiness for progression based on performance data
        let readyForIntensityIncrease = false;
        let readyForVolumeIncrease = false;
        
        // RPE-based progression logic
        if (loadType === 'rpe') {
            // If RPE is below target, can increase intensity
            if (perceivedExertion > 0 && perceivedExertion < loadValue - 0.5) {
                readyForIntensityIncrease = true;
                suggestions.push(`Increase weight by 2.5-5% while maintaining RPE ${loadValue}. Your last session's RPE of ${perceivedExertion} indicates room for intensity progression.`);
            } 
            // If completing all reps at target RPE, can increase volume
            else if (completedReps >= maxReps && perceivedExertion <= loadValue) {
                readyForVolumeIncrease = true;
                if (sets < 5) {
                    suggestions.push(`Add 1 set (from ${sets} to ${sets+1}) while maintaining current weight and RPE ${loadValue}.`);
                } else {
                    suggestions.push(`Increase rep target by 1-2 reps per set while maintaining current weight and RPE ${loadValue}.`);
                }
            }
            // If RPE is higher than target but still completing reps
            else if (perceivedExertion > loadValue && completedReps >= minReps) {
                suggestions.push(`Maintain current weight for another 1-2 sessions to allow adaptation. Focus on technique quality and controlled eccentrics.`);
            }
            // If struggling with current parameters
            else if (completedReps < minReps) {
                suggestions.push(`Reduce weight by 5-7.5% to achieve target reps with proper form. Rebuild with smaller increments.`);
            }
        } 
        // Percentage-based progression logic
        else if (loadType === 'percent') {
            // For percentage-based training, suggest increments based on training phase
            if (completedReps >= maxReps) {
                readyForIntensityIncrease = true;
                const incrementValue = isCompound ? 2.5 : 5;
                suggestions.push(`Increase percentage from ${loadValue}% to ${loadValue + incrementValue}% while maintaining ${currentDetails.reps} reps.`);
            } 
            else if (completedReps >= minReps) {
                suggestions.push(`Maintain current percentage (${loadValue}%) for another session while aiming to increase reps from ${completedReps} to ${maxReps}.`);
            }
            else {
                suggestions.push(`Reduce percentage to ${loadValue - 5}% to allow proper execution of the prescribed ${currentDetails.reps} reps.`);
            }
        }
        // Weight-based progression (most common)
        else {
            // For weight-based training, propose weight increases based on exercise type and current load
            if (completedReps >= maxReps) {
                readyForIntensityIncrease = true;
                
                // Calculate appropriate weight increment based on current load and exercise type
                let incrementKg;
                if (loadValue < 20) {
                    incrementKg = 1;
                } else if (loadValue < 60) {
                    incrementKg = isCompound ? 2.5 : 1.25;
                } else if (loadValue < 100) {
                    incrementKg = isCompound ? 5 : 2.5;
                } else {
                    incrementKg = isCompound ? 5 : 2.5;
                }
                
                suggestions.push(`Increase weight from ${loadValue} to ${loadValue + incrementKg}kg while maintaining ${currentDetails.reps} reps.`);
            }
            else if (completedReps >= minReps) {
                // If hitting minimum reps but not maximum, suggest working up to max reps
                suggestions.push(`Maintain current weight (${loadValue}kg) while focusing on increasing reps from ${completedReps} to ${maxReps} with good form.`);
                
                // Technique-focused suggestion
                if (exercise.techniqueCues && exercise.techniqueCues.length > 0) {
                    const randomCue = exercise.techniqueCues[Math.floor(Math.random() * exercise.techniqueCues.length)];
                    suggestions.push(`Technique focus: ${randomCue}`);
                }
            }
            else {
                // If struggling with prescribed reps, suggest weight reduction
                suggestions.push(`Reduce weight by 5-10% (to approximately ${Math.round(loadValue * 0.925)}kg) to properly achieve the prescribed rep range.`);
            }
        }
        
        // --- GOAL-SPECIFIC PROGRESSION SUGGESTIONS ---
        
        // Add goal-specific suggestions based on identified training goal
        if (trainingGoal === 'strength' && readyForIntensityIncrease) {
            suggestions.push(`For strength development, consider adding short rest-pause sets after your main working sets (10-20 sec rest, then 2-3 more reps).`);
            
            if (isCompound && sets >= 3) {
                suggestions.push(`Try adding a back-off set at 90% of your working weight for 1-2 more reps than your working sets.`);
            }
        }
        else if (trainingGoal === 'hypertrophy' && readyForVolumeIncrease) {
            suggestions.push(`For hypertrophy, consider implementing a double progression model: once you reach ${maxReps} reps for all sets, increase weight by 2.5-5% and start at ${minReps} reps again.`);
            
            if (sets < 4) {
                suggestions.push(`Add a drop set to your last set: after completion, reduce weight by 20% and perform as many reps as possible.`);
            }
        }
        else if (trainingGoal === 'endurance') {
            suggestions.push(`For endurance improvement, consider implementing density training: complete the same volume in less total time by gradually reducing rest periods.`);
        }
        
        // --- EXERCISE-SPECIFIC SUGGESTIONS ---
        
        // Special progression suggestions for specific exercise types
        if (exercise.category === 'Squat' || exercise.name.includes('Squat')) {
            suggestions.push(`Squat progression: Consider adding pause squats (2-3 sec at bottom) on your second working set to improve position strength and control.`);
        }
        else if (exercise.category === 'Bench' || exercise.name.includes('Bench Press')) {
            suggestions.push(`Bench press progression: Consider adding a variation with different grip width or adding a 1-second pause at the bottom position.`);
        }
        else if (exercise.category === 'Deadlift' || exercise.name.includes('Deadlift')) {
            suggestions.push(`Deadlift progression: Consider adding deficit deadlifts (standing on 1-2 inch platform) every other week to improve starting strength.`);
        }
        
        // --- ADVANCED PROGRESSION METHODS ---
        
        // If the trainee is advanced (high load values), suggest more sophisticated methods
        if ((loadType === 'weight' && isCompound && loadValue > 100) || 
            (loadType === 'percent' && loadValue > 80) || 
            (loadType === 'rpe' && loadValue > 8)) {
            
            // Randomly select one advanced method to suggest (to avoid overwhelming)
            const advancedMethods = [
                `Consider implementing wave loading: perform the exercise with ascending loads across 3 weeks (e.g., 80%, 85%, 90% of 1RM), then reduce and repeat.`,
                `Try incorporating cluster sets: break your working sets into smaller clusters with 15-30 seconds rest between mini-sets for improved quality.`,
                `Implement a contrast method: follow your heaviest set with an explosive variation using 50-60% of that weight for power development.`
            ];
            
            suggestions.push(advancedMethods[Math.floor(Math.random() * advancedMethods.length)]);
        }
        
        // Ensure we return at least one suggestion
        if (suggestions.length === 0) {
            suggestions.push(`Continue with current parameters (${sets} sets of ${currentDetails.reps}) and focus on quality execution. Record RPE to help guide future progression.`);
        }
        
        return suggestions;
    }

    /**
     * Generates a week of workouts based on the specified model and configuration
     * @param {Object} config - Configuration object for the week generation
     * @param {number} config.weekNumber - The week number to generate (1-based)
     * @param {string} config.model - The model to use (e.g., 'linear', 'wave', 'undulating')
     * @param {string} config.goal - Training goal (e.g., 'strength', 'hypertrophy', 'endurance')
     * @param {number} config.sessionsPerWeek - Number of sessions per week (default: 3)
     * @param {Array<string>} config.targetDays - Specific days to target (e.g., ['mon', 'wed', 'fri'])
     * @param {Object} config.equipment - Available equipment constraints
     * @param {Object} config.parameters - Model-specific parameters
     * @returns {Object} Generated week data with exercises, sets, reps for each day
     */
    function generateWeek(config) {
        console.log('[AdaptiveScheduler] Generating week using model:', config);
        
        // Default configuration
        const weekNumber = config.weekNumber || 1;
        const modelType = config.model?.toLowerCase() || 'linear';
        const goal = config.goal?.toLowerCase() || 'strength';
        const sessionsPerWeek = config.sessionsPerWeek || 3;
        const targetDays = config.targetDays || [];
        const equipment = config.equipment || { hasBarbell: true, hasDumbbells: true, hasCables: true };
        const parameters = config.parameters || {};
        
        // Validate exercise library
        if (!dependencies.exerciseLibrary || dependencies.exerciseLibrary.length === 0) {
            console.error('[AdaptiveScheduler] Exercise library not available for week generation.');
            return { 
                success: false, 
                message: 'Exercise library not available',
                days: {}
            };
        }
        
        // Initialize return object
        const weekData = {
            success: true,
            weekNumber: weekNumber,
            model: modelType,
            goal: goal,
            days: {}
        };
        
        // Determine days of the week to generate workouts for
        let workoutDays = ['mon', 'wed', 'fri']; // Default 3-day split
        if (targetDays.length > 0) {
            workoutDays = targetDays;
        } else if (sessionsPerWeek === 2) {
            workoutDays = ['mon', 'thu'];
        } else if (sessionsPerWeek === 4) {
            workoutDays = ['mon', 'tue', 'thu', 'fri'];
        } else if (sessionsPerWeek === 5) {
            workoutDays = ['mon', 'tue', 'wed', 'thu', 'fri'];
        } else if (sessionsPerWeek === 6) {
            workoutDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        }
        
        // Determine training split based on goal and sessions per week
        let trainingSplit;
        if (sessionsPerWeek <= 3) {
            if (goal === 'strength') {
                trainingSplit = [
                    { focus: 'Full Body', emphasis: 'Lower Body' },
                    { focus: 'Full Body', emphasis: 'Upper Body' },
                    { focus: 'Full Body', emphasis: 'Mixed' }
                ].slice(0, sessionsPerWeek);
            } else if (goal === 'hypertrophy') {
                trainingSplit = [
                    { focus: 'Push', emphasis: 'Chest/Shoulders/Triceps' },
                    { focus: 'Pull', emphasis: 'Back/Biceps' },
                    { focus: 'Legs', emphasis: 'Quads/Hamstrings/Glutes' }
                ].slice(0, sessionsPerWeek);
            } else {
                trainingSplit = [
                    { focus: 'Full Body', emphasis: 'Power' },
                    { focus: 'Full Body', emphasis: 'Endurance' },
                    { focus: 'Full Body', emphasis: 'Mobility' }
                ].slice(0, sessionsPerWeek);
            }
        } else if (sessionsPerWeek === 4) {
            trainingSplit = [
                { focus: 'Upper Body', emphasis: 'Strength' },
                { focus: 'Lower Body', emphasis: 'Strength' },
                { focus: 'Upper Body', emphasis: 'Hypertrophy' },
                { focus: 'Lower Body', emphasis: 'Hypertrophy' }
            ];
        } else {
            // 5-6 day body part split
            trainingSplit = [
                { focus: 'Chest', emphasis: 'Primary' },
                { focus: 'Back', emphasis: 'Primary' },
                { focus: 'Legs', emphasis: 'Primary' },
                { focus: 'Shoulders', emphasis: 'Primary' },
                { focus: 'Arms', emphasis: 'Primary' },
                { focus: 'Core/Conditioning', emphasis: 'Primary' }
            ].slice(0, sessionsPerWeek);
        }
        
        // Calculate model-specific parameters for this week
        const modelParams = calculateModelParameters(modelType, weekNumber, goal, parameters);
        
        // Generate each day's workout
        workoutDays.forEach((day, index) => {
            // Get the training focus for this day
            const dayFocus = trainingSplit[index % trainingSplit.length];
            
            // Select exercises for this day based on the focus
            const exercises = selectExercisesForDay(dayFocus, goal, equipment, modelParams);
            
            // Calculate sets/reps/intensity based on the model for each exercise
            const workoutExercises = exercises.map(exercise => {
                const { sets, reps, intensity } = calculateExerciseParameters(
                    exercise, 
                    modelType, 
                    goal, 
                    weekNumber, 
                    dayFocus, 
                    modelParams
                );
                
                return {
                    id: exercise.id,
                    name: exercise.name,
                    sets: sets,
                    reps: reps,
                    loadType: intensity.type,
                    loadValue: intensity.value,
                    category: exercise.category,
                    primaryMuscles: exercise.primaryMuscles,
                    notes: generateExerciseNotes(exercise, dayFocus, goal)
                };
            });
            
            // Add to weekData
            weekData.days[day] = {
                focus: dayFocus.focus,
                emphasis: dayFocus.emphasis,
                exercises: workoutExercises
            };
        });
        
        return weekData;
    }
    
    /**
     * Calculates model-specific parameters for the given week
     * @param {string} modelType - The model type (linear, wave, etc.)
     * @param {number} weekNumber - The week number
     * @param {string} goal - Training goal
     * @param {Object} baseParams - Base parameters provided by the user
     * @returns {Object} Calculated model parameters
     */
    function calculateModelParameters(modelType, weekNumber, goal, baseParams = {}) {
        const params = { ...baseParams };
        
        // Default base parameters if not provided
        if (!params.baseIntensity) {
            // Set default base intensity based on goal
            if (goal === 'strength') {
                params.baseIntensity = 80; // Higher intensity for strength
            } else if (goal === 'hypertrophy') {
                params.baseIntensity = 70; // Moderate intensity for hypertrophy
            } else {
                params.baseIntensity = 60; // Lower intensity for endurance
            }
        }
        
        if (!params.baseVolume) {
            // Set default base volume (expressed as sets) based on goal
            if (goal === 'strength') {
                params.baseVolume = 3; // Lower volume for strength
            } else if (goal === 'hypertrophy') {
                params.baseVolume = 4; // Higher volume for hypertrophy
            } else {
                params.baseVolume = 3; // Moderate volume for endurance
            }
        }
        
        // Calculate model-specific parameters
        if (modelType === 'linear') {
            // Linear progression model
            params.currentIntensity = params.baseIntensity + ((weekNumber - 1) * 2.5);
            params.currentVolume = params.baseVolume;
            
            // Volume might decrease slightly as intensity increases
            if (weekNumber > 3) {
                params.currentVolume = Math.max(2, params.baseVolume - 1);
            }
        } else if (modelType === 'wave') {
            // Wave loading model (3-week waves)
            const wavePosition = (weekNumber - 1) % 3;
            
            if (wavePosition === 0) { // First week of wave
                params.currentIntensity = params.baseIntensity;
                params.currentVolume = params.baseVolume + 1;
            } else if (wavePosition === 1) { // Second week of wave
                params.currentIntensity = params.baseIntensity + 5;
                params.currentVolume = params.baseVolume;
            } else { // Third week of wave
                params.currentIntensity = params.baseIntensity + 10;
                params.currentVolume = Math.max(2, params.baseVolume - 1);
            }
        } else if (modelType === 'undulating') {
            // Daily undulating model
            params.currentIntensity = params.baseIntensity;
            params.currentVolume = params.baseVolume;
            // The daily variations will be handled in calculateExerciseParameters
        } else {
            // Default model (basic)
            params.currentIntensity = params.baseIntensity;
            params.currentVolume = params.baseVolume;
        }
        
        // Cap intensity at reasonable values
        params.currentIntensity = Math.min(95, Math.max(50, params.currentIntensity));
        
        return params;
    }
    
    /**
     * Selects appropriate exercises for a day based on the focus
     * @param {Object} dayFocus - The focus for this day
     * @param {string} goal - Training goal
     * @param {Object} equipment - Available equipment
     * @param {Object} modelParams - Model parameters
     * @returns {Array} Selected exercises
     */
    function selectExercisesForDay(dayFocus, goal, equipment, modelParams) {
        // Filter exercise library based on day focus and equipment
        let eligibleExercises = dependencies.exerciseLibrary.filter(exercise => {
            // Check if exercise matches the day focus
            let matchesFocus = false;
            
            if (dayFocus.focus === 'Full Body') {
                matchesFocus = true; // All exercises eligible for full body
            } else if (dayFocus.focus === 'Upper Body') {
                matchesFocus = ['Chest', 'Back', 'Shoulders', 'Arms'].some(
                    muscle => exercise.primaryMuscles?.includes(muscle)
                );
            } else if (dayFocus.focus === 'Lower Body') {
                matchesFocus = ['Quads', 'Hamstrings', 'Glutes', 'Calves'].some(
                    muscle => exercise.primaryMuscles?.includes(muscle)
                );
            } else if (dayFocus.focus === 'Push') {
                matchesFocus = exercise.category === 'Press' || 
                               exercise.primaryMuscles?.includes('Chest') ||
                               exercise.primaryMuscles?.includes('Shoulders') ||
                               exercise.primaryMuscles?.includes('Triceps');
            } else if (dayFocus.focus === 'Pull') {
                matchesFocus = exercise.category === 'Pull' || 
                               exercise.primaryMuscles?.includes('Back') ||
                               exercise.primaryMuscles?.includes('Biceps') ||
                               exercise.primaryMuscles?.includes('Traps');
            } else if (dayFocus.focus === 'Legs') {
                matchesFocus = exercise.category === 'Squat' ||
                               exercise.category === 'Hinge' ||
                               exercise.primaryMuscles?.includes('Quads') ||
                               exercise.primaryMuscles?.includes('Hamstrings') ||
                               exercise.primaryMuscles?.includes('Glutes') ||
                               exercise.primaryMuscles?.includes('Calves');
            } else {
                // Specific body part focus
                matchesFocus = exercise.primaryMuscles?.includes(dayFocus.focus);
            }
            
            // Check if exercise matches available equipment
            let matchesEquipment = true;
            if (exercise.equipmentNeeded) {
                if (exercise.equipmentNeeded.includes('barbell') && !equipment.hasBarbell) {
                    matchesEquipment = false;
                }
                if (exercise.equipmentNeeded.includes('dumbbell') && !equipment.hasDumbbells) {
                    matchesEquipment = false;
                }
                if (exercise.equipmentNeeded.includes('cable') && !equipment.hasCables) {
                    matchesEquipment = false;
                }
                // Add more equipment checks as needed
            }
            
            return matchesFocus && matchesEquipment;
        });
        
        // Determine number of exercises based on day focus and goal
        let numExercises = 4; // Default
        
        if (dayFocus.focus === 'Full Body') {
            numExercises = goal === 'strength' ? 5 : 6;
        } else if (dayFocus.focus === 'Upper Body' || dayFocus.focus === 'Lower Body') {
            numExercises = goal === 'strength' ? 4 : 5;
        } else if (dayFocus.focus === 'Push' || dayFocus.focus === 'Pull' || dayFocus.focus === 'Legs') {
            numExercises = goal === 'strength' ? 4 : 6;
        } else {
            // Specific body part
            numExercises = goal === 'strength' ? 3 : 5;
        }
        
        // Select exercises based on emphasis and category
        const selectedExercises = [];
        
        // First, select 1-2 main compound exercises that match the emphasis
        const compoundExercises = eligibleExercises.filter(exercise => 
            (exercise.category === 'Squat' || 
             exercise.category === 'Bench' || 
             exercise.category === 'Deadlift' ||
             exercise.category === 'Press' ||
             exercise.category === 'Pull')
        );
        
        // Prioritize exercises that match the emphasis
        const emphasizedCompounds = compoundExercises.filter(exercise => {
            if (dayFocus.emphasis.includes('Lower Body') && 
                (exercise.primaryMuscles?.includes('Quads') || 
                 exercise.primaryMuscles?.includes('Hamstrings') ||
                 exercise.primaryMuscles?.includes('Glutes'))) {
                return true;
            }
            if (dayFocus.emphasis.includes('Upper Body') && 
                (exercise.primaryMuscles?.includes('Chest') || 
                 exercise.primaryMuscles?.includes('Back') ||
                 exercise.primaryMuscles?.includes('Shoulders'))) {
                return true;
            }
            // Add more emphasis matches as needed
            return false;
        });
        
        // Select compounds
        const compoundsToSelect = goal === 'strength' ? 2 : 1;
        const compoundPool = emphasizedCompounds.length > 0 ? emphasizedCompounds : compoundExercises;
        
        // Randomize the pool but ensure variety
        compoundPool.sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < Math.min(compoundsToSelect, compoundPool.length); i++) {
            selectedExercises.push(compoundPool[i]);
        }
        
        // Remove selected exercises from the eligible pool
        const selectedIds = new Set(selectedExercises.map(ex => ex.id));
        eligibleExercises = eligibleExercises.filter(ex => !selectedIds.has(ex.id));
        
        // Next, select accessory exercises to complete the workout
        const remainingSlots = numExercises - selectedExercises.length;
        
        // Group by primary muscle to ensure good distribution
        const exercisesByMuscle = {};
        eligibleExercises.forEach(ex => {
            ex.primaryMuscles?.forEach(muscle => {
                if (!exercisesByMuscle[muscle]) {
                    exercisesByMuscle[muscle] = [];
                }
                exercisesByMuscle[muscle].push(ex);
            });
        });
        
        // Select evenly across muscle groups
        const muscleGroups = Object.keys(exercisesByMuscle);
        const musclesPerSlot = Math.max(1, Math.ceil(muscleGroups.length / remainingSlots));
        
        for (let i = 0; i < remainingSlots; i++) {
            // Get the next set of muscles to choose from
            const startIdx = (i * musclesPerSlot) % muscleGroups.length;
            const targetMuscles = muscleGroups.slice(startIdx, startIdx + musclesPerSlot);
            
            // Collect all exercises for these muscles
            let candidateExercises = [];
            targetMuscles.forEach(muscle => {
                candidateExercises = candidateExercises.concat(exercisesByMuscle[muscle] || []);
            });
            
            // Remove duplicates and already selected exercises
            candidateExercises = candidateExercises.filter(ex => !selectedIds.has(ex.id));
            
            // If we have candidates, select one randomly
            if (candidateExercises.length > 0) {
                candidateExercises.sort(() => Math.random() - 0.5);
                selectedExercises.push(candidateExercises[0]);
                selectedIds.add(candidateExercises[0].id);
            }
        }
        
        // If we still need more exercises, add from remaining eligible pool
        const remainingNeeded = numExercises - selectedExercises.length;
        if (remainingNeeded > 0) {
            const remainingPool = eligibleExercises.filter(ex => !selectedIds.has(ex.id));
            remainingPool.sort(() => Math.random() - 0.5);
            
            for (let i = 0; i < Math.min(remainingNeeded, remainingPool.length); i++) {
                selectedExercises.push(remainingPool[i]);
            }
        }
        
        return selectedExercises;
    }
    
    /**
     * Calculates sets, reps, and intensity for an exercise based on the model
     * @param {Object} exercise - The exercise object
     * @param {string} modelType - The model type
     * @param {string} goal - Training goal
     * @param {number} weekNumber - The week number
     * @param {Object} dayFocus - The day's training focus
     * @param {Object} modelParams - Model parameters 
     * @returns {Object} Parameters for the exercise
     */
    function calculateExerciseParameters(exercise, modelType, goal, weekNumber, dayFocus, modelParams) {
        // Default parameters
        let sets = modelParams.currentVolume;
        let reps = 8; // Default
        let intensity = { type: 'rpe', value: 8 }; // Default
        
        // Adjust based on exercise category
        const isCompound = exercise.category === 'Squat' || 
                          exercise.category === 'Bench' || 
                          exercise.category === 'Deadlift' ||
                          exercise.category === 'Press' ||
                          exercise.category === 'Pull';
        
        // Base parameters on training goal
        if (goal === 'strength') {
            reps = isCompound ? '3-5' : '6-8';
            intensity.value = isCompound ? 8.5 : 8;
        } else if (goal === 'hypertrophy') {
            reps = isCompound ? '6-8' : '8-12';
            intensity.value = isCompound ? 8 : 7.5;
        } else { // endurance or other
            reps = isCompound ? '8-12' : '12-15';
            intensity.value = isCompound ? 7 : 6.5;
        }
        
        // Apply model-specific adjustments
        if (modelType === 'linear') {
            // Linear progression model
            intensity.value += (weekNumber - 1) * 0.5; // Increase by 0.5 RPE per week
            
            // For later weeks, adjust volume
            if (weekNumber > 3) {
                sets = Math.max(2, sets - 1); // Reduce sets in later weeks
            }
        } else if (modelType === 'wave') {
            // Wave loading model (3-week waves)
            const wavePosition = (weekNumber - 1) % 3;
            
            if (wavePosition === 0) { // First week of wave
                // Higher volume, lower intensity
                sets += 1;
                intensity.value -= 0.5;
            } else if (wavePosition === 1) { // Second week of wave
                // Moderate volume/intensity
            } else { // Third week of wave
                // Lower volume, higher intensity
                sets = Math.max(2, sets - 1);
                intensity.value += 1;
                
                // Adjust reps down for highest intensity week
                if (typeof reps === 'string' && reps.includes('-')) {
                    const [min, max] = reps.split('-').map(r => parseInt(r.trim(), 10));
                    reps = `${min}-${min + 2}`;
                } else {
                    reps = Math.max(1, parseInt(reps, 10) - 2);
                }
            }
        } else if (modelType === 'undulating') {
            // Daily undulating model - adjust based on day focus
            if (dayFocus.emphasis.includes('Strength')) {
                // Strength day: lower reps, higher intensity
                if (typeof reps === 'string' && reps.includes('-')) {
                    const [min, max] = reps.split('-').map(r => parseInt(r.trim(), 10));
                    reps = `${Math.max(1, min - 2)}-${Math.max(3, max - 2)}`;
                } else {
                    reps = Math.max(1, parseInt(reps, 10) - 2);
                }
                intensity.value += 1;
            } else if (dayFocus.emphasis.includes('Hypertrophy')) {
                // Hypertrophy day: moderate reps, moderate intensity
                // Use the defaults
            } else if (dayFocus.emphasis.includes('Endurance') || dayFocus.emphasis.includes('Mobility')) {
                // Endurance day: higher reps, lower intensity
                if (typeof reps === 'string' && reps.includes('-')) {
                    const [min, max] = reps.split('-').map(r => parseInt(r.trim(), 10));
                    reps = `${min + 2}-${max + 2}`;
                } else {
                    reps = parseInt(reps, 10) + 2;
                }
                intensity.value -= 1;
            }
        }
        
        // Cap intensity at reasonable values
        intensity.value = Math.min(10, Math.max(5, intensity.value));
        
        // For non-RPE loading, convert to appropriate type
        if (exercise.suggestedLoadType === 'percent') {
            // Convert RPE to percentage based on rough conversion
            const percentValue = 50 + (intensity.value * 5);
            intensity = { type: 'percent', value: Math.min(95, percentValue) };
        } else if (exercise.suggestedLoadType === 'weight') {
            // For weight-based loading, we'd need a 1RM or previous values
            // Use RPE as a fallback if no better information is available
            intensity = { type: 'rpe', value: intensity.value };
        }
        
        return { sets, reps, intensity };
    }
    
    /**
     * Generates informative notes for an exercise based on the focus and goal
     * @param {Object} exercise - The exercise object
     * @param {Object} dayFocus - The day's training focus
     * @param {string} goal - Training goal
     * @returns {string} Exercise notes
     */
    function generateExerciseNotes(exercise, dayFocus, goal) {
        const notes = [];
        
        // Add technique tips if available
        if (exercise.techniqueCues && exercise.techniqueCues.length > 0) {
            const randomCue = exercise.techniqueCues[Math.floor(Math.random() * exercise.techniqueCues.length)];
            notes.push(`Technique: ${randomCue}`);
        }
        
        // Add goal-specific notes
        if (goal === 'strength') {
            notes.push('Focus on strength: Rest 2-3 min between sets.');
        } else if (goal === 'hypertrophy') {
            notes.push('Focus on muscle tension: Control the eccentric.');
        } else {
            notes.push('Focus on endurance: Keep rest periods shorter.');
        }
        
        return notes.join(' ');
    }

    // --- Add proposeLoadChange utility ---
    /**
     * Propose a load change for a given week or day.
     * @param {number} percentageChange - The percent change in load (positive or negative)
     * @param {string} scope - 'week' or 'day'
     * @param {object} params - { week, day, message }
     * @returns {object} Proposal object
     */
    function proposeLoadChange(percentageChange, scope, params = {}) {
        const { week, day, message } = params;
        const type = percentageChange < 0
            ? (scope === 'day' ? 'reduceSpecificDay' : 'reduceLoad')
            : (scope === 'day' ? 'increaseLowDay' : 'increaseLoad');
        const description = message || `${percentageChange > 0 ? 'Increase' : 'Reduce'} load by ${Math.abs(percentageChange)}% for ${scope === 'day' ? `${day}, ` : ''}Week ${week}`;
        // Dummy impact and changes for now; real logic would simulate the effect
        const changes = [{ change: percentageChange }];
        const impact = { predictedACWR: 1.1, predictedMonotony: 1.5 };
        return {
            type,
            description,
            targetWeek: week,
            targetDay: day,
            percentageChange: percentageChange,
            changes,
            impact,
            success: true
        };
    }

    // Public API
    return {
        init,
        calculateImpact,
        suggestSwap,
        proposeAdjustments,
        proposeLoadChange,
        proposeRestDayInsertion,
        proposePhaseOptimizations,
        proposeExerciseProgression,
        adjustLoadBasedOnFeedback,
        suggestExerciseRotation,
        detectDeloadNeed,
        suggestAccessories,
        generateWeek // Added in Phase 4: Expose the week generation functionality
    };

})();

export default AdaptiveScheduler;