/**
 * Periodization Engine Module
 * 
 * Contains the core logic for calculating progressions based on different
 * periodization models and their parameters.
 */

// --- Model Definitions (Schemas, Parameters, Defaults) ---

const MODEL_DEFAULTS = {
    linear: {
        incrementValue: 2.5,
        incrementUnit: '%', // or 'kg'
        incrementFrequency: 'weekly', // or 'session'
        // baseLoadMetric: '1rm', // Keep for potential future use?
        // targetExerciseCategory: 'main', // Legacy
        // NEW Params similar to wave
        loadCalculationType: '%', // Can be '%' or 'rpe'
        loadTargets: [75], // Example: Base % or RPE for linear progression
        repsPerSet: [5],   // Example: Fixed reps for linear progression
        useDefined1RM: false, // If true, attempts to use exercise1RMs to calc weight
        exercise1RMs: { "Back Squat": 140, "Bench Press": 90, "Deadlift": 170 },
        deloadFrequency: 0, 
        deloadMethod: 'reduceIntensity', 
        weeklyStructure: [
            { dayOfWeek: 'mon', mainExercise: 'Back Squat', applyProgression: true, sets: 3 },
            { dayOfWeek: 'wed', mainExercise: 'Bench Press', applyProgression: true, sets: 3 },
            { dayOfWeek: 'fri', mainExercise: 'Deadlift', applyProgression: true, sets: 1, assistanceExercises: [{ name: 'Barbell Rows', sets: 3, reps: 8, loadType: 'rpe', loadValue: 7 }] }
        ]
    },
    wave: {
        wavePatternDefinitions: { // NEW: Object holding named wave patterns
            'mainLift': { patternTargets: [75, 80, 85], repsPerStep: [5, 3, 1] },
            'secondary': { patternTargets: [65, 70, 75], repsPerStep: [8, 6, 4] }
        },
        waveLoadType: '%', // NEW: Defines the type of load in wavePattern ('%' or 'rpe')
        waveCycleScope: 'weekly', // NEW: 'weekly' or 'intraWeek'
        incrementValue: 1, // Value to increment base by each cycle
        incrementUnit: '%', // Unit for increment (currently only %)
        incrementFrequency: 'weekly', // How often increment is applied (e.g., after a full wave cycle)
        baseLoadMetric: '1rm', // For %-based, defines what the % is relative to
        useEstimated1RM: false, // If true, attempts to use exercise1RMs to calc weight
        exercise1RMs: { // NEW: User-defined 1RMs (kg or lbs - unit consistency needed)
            "Back Squat": 150, 
            "Bench Press": 100, 
            "Deadlift": 180 
        },
        deloadFrequency: 0, // NEW: How many weeks between deloads (e.g., 4 for every 4th week). 0 disables deloads.
        deloadMethod: 'reduceIntensity', // NEW: 'reduceIntensity', 'reduceVolume', 'skipAssistance'
        targetExerciseCategory: 'main', // Legacy - Use weeklyStructure
        weeklyStructure: [
            {
                dayOfWeek: 'mon',
                mainExercise: 'Back Squat', applyWave: true, applyWavePattern: 'mainLift', setsPerStep: [3, 2, 1],
                assistanceExercises: [
                    { name: 'Leg Press', sets: 3, reps: '8-12', loadType: 'rpe', loadValue: 8, rest: '90s', includeOnSteps: [0, 1] }, 
                    { name: 'Hamstring Curls', sets: 3, reps: '10-15', loadType: 'rpe', loadValue: 7, rest: '60s', includeOnWeeks: [0, 1, 2, 4, 5, 6, 7] } // Example: Skip during week 4 (index 3)
                ]
            },
            {
                dayOfWeek: 'wed',
                mainExercise: 'Bench Press', applyWave: true, applyWavePattern: 'mainLift', sets: 3, // Still uses fixed sets
                assistanceExercises: [
                    { name: 'Overhead Press', sets: 3, reps: '6-10', loadType: '%', loadValue: 65, rest: '90s' },
                    { name: 'Tricep Pushdowns', sets: 3, reps: '10-15', loadType: 'rpe', loadValue: 8, rest: '60s' }
                ]
            },
            {
                dayOfWeek: 'fri',
                mainExercise: 'Deadlift', applyWave: true, applyWavePattern: 'mainLift', setsPerStep: [1, 1, 1], // Example: always 1 set for deadlift wave
                assistanceExercises: [
                    { name: 'Barbell Rows', sets: 4, reps: '8-10', loadType: 'rpe', loadValue: 7, rest: '90s' },
                    { name: 'Lat Pulldowns', sets: 3, reps: '10-12', loadType: 'rpe', loadValue: 8, rest: '60s', includeOnSteps: [0] } // Only on step 0
                ]
            }
        ]
    },
    triphasic: { // NEW MODEL
        phaseLengthWeeks: [2, 2, 2], // Weeks per phase [Eccentric, Isometric, Concentric]
        eccentricFocusParams: { targets: [80], reps: [6] }, 
        isometricFocusParams: { targets: [85], reps: [4] }, 
        concentricFocusParams: { targets: [90], reps: [3] }, 
        loadType: '%', 
        useDefined1RM: false,
        exercise1RMs: { "Back Squat": 150, "Bench Press": 100, "Deadlift": 180 }, // Added Deadlift 1RM
        deloadFrequency: 0, 
        deloadMethod: 'reduceIntensity',
        weeklyStructure: [
            { dayOfWeek: 'mon', mainExercise: 'Back Squat', applyModel: true, sets: 3, stimulusType: 'strength', equipmentType: 'flywheel', inertiaSetting: 'high' }, // Added stimulus + flywheel
            { dayOfWeek: 'wed', mainExercise: 'Bench Press', applyModel: true, sets: 3, stimulusType: 'strength', assistanceExercises: [{ name: 'Pull Ups', sets: 3, reps: 'AMRAP' }] }, // Added stimulus
            { dayOfWeek: 'fri', mainExercise: 'Deadlift', applyModel: true, sets: 1, stimulusType: 'strength' } // Added stimulus
        ]
    },
    // --- NEW MODELS & OVERLAY PARAMS FROM EVIDENCE-BASED UPGRADES ---
    microdose: {
        sessionDurationMin: 15,
        targetQuality: 'speed', // e.g., speed, power, activation
        frequencyPerDay: ['morning', 'afternoon'], // e.g., [morning, afternoon, evening]
        // Base load is very light, focus is frequency/quality
        loadCalculationType: '%',
        loadTargets: [40], // Very low intensity typically
        repsPerSet: [3],
        useDefined1RM: true,
        exercise1RMs: { "Snatch": 100, "Clean & Jerk": 120 },
        weeklyStructure: [ // Structure defines exercises *available* for microdosing
            { dayOfWeek: 'mon', mainExercise: 'Snatch', applyModel: true, sets: 2 }, // Sets here might represent micro-session target sets
            { dayOfWeek: 'tue', mainExercise: 'Clean & Jerk', applyModel: true, sets: 2 },
            { dayOfWeek: 'wed', mainExercise: 'Back Squat', applyModel: true, sets: 2 },
            { dayOfWeek: 'fri', mainExercise: 'Deadlift', applyModel: true, sets: 2 }
            // ... other days
        ]
    },
    apre: {
        repGoal: 6, // 3, 6, or 10 typically
        testSetIndex: 2, // Which set is the rep-out set (0-indexed)
        // Initial load based on % or RPE, but progresses based on rep-out performance
        loadCalculationType: '%',
        initialLoadTarget: 75,
        setsPerWorkout: 3, // Often includes warmups + test sets
        useDefined1RM: true,
        exercise1RMs: { "Back Squat": 150 },
        // State needed: lastWeekPerformance: { repsAchieved: null, weightUsed: null }
        lastWeekPerformance: {}, // Needs to be stored per exercise instance
        weeklyStructure: [
            { dayOfWeek: 'mon', mainExercise: 'Back Squat', applyModel: true, sets: 3 }, // Uses setsPerWorkout internally
            { dayOfWeek: 'wed', mainExercise: 'Bench Press', applyModel: true, sets: 3 },
            { dayOfWeek: 'fri', mainExercise: 'Deadlift', applyModel: true, sets: 3 }
        ]
    },
    block: {
        phases: [
            { name: 'Accumulation', lengthWeeks: 4, modelType: 'linear', modelParams: { /* Linear params here */ incrementValue: 2, loadTargets: [70], repsPerSet: [8] } },
            { name: 'Transmutation', lengthWeeks: 3, modelType: 'wave', modelParams: { /* Wave params */ wavePatternDefinitions: { 'main': { patternTargets: [80, 85, 75], repsPerStep: [5, 3, 5] } } } },
            { name: 'Realization', lengthWeeks: 2, modelType: 'triphasic', modelParams: { /* Triphasic params focusing on concentric */ phaseLengthWeeks: [0,0,2], concentricFocusParams: { targets: [92], reps: [2] } } }
        ],
        exercise1RMs: { "Back Squat": 150, "Bench Press": 100, "Deadlift": 180 },
        useDefined1RM: true, // Delegate to sub-models? Or override here? Let's allow override.
        deloadFrequency: 0, // Deloads might be handled within phases or as separate phases
        deloadMethod: 'reduceIntensity',
        weeklyStructure: [ // Defines which exercises use the *block* progression
            { dayOfWeek: 'mon', mainExercise: 'Back Squat', applyModel: true },
            { dayOfWeek: 'wed', mainExercise: 'Bench Press', applyModel: true },
            { dayOfWeek: 'fri', mainExercise: 'Deadlift', applyModel: true }
            // Sub-models within phases control sets/reps/load based on block phase
        ]
    },
    dupauto: {
        dailyTargets: [ // Example: Mon=Strength, Wed=Hypertrophy, Fri=Power
            { dayOfWeek: 'mon', focus: 'strength', targets: [85], reps: [5] },
            { dayOfWeek: 'wed', focus: 'hypertrophy', targets: [75], reps: [10] },
            { dayOfWeek: 'fri', focus: 'power', targets: [70], reps: [3] } // Power often lower % but high velocity intent
        ],
        loadType: '%',
        useDefined1RM: true,
        exercise1RMs: { "Back Squat": 150, "Bench Press": 100, "Deadlift": 180 },
        // Readiness Input (External)
        readinessScore: 75, // Example: 0-100 scale, fetched externally
        readinessAdjustmentFactor: 0.1, // How much readiness affects load/volume
        weeklyStructure: [ // Applies DUP focus to these exercises
            { dayOfWeek: 'mon', mainExercise: 'Back Squat', applyModel: true, sets: 3 },
             { dayOfWeek: 'wed', mainExercise: 'Bench Press', applyModel: true, sets: 4 },
             { dayOfWeek: 'fri', mainExercise: 'Deadlift', applyModel: true, sets: 5 } // Example: Higher volume on hypertrophy day
        ]
    },
    // --- VBT Overlay Params (Add to relevant models like linear, wave, triphasic) ---
    // Example added to linear defaults:
    /* linear: {
        ...
        useVBT: false,
        velocityTargets: { "Back Squat": 0.5, "Bench Press": 0.4 }, // m/s target for main lifts
        MVT: { "Back Squat": 0.3, "Bench Press": 0.2 }, // Minimal Velocity Threshold (m/s)
        ...
    } */
    // --- END NEW MODELS & OVERLAY PARAMS ---
};

const MODEL_PARAMETER_DEFINITIONS = {
    linear: {
        incrementValue: { label: 'Increment Value', type: 'number', step: 0.5, description: 'Amount to increase load by each week/session.' },
        incrementUnit: { label: 'Increment Unit', type: 'select', options: ['%', 'kg'], description: 'Unit for the increment value.' },
        incrementFrequency: { label: 'Increment Frequency', type: 'select', options: ['weekly', 'session'], description: 'How often to apply the increment.' },
        // NEW Params similar to wave
        loadCalculationType: { label: 'Load Target Type', type: 'select', options: ['%', 'rpe'], description: 'Base load target type (%1RM or RPE).' },
        loadTargets: { label: 'Load Targets', type: 'text', description: 'Comma-sep base targets (e.g., 75 or 7). Linear increment applied to this.' },
        repsPerSet: { label: 'Reps Per Set', type: 'text', description: 'Comma-sep reps per set (e.g., 5).' },
        useDefined1RM: { label: 'Calculate Target Weight?', type: 'select', options: [{value: true, text: 'Yes (Use Defined 1RMs)'}, {value: false, text: 'No (Use %/RPE directly)'}], description: 'If Yes & Type=%, attempts to calc weight from Defined 1RMs.' },
        exercise1RMs: { label: 'Defined 1RMs (JSON)', type: 'textarea', description: 'JSON object mapping exercise names to known 1RM: { \"Back Squat\": 150, ... }.' },
        deloadFrequency: { label: 'Deload Frequency (Weeks)', type: 'number', min: 0, step: 1, description: 'Frequency of deload weeks. 0 to disable.' },
        deloadMethod: { label: 'Deload Method', type: 'select', options: ['reduceIntensity', 'reduceVolume', 'skipAssistance'], description: 'How to execute the deload week.' },
        weeklyStructure: { label: 'Weekly Structure (JSON)', type: 'textarea', description: 'JSON array defining sessions: [{dayOfWeek:"mon", mainExercise:"Back Squat", applyProgression:true, sets:3, assistanceExercises:[...]}, ...].' },
        // VBT Overlay Params (Example for Linear)
        useVBT: { label: 'Use VBT?', type: 'select', options: [{value: true, text: 'Yes'}, {value: false, text: 'No'}], description: 'Override %1RM with Velocity-Based Training targets?' },
        velocityTargets: { label: 'Target Velocities (JSON)', type: 'textarea', description: 'Exercise-specific target mean velocities (m/s): { "Back Squat": 0.5, ... }.' },
        MVT: { label: 'Min Velocity Thresholds (JSON)', type: 'textarea', description: 'Exercise-specific minimal velocity thresholds (m/s): { "Back Squat": 0.3, ... }.' }
    },
    wave: {
         wavePatternDefinitions: { 
             label: 'Wave Pattern Definitions (JSON)', 
             type: 'textarea', 
             description: 'JSON object defining named patterns: { \"mainLift\": { \"patternTargets\": [75,80,85], \"repsPerStep\": [5,3,1] }, ... }' 
         },
         waveLoadType: { label: 'Wave Target Type', type: 'select', options: ['%', 'rpe'], description: 'Specifies if patternTargets are %1RM or RPE.' },
         waveCycleScope: { label: 'Wave Cycle Scope', type: 'select', options: ['weekly', 'intraWeek'], description: 'How wave steps progress (Weekly: Mon=S1, next Mon=S2; IntraWeek: Mon=S1, Wed=S2).' },
         incrementValue: { label: 'Weekly Increment Value', type: 'number', step: 0.5, description: 'Amount to increase base % after each week.' },
         incrementUnit: { label: 'Weekly Increment Unit', type: 'select', options: ['%'], description: 'Unit for the weekly increment (currently % only).' },
         incrementFrequency: { label: 'Increment Frequency', type: 'select', options: ['weekly'], description: 'Increment applied after each week completion.' },
         baseLoadMetric: { label: 'Base Load Metric (% Base)', type: 'select', options: ['1rm'], description: 'Metric used for % calculations (currently %1RM only).' },
         useEstimated1RM: { label: 'Calculate Target Weight?', type: 'select', options: [{value: true, text: 'Yes (Use Defined 1RMs)'}, {value: false, text: 'No (Use %/RPE directly)'}], description: 'If Yes & Type=%, attempts to calc weight from Defined 1RMs.' },
         exercise1RMs: { label: 'Defined 1RMs (JSON)', type: 'textarea', description: 'JSON object mapping exercise names to known 1RM: { \"Back Squat\": 150, ... }.' },
         deloadFrequency: { label: 'Deload Frequency (Weeks)', type: 'number', min: 0, step: 1, description: 'Frequency of deload weeks (e.g., 4 = every 4th week). 0 to disable.' },
         deloadMethod: { label: 'Deload Method', type: 'select', options: ['reduceIntensity', 'reduceVolume', 'skipAssistance'], description: 'How to execute the deload week.' },
         targetExerciseCategory: { label: 'Target Exercises (Legacy)', type: 'select', options: ['main', 'accessory', 'all'], description: 'Which types this applies to (Use Weekly Structure now).' },
         weeklyStructure: { 
             label: 'Weekly Structure (JSON)', 
             type: 'textarea', 
             description: 'JSON array defining sessions: [{..., assistanceExercises:[{name:"Leg Press", ..., includeOnSteps:[0,1], includeOnWeeks:[0,1,2,4,5,6], cluster: true, intraRestSec: 15, useBFR: true, cuffPressure: 60}, ...]}, ...]. Optional includeOnSteps/includeOnWeeks/cluster/BFR for assistance.' // Updated description
         },
         // VBT Overlay Params (Example for Wave)
         useVBT: { label: 'Use VBT?', type: 'select', options: [{value: true, text: 'Yes'}, {value: false, text: 'No'}], description: 'Override %1RM with Velocity-Based Training targets?' },
         velocityTargets: { label: 'Target Velocities (JSON)', type: 'textarea', description: 'Exercise-specific target mean velocities (m/s): { "Back Squat": 0.5, ... }.' },
         MVT: { label: 'Min Velocity Thresholds (JSON)', type: 'textarea', description: 'Exercise-specific minimal velocity thresholds (m/s): { "Back Squat": 0.3, ... }.' }
    },
    triphasic: { // NEW MODEL DEFINITIONS
         phaseLengthWeeks: { label: 'Phase Lengths (Wk)', type: 'text', description: 'Comma-sep weeks per phase [Ecc, Iso, Con] (e.g., 2,2,2).' },
         eccentricFocusParams: { label: 'Eccentric Phase (JSON)', type: 'textarea', description: 'JSON for eccentric targets/reps: { targets: [80], reps: [6] }.' },
         isometricFocusParams: { label: 'Isometric Phase (JSON)', type: 'textarea', description: 'JSON for isometric targets/reps: { targets: [85], reps: [4] }.' },
         concentricFocusParams: { label: 'Concentric Phase (JSON)', type: 'textarea', description: 'JSON for concentric targets/reps: { targets: [90], reps: [3] }.' },
         loadType: { label: 'Load Target Type', type: 'select', options: ['%', 'rpe'], description: 'Specifies if targets are %1RM or RPE.' },
         useDefined1RM: { label: 'Calculate Target Weight?', type: 'select', options: [{value: true, text: 'Yes (Use Defined 1RMs)'}, {value: false, text: 'No (Use %/RPE directly)'}], description: 'If Yes & Type=%, attempts to calc weight from Defined 1RMs.' },
         exercise1RMs: { label: 'Defined 1RMs (JSON)', type: 'textarea', description: 'JSON object mapping exercise names to known 1RM: { \"Back Squat\": 150, ... }.' },
         deloadFrequency: { label: 'Deload Frequency (Weeks)', type: 'number', min: 0, step: 1, description: 'Frequency of deload weeks. 0 to disable.' },
         deloadMethod: { label: 'Deload Method', type: 'select', options: ['reduceIntensity', 'reduceVolume', 'skipAssistance'], description: 'How to execute the deload week.' },
         weeklyStructure: { label: 'Weekly Structure (JSON)', type: 'textarea', description: 'JSON array defining sessions: [{dayOfWeek:"mon", mainExercise:"Back Squat", applyModel:true, sets:3, assistanceExercises:[...]}, ...].' },
         // VBT Overlay Params (Example for Triphasic)
         useVBT: { label: 'Use VBT?', type: 'select', options: [{value: true, text: 'Yes'}, {value: false, text: 'No'}], description: 'Override %1RM with Velocity-Based Training targets?' },
         velocityTargets: { label: 'Target Velocities (JSON)', type: 'textarea', description: 'Exercise-specific target mean velocities (m/s): { "Back Squat": 0.5, ... }.' },
         MVT: { label: 'Min Velocity Thresholds (JSON)', type: 'textarea', description: 'Exercise-specific minimal velocity thresholds (m/s): { "Back Squat": 0.3, ... }.' }
    },
    // --- NEW MODEL DEFINITIONS ---
    microdose: {
        sessionDurationMin: { label: 'Max Session Duration (min)', type: 'number', min: 5, max: 30, step: 5, description: 'Maximum time for each micro-session.' },
        targetQuality: { label: 'Target Quality', type: 'select', options: ['speed', 'power', 'activation', 'technique'], description: 'Primary focus of the micro-sessions.' },
        frequencyPerDay: { label: 'Frequency Per Day', type: 'text', description: 'Comma-sep time slots (e.g., morning,afternoon).' },
        loadCalculationType: { label: 'Load Target Type', type: 'select', options: ['%'], description: 'Base load target type (typically %1RM).' },
        loadTargets: { label: 'Load Targets', type: 'text', description: 'Base load targets (e.g., 40). Very low intensity.' },
        repsPerSet: { label: 'Reps Per Set', type: 'text', description: 'Low reps per set (e.g., 1-3).' },
        useDefined1RM: { label: 'Calculate Target Weight?', type: 'select', options: [{value: true, text: 'Yes (Use Defined 1RMs)'}, {value: false, text: 'No (Use % directly)'}], description: 'If Yes, attempts to calc weight from Defined 1RMs.' },
        exercise1RMs: { label: 'Defined 1RMs (JSON)', type: 'textarea', description: 'JSON object mapping exercise names to known 1RM: { "Snatch": 100, ... }.' },
        weeklyStructure: { label: 'Weekly Structure (JSON)', type: 'textarea', description: 'Defines exercises available for microdosing sessions: [{dayOfWeek:"mon", mainExercise:"Snatch", applyModel:true, sets:2}, ...]. Sets define micro-session target.' }
    },
    apre: {
        repGoal: { label: 'APRE Rep Goal', type: 'select', options: [3, 6, 10], description: 'Target reps for the adjustment set (APRE3, APRE6, APRE10).' },
        testSetIndex: { label: 'Test Set Index', type: 'number', min: 0, step: 1, description: 'Which set (0-indexed) is the max reps test set.' },
        loadCalculationType: { label: 'Initial Load Type', type: 'select', options: ['%', 'rpe'], description: 'How the starting weight is determined before APRE adjustments take over.' },
        initialLoadTarget: { label: 'Initial Load Target', type: 'number', description: 'Starting % or RPE value for the first week.' },
        setsPerWorkout: { label: 'Sets Per Workout', type: 'number', min: 2, step: 1, description: 'Total sets including warmups and test set.' },
        useDefined1RM: { label: 'Calculate Initial Weight?', type: 'select', options: [{value: true, text: 'Yes (Use Defined 1RMs)'}, {value: false, text: 'No (Use %/RPE directly)'}], description: 'If Yes & Type=%, attempts to calc initial weight from Defined 1RMs.' },
        exercise1RMs: { label: 'Defined 1RMs (JSON)', type: 'textarea', description: 'JSON object mapping exercise names to known 1RM: { "Back Squat": 150, ... }.' },
        lastWeekPerformance: { label: 'Last Week Performance (Internal)', type: 'textarea', description: 'Internal state - holds reps achieved/weight used for adjustment calculation.', readonly: true },
        weeklyStructure: { label: 'Weekly Structure (JSON)', type: 'textarea', description: 'JSON array defining exercises using APRE: [{dayOfWeek:"mon", mainExercise:"Back Squat", applyModel:true, sets:3}, ...]. Sets defined here may be overridden by APRE logic.' }
    },
    block: {
        phases: { label: 'Phases (JSON)', type: 'textarea', description: 'Array defining block phases: [{name:"Accumulation", lengthWeeks:4, modelType:"linear", modelParams:{...}}, ...].' },
        exercise1RMs: { label: 'Defined 1RMs (JSON)', type: 'textarea', description: 'JSON object mapping exercise names to known 1RM (can override sub-models): { "Back Squat": 150, ... }.' },
        useDefined1RM: { label: 'Calculate Weight?', type: 'select', options: [{value: true, text: 'Yes (Use Defined 1RMs)'}, {value: false, text: 'No (Use %/RPE directly)'}], description: 'If Yes & Type=%, attempts to calc weight from Defined 1RMs (overrides sub-models).' },
        deloadFrequency: { label: 'Deload Frequency (Weeks)', type: 'number', min: 0, step: 1, description: 'Frequency of deload weeks (0 to disable, may be phase-specific).' },
        deloadMethod: { label: 'Deload Method', type: 'select', options: ['reduceIntensity', 'reduceVolume', 'skipAssistance'], description: 'How to execute the deload week.' },
        weeklyStructure: { label: 'Weekly Structure (JSON)', type: 'textarea', description: 'JSON array defining exercises governed by the block phases: [{dayOfWeek:"mon", mainExercise:"Back Squat", applyModel:true}, ...]. Sets/reps/load determined by the active phase model.' }
    },
    dupauto: {
        dailyTargets: { label: 'Daily Undulating Targets (JSON)', type: 'textarea', description: 'Array defining focus/targets/reps per day: [{dayOfWeek:"mon", focus:"strength", targets:[85], reps:[5]}, ...].' },
        loadType: { label: 'Load Target Type', type: 'select', options: ['%', 'rpe'], description: 'Specifies if targets are %1RM or RPE.' },
        useDefined1RM: { label: 'Calculate Target Weight?', type: 'select', options: [{value: true, text: 'Yes (Use Defined 1RMs)'}, {value: false, text: 'No (Use %/RPE directly)'}], description: 'If Yes & Type=%, attempts to calc weight from Defined 1RMs.' },
        exercise1RMs: { label: 'Defined 1RMs (JSON)', type: 'textarea', description: 'JSON object mapping exercise names to known 1RM: { "Back Squat": 150, ... }.' },
        readinessScore: { label: 'Readiness Score (External)', type: 'number', min: 0, max: 100, step: 1, description: 'External input (0-100) adjusting daily load/volume.', readonly: true },
        readinessAdjustmentFactor: { label: 'Readiness Adjustment Factor', type: 'number', min: 0, max: 1, step: 0.05, description: 'Sensitivity of load/volume adjustment to readiness score.' },
        weeklyStructure: { label: 'Weekly Structure (JSON)', type: 'textarea', description: 'JSON array defining exercises using DUP: [{dayOfWeek:"mon", mainExercise:"Back Squat", applyModel:true, sets:3}, ...].' }
    }
     // Add definitions for other models...
};

/**
 * Returns the default parameter set for a given model type.
 * @param {string} type - The model type (e.g., "linear").
 * @returns {object|null} The default parameters or null if type is unknown.
 */
export function getModelDefaults(type) {
    console.log(`[Engine] Getting defaults for type: ${type}`);
    // --- DEBUG LOG --- 
    console.log('[Engine Debug] Available model keys:', Object.keys(MODEL_DEFAULTS));
    console.log('[Engine Debug] Requested type lowercased:', type.toLowerCase());
    console.log('[Engine Debug] Result for requested type:', MODEL_DEFAULTS[type.toLowerCase()]);
    // --- END DEBUG LOG ---
    return MODEL_DEFAULTS[type.toLowerCase()] || null;
}

/**
 * Returns metadata about parameters for a type (label, type, validation rules, description).
 * Used by Inspector Config Tab (Phase 7).
 * @param {string} type - The model type (e.g., "linear").
 * @returns {object} Parameter definitions keyed by parameter name.
 */
export function getModelParameterDefinitions(type) {
    console.log(`[Engine] Getting parameter definitions for type: ${type}`);
     // Add common parameters needed for interference checks if not already present
     const definitions = MODEL_PARAMETER_DEFINITIONS[type.toLowerCase()] || {};
     // Example: Add stimulusType to weeklyStructure description globally (or per model)
     if (definitions.weeklyStructure && definitions.weeklyStructure.description) {
         if (!definitions.weeklyStructure.description.includes('stimulusType')) {
            definitions.weeklyStructure.description += ' Add stimulusType: \"strength\"|\"endurance\".';
         }
         // Example: Add equipmentType to assistance description globally (or per model)
          if (definitions.weeklyStructure.description.includes('assistanceExercises') && !definitions.weeklyStructure.description.includes('equipmentType')) {
              definitions.weeklyStructure.description = definitions.weeklyStructure.description.replace('assistanceExercises:[{', 'assistanceExercises:[{equipmentType:\"flywheel\", inertiaSetting:\"medium\", ..., ');
          }
     }
     // Add specific model definitions as before
     return definitions;
}

/**
 * Returns a list of available model type identifiers.
 * @returns {string[]} Array of model type strings.
 */
export function getAvailableModelTypes() {
    return Object.keys(MODEL_DEFAULTS);
}


// --- Core Calculation Logic ---

/**
 * Calculates the specific exercises, sets, reps, load details, etc., 
 * for a given day based on the model rules.
 * 
 * @param {object} modelInstance - The full model instance object { type, params, scope }.
 * @param {number} weekIndex - The 0-based week index for the calculation.
 * @param {string} dayOfWeek - The lowercase 3-letter day abbreviation (e.g., "mon").
 * @returns {Array<object>} An array of objects, each representing a workout card: 
 *                          { exerciseName: string, detailsString: string, load: number, 
 *                            sets: number|string, reps: number|string, loadType: string, 
 *                            loadValue: number|string, rest: string, ... }
 */
export function calculateExercisesForDay(modelInstance, weekIndex, dayOfWeek) {
    console.log(`[Engine] Calculating exercises for ${modelInstance.type} - Week ${weekIndex + 1} - Day ${dayOfWeek}`);
    const { type, params, scope } = modelInstance; // Include scope for stateful models
    let exercises = [];
    let isDeloadWeek = false; // Default deload status

    // --- Interference Check Placeholder ---
    // This check ideally runs *before* calculating the day's load/intensity,
    // or within simulation functions that have broader context.
    // It needs access to adjacent session data (type, timing).
    const currentDayStructure = params.weeklyStructure?.find(entry => entry.dayOfWeek === dayOfWeek);
    const currentStimulusType = currentDayStructure?.stimulusType; // 'strength' or 'endurance'
    let interferenceModifier = 1.0; // Default: no modification
    // Placeholder logic:
    // if (currentStimulusType === 'strength') {
    //      const previousSession = getPreviousSessionData(scope, weekIndex, dayOfWeek); // Needs helper
    //      if (previousSession?.type === 'endurance' && timeSince(previousSession) < (params.minHoursBetweenStimuli || 8)) {
    //          console.log("[Engine Interference] Potential strength decrement due to recent endurance work.");
    //          interferenceModifier = 0.95; // Example: Reduce intensity by 5%
    //      }
    // } else if (currentStimulusType === 'endurance') {
    //      const previousSession = getPreviousSessionData(scope, weekIndex, dayOfWeek); // Needs helper
    //      if (previousSession?.type === 'strength' && timeSince(previousSession) < (params.minHoursBetweenStimuli || 8)) {
    //          console.log("[Engine Interference] Potential endurance performance impact due to recent strength work.");
    //          // May reduce duration/intensity or flag it
    //          // interferenceModifier = 0.9;
    //      }
    // }
    // --- End Interference Check Placeholder ---


    // --- Auto-Deload Check (via Monotony/Strain) - Runs before model-specific logic ---
    // Placeholder: Needs access to rolling daily load data (e.g., from modelInstance.scope or external source)
    // const dailyLoadHistory = scope?.dailyLoadHistory || []; // Example: Get last 7 days load
    // if (dailyLoadHistory.length >= 7) {
    //     try {
    //         const { monotony, strain } = calcMonotonyStrain(dailyLoadHistory); // Needs helper function
    //         if (monotony > 2.0 || strain > /* Some threshold */) {
    //             isDeloadWeek = true;
    //             console.log(`[Engine] Auto-Deload Triggered! Monotony: ${monotony.toFixed(2)}, Strain: ${strain.toFixed(2)}. Applying deload: ${params.deloadMethod || 'reduceIntensity'}`);
    //         }
    //     } catch (error) {
    //         console.warn("[Engine] Error calculating Monotony/Strain for auto-deload:", error);
    //     }
    // }
    // --- End Auto-Deload Check ---

    // --- Standard Deload Frequency Check (only if auto-deload didn't trigger) ---
    if (!isDeloadWeek) {
        const standardDeloadFreq = parseInt(params.deloadFrequency, 10);
        if (standardDeloadFreq > 0 && (weekIndex + 1) % standardDeloadFreq === 0) {
            isDeloadWeek = true;
            console.log(`[Engine] Standard Deload: Week ${weekIndex + 1}: Applying deload (${params.deloadMethod || 'reduceIntensity'})`);
        }
    }
    // --- End Standard Deload Check ---

    // Find the calculator function for the model type
    const calculatorFn = MODEL_CALCULATORS[type.toLowerCase()];

    if (calculatorFn && typeof calculatorFn === 'function') {
        try {
            // Call the specific model's calculation function
            exercises = calculatorFn(modelInstance, weekIndex, dayOfWeek, isDeloadWeek);
        } catch (error) {
            console.error(`[Engine] Error running calculator for model type ${type}:`, error);
            exercises.push({
                exerciseName: `Error (${type})`,
                detailsString: `Calculation failed for ${dayOfWeek} Wk ${weekIndex+1}`,
                load: 0,
                sets: '!', reps: '!', loadType: 'text', loadValue: 'Error', rest: 'N/A'
            });
        }
    } else {
        // Fallback for unknown model types
        console.warn(`[Engine] Calculation logic not implemented for model type: ${type}`);
        exercises.push({
             exerciseName: `Placeholder (${type})`,
             detailsString: `Wk ${weekIndex + 1}, ${dayOfWeek} - No Logic`,
             load: 100,
             sets: '?', reps: '?', loadType: 'text', loadValue:'N/A', rest: 'N/A'
         });
    }

    // Apply interference modifications if necessary (this is a simple example)
    if (interferenceModifier < 1.0) {
        console.log(`[Engine Interference] Applying modifier: ${interferenceModifier}`);
        exercises = exercises.map(ex => {
            let modifiedEx = { ...ex };
            if (modifiedEx.loadType === '%') {
                modifiedEx.loadValue = Math.round(modifiedEx.loadValue * interferenceModifier);
                modifiedEx.detailsString += ` (Interference Mod: x${interferenceModifier.toFixed(2)})`;
            } else if (modifiedEx.loadType === 'weight') {
                 modifiedEx.loadValue = Math.round(modifiedEx.loadValue * interferenceModifier);
                 modifiedEx.detailsString += ` (Interference Mod: x${interferenceModifier.toFixed(2)})`;
            } else if (modifiedEx.loadType === 'rpe' && interferenceModifier < 0.98) { // Only modify RPE if significant interference
                 modifiedEx.loadValue = Math.max(5, modifiedEx.loadValue - 1); // Example: Drop RPE by 1
                 modifiedEx.detailsString += ` (Interference Mod: RPE -1)`;
            }
            // Re-estimate load?
            modifiedEx.load = Math.round(modifiedEx.load * interferenceModifier); // Simple load scaling
            return modifiedEx;
        });
    }

    console.log(`[Engine] Calculated exercises for ${dayOfWeek} Wk ${weekIndex+1}:`, exercises);
    return exercises;
}


// --- Projection & Simulation Logic ---

/**
 * Calculates future values based on the model instance.
 * @param {string} instanceId - The ID of the model instance.
 * @param {number} startWeekIndex - The 0-based week index to start projecting from.
 * @param {number} numWeeksToProject - How many weeks into the future to project.
 * @returns {Array<object>} An array of projected data points, similar to calculateExercisesForDay output, 
 *                          but potentially aggregated or focused on key metrics. 
 *                          Includes { week: weekIndex, day: dayOfWeek, ... }
 */
export function getProjectionData(instanceId, startWeekIndex, numWeeksToProject) {
    console.log(`[Engine] Projecting data for instance ${instanceId}, starting week ${startWeekIndex}, for ${numWeeksToProject} weeks.`);
    // Need access to the model instance - this might require passing it in or using the Manager
    // For now, assume we can get it (or refactor later)
    // const modelInstance = PeriodizationModelManager.getModelInstance(instanceId); // This won't work here directly
    
    // Placeholder: Need to fetch modelInstance properly
    // Let's assume a placeholder instance for now
    const modelInstance = { 
        type: 'linear', 
        params: { incrementValue: 2.5, incrementUnit: '%' },
        scope: { targetDaysOfWeek: ['mon', 'wed', 'fri']} // Example scope
    }; // <<< Replace with actual fetch logic later
    
    if (!modelInstance) {
        console.error(`[Engine] Cannot get projection data: Model instance ${instanceId} not found.`);
        return [];
    }

    const projection = [];
    const endWeekIndex = startWeekIndex + numWeeksToProject - 1;

    for (let week = startWeekIndex; week <= endWeekIndex; week++) {
        // Iterate through days defined in the model's scope
        modelInstance.scope.targetDaysOfWeek.forEach(day => {
            try {
                const dailyExercises = calculateExercisesForDay(modelInstance, week, day);
                dailyExercises.forEach(ex => {
                    projection.push({
                        week: week, 
                        day: day,
                        ...ex // Spread the calculated exercise data
                    });
                });
            } catch (error) {
                console.error(`[Engine] Error calculating projection for Wk ${week}, Day ${day}:`, error);
                // Skip this day/week on error?
            }
        });
    }
    console.log(`[Engine] Generated projection:`, projection);
    return projection;
}

/**
 * Simulates the impact of changing model parameters.
 * @param {string} instanceId - ID of the model instance.
 * @param {string} dayIdContext - A day ID within the affected scope (for context).
 * @param {object} newParams - The proposed new parameters.
 * @param {string} scope - The scope of the change ('day', 'week', 'all').
 * @returns {object} An object describing the simulated impact (e.g., { changes: [], summary: string }).
 */
export function simulateParameterChange(instanceId, dayIdContext, newParams, scope) {
    console.log(`[Engine] Simulating parameter change for ${instanceId}`, { newParams, scope, dayIdContext });
    // TODO: Implement simulation logic
    // 1. Get current model instance.
    // 2. Determine all affected dayIds based on scope and dayIdContext.
    // 3. For each affected dayId:
    //    a. Calculate exercises with CURRENT params.
    //    b. Calculate exercises with NEW params.
    //    c. Compare results and record differences (load changes, exercise changes).
    // 4. Aggregate differences and generate a summary message.
    return { 
        summary: "Simulation: Parameter change impact calculation not yet implemented.",
        changes: [] 
    };
}

/**
 * Simulates the impact of swapping the model for a day/week/scope.
 * @param {string} instanceId - ID of the current model instance.
 * @param {string} dayIdContext - A day ID within the affected scope.
 * @param {string} newModelType - The type of the new model to swap to.
 * @param {string} scope - The scope of the swap ('day', 'week').
 * @returns {object} An object describing the simulated impact.
 */
export function simulateModelSwap(instanceId, dayIdContext, newModelType, scope) {
     console.log(`[Engine] Simulating model swap for ${instanceId} to ${newModelType}`, { scope, dayIdContext });
    // TODO: Implement simulation logic
    // 1. Get current model instance.
    // 2. Get DEFAULTS for the newModelType. (Need user input for params later).
    // 3. Determine affected dayIds based on scope and dayIdContext.
    // 4. For each affected dayId:
    //    a. Calculate exercises with CURRENT model/params.
    //    b. Calculate exercises with NEW model/params (using defaults for now).
    //    c. Compare results and record differences.
    // 5. Aggregate differences and generate summary.
     return { 
        summary: "Simulation: Model swap impact calculation not yet implemented.",
        changes: [] 
    };
  }

// --- Helper Functions (Internal to Engine) ---

/**
 * Calculates Mean of an array of numbers.
 */
function calculateMean(data) {
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, value) => sum + value, 0) / data.length;
}

/**
 * Calculates Standard Deviation of an array of numbers.
 */
function calculateStdDev(data) {
    if (!data || data.length < 2) return 0;
    const mean = calculateMean(data);
    const variance = data.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (data.length - 1); // Sample StDev
    return Math.sqrt(variance);
}

/**
 * Calculates Training Monotony and Strain based on the last 7 days of load.
 * Monotony = Weekly Mean Load / Weekly Standard Deviation of Load
 * Strain = Weekly Total Load * Monotony
 * @param {number[]} last7DaysLoad - Array of the last 7 daily load scores.
 * @returns {{monotony: number, strain: number, mean: number, stdDev: number, total: number}}
 */
function calcMonotonyStrain(last7DaysLoad) {
    if (!last7DaysLoad || last7DaysLoad.length < 7) {
        // console.warn("[calcMonotonyStrain] Insufficient data:", last7DaysLoad);
        return { monotony: 0, strain: 0, mean: 0, stdDev: 0, total: 0 };
    }
    const weekData = last7DaysLoad.slice(-7); // Ensure only last 7 days
    const mean = calculateMean(weekData);
    const stdDev = calculateStdDev(weekData);
    const total = weekData.reduce((sum, value) => sum + value, 0);
    const monotony = stdDev > 0 ? mean / stdDev : 0; // Avoid division by zero
    const strain = total * monotony;
    return { monotony, strain, mean, stdDev, total };
}

/**
 * Estimates load (kg) based on target velocity using a simplified linear model.
 * Assumes a linear drop in velocity from unloaded (e.g., 1.0 m/s) to 1RM velocity (e.g., MVT).
 * Needs user's 1RM for the exercise.
 * @param {string} exerciseName - For logging.
 * @param {number} targetVelocity - The desired mean velocity (m/s).
 * @param {number} mvt - Minimal Velocity Threshold (estimated velocity at 1RM) (m/s).
 * @param {number} user1RM - The user's known 1RM in kg for the exercise.
 * @param {number} [unloadedVelocity=1.0] - Estimated velocity with minimal load (m/s).
 * @returns {number|null} Estimated load in kg, or null if inputs are invalid.
 */
function estimateLoadFromVelocity(exerciseName, targetVelocity, mvt, user1RM, unloadedVelocity = 1.0) {
    if (!targetVelocity || !mvt || !user1RM || targetVelocity <= mvt || targetVelocity >= unloadedVelocity || mvt >= unloadedVelocity || user1RM <= 0) {
        console.warn(`[estimateLoadFromVelocity] Invalid inputs for ${exerciseName}:`, { targetVelocity, mvt, user1RM, unloadedVelocity });
        return null;
    }
    // Linear interpolation: %1RM = 100 * (unloadedVel - targetVel) / (unloadedVel - mvt)
    const percent1RM = 100 * (unloadedVelocity - targetVelocity) / (unloadedVelocity - mvt);
    const estimatedLoad = Math.round(user1RM * (percent1RM / 100)); // Round to nearest kg
    // console.log(`[estimateLoadFromVelocity] ${exerciseName}: Target ${targetVelocity}m/s (MVT ${mvt}m/s, 1RM ${user1RM}kg) -> ${percent1RM.toFixed(1)}% -> ${estimatedLoad}kg`);
    return estimatedLoad > 0 ? estimatedLoad : null; // Return null if calculation results in non-positive load
}


/**
 * Looks up the load adjustment for APRE based on reps achieved in the test set.
 * Uses simple adjustment rules, not a complex table.
 * @param {number} repGoal - The target reps for the model (e.g., 3, 6, 10).
 * @param {number} repsAchieved - The number of reps completed in the test set.
 * @param {number} currentWeightKg - The weight used for the test set.
 * @returns {number} The adjusted weight in kg for the *next* session.
 */
function lookupApreAdjustment(repGoal, repsAchieved, currentWeightKg) {
     let adjustmentKg = 0;
     const diff = repsAchieved - repGoal;

    // Simple adjustment logic (can be refined based on specific APRE tables)
    if (diff >= 4) { adjustmentKg = 5; } // Significantly exceeded goal
    else if (diff >= 2) { adjustmentKg = 2.5; } // Exceeded goal
    else if (diff >= 0) { adjustmentKg = 0; } // Met goal exactly or by 1
    else if (diff === -1) { adjustmentKg = -2.5; } // Missed by 1
    else if (diff <= -2) { adjustmentKg = -5.0; } // Missed by 2+

    const nextWeight = Math.max(20, currentWeightKg + adjustmentKg); // Ensure weight doesn't go below a minimum (e.g., 20kg)
    console.log(`[lookupApreAdjustment] Goal: ${repGoal}, Achieved: ${repsAchieved} @ ${currentWeightKg}kg. Adjustment: ${adjustmentKg}kg. Next Weight: ${nextWeight}kg`);
    return nextWeight;
  }

// --- Model-Specific Calculation Helpers ---

function _calculateLinearDay(modelInstance, weekIndex, dayOfWeek, isDeloadWeek) {
    const { params, scope } = modelInstance;
    let exercises = [];
    const linearStructureEntry = params.weeklyStructure?.find(entry => entry.dayOfWeek === dayOfWeek);

    if (linearStructureEntry && linearStructureEntry.mainExercise) {
        const exerciseName = linearStructureEntry.mainExercise;
        let sets = linearStructureEntry.sets || 3; // Default to 3 for linear?

        if (linearStructureEntry.applyProgression === true) {
            // --- Core Linear Calculation ---
            const baseTarget = params.loadTargets?.[0] || (params.loadCalculationType === 'rpe' ? 7 : 75);
            const baseReps = params.repsPerSet?.[0] || 5;
            const incrementValue = params.incrementValue || (params.loadCalculationType === 'rpe' ? 0 : 2.5); // No RPE increment default
            const incrementUnit = params.incrementUnit || '%';

            let currentTarget = baseTarget;
            // Apply increment based on frequency (only weekly for now)
            if (params.incrementFrequency === 'weekly') {
                if (incrementUnit === '%') {
                    currentTarget = baseTarget + (incrementValue * weekIndex);
                } else if (incrementUnit === 'kg') {
                    // If incrementing by weight, add it directly. Assumes baseTarget is also weight.
                     // This needs refinement if base is % and increment is kg.
                     currentTarget = baseTarget + (incrementValue * weekIndex);
                }
            } // TODO: Add 'session' frequency logic if needed

            let loadType = params.loadCalculationType || '%';
            let loadValue = currentTarget;
            let detailsString = ``;
            let estimatedLoad = 100;

            // --- Apply Deload Modifications --- 
            if (isDeloadWeek) {
                if (params.deloadMethod === 'reduceIntensity') {
                     if (loadType === '%') loadValue = Math.round(loadValue * 0.8);
                     else if (loadType === 'rpe') loadValue = Math.max(5, loadValue - 2);
                } else if (params.deloadMethod === 'reduceVolume') {
                    sets = Math.max(1, Math.round(sets * 0.6));
                }
            }
            // --- End Deload Modifications ---
            
            // --- Calculate Weight from 1RM if needed --- 
            let targetWeight = null;
            if (loadType === '%' && params.useDefined1RM === true) {
                const user1RM = params.exercise1RMs?.[exerciseName];
                if (user1RM && typeof user1RM === 'number' && user1RM > 0) {
                    targetWeight = Math.round(user1RM * (loadValue / 100));
                    loadType = 'weight';
                    loadValue = targetWeight;
                    detailsString = `${sets}x${baseReps} @ ${targetWeight}kg`;
                    estimatedLoad = (targetWeight * sets * baseReps) * 0.1;
                } else {
                    detailsString = `${sets}x${baseReps} @ ${loadValue}% (1RM not found)`;
                    estimatedLoad = 100 * (loadValue / 100) * sets * baseReps;
                }
            } else if (loadType === 'rpe') {
                detailsString = `${sets}x${baseReps} @ RPE ${loadValue}`;
                estimatedLoad = 100 + (loadValue * 10) + (baseReps * sets * 5);
            } else { // Default to % or direct weight if unit was kg
                 detailsString = `${sets}x${baseReps} @ ${loadValue}${loadType === '%' ? '%' : (incrementUnit === 'kg' ? 'kg' : '?')}`;
                 if (loadType === '%') {
                    estimatedLoad = 100 * (loadValue / 100) * sets * baseReps;
                 } else { // Assume it's weight
                     estimatedLoad = (loadValue * sets * baseReps) * 0.1;
                 }
            }

            // --- VBT OVERLAY CHECK ---
            if (params.useVBT === true && (loadType === '%' || targetWeight !== null)) { // Check if VBT enabled and load *could* be VBT-based
                 const targetVelocity = params.velocityTargets?.[exerciseName];
                 const mvt = params.MVT?.[exerciseName];
                 const user1RM = params.exercise1RMs?.[exerciseName]; // Need 1RM
                 if (targetVelocity && mvt && user1RM) {
                     const vbtLoadKg = estimateLoadFromVelocity(exerciseName, targetVelocity, mvt, user1RM);
                     if (vbtLoadKg) {
                         loadType = 'weight'; // Change type to weight
                         loadValue = vbtLoadKg;
                         detailsString = `${sets}x${baseReps} @ ${targetVelocity} m/s (${vbtLoadKg}kg)`; // Update details
                         estimatedLoad = (vbtLoadKg * sets * baseReps) * 0.1; // Re-estimate load
                         console.log(`[Engine VBT Linear] Overriding with VBT for ${exerciseName}: Target Vel ${targetVelocity} m/s -> Load ${vbtLoadKg}kg`);
                     } else {
                         detailsString += ` (VBT Failed)`;
                         console.warn(`[Engine VBT Linear] Could not determine VBT load for ${exerciseName}.`);
                     }
                 } else {
                    detailsString += ` (VBT Config Missing)`;
                     console.warn(`[Engine VBT Linear] VBT enabled, but targetVelocity, MVT, or 1RM not found for ${exerciseName}.`);
                 }
            }
            // --- END VBT OVERLAY CHECK ---

            // Generate card for the main linear exercise
            exercises.push({
                exerciseName: exerciseName,
                id: exerciseId, // <<< ADDED ID FIELD >>>
                sets: sets,
                reps: baseReps,
                loadType: loadType,
                loadValue: loadValue,
                detailsString: detailsString,
                load: Math.round(estimatedLoad),
                rest: '120s' // Default rest
            });

        } else {
            // Handle case where progression is not applied (e.g., fixed exercise)
            // Apply volume deload if needed
            if (isDeloadWeek && params.deloadMethod === 'reduceVolume') {
                sets = Math.max(1, Math.round(sets * 0.6));
            }
            exercises.push({
                exerciseName: exerciseName,
                sets: sets, reps: '5', loadType: 'rpe', loadValue: 7,
                detailsString: `${sets}x5 @ RPE 7`, load: 150, rest: '90s'
            });
        }

        // --- Generate Assistance Exercises --- 
        if (Array.isArray(linearStructureEntry.assistanceExercises) && !(isDeloadWeek && params.deloadMethod === 'skipAssistance')) {
            linearStructureEntry.assistanceExercises.forEach(assistEx => {
                // Basic generation, no week/step conditions needed for linear assistance typically
                let includeThisExercise = true;
                 // Add includeOnWeeks check if needed in future for linear
                 // if (includeThisExercise && assistEx.includeOnWeeks && Array.isArray(assistEx.includeOnWeeks)) { ... }

                if (includeThisExercise) {
                    let assistSets = assistEx.sets || 3;
                    let assistLoadType = assistEx.loadType || 'rpe';
                    let assistLoadValue = assistEx.loadValue || 7;

                     // Apply Deload Modifications (Assistance)
                     if (isDeloadWeek) {
                         if (params.deloadMethod === 'reduceIntensity') {
                             if (assistLoadType === '%') assistLoadValue = Math.round(assistLoadValue * 0.8);
                             else if (assistLoadType === 'rpe') assistLoadValue = Math.max(5, assistLoadValue - 2);
                         }
                         if (params.deloadMethod === 'reduceVolume') {
                             assistSets = Math.max(1, Math.round(assistSets * 0.6));
                         }
                     }

                    // Generate card (similar to wave assistance)
                    const assistReps = assistEx.reps || '10';
                    const assistRest = assistEx.rest || '60s';
                    let assistDetailsString = `${assistSets}x${assistReps}`;
                    if (assistLoadType === 'rpe') assistDetailsString += ` @ RPE ${assistLoadValue}`;
                    else if (assistLoadType === '%') assistDetailsString += ` @ ${assistLoadValue}%`;
                    else if (assistLoadType === 'weight') assistDetailsString += ` @ ${assistLoadValue}kg`;

                    // --- BFR Modification (Assistance) ---
                     if (assistEx.useBFR === true) {
                         const cuffPressure = assistEx.cuffPressure || 60;
                         assistDetailsString += ` (BFR @ ${cuffPressure}mmHg)`;
                         // Real BFR would likely override load based on estimated 1RM
                         // const estimatedAssist1RM = scope?.exercise1RMs?.[assistEx.name] || estimate1RM(...); // Need 1RM
                         // if (estimatedAssist1RM) { assistLoadType = 'weight'; assistLoadValue = Math.round(estimatedAssist1RM * 0.35); }
                     }
                     // --- End BFR Modification ---

                     // --- Cluster Set Modification (Assistance) ---
                     if (assistEx.cluster === true) {
                         const intraRest = assistEx.intraRestSec || 15;
                         assistDetailsString = `${assistSets} x (${assistReps}) Cluster / ${intraRest}s intra-rest`;
                         // Add load info back if needed:
                         if (assistLoadType === 'rpe') assistDetailsString += ` @ RPE ${assistLoadValue}`;
                         else if (assistLoadType === '%') assistDetailsString += ` @ ${assistLoadValue}%`;
                         else if (assistLoadType === 'weight') assistDetailsString += ` @ ${assistLoadValue}kg`;
                         // Apply BFR tag *after* cluster string if both are true
                         if (assistEx.useBFR === true) assistDetailsString += ` (BFR @ ${assistEx.cuffPressure || 60}mmHg)`;
                     }
                     // --- End Cluster Set Modification ---

                    // --- Flywheel Modification (Assistance) ---
                    let estimatedAssistLoad = 50;
                    if (assistEx.equipmentType === 'flywheel') {
                        const inertiaSetting = assistEx.inertiaSetting || 'medium';
                        assistDetailsString = `${assistSets}x${assistReps} Flywheel (${inertiaSetting})`;
                        assistLoadType = 'flywheel';
                        assistLoadValue = inertiaSetting;
                        estimatedAssistLoad = 150 + (assistSets * parseInt(String(assistReps).split('-')[0], 10) * 5); // Placeholder
                        console.log(`[Engine Flywheel Assist Linear] Using Flywheel for ${assistEx.name}. Inertia: ${inertiaSetting}`);
                    } else {
                        // Rough load estimation (if not flywheel)
                        estimatedAssistLoad = 50 + (assistSets * 10) + (parseInt(String(assistReps).split('-')[0], 10) * 5);
                        if (assistLoadType === 'rpe') estimatedAssistLoad += assistLoadValue * 5;
                        if (assistLoadType === '%') estimatedAssistLoad *= (assistLoadValue / 75);
                        if (assistLoadType === 'weight') estimatedAssistLoad += assistLoadValue;
                    }
                    // --- End Flywheel Modification ---

                    // <<< ADDED: Look up Assistance Exercise ID >>>
                    let assistanceExerciseId = null;
                    if (library && Array.isArray(library)) {
                        const foundAssistExercise = library.find(ex => ex.name?.toLowerCase() === assistEx.name?.toLowerCase()); // Use assistEx.name here
                        if (foundAssistExercise) {
                            assistanceExerciseId = foundAssistExercise.id;
                        } else {
                            console.warn(`[Engine Linear] Assistance exercise "${assistEx.name}" not found in provided library.`);
                        }
                    } // Library warning handled above
                     // <<< END ADDED >>>

                    exercises.push({
                        exerciseName: assistEx.name || 'Assistance Exercise',
                        id: assistanceExerciseId, // <<< ADDED ID FIELD >>>
                        sets: assistSets, reps: assistReps, loadType: assistLoadType,
                        loadValue: assistLoadValue, detailsString: assistDetailsString,
                        load: Math.round(estimatedAssistLoad), rest: assistRest
                    });
                }
            });
        }
        // --- End Assistance Exercises ---
    } else {
         console.log(`[Engine Linear] No structure defined for ${dayOfWeek}`);
    }
    return exercises;
}

function _calculateWaveDay(modelInstance, weekIndex, dayOfWeek, isDeloadWeek) {
    const { params, scope } = modelInstance;
    let exercises = [];
    const structureEntry = params.weeklyStructure?.find(entry => entry.dayOfWeek === dayOfWeek);

    if (structureEntry && structureEntry.mainExercise) {
        const exerciseName = structureEntry.mainExercise;
        let setsToPerform;

        if (structureEntry.applyWave === true) {
            // --- Core Wave Calculation ---
            const patternName = structureEntry.applyWavePattern || Object.keys(params.wavePatternDefinitions || {})[0] || 'default';
            const patternDefinition = params.wavePatternDefinitions?.[patternName];

            if (!patternDefinition) {
                console.warn(`[Engine Wave] Wave pattern definition "${patternName}" not found. Skipping wave calculation for ${exerciseName}.`);
                return []; // Skip day if main wave fails
            }

            const currentPatternTargets = structureEntry.overridePatternTargets || patternDefinition.patternTargets || [];
            const currentRepsPerStep = structureEntry.overrideRepsPerStep || patternDefinition.repsPerStep || [];
            const patternLength = currentPatternTargets.length || 1;

            let stepIndexWave;
            if (params.waveCycleScope === 'intraWeek') {
                const waveDaysInOrder = params.weeklyStructure
                    ?.filter(d => d.applyWave === true)
                    .map(d => d.dayOfWeek) || [];
                const dayOrder = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };
                waveDaysInOrder.sort((a, b) => (dayOrder[a] || 8) - (dayOrder[b] || 8));
                const dayIndexInWaveCycle = waveDaysInOrder.indexOf(dayOfWeek);
                if (dayIndexInWaveCycle !== -1) {
                    stepIndexWave = dayIndexInWaveCycle % patternLength;
                } else {
                    console.warn(`[Engine Wave] IntraWeek scope: Could not find day ${dayOfWeek} in waveDaysInOrder. Defaulting step index.`);
                    stepIndexWave = 0;
                }
            } else {
                 stepIndexWave = weekIndex % patternLength;
            }

            if (Array.isArray(structureEntry.setsPerStep) && structureEntry.setsPerStep.length === patternLength) {
                setsToPerform = structureEntry.setsPerStep[stepIndexWave] ?? 1;
            } else {
                setsToPerform = structureEntry.sets || 1;
            }

            const currentWaveTarget = currentPatternTargets[stepIndexWave] ?? (params.waveLoadType === 'rpe' ? 7 : 80);
            const currentRepsWave = currentRepsPerStep[stepIndexWave] ?? (params.waveLoadType === 'rpe' ? 5 : 3);

            let loadType = params.waveLoadType || '%';
            let loadValue = currentWaveTarget;
            let detailsString = ``;
            let estimatedLoad = 100;
            let targetWeight = null;
            let percentageTarget = loadValue; // Store the original percentage if type is %

            let basePercentIncrement = 0;
            if (loadType === '%' && params.incrementFrequency === 'weekly') {
                const numCyclesCompleted = Math.floor(weekIndex / patternLength);
                if (params.incrementUnit === '%') {
                    basePercentIncrement = numCyclesCompleted * (params.incrementValue || 0);
                }
            }

            if (isDeloadWeek) {
                if (params.deloadMethod === 'reduceIntensity') {
                     if (loadType === '%') {
                        // Apply reduction to the base target *before* increment
                        loadValue = Math.round(loadValue * 0.8);
                     } else if (loadType === 'rpe') {
                        loadValue = Math.max(5, loadValue - 2);
                    }
                } else if (params.deloadMethod === 'reduceVolume') {
                    setsToPerform = Math.max(1, Math.round(setsToPerform * 0.6));
                }
            }

            if (loadType === 'rpe') {
                detailsString = `${setsToPerform}x${currentRepsWave} @ RPE ${loadValue}`;
                estimatedLoad = 100 + (loadValue * 10) + (currentRepsWave * setsToPerform * 5);
            } else { // Percentage based
                percentageTarget = loadValue + basePercentIncrement; // Apply increment AFTER potential intensity deload
                loadValue = percentageTarget; // Update loadValue to the final percentage

                if (params.useEstimated1RM === true) {
                    const user1RM = params.exercise1RMs?.[exerciseName];
                    if (user1RM && typeof user1RM === 'number' && user1RM > 0) {
                        targetWeight = Math.round(user1RM * (percentageTarget / 100));
                        loadType = 'weight';
                        loadValue = targetWeight;
                        detailsString = `${setsToPerform}x${currentRepsWave} @ ${targetWeight}kg`;
                        estimatedLoad = (targetWeight * setsToPerform * currentRepsWave) * 0.1;
                    } else {
                        detailsString = `${setsToPerform}x${currentRepsWave} @ ${percentageTarget}% (1RM not found)`;
                        estimatedLoad = 100 * (percentageTarget/100) * setsToPerform * currentRepsWave;
                    }
                } else {
                     detailsString = `${setsToPerform}x${currentRepsWave} @ ${percentageTarget}%`;
                     estimatedLoad = 100 * (percentageTarget/100) * setsToPerform * currentRepsWave;
                }
                 // --- VBT OVERLAY CHECK ---
                 if (params.useVBT === true && (loadType === '%' || targetWeight !== null)) { // Check if VBT is enabled and load *could* be VBT-based
                     const targetVelocity = params.velocityTargets?.[exerciseName];
                     const mvt = params.MVT?.[exerciseName];
                     const user1RM = params.exercise1RMs?.[exerciseName]; // Need 1RM
                     if (targetVelocity && mvt && user1RM) {
                         const vbtLoadKg = estimateLoadFromVelocity(exerciseName, targetVelocity, mvt, user1RM);
                         if (vbtLoadKg) {
                             loadType = 'weight'; // Change type to weight
                             loadValue = vbtLoadKg;
                             detailsString = `${setsToPerform}x${currentRepsWave} @ ${targetVelocity} m/s (${vbtLoadKg}kg)`; // Update details
                             estimatedLoad = (vbtLoadKg * setsToPerform * currentRepsWave) * 0.1; // Re-estimate load
                             console.log(`[Engine VBT Wave] Overriding with VBT for ${exerciseName}: Target Vel ${targetVelocity} m/s -> Load ${vbtLoadKg}kg`);
                         } else {
                            detailsString += ` (VBT Failed)`;
                             console.warn(`[Engine VBT Wave] Could not determine VBT load for ${exerciseName}.`);
                         }
                     } else {
                         detailsString += ` (VBT Config Missing)`;
                         console.warn(`[Engine VBT Wave] VBT enabled, but targetVelocity, MVT, or 1RM not found for ${exerciseName}.`);
                     }
                 }
                 // --- END VBT OVERLAY CHECK ---
             }

            // <<< ADDED: Look up Exercise ID >>>
            const library = modelInstance.library; // Assume library is passed via modelInstance
            let exerciseId = null;
            if (library && Array.isArray(library)) {
                const foundExercise = library.find(ex => ex.name?.toLowerCase() === exerciseName?.toLowerCase());
                if (foundExercise) {
                    exerciseId = foundExercise.id;
                } else {
                    console.warn(`[Engine Wave] Exercise "${exerciseName}" not found in provided library.`);
                }
            } else {
                console.warn(`[Engine Wave] Exercise library not available in modelInstance.`);
            }
            // <<< END ADDED >>>

            exercises.push({
                exerciseName: exerciseName,
                id: exerciseId, // <<< ADDED ID FIELD >>>
                sets: setsToPerform,
                reps: currentRepsWave,
                loadType: loadType,
                loadValue: loadValue,
                detailsString: detailsString,
                load: Math.round(estimatedLoad),
                rest: '120s'
            });

            // --- Generate Assistance Exercises (with Deload Check) ---
            if (Array.isArray(structureEntry.assistanceExercises) && !(isDeloadWeek && params.deloadMethod === 'skipAssistance')) {
                let stepIndexForAssist;
                const assistPatternLength = patternLength; // Assume assistance step matches main pattern length

                if (params.waveCycleScope === 'intraWeek') {
                     const waveDaysInOrder = params.weeklyStructure?.filter(d => d.applyWave === true).map(d => d.dayOfWeek) || [];
                     const dayOrder = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };
                     waveDaysInOrder.sort((a, b) => (dayOrder[a] || 8) - (dayOrder[b] || 8));
                     const dayIndexInWaveCycle = waveDaysInOrder.indexOf(dayOfWeek);
                     stepIndexForAssist = (dayIndexInWaveCycle !== -1) ? (dayIndexInWaveCycle % assistPatternLength) : 0;
                } else {
                     stepIndexForAssist = weekIndex % assistPatternLength;
                }

                structureEntry.assistanceExercises.forEach(assistEx => {
                    let includeThisExercise = true;
                    if (assistEx.includeOnSteps && Array.isArray(assistEx.includeOnSteps)) {
                        if (!assistEx.includeOnSteps.includes(stepIndexForAssist)) {
                            includeThisExercise = false;
                        }
                    }
                    if (includeThisExercise && assistEx.includeOnWeeks && Array.isArray(assistEx.includeOnWeeks)) {
                         if (!assistEx.includeOnWeeks.includes(weekIndex)) {
                            includeThisExercise = false;
                        }
                    }

                    if (includeThisExercise) {
                        let assistSets = assistEx.sets || 3;
                        const assistReps = assistEx.reps || '10';
                        let assistLoadType = assistEx.loadType || 'rpe';
                        let assistLoadValue = assistEx.loadValue || 7;
                        let assistRest = assistEx.rest || '60s';
                        let assistDetailsString = ``;
                        let estimatedAssistLoad = 0;

                        if (isDeloadWeek) {
                            if (params.deloadMethod === 'reduceIntensity') {
                                if (assistLoadType === '%') assistLoadValue = Math.round(assistLoadValue * 0.8);
                                else if (assistLoadType === 'rpe') assistLoadValue = Math.max(5, assistLoadValue - 2);
                            }
                            if (params.deloadMethod === 'reduceVolume') {
                                assistSets = Math.max(1, Math.round(assistSets * 0.6));
                            }
                        }

                        assistDetailsString = `${assistSets}x${assistReps}`;
                        if (assistLoadType === 'rpe') assistDetailsString += ` @ RPE ${assistLoadValue}`;
                        else if (assistLoadType === '%') assistDetailsString += ` @ ${assistLoadValue}%`;
                        else if (assistLoadType === 'weight') assistDetailsString += ` @ ${assistLoadValue}kg`;

                        // --- BFR Modification ---
                        if (assistEx.useBFR === true) {
                            const cuffPressure = assistEx.cuffPressure || 60;
                            assistDetailsString += ` (BFR @ ${cuffPressure}mmHg)`;
                            // Real BFR would likely override load
                        }
                        // --- End BFR Modification ---

                        // --- Cluster Set Modification ---
                        if (assistEx.cluster === true) {
                            const intraRest = assistEx.intraRestSec || 15;
                            assistDetailsString = `${assistSets} x (${assistReps}) Cluster / ${intraRest}s intra-rest`;
                            if (assistLoadType === 'rpe') assistDetailsString += ` @ RPE ${assistLoadValue}`;
                            else if (assistLoadType === '%') assistDetailsString += ` @ ${assistLoadValue}%`;
                            else if (assistLoadType === 'weight') assistDetailsString += ` @ ${assistLoadValue}kg`;
                            if (assistEx.useBFR === true) assistDetailsString += ` (BFR @ ${assistEx.cuffPressure || 60}mmHg)`;
                        }
                         // --- End Cluster Set Modification ---

                        // --- Flywheel Modification (Assistance) ---
                        if (assistEx.equipmentType === 'flywheel') {
                             const inertiaSetting = assistEx.inertiaSetting || 'medium';
                             assistDetailsString = `${assistSets}x${assistReps} Flywheel (${inertiaSetting})`;
                             assistLoadType = 'flywheel';
                             assistLoadValue = inertiaSetting;
                             estimatedAssistLoad = 150 + (assistSets * parseInt(String(assistReps).split('-')[0], 10) * 5); // Placeholder
                             console.log(`[Engine Flywheel Assist Wave] Using Flywheel for ${assistEx.name}. Inertia: ${inertiaSetting}`);
                         } else {
                             // Rough load estimation (if not flywheel)
                             estimatedAssistLoad = 50 + (assistSets * 10) + (parseInt(String(assistReps).split('-')[0], 10) * 5);
                             if (assistLoadType === 'rpe') estimatedAssistLoad += assistLoadValue * 5;
                             if (assistLoadType === '%') estimatedAssistLoad *= (assistLoadValue / 75);
                             if (assistLoadType === 'weight') estimatedAssistLoad += assistLoadValue;
                         }
                         // --- End Flywheel Modification ---

                        // <<< ADDED: Look up Assistance Exercise ID >>>
                        let assistanceExerciseId = null;
                        if (library && Array.isArray(library)) {
                            const foundAssistExercise = library.find(ex => ex.name?.toLowerCase() === assistEx.name?.toLowerCase()); // <-- Changed exerciseName to name
                            if (foundAssistExercise) {
                                assistanceExerciseId = foundAssistExercise.id;
                            } else {
                                console.warn(`[Engine Wave] Assistance exercise "${assistEx.name}" not found in provided library.`); // <-- Changed exerciseName to name
                            }
                        } // Library warning handled above
                         // <<< END ADDED >>>

                        exercises.push({
                            exerciseName: assistEx.name, // <-- Changed exerciseName to name
                            id: assistanceExerciseId, // <<< ADDED ID FIELD >>>
                            sets: assistSets,
                            reps: assistReps,
                            loadType: assistLoadType,
                            loadValue: assistLoadValue,
                            detailsString: assistDetailsString,
                            load: Math.round(estimatedAssistLoad),
                            rest: assistRest
                        });
                    }
                });
            }
            // --- End Assistance Exercises ---

        } else {
            // Handle main exercise if wave is NOT applied
            setsToPerform = structureEntry.sets || 1;
            if (isDeloadWeek && params.deloadMethod === 'reduceVolume') {
                setsToPerform = Math.max(1, Math.round(setsToPerform * 0.6));
            }
            exercises.push({
                exerciseName: exerciseName,
                sets: setsToPerform,
                reps: '5',
                loadType: 'rpe',
                loadValue: (isDeloadWeek && params.deloadMethod === 'reduceIntensity') ? 5 : 7,
                detailsString: `${setsToPerform}x5 @ RPE ${ (isDeloadWeek && params.deloadMethod === 'reduceIntensity') ? 5 : 7}`,
                load: 150,
                rest: '90s'
            });
        }

    } else {
        console.log(`[Engine Wave] No structure defined for ${dayOfWeek}`);
    }
    return exercises;
}

function _calculateTriphasicDay(modelInstance, weekIndex, dayOfWeek, isDeloadWeek) {
    const { params, scope } = modelInstance;
    let exercises = [];
    const triphasicStructureEntry = params.weeklyStructure?.find(entry => entry.dayOfWeek === dayOfWeek);

    if (triphasicStructureEntry && triphasicStructureEntry.mainExercise) {
        const exerciseName = triphasicStructureEntry.mainExercise;
        // Define exerciseId based on the exercise name to fix the ReferenceError
        const exerciseId = scope.library?.find(ex => ex.name === exerciseName)?.id || `ex_${exerciseName.toLowerCase().replace(/\s+/g, '')}`;
        let sets = triphasicStructureEntry.sets || 3;

        if (triphasicStructureEntry.applyModel === true) {
            // --- Determine Current Phase & Params ---
            const phaseLengths = params.phaseLengthWeeks || [2, 2, 2];
            const eccLength = phaseLengths[0] || 2;
            const isoLength = phaseLengths[1] || 2;
            const conLength = phaseLengths[2] || 2;

            let currentPhaseName = 'concentric';
            let phaseParams = params.concentricFocusParams || { targets: [90], reps: [3] };

            if (weekIndex < eccLength) {
                currentPhaseName = 'eccentric';
                phaseParams = params.eccentricFocusParams || { targets: [80], reps: [6] };
            } else if (weekIndex < eccLength + isoLength) {
                currentPhaseName = 'isometric';
                phaseParams = params.isometricFocusParams || { targets: [85], reps: [4] };
            }

            const baseTarget = phaseParams.targets?.[0] || (params.loadType === 'rpe' ? 8 : 85);
            const baseReps = phaseParams.reps?.[0] || 5;

            let currentTarget = baseTarget;
            let loadType = params.loadType || '%';
            let loadValue = currentTarget;
            let detailsString = ``;
            let estimatedLoad = 100;
            let targetWeight = null;

            if (isDeloadWeek) {
                if (params.deloadMethod === 'reduceIntensity') {
                     if (loadType === '%') loadValue = Math.round(loadValue * 0.8);
                     else if (loadType === 'rpe') loadValue = Math.max(5, loadValue - 2);
                } else if (params.deloadMethod === 'reduceVolume') {
                    sets = Math.max(1, Math.round(sets * 0.6));
                }
            }

            if (loadType === '%' && params.useDefined1RM === true) {
                const user1RM = params.exercise1RMs?.[exerciseName];
                if (user1RM && typeof user1RM === 'number' && user1RM > 0) {
                     targetWeight = Math.round(user1RM * (loadValue / 100));
                     loadType = 'weight';
                     loadValue = targetWeight;
                     detailsString = `${sets}x${baseReps} @ ${targetWeight}kg (${currentPhaseName.substring(0,3).toUpperCase()})`;
                     estimatedLoad = (targetWeight * sets * baseReps) * 0.1;
                 } else {
                     detailsString = `${sets}x${baseReps} @ ${loadValue}% (${currentPhaseName.substring(0,3).toUpperCase()}) (1RM not found)`;
                     estimatedLoad = 100 * (loadValue / 100) * sets * baseReps;
                 }
            } else if (loadType === 'rpe') {
                 detailsString = `${sets}x${baseReps} @ RPE ${loadValue} (${currentPhaseName.substring(0,3).toUpperCase()})`;
                 estimatedLoad = 100 + (loadValue * 10) + (baseReps * sets * 5);
            } else { // Assume % if not RPE
                 detailsString = `${sets}x${baseReps} @ ${loadValue}% (${currentPhaseName.substring(0,3).toUpperCase()})`;
                 estimatedLoad = 100 * (loadValue / 100) * sets * baseReps;
            }

             // --- Flywheel Modification (Main Exercise) ---
             const mainExerciseConfig = triphasicStructureEntry; // Get the config for the main exercise
             if (mainExerciseConfig?.equipmentType === 'flywheel') {
                 const inertiaSetting = mainExerciseConfig.inertiaSetting || 'medium'; // e.g., low, medium, high or specific kg*m^2
                 detailsString = `${sets}x${baseReps} Flywheel (${inertiaSetting}) [Phase: ${currentPhaseName.toUpperCase()}]`;
                 loadType = 'flywheel'; // Use a specific load type
                 loadValue = inertiaSetting; // Store setting as value? Or calculated work?
                 estimatedLoad = 300 + (sets * baseReps * 10); // Placeholder load for flywheel
                 console.log(`[Engine Flywheel Triphasic] Using Flywheel for ${exerciseName}. Inertia: ${inertiaSetting}`);
             }
             // --- End Flywheel Modification ---

             // --- VBT OVERLAY CHECK (similar to Wave) ---
             if (params.useVBT === true && (loadType === '%' || targetWeight !== null)) { // Check if VBT enabled and load *could* be VBT-based
                 const targetVelocity = params.velocityTargets?.[exerciseName];
                 const mvt = params.MVT?.[exerciseName];
                 const user1RM = params.exercise1RMs?.[exerciseName]; // Need 1RM
                 if (targetVelocity && mvt && user1RM) {
                     const vbtLoadKg = estimateLoadFromVelocity(exerciseName, targetVelocity, mvt, user1RM);
                     if (vbtLoadKg) {
                         loadType = 'weight'; // Change type to weight
                         loadValue = vbtLoadKg;
                         // Add phase info if not flywheel
                         const phaseTag = mainExerciseConfig?.equipmentType !== 'flywheel' ? `(${currentPhaseName.substring(0,3).toUpperCase()})` : '';
                         detailsString = `${sets}x${baseReps} @ ${targetVelocity} m/s (${vbtLoadKg}kg) ${phaseTag}`; // Update details
                         estimatedLoad = (vbtLoadKg * sets * baseReps) * 0.1; // Re-estimate load
                         console.log(`[Engine VBT Triphasic] Overriding with VBT for ${exerciseName}: Target Vel ${targetVelocity} m/s -> Load ${vbtLoadKg}kg`);
                     } else { detailsString += ` (VBT Failed)`; }
                 } else { detailsString += ` (VBT Config Missing)`; }
             }
             // --- END VBT OVERLAY CHECK ---

            exercises.push({
                exerciseName: `${exerciseName} (${currentPhaseName.charAt(0).toUpperCase()})`,
                id: exerciseId, // <<< ADDED ID FIELD >>>
                sets: sets,
                reps: baseReps,
                loadType: loadType,
                loadValue: loadValue,
                detailsString: detailsString,
                load: Math.round(estimatedLoad),
                rest: '180s'
            });
        } else {
            if (isDeloadWeek && params.deloadMethod === 'reduceVolume') {
                 sets = Math.max(1, Math.round(sets * 0.6));
             }
            exercises.push({ exerciseName: exerciseName, sets: sets, reps: '5', loadType: 'rpe', loadValue: 7, detailsString: `${sets}x5 @ RPE 7`, load: 150, rest: '90s' });
        }

         // --- Generate Assistance Exercises --- (Similar to linear)
         if (Array.isArray(triphasicStructureEntry.assistanceExercises) && !(isDeloadWeek && params.deloadMethod === 'skipAssistance')) {
             triphasicStructureEntry.assistanceExercises.forEach(assistEx => {
                 let includeThisExercise = true;

                 if (includeThisExercise) {
                     let assistSets = assistEx.sets || 3;
                     let assistLoadType = assistEx.loadType || 'rpe';
                     let assistLoadValue = assistEx.loadValue || 7;

                     if (isDeloadWeek) {
                         if (params.deloadMethod === 'reduceIntensity') {
                             if (assistLoadType === '%') assistLoadValue = Math.round(assistLoadValue * 0.8);
                             else if (assistLoadType === 'rpe') assistLoadValue = Math.max(5, assistLoadValue - 2);
                         }
                         if (params.deloadMethod === 'reduceVolume') {
                             assistSets = Math.max(1, Math.round(assistSets * 0.6));
                         }
                     }

                    const assistReps = assistEx.reps || '10';
                    const assistRest = assistEx.rest || '60s';
                    let assistDetailsString = `${assistSets}x${assistReps}`;
                    if (assistLoadType === 'rpe') assistDetailsString += ` @ RPE ${assistLoadValue}`;
                    else if (assistLoadType === '%') assistDetailsString += ` @ ${assistLoadValue}%`;
                    else if (assistLoadType === 'weight') assistDetailsString += ` @ ${assistLoadValue}kg`;

                     // --- BFR Modification (Assistance) ---
                     if (assistEx.useBFR === true) {
                         const cuffPressure = assistEx.cuffPressure || 60;
                         assistDetailsString += ` (BFR @ ${cuffPressure}mmHg)`;
                     }
                     // --- End BFR Modification ---

                     // --- Cluster Set Modification (Assistance) ---
                     if (assistEx.cluster === true) {
                         const intraRest = assistEx.intraRestSec || 15;
                         assistDetailsString = `${assistSets} x (${assistReps}) Cluster / ${intraRest}s intra-rest`;
                         if (assistLoadType === 'rpe') assistDetailsString += ` @ RPE ${assistLoadValue}`;
                         else if (assistLoadType === '%') assistDetailsString += ` @ ${assistLoadValue}%`;
                         else if (assistLoadType === 'weight') assistDetailsString += ` @ ${assistLoadValue}kg`;
                         if (assistEx.useBFR === true) assistDetailsString += ` (BFR @ ${assistEx.cuffPressure || 60}mmHg)`;
                     }
                     // --- End Cluster Set Modification ---

                     // --- Flywheel Modification (Assistance) ---
                    let estimatedAssistLoad = 50;
                    if (assistEx.equipmentType === 'flywheel') {
                         const inertiaSetting = assistEx.inertiaSetting || 'medium';
                         assistDetailsString = `${assistSets}x${assistReps} Flywheel (${inertiaSetting})`;
                         assistLoadType = 'flywheel';
                         assistLoadValue = inertiaSetting;
                         estimatedAssistLoad = 150 + (assistSets * parseInt(String(assistReps).split('-')[0], 10) * 5); // Placeholder
                         console.log(`[Engine Flywheel Assist Triphasic] Using Flywheel for ${assistEx.name}. Inertia: ${inertiaSetting}`);
                     } else {
                         // Rough load estimation (if not flywheel)
                         estimatedAssistLoad = 50 + (assistSets * 10) + (parseInt(String(assistReps).split('-')[0], 10) * 5);
                         if (assistLoadType === 'rpe') estimatedAssistLoad += assistLoadValue * 5;
                         if (assistLoadType === '%') estimatedAssistLoad *= (assistLoadValue / 75);
                         if (assistLoadType === 'weight') estimatedAssistLoad += assistLoadValue;
                     }
                     // --- End Flywheel Modification ---

                    // Define assistanceExerciseId to fix the ReferenceError
                    const assistanceExerciseName = assistEx.name || 'Assistance Exercise';
                    const assistanceExerciseId = scope.library?.find(ex => ex.name === assistanceExerciseName)?.id || 
                        `ex_${assistanceExerciseName.toLowerCase().replace(/\s+/g, '')}`;

                    exercises.push({
                        exerciseName: assistEx.name || 'Assistance Exercise',
                        id: assistanceExerciseId, // <<< ADDED ID FIELD >>>
                        sets: assistSets, reps: assistReps, loadType: assistLoadType,
                        loadValue: assistLoadValue, detailsString: assistDetailsString,
                        load: Math.round(estimatedAssistLoad), rest: assistRest
                    });
                }
            });
        }
         // --- End Assistance Exercises ---
    } else {
        console.log(`[Engine Triphasic] No structure defined for ${dayOfWeek}`);
    }
    return exercises;
}

function _calculateMicrodoseDay(modelInstance, weekIndex, dayOfWeek, isDeloadWeek) {
     const { params } = modelInstance;
     let exercises = [];
     const microdoseStructure = params.weeklyStructure?.find(entry => entry.dayOfWeek === dayOfWeek);

     if (isDeloadWeek) {
         console.log("[Engine Microdose] Skipping microdose calculation during deload week.");
         return []; // Typically skip microdosing on deloads
     }

     if (microdoseStructure && microdoseStructure.applyModel === true) {
         const exerciseName = microdoseStructure.mainExercise;
         const targetQuality = params.targetQuality || 'activation';
         const sessionDuration = params.sessionDurationMin || 15;
         const baseLoad = params.loadTargets?.[0] || 40;
         const baseReps = params.repsPerSet?.[0] || 3;
         const targetSets = microdoseStructure.sets || 2; // Sets from structure define micro-session target

         // Generate multiple small exercise bouts based on frequencyPerDay
         (params.frequencyPerDay || ['morning']).forEach(timeSlot => {
             let loadType = params.loadCalculationType || '%';
             let loadValue = baseLoad;
             let detailsString = '';
             let estimatedLoad = 0;

             // Calculate weight if needed (very light)
             if (loadType === '%' && params.useDefined1RM === true) {
                 const user1RM = params.exercise1RMs?.[exerciseName];
                 if (user1RM && typeof user1RM === 'number' && user1RM > 0) {
                      const targetWeight = Math.round(user1RM * (loadValue / 100));
                      loadType = 'weight';
                      loadValue = targetWeight;
                      detailsString = `${targetSets}x${baseReps} @ ${targetWeight}kg`;
                      estimatedLoad = (targetWeight * targetSets * baseReps) * 0.05; // Lower factor for microdose
                  } else {
                      detailsString = `${targetSets}x${baseReps} @ ${loadValue}% (1RM not found)`;
                      estimatedLoad = 100 * (loadValue / 100) * targetSets * baseReps * 0.05;
                  }
             } else {
                 detailsString = `${targetSets}x${baseReps} @ ${loadValue}%`;
                 estimatedLoad = 100 * (loadValue / 100) * targetSets * baseReps * 0.05;
             }

             // <<< ADDED: Look up Exercise ID >>>
             const library = modelInstance.library;
             let exerciseId = null;
             if (library && Array.isArray(library)) {
                 const foundExercise = library.find(ex => ex.name?.toLowerCase() === exerciseName?.toLowerCase());
                 if (foundExercise) {
                     exerciseId = foundExercise.id;
                 } else {
                     console.warn(`[Engine Microdose] Exercise "${exerciseName}" not found in provided library.`);
                 }
             } else {
                 console.warn(`[Engine Microdose] Exercise library not available in modelInstance.`);
             }
             // <<< END ADDED >>>

             exercises.push({
                 exerciseName: `${exerciseName} (${timeSlot})`,
                 id: exerciseId, // <<< ADDED ID FIELD >>>
                 sets: targetSets,
                 reps: baseReps,
                 loadType: loadType,
                 loadValue: loadValue,
                 detailsString: `${detailsString} [Focus: ${targetQuality}, Max ${sessionDuration}min]`,
                 load: Math.round(estimatedLoad),
                 rest: '60s' // Short rest typical
             });
         });
     } else {
         console.log(`[Engine Microdose] No structure/applyModel for ${dayOfWeek}`);
     }
     return exercises;
}

function _calculateApreDay(modelInstance, weekIndex, dayOfWeek, isDeloadWeek) {
    const { params, scope } = modelInstance;
    let exercises = [];
    const apreStructure = params.weeklyStructure?.find(entry => entry.dayOfWeek === dayOfWeek);

    if (isDeloadWeek) {
         console.log("[Engine APRE] Applying deload logic instead of standard APRE.");
         // Simple deload: Reduce intensity (e.g., use initial load) and volume
         if (apreStructure && apreStructure.applyModel === true) {
             const exerciseName = apreStructure.mainExercise;
             let deloadSets = Math.max(1, Math.round((params.setsPerWorkout || 3) * 0.6));
             let deloadLoad = params.initialLoadTarget || 75;
             let loadType = params.loadCalculationType || '%';
             let deloadReps = params.repGoal || 6;

             if (loadType === '%' && params.useDefined1RM === true) {
                 const user1RM = params.exercise1RMs?.[exerciseName];
                 if (user1RM) {
                     deloadLoad = Math.round(user1RM * (deloadLoad * 0.8 / 100)); // Reduce intensity too
                     loadType = 'weight';
                 } else { deloadLoad = Math.round(deloadLoad * 0.8); } // Reduce % target
             } else if (loadType === 'rpe') {
                 deloadLoad = Math.max(5, (params.initialLoadTarget || 7) - 2);
             }

             exercises.push({
                 exerciseName: exerciseName,
                 sets: deloadSets,
                 reps: deloadReps,
                 loadType: loadType,
                 loadValue: deloadLoad,
                 detailsString: `${deloadSets}x${deloadReps} @ ${loadType === 'weight' ? deloadLoad+'kg' : (loadType === 'rpe' ? 'RPE '+deloadLoad : deloadLoad+'%')} (Deload)`,
                 load: 100, // Placeholder deload load
                 rest: '120s'
             });
         }
         return exercises;
     }

    if (apreStructure && apreStructure.applyModel === true) {
        const exerciseName = apreStructure.mainExercise;
        const repGoal = params.repGoal || 6;
        const testSetIndex = params.testSetIndex >= 0 ? params.testSetIndex : 2; // Default to 3rd set (index 2)
        const totalSets = params.setsPerWorkout || 3;

        // Assumes scope.exerciseState is structured like: { "Back Squat": { lastWeekPerformance: { repsAchieved: 8, weightUsed: 140 } }, ... }
        const exerciseState = scope?.exerciseState?.[exerciseName] || {};
        const lastPerformance = exerciseState.lastWeekPerformance || { repsAchieved: null, weightUsed: null };
        let workingWeight = null;

        // Calculate current week's working weight
        if (lastPerformance.repsAchieved !== null && lastPerformance.weightUsed !== null && typeof lastPerformance.repsAchieved === 'number' && typeof lastPerformance.weightUsed === 'number') {
             workingWeight = lookupApreAdjustment(repGoal, lastPerformance.repsAchieved, lastPerformance.weightUsed);
             console.log(`[Engine APRE] Adjusting weight for ${exerciseName} based on last week (${lastPerformance.repsAchieved} reps @ ${lastPerformance.weightUsed}kg): New weight ${workingWeight}kg`);
         } else {
             // First week or missing data: Calculate initial weight
             const initialTarget = params.initialLoadTarget || 75;
             let loadType = params.loadCalculationType || '%';
             if (loadType === '%' && params.useDefined1RM === true) {
                 const user1RM = params.exercise1RMs?.[exerciseName];
                 if (user1RM) workingWeight = Math.round(user1RM * (initialTarget / 100));
                 else workingWeight = initialTarget; // Fallback to % if 1RM missing
             } else if (loadType === 'rpe') {
                 // Estimate weight from RPE? Complex. For now, use target RPE as a placeholder if no %/1RM.
                 // A better approach would require an RPE-to-% chart or calibration.
                 workingWeight = initialTarget * 10; // Very rough placeholder
                 console.warn(`[Engine APRE] Initial weight based on RPE is a rough estimate.`);
             } else { // Assume initialTarget is weight if type isn't % or rpe
                  workingWeight = initialTarget;
             }

             if (!workingWeight || workingWeight <= 0) { // Final fallback
                  workingWeight = 50; // Arbitrary fallback weight
                  console.warn(`[Engine APRE] Could not determine initial weight for ${exerciseName}, defaulting to ${workingWeight}kg.`);
             }
             workingWeight = Math.round(workingWeight);
             console.log(`[Engine APRE] Initial weight for ${exerciseName}: ${workingWeight}kg`);
         }

        // Generate sets
        for (let i = 0; i < totalSets; i++) {
            let setName = `Set ${i + 1}`;
            let repsTarget = repGoal; // Default
            let detailsSuffix = '';
            let loadType = 'weight'; // APRE primarily uses weight
            let loadValue = workingWeight;

            if (i < testSetIndex) {
                // Warmup sets: % of working weight
                loadValue = Math.round(workingWeight * (0.8 + (0.2 / testSetIndex) * i)); // Linear ramp to working weight
                detailsSuffix = `(Warmup)`;
            } else if (i === testSetIndex) {
                repsTarget = 'AMRAP';
                setName += ' (Test Set)';
                detailsSuffix = `(Aim >${repGoal} reps)`;
            } else {
                 // Backoff sets (optional, based on totalSets > testSetIndex + 1)
                 loadValue = Math.round(workingWeight * 0.9); // Example 10% backoff
                 repsTarget = repGoal + 2; // Example higher reps for backoff
                 detailsSuffix = `(Backoff)`;
            }

            // <<< ADDED: Look up Exercise ID >>>
            const library = modelInstance.library;
            let exerciseId = null;
            if (library && Array.isArray(library)) {
                const foundExercise = library.find(ex => ex.name?.toLowerCase() === exerciseName?.toLowerCase());
                if (foundExercise) {
                    exerciseId = foundExercise.id;
                } else {
                    console.warn(`[Engine APRE] Exercise "${exerciseName}" not found in provided library.`);
                }
            } else {
                console.warn(`[Engine APRE] Exercise library not available in modelInstance.`);
            }
            // <<< END ADDED >>>

            exercises.push({
                exerciseName: exerciseName,
                id: exerciseId, // <<< ADDED ID FIELD >>>
                sets: 1, // Each object represents one set
                reps: repsTarget,
                loadType: loadType,
                loadValue: loadValue,
                detailsString: `${setName}: ${repsTarget} @ ${loadValue}kg ${detailsSuffix}`.trim(),
                load: Math.round((loadValue * (typeof repsTarget === 'number' ? repsTarget : repGoal)) * 0.11), // Slightly higher load factor for APRE sets?
                rest: '180s'
            });
        }
         // Reminder: Actual reps from AMRAP set need to be recorded externally into:
         // scope.exerciseState[exerciseName].lastWeekPerformance = { repsAchieved: ..., weightUsed: workingWeight };
    } else {
         console.log(`[Engine APRE] No structure/applyModel for ${dayOfWeek}`);
    }
    return exercises;
}

function _calculateBlockDay(modelInstance, weekIndex, dayOfWeek, isDeloadWeek) {
     const { params, scope } = modelInstance;
     let exercises = [];
     const blockStructure = params.weeklyStructure?.find(entry => entry.dayOfWeek === dayOfWeek);

     if (blockStructure && blockStructure.applyModel === true) {
         const exerciseName = blockStructure.mainExercise;

         // Determine current phase based on weekIndex
         let cumulativeWeeks = 0;
         let currentPhase = null;
         for (const phase of params.phases || []) {
             const phaseLength = phase.lengthWeeks || 0;
             if (weekIndex < cumulativeWeeks + phaseLength) {
                 currentPhase = phase;
                 break;
             }
             cumulativeWeeks += phaseLength;
         }

         if (currentPhase) {
             console.log(`[Engine Block] Week ${weekIndex + 1}: In phase '${currentPhase.name}', using model '${currentPhase.modelType}'`);
             // Create a temporary sub-model instance to delegate calculation
             const subModelDefaults = getModelDefaults(currentPhase.modelType);
             if (!subModelDefaults) {
                 console.error(`[Engine Block] Cannot get defaults for sub-model type: ${currentPhase.modelType}`);
                 return [{ exerciseName: `${exerciseName} (Error in Phase: ${currentPhase.name})`, detailsString: 'Unknown sub-model type', load: 0 }];
             }
             const subModelInstance = {
                 type: currentPhase.modelType,
                 params: {
                      ...subModelDefaults,
                      ...currentPhase.modelParams, // Phase params override defaults
                      // Inherit block-level settings where appropriate (Block overrides Phase)
                      exercise1RMs: params.exercise1RMs || currentPhase.modelParams?.exercise1RMs || {},
                      useDefined1RM: params.useDefined1RM !== undefined ? params.useDefined1RM : currentPhase.modelParams?.useDefined1RM,
                      deloadFrequency: params.deloadFrequency, // Block deload settings passed down
                      deloadMethod: params.deloadMethod
                      // Consider passing down VBT params too if defined at block level?
                 },
                 scope: scope, // Pass down the main scope
                 library: modelInstance.library // <<< ADDED: Pass library down explicitly
             };
             const weekIndexInPhase = weekIndex - cumulativeWeeks;

             // Find the matching calculator function based on the sub-model type
             const calculatorFn = MODEL_CALCULATORS[subModelInstance.type.toLowerCase()];

             if (calculatorFn && typeof calculatorFn === 'function') {
                try {
                    // Calculate exercises using the sub-model's calculator
                    // Pass the sub-model instance and the *phase-relative* week index
                    const phaseExercises = calculatorFn(subModelInstance, weekIndexInPhase, dayOfWeek, isDeloadWeek);

                    // Filter and modify exercises based on block structure
                    phaseExercises.forEach(ex => {
                        // Check if it's the main exercise defined in the block structure
                        if (ex.exerciseName === exerciseName) {
                            ex.detailsString = `[${currentPhase.name}] ${ex.detailsString}`; // Prepend phase name
                            exercises.push(ex);
                        } else {
                            // Check if it's an assistance exercise defined in the block structure (optional)
                            // Currently, block structure doesn't define assistance, sub-models do.
                            // If block structure *could* define assistance, add check here.
                            // If sub-model assistance should always be included:
                             // ex.detailsString = `[${currentPhase.name}] ${ex.detailsString}`;
                             // exercises.push(ex);
                        }
                    });
                } catch(error) {
                     console.error(`[Engine Block] Error delegating calculation to sub-model ${currentPhase.modelType}:`, error);
                     exercises.push({ exerciseName: `${exerciseName} (Error in Phase: ${currentPhase.name})`, detailsString: 'Calculation failed', load: 0 });
                }
             } else {
                 console.error(`[Engine Block] No calculator function found for sub-model type: ${subModelInstance.type}`);
                 exercises.push({ exerciseName: `${exerciseName} (Error in Phase: ${currentPhase.name})`, detailsString: 'Invalid sub-model calculator', load: 0 });
             }

         } else {
             console.warn(`[Engine Block] Week ${weekIndex + 1} is outside defined phases.`);
             exercises.push({ exerciseName: `${exerciseName} (No Phase)`, detailsString: 'Week outside defined phases', load: 0 });
         }
     } else {
         console.log(`[Engine Block] No structure/applyModel for ${dayOfWeek}`);
     }
     return exercises;
}

function _calculateDupAutoDay(modelInstance, weekIndex, dayOfWeek, isDeloadWeek) {
    const { params, scope, library } = modelInstance; // <<< Destructure library
    let exercises = [];
    const structureEntry = params.weeklyStructure?.find(entry => entry.dayOfWeek === dayOfWeek);
    const dailyFocusKey = params.dailyFocus?.[dayOfWeek]; // e.g., 'strength', 'hypertrophy', 'power'

    if (!dailyFocusKey || dailyFocusKey === 'rest') { // <<< Added check for 'rest' >>>
        console.log(`[Engine DUP] No daily target or rest defined for ${dayOfWeek}`);
        return [];
    }

    // Construct the actual parameter key name (e.g., 'powerFocus')
    const focusParamKey = `${dailyFocusKey}Focus`; 
    const focusParams = params[focusParamKey]; // Get {intensity, reps, sets} for this focus
    
    if (!focusParams) {
        // <<< Updated Warning >>>
        console.warn(`[Engine DUP] Focus parameters for key "${focusParamKey}" (derived from focus "${dailyFocusKey}") not found.`);
        return [];
    }

    if (structureEntry && structureEntry.mainExercise) {
        const exerciseName = structureEntry.mainExercise;

        // <<< Look up Main Exercise ID >>>
        let exerciseId = null;
        if (library && Array.isArray(library)) {
            const foundExercise = library.find(ex => ex.name?.toLowerCase() === exerciseName?.toLowerCase());
            if (foundExercise) {
                exerciseId = foundExercise.id;
            } else {
                console.warn(`[Engine DUP] Main exercise "${exerciseName}" not found in library.`);
            }
        } else {
            console.warn(`[Engine DUP] Library not available.`);
        }
        // <<< END Look up ID >>>

        let currentSets = focusParams.sets || 3;
        let currentReps = focusParams.reps || 5;
        let currentIntensity = focusParams.intensity || 75;
        let loadType = params.loadType || '%'; // % or rpe?

        // Apply Deload
            if (isDeloadWeek) {
               if (params.deloadMethod === 'reduceIntensity') {
                if (loadType === '%') currentIntensity = Math.round(currentIntensity * 0.8);
                 // DUP usually uses %, no default RPE deload needed unless specified
               } else if (params.deloadMethod === 'reduceVolume') {
                currentSets = Math.max(1, Math.round(currentSets * 0.6));
            }
        }

        // Apply weekly increment if defined
        const incrementValue = params.weeklyIncrement?.[dailyFocusKey] || 0; // <<< Use dailyFocusKey here >>>
        if (incrementValue && weekIndex > 0) {
            currentIntensity += incrementValue * weekIndex;
        }

        let detailsString = `${currentSets}x${currentReps} @ ${currentIntensity}${loadType === '%' ? '%' : ' RPE'}`;
        let estimatedLoad = 100 * (currentIntensity / 100) * currentSets * currentReps;

            exercises.push({
            exerciseName: exerciseName,
            exerciseId: exerciseId, // <<< Add ID
            sets: currentSets,
            reps: currentReps,
                loadType: loadType,
            loadValue: currentIntensity,
            detailsString: detailsString,
                load: Math.round(estimatedLoad),
            rest: '120s'
        });

        // Assistance (similar to other models, but no phase/step concept here)
        if (Array.isArray(structureEntry.assistanceExercises) && !(isDeloadWeek && params.deloadMethod === 'skipAssistance')) {
            structureEntry.assistanceExercises.forEach(assistEx => {
                let includeThisExercise = true;
                // Add any specific inclusion logic for DUP assistance if needed

                if (includeThisExercise) {
                    let assistSets = assistEx.sets || 3;
                    let assistReps = assistEx.reps || '8-12';
                    let assistLoadType = assistEx.loadType || 'rpe';
                    let assistLoadValue = assistEx.loadValue || 7;
                    let assistRest = assistEx.rest || '60s';

                    if (isDeloadWeek) {
                        if (params.deloadMethod === 'reduceIntensity') {
                            if (assistLoadType === '%') assistLoadValue = Math.round(assistLoadValue * 0.8);
                            else if (assistLoadType === 'rpe') assistLoadValue = Math.max(5, assistLoadValue - 2);
                        }
                        if (params.deloadMethod === 'reduceVolume') {
                            assistSets = Math.max(1, Math.round(assistSets * 0.6));
                        }
                    }

                    let assistDetailsString = `${assistSets}x${assistReps}`;
                    if (assistLoadType === 'rpe') assistDetailsString += ` @ RPE ${assistLoadValue}`;
                    else if (assistLoadType === '%') assistDetailsString += ` @ ${assistLoadValue}%`;
                    else if (assistLoadType === 'weight') assistDetailsString += ` @ ${assistLoadValue}kg`;

                    // Rough load estimation
                    let estimatedAssistLoad = 50 + (assistSets * 10) + (parseInt(String(assistReps).split('-')[0], 10) * 5);
                    if (assistLoadType === 'rpe') estimatedAssistLoad += assistLoadValue * 5;
                    if (assistLoadType === '%') estimatedAssistLoad *= (assistLoadValue / 75);
                    if (assistLoadType === 'weight') estimatedAssistLoad += assistLoadValue;

                    // <<< Look up Assistance Exercise ID >>>
                    let assistanceExerciseId = null;
                    if (library && Array.isArray(library)) {
                        const foundAssistExercise = library.find(ex => ex.name?.toLowerCase() === assistEx.name?.toLowerCase());
                        if (foundAssistExercise) {
                            assistanceExerciseId = foundAssistExercise.id;
        } else {
                            console.warn(`[Engine DUP Assist] Exercise "${assistEx.name}" not found in library.`);
                        }
                    } // Library warning handled above
                    // <<< END Look up Assistance Exercise ID >>>

                    exercises.push({
                        exerciseName: assistEx.name || 'Assistance',
                        exerciseId: assistanceExerciseId, // <<< Add ID
                        sets: assistSets, reps: assistReps, loadType: assistLoadType,
                        loadValue: assistLoadValue, detailsString: assistDetailsString,
                        load: Math.round(estimatedAssistLoad), rest: assistRest
                    });
                }
            });
        }
    } else {
        console.log(`[Engine DUP] No main exercise structure defined for ${dayOfWeek} with focus ${dailyFocusKey}`); // <<< Updated log >>>
    }

    return exercises;
}

// --- Mapping from model type to calculator function ---
const MODEL_CALCULATORS = {
    linear: _calculateLinearDay,
    wave: _calculateWaveDay,
    triphasic: _calculateTriphasicDay,
    microdose: _calculateMicrodoseDay,
    apre: _calculateApreDay,
    block: _calculateBlockDay,
    dupauto: _calculateDupAutoDay // Lowercase key
};