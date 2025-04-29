# Detailed Implementation Plan: Integrated Periodization Model Management

This document outlines the detailed steps required to implement the integrated periodization model management system within SetForge\'s BlockBuilder.

---

## Phase 1: Data Structure & Attributes

**Goal:** Define and integrate the necessary data attributes and storage mechanisms for tracking periodization models and their relationship with day cells and workout cards.

**Tasks:**

1.  **Define Data Attributes:**
    *   **Day Cell (`.day-cell`):**
        *   `data-day-id`: (Verify/Add) Add a unique, persistent identifier for each day cell, independent of DOM order. Format: `"wk<N>-<day>"` (e.g., `"wk1-mon"`).
            *   *Implementation:* Modify `generateCalendarGrid` in `blockbuilder.js` to consistently add this attribute.
        *   `data-periodization-model-id`: Stores the unique ID of the `PeriodizationModelManager` instance governing this day (e.g., `"linear_1678886400000_abc12"`).
        *   `data-periodization-model-type`: Stores the type identifier (e.g., `"linear"`, `"wave"`, `"triphasic"`).
        *   `data-periodization-params`: Stores a JSON string representing the *specific* parameters applicable to this day/week, potentially a subset or derived value from the main model instance parameters (e.g., `'{"targetLoad": 105.0, "targetRPE": 8}'`).
            *   *Consideration:* How are day-specific parameters derived? This likely needs logic within `PeriodizationModelManager` or the `periodizationEngine`. Initial implementation might store *all* instance params here.
    *   **Workout Card (`.workout-card`):**
        *   `data-model-driven`: Boolean string (`"true"` or `"false"`). Indicates if the card reflects the model\'s calculated state.
        *   `data-source-model-id`: Stores the `instanceId` of the model that *originally* created this card. Remains even if `data-model-driven` becomes `"false"`.

2.  **Update `PeriodizationModelManager.js` State:**
    *   Confirm `modelInstances` structure: `{ [instanceId]: { type: string, params: object, scope: object? }, ... }`. Define the `scope` object structure (e.g., `{ targetWeeks: [1, 2, 3], targetDaysOfWeek: ["mon", "wed", "fri"] }`).
    *   Confirm `dayModelMapping` structure: `{ [dayId]: instanceId, ... }`.

3.  **Integrate `PeriodizationModelManager` into `blockbuilder.js`:**
    *   **Import:** Add `import PeriodizationModelManager from './periodizationModelManager.js';`.
    *   **Initialization:**
        *   Create `getPeriodizationEngine` helper function within `blockbuilder.js` `DOMContentLoaded` scope to provide access to the engine module/object.
        *   Call `PeriodizationModelManager.init({...})` after DOMContentLoaded, passing necessary dependencies (`workCanvas`, `showToast`, `triggerAnalyticsUpdate`, `getPeriodizationEngine`).

4.  **Update Block State Save/Load (`blockbuilder.js`):**
    *   **`getBlockState()`:**
        *   Add a new top-level key `periodizationModels`.
        *   Call `PeriodizationModelManager.getState()` and assign its return value to `state.periodizationModels`.
        *   Inside the loop iterating through workout cards:
            *   Read `card.dataset.modelDriven` and save as a boolean.
            *   Read `card.dataset.sourceModelId` and save.
    *   **`loadStateFromLocalStorage()`:**
        *   After loading phases and slots, check if `state.periodizationModels` exists.
        *   If yes, call `PeriodizationModelManager.loadState(state.periodizationModels)`.
        *   If no, call `PeriodizationModelManager.loadState({})` to clear any lingering manager state.
        *   Inside the loop creating workout cards (`newCard`):
            *   Set `newCard.dataset.modelDriven = cardData.modelDriven ? 'true' : 'false';`.
            *   If `cardData.sourceModelId` exists, set `newCard.dataset.sourceModelId = cardData.sourceModelId;`.
        *   **Crucial:** After loading all cards *and* loading the manager state, iterate through the `dayModelMapping` from the loaded manager state and explicitly call `PeriodizationModelManager.updateDayCellDOMAttributes(cellElement, instanceId)` for each mapped day cell to ensure DOM attributes are correctly set *after* the grid is rebuilt.

5.  **Refine `createWorkoutCard` (`blockbuilder.js`):**
    *   Modify the function signature or add logic to accept optional `modelDriven` and `sourceModelId` parameters, setting the corresponding `data-*` attributes during card creation.

**Potential Challenges:**
*   Ensuring the `periodizationEngine` dependency is correctly passed and its API is stable.
*   Handling potential errors during JSON stringification/parsing of `data-periodization-params`.
*   Ensuring DOM updates for day cell attributes happen reliably after state loading.

---

## Phase 2: Basic Model Generation

**Goal:** Modify the block creation and placeholder population process to utilize the `PeriodizationModelManager` and generate model-driven workout cards.

**Tasks:**

1.  **Update "New Block Options" Modal (`blockbuilder.html`, `blockbuilder.js`):**
    *   Ensure the Periodization Model dropdown (`#new-block-model`) correctly lists available model types (potentially fetched from `periodizationEngine`).
    *   Retrieve the selected model `type` within `handleCreateBlockFromOptions`.

2.  **Refactor `handleCreateBlockFromOptions` (`blockbuilder.js`):**
    *   **After `generateCalendarGrid`:**
    *   Instead of directly calling `populatePlaceholders` with the model *type*, first create a model *instance* using `PeriodizationModelManager.createAndApplyModel`.
    *   Determine the `targetDays` array (e.g., all Mondays, Wednesdays, Fridays for the specified number of weeks) based on the `sessionsPerWeek` input. Generate day IDs using `PeriodizationModelManager.generateDayId`.
    *   Gather any `baseParams` needed for the chosen model type (potentially from other modal inputs, or use defaults).
    *   Call `const instanceId = PeriodizationModelManager.createAndApplyModel(modelType, baseParams, targetDays);`.
    *   Check if `instanceId` is valid.
    *   Pass the `instanceId` and the `targetDays` mapping to `populatePlaceholders`.

3.  **Refactor `populatePlaceholders` (`blockbuilder.js`):**
    *   Change function signature to accept `instanceId` and `targetDays` mapping (or fetch it from the manager using day IDs).
    *   **Remove logic that creates placeholder cards directly.**
    *   Instead, interface with `periodizationEngine` (via `PeriodizationModelManager` or directly):
        *   For each target day cell (identified by `data-day-id`):
            *   Get the model `instanceId` for this day from the manager.
            *   Get the model `instance` details using `PeriodizationModelManager.getModelInstance(instanceId)`.
            *   Call a new function in the `periodizationEngine` (e.g., `calculateExercisesForDay(modelInstance, week, day)`) to get the *specific* exercises, sets, reps, load details etc., calculated for *that specific day* based on the model rules.
            *   For each calculated exercise:
                *   Call `createWorkoutCard` passing the exercise name and calculated details string.
                *   **Crucially:** Set `data-model-driven="true"` and `data-source-model-id="<instanceId>"` on the newly created card element.
                *   Append the card to the correct day cell.
    *   **Update Day Cell DOM:** Ensure `PeriodizationModelManager.updateDayCellDOMAttributes` is called for each affected day cell *after* the model is applied (this might already be handled by `createAndApplyModel`).

**Potential Challenges:**
*   Defining a clear API for `periodizationEngine.calculateExercisesForDay`.
*   Efficiently calculating details for all target days.
*   Handling different model types requiring different parameters.

---

## Phase 3: Visual Badge Component

**Goal:** Create and manage the visual "Model Badge" element on day cells containing model-driven cards.

**Tasks:**

1.  **Create `modelVisuals.js` Module (Optional but Recommended):**
    *   Create a new file `js/modelVisuals.js` to encapsulate DOM manipulation logic for model badges and icons.
    *   It would depend on `PeriodizationModelManager` to get data.
    *   Define functions like `updateDayBadge(dayCellElement)`, `removeDayBadge(dayCellElement)`.

2.  **HTML Structure (within `modelVisuals.js` or `blockbuilder.js`):**
    *   Define the HTML structure for the badge element (e.g., `<div class="model-badge model-type-<type>" data-model-id="<instanceId>"><span class="badge-icon">📈</span><span class="badge-text">LIN</span></div>`).

3.  **CSS Styling (`blockbuilder.css` or a dedicated `modelVisuals.css`):**
    *   Style the `.model-badge` base class (positioning, size, border, font).
    *   Create specific styles for different model types (`.model-type-linear`, `.model-type-wave`, etc.) affecting background color, icon, potentially text.
    *   Style the tooltip on hover (`.model-badge:hover::after` or using a JS library).

4.  **Badge Update Logic (`modelVisuals.js` or `blockbuilder.js`):**
    *   **`updateDayBadge(dayCellElement)` function:**
        *   Takes a day cell DOM element as input.
        *   Gets the `dayId` from `dayCellElement.dataset.dayId`.
        *   Calls `PeriodizationModelManager.getModelForDay(dayId)` to get the `instanceId`.
        *   If no `instanceId`, calls `removeDayBadge(dayCellElement)`.
        *   If `instanceId`:
            *   Check if *any* card within `dayCellElement` has `data-model-driven="true"`.
            *   If yes:
                *   Get model details using `PeriodizationModelManager.getModelInstance(instanceId)`.
                *   Find or create the badge element within the day cell.
                *   Update its content (icon, text), class (`model-type-<type>`), and `data-model-id` attribute.
                *   Set tooltip content based on model params.
                *   Ensure badge is visible.
            *   If no model-driven cards remain, call `removeDayBadge(dayCellElement)`.
    *   **`removeDayBadge(dayCellElement)` function:**
        *   Finds and removes the badge element from the day cell.

5.  **Integration with `blockbuilder.js`:**
    *   Call `updateDayBadge` whenever a change might affect badge visibility:
        *   After loading state (`loadStateFromLocalStorage`).
        *   When a model is applied to a day (`PeriodizationModelManager.applyModelToDay` could potentially dispatch an event, or the caller updates).
        *   When a model is detached (`PeriodizationModelManager.detachModelFromDay` could dispatch an event, or the caller updates).
        *   When a card's `data-model-driven` status changes (Phase 12).

6.  **Badge Click Listener (`blockbuilder.js` or `modelVisuals.js`):**
    *   Add an event listener (potentially delegated from `workCanvas`) for clicks on `.model-badge`.
    *   On click:
        *   Prevent event propagation.
        *   Get the `instanceId` from `event.target.closest('.model-badge').dataset.modelId`.
        *   Get the `dayId` from `event.target.closest('.day-cell').dataset.dayId`.
        *   Call a new function `handleModelContextSelection(instanceId, dayId)` (to be detailed in Phase 5).

**Potential Challenges:**
*   Efficiently updating badges without performance issues, especially during initial load.
*   Managing dependencies between `blockbuilder`, `PeriodizationModelManager`, and `modelVisuals`. Event-driven architecture might be beneficial.

---

## Phase 4: Card Icon System

**Goal:** Implement the small icon on individual workout cards indicating they are model-driven.

**Tasks:**

1.  **Icon Definition:** Choose icons (SVG, font icons) corresponding to model types, matching the badges.
2.  **HTML Structure (within `createWorkoutCard` in `blockbuilder.js`):**
    *   Add a container element for the icon within the `.workout-card` structure (e.g., `<div class="card-model-icon model-type-<type>" style="display: none;">📈</div>`). Position it appropriately (e.g., bottom-left).
3.  **CSS Styling (`blockbuilder.css`):**
    *   Style `.card-model-icon` (size, position, opacity).
    *   Add styles for different types (`.model-type-linear`, etc.) if needed.
    *   Ensure it doesn\'t interfere with card dragging or other actions.
4.  **Icon Update Logic (`modelVisuals.js` or `blockbuilder.js`):**
    *   **Modify `createWorkoutCard`:**
        *   When creating a card with `modelDriven=true`, set the icon\'s content and `model-type-*` class. Make the icon element visible (`style.display = ''`).
    *   **Create `updateCardIcon(cardElement)` function:**
        *   Takes a workout card DOM element.
        *   Checks `cardElement.dataset.modelDriven`.
        *   If `"true"`:
            *   Gets the `sourceModelId` from the card.
            *   Gets the model type using `PeriodizationModelManager.getModelInstance(sourceModelId)`.
            *   Finds the icon element.
            *   Sets the correct icon content and class.
            *   Ensures the icon is visible.
        *   If `"false"`:
            *   Finds the icon element and hides it (`style.display = 'none'`).
    *   **Integration:** Call `updateCardIcon`:
        *   After creating a card (`createWorkoutCard`).
        *   When loading cards (`loadStateFromLocalStorage`).
        *   When a card's `data-model-driven` status changes (Phase 12).

5.  **Icon Click Listener (`blockbuilder.js`):**
    *   Add an event listener (delegated from `workCanvas`) for clicks specifically on `.card-model-icon`.
    *   On click:
        *   Prevent event propagation.
        *   Get the `instanceId` from the parent card's `dataset.sourceModelId`.
        *   Get the `dayId` from the parent day cell's `dataset.dayId`.
        *   Call `handleModelContextSelection(instanceId, dayId)`.

**Potential Challenges:**
*   Ensuring icon clicks are reliably detected without interfering with card clicks/drags.
*   Performance impact of updating icons on many cards.

---

## Phase 5: Selection Logic

**Goal:** Implement the logic to handle selection of exercises vs. the "Model Context" and update the Inspector accordingly.

**Tasks:**

1.  **State Management (`blockbuilder.js`):**
    *   Introduce a new state variable, e.g., `selectedContext = { type: 'none', element: null, modelId: null, dayId: null }`.
    *   `type` can be `'exercise'`, `'day'`, `'phase'`, `'model'`, `'multi'`, `'none'`.
    *   Refactor existing `selectedElement` and `selectedElements` to potentially use or coexist with `selectedContext`.

2.  **Create `handleModelContextSelection` (`blockbuilder.js`):**
    *   `handleModelContextSelection(instanceId, dayId)`:
        *   Deselect any previously selected elements (clear visual styles, update old context).
        *   Set `selectedContext = { type: 'model', element: /* dayCellElement */, modelId: instanceId, dayId: dayId }`.
        *   Find the `dayCellElement` using `dayId`.
        *   Apply a specific visual selection style to the `dayCellElement` (distinct from exercise selection).
        *   Call `updateInspectorForSelection()` or a new `updateInspectorForModelContext()`.

3.  **Refactor `handleSelection` (`blockbuilder.js`):**
    *   Modify the main click handler (`handleSelection` or the delegated listener on `workCanvas`).
    *   **Priority:** Check event target:
        *   If `.card-model-icon` -> Call `handleModelContextSelection` (via listener from Phase 4). (Handled by separate listener).
        *   If `.model-badge` -> Call `handleModelContextSelection` (via listener from Phase 3). (Handled by separate listener).
        *   If `.workout-card` (but not the icon) -> Handle as **exercise selection**.
            *   Update `selectedContext = { type: 'exercise', element: cardElement, ... }`.
            *   Handle multi-select with Shift key.
            *   Apply exercise selection style.
            *   Call `updateInspectorForSelection()`.
        *   If `.day-cell` (but not the badge) -> Handle as **day selection**.
            *   Update `selectedContext = { type: 'day', element: dayCellElement, dayId: ..., ... }`.
            *   Apply day selection style.
            *   Call `updateInspectorForSelection()`.
        *   If `.phase-bar` -> Handle as **phase selection**.
            *   Update `selectedContext = { type: 'phase', element: phaseElement, ... }`.
            *   Apply phase selection style.
            *   Call `updateInspectorForSelection()`.
        *   If background click -> Deselect all.
            *   Update `selectedContext = { type: 'none', ... }`.
            *   Remove selection styles.
            *   Call `updateInspectorForSelection()` (to show default view).

4.  **Refactor Inspector Update Logic (`blockbuilder.js`):**
    *   **`updateInspectorForSelection()`:**
        *   Read the `selectedContext.type`.
        *   Based on the type, call different helper functions to populate the inspector:
            *   `'exercise'`: Populate standard exercise details.
            *   `'day'`: Populate day details view.
            *   `'phase'`: Populate phase details view.
            *   `'model'`: Call `populateInspectorModelView(selectedContext.modelId, selectedContext.dayId)`.
            *   `'multi'`: Populate multi-select view.
            *   `'none'`: Populate default/block settings view.

5.  **Visual Selection Styles (`blockbuilder.css`):**
    *   Define distinct CSS classes/styles for selected exercises (`.workout-card.selected`), selected day cells (`.day-cell.selected`), selected phases (`.phase-bar.selected`), and model context selected (`.day-cell.model-context-selected`).

**Potential Challenges:**
*   Managing complex event propagation and ensuring the correct element/context is selected.
*   Refactoring the existing selection state (`selectedElement`, `selectedElements`) smoothly.
*   Ensuring the Inspector updates correctly for all context types.

---

## Phase 6: Inspector Status Tab UI

**Goal:** Build the UI and functionality for the "Status & Exercises" tab within the Model Inspector view.

**Tasks:**

1.  **Create `populateInspectorModelView` (`blockbuilder.js`):**
    *   Function `populateInspectorModelView(instanceId, dayId)`:
        *   Sets the Inspector title (e.g., "Model: Linear (Mon, Wk 2)").
        *   Hides standard Inspector tabs, shows Model View tabs.
        *   Calls helper functions to populate each Model View tab, starting with Status/Exercises.

2.  **Populate Status & Exercises Tab:**
    *   Get model instance details: `PeriodizationModelManager.getModelInstance(instanceId)`.
    *   Get day cell element: `workCanvas.querySelector(\`[data-day-id="${dayId}"]\`)`.
    *   Get all cards within the day cell.
    *   **HTML Structure:**
        *   Display Model Name/Type.
        *   Display key parameters active for *this day* (requires calculation logic from engine, e.g., `engine.getDayParameters(instanceId, week, day)`).
        *   Create two lists: "Model-Driven Exercises" and "Independently Edited Exercises".
        *   Iterate through cards in the cell:
            *   If `card.dataset.modelDriven === 'true'`, add to the first list (display name, key metric). Add `data-card-id` to list item.
            *   If `card.dataset.modelDriven === 'false'`, add to the second list (display name). Add `data-card-id` to list item.
        *   Add buttons: "Revert Edited to Model", "Make All Independent", "Detach Day from Model". Give buttons `data-instance-id` and `data-day-id`.

3.  **Implement Button Actions:**
    *   Add event listeners for the three buttons.
    *   **"Revert Edited to Model":**
        *   Show confirmation prompt.
        *   If confirmed:
            *   Find cards in the cell with `data-model-driven="false"`.
            *   For each card:
                *   Call `engine.calculateExercisesForDay(...)` to get the *original* model-calculated details for that exercise on that day.
                *   Update the card's display and dataset attributes (name, sets, reps, load, etc.).
                *   Set `card.dataset.modelDriven = 'true'`.
                *   Call `updateCardIcon(card)`.
            *   Call `updateDayBadge(dayCellElement)`.
            *   Re-populate the Inspector's Status tab.
            *   `triggerAnalyticsUpdate()`, `triggerSaveState()`.
    *   **"Make All Independent":**
        *   Show confirmation prompt.
        *   If confirmed:
            *   Find cards in the cell with `data-model-driven="true"`.
            *   For each card:
                *   Set `card.dataset.modelDriven = 'false'`.
                *   Call `updateCardIcon(card)`.
            *   Call `updateDayBadge(dayCellElement)`. // Badge should disappear
            *   Re-populate the Inspector's Status tab.
            *   `triggerSaveState()`.
    *   **"Detach Day from Model":**
        *   Show confirmation prompt.
        *   If confirmed:
            *   Call `PeriodizationModelManager.detachModelFromDay(dayId)`.
            *   Find all cards in the cell:
                *   Set `card.dataset.modelDriven = 'false'`.
                *   Call `updateCardIcon(card)`.
            *   Call `updateDayBadge(dayCellElement)`. // Badge should disappear
            *   Close the Inspector or switch to the Day view? (TBD UX decision).
            *   `triggerAnalyticsUpdate()`, `triggerSaveState()`.

4.  **Card Highlighting:**
    *   Add event listeners to the items in the "Model-Driven Exercises" list.
    *   On click:
        *   Remove highlight from other cards.
        *   Get `cardId` from list item's `data-card-id`.
        *   Find card element on canvas using `cardId`.
        *   Apply a temporary highlight style (e.g., bright border).
        *   Scroll card into view if necessary.

**Potential Challenges:**
*   Getting accurate day-specific parameters from the engine.
*   Ensuring the "Revert" logic correctly recalculates and updates card details.
*   Smooth UI updates when lists change.

---

## Phase 7: Inspector Configuration Tab UI

**Goal:** Build the UI for configuring model parameters and swapping models within the Inspector Model View.

**Tasks:**

1.  **Populate Configuration & Scope Tab:**
    *   Called by `populateInspectorModelView`.
    *   Get model instance: `PeriodizationModelManager.getModelInstance(instanceId)`.
    *   **HTML Structure - Configure Section:**
        *   Dynamically generate form fields based on `model.type`. Fetch parameter definitions from `periodizationEngine.getModelParameterDefinitions(model.type)`.
        *   Populate fields with current values from `model.params`.
        *   Include scope selection (Radio/Dropdown: "This Day Only", "This Entire Week", "All Days/Weeks governed by [ID]"). Default appropriately.
        *   Add "Preview & Confirm Configuration Changes" button. Disable initially.
    *   **HTML Structure - Swap Section:**
        *   Dropdown with available model types (excluding the current type).
        *   Scope selection (Radio/Dropdown: "This Day Only", "This Entire Week").
        *   Add "Preview & Confirm Model Swap" button. Disable initially.

2.  **Parameter Editing & Validation:**
    *   Add `input` event listeners to form fields.
    *   Enable the "Preview & Confirm" button only when valid changes are made.
    *   Implement input validation based on parameter types (number ranges, etc.).

3.  **"Preview & Confirm Configuration Changes" Button Logic:**
    *   Add click listener.
    *   Gather updated parameters from the form.
    *   Gather selected scope.
    *   **TODO: Implement Simulation:** Call a *new* simulation function (e.g., `engine.simulateParameterChange(instanceId, dayId, newParams, scope)`) which calculates the *impact* (affected cards, load changes, potential conflicts).
    *   Display simulation results (e.g., in a toast or modal).
    *   If user confirms:
        *   Call `PeriodizationModelManager.updateModelParams(instanceId, newParams)`. **Note:** `updateModelParams` needs enhancement to handle `scope`. Alternatively, create a new manager function like `updateScopedModelParams`.
        *   Trigger recalculation and DOM updates for all affected cards/days based on scope.
        *   Re-populate the Inspector.
        *   `triggerAnalyticsUpdate()`, `triggerSaveState()`.

4.  **"Preview & Confirm Model Swap" Button Logic:**
    *   Add click listener.
    *   Get selected new model `type` and `scope`.
    *   **TODO: Implement Simulation:** Call `engine.simulateModelSwap(instanceId, dayId, newModelType, scope)` to calculate impact.
    *   Display simulation results.
    *   If user confirms:
        *   Detach the old model for the selected scope using `PeriodizationModelManager`.
        *   Create a *new* model instance of the chosen type using `PeriodizationModelManager.createAndApplyModel`.
        *   Recalculate exercises for the scope using the new model via `periodizationEngine`.
        *   Update DOM elements (cards, badges).
        *   Update Inspector view (potentially switch to the new model context).
        *   `triggerAnalyticsUpdate()`, `triggerSaveState()`.

**Potential Challenges:**
*   Dynamically generating forms for different models.
*   Implementing complex simulation logic for parameter changes and model swaps across different scopes.
*   Managing the state update flow correctly after confirmation.

---

## Phase 8: Inspector Simulation Tab UI

**Goal:** Implement the UI for visualizing the model's projected progression.

**Tasks:**

1.  **Populate Simulation & Projection Tab:**
    *   Called by `populateInspectorModelView`.
    *   Get `instanceId` and `dayId`.
    *   Get model details and parameters.
    *   **HTML Structure:**
        *   Placeholder for a chart (e.g., using Chart.js or a simple SVG).
        *   Placeholder for a data table.
        *   Optional: Input fields for "what-if" parameter adjustments within this tab.

2.  **Data Fetching:**
    *   Call a new function `engine.getProjectionData(instanceId, startWeek, numWeeksToProject)` to get calculated future values (e.g., [{ week: 3, day: 'mon', exercise: 'Squat', load: 110.0 }, ...]).
    *   Specify the number of weeks/sessions to project.

3.  **Chart Implementation:**
    *   Choose a charting library or implement basic SVG plotting.
    *   Process the projection data.
    *   Render a line chart showing projected load/RPE/volume over time for key exercises governed by the model starting from the selected day/week.
    *   Allow filtering by exercise?

4.  **Table Implementation:**
    *   Display the raw projection data in a table format (Week, Day, Exercise, Key Metric Value).

5.  **"What-If" Functionality (Optional):**
    *   If including "what-if" inputs:
        *   Add listeners to these inputs.
        *   On change, *temporarily* adjust parameters *locally* within this tab.
        *   Re-call `engine.getProjectionData` with the temporary parameters.
        *   Update the chart and table.
        *   Ensure these changes don't persist unless explicitly applied via the Configuration tab.

**Potential Challenges:**
*   Choosing and integrating a suitable charting library.
*   Designing an effective and performant projection calculation in the engine.
*   Making the "what-if" feature intuitive and ensuring it doesn\'t accidentally save changes.

---

## Phase 9: Model Management Logic (Core Functions)

**Goal:** Implement the core logic within `PeriodizationModelManager.js` for detaching models and managing card states.

**Tasks:**

1.  **Refine `detachModelFromDay` (`PeriodizationModelManager.js`):**
    *   Ensure it correctly deletes the mapping from `dayModelMapping`.
    *   Ensure it calls `removeDayCellDOMAttributes` for the target cell.
    *   **New:** Dispatch a custom event `forge-assist:model-detached` with `{ detail: { dayId } }` so `blockbuilder.js` can react.

2.  **Implement Event Listener in `blockbuilder.js`:**
    *   Listen for `forge-assist:model-detached`.
    *   In the handler:
        *   Get the `dayCellElement` using `event.detail.dayId`.
        *   Find all cards within the cell.
        *   For each card:
            *   Set `card.dataset.modelDriven = 'false'`.
            *   Call `updateCardIcon(card)`.
        *   Call `updateDayBadge(dayCellElement)`.
        *   Potentially update the Inspector if it was showing the model context for this day.
        *   `triggerSaveState()`.

3.  **Implement Revert/Make Independent Logic (Triggered from Inspector in Phase 6):**
    *   These actions are primarily handled in `blockbuilder.js` (as detailed in Phase 6 tasks) because they involve direct DOM manipulation and engine calls based on the *current* canvas state. The manager itself doesn't need new functions for these, but the Inspector logic relies on the manager's data (`getModelInstance`, etc.).

**Potential Challenges:**
*   Ensuring events are dispatched and caught reliably.
*   Coordinating state updates between the manager and the DOM in `blockbuilder.js`.

---

## Phase 10: Model Calculation Engine (`periodizationEngine.js`)

**Goal:** Enhance the periodization engine to support the new requirements.

**Tasks:**

1.  **Define Model Schemas:**
    *   Formalize the structure for different model types (`linear`, `wave`, etc.).
    *   Define required parameters for each (`baseLoad`, `increment`, `wavePattern`, etc.).
    *   Define parameter types and validation rules.

2.  **Implement `getModelDefaults(type)`:**
    *   Returns the default parameter set for a given model type. Used by `PeriodizationModelManager.createAndApplyModel`.

3.  **Implement `getModelParameterDefinitions(type)`:**
    *   Returns metadata about parameters for a type (label, type, validation rules, description). Used by Inspector Config Tab (Phase 7).

4.  **Implement `calculateExercisesForDay(modelInstance, week, day)`:**
    *   The core calculation logic.
    *   Takes the full model instance object (type, params) and the target week/day.
    *   Returns an array of objects, each representing a workout card to be created: `{ exerciseName: string, detailsString: string, load: number, sets: number|string, reps: number|string, ... }`.
    *   This needs to contain the specific progression logic for each model type.

5.  **Implement `getProjectionData(instanceId, startWeek, numWeeksToProject)`:**
    *   Takes a model instance ID and projection range.
    *   Retrieves the model instance using `PeriodizationModelManager.getModelInstance`.
    *   Iterates through the future weeks/days within the model's scope.
    *   For each relevant day, calls `calculateExercisesForDay`.
    *   Aggregates and formats the results for the Simulation Tab (Phase 8).

6.  **Implement Simulation Functions:**
    *   `simulateParameterChange(instanceId, dayId, newParams, scope)`: Calculates the *difference* in exercises/load if parameters were changed for the given scope. Returns a description of changes.
    *   `simulateModelSwap(instanceId, dayId, newModelType, scope)`: Calculates the *difference* if the model was swapped for the given scope. Returns a description of changes.

**Potential Challenges:**
*   Implementing complex periodization math correctly.
*   Designing the simulation functions to be accurate and efficient.
*   Handling dependencies if models affect each other (unlikely in this design but possible).

---

## Phase 11: Model Swapping System

**Goal:** Implement the UI flow and backend logic for swapping the periodization model applied to a day or week.

**Tasks:**

1.  **UI Implementation (Inspector Config Tab - Phase 7):**
    *   Ensure the "Swap Model" dropdown is populated correctly.
    *   Ensure scope selection works.
    *   Implement the "Preview & Confirm Model Swap" button logic.

2.  **Simulation Call:**
    *   The button click should trigger `engine.simulateModelSwap`.

3.  **Confirmation Flow:**
    *   Display simulation results clearly (e.g., "Will change Squat from 100kg to RPE 8, Bench from 70kg to RPE 7.5").
    *   Use a confirmation modal or toast.

4.  **Execution Logic (If Confirmed):**
    *   Identify all `dayId`s within the selected `scope`.
    *   **Detach Old Model:** For each affected `dayId`, call `PeriodizationModelManager.detachModelFromDay(dayId)`. This will trigger the event listener in `blockbuilder` to update card statuses and remove old badges/attributes.
    *   **Create New Model Instance:**
        *   Get parameters for the `newModelType` (potentially prompting the user if defaults aren't sufficient).
        *   Call `PeriodizationModelManager.createAndApplyModel(newModelType, newParams, affectedDayIds)`.
    *   **Generate New Cards:**
        *   Get the new `instanceId`.
        *   For each affected `dayId`:
            *   Clear existing cards from the day cell.
            *   Call `engine.calculateExercisesForDay` using the *new* model instance.
            *   Create and append the new workout cards (setting `data-model-driven="true"` and the new `sourceModelId`).
            *   Call `updateDayBadge` for the cell.
    *   **Update UI:**
        *   Refresh the Inspector view.
        *   `triggerAnalyticsUpdate()`, `triggerSaveState()`.

**Potential Challenges:**
*   Handling parameter input for the new model type smoothly.
*   Ensuring the detach/create/regenerate sequence works without race conditions or visual glitches.
*   Accurate simulation of the swap's impact.

---

## Phase 12: Edit Tracking

**Goal:** Automatically detect when a user manually edits a model-driven card and update its state accordingly.

**Tasks:**

1.  **Identify Edit Points:** Review all functions where workout card details can be changed:
    *   `saveWorkoutCardDetails` (Inspector Details Tab save button).
    *   Drag-and-drop (`handleDrop`) if it modifies anything other than position.
    *   Any inline editing features (if added later).
    *   ForgeAssist commands that directly modify card details.

2.  **Modify Edit Logic:**
    *   In each identified function, *before* saving the changes:
        *   Check if the target `cardElement.dataset.modelDriven === 'true'`.
        *   If yes:
            *   Set `cardElement.dataset.modelDriven = 'false'`.
            *   Call `updateCardIcon(cardElement)` to hide the icon.
            *   Find the parent `dayCellElement`.
            *   Call `updateDayBadge(dayCellElement)` to potentially hide the badge if this was the last model-driven card.
            *   Call `triggerSaveState()`.

3.  **Prevent Accidental Reversion:** Ensure that simply opening and closing the inspector or clicking "Save" without making changes doesn't incorrectly set `data-model-driven` to `false`. Add checks to see if values *actually* changed before updating the flag.

**Potential Challenges:**
*   Catching all possible edit pathways.
*   Efficiently checking if any tracked value has actually changed compared to the dataset.

---

## Phase 13: Simulation & Projection Features (Enhancements)

**Goal:** Enhance the Simulation tab in the Inspector with more advanced features.

**Tasks:**

1.  **Refine Projection Data (`periodizationEngine.js`):**
    *   Ensure `getProjectionData` provides sufficient detail (e.g., include calculated sets/reps/load type/value, not just load units).
2.  **Advanced Charting (`blockbuilder.js` / `modelVisuals.js`):**
    *   Allow multi-line charts to compare projections for different key exercises.
    *   Add options to switch the projected metric (Load, RPE, Volume).
    *   Visualize target ranges or thresholds on the chart.
3.  **Enhanced Table:**
    *   Make the projection table sortable and filterable.
    *   Highlight rows corresponding to the current day/week.
4.  **"What-If" Polish:**
    *   Make the temporary parameter adjustments more intuitive.
    *   Add a "Reset Simulation" button.
    *   Clearly indicate which parameters are being overridden for the simulation.

**Potential Challenges:**
*   Complexity of multi-metric projection calculations.
*   Keeping the simulation UI responsive and easy to understand.

---

## Phase 14: ForgeAssist Integration

**Goal:** Integrate the periodization model system with ForgeAssist commands and contextual actions.

**Tasks:**

1.  **New Contextual Actions (`forgeassist.js`):**
    *   Modify `getContextualActions`:
        *   When a `.day-cell` is selected: Check if it has a `data-periodization-model-id`.
        *   If yes, add actions like:
            *   "View/Edit Periodization Model" (Handler: calls `handleModelContextSelection` in `blockbuilder`).
            *   "Make Exercises Independent from Model" (Handler: calls the logic from Phase 6 button).
            *   "Detach Day from Model" (Handler: calls the logic from Phase 6 button).
        *   When a `.workout-card` with `data-model-driven="true"` is selected:
            *   Add action: "View Governing Periodization Model" (Handler: finds parent day, gets modelId/dayId, calls `handleModelContextSelection`).
            *   Add action: "Make Exercise Independent from Model" (Handler: sets `data-model-driven="false"`, updates icon/badge, saves state).

2.  **New Chat Commands (`forgeassist.js`):**
    *   Modify `parseCommand` to recognize new commands:
        *   `model apply <type> week <N> <days> [params...]` (e.g., `model apply linear week 1,2,3 mon,wed,fri increment=2.5`)
        *   `model params <instanceId> <param>=<value> [scope=week|all]`
        *   `model detach week <N> <day>`
        *   `model revert week <N> <day>`
        *   `model make_independent week <N> <day>`
    *   Implement corresponding actions in `routeExecution` or `executeActionInternal`, interfacing with `PeriodizationModelManager` and `periodizationEngine`. These will likely require simulation/confirmation.

3.  **New Suggestions (`adaptiveScheduler.js`):**
    *   Enhance `proposeAdjustments`:
        *   If high monotony/strain occurs on model-driven days, suggest adjusting model parameters (e.g., "Reduce intensity increment in Linear model [ID]").
        *   If ACWR is high, suggest detaching a day or reducing model intensity.
    *   Implement corresponding proposal handling in `ForgeAssist.handleProposalAction`.

**Potential Challenges:**
*   Parsing complex commands with parameters.
*   Integrating ForgeAssist actions with the simulation/confirmation flow.
*   Making model-related suggestions contextually relevant.

---

## Phase 15: Testing & Refinement

**Goal:** Ensure the system is robust, performant, and user-friendly through rigorous testing and iteration.

**Tasks:**

1.  **Unit Testing:**
    *   Write unit tests for `PeriodizationModelManager.js` functions (state management, ID generation, mapping).
    *   Write unit tests for `periodizationEngine.js` calculation logic for each model type.
2.  **Integration Testing:**
    *   Test the flow from modal selection -> model creation -> card generation -> attribute setting.
    *   Test selection logic (card vs. icon vs. badge vs. day).
    *   Test Inspector view switching and population.
    *   Test model parameter editing and swapping, including different scopes.
    *   Test edit tracking (manual edits correctly detach cards).
    *   Test detach/revert/make independent actions.
    *   Test ForgeAssist commands and contextual actions.
    *   Test save/load functionality thoroughly, ensuring model state persists correctly.
3.  **UI/UX Testing:**
    *   Evaluate clarity of badges and icons.
    *   Assess usability of the Inspector Model View tabs and controls.
    *   Test responsiveness and visual consistency across browsers/screen sizes.
    *   Gather user feedback on the workflow.
4.  **Performance Testing:**
    *   Measure performance impact on block loading, especially with many model instances.
    *   Optimize DOM manipulation (minimize direct updates, consider batching or virtual DOM if necessary, although likely overkill).
    *   Optimize engine calculations.
5.  **Bug Fixing & Refinement:** Iterate based on testing results and feedback.
6.  **Documentation:**
    *   Update user guides explaining how to use periodization models.
    *   Add developer documentation explaining the data structures, modules, and workflow.

**Potential Challenges:**
*   Setting up effective testing environments.
*   Addressing performance bottlenecks.
*   Refining the UX based on potentially conflicting feedback.

---

## Scratch Pad / Design Considerations

This section tracks open questions, decisions, and potential complexities identified during the implementation planning.

**Phase 1: Data Structure & Attributes**
*   *Day Cell `data-day-id`:* Is the `wk<N>-<day>` format sufficient? Does it handle potential future features like multi-week views or non-standard week lengths? (Stick with this format for now, seems robust enough for current scope).
*   *`data-periodization-params` on Day Cell:* Storing *all* model instance params initially is simple but potentially redundant. Should the engine provide a function `engine.getDaySpecificParams(instance, week, day)` to derive only what's needed for display/calculation on that day? (Decision: Store all initially for simplicity. Refactor later if needed for performance or clarity).
*   *`PeriodizationModelManager` Scope Definition:* How flexible does the `scope` object need to be? Just weeks/daysOfWeek? Or potentially specific date ranges? (Keep simple for now: `targetWeeks` array, `targetDaysOfWeek` array).
*   *Save/Load Robustness:* Need thorough testing (Phase 15) to ensure loading older block data (without model attributes) doesn't crash and handles defaults gracefully.
*   *`getPeriodizationEngine` Dependency:* How is the engine actually exposed? Is `buildBlockStructure` the correct object? Need to confirm the engine's export/API. (Action: Verify `periodizationEngine.js` exports and API).

**Phase 2: Basic Model Generation**
*   *`handleCreateBlockFromOptions` Complexity:* This function now has more responsibility (creating model instance before populating). Ensure it remains readable.
*   *Determining `targetDays`:* Logic for mapping `sessionsPerWeek` to specific `dayId`s needs to be robust. What if user wants specific days (e.g., Tue/Thu/Sat)? (Initial Simplification: Use a fixed mapping based on number, e.g., 3/wk = Mon/Wed/Fri. Add configuration later if needed).
*   *`periodizationEngine.calculateExercisesForDay` API:* What exactly should this return? Just exercise name/details string? Or a more structured object including calculated load, sets, reps? (Decision: Return structured object `{ exerciseName, detailsString, load, sets, reps, ... }` to simplify card creation and reduce parsing).
*   *Error Handling:* What happens if `calculateExercisesForDay` fails for one day? Skip the day? Show an error card? (Decision: Log error, skip creating cards for that day, maybe show toast. Add visual error state later).

**Phase 3: Visual Badge Component**
*   *`modelVisuals.js` Module:* Is a separate module overkill initially? Might be simpler to keep badge logic within `blockbuilder.js` until it becomes unwieldy. (Decision: Keep in `blockbuilder.js` for now. Refactor to `modelVisuals.js` if complexity warrants it later).
*   *Badge Creation/Update Performance:* Finding/creating/updating badges on potentially hundreds of cells during load or model changes needs to be efficient. Avoid querying the DOM excessively inside loops. (Consideration: Use event delegation for clicks. Batch DOM updates if necessary).
*   *Tooltip Library:* Use simple CSS tooltips (`::after` or `title` attribute) or a JS library for richer tooltips? (Start with CSS/title for simplicity).

**Phase 4: Card Icon System**
*   *Icon Placement & Styling:* Ensure icon placement is consistent and doesn't obscure critical card info, especially in compact view modes.
*   *Click Target Size:* Icon needs to be large enough to be clickable reliably, especially on touch devices, without being visually intrusive.
*   *Performance:* Same concern as badges - updating icons on many cards needs care.

**Phase 5: Selection Logic**
*   *`selectedContext` State Variable:* This is a significant refactor. Need to carefully replace/integrate `selectedElement` and `selectedElements`. Ensure multi-select logic (Shift key) still works correctly for exercises when the model context isn't involved.
*   *Visual Distinction:* Selection styles for model context (`.day-cell.model-context-selected`) need to be clearly different from standard day cell selection (`.day-cell.selected`).
*   *Inspector Update Trigger:* Ensure `updateInspectorForSelection` (or the relevant new function) is reliably called *after* the `selectedContext` is updated for all interaction types (badge click, icon click, card click, day click, etc.).

**Phase 6: Inspector Status Tab UI**
*   *`engine.getDayParameters` API:* Need to define what this returns. Is it just a subset of the main params, or derived values (like the target load *for that specific day*)?
*   *Revert Logic Robustness:* Reverting requires re-calculating *original* model details. This depends heavily on the `periodizationEngine` correctly interpreting the model params for that past state.
*   *UI Feedback:* Provide clear visual feedback during revert/detach actions (e.g., temporary disabling of buttons, progress indicators if slow).
*   *Highlighting Persistence:* How long should the card highlight from the list click last? (Decision: Remove highlight when user clicks elsewhere or selects a different item).

**Phase 7: Inspector Configuration Tab UI**
*   *Dynamic Form Generation:* How are parameter definitions (`getModelParameterDefinitions`) structured? Need a robust way to generate corresponding HTML form elements (text input, number input, select, etc.).
*   *Simulation API (`engine.simulateParameterChange`, `engine.simulateModelSwap`):* Define the return value. Should it be a list of affected cards with old/new values? A summary message? Both?
*   *Scoped Updates (`updateScopedModelParams`):* Updating parameters for `scope=all` needs careful implementation in the manager to find all relevant days and potentially trigger many recalculations via the engine. How to handle performance?
*   *Model Swap Parameter Input:* When swapping, how are parameters for the *new* model determined? Use defaults? Prompt user? (Simplification: Use defaults initially. Add parameter configuration step to swap process later).

**Phase 8: Inspector Simulation Tab UI**
*   *Charting Library:* Choose library (Chart.js, D3, simple SVG). Consider bundle size and ease of use. (Decision: Start with Chart.js unless specific needs arise).
*   *Projection Data Granularity:* Project daily, weekly average, or key lifts only? (Start with projecting key lifts/metrics calculated daily for model-driven exercises).
*   *"What-If" State Management:* Ensure temporary changes in this tab don't leak or get saved accidentally.

**Phase 9: Model Management Logic (Core Functions)**
*   *Event-Driven Updates:* Using custom events (`forge-assist:model-detached`) is good for decoupling. Ensure event naming is consistent and payload (`detail`) provides necessary info.
*   *Coordination:* Updates triggered by events (like detaching) need to correctly sequence DOM changes (remove badge/icon) and state saves.

**Phase 10: Model Calculation Engine (`periodizationEngine.js`)**
*   *Complexity:* This is the core intellectual property. Implementation needs deep domain knowledge of periodization methods.
*   *Extensibility:* Design engine API to easily add new model types in the future.
*   *Performance:* Calculations, especially projections and simulations, must be optimized.
*   *Parameter Definition:* `getModelParameterDefinitions` needs careful design to support UI generation and validation.

**Phase 11: Model Swapping System**
*   *User Experience:* The detach/create/regenerate process needs to feel smooth to the user, possibly with loading indicators.
*   *Error Handling:* What if the *new* model fails to generate cards for some days in the scope?

**Phase 12: Edit Tracking**
*   *Definition of "Edit":* What constitutes an edit that detaches a card? Changing name? Sets? Reps? Load? Notes? (Decision: Any change to name, sets, reps, load type, load value detaches. Notes/Rest likely do not, TBD).
*   *Value Change Check:* Implement a reliable helper function `didValuesChange(element, newData)` to compare form/new data against the element's current dataset before setting `modelDriven=false`.

**Phase 13: Simulation & Projection Features (Enhancements)**
*   *Prioritization:* Focus on core functionality first. These enhancements can be added iteratively.
*   *Data Volume:* Projecting too far ahead might become slow or visually cluttered.

**Phase 14: ForgeAssist Integration**
*   *Command Parsing:* Parsing commands with scopes and arbitrary key=value parameters needs a robust parser (consider a small library or careful regex).
*   *Action Flow:* How do commands trigger simulations/confirmations vs direct actions?
*   *Suggestion Clarity:* Model-related suggestions need to be understandable to the user (e.g., clearly state which model and parameter is being targeted).

**Phase 15: Testing & Refinement**
*   *Test Data:* Need diverse test cases: blocks with no models, multiple conflicting models, models applied partially, complex parameter edits, etc.
*   *Feedback Loop:* Establish a way to gather user feedback specifically on this feature during development/beta testing.

---

This detailed plan provides a comprehensive roadmap. Each phase involves multiple steps and considerations, and implementation will require careful coordination between the different modules. 