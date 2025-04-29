document.addEventListener('DOMContentLoaded', () => {

    // --- Intersection Observer for animations --- //
    const observerOptions = {
        root: null, // relative to document viewport 
        rootMargin: '0px', // margin around root. Values are similar to css property. Unitless values not allowed
        threshold: 0.1 // Trigger when 10% is visible
    };

    // Store interval IDs to clear later if needed
    const intervalIds = {};

    const observerCallback = (entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                console.log(`Intersection Observer: Entry ${entry.target.id || entry.target.className} is visible.`); // Log intersection
                
                // --- Start Block Builder Animation if it's the showcase --- 
                if (entry.target.id === 'block-builder-showcase') {
                    console.log('Showcase visible, scheduling animation start...'); // Log scheduling
                    // Use setTimeout to wait for initial CSS popIn animations (approx 2.2s + 0.6s = 2.8s)
                    setTimeout(() => {
                        startTimelineAnimation(entry.target); // Pass the section element
                    }, 3000); // Start JS loop after 3 seconds
                }
                
                observer.unobserve(entry.target); // Observe only once
            }
            // Optional: Clear interval if element leaves viewport (more complex)
            // else if (entry.target.id === 'block-builder-showcase') { ... clear interval ... } 
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe elements that need fade-in-up or other entry animations
    const animatedElements = document.querySelectorAll('.feature-card, .step-card, .cta-section, .block-builder-showcase');
    animatedElements.forEach((el) => {
        observer.observe(el);
    });
    

    // --- Smooth scrolling for anchor links --- //
    document.querySelectorAll('a[href^="\"], button[onclick*=\"scrollIntoView\"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            let targetId = '';
            if (this.tagName === 'A') {
                targetId = this.getAttribute('href');
            } else if (this.tagName === 'BUTTON' && this.getAttribute('onclick')) {
                const match = this.getAttribute('onclick').match(/document\.getElementById\('([^']+)'\)/);
                if (match) targetId = '#' + match[1];
            }

            if (targetId && targetId.length > 1 && document.querySelector(targetId)) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                
                // Close mobile menu if open
                const body = document.body;
                const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
                if (body.classList.contains('mobile-nav-active')) {
                    body.classList.remove('mobile-nav-active');
                    if (mobileNavToggle) mobileNavToggle.setAttribute('aria-expanded', 'false');
                }

                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- Update Copyright Year --- //
    const currentYearSpan = document.getElementById('current-year');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Mobile Menu Toggle --- //
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const body = document.body;

    if (mobileNavToggle) {
        mobileNavToggle.addEventListener('click', () => {
            body.classList.toggle('mobile-nav-active');
            const isExpanded = body.classList.contains('mobile-nav-active');
            mobileNavToggle.setAttribute('aria-expanded', isExpanded);
        });
    }

    // --- Add any other interactive elements here --- //
    // Example: Mobile menu toggle, form validation, etc.

    // --- Block Builder Animation Logic --- 
    function applyTimelineState(stateName, state) {
        console.log(`Applying state: ${stateName}`); // Log state application attempt
        const phase1 = document.getElementById('phase1');
        const phase2 = document.getElementById('phase2');
        const phase3 = document.getElementById('phase3');

        if (!phase1 || !phase2 || !phase3) {
            console.error('Phase elements not found!'); // Log if elements are missing
            return;
        }

        // Set attributes directly
        console.log(` -> Phase 1: x=${state.p1.x}, width=${state.p1.width}`);
        phase1.setAttribute('x', state.p1.x);
        phase1.setAttribute('width', state.p1.width);

        console.log(` -> Phase 2: x=${state.p2.x}, width=${state.p2.width}`);
        phase2.setAttribute('x', state.p2.x);
        phase2.setAttribute('width', state.p2.width);

        console.log(` -> Phase 3: x=${state.p3.x}, width=${state.p3.width}`);
        phase3.setAttribute('x', state.p3.x);
        phase3.setAttribute('width', state.p3.width);
        
        // Optional: Add a subtle scaleY breath effect via JS if needed
        // const scaleY = state.scaleY || 1;
        // phase1.style.transform = `scaleY(${scaleY})`
        // phase2.style.transform = `scaleY(${scaleY})`
        // phase3.style.transform = `scaleY(${scaleY})`
    }

    function updateDynamicText(stateName) {
        console.log(`Updating text for state: ${stateName}`);
        const textItems = document.querySelectorAll('.showcase-dynamic-text .dynamic-text-item');
        let activeItemSelector = '.dynamic-text-item[data-state="initial"]'; // Default

        if (stateName === 'Shifted') {
            activeItemSelector = '.dynamic-text-item[data-state="adapted"]'; // Show adapting text when shifted
        } else if (stateName === 'Disruption') { // We might need a specific call for this
             activeItemSelector = '.dynamic-text-item[data-state="disruption"]';
        }
        // Otherwise, it defaults to 'initial'

        textItems.forEach(item => {
            item.classList.remove('is-active');
        });

        const activeItem = document.querySelector(activeItemSelector);
        if (activeItem) {
            activeItem.classList.add('is-active');
        } else {
            console.warn(`Dynamic text item not found for selector: ${activeItemSelector}`);
        }
    }

    function startTimelineAnimation(sectionElement) {
        console.log('startTimelineAnimation called.'); // Log function start
        // Prevent multiple intervals if observer triggers rapidly
        if (intervalIds[sectionElement.id]) {
            console.log('Interval already running, skipping.');
            return;
        }

        const initialState = { 
            p1: { x: 50, width: 200 }, 
            p2: { x: 250, width: 300 }, 
            p3: { x: 550, width: 200 } 
        };
        const totalWidth = 700;
        const shiftedState = { 
            p1: { x: 50, width: totalWidth * (4/8) }, 
            p2: { x: 50 + (totalWidth * (4/8)), width: totalWidth * (2/8) }, 
            p3: { x: 50 + (totalWidth * (4/8)) + (totalWidth * (2/8)), width: totalWidth * (2/8) } 
        };

        applyTimelineState('Initial (start)', initialState);
        updateDynamicText('initial'); // Set initial text

        const intervalId = setInterval(() => {
            console.log('Animation interval tick.'); 
            // Show disruption text slightly before block shift starts
            setTimeout(() => {
                updateDynamicText('Disruption'); 
            }, 2800);

            // Shift blocks at 3s
            setTimeout(() => {
                applyTimelineState('Shifted', shiftedState);
            }, 3000);

            // Show adapted text at 4s
            setTimeout(() => {
                updateDynamicText('Shifted');
            }, 4000);

            // Schedule shift back to initial state (7s into the 10s cycle)
            setTimeout(() => {
                applyTimelineState('Initial (loop)', initialState);
                updateDynamicText('initial'); // Update text back to initial
            }, 7000);

        }, 10000); // Run every 10 seconds

        intervalIds[sectionElement.id] = intervalId;
        console.log(`Interval ${intervalId} started for ${sectionElement.id}.`);
    }

}); 