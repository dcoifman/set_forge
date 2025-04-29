# ForgeAssist Implementation Guide

This document outlines the phased implementation plan for the advanced ForgeAssist feature set within SetForge's BlockBuilder.

---

## Phase 1: Foundation & Basic Reactivity

**Goal:** Establish the core ForgeAssist module, basic command parsing, context awareness, and simple reactive commands operating directly on the block state. Integrate the chat interface.

**Key Features:**
*   Chat input accepts commands.
*   Basic keyword/regex-based command parsing.
*   Context awareness: Knows which element(s) are selected (`selectedElement`, `selectedElements`).
*   Simple commands:
    *   `clear week [N]`
    *   `clear day [Day] Wk [N]`
    *   `shift week [N] (forward|back) [M] days` (Basic version, potential edge case issues acceptable).
    *   `shift day [Day] Wk [N] (forward|back) [M] days`
*   Basic feedback via `showToast`.

**Technical Tasks:**
1.  Create `js/forgeassist.js` module.
2.  Implement `ForgeAssist.parseCommand(text)` using initial regex patterns.
3.  Implement `ForgeAssist.executeAction(action, params)` for the basic commands listed above.
    *   Needs functions to reliably find target day cells/weeks.
    *   Needs functions to directly manipulate the DOM (move/remove cards).
4.  Implement `ForgeAssist.updateContext(selectedElement, selectedElements)` called by `handleSelection`.
5.  Integrate `forgeassist.js` into `blockbuilder.js`:
    *   Call `parseCommand` and `executeAction` from chat input listener (`forgeAssistSend`).
    *   Call `updateContext` from `handleSelection`.
    *   Ensure `showToast` is accessible/callable.
6.  Ensure basic DOM manipulation updates analytics via `triggerAnalyticsUpdate()`.

**Module Focus:**
*   `js/forgeassist.js` (New)
*   `js/blockbuilder.js` (Integration)

**Scratch Pad - Phase 1:**
*   *Initial Parser:* How robust should the initial regex be? Focus on clear, unambiguous commands first. Avoid complex grammar.
*   *DOM Manipulation:* Directly manipulating the DOM for shifts is prone to errors (e.g., if target slot doesn't exist). Need robust error handling or accept limitations for MVP. Should we manipulate an intermediate state object instead? (Maybe too complex for P1).
*   *Context:* Simple selection context is sufficient for now.
*   *Feedback:* Toast messages are okay for P1. Previews are out of scope.
*   *Shift Logic:* Initial shift can ignore complex density/collision logic. Simple append to target day. Need to handle week boundaries (e.g., shifting Mon Wk2 back 1 day -> Sun Wk1).

---

## Phase 2: Contextual Actions & Simple Suggestions

**Goal:** Introduce the Inspector 'Assist' tab with contextual actions, implement basic exercise swapping and missed session handling logic. Introduce the `adaptiveScheduler.js` module for simulation.

**Key Features:**
*   Inspector 'Assist' tab populates with relevant actions based on selection:
    *   Workout Card: "Suggest Swap", "Decrease Intensity", "Increase Intensity", "Set VBT Target".
    *   Day Cell: "Handle Missed Session", "Clear Day", "Suggest Focus" (Placeholder).
*   `suggest alternative for [Exercise Name]` chat command.
*   `[Athlete Name] missed [Day] Wk [N]` chat command or "Handle Missed Session" button.
*   Basic exercise swap logic (based on muscle group/category).
*   Simple "Missed Session" workflows (Skip, Shift basic).
*   Introduction of `adaptiveScheduler.js` for *simulating* changes (not applying complex logic yet).
*   Visual preview (simple highlighting) of affected elements for shift/clear actions.

**Technical Tasks:**
1.  Implement `ForgeAssist.getContextualActions(element)`: Returns a list of actions based on element type/data.
2.  Update `blockbuilder.js` to call `getContextualActions` when the inspector opens and populate the 'Assist' tab dynamically.
3.  Create `js/adaptiveScheduler.js` module.
4.  Implement `AdaptiveScheduler.calculateImpact(changes)`: Takes a description of changes (e.g., `{ type: 'move', cardId: '...', targetSlot: '...' }`) and *simulates* the result on a copy of the block state. Returns *predicted* analytics (can be basic estimates initially).
5.  Implement `AdaptiveScheduler.suggestSwap(exerciseId, reason)`: Uses `exerciseLibraryData` metadata.
6.  Implement `ForgeAssist.handleMissedSession(context)`: Presents options (Skip, Shift).
7.  Modify basic actions (shift, clear) in `forgeassist.js` to:
    *   Generate a change description.
    *   Call `AdaptiveScheduler.calculateImpact`.
    *   Show impact preview (e.g., toast with predicted ACWR, simple yellow border on affected elements).
    *   Require confirmation before applying the DOM changes.
8.  Implement basic "Suggest Swap" logic in `forgeassist.js` using `AdaptiveScheduler.suggestSwap`.

**Module Focus:**
*   `js/forgeassist.js` (Contextual actions, integration)
*   `js/adaptiveScheduler.js` (New - Simulation, basic suggestions)
*   `js/blockbuilder.js` (UI Integration - Assist Tab, Previews)
*   `js/periodizationEngine.js` (Potential use for metadata)

**Scratch Pad - Phase 2:**
*   *Assist Tab UI:* How to best display actions? Buttons? Links? Needs design input.
*   *Simulation:* `calculateImpact` can be very basic initially (e.g., just recalculating load totals for affected days/weeks). Accurate ACWR/Monotony requires full recalculation.
*   *Swap Logic:* Initial swap can be very simple (e.g., find exercises with the same primary muscle group). Doesn't need complex equipment matching yet.
*   *Missed Session:* "Merge key lifts" is complex, defer to later phase. Focus on Skip/Shift.
*   *Preview Mechanism:* Simple CSS class for highlighting (`.forge-assist-preview`) is feasible. Needs clearing logic.

---

## Phase 3: Analytics Integration & Proactive Guardrails

**Goal:** Integrate ForgeAssist with real-time analytics (ACWR, Monotony) to provide proactive warnings and suggestions. Refine `adaptiveScheduler.js` to propose smarter adjustments.

**Key Features:**
*   Proactive toasts triggered by analytics thresholds (e.g., ACWR > 1.5 for 2 weeks).
*   Toast includes suggested actions (e.g., "Simulate Load Reduction").
*   `adaptiveScheduler.js` can now propose specific adjustments:
    *   `proposeLoadReduction(targetPercent, scope)`
    *   `proposeRestDayInsertion(week)`
*   ForgeAssist commands for load modification (`decrease intensity...`, `increase RPE...`) use `adaptiveScheduler` for simulation and smarter application (if possible).
*   Refined impact preview showing analytics changes more accurately.

**Technical Tasks:**
1.  Modify `triggerAnalyticsUpdate` in `blockbuilder.js` to also call a new function `ForgeAssist.checkAnalyticsThresholds(analyticsData)`.
2.  Implement `ForgeAssist.checkAnalyticsThresholds`: Checks ACWR, Monotony against defined rules; shows proactive toasts if thresholds are breached.
3.  Enhance `adaptiveScheduler.js`:
    *   Implement `proposeAdjustments(triggerEvent, context)` (e.g., `triggerEvent='highACWR'`).
    *   Improve `calculateImpact` to provide more accurate ACWR/Monotony predictions.
    *   Implement logic for load reduction/rest day insertion proposals.
4.  Refactor ForgeAssist load modification commands to use `adaptiveScheduler.proposeAdjustments` and `calculateImpact`.
5.  Improve the preview mechanism to show predicted analytics changes in the Inspector or toast.
6.  Add user settings for analytics thresholds (optional, can use defaults initially).

**Module Focus:**
*   `js/forgeassist.js` (Analytics checking, proactive triggers)
*   `js/adaptiveScheduler.js` (Adjustment proposals, improved simulation)
*   `js/blockbuilder.js` (Triggering checks, displaying richer previews)
*   `js/acwr.js`, `js/monotony.js` (Used by simulation/checks)

**Scratch Pad - Phase 3:**
*   *Threshold Logic:* Define clear rules (e.g., ACWR > 1.5 for 2 consecutive weeks? Monotony > 2.5?). Make configurable later.
*   *Proactive Suggestions:* How specific should they be? "Reduce load" vs "Reduce load on squats by 10%"? Start general.
*   *Simulation Accuracy:* Getting accurate ACWR prediction requires simulating the entire 28-day window shift. This could be slow. Optimize or accept slight inaccuracy.
*   *User Control:* Ensure users must confirm proactive suggestions; ForgeAssist shouldn't change things automatically.

---

## Phase 4: Generative Capabilities & Optimization

**Goal:** Enable ForgeAssist to generate parts of the training block and perform basic optimization based on goals. Requires significant enhancement of `adaptiveScheduler.js`.

**Key Features:**
*   `fill week [N] using [Model] principles` command (e.g., Linear, Wave).
*   `generate [Phase Name] phase ([N] weeks)` command.
*   `optimize block for [Goal]` command (e.g., Hypertrophy, Strength). Basic implementation.
*   `suggest progression for [Exercise]` command (rudimentary version based on density/frequency).
*   More sophisticated exercise swapping considering equipment, fatigue, and goals.

**Technical Tasks:**
1.  Significantly enhance `adaptiveScheduler.js`:
    *   Implement `generateWeek(config)` and `generatePhase(config)` using `periodizationEngine` principles and exercise data.
    *   Implement basic `optimizeForGoal(goal, blockData)` logic (e.g., adjust volume/intensity parameters).
    *   Implement `suggestProgression(exerciseId, history)` (requires access to past performance data - mock or simplified for now).
    *   Improve `suggestSwap` logic with more constraints (equipment, etc.).
2.  Add new command parsing and execution logic in `forgeassist.js` for generative/optimization commands.
3.  Integrate generation/optimization results with the preview engine.
4.  Refine context awareness – commands might need to understand phase context.

**Module Focus:**
*   `js/adaptiveScheduler.js` (Major focus - Generation, Optimization, Advanced Suggestions)
*   `js/forgeassist.js` (New commands, context)
*   `js/periodizationEngine.js` (Heavily used by generation logic)

**Scratch Pad - Phase 4:**
*   *Generation Complexity:* Generating sensible weeks/phases is hard. Start with simple templates and patterns from `periodizationEngine`.
*   *Optimization Scope:* Keep "optimization" very basic initially. Maybe just adjust global volume/intensity dials based on the goal. True optimization is AI-complete.
*   *Progression Data:* `suggestProgression` is highly dependent on having performance data. Without it, suggestions will be generic (e.g., "Increase sets/reps").
*   *User Expectations:* Manage expectations for generative features. They provide starting points, not perfect plans.

---

## Phase 5: Advanced NLP & Refinement (Future)

**Goal:** Move beyond basic regex parsing towards more flexible natural language understanding. Refine explanations, previews, and error handling. Handle more complex queries.

**Key Features:**
*   More flexible command parsing (understanding synonyms, varied sentence structures).
*   Handling compound commands (e.g., "Swap squats for leg press in week 5 and decrease intensity by 10%").
*   Information retrieval commands (`show me all deadlift sessions`, `compare tonnage week 3 vs week 7`).
*   More nuanced explanations for suggestions.
*   Improved visual diffing/preview mechanism.
*   Robust error handling and feedback for misunderstood commands.

**Technical Tasks:**
1.  **Explore/Integrate NLP:**
    *   Option A: Advanced client-side library (e.g., `compromise.js`, lightweight `transformers.js` model if feasible).
    *   Option B: Server-side NLP API (consider cost, privacy, latency).
2.  Refactor `ForgeAssist.parseCommand` to use the chosen NLP approach for intent classification and entity extraction.
3.  Implement information retrieval logic, querying the block data structure.
4.  Enhance the explanation generator (`getExplanation`) with more detail.
5.  Improve the preview engine for clarity (potentially side-by-side view or clearer diff markers).
6.  Add comprehensive error handling and user feedback loops ("Did you mean...?").

**Module Focus:**
*   `js/forgeassist.js` (Major refactor for NLP integration, query handling)
*   `js/adaptiveScheduler.js` (May need adjustments based on richer command parameters)
*   Potentially new modules for NLP processing or API interaction.

**Scratch Pad - Phase 5:**
*   *NLP Choice:* Client-side keeps data local but may be less powerful/larger bundle size. Server-side is powerful but adds complexity/cost. Needs careful evaluation.
*   *Compound Commands:* Handling multiple intents in one command significantly increases parsing complexity.
*   *Query Language:* Define the scope of supported queries. Full natural language database queries are very complex.
*   *Explainability:* As logic gets more complex, explaining *why* a suggestion was made becomes crucial but harder.

---

This phased approach allows for incremental delivery of value, starting with basic utility and progressively adding intelligence and sophistication to ForgeAssist. Each phase builds upon the previous one, managing complexity and risk. 