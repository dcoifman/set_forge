/**
 * Templates Module for SetForge Block Builder
 * Contains detailed, research-based training program templates.
 */

// Import necessary utilities
import { showToast } from './ui/toast.js';

console.log("Templates module loading...");

// Template data - research-based training programs
const trainingTemplates = [
    {
        id: "hypertrophy-1",
        title: "Scientific Hypertrophy Program",
        author: "Dr. Brad Schoenfeld",
        category: "hypertrophy",
        description: "An 8-week periodized hypertrophy program based on Dr. Brad Schoenfeld's research on muscle hypertrophy mechanisms. This program incorporates the optimal mix of mechanical tension, metabolic stress, and muscle damage for maximum muscle growth.",
        weeks: 8,
        level: "Intermediate",
        sessions: 4,
        equipment: ["Barbell", "Dumbbells", "Cable Machine"],
        focus: ["Muscle Growth", "Volume Training", "Progressive Overload"],
        rating: 4.8,
        phases: [
            { name: "Accumulation", duration: 3, color: "accum" },
            { name: "Intensification", duration: 3, color: "intens" },
            { name: "Peak", duration: 2, color: "peak" }
        ],
        science: "Based on peer-reviewed research on the three primary mechanisms of hypertrophy: mechanical tension, metabolic stress, and muscle damage. The program follows a scientifically-validated approach with progressive overload, varied rep ranges (5-30), and optimal volume (10-20 sets per muscle group per week). Research shows that this combination of training variables maximizes muscle protein synthesis.",
        recommended: [
            "Intermediate to advanced lifters",
            "Those who have plateaued with basic linear programs",
            "Individuals focusing primarily on aesthetics",
            "Lifters with at least 1 year of consistent training"
        ],
        schedule: [
            {
                week: 1,
                phase: "Accumulation",
                days: [
                    { day: "Monday", title: "Upper Body Strength", exercises: ["Bench Press 4x8", "Barbell Row 4x8", "Incline DB Press 3x10", "Pull-Up 3x10", "Lateral Raise 3x12", "Face Pull 3x15"] },
                    { day: "Tuesday", title: "Lower Body Strength", exercises: ["Squat 4x8", "Romanian Deadlift 4x8", "Leg Press 3x10", "Walking Lunge 3x10", "Leg Curl 3x12", "Standing Calf Raise 4x15"] },
                    { day: "Wednesday", title: "Rest", exercises: [] },
                    { day: "Thursday", title: "Upper Body Volume", exercises: ["Incline Bench 4x10", "Seated Cable Row 4x10", "DB Shoulder Press 3x12", "Lat Pulldown 3x12", "Cable Flye 3x15", "Tricep Pushdown 3x15", "Bicep Curl 3x15"] },
                    { day: "Friday", title: "Lower Body Volume", exercises: ["Front Squat 4x10", "Stiff-Leg Deadlift 4x10", "Bulgarian Split Squat 3x12", "Leg Extension 3x15", "Seated Leg Curl 3x15", "Seated Calf Raise 4x20"] },
                    { day: "Saturday", title: "Rest", exercises: [] },
                    { day: "Sunday", title: "Rest", exercises: [] }
                ]
            }
        ]
    },
    {
        id: "strength-1",
        title: "Scientific Strength Development Program",
        author: "Dr. Mike Israetel",
        category: "strength",
        description: "A 12-week periodized strength program based on scientific principles of strength development. This program implements proper fatigue management, progressive overload, and specificity to maximize strength gains while minimizing injury risk.",
        weeks: 12,
        level: "Intermediate-Advanced",
        sessions: 4,
        equipment: ["Barbell", "Power Rack", "Bench"],
        focus: ["Maximal Strength", "Neural Adaptation", "Force Production"],
        rating: 4.9,
        phases: [
            { name: "Accumulation", duration: 5, color: "accum" },
            { name: "Intensification", duration: 4, color: "intens" },
            { name: "Peak", duration: 2, color: "peak" },
            { name: "Taper", duration: 1, color: "taper" }
        ],
        science: "Based on research in neuromuscular adaptations, motor unit recruitment, and rate coding for strength development. The program utilizes principles of specificity, progressive tension overload, and fatigue management. Scientific evidence suggests that periodized strength training with appropriate volume (10-15 sets per movement pattern per week) and intensity (70-95% 1RM) optimizes strength adaptations.",
        recommended: [
            "Intermediate to advanced lifters",
            "Powerlifters and strength athletes",
            "Those looking to break strength plateaus",
            "Individuals with at least 1-2 years of consistent training"
        ],
        schedule: [
            {
                week: 1,
                phase: "Accumulation",
                days: [
                    { day: "Monday", title: "Squat Focus", exercises: ["Back Squat 5x5 @75%", "Front Squat 3x8", "Romanian Deadlift 3x8", "Leg Press 3x10", "Core Work 3x15"] },
                    { day: "Tuesday", title: "Bench Focus", exercises: ["Bench Press 5x5 @75%", "Incline Bench 3x8", "DB Shoulder Press 3x8", "Tricep Extension 3x10", "Face Pull 3x15"] },
                    { day: "Wednesday", title: "Rest", exercises: [] },
                    { day: "Thursday", title: "Deadlift Focus", exercises: ["Deadlift 5x3 @75%", "Deficit Deadlift 3x5", "Barbell Row 3x8", "Pull-Up 3x8", "Bicep Curl 3x10"] },
                    { day: "Friday", title: "OHP Focus", exercises: ["Overhead Press 5x5 @75%", "Push Press 3x5", "Close-Grip Bench 3x8", "Lateral Raise 3x12", "Tricep Pushdown 3x12"] },
                    { day: "Saturday", title: "Rest", exercises: [] },
                    { day: "Sunday", title: "Rest", exercises: [] }
                ]
            }
        ]
    },
    {
        id: "powerlifting-1",
        title: "Scientific Powerlifting Peaking Program",
        author: "Dr. Eric Helms",
        category: "powerlifting",
        description: "A scientifically-designed 16-week powerlifting peaking program that systematically builds strength in the squat, bench press, and deadlift while managing fatigue for optimal performance on competition day.",
        weeks: 16,
        level: "Advanced",
        sessions: 4,
        equipment: ["Powerlifting Equipment", "Barbell", "Power Rack"],
        focus: ["Squat", "Bench", "Deadlift", "Competition Peaking"],
        rating: 4.9,
        phases: [
            { name: "Accumulation", duration: 6, color: "accum" },
            { name: "Intensification", duration: 6, color: "intens" },
            { name: "Peak", duration: 3, color: "peak" },
            { name: "Taper", duration: 1, color: "taper" }
        ],
        science: "Based on scientific research on powerlifting-specific adaptations, neuromuscular efficiency, and competition peaking strategies. The program implements proper fatigue management, specific adaptation to imposed demands (SAID principle), and strategic deloading. Scientific evidence supports the use of daily undulating periodization, submaximal training with appropriate intensity (70-95% 1RM), and proper taper protocols to maximize performance.",
        recommended: [
            "Competitive powerlifters",
            "Advanced strength athletes",
            "Those preparing for a powerlifting competition",
            "Lifters with at least 2+ years of barbell training experience"
        ],
        schedule: [
            {
                week: 1,
                phase: "Accumulation",
                days: [
                    { day: "Monday", title: "Squat Day", exercises: ["Competition Squat 5x5 @70-75%", "Pause Squat 3x5", "Leg Press 3x8", "Walking Lunge 3x10/side", "Ab Wheel 3x10"] },
                    { day: "Tuesday", title: "Bench Day", exercises: ["Competition Bench 5x5 @70-75%", "Close-Grip Bench 3x8", "DB Incline Press 3x10", "Tricep Extension 3x12", "Face Pull 3x15"] },
                    { day: "Wednesday", title: "Rest", exercises: [] },
                    { day: "Thursday", title: "Deadlift Day", exercises: ["Competition Deadlift 5x3 @70-75%", "Deficit Deadlift 3x5", "Barbell Row 3x8", "Pull-Up 3x8", "Back Extension 3x12"] },
                    { day: "Friday", title: "Upper Accessory", exercises: ["Overhead Press 4x8", "Incline Bench 3x10", "Lat Pulldown 3x10", "Tricep Pushdown 3x12", "Bicep Curl 3x12"] },
                    { day: "Saturday", title: "Rest", exercises: [] },
                    { day: "Sunday", title: "Rest", exercises: [] }
                ]
            }
        ]
    },
    {
        id: "olympic-1",
        title: "Olympic Weightlifting Technique Development",
        author: "Dr. Greg Everett",
        category: "olympic",
        description: "A 12-week program designed to develop proper technique in the Olympic lifts while building the necessary strength, mobility, and power for efficient movement patterns. This program focuses on mastering the snatch and clean & jerk with progressive loading.",
        weeks: 12,
        level: "Beginner-Intermediate",
        sessions: 4,
        equipment: ["Olympic Barbell", "Bumper Plates", "Lifting Platform"],
        focus: ["Snatch", "Clean & Jerk", "Technique", "Explosive Power"],
        rating: 4.7,
        phases: [
            { name: "Technique", duration: 4, color: "accum" },
            { name: "Strength", duration: 4, color: "intens" },
            { name: "Power", duration: 4, color: "peak" }
        ],
        science: "Based on motor learning research for Olympic weightlifting, strength-power continuum, and technical proficiency development. Scientific literature indicates that technique acquisition requires high-frequency, low-intensity training with proper progression. The program incorporates the principles of transfer of training, movement pattern specificity, and mechanical specificity.",
        recommended: [
            "Beginner to intermediate Olympic weightlifters",
            "CrossFit athletes looking to improve Olympic lifts",
            "Athletes seeking to develop explosive power",
            "Individuals with good mobility and basic strength foundation"
        ],
        schedule: [
            {
                week: 1,
                phase: "Technique",
                days: [
                    { day: "Monday", title: "Snatch Focus", exercises: ["Snatch Grip Deadlift 4x5", "Hang Snatch 5x3", "Snatch Balance 4x3", "Overhead Squat 3x5", "Pull-Ups 3x8"] },
                    { day: "Tuesday", title: "Clean & Jerk Focus", exercises: ["Clean Deadlift 4x5", "Hang Clean 5x3", "Push Jerk 4x3", "Front Squat 3x5", "Core Work 3 sets"] },
                    { day: "Wednesday", title: "Rest", exercises: [] },
                    { day: "Thursday", title: "Snatch Technique", exercises: ["Snatch Pull 4x3", "Power Snatch 5x2", "Muscle Snatch 3x3", "Snatch Balance 3x3", "Back Extension 3x10"] },
                    { day: "Friday", title: "Clean & Jerk Technique", exercises: ["Clean Pull 4x3", "Power Clean 5x2", "Power Jerk 4x2", "Clean Deadlift 3x5", "Ab Work 3 sets"] },
                    { day: "Saturday", title: "Strength", exercises: ["Back Squat 5x5", "Push Press 4x5", "Barbell Row 3x8", "DB Press 3x10", "Bicep Curl 3x10"] },
                    { day: "Sunday", title: "Rest", exercises: [] }
                ]
            }
        ]
    },
    {
        id: "endurance-1",
        title: "Scientific Endurance + Strength Program",
        author: "Dr. Andrew Huberman",
        category: "endurance",
        description: "A 10-week concurrent training program designed to develop endurance capacity while maintaining strength. Based on scientific research on the interference effect and optimal programming for concurrent training, this program strategically balances cardiovascular and resistance training.",
        weeks: 10,
        level: "Intermediate",
        sessions: 5,
        equipment: ["Barbell", "Dumbbells", "Cardio Equipment"],
        focus: ["Aerobic Capacity", "Lactate Threshold", "Strength Maintenance"],
        rating: 4.6,
        phases: [
            { name: "Foundation", duration: 4, color: "accum" },
            { name: "Development", duration: 4, color: "intens" },
            { name: "Peak", duration: 2, color: "peak" }
        ],
        science: "Based on scientific research on concurrent training, minimizing the interference effect, and optimizing the molecular pathways for both endurance and strength adaptations. The program implements strategic scheduling (separating endurance and strength training by at least 6 hours when possible), proper exercise selection, and periodized progression to maximize both cardiovascular and muscular adaptations.",
        recommended: [
            "Endurance athletes looking to maintain strength",
            "Strength athletes wanting to improve conditioning",
            "CrossFit and functional fitness enthusiasts",
            "Individuals with 1+ years of training experience"
        ],
        schedule: [
            {
                week: 1,
                phase: "Foundation",
                days: [
                    { day: "Monday", title: "Lower Body Strength", exercises: ["Squat 4x6", "Romanian Deadlift 3x8", "Split Squat 3x10/side", "Leg Curl 3x12", "20 min Zone 2 Cardio"] },
                    { day: "Tuesday", title: "Upper Body Strength", exercises: ["Bench Press 4x6", "Barbell Row 4x8", "Incline DB Press 3x10", "Cable Row 3x12", "Face Pull 3x15"] },
                    { day: "Wednesday", title: "Endurance Focus", exercises: ["30 min Interval Training (4 min Z2, 1 min Z4)", "Core Circuit 3 rounds", "Mobility Work"] },
                    { day: "Thursday", title: "Full Body Strength", exercises: ["Deadlift 4x5", "Overhead Press 4x6", "Pull-Up 3x8", "Dips 3x10", "20 min Zone 2 Cardio"] },
                    { day: "Friday", title: "Endurance + Accessory", exercises: ["40 min Steady State (Zone 2)", "Circuit: DB Lunges, Push-Ups, Rows 3 rounds", "Core Work 3 sets"] },
                    { day: "Saturday", title: "Long Endurance", exercises: ["60-90 min Low Intensity Cardio (Zone 1-2)"] },
                    { day: "Sunday", title: "Rest", exercises: [] }
                ]
            }
        ]
    },
    {
        id: "sport-1",
        title: "Athletic Performance Development",
        author: "Dr. Cal Dietz",
        category: "sport",
        description: "A 12-week sport-specific training program based on triphasic training principles for developing strength, power, and speed to enhance athletic performance. This program utilizes scientific research on force production, rate of force development, and sport-specific energy systems.",
        weeks: 12,
        level: "Intermediate-Advanced",
        sessions: 5,
        equipment: ["Full Gym", "Plyometric Equipment", "Speed Training Tools"],
        focus: ["Power", "Speed", "Sport Performance", "Force Production"],
        rating: 4.8,
        phases: [
            { name: "Eccentric", duration: 4, color: "accum" },
            { name: "Isometric", duration: 4, color: "intens" },
            { name: "Concentric", duration: 4, color: "peak" }
        ],
        science: "Based on Dr. Cal Dietz's Triphasic Training methodology and research on phase-potentiation for athletic development. The program systematically develops the three phases of muscle contraction (eccentric, isometric, concentric) to optimize force production and athletic performance. Scientific evidence supports the efficacy of this approach for enhancing speed, power, and sport-specific performance.",
        recommended: [
            "Team sport athletes (football, basketball, soccer, etc.)",
            "Track and field athletes",
            "Combat sport athletes",
            "Individuals with a solid strength foundation seeking athletic development"
        ],
        schedule: [
            {
                week: 1,
                phase: "Eccentric",
                days: [
                    { day: "Monday", title: "Lower Body Eccentric", exercises: ["Back Squat 4x5 (5-sec eccentric)", "RDL 3x6 (4-sec eccentric)", "Split Squat 3x6/side (3-sec eccentric)", "Lateral Lunge 2x8/side", "Core Anti-Rotation 3 sets"] },
                    { day: "Tuesday", title: "Upper Body Eccentric", exercises: ["Bench Press 4x5 (5-sec eccentric)", "Pull-Up 3x6 (4-sec eccentric)", "DB Shoulder Press 3x8 (3-sec eccentric)", "DB Row 3x8 (3-sec eccentric)", "Face Pull 3x12"] },
                    { day: "Wednesday", title: "Speed & Agility", exercises: ["Linear Sprint Technique 6x20m", "Change of Direction Drills 4 sets", "Reactive Agility 3 sets", "Mobility Work"] },
                    { day: "Thursday", title: "Total Body Power", exercises: ["Hang Clean 5x3", "Med Ball Rotational Throw 4x5/side", "Box Jump 4x5", "Kettlebell Swing 3x10", "Core Stability 3 sets"] },
                    { day: "Friday", title: "Upper/Lower Eccentric", exercises: ["Front Squat 4x5 (5-sec eccentric)", "Incline Press 4x5 (4-sec eccentric)", "Barbell Row 3x6 (4-sec eccentric)", "Nordic Curl 3x6", "Lateral Raise 3x10"] },
                    { day: "Saturday", title: "Conditioning", exercises: ["Sport-Specific Conditioning: 15-30 sec work, 1:3 work:rest ratio, 10-15 min"] },
                    { day: "Sunday", title: "Rest", exercises: [] }
                ]
            }
        ]
    },
    {
        id: "hypertrophy-2",
        title: "Push-Pull-Legs Hypertrophy Program",
        author: "Dr. Bret Contreras",
        category: "hypertrophy",
        description: "A 10-week push-pull-legs program optimized for muscle hypertrophy based on scientific research on training frequency, volume, and exercise selection. This program implements optimal training frequency (each muscle group 2x/week) with evidence-based volume for maximal hypertrophy.",
        weeks: 10,
        level: "Beginner-Intermediate",
        sessions: 6,
        equipment: ["Full Gym", "Barbell", "Dumbbells", "Machines"],
        focus: ["Full Body Hypertrophy", "Balanced Development", "Progressive Overload"],
        rating: 4.7,
        phases: [
            { name: "Foundation", duration: 3, color: "accum" },
            { name: "Hypertrophy", duration: 5, color: "intens" },
            { name: "Peak Volume", duration: 2, color: "peak" }
        ],
        science: "Based on peer-reviewed research on muscle protein synthesis, optimal training frequency (2x per muscle group per week), and volume landmarks for hypertrophy (10-20 weekly sets per muscle group). The program incorporates exercises selected based on EMG data and biomechanical analysis for optimal muscle recruitment and development.",
        recommended: [
            "Beginners to intermediate lifters focusing on muscle growth",
            "Those who prefer a balanced approach to muscle development",
            "Individuals who can train 5-6 days per week",
            "Lifters who enjoy variety in exercise selection"
        ],
        schedule: [
            {
                week: 1,
                phase: "Foundation",
                days: [
                    { day: "Monday", title: "Push A", exercises: ["Bench Press 3x8-10", "Seated DB Shoulder Press 3x10-12", "Incline DB Press 3x10-12", "Lateral Raise 3x12-15", "Tricep Pushdown 3x12-15", "Overhead Tricep Extension 3x12-15"] },
                    { day: "Tuesday", title: "Pull A", exercises: ["Barbell Row 3x8-10", "Pull-Up or Lat Pulldown 3x10-12", "Seated Cable Row 3x10-12", "Face Pull 3x15-20", "Bicep Curl 3x12-15", "Hammer Curl 3x12-15"] },
                    { day: "Wednesday", title: "Legs A", exercises: ["Squat 3x8-10", "Romanian Deadlift 3x10-12", "Leg Press 3x10-12", "Walking Lunge 3x10-12/side", "Leg Curl 3x12-15", "Standing Calf Raise 4x15-20"] },
                    { day: "Thursday", title: "Push B", exercises: ["Overhead Press 3x8-10", "Flat DB Press 3x10-12", "Machine Chest Press 3x10-12", "Cable Lateral Raise 3x12-15", "Cable Tricep Pushdown 3x12-15", "Dips 3x10-12"] },
                    { day: "Friday", title: "Pull B", exercises: ["Deadlift 3x6-8", "Chest-Supported Row 3x10-12", "Lat Pulldown 3x10-12", "Cable Straight-Arm Pulldown 3x12-15", "DB Curl 3x12-15", "Reverse Curl 3x12-15"] },
                    { day: "Saturday", title: "Legs B", exercises: ["Front Squat 3x8-10", "Bulgarian Split Squat 3x10-12/side", "Leg Extension 3x12-15", "Seated Leg Curl 3x12-15", "Hip Thrust 3x12-15", "Seated Calf Raise 4x15-20"] },
                    { day: "Sunday", title: "Rest", exercises: [] }
                ]
            }
        ]
    },
    {
        id: "strength-2",
        title: "Upper-Lower Strength Split",
        author: "Dr. Layne Norton",
        category: "strength",
        description: "An 8-week upper-lower body split program focused on strength development using scientifically-validated principles of progressive overload, optimal frequency, and undulating periodization. This program is designed to maximize strength gains while allowing adequate recovery.",
        weeks: 8,
        level: "Intermediate",
        sessions: 4,
        equipment: ["Barbell", "Dumbbells", "Power Rack"],
        focus: ["Strength", "Progressive Overload", "Balanced Development"],
        rating: 4.6,
        phases: [
            { name: "Base Building", duration: 3, color: "accum" },
            { name: "Strength Focus", duration: 3, color: "intens" },
            { name: "Peaking", duration: 2, color: "peak" }
        ],
        science: "Based on research on daily undulating periodization (DUP), optimal training frequency for strength development (2x per muscle group per week), and scientifically-validated loading parameters (70-95% 1RM). The program implements proper exercise selection based on mechanical advantage, movement specificity, and neuromuscular efficiency.",
        recommended: [
            "Intermediate lifters focusing on strength development",
            "Individuals who prefer training 4 days per week",
            "Those looking for balanced upper and lower body development",
            "Lifters with at least 6 months of consistent training"
        ],
        schedule: [
            {
                week: 1,
                phase: "Base Building",
                days: [
                    { day: "Monday", title: "Upper Strength", exercises: ["Bench Press 4x6 @80%", "Barbell Row 4x6", "Overhead Press 3x8", "Pull-Up 3x8", "Incline DB Press 3x10", "Face Pull 3x15"] },
                    { day: "Tuesday", title: "Lower Strength", exercises: ["Squat 4x6 @80%", "Romanian Deadlift 3x8", "Leg Press 3x10", "Walking Lunge 3x10/side", "Leg Curl 3x12", "Standing Calf Raise 4x15"] },
                    { day: "Wednesday", title: "Rest", exercises: [] },
                    { day: "Thursday", title: "Upper Volume", exercises: ["Incline Bench Press 3x10", "Seated Cable Row 3x10", "DB Shoulder Press 3x10", "Lat Pulldown 3x12", "Tricep Extension 3x12", "Bicep Curl 3x12"] },
                    { day: "Friday", title: "Lower Volume", exercises: ["Deadlift 3x6 @80%", "Front Squat 3x8", "Bulgarian Split Squat 3x10/side", "Leg Extension 3x12", "Seated Leg Curl 3x12", "Seated Calf Raise 4x15"] },
                    { day: "Saturday", title: "Rest", exercises: [] },
                    { day: "Sunday", title: "Rest", exercises: [] }
                ]
            }
        ]
    }
];

// Add proper variable declarations at the module level
let templatesModal;
let templatePreviewModal;
let templatesList;
let templatesCloseBtn;
let templatePreviewCloseBtn;
let hubBrowseTemplatesBtn;
let templatesSearch;
let categoryButtons;
let useTemplateBtn;
    let currentCategory = 'all';
    let currentSearchTerm = '';
    let currentTemplateId = null;

    // Initialize templates
function initialize() {
        console.log("Templates module initializing...");
    console.log(`Templates available: ${trainingTemplates.length}`);
    
    // Initialize DOM element references
    templatesModal = document.getElementById('templates-modal');
    templatePreviewModal = document.getElementById('template-preview-modal');
    templatesList = document.getElementById('templates-list');
    templatesCloseBtn = document.getElementById('templates-close-btn');
    templatePreviewCloseBtn = document.getElementById('template-preview-close-btn');
    // Try both possible browse templates button IDs
    hubBrowseTemplatesBtn = document.getElementById('hub-browse-templates-btn') || 
                           document.getElementById('hub-browse-templates');
    templatesSearch = document.getElementById('templates-search');
    categoryButtons = document.querySelectorAll('.template-category-btn');
    useTemplateBtn = document.getElementById('preview-use-template-btn');
    
    // Set up category buttons
    setCategoryFilters();
    
    // Set up event listeners
            addEventListeners();
            
    // Set up search functionality
    setupSearch();
    
    // Set up preview use button
    setupPreviewUseButton();
    
    // Initial render of templates
            if (templatesList) {
        renderTemplates();
            } else {
        console.error("Templates list container not found during initialization");
        }
    }

    // Render templates in the grid
    function renderTemplates() {
            console.log("renderTemplates: Clearing templatesList innerHTML");
            templatesList.innerHTML = '';

    // Filter templates based on search and category
            console.log(`renderTemplates: Filtering templates with category: ${currentCategory} and search term: ${currentSearchTerm}`);
    
    const filtered = trainingTemplates.filter(template => {
                const matchesCategory = currentCategory === 'all' || template.category === currentCategory;
                const matchesSearch = !currentSearchTerm || 
                    template.title.toLowerCase().includes(currentSearchTerm.toLowerCase()) ||
                    template.description.toLowerCase().includes(currentSearchTerm.toLowerCase());
                return matchesCategory && matchesSearch;
            });
            
    console.log(`renderTemplates: Filtered templates count: ${filtered.length}`);
            
    if (filtered.length === 0) {
        templatesList.innerHTML = '<div class="no-templates-msg">No matching templates found</div>';
                return;
            }
            
            console.log("renderTemplates: Creating and appending template cards");
    filtered.forEach((template, index) => {
        console.log(`renderTemplates: Creating card ${index+1}/${filtered.length} - ${template.title}`);
                const card = createTemplateCard(template);
                templatesList.appendChild(card);
                console.log(`renderTemplates: Card ${index+1} appended, container now has ${templatesList.children.length} children`);
            });
            
            console.log("renderTemplates: All template cards appended");
    console.log("renderTemplates: Final templatesList state:", templatesList);
    
    // Safely add animation classes after cards are in DOM
    function addAnimation() {
        // Apply staggered entrance animation to cards
                const cards = templatesList.querySelectorAll('.template-card');
                console.log(`renderTemplates: Found ${cards.length} cards for animation`);
        
        if (cards.length > 0) {
            // Only add animation to cards that are visibly contained in the templates grid
                cards.forEach((card, i) => {
                // Make sure the card is actually in the DOM and in its proper container
                if (card.parentElement === templatesList) {
                    const delay = i * 0.05;
                    console.log(`renderTemplates: Card ${i+1} animation delay set to ${delay}s`);
                    
                    // Add animation classes safely
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    
                    // Use requestAnimationFrame to ensure the initial state is rendered
                    window.requestAnimationFrame(() => {
                        // Add animation-specific classes
                    card.classList.add('animate-in');
                        card.style.animationDelay = `${delay}s`;
                        
                        // Transition to final state
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 50);
                });
                }
            });
        }
    }
    
    // Wait for cards to be properly inserted in DOM
    setTimeout(addAnimation, 100);
    }

    // Create a template card element
    function createTemplateCard(template) {
        console.log("createTemplateCard: Creating card for", template.id);
        const card = document.createElement('div');
        card.className = 'template-card';
        card.setAttribute('data-id', template.id);
        card.setAttribute('data-category', template.category);
        
    // Create card header
    const header = document.createElement('div');
    header.className = 'template-header';
    
    const title = document.createElement('h3');
    title.className = 'template-title';
    title.textContent = template.title;
    
    const author = document.createElement('p');
    author.className = 'template-author';
    author.textContent = `By ${template.author}`;
        
    const categoryIcon = document.createElement('div');
    categoryIcon.className = 'template-category-icon';
    categoryIcon.textContent = getCategoryIcon(template.category);
        
    header.appendChild(title);
    header.appendChild(author);
    header.appendChild(categoryIcon);
    
    // Create card body
    const body = document.createElement('div');
    body.className = 'template-body';
    
    // Description
    const description = document.createElement('p');
    description.className = 'template-description';
    description.textContent = template.description;
    
    // Metadata
    const metadata = document.createElement('div');
    metadata.className = 'template-metadata';
    
    // Duration
    const durationSpan = document.createElement('span');
    durationSpan.innerHTML = `
                        ⏱️ ${template.weeks} weeks
    `;
    
    // Level
    const levelSpan = document.createElement('span');
    levelSpan.innerHTML = `
                        💪 ${template.level}
    `;
    
    // Frequency
    const frequencySpan = document.createElement('span');
    frequencySpan.innerHTML = `
                        🔄 ${template.sessions}x/week
    `;
    
    metadata.appendChild(durationSpan);
    metadata.appendChild(levelSpan);
    metadata.appendChild(frequencySpan);
    
    // Focus areas
    const focusAreas = document.createElement('div');
    focusAreas.className = 'template-focus-areas';
    
    template.focus.forEach(focus => {
        const tag = document.createElement('span');
        tag.className = 'template-focus-tag';
        tag.textContent = focus;
        focusAreas.appendChild(tag);
    });
    
    // Rating
    const rating = document.createElement('div');
    rating.className = 'template-rating';
    
    const stars = document.createElement('div');
    stars.className = 'rating-stars';
    stars.textContent = '★'.repeat(Math.round(template.rating));
    
    const ratingValue = document.createElement('div');
    ratingValue.className = 'rating-value';
    ratingValue.textContent = template.rating.toFixed(1);
    
    rating.appendChild(stars);
    rating.appendChild(ratingValue);
    
    // Footer with buttons
    const footer = document.createElement('div');
    footer.className = 'template-footer';
    
    const previewBtn = document.createElement('button');
    previewBtn.className = 'template-preview-btn';
    previewBtn.textContent = 'Preview';
    previewBtn.setAttribute('data-id', template.id);
    previewBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("Preview button clicked for template:", template.id);
        showTemplatePreview(template.id);
    };
    
    const useBtn = document.createElement('button');
    useBtn.className = 'template-use-btn';
    useBtn.textContent = 'Use';
    useBtn.setAttribute('data-id', template.id);
    useBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log("Use button clicked for template:", template.id);
        useTemplate(template.id);
    };
    
    footer.appendChild(previewBtn);
    footer.appendChild(useBtn);
    
    // Add all elements to card
    body.appendChild(description);
    body.appendChild(metadata);
    body.appendChild(focusAreas);
    body.appendChild(rating);
    body.appendChild(footer);
    
    card.appendChild(header);
    card.appendChild(body);
    
    console.log("Card HTML structure created for template:", template.id);
        return card;
    }

    // Show template preview modal with detailed info and animations
    function showTemplatePreview(templateId) {
        const template = trainingTemplates.find(t => t.id === templateId);
    if (!template) {
        console.error(`Template with ID ${templateId} not found for preview`);
        return;
    }
    
    console.log(`Showing preview for template: ${template.title}`);
        
        currentTemplateId = templateId;
    
    // Get fresh references to DOM elements
    const templatePreviewModal = document.getElementById('template-preview-modal');
    const templatePreviewCloseBtn = document.getElementById('template-preview-close-btn');
    
    if (!templatePreviewModal) {
        console.error("Template preview modal not found in DOM");
        return;
    }
    
    // Ensure close button has click handler
    if (templatePreviewCloseBtn) {
        // Remove any existing handlers to prevent duplicates
        templatePreviewCloseBtn.onclick = function(e) {
            console.log("Template preview close button clicked");
            e.preventDefault();
            e.stopPropagation();
            templatePreviewModal.classList.remove('is-visible');
            templatePreviewModal.style.opacity = '0';
            templatePreviewModal.style.visibility = 'hidden';
        };
    } else {
        console.error("Template preview close button not found");
    }
        
        // Set preview content
    const titleElement = document.querySelector('.template-preview-title');
    if (titleElement) titleElement.textContent = template.title;
    
    const authorElement = document.querySelector('.template-preview-author');
    if (authorElement) authorElement.textContent = `By ${template.author}`;
    
    const descriptionElement = document.querySelector('.template-preview-description');
    if (descriptionElement) descriptionElement.textContent = template.description;
        
        // Set category-specific icon
        const previewIcon = document.querySelector('.template-preview-icon');
        previewIcon.textContent = getCategoryIcon(template.category);
        previewIcon.style.backgroundColor = getCategoryColor(template.category, 0.2);
        previewIcon.style.color = getCategoryColor(template.category, 1);
        
        // Create and insert category-specific animation
        const visualContent = document.querySelector('.template-visual-content');
        visualContent.innerHTML = '';
        visualContent.appendChild(createCategoryAnimation(template.category));
        
        // Render phases
        const phasesContainer = document.querySelector('.template-preview-phases');
        phasesContainer.innerHTML = '';
        template.phases.forEach(phase => {
            const phaseElement = document.createElement('div');
            phaseElement.className = `template-preview-phase ${phase.color}`;
            phaseElement.style.width = `${phase.duration / template.weeks * 100}%`;
            phaseElement.textContent = `${phase.name} (${phase.duration}wk)`;
            phasesContainer.appendChild(phaseElement);
        });
        
        // Render weekly schedule
        const scheduleContainer = document.querySelector('.template-preview-schedule');
        scheduleContainer.innerHTML = '';
        
        template.schedule.forEach(week => {
            const weekElement = document.createElement('div');
            weekElement.className = 'template-preview-week';
            
            const weekHeader = document.createElement('div');
            weekHeader.className = 'template-preview-week-header';
            weekHeader.textContent = `Week ${week.week} - ${week.phase}`;
            weekElement.appendChild(weekHeader);
            
            const daysGrid = document.createElement('div');
            daysGrid.className = 'template-preview-days';
            
            for (let i = 0; i < 7; i++) {
                const dayOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][i];
                const dayData = week.days.find(d => d.day === dayOfWeek);
                
                const dayElement = document.createElement('div');
                dayElement.className = 'template-preview-day';
                
                if (!dayData || dayData.title === 'Rest' || dayData.exercises.length === 0) {
                    dayElement.classList.add('rest-day');
                    dayElement.textContent = 'Rest Day';
                } else {
                    const sessionTitle = document.createElement('div');
                    sessionTitle.className = 'template-preview-session-title';
                    sessionTitle.textContent = dayData.title;
                    dayElement.appendChild(sessionTitle);
                    
                    dayData.exercises.forEach(exercise => {
                        const exerciseElement = document.createElement('div');
                        exerciseElement.className = 'template-preview-exercise';
                        exerciseElement.textContent = exercise;
                        dayElement.appendChild(exerciseElement);
                    });
                }
                
                daysGrid.appendChild(dayElement);
            }
            
            weekElement.appendChild(daysGrid);
            scheduleContainer.appendChild(weekElement);
        });
        
        // Add click to toggle collapse for week headers
        document.querySelectorAll('.template-preview-week-header').forEach(header => {
            header.addEventListener('click', function() {
                this.parentElement.classList.toggle('collapsed');
            });
        });
        
        // Render scientific background
        document.querySelector('.template-preview-science-content').textContent = template.science;
        
        // Render recommendations
        const recommendedList = document.querySelector('.template-preview-recommended ul');
        recommendedList.innerHTML = '';
        template.recommended.forEach(rec => {
            const li = document.createElement('li');
            li.textContent = rec;
            recommendedList.appendChild(li);
        });
    
    // Reset any inline styles that might have been applied when closing
    templatePreviewModal.style.display = '';
    templatePreviewModal.style.opacity = '';
    templatePreviewModal.style.visibility = '';
        
        // Show modal
        templatePreviewModal.classList.add('is-visible');
    
    // Force layout calculation for animation
    window.requestAnimationFrame(() => {
        templatePreviewModal.style.opacity = '1';
        templatePreviewModal.style.visibility = 'visible';
    });
}

// Fix useTemplate function to properly load and apply templates
    function useTemplate(templateId) {
        const template = trainingTemplates.find(t => t.id === templateId);
    if (!template) {
        console.error(`Template with ID ${templateId} not found for use`);
        return;
    }

        console.log(`Using template: ${template.title}`);

    // First ensure we close all template modals
    const templatesModal = document.getElementById('templates-modal');
    const templatePreviewModal = document.getElementById('template-preview-modal');
    
    if (templatesModal) {
        templatesModal.classList.remove('is-visible');
        templatesModal.style.opacity = '0';
        templatesModal.style.visibility = 'hidden';

        // Clear templates list to prevent it from showing later
        if (templatesList) {
            templatesList.innerHTML = '';
        }
    }
    
    if (templatePreviewModal) {
        templatePreviewModal.classList.remove('is-visible');
        templatePreviewModal.style.opacity = '0';
        templatePreviewModal.style.visibility = 'hidden';
            }
    
    // Wait for blockBuilder to be ready (if not already)
    const loadBlockBuilder = () => {
            console.log("Block builder ready immediately.");
        
        // If we have a global reference to the blockBuilder
        if (window.blockBuilder && typeof window.blockBuilder.loadTemplateBlock === 'function') {
            console.log(`Calling blockBuilder.loadTemplateBlock with template: "${template.title}"`);
            const success = window.blockBuilder.loadTemplateBlock(template);
            
            if (!success) {
                console.error("Failed to load template into block builder");
                showToast("Failed to load template. Please try again.", "error");
        } else {
                showToast(`Template "${template.title}" applied successfully!`, "success");
            }
        } else {
            console.error("blockBuilder.loadTemplateBlock function not available");
            showToast("Template system is not initialized properly.", "error");
        }
    };
    
    // If blockBuilder is already ready, use it directly
    if (document.readyState === 'complete' && window.blockBuilder) {
        loadBlockBuilder();
    } else {
        // Otherwise wait for the blockbuilderReady event
        window.addEventListener('blockbuilderReady', loadBlockBuilder, { once: true });
        // Also set a timeout in case the event never fires
            setTimeout(() => {
            if (window.blockBuilder) {
                loadBlockBuilder();
            } else {
                console.error("blockBuilder not available after timeout");
                showToast("Failed to initialize template. Please refresh the page and try again.", "error");
            }
        }, 2000);
    }
}

// Add a missing function for setting up category filters
function setCategoryFilters() {
    console.log("Setting up template category filters");
    
    // Get all category buttons
    const categoryButtons = document.querySelectorAll('.template-category-btn');
    if (categoryButtons.length === 0) {
        console.warn("No category buttons found to initialize");
        return;
    }
    
    // Add click event listeners to category buttons
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            categoryButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            // Set the current category
            currentCategory = this.getAttribute('data-category');
            console.log(`Category filter set to: ${currentCategory}`);
            // Render templates with the new filter
            renderTemplates();
        });
    });
    
    console.log("Category filters initialized");
}

// Add a missing function for setting up search
function setupSearch() {
    console.log("Setting up template search functionality");
    
    const searchInput = document.getElementById('templates-search');
    if (!searchInput) {
        console.warn("Template search input not found");
        return;
    }
    
    // Add input event listener
    searchInput.addEventListener('input', function() {
        currentSearchTerm = this.value.trim();
        console.log(`Search term updated: "${currentSearchTerm}"`);
        renderTemplates();
    });
    
    console.log("Template search initialized");
}

// Fix the function to set up the preview use button
function setupPreviewUseButton() {
    console.log("Setting up template preview use button");
    
    // Try both possible button IDs
    const previewUseTemplateBtn = document.getElementById('preview-use-template-btn') || 
                                 document.getElementById('use-template-btn');
    
    if (previewUseTemplateBtn) {
        previewUseTemplateBtn.addEventListener('click', function() {
            console.log("Use template button clicked from preview");
            if (currentTemplateId) {
                useTemplate(currentTemplateId);
            } else {
                console.error("No template ID found when Use Template clicked");
            }
        });
        console.log("Preview use template button initialized");
    } else {
        console.warn("Preview use template button not found with either ID 'preview-use-template-btn' or 'use-template-btn'");
        }
    }

    // Add all event listeners
    function addEventListeners() {
        // Ensure all DOM references are up to date
        if (!templatesModal) templatesModal = document.getElementById('templates-modal');
        if (!templatePreviewModal) templatePreviewModal = document.getElementById('template-preview-modal');
        if (!templatesList) templatesList = document.getElementById('templates-list');
        if (!templatesCloseBtn) templatesCloseBtn = document.getElementById('templates-close-btn');
        if (!templatePreviewCloseBtn) templatePreviewCloseBtn = document.getElementById('template-preview-close-btn');
        if (!hubBrowseTemplatesBtn) hubBrowseTemplatesBtn = document.getElementById('hub-browse-templates-btn') || document.getElementById('hub-browse-templates');
        if (!templatesSearch) templatesSearch = document.getElementById('templates-search');
        if (!categoryButtons || categoryButtons.length === 0) categoryButtons = document.querySelectorAll('.template-category-btn');
        if (!useTemplateBtn) useTemplateBtn = document.getElementById('preview-use-template-btn');
        
        console.log("Templates module: Adding event listeners");
        
        // Browse Templates button click
        if (hubBrowseTemplatesBtn) {
            hubBrowseTemplatesBtn.addEventListener('click', () => {
                console.log("Templates: Opening templates modal");
            const templatesModal = document.getElementById('templates-modal');
                if (templatesModal) {
                    // Reset any inline styles that might have been applied when closing
                    templatesModal.style.display = '';
                    templatesModal.style.opacity = '';
                    templatesModal.style.visibility = '';
                
                // Re-render templates before showing the modal
                const templatesList = document.getElementById('templates-list');
                if (templatesList) {
                    renderTemplates();
                }
                    
                    // Add the visible class 
                    templatesModal.classList.add('is-visible');
                    
                    // Force layout calculation for animation
                    window.requestAnimationFrame(() => {
                        templatesModal.style.opacity = '1';
                        templatesModal.style.visibility = 'visible';
                    });
                } else {
                    console.error("Templates modal not found");
                }
            });
        }
        
        if (templatesCloseBtn && templatesModal) {
        console.log('Templates: Adding close button event listener');
        templatesCloseBtn.addEventListener('click', () => {
            console.log('Templates: Close button clicked');
            const templatesModal = document.getElementById('templates-modal');
            if (templatesModal) {
                templatesModal.classList.remove('is-visible');
                // Clear the templates list when modal is closed
                if (templatesList) {
                    templatesList.innerHTML = '';
                    console.log('Templates: Cleared templates list on modal close');
                }
            }
            });
        }
        
        if (templatePreviewCloseBtn && templatePreviewModal) {
            templatePreviewCloseBtn.addEventListener('click', function() {
                console.log("Template preview modal close button clicked");
                templatePreviewModal.classList.remove('is-visible');
                
                // Only modify opacity and visibility, DO NOT set display:none
                templatePreviewModal.style.opacity = '0';
                templatePreviewModal.style.visibility = 'hidden';
            });
        } else {
            console.error("Template preview modal close button or modal not found:", {
                templatePreviewCloseBtn: templatePreviewCloseBtn ? "Found" : "Missing", 
                templatePreviewModal: templatePreviewModal ? "Found" : "Missing"
            });
        }
        
        // Search input
        if (templatesSearch) {
            templatesSearch.addEventListener('input', function() {
                currentSearchTerm = this.value.trim();
                renderTemplates();
            });
        }
        
        // Category filtering
        if (categoryButtons) {
            categoryButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    categoryButtons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    currentCategory = this.getAttribute('data-category');
                    renderTemplates();
                });
            });
        }
        
    // Open template preview modal when Preview button is clicked
        if (templatesList) {
        templatesList.addEventListener('click', (e) => {
                const previewBtn = e.target.closest('.template-preview-btn');
                const useBtn = e.target.closest('.template-use-btn');
                
                if (previewBtn) {
                e.preventDefault();
                    const templateId = previewBtn.getAttribute('data-id');
                if (templateId) {
                    showTemplatePreview(templateId);
                }
                } else if (useBtn) {
                e.preventDefault();
                    const templateId = useBtn.getAttribute('data-id');
                if (templateId) {
                    useTemplate(templateId);
                }
                }
            });
    } else {
        console.error("Templates module: Cannot attach click event to templatesList - element not found");
        }
        
        // Use template button in preview modal
        if (useTemplateBtn && currentTemplateId) {
            useTemplateBtn.addEventListener('click', function() {
                useTemplate(currentTemplateId);
            });
        }
        
    // Close modal when clicking outside of content
    const templatesModal = document.getElementById('templates-modal');
    if (templatesModal) {
        templatesModal.addEventListener('click', (e) => {
            // Only close if clicking directly on the modal overlay (not its children)
            if (e.target === templatesModal) {
                    templatesModal.classList.remove('is-visible');
                // Clear the templates list when modal is closed
                if (templatesList) {
                    templatesList.innerHTML = '';
                    console.log('Templates: Cleared templates list on modal background click');
                }
                }
            });
        }
    
    // Add keyboard escape handler to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            console.log('Templates: Escape key pressed');
            const templatesModal = document.getElementById('templates-modal');
            if (templatesModal && templatesModal.classList.contains('is-visible')) {
                templatesModal.classList.remove('is-visible');
                // Clear the templates list when modal is closed
                if (templatesList) {
                    templatesList.innerHTML = '';
                    console.log('Templates: Cleared templates list on escape key');
                }
            }
        }
    });
        
        console.log("Templates module: Event listeners attached");
    }
    
    // Make the templates list display as a grid
    function applyTemplateGridLayout() {
        // Ensure templatesList is defined before adding class
        if (templatesList) { 
            templatesList.classList.add('templates-grid');
        } else {
             console.error("applyTemplateGridLayout: templatesList not found when trying to add class.");
        }
    }
    
    // Initialize on load
initialize();

    console.log("Templates module setup complete");

// Helper function to get category-specific icon
function getCategoryIcon(category) {
    switch(category) {
        case 'strength': return '🏋️';
        case 'hypertrophy': return '💪';
        case 'powerlifting': return '🔨';
        case 'olympic': return '🥇';
        case 'endurance': return '🏃';
        case 'sport': return '⚽';
        default: return '📋';
    }
}

// Helper function to get category-specific color
function getCategoryColor(category, opacity = 1) {
    switch(category) {
        case 'strength': return `rgba(58, 123, 213, ${opacity})`;
        case 'hypertrophy': return `rgba(255, 112, 59, ${opacity})`;
        case 'powerlifting': return `rgba(204, 43, 94, ${opacity})`;
        case 'olympic': return `rgba(76, 161, 175, ${opacity})`;
        case 'endurance': return `rgba(95, 108, 129, ${opacity})`;
        case 'sport': return `rgba(117, 58, 136, ${opacity})`;
        default: return `rgba(100, 100, 100, ${opacity})`;
    }
}

// Helper function to create category-specific animations
function createCategoryAnimation(category) {
    const container = document.createElement('div');
    container.className = `${category}-animation`;
    
    switch(category) {
        case 'hypertrophy':
            // Create the floor gradient line
            const floor = document.createElement('div');
            floor.className = 'floor';
            container.appendChild(floor);
            
            for (let i = 0; i < 5; i++) {
                const bar = document.createElement('div');
                bar.className = 'bar';
                container.appendChild(bar);
            }
            break;
            
        case 'strength':
            const weight = document.createElement('div');
            weight.className = 'weight';
            container.appendChild(weight);
            
            // Add barbell plates
            for (let i = 0; i < 2; i++) {
                const plate = document.createElement('div');
                plate.className = 'plate';
                container.appendChild(plate);
            }
            break;
            
        case 'powerlifting':
            const bar = document.createElement('div');
            bar.className = 'bar';
            
            const weightLeft = document.createElement('div');
            weightLeft.className = 'weight';
            
            const weightRight = document.createElement('div');
            weightRight.className = 'weight';
            
            bar.appendChild(weightLeft);
            bar.appendChild(weightRight);
            container.appendChild(bar);
            break;
            
        case 'olympic':
            const obar = document.createElement('div');
            obar.className = 'bar';
            
            const oweightLeft = document.createElement('div');
            oweightLeft.className = 'weight';
            
            const oweightRight = document.createElement('div');
            oweightRight.className = 'weight';
            
            obar.appendChild(oweightLeft);
            obar.appendChild(oweightRight);
            container.appendChild(obar);
            break;
            
        case 'endurance':
            const track = document.createElement('div');
            track.className = 'track';
            
            const runner = document.createElement('div');
            runner.className = 'runner';
            
            // Add dust particles
            for (let i = 0; i < 3; i++) {
                const dust = document.createElement('div');
                dust.className = 'dust';
                container.appendChild(dust);
            }
            
            container.appendChild(track);
            container.appendChild(runner);
            break;
            
        case 'sport':
            const surface = document.createElement('div');
            surface.className = 'surface';
            
            const figure = document.createElement('div');
            figure.className = 'figure';
            
            // Add shadow element
            const shadow = document.createElement('div');
            shadow.className = 'shadow';
            
            container.appendChild(surface);
            container.appendChild(figure);
            container.appendChild(shadow);
            break;
            
        default:
            container.textContent = '📊';
    }
    
    return container;
} 

// Initialize the module when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("Templates module DOM content loaded");
    
    // Check if DOM elements exist and log warnings if they don't
    if (!document.getElementById('templates-modal')) {
        console.error("Templates module: 'templates-modal' element not found");
    }
    
    if (!document.getElementById('templates-list')) {
        console.error("Templates module: 'templates-list' element not found");
    }
    
    if (!document.getElementById('hub-browse-templates') && !document.getElementById('hub-browse-templates-btn')) {
        console.error("Templates module: Neither 'hub-browse-templates' nor 'hub-browse-templates-btn' found");
    }
    
    // Initialize the module
    initialize();
});

// Export functionality if needed
export { useTemplate, showTemplatePreview }; 