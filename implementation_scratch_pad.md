# Implementation Scratch Pad

This document tracks our progress implementing the Integrated Periodization Model Management System.

## Phase Tracking

- [ ] Phase 1: Data Structure & Attributes
- [ ] Phase 2: Basic Model Generation
- [ ] Phase 3: Visual Badge Component
- [ ] Phase 4: Card Icon System
- [ ] Phase 5: Selection Logic
- [ ] Phase 6: Inspector Status Tab UI
- [ ] Phase 7: Inspector Configuration Tab UI
- [ ] Phase 8: Inspector Simulation Tab UI
- [ ] Phase 9: Model Management Logic
- [ ] Phase 10: Model Calculation Engine
- [ ] Phase 11: Model Swapping System
- [ ] Phase 12: Edit Tracking
- [ ] Phase 13: Simulation & Projection Features
- [ ] Phase 14: ForgeAssist Integration
- [ ] Phase 15: Testing & Refinement

## Current Work

Working on Phase 1: Data Structure & Attributes.

## Analysis of Current Codebase

### PeriodizationModelManager.js
- Already has a structure similar to what we need
- Has functions to create, apply, detach models from days
- Has DOM helpers for updating day cell attributes
- Already integrated in blockbuilder.js
- Needs to be enhanced for saving/loading model state

### blockbuilder.js
- generateCalendarGrid() creates the day cells but doesn't add data-day-id attribute
- populatePlaceholders() populates days with placeholder workouts
- loadStateFromLocalStorage() / saveStateToLocalStorage() handle block state
- getBlockState() gathers block data but doesn't save periodization model info
- createWorkoutCard() needs to be enhanced to support model-driven cards

### periodizationEngine.js
- Currently just has a simple buildBlock function
- Will need significant expansion to support model calculation, simulation, etc.

## Phase 1 Implementation Plan
1. Modify generateCalendarGrid() to add data-day-id attribute
2. Update createWorkoutCard() to accept and save model-driven attributes
3. Update getBlockState() to include periodization models data
4. Update loadStateFromLocalStorage() to load periodization models and attributes

## Notes & Decisions

### Phase 1
- PeriodizationModelManager appears to already handle most of the functionality we need
- Will use the existing structure and enhance where needed
- Need to add the model-driven attributes to cards
- Need to ensure the day-id is consistent across the app

## Open Questions

- We need to enhance periodizationEngine.js significantly - should this be a separate phase?
- How should the model ID be generated/structured?
- How do we determine which day should be part of which model? 