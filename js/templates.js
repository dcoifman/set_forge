/**
 * Templates Module for SetForge Block Builder
 * Contains detailed, research-based training program templates.
 */

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

// Event Listeners and DOM Manipulation
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const hubBrowseTemplatesBtn = document.getElementById('hub-browse-templates');
    const templatesModal = document.getElementById('templates-modal');
    const templatesCloseBtn = document.getElementById('templates-close-btn');
    const templatesList = document.getElementById('templates-list');
    const templatesSearch = document.getElementById('templates-search');
    const categoryButtons = document.querySelectorAll('.template-category-btn');
    
    const templatePreviewModal = document.getElementById('template-preview-modal');
    const templatePreviewCloseBtn = document.getElementById('template-preview-close-btn');
    const useTemplateBtn = document.getElementById('use-template-btn');
    
    // Current state
    let currentCategory = 'all';
    let currentSearchTerm = '';
    let currentTemplateId = null;

    // Initialize templates
    function init() {
        renderTemplates();
        addEventListeners();
        applyTemplateGridLayout();
    }

    // Render templates in the grid
    function renderTemplates() {
        templatesList.innerHTML = '';
        
        const filteredTemplates = trainingTemplates.filter(template => {
            const matchesCategory = currentCategory === 'all' || template.category === currentCategory;
            const matchesSearch = template.title.toLowerCase().includes(currentSearchTerm.toLowerCase()) || 
                                  template.description.toLowerCase().includes(currentSearchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
        
        if (filteredTemplates.length === 0) {
            templatesList.innerHTML = '<p class="no-templates">No templates found matching your criteria.</p>';
            return;
        }
        
        filteredTemplates.forEach(template => {
            const templateCard = createTemplateCard(template);
            templatesList.appendChild(templateCard);
        });
    }

    // Create a template card element
    function createTemplateCard(template) {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.setAttribute('data-id', template.id);
        card.setAttribute('data-category', template.category);
        
        // Create rating stars
        const starFull = '★';
        const starEmpty = '☆';
        const ratingRounded = Math.round(template.rating * 2) / 2;
        const fullStars = Math.floor(ratingRounded);
        const halfStar = ratingRounded % 1 !== 0;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        const starsHtml = 
            starFull.repeat(fullStars) + 
            (halfStar ? '½' : '') + 
            starEmpty.repeat(emptyStars);
        
        // Get category-specific animation icon
        const animationIcon = getCategoryIcon(template.category);
        
        card.innerHTML = `
            <div class="template-header">
                <h3 class="template-title">${template.title}</h3>
                <p class="template-author">By ${template.author}</p>
                <span class="template-animation-icon">${animationIcon}</span>
            </div>
            <div class="template-body">
                <p class="template-description">${template.description.length > 150 ? template.description.substring(0, 150) + '...' : template.description}</p>
                <div class="template-metadata">
                    <span class="template-meta-item">
                        <span class="template-meta-icon">⏱️</span> ${template.weeks} weeks
                    </span>
                    <span class="template-meta-item">
                        <span class="template-meta-icon">💪</span> ${template.level}
                    </span>
                    <span class="template-meta-item">
                        <span class="template-meta-icon">🔄</span> ${template.sessions}x/week
                    </span>
                </div>
                <div class="template-focus-areas">
                    ${template.focus.map(area => `<span class="template-focus-tag">${area}</span>`).join('')}
                </div>
            </div>
            <div class="template-footer">
                <div class="template-rating">
                    <span class="template-rating-stars">${starsHtml}</span>
                    <span>${template.rating}</span>
                </div>
                <div>
                    <button class="template-preview-btn" data-id="${template.id}">Preview</button>
                    <button class="template-use-btn" data-id="${template.id}">Use</button>
                </div>
            </div>
        `;
        
        return card;
    }

    // Show template preview modal with detailed info and animations
    function showTemplatePreview(templateId) {
        const template = trainingTemplates.find(t => t.id === templateId);
        if (!template) return;
        
        currentTemplateId = templateId;
        
        // Set preview content
        document.querySelector('.template-preview-title').textContent = template.title;
        document.querySelector('.template-preview-author').textContent = `By ${template.author}`;
        document.querySelector('.template-preview-description').textContent = template.description;
        
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
        
        // Show modal
        templatePreviewModal.classList.add('is-visible');
    }

    // Use selected template to create new block
    function useTemplate(templateId) {
        const template = trainingTemplates.find(t => t.id === templateId);
        if (!template) return;
        
        // Here we would integrate with the blockbuilder to apply the template
        // This depends on how the blockbuilder handles block creation
        console.log(`Using template: ${template.title}`);
        
        // Close the modals
        templatesModal.classList.remove('is-visible');
        templatePreviewModal.classList.remove('is-visible');
        
        // Show builder view
        document.body.classList.remove('show-hub');
        document.body.classList.add('show-builder');
        
        // Trigger block builder's template loading function (to be implemented)
        if (typeof window.blockBuilder !== 'undefined' && 
            typeof window.blockBuilder.loadTemplateBlock === 'function') {
            window.blockBuilder.loadTemplateBlock(template);
        } else {
            // Fallback if integration not available
            alert(`Template selected: ${template.title}\n\nThis would create a new ${template.weeks}-week training block based on this template.`);
        }
    }

    // Add all event listeners
    function addEventListeners() {
        // Open templates modal
        hubBrowseTemplatesBtn.addEventListener('click', function() {
            templatesModal.classList.add('is-visible');
        });
        
        // Close templates modal
        templatesCloseBtn.addEventListener('click', function() {
            templatesModal.classList.remove('is-visible');
        });
        
        // Close template preview modal
        templatePreviewCloseBtn.addEventListener('click', function() {
            templatePreviewModal.classList.remove('is-visible');
        });
        
        // Search input
        templatesSearch.addEventListener('input', function() {
            currentSearchTerm = this.value.trim();
            renderTemplates();
        });
        
        // Category filtering
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                categoryButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                currentCategory = this.getAttribute('data-category');
                renderTemplates();
            });
        });
        
        // Template actions delegation (preview and use buttons)
        templatesList.addEventListener('click', function(e) {
            const previewBtn = e.target.closest('.template-preview-btn');
            const useBtn = e.target.closest('.template-use-btn');
            
            if (previewBtn) {
                const templateId = previewBtn.getAttribute('data-id');
                showTemplatePreview(templateId);
            } else if (useBtn) {
                const templateId = useBtn.getAttribute('data-id');
                useTemplate(templateId);
            }
        });
        
        // Use template button in preview modal
        useTemplateBtn.addEventListener('click', function() {
            if (currentTemplateId) {
                useTemplate(currentTemplateId);
            }
        });
        
        // Close modals when clicking outside
        window.addEventListener('click', function(e) {
            if (e.target === templatesModal) {
                templatesModal.classList.remove('is-visible');
            }
            if (e.target === templatePreviewModal) {
                templatePreviewModal.classList.remove('is-visible');
            }
        });
    }
    
    // Initialize on load
    init();
});

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
            
            container.appendChild(track);
            container.appendChild(runner);
            break;
            
        case 'sport':
            const surface = document.createElement('div');
            surface.className = 'surface';
            
            const figure = document.createElement('div');
            figure.className = 'figure';
            
            container.appendChild(surface);
            container.appendChild(figure);
            break;
            
        default:
            container.textContent = '📊';
    }
    
    return container;
}

// Make the templates list display as a grid
function applyTemplateGridLayout() {
    templatesList.classList.add('templates-grid');
} 