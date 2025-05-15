/**
 * @file Manages the calculation of progression pathways for goal-driven autoprogramming.
 */

const ProgressionPathwayOrchestrator = {
    /**
     * Calculates goal-driven pathways for multiple exercises, potentially modulated by a periodization model.
     * @param {object} goalInstance - Contains all goal parameters including targetExercises, timeframe, model.
     * @param {object} periodizationEngine - Instance of PeriodizationEngine.
     * @param {object} exerciseLibrary - Instance of ExerciseLibrary.
     * @returns {Array<object>} An array of weekly targets: 
     * [{ week: number, exercises: [ { exerciseId, name, load, sets, reps, dayPreference, detailsString, rawLoad, rawSets, rawReps } , ... ] }, ...]
     */
    calculateGoalDrivenPathways: function(goalInstance, periodizationEngine, exerciseLibrary) {
        const {
            targetExercises, // Array: [{ exerciseId, exerciseName, currentPerf, targetPerf, goalType, athleteLevel }]
            timeframeWeeks,
            overallGoalType, // The main goal type selected (Strength, Hypertrophy etc.)
            athleteLevel,    // Overall athlete level
            periodizationModelName, // Optional: e.g., "linear", "wave"
            // baseModelParams (if we need to provide specific default params for the chosen model)
        } = goalInstance;

        const weeklyTargets = [];

        if (!periodizationEngine || typeof periodizationEngine.calculateExercisesForDay !== 'function' || typeof periodizationEngine.getModelDefaults !== 'function') {
            console.error("PPO: Valid PeriodizationEngine is required.");
            return weeklyTargets;
        }
        if (!exerciseLibrary || typeof exerciseLibrary.getExerciseById !== 'function') {
            console.error("PPO: Valid ExerciseLibrary is required.");
            return weeklyTargets;
        }


        for (let weekIdx = 0; weekIdx < timeframeWeeks; weekIdx++) {
            const currentWeekNumber = weekIdx + 1;
            const exercisesForThisWeek = [];

            targetExercises.forEach((goalEx, exIdx) => {
                const { exerciseId, exerciseName, currentPerf, targetPerf } = goalEx;
                // Use specific goalType/athleteLevel for exercise if available, else use overall
                const exGoalType = goalEx.goalType || overallGoalType;
                const exAthleteLevel = goalEx.athleteLevel || athleteLevel;

                // 1. Calculate Base Linear Progression for this exercise for the current week
                const baseProg = this._calculateSimpleLinearTargetForWeek(
                    parseFloat(currentPerf), parseFloat(targetPerf), timeframeWeeks, currentWeekNumber, exGoalType, exAthleteLevel
                );
                // baseProg = { week, load, sets, reps }

                let finalExerciseTarget = {
                    exerciseId: exerciseId,
                    exerciseName: exerciseName,
                    rawLoad: baseProg.load, // Store the simple linear progression value
                    rawSets: baseProg.sets,
                    rawReps: baseProg.reps,
                    load: baseProg.load,
                    sets: baseProg.sets,
                    reps: baseProg.reps,
                    dayPreference: this._getPreferredDay(exIdx, targetExercises.length), // e.g., mon, tue, wed
                    detailsString: `${baseProg.sets}x${baseProg.reps} @ ${baseProg.load}kg (Linear Goal)`
                };

                // 2. If a periodization model is selected, use PeriodizationEngine to refine
                if (periodizationModelName) {
                    try {
                        const modelDefaults = periodizationEngine.getModelDefaults(periodizationModelName);
                        if (!modelDefaults) {
                            console.warn(`PPO: Could not get defaults for ${periodizationModelName}. Using linear for ${exerciseName}.`);
                        } else {
                            // Construct a temporary modelInstance for PeriodizationEngine
                            // The key is to make the `weeklyStructure` dynamic based on GDAP primary exercise
                            const tempModelParams = JSON.parse(JSON.stringify(modelDefaults)); // Deep copy

                            // Override/Set crucial params for the engine for THIS specific exercise
                            tempModelParams.exercise1RMs = tempModelParams.exercise1RMs || {};
                            tempModelParams.exercise1RMs[exerciseName] = parseFloat(targetPerf); // Use targetPerf as a proxy for 1RM for % calcs
                            tempModelParams.useDefined1RM = true; // Crucial for %-based models in engine
                            tempModelParams.useEstimated1RM = true; // For wave model etc.

                            // Create a specific weeklyStructure entry for this exercise on its preferred day
                            tempModelParams.weeklyStructure = [{
                                dayOfWeek: finalExerciseTarget.dayPreference,
                                mainExercise: exerciseName,
                                // These flags tell the engine to apply its logic
                                applyProgression: periodizationModelName === 'linear', // Only for engine's linear
                                applyWave: periodizationModelName === 'wave',
                                applyModel: ['triphasic', 'apre', 'block', 'dupauto', 'microdose'].includes(periodizationModelName), // General flag
                                // Potentially pass GDAP sets/reps as hints if model supports it
                                // sets: baseProg.sets (or let model decide)
                            }];
                            
                            // For 'wave', ensure a pattern is defined if GDAP exercise is main
                            if (periodizationModelName === 'wave') {
                                if (!tempModelParams.wavePatternDefinitions || !tempModelParams.wavePatternDefinitions.mainLift) {
                                    tempModelParams.wavePatternDefinitions = tempModelParams.wavePatternDefinitions || {};
                                    // Define a generic wave pattern for GDAP if not present in defaults
                                    tempModelParams.wavePatternDefinitions.gdapMain = { patternTargets: [75, 80, 85], repsPerStep: [baseProg.reps, baseProg.reps-2 > 0 ? baseProg.reps-2 : 1, baseProg.reps-4 > 0 ? baseProg.reps-4 : 1]};
                                    tempModelParams.weeklyStructure[0].applyWavePattern = 'gdapMain';
                                } else if (tempModelParams.weeklyStructure[0].mainExercise === exerciseName) {
                                    // If it's the main exercise in the structure, ensure a pattern is applied
                                    tempModelParams.weeklyStructure[0].applyWavePattern = tempModelParams.weeklyStructure[0].applyWavePattern || Object.keys(tempModelParams.wavePatternDefinitions)[0];
                                }
                            }
                            // For 'linear' model, PPO provides the progression targets
                            // So, the engine's internal linear progression needs to be guided or PPO uses engine's output.
                            // For Phase 2, let's allow engine's linear to take over if selected.
                            // PPO's linear acts as fallback or base.
                            if (periodizationModelName === 'linear') {
                                tempModelParams.loadTargets = [baseProg.load]; // Give current week's load as base for engine's linear
                                tempModelParams.repsPerSet = [baseProg.reps];
                                // Engine's linear increment will apply on top of this if its own weekIndex logic is used.
                                // This needs careful handling. PPO is already calculating weekly increment.
                                // Simplification: If 'linear' model is chosen, let GDAP's simple linear be the source.
                                // OR, tell engine's linear to use *GDAP's progression* rather than its own.
                                // For now, the `weeklyStructure` with `applyProgression: true` and `mainExercise`
                                // along with `exercise1RMs` should make the engine calculate for that exercise.
                                // We might need to adjust engine's `_calculateLinearDay` to take `weekIndex` more directly for GDAP.
                            }


                            const tempModelInstance = {
                                type: periodizationModelName,
                                params: tempModelParams,
                                scope: { 
                                    targetDaysOfWeek: [finalExerciseTarget.dayPreference], 
                                    targetWeeks: [currentWeekNumber], 
                                    // exerciseState: {} // For APRE if needed
                                },
                                library: exerciseLibrary.getExercises() // Pass the whole library
                            };
                            
                            // Calculate exercises for the specific day using the engine
                            const engineCalculatedExercises = periodizationEngine.calculateExercisesForDay(tempModelInstance, weekIdx, finalExerciseTarget.dayPreference, false /*isDeloadWeek - GDAP handles deload later if needed*/);
                            
                            // Find our targetExercise in the engine's output
                            const engineTargetEx = engineCalculatedExercises.find(e => e.exerciseName === exerciseName || e.exerciseName.startsWith(exerciseName)); // StartsWith for Triphasic phases
                            
                            if (engineTargetEx) {
                                finalExerciseTarget.load = engineTargetEx.loadValue; // This might be % or kg
                                finalExerciseTarget.sets = engineTargetEx.sets;
                                finalExerciseTarget.reps = engineTargetEx.reps;
                                finalExerciseTarget.detailsString = engineTargetEx.detailsString || `${engineTargetEx.sets}x${engineTargetEx.reps} @ ${engineTargetEx.loadValue}${engineTargetEx.loadType ==='%' ? '%' : (engineTargetEx.loadType ==='weight' ? 'kg' : engineTargetEx.loadType)}`;
                                finalExerciseTarget.loadType = engineTargetEx.loadType; // Track if % or weight
                                console.log(`PPO: Week ${currentWeekNumber}, Ex ${exerciseName} modulated by ${periodizationModelName}: ${finalExerciseTarget.detailsString}`);
                            } else {
                                console.warn(`PPO: Week ${currentWeekNumber}, Ex ${exerciseName} not found in ${periodizationModelName} engine output for day ${finalExerciseTarget.dayPreference}. Using linear.`);
                            }
                        }
                    } catch (e) {
                        console.error(`PPO: Error applying periodization model ${periodizationModelName} for ${exerciseName} in week ${currentWeekNumber}:`, e);
                        // Fallback to linear if error
                    }
                }
                exercisesForThisWeek.push(finalExerciseTarget);
            });

            weeklyTargets.push({
                week: currentWeekNumber,
                exercises: exercisesForThisWeek
            });
        }
        console.log("PPO Calculated Full Goal-Driven Pathway:", weeklyTargets);
        return weeklyTargets;
    },

    /**
     * Calculates a simple linear progression target for a specific week.
     */
    _calculateSimpleLinearTargetForWeek: function(currentPerf, targetPerf, totalWeeks, currentWeekNumber, goalType, athleteLevel) {
        let baseSets, baseReps;
        switch (String(goalType).toLowerCase()) {
            case 'strength':
                baseSets = athleteLevel === 'Beginner' ? 3 : 4;
                baseReps = 5;
                break;
            case 'hypertrophy':
                baseSets = 3;
                baseReps = athleteLevel === 'Beginner' ? 10 : 12;
                break;
            case 'endurance':
                baseSets = 2;
                baseReps = 15;
                break;
            default:
                baseSets = 3;
                baseReps = 8;
        }

        let weekLoad;
        if (totalWeeks <= 0) return { week: currentWeekNumber, load: currentPerf, sets: baseSets, reps: baseReps};
        if (totalWeeks === 1) {
            weekLoad = targetPerf;
        } else {
            const totalImprovement = targetPerf - currentPerf;
            const weeklyImprovement = totalImprovement / (totalWeeks - 1);
            weekLoad = currentPerf + (weeklyImprovement * (currentWeekNumber - 1));
        }
        
        // Ensure the last week precisely hits the targetPerf if an incremental approach was used.
        if (currentWeekNumber === totalWeeks && totalWeeks > 1) {
            weekLoad = targetPerf;
        }

        return {
            week: currentWeekNumber,
            load: Math.round(weekLoad * 100) / 100, // Round to 2 decimal places
            sets: baseSets,
            reps: baseReps
        };
    },

    /**
     * Determines a preferred training day for an exercise based on its index.
     * Super simple distribution for now.
     */
    _getPreferredDay: function(exerciseIndex, totalPrimaryExercises) {
        const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        // Simple distribution: Ex0 on Mon, Ex1 on Wed, Ex2 on Fri
        // If more exercises than these slots, they'll repeat or need more complex logic.
        if (exerciseIndex === 0) return days[0]; // Monday
        if (exerciseIndex === 1) return days[2]; // Wednesday
        if (exerciseIndex === 2) return days[4]; // Friday
        return days[exerciseIndex % days.length]; // Fallback for >3 exercises
    },

    /**
     * Calculates a simple linear progression pathway for a single exercise.
     * @param {number} currentPerf - The current performance metric (e.g., 1RM, working weight).
     * @param {number} targetPerf - The target performance metric.
     * @param {number} weeks - The number of weeks to achieve the target.
     * @param {string} goalType - The type of goal (e.g., 'Strength', 'Hypertrophy'). Influences sets/reps.
     * @param {string} athleteLevel - The athlete's experience level (e.g., 'Beginner', 'Intermediate', 'Advanced').
     * @returns {Array<Object>} An array of objects, each representing a week's target.
     * Each object: { week: number, load: number, sets: number, reps: number }
     */
    calculateSimpleLinearPathway: function(currentPerf, targetPerf, weeks, goalType, athleteLevel) {
        const pathway = [];
        if (weeks <= 0) return pathway;

        currentPerf = parseFloat(currentPerf);
        targetPerf = parseFloat(targetPerf);
        weeks = parseInt(weeks);

        let baseSets, baseReps;

        // Basic sets/reps based on goal type (can be refined significantly)
        switch (goalType.toLowerCase()) {
            case 'strength':
                baseSets = athleteLevel === 'Beginner' ? 3 : 4;
                baseReps = 5;
                break;
            case 'hypertrophy':
                baseSets = 3;
                baseReps = athleteLevel === 'Beginner' ? 10 : 12;
                break;
            case 'endurance': // More for muscular endurance in this context
                baseSets = 2;
                baseReps = 15;
                break;
            default:
                baseSets = 3;
                baseReps = 8;
        }

        const totalImprovement = targetPerf - currentPerf;
        // Ensure weeklyImprovement is 0 if weeks is 1, to avoid division by zero and use targetPerf directly.
        const weeklyImprovement = weeks > 1 ? totalImprovement / (weeks - 1) : 0;

        for (let i = 0; i < weeks; i++) {
            let weekLoad;
            if (weeks === 1) {
                weekLoad = targetPerf;
            } else {
                weekLoad = currentPerf + (weeklyImprovement * i);
            }
            
            // Basic rounding for load, could be more sophisticated (e.g., to nearest 2.5 or 5)
            weekLoad = Math.round(weekLoad * 100) / 100; 

            pathway.push({
                week: i + 1,
                load: weekLoad,
                sets: baseSets,
                reps: baseReps
            });
        }
        // Ensure the last week precisely hits the targetPerf if an incremental approach was used.
        if (weeks > 1 && pathway.length > 0) {
            pathway[pathway.length -1].load = Math.round(targetPerf * 100) / 100;
        }

        console.log("Calculated Pathway:", pathway);
        return pathway;
    }
};

// Make it available if using modules, otherwise it's global
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = ProgressionPathwayOrchestrator;
} 