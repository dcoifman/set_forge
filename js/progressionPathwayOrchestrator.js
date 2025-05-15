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
            targetExercises,
            timeframeWeeks,
            overallGoalType,
            athleteLevel,
            periodizationModelName,
        } = goalInstance;

        const fullWeeklyTargets = []; // Will store { week, exercises (primaries), suggestedAccessories }

        if (!periodizationEngine || !exerciseLibrary) {
            console.error("PPO: PeriodizationEngine and ExerciseLibrary are required.");
            return fullWeeklyTargets;
        }

        for (let weekIdx = 0; weekIdx < timeframeWeeks; weekIdx++) {
            const currentWeekNumber = weekIdx + 1;
            const primaryExercisesForThisWeek = [];
            const dailyPrimaryExercisesMap = new Map(); // Map<dayPreference, Array<primaryExerciseObjects>>

            targetExercises.forEach((goalEx, exIdx) => {
                const { exerciseId, exerciseName, currentPerf, targetPerf } = goalEx;
                const exGoalType = goalEx.goalType || overallGoalType;
                const exAthleteLevel = goalEx.athleteLevel || athleteLevel;

                const baseProg = this._calculateSimpleLinearTargetForWeek(
                    parseFloat(currentPerf), parseFloat(targetPerf), timeframeWeeks, currentWeekNumber, exGoalType, exAthleteLevel
                );

                let finalExerciseTarget = {
                    exerciseId: exerciseId,
                    exerciseName: exerciseName,
                    rawLoad: baseProg.load,
                    rawSets: baseProg.sets,
                    rawReps: baseProg.reps,
                    load: baseProg.load,
                    sets: baseProg.sets,
                    reps: baseProg.reps,
                    dayPreference: this._getPreferredDay(exIdx, targetExercises.length),
                    detailsString: `${baseProg.sets}x${baseProg.reps} @ ${baseProg.load}kg (Linear Goal)`,
                    isPrimary: true // Mark as primary
                };

                if (periodizationModelName) {
                    // Periodization modulation logic
                    try {
                        const modelDefaults = periodizationEngine.getModelDefaults(periodizationModelName);
                        if (!modelDefaults) {
                            console.warn(`PPO: Could not get defaults for ${periodizationModelName}. Using linear for ${exerciseName}.`);
                        } else {
                            const tempModelParams = JSON.parse(JSON.stringify(modelDefaults));
                            tempModelParams.exercise1RMs = tempModelParams.exercise1RMs || {};
                            tempModelParams.exercise1RMs[exerciseName] = parseFloat(targetPerf);
                            tempModelParams.useDefined1RM = true;
                            tempModelParams.useEstimated1RM = true;

                            tempModelParams.weeklyStructure = [{
                                dayOfWeek: finalExerciseTarget.dayPreference,
                                mainExercise: exerciseName,
                                applyProgression: periodizationModelName === 'linear',
                                applyWave: periodizationModelName === 'wave',
                                applyModel: ['triphasic', 'apre', 'block', 'dupauto', 'microdose'].includes(periodizationModelName),
                            }];
                            
                            if (periodizationModelName === 'wave') {
                                if (!tempModelParams.wavePatternDefinitions || !tempModelParams.wavePatternDefinitions.mainLift) {
                                    tempModelParams.wavePatternDefinitions = tempModelParams.wavePatternDefinitions || {};
                                    tempModelParams.wavePatternDefinitions.gdapMain = { patternTargets: [75, 80, 85], repsPerStep: [baseProg.reps, Math.max(1, baseProg.reps-2), Math.max(1, baseProg.reps-4)]};
                                    tempModelParams.weeklyStructure[0].applyWavePattern = 'gdapMain';
                                } else if (tempModelParams.weeklyStructure[0].mainExercise === exerciseName) {
                                    tempModelParams.weeklyStructure[0].applyWavePattern = tempModelParams.weeklyStructure[0].applyWavePattern || Object.keys(tempModelParams.wavePatternDefinitions)[0];
                                }
                            }
                            
                            const tempModelInstance = {
                                type: periodizationModelName,
                                params: tempModelParams,
                                scope: { 
                                    targetDaysOfWeek: [finalExerciseTarget.dayPreference], 
                                    targetWeeks: [currentWeekNumber],
                                },
                                library: exerciseLibrary.getExercises()
                            };
                            
                            const engineCalculatedExercises = periodizationEngine.calculateExercisesForDay(tempModelInstance, weekIdx, finalExerciseTarget.dayPreference, false);
                            const engineTargetEx = engineCalculatedExercises.find(e => e.exerciseName === exerciseName || e.exerciseName.startsWith(exerciseName));
                            
                            if (engineTargetEx) {
                                finalExerciseTarget.load = engineTargetEx.loadValue;
                                finalExerciseTarget.sets = engineTargetEx.sets;
                                finalExerciseTarget.reps = engineTargetEx.reps;
                                finalExerciseTarget.detailsString = engineTargetEx.detailsString || `${engineTargetEx.sets}x${engineTargetEx.reps} @ ${engineTargetEx.loadValue}${engineTargetEx.loadType ==='%' ? '%' : (engineTargetEx.loadType ==='weight' ? 'kg' : engineTargetEx.loadType)}`;
                                finalExerciseTarget.loadType = engineTargetEx.loadType;
                            } else {
                                console.warn(`PPO: Week ${currentWeekNumber}, Ex ${exerciseName} not found in ${periodizationModelName} engine output. Using linear.`);
                            }
                        }
                    } catch (e) {
                        console.error(`PPO: Error applying model ${periodizationModelName} for ${exerciseName} in week ${currentWeekNumber}:`, e);
                    }
                }
                primaryExercisesForThisWeek.push(finalExerciseTarget);
                
                // Group primary exercises by their scheduled day for accessory suggestion
                if (!dailyPrimaryExercisesMap.has(finalExerciseTarget.dayPreference)) {
                    dailyPrimaryExercisesMap.set(finalExerciseTarget.dayPreference, []);
                }
                dailyPrimaryExercisesMap.get(finalExerciseTarget.dayPreference).push(exerciseLibrary.getExerciseById(finalExerciseTarget.exerciseId)); // Store full exercise object
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

            fullWeeklyTargets.push({
                week: currentWeekNumber,
                exercises: primaryExercisesForThisWeek, // Primaries scheduled by GDAP
                suggestedAccessories: suggestedAccessoriesForThisWeek // Accessories suggested by PPO
            });
        }
        console.log("PPO Calculated Full Goal-Driven Pathway (with accessory suggestions):", fullWeeklyTargets);
        return fullWeeklyTargets;
    },

    _calculateSimpleLinearTargetForWeek: function(currentPerf, targetPerf, totalWeeks, currentWeekNumber, goalType, athleteLevel) {
        let baseSets, baseReps;
        switch (String(goalType).toLowerCase()) {
            case 'strength':
                baseSets = athleteLevel === 'Beginner' ? 3 : 4; baseReps = 5; break;
            case 'hypertrophy':
                baseSets = 3; baseReps = athleteLevel === 'Beginner' ? 10 : 12; break;
            case 'endurance':
                baseSets = 2; baseReps = 15; break;
            default:
                baseSets = 3; baseReps = 8;
        }
        let weekLoad;
        if (totalWeeks <= 0) return { week: currentWeekNumber, load: currentPerf, sets: baseSets, reps: baseReps};
        if (totalWeeks === 1) { weekLoad = targetPerf; }
        else {
            const totalImprovement = targetPerf - currentPerf;
            const weeklyImprovement = totalImprovement / (totalWeeks - 1);
            weekLoad = currentPerf + (weeklyImprovement * (currentWeekNumber - 1));
        }
        if (currentWeekNumber === totalWeeks && totalWeeks > 1) { weekLoad = targetPerf; }
        return { week: currentWeekNumber, load: Math.round(weekLoad * 100) / 100, sets: baseSets, reps: baseReps };
    },

    _getPreferredDay: function(exerciseIndex, totalExercises) {
        const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
        if (exerciseIndex === 0) return days[0]; 
        if (exerciseIndex === 1) return days[2]; 
        if (exerciseIndex === 2) return days[4]; 
        return days[exerciseIndex % days.length];
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
     * @returns {Array<Object>} Suggested accessories: [{ exerciseId, exerciseName, sets, reps, notes }, ...]
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

        switch (overallGoalType.toLowerCase()) {
            case 'strength':
                // For strength, might suggest compound accessories or direct antagonists
                // Or exercises targeting common weak points for the primary lifts
                desiredCategories = ['compound', 'isolation', 'machine']; // Broader
                repRange = "6-10";
                setsCount = 3;
                break;
            case 'hypertrophy':
                desiredCategories = ['isolation', 'machine', 'unilateral'];
                repRange = "8-15"; // Could be wider
                setsCount = 3;
                break;
            case 'endurance':
                desiredCategories = ['isolation', 'bodyweight', 'machine'];
                repRange = "15-20";
                setsCount = 2;
                break;
        }
        
        // Adjust volume based on phase (simple early/mid/late for now)
        const blockPhase = weekIdx < timeframeWeeks / 3 ? 'early' : (weekIdx < (timeframeWeeks * 2) / 3 ? 'mid' : 'late');
        if (blockPhase === 'early') { /* setsCount might be higher */ }
        else if (blockPhase === 'late') { numAccessories = Math.max(1, numAccessories -1); setsCount = Math.max(2, setsCount -1); }


        // 4. Filter candidate exercises
        const candidates = allExercises.filter(ex => {
            if (primaryExercisesOnDay.some(pEx => pEx.id === ex.id)) return false; // Don't suggest a primary
            if (suggestions.some(s => s.exerciseId === ex.id)) return false; // Already suggested

            // Check if it's an "accessory-like" exercise based on tags or category
            const isAccessoryTag = ex.tags && (ex.tags.includes('isolation') || ex.tags.includes('accessory') || ex.tags.includes('unilateral') || ex.tags.includes('bodyweight'));
            const isMachine = ex.equipmentNeeded && ex.equipmentNeeded.some(eq => eq.toLowerCase().includes('machine') || eq.toLowerCase().includes('cable'));
            
            if (!isAccessoryTag && !isMachine && !desiredCategories.some(cat => ex.category?.toLowerCase().includes(cat) || ex.tags?.includes(cat) ) ) {
                 // If not explicitly accessory-like, allow if it's a compound but not too similar to primary
                 if (!ex.tags || !ex.tags.includes('compound')) return false;
            }

            // Rule: For hypertrophy, prioritize same muscle groups or directly related ones.
            // For strength, can be same or antagonists or common supporting muscles.
            let targetsRelevantMuscle = false;
            if (ex.primaryMuscles) {
                for (const muscle of ex.primaryMuscles) {
                    if (primaryMusclesWorked.has(muscle.toLowerCase())) {
                        targetsRelevantMuscle = true;
                        break;
                    }
                    // For strength, also consider antagonists (simple example: push vs pull focus)
                    if (overallGoalType.toLowerCase() === 'strength') {
                        if ((primaryCategories.has('upper body push') && ex.tags?.includes('pull')) ||
                            (primaryCategories.has('upper body pull') && ex.tags?.includes('push'))) {
                            targetsRelevantMuscle = true; break;
                        }
                    }
                }
            }
            if (!targetsRelevantMuscle && ex.secondaryMuscles) { // Check secondary if primary doesn't match
                 for (const muscle of ex.secondaryMuscles) {
                    if (primaryMusclesWorked.has(muscle.toLowerCase())) {
                        targetsRelevantMuscle = true;
                        break;
                    }
                }
            }
            return targetsRelevantMuscle;
        });

        // 5. Select top N candidates (simple selection for now, could be smarter)
        // Prioritize exercises matching `desiredCategories` or those that are clearly not main compound lifts
        candidates.sort((a, b) => {
            let scoreA = 0;
            let scoreB = 0;
            if (a.tags && desiredCategories.some(cat => a.tags.includes(cat))) scoreA += 2;
            if (b.tags && desiredCategories.some(cat => b.tags.includes(cat))) scoreB += 2;
            if (a.category && desiredCategories.some(cat => a.category.toLowerCase().includes(cat))) scoreA +=1;
            if (b.category && desiredCategories.some(cat => b.category.toLowerCase().includes(cat))) scoreB +=1;
            
            // Penalize being too similar to primary movement patterns if not for hypertrophy
            if (overallGoalType.toLowerCase() !== 'hypertrophy') {
                primaryExercisesOnDay.forEach(pEx => {
                    if(pEx.tags && a.tags && pEx.tags.some(pt => a.tags.includes(pt))) scoreA -=1; // e.g. both 'squat' tag
                    if(pEx.tags && b.tags && pEx.tags.some(pt => b.tags.includes(pt))) scoreB -=1;
                });
            }

            return scoreB - scoreA; // Higher score first
        });

        for (let i = 0; i < Math.min(candidates.length, numAccessories); i++) {
            const chosenEx = candidates[i];
            suggestions.push({
                exerciseId: chosenEx.id,
                exerciseName: chosenEx.name,
                sets: String(setsCount),
                reps: repRange,
                notes: `Accessory for ${overallGoalType.toLowerCase()}`
            });
        }
        // console.log(`PPO Accessory Suggestions for day with primaries [${primaryExercisesOnDay.map(p=>p.name).join(', ')}]:`, suggestions);
        return suggestions;
    }
};

// Make ProgressionPathwayOrchestrator available globally
if (typeof window !== 'undefined') {
    window.ProgressionPathwayOrchestrator = ProgressionPathwayOrchestrator;
}

// For Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressionPathwayOrchestrator;
} 