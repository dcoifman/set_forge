/**
 * @file Manages the calculation of progression pathways for goal-driven autoprogramming.
 */

import * as periodizationEngine from './periodizationEngine.js';
import * as exerciseLibrary from './exercises/library.js';

const ProgressionPathwayOrchestrator = {
    /**
     * Calculates goal-driven pathways for multiple exercises, potentially modulated by a periodization model.
     * @param {object} goalInstance - Contains all goal parameters including targetExercises, timeframe, model.
     * @returns {Array<object>} An array of weekly targets: 
     * [{ week: number, exercises: [ { exerciseId, name, load, sets, reps, dayPreference, detailsString } , ... ],
     *    suggestedAccessories: [ { exerciseId, exerciseName, sets, reps, notes, dayPreference } , ... ] }, ...]
     */
    calculateGoalDrivenPathways: function(goalInstance) {
        // Access exerciseLibrary via import
        const allExercises = exerciseLibrary.getExercises();
        
        // --- Setup ---
        const {
            overallGoalType,
            timeframeWeeks,
            athleteLevel,
            periodizationModelName, // Optional
            targetExercises // Array of { exerciseId, currentPerf, targetPerf, ... }
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

        // Iterate through each week and calculate targets
        for (let weekIdx = 0; weekIdx < timeframeWeeks; weekIdx++) {
            const currentWeekNumber = weekIdx + 1; // 1-based for user display
            const exercisesForThisWeek = [];
            const dailyPrimaryExercisesMap = new Map(); // For grouping by day
            
            // For each target exercise, create a progression for this week
            targetExercises.forEach((targetEx, exerciseIndex) => {
                const { exerciseId, currentPerf, targetPerf, goalType = overallGoalType, athleteLevel: exAthleteLevel = athleteLevel } = targetEx;
                
                // Get the full exercise data from the library for name and other metadata
                const exerciseData = exerciseLibrary.getExerciseById(exerciseId);
                if (!exerciseData) {
                    console.error(`Exercise with ID ${exerciseId} not found in the library!`);
                    return; // Skip this exercise
                }
                
                const exerciseName = exerciseData.name;
                
                // Calculate a simple linear progression as our base target
                const baseProg = this._calculateSimpleLinearTargetForWeek(
                    currentPerf,
                    targetPerf,
                    timeframeWeeks,
                    currentWeekNumber,
                    goalType,
                    exAthleteLevel
                );
                
                // Determine which day this exercise should preferably be trained on
                const dayPreference = this._getPreferredDay(exerciseIndex, targetExercises.length);
                
                // Start with the base target
                let finalExerciseTarget = {
                    exerciseId: exerciseId,
                    name: exerciseName, // Use the name from the library
                    load: baseProg.load,
                    sets: baseProg.sets,
                    reps: baseProg.reps,
                    dayPreference: dayPreference,
                    detailsString: `${baseProg.sets}x${baseProg.reps} @ ${baseProg.load}kg`
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
                
                // Group primary exercises by their scheduled day for accessory suggestion
                if (!dailyPrimaryExercisesMap.has(finalExerciseTarget.dayPreference)) {
                    dailyPrimaryExercisesMap.set(finalExerciseTarget.dayPreference, []);
                }
                dailyPrimaryExercisesMap.get(finalExerciseTarget.dayPreference).push(
                    exerciseLibrary.getExerciseById(finalExerciseTarget.exerciseId)
                ); // Store full exercise object
            });

            // Now, for each day that has primary exercises, suggest accessories
            const suggestedAccessoriesForThisWeek = [];
            for (const [dayPref, primariesOnDay] of dailyPrimaryExercisesMap.entries()) {
                if (primariesOnDay.length > 0) {
                    const accessories = this.suggestAccessoryWork(
                        primariesOnDay, // Array of full primary exercise objects for this day
                        overallGoalType,
                        athleteLevel,
                        exerciseLibrary,
                        periodizationModelName, // Can be used to infer phase, e.g. from Block model
                        weekIdx,
                        timeframeWeeks
                    );
                    // Add dayPreference to each suggested accessory
                    accessories.forEach(acc => {
                        suggestedAccessoriesForThisWeek.push({ ...acc, dayPreference: dayPref, isPrimary: false });
                    });
                }
            }

            weeklyTargets.push({
                week: currentWeekNumber,
                exercises: exercisesForThisWeek,
                suggestedAccessories: suggestedAccessoriesForThisWeek // Accessories suggested by PPO
            });
        }
        console.log("PPO Calculated Full Goal-Driven Pathway (with accessory suggestions):", weeklyTargets);
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
     * Suggests 2-4 accessory exercises based on primary exercises, goal, and athlete level.
     * @param {Array<Object>} primaryExercisesOnDay - Array of FULL exercise objects (from ExerciseLibrary) for the day.
     * @param {string} overallGoalType - E.g., "Strength", "Hypertrophy".
     * @param {string} athleteLevel - E.g., "Beginner", "Intermediate".
     * @param {object} exerciseLibrary - Instance of ExerciseLibrary.
     * @param {string|null} periodizationModelName - Name of the active periodization model, if any.
     * @param {number} weekIdx - Current week index (0-based).
     * @param {number} timeframeWeeks - Total weeks in the block.
     * @returns {Array<Object>} Suggested accessories: [{ exerciseId, name, sets, reps, notes }, ...]
     */
    suggestAccessoryWork: function(primaryExercisesOnDay, overallGoalType, athleteLevel, exerciseLibrary, periodizationModelName, weekIdx, timeframeWeeks) {
        const suggestions = [];
        if (!exerciseLibrary || typeof exerciseLibrary.getExercises !== 'function') {
            console.error("PPO suggestAccessoryWork: ExerciseLibrary is missing or invalid.");
            return suggestions;
        }
        const allExercises = exerciseLibrary.getExercises();

        // 1. Identify muscle groups worked by primaries
        const primaryMusclesWorked = new Set();
        const primaryCategories = new Set();
        primaryExercisesOnDay.forEach(ex => {
            if (ex && ex.primaryMuscles) ex.primaryMuscles.forEach(m => primaryMusclesWorked.add(m.toLowerCase()));
            if (ex && ex.category) primaryCategories.add(ex.category.toLowerCase());
        });

        // 2. Determine number of accessories
        let numAccessories = 0;
        if (athleteLevel === 'Beginner') numAccessories = 1; // Fewer for beginners
        else if (athleteLevel === 'Intermediate') numAccessories = 2;
        else if (athleteLevel === 'Advanced') numAccessories = 3; // Max 3 for now

        if (primaryExercisesOnDay.length === 0) return suggestions; // No primaries, no accessories

        // 3. Determine accessory type based on goal
        let desiredCategories = ['isolation', 'machine']; // Default accessory types
        let repRange = "10-15";
        let setsCount = 3;
        
        // For later weeks, reduce volume as we near target
        const isLatePhase = weekIdx >= Math.floor(timeframeWeeks * 0.75);
        if (isLatePhase) {
            numAccessories = Math.max(1, numAccessories - 1); // Reduce by 1 but min 1
            setsCount = 2; // Fewer sets in later phases
        }

        // Find suitable accessories: First ones that specifically target muscles used in primaries
        const primaryExNames = primaryExercisesOnDay.map(ex => ex.name.toLowerCase());
        let potentialAccessories = allExercises.filter(ex => {
            // Skip if this is one of our primary exercises
            if (primaryExercisesOnDay.some(p => p.id === ex.id)) return false;
            
            // Look for exercises that target muscles worked by primaries as secondary muscles
            return ex.primaryMuscles?.some(m => 
                primaryMusclesWorked.has(m.toLowerCase())
            ) || ex.secondaryMuscles?.some(m => 
                primaryMusclesWorked.has(m.toLowerCase())
            );
        });

        console.log(`PPO Accessory Suggestions for day with primaries [${primaryExercisesOnDay.map(ex => ex.name).join(', ')}]:`, potentialAccessories.slice(0, 5));

        // If not enough, add exercises that match desired category/equipment
        if (potentialAccessories.length < numAccessories) {
            const moreAccessories = allExercises.filter(ex => {
                // Skip if already in our list or a primary
                if (primaryExercisesOnDay.some(p => p.id === ex.id)) return false;
                if (potentialAccessories.some(p => p.id === ex.id)) return false;
                
                // Look for category matches
                return ex.tags?.some(t => desiredCategories.includes(t.toLowerCase()));
            });
            potentialAccessories = [...potentialAccessories, ...moreAccessories];
        }

        // Sort by relevance (more primary/secondary muscle matches = higher relevance)
        potentialAccessories.sort((a, b) => {
            const aMatches = (a.primaryMuscles?.filter(m => primaryMusclesWorked.has(m.toLowerCase())).length || 0) +
                            (a.secondaryMuscles?.filter(m => primaryMusclesWorked.has(m.toLowerCase())).length || 0);
            const bMatches = (b.primaryMuscles?.filter(m => primaryMusclesWorked.has(m.toLowerCase())).length || 0) +
                            (b.secondaryMuscles?.filter(m => primaryMusclesWorked.has(m.toLowerCase())).length || 0);
            return bMatches - aMatches; // Highest matches first
        });

        // Take top N accessories
        potentialAccessories = potentialAccessories.slice(0, numAccessories);
        
        // Turn into suggestion objects
        potentialAccessories.forEach(ex => {
            // Get rep range based on exercise type and goal
            const isIsolation = ex.tags?.includes('isolation');
            const mainMuscles = ex.primaryMuscles?.join(', ') || '';
            
            // Build standard suggestion
            suggestions.push({
                exerciseId: ex.id,
                name: ex.name, // Ensure name is included
                sets: setsCount,
                reps: repRange.split('-')[0], // Just take lower range as number
                notes: `Accessory (${mainMuscles})`,
                detailsString: `${setsCount}x${repRange}`
            });
        });
        
        return suggestions;
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
                baseSets = athleteLevel === 'Beginner' ? 3 : 5;
                baseReps = 5;
                break;
            case 'hypertrophy':
                baseSets = 4;
                baseReps = athleteLevel === 'Beginner' ? 10 : 12;
                break;
            case 'endurance':
                baseSets = 3;
                baseReps = 15;
                break;
            default:
                baseSets = 3;
                baseReps = 8;
        }

        const totalImprovement = targetPerf - currentPerf;
        const weeklyImprovement = totalImprovement / (weeks - 1);

        for (let i = 0; i < weeks; i++) {
            const weekNumber = i + 1;
            let weekLoad = currentPerf + (weeklyImprovement * i);
            
            // Ensure the last week precisely hits the targetPerf.
            if (weekNumber === weeks) {
                weekLoad = targetPerf;
            }
            
            pathway.push({
                week: weekNumber,
                load: Math.round(weekLoad * 100) / 100, // Round to 2 decimal places
                sets: baseSets,
                reps: baseReps
            });
        }
        
        return pathway;
    }
};

export default ProgressionPathwayOrchestrator; 