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
     * Proposes adjustments based on analytics triggers.
     * @param {string} triggerEvent - The event triggering the proposal (e.g., 'highACWR', 'highMonotony').
     * @param {object} context - Additional context data.
     * @returns {Array<object>} - Array of adjustment proposals.
     */
    function proposeAdjustments(triggerEvent, context = {}) {
        console.log(`[AdaptiveScheduler] Proposing adjustments for ${triggerEvent}`);
        let proposals = [];
        
        const currentLoads = dependencies.getCurrentBlockLoads ? dependencies.getCurrentBlockLoads() : null;
        if (!currentLoads || currentLoads.length === 0) {
            console.warn('[AdaptiveScheduler] No loads available for proposals');
            return [{ type: 'message', message: 'Add some sessions to receive adjustment proposals.' }];
        }
        
        // Determine the weeks in the plan
        const daysPerWeek = 7;
        const numWeeks = Math.ceil(currentLoads.length / daysPerWeek);
        
        // Get current week (or target week if specified in context)
        const targetWeek = context.week || Math.ceil(currentLoads.length / daysPerWeek);
        
        switch (triggerEvent) {
            case 'highACWR': {
                // Proposal 1: Reduce load for the target week
                const reductionProposal = proposeLoadChange(15, 'week', { week: targetWeek });
                if (reductionProposal.success) {
                    // Add description for the UI
                    reductionProposal.description = `Reduce load by 15% in Week ${targetWeek} (Est. ACWR: ${reductionProposal.impact?.predictedACWR?.toFixed(2) || 'N/A'})`;
                    reductionProposal.type = 'reduceLoad'; // Ensure type matches what ForgeAssist expects
                    reductionProposal.targetWeek = targetWeek; // Ensure targetWeek is set
                    reductionProposal.percentage = 15; // Ensure percentage is set
                    proposals.push(reductionProposal);
                } else {
                    console.log('[AdaptiveScheduler] Could not generate week load reduction proposal.');
                }
                
                // Proposal 2: Add a rest day in the target week
                const restDayProposal = proposeRestDayInsertion(targetWeek);
                if (restDayProposal.success) {
                     // Add description for the UI
                    const dayCap = restDayProposal.day.charAt(0).toUpperCase() + restDayProposal.day.slice(1);
                    restDayProposal.description = `Insert rest day on ${dayCap}, Week ${targetWeek} (clears ${restDayProposal.currentLoad} load)`;
                    restDayProposal.type = 'addRestDay'; // Ensure type matches
                    restDayProposal.targetWeek = targetWeek; // Ensure targetWeek is set
                    proposals.push(restDayProposal);
                } else {
                     console.log('[AdaptiveScheduler] Could not generate rest day insertion proposal.');
                }
                break;
            }
            case 'highMonotony': {
                const weekStart = (targetWeek - 1) * daysPerWeek;
                const weekLoads = currentLoads.slice(weekStart, weekStart + daysPerWeek);
                const dayNames = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
                
                // Find highest and lowest non-zero load days
                let maxLoadDayIndex = -1;
                let maxLoad = -1;
                let minLoadDayIndex = -1;
                let minLoad = Infinity;

                for(let i=0; i<weekLoads.length; i++) {
                    const load = weekLoads[i];
                    if (load > maxLoad) {
                        maxLoad = load;
                        maxLoadDayIndex = i;
                    }
                    if (load > 0 && load < minLoad) { 
                        minLoad = load;
                        minLoadDayIndex = i;
                    }
                }
                
                // Proposal 1: Swap highest and lowest load days (if different and valid)
                if (maxLoadDayIndex !== -1 && minLoadDayIndex !== -1 && maxLoadDayIndex !== minLoadDayIndex) {
                    const highDayName = dayNames[maxLoadDayIndex];
                    const lowDayName = dayNames[minLoadDayIndex];
                    const highDayCap = highDayName.charAt(0).toUpperCase() + highDayName.slice(1);
                    const lowDayCap = lowDayName.charAt(0).toUpperCase() + lowDayName.slice(1);
                    
                    // Estimate impact (crude: assumes loads are swapped)
                    // A better simulation would get actual card data and swap them
                    const estimatedImpact = calculateImpact([], {}); // Placeholder impact
                    
                    proposals.push({
                        type: 'swapDays', // New proposal type
                        targetWeek: targetWeek,
                        day1: highDayName, // Day with higher load
                        day2: lowDayName,  // Day with lower load
                        reason: 'Improve load variation to reduce monotony',
                        description: `Swap ${highDayCap} (high load) and ${lowDayCap} (low load) in Week ${targetWeek} to improve variation?`,
                        impact: estimatedImpact, // Include estimated impact
                        success: true // Assume possible for now
                    });
                }
                
                // Proposal 2: Reduce load on the heaviest day (keep this option)
                if (maxLoadDayIndex >= 0 && maxLoad > 0) {
                    const targetDay = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][maxLoadDayIndex];
                    const dayReductionProposal = proposeLoadChange(20, 'day', { week: targetWeek, day: targetDay });
                    
                    if (dayReductionProposal.success) {
                         const dayCap = targetDay.charAt(0).toUpperCase() + targetDay.slice(1);
                         dayReductionProposal.description = `Reduce load by 20% on heaviest day (${dayCap}, Wk ${targetWeek}) (Est. Monotony: ${dayReductionProposal.impact?.predictedMonotony?.toFixed(2) || 'N/A'})`;
                         dayReductionProposal.type = 'reduceSpecificDay'; // Ensure type matches
                         dayReductionProposal.targetWeek = targetWeek; // Ensure targetWeek is set
                         dayReductionProposal.targetDay = targetDay; // Ensure targetDay is set
                         dayReductionProposal.percentage = 20; // Ensure percentage is set
                         proposals.push(dayReductionProposal);
                    } else {
                        console.log('[AdaptiveScheduler] Could not generate specific day load reduction proposal.');
                    }
                }

                // Proposal 3: Increase load on the *lowest* non-zero load day (keep this option)
                if (minLoadDayIndex >= 0) {
                    const targetLowDay = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][minLoadDayIndex];
                    // Increase by 15%? Let's use a slightly smaller percentage for increasing low days
                    const dayIncreaseProposal = proposeLoadChange(15, 'day', { week: targetWeek, day: targetLowDay }); 

                    if (dayIncreaseProposal.success) {
                        const dayLowCap = targetLowDay.charAt(0).toUpperCase() + targetLowDay.slice(1);
                        dayIncreaseProposal.description = `Increase load by 15% on lowest day (${dayLowCap}, Wk ${targetWeek}) (Est. Monotony: ${dayIncreaseProposal.impact?.predictedMonotony?.toFixed(2) || 'N/A'})`;
                        dayIncreaseProposal.type = 'increaseLowDay'; // Specific type
                        dayIncreaseProposal.targetWeek = targetWeek; 
                        dayIncreaseProposal.targetDay = targetLowDay;
                        dayIncreaseProposal.percentage = 15; 
                        proposals.push(dayIncreaseProposal);
                    } else {
                         console.log('[AdaptiveScheduler] Could not generate specific low day load increase proposal.');
                    }
                }
                break;
            }
            case 'lowLoad':
                // Proposal: Increase load gradually
                const increaseProposal = proposeLoadChange(10, 'week', { week: targetWeek });
                if (increaseProposal.success) {
                    increaseProposal.description = `Increase load by 10% in Week ${targetWeek} (Est. ACWR: ${increaseProposal.impact?.predictedACWR?.toFixed(2) || 'N/A'})`;
                    increaseProposal.type = 'increaseLoad'; // Ensure type matches ForgeAssist
                    increaseProposal.targetWeek = targetWeek; // Ensure targetWeek is set
                    increaseProposal.percentage = 10; // Set positive percentage
                    proposals.push(increaseProposal);
                } else {
                    console.log('[AdaptiveScheduler] Could not generate week load increase proposal.');
                }
                break;
                
            default:
                proposals.push({
                    type: 'message',
                    message: `No specific proposals for trigger: ${triggerEvent}`
                });
        }
        
        // Filter out any unsuccessful proposals just in case
        return proposals.filter(p => p.type === 'message' || p.success !== false);
    }

    /**
     * Generates a specific load change proposal (increase or decrease).
     * @param {number} percentageChange - The percentage change to apply (+ for increase, - for decrease).
     * @param {string} scope - Scope of change ('week', 'day').
     * @param {object} params - Additional parameters (week, day).
     * @returns {object} The load change proposal details.
     */
    function proposeLoadChange(percentageChange, scope, params = {}) {
        const changeType = percentageChange > 0 ? 'increase' : 'reduction';
        console.log(`[AdaptiveScheduler] Proposing ${Math.abs(percentageChange)}% load ${changeType} in ${scope}`);

        if (!dependencies.getCurrentBlockLoads) {
            return { success: false, message: 'Load data not available' };
        }

        const currentLoads = dependencies.getCurrentBlockLoads();
        const daysPerWeek = 7;

        // Default to current week if not specified
        const targetWeek = params.week || Math.ceil(currentLoads.length / daysPerWeek);

        let proposal = {
            type: `load${changeType.charAt(0).toUpperCase() + changeType.slice(1)}`, // e.g., 'loadIncrease'
            percentageChange: percentageChange,
            scope,
            changes: [] // Detailed breakdown of changes per day
        };

        const weekStartIndex = (targetWeek - 1) * daysPerWeek;
        const dayNames = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

        if (scope === 'week') {
            // Generate changes for the entire week
            for (let i = 0; i < daysPerWeek; i++) {
                const dayIndex = weekStartIndex + i;
                if (dayIndex < currentLoads.length) {
                    const currentLoad = currentLoads[dayIndex];
                    // Only apply change if current load is not zero, unless increasing
                    if (currentLoad > 0 || percentageChange > 0) { 
                        const proposedLoad = Math.max(0, Math.round(currentLoad * (1 + percentageChange / 100)));
                        const loadDiff = proposedLoad - currentLoad;

                        if (loadDiff !== 0) {
                            proposal.changes.push({
                                day: dayNames[i],
                                week: targetWeek,
                                currentLoad,
                                proposedLoad: proposedLoad,
                                change: loadDiff // Positive for increase, negative for decrease
                            });
                        }
                    }
                }
            }
        } else if (scope === 'day' && params.day) {
            // Find the specific day
            const dayIndex = dayNames.indexOf(params.day.toLowerCase());
            if (dayIndex >= 0) {
                const loadIndex = weekStartIndex + dayIndex;
                if (loadIndex < currentLoads.length) {
                    const currentLoad = currentLoads[loadIndex];
                     if (currentLoad > 0 || percentageChange > 0) {
                        const proposedLoad = Math.max(0, Math.round(currentLoad * (1 + percentageChange / 100)));
                        const loadDiff = proposedLoad - currentLoad;

                        if (loadDiff !== 0) {
                            proposal.changes.push({
                                day: params.day,
                                week: targetWeek,
                                currentLoad,
                                proposedLoad: proposedLoad,
                                change: loadDiff
                            });
                        }
                    }
                }
            }
        }

        // Calculate the impact of these changes
        const changeDescs = proposal.changes.map(change => ({
            type: 'modify', // Generic modification type for impact calculation
            day: change.day,
            week: change.week,
            loadChange: change.change 
        }));

        if (changeDescs.length > 0) {
            proposal.impact = calculateImpact(changeDescs, {});
            proposal.success = true;
        } else {
            proposal.success = false;
            proposal.message = `No significant load ${changeType} possible`;
        }

        return proposal;
    }

    /**
     * Generates a proposal for inserting a rest day.
     * @param {number} week - The week to modify.
     * @returns {object} The rest day insertion proposal.
     */
    function proposeRestDayInsertion(week) {
        console.log(`[AdaptiveScheduler] Proposing rest day insertion in week ${week}`);
        
        if (!dependencies.getCurrentBlockLoads) {
            return { success: false, message: 'Load data not available' };
        }
        
        const currentLoads = dependencies.getCurrentBlockLoads();
        const daysPerWeek = 7;
        
        if (!week) {
            week = Math.ceil(currentLoads.length / daysPerWeek); // Default to current week
        }
        
        const weekStartIndex = (week - 1) * daysPerWeek;
        const weekLoads = currentLoads.slice(weekStartIndex, weekStartIndex + daysPerWeek);
        
        // Find the day with the lowest load to make it a rest day
        // (preferring days that aren't already rest days)
        let lowestLoadIndex = -1;
        let lowestLoadValue = Infinity;
        
        for (let i = 0; i < weekLoads.length; i++) {
            const load = weekLoads[i];
            if (load > 0 && load < lowestLoadValue) {
                lowestLoadValue = load;
                lowestLoadIndex = i;
            }
        }
        
        // If we couldn't find a non-rest day, pick the day with lowest load
        if (lowestLoadIndex === -1) {
            lowestLoadIndex = weekLoads.indexOf(Math.min(...weekLoads));
        }
        
        const dayName = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'][lowestLoadIndex];
        
        const proposal = {
            type: 'restDayInsertion',
            week,
            day: dayName,
            currentLoad: weekLoads[lowestLoadIndex],
            success: true,
            changes: [{
                day: dayName,
                week,
                currentLoad: weekLoads[lowestLoadIndex],
                proposedLoad: 0,
                change: weekLoads[lowestLoadIndex]
            }]
        };
        
        // Calculate impact
        const changeDes = [{
            type: 'modify',
            day: dayName,
            week,
            loadChange: -weekLoads[lowestLoadIndex]
        }];
        
        proposal.impact = calculateImpact(changeDes, {});
        
        return proposal;
    }

    /**
     * Analyzes load progression within a phase and proposes optimizations.
     * @param {string} phaseName - Name of the phase (for context).
     * @param {number} startWeek - The starting week number (1-indexed).
     * @param {number} endWeek - The ending week number (1-indexed).
     * @returns {Array<object>} - Array of adjustment proposals.
     */
    function proposePhaseOptimizations(phaseName, startWeek, endWeek) {
        console.log(`[AdaptiveScheduler] Proposing optimizations for phase "${phaseName}" (Weeks ${startWeek}-${endWeek})`);
        let proposals = [];

        if (!dependencies.getCurrentBlockLoads) {
            console.warn('[AdaptiveScheduler] Load data not available for phase optimization.');
            return [{ type: 'message', message: 'Load data unavailable.' }];
        }
        if (startWeek >= endWeek) {
             console.warn('[AdaptiveScheduler] Invalid week range for phase optimization.');
             return [{ type: 'message', message: 'Phase requires at least two weeks.' }];
        }

        const currentLoads = dependencies.getCurrentBlockLoads();
        const daysPerWeek = 7;
        const phaseWeeks = []; // Array to hold weekly total loads for the phase

        // Calculate total load for each week in the phase
        for (let week = startWeek; week <= endWeek; week++) {
            const weekStartIndex = (week - 1) * daysPerWeek;
            // Ensure we don't read past the end of available load data
            if (weekStartIndex >= currentLoads.length) break; 
            
            const weekEndIndex = Math.min(weekStartIndex + daysPerWeek, currentLoads.length);
            const weekDailyLoads = currentLoads.slice(weekStartIndex, weekEndIndex);
            const weeklyTotalLoad = weekDailyLoads.reduce((sum, load) => sum + (load || 0), 0);
            phaseWeeks.push({ weekNum: week, totalLoad: weeklyTotalLoad });
        }

        if (phaseWeeks.length < 2) {
            console.log('[AdaptiveScheduler] Not enough data within the phase to analyze progression.');
            return [{ type: 'message', message: 'Not enough data in phase for optimization.' }];
        }

        // Analyze week-to-week changes
        const weeklyChanges = [];
        for (let i = 1; i < phaseWeeks.length; i++) {
            const change = phaseWeeks[i].totalLoad - phaseWeeks[i - 1].totalLoad;
            weeklyChanges.push({ weekNum: phaseWeeks[i].weekNum, change: change });
        }

        if (weeklyChanges.length === 0) {
             console.log('[AdaptiveScheduler] No weekly changes to analyze.');
             return [{ type: 'message', message: 'No load changes within phase.' }];
        }

        const averageChange = weeklyChanges.reduce((sum, wc) => sum + wc.change, 0) / weeklyChanges.length;
        const stdDevChange = Math.sqrt(weeklyChanges.reduce((sum, wc) => sum + Math.pow(wc.change - averageChange, 2), 0) / weeklyChanges.length);

        // Identify significant deviations (e.g., > 1 standard deviation from the average change)
        const SIGNIFICANCE_THRESHOLD = 1.0; 
        
        weeklyChanges.forEach(wc => {
            const deviation = Math.abs(wc.change - averageChange);
            
            if (deviation > SIGNIFICANCE_THRESHOLD * stdDevChange) {
                 const targetWeek = wc.weekNum; 
                 
                 if (wc.change > averageChange) { // Unusually large INCREASE in this week
                    // Propose reducing load SLIGHTLY in the *following* week to smooth out
                     if (targetWeek < endWeek) {
                         const nextWeek = targetWeek + 1;
                         const reductionPercentage = 5; // Small reduction
                         const reductionProposal = proposeLoadChange(-reductionPercentage, 'week', { week: nextWeek });
                         if (reductionProposal.success && reductionProposal.changes.length > 0) {
                             reductionProposal.description = `Smooth progression: Reduce load slightly (-${reductionPercentage}%) in Week ${nextWeek} after large jump in Week ${targetWeek}?`;
                             reductionProposal.type = 'reduceLoad'; // For ForgeAssist handler
                             reductionProposal.targetWeek = nextWeek;
                             reductionProposal.percentage = reductionPercentage; // Store absolute value
                              // Check for duplicates before adding
                             if (!proposals.some(p => p.targetWeek === nextWeek && p.type === 'reduceLoad')) {
                                proposals.push(reductionProposal);
                             }
                         }
                    }
                 } else { // Unusually large DECREASE or smaller-than-average increase
                     // Propose increasing load SLIGHTLY in the *following* week
                     if (targetWeek < endWeek) {
                        const nextWeek = targetWeek + 1;
                        const increasePercentage = 5; // Small increase
                        const increaseProposal = proposeLoadChange(increasePercentage, 'week', { week: nextWeek });
                        if (increaseProposal.success && increaseProposal.changes.length > 0) {
                             increaseProposal.description = `Smooth progression: Increase load slightly (+${increasePercentage}%) in Week ${nextWeek} after drop/leveling in Week ${targetWeek}?`;
                             increaseProposal.type = 'increaseLoad'; // For ForgeAssist handler
                             increaseProposal.targetWeek = nextWeek;
                             increaseProposal.percentage = increasePercentage;
                             // Check for duplicates before adding
                             if (!proposals.some(p => p.targetWeek === nextWeek && p.type === 'increaseLoad')) {
                                proposals.push(increaseProposal);
                             }
                         }
                     }
                 }
            }
        });

        if (proposals.length === 0) {
            console.log(`[AdaptiveScheduler] Load progression in phase "${phaseName}" appears relatively smooth.`);
            return [{ type: 'message', message: `Load progression in ${phaseName} looks stable.` }];
        }

        console.log(`[AdaptiveScheduler] Generated ${proposals.length} phase optimization proposals.`);
        return proposals;
    }

    /**
     * Suggests potential progressions for a given exercise based on its current details.
     * @param {string} exerciseId - The ID of the exercise.
     * @param {object} currentDetails - Object containing current set/rep/load details.
     * @param {number} currentDetails.sets
     * @param {string | number} currentDetails.reps 
     * @param {string} currentDetails.loadType 
     * @param {string | number} currentDetails.loadValue
     * @returns {Array<string>} - Array of suggestion strings.
     */
    function proposeExerciseProgression(exerciseId, currentDetails = {}) {
        console.log(`[AdaptiveScheduler] Proposing progression for ${exerciseId}`, currentDetails);
        const suggestions = [];
        const exercise = dependencies.exerciseLibrary.find(ex => ex.id === exerciseId);

        // Basic validation
        if (!exercise) {
            console.warn('[AdaptiveScheduler] Exercise not found for progression proposal.');
            return ['Could not find exercise in library.'];
        }

        const sets = parseInt(currentDetails.sets, 10) || 0;
        // Try to parse the first number from reps string (e.g., '5' from '5', '8' from '8-12')
        const reps = parseInt(String(currentDetails.reps).split('-')[0].trim(), 10) || 0; 
        const loadType = currentDetails.loadType;
        const loadValue = parseFloat(currentDetails.loadValue) || 0;

        // Simple Progression Logic Examples:
        if (reps > 0 && reps < 6) {
            suggestions.push(`Increase Reps: Try ${reps + 1} reps next time.`);
        }
        
        if (sets > 0 && sets < 4) {
             suggestions.push(`Increase Volume: Add a set (perform ${sets + 1} sets total).`);
        }

        if (reps >= 5) { // Only suggest load increase if reps are moderate/high
            if (loadType === 'rpe' && loadValue > 0 && loadValue < 10) {
                suggestions.push(`Increase Intensity (RPE): Aim for RPE ${loadValue + 0.5}.`);
            } else if (loadType === 'percent' && loadValue > 0 && loadValue < 100) {
                suggestions.push(`Increase Intensity (%): Try ${loadValue + 2.5}%.`);
            } else if (loadType === 'weight' && loadValue > 0) {
                 // Suggest small weight increment (e.g., 1-2.5kg)
                 const increment = loadValue > 50 ? 2.5 : (loadValue > 20 ? 1 : 0.5); 
                 suggestions.push(`Increase Intensity (Weight): Try ${loadValue + increment}kg.`);
            }
        }

        // TODO: Add suggestions for harder variations based on exercise properties/tags?
        // Example: if (exercise.tags?.includes('bodyweight-squat')) suggestions.push('Try Pistol Squats?');

        if (suggestions.length === 0) {
            suggestions.push('Exercise seems well-progressed, consider advanced techniques or variations.');
        }

        return suggestions.slice(0, 3); // Limit suggestions shown
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
        checkPhaseProgression,
        suggestAccessories
    };

})();

// Export the init function specifically if needed by blockbuilder
export function initializeAdaptiveScheduler(deps) {
    AdaptiveScheduler.init(deps);
    // Return the main module object if other functions are needed later
    return AdaptiveScheduler; 
}