SetForge BlockBuilder 2.0 – concept brief

⸻

1. 30-sec elevator pitch

A fluid Gantt-meets-spreadsheet canvas where the coach can sketch an entire macrocycle in minutes, watch live workload gauges react in real time, and let AI nudge sets, weeks and phases back into the “green zone” whenever life blows up the plan.

Enterprise platforms already lean on calendars; indie tools rely on rigid spreadsheets. Drag-and-drop on a horizontally-scrolling timeline remains the highest-rated UX pattern among BridgeAthletic, CoachMePlus and TeamBuildr users, largely because it mirrors a coach’s mental model of blocks and microcycles  ￼ ￼. SetForge adopts that pattern—then layers the periodization science the others skip.

⸻

2. Screen layout

Zone	Purpose	Notes
A. Phase Ribbon (top 60 px)	Coloured bars for Accum ▸ Intens ▸ Peak; edge-drag to resize; double-tap to insert deload	Animates exactly like the SVG hero; keeps brand continuity.
B. Work Canvas (centre)	Horizontal weeks × vertical sessions; each tile is a Workout Card	Drag cards, pinch-zoom timeline (2–30 weeks).
C. Inspector Panel (right 300 px)	Context-aware tab set:• Exercise Library (search + filters)• Load & tonnage gauges (live)• AI “ForgeAssist” chat	Sliding sheet on iPad; collapsible on phone.
D. Timeline Footer (bottom 80 px)	ACWR, Monotony, Strain dials with traffic-light logic	Always visible for safety “radar”.



⸻

3. Core interactions & micro-features

Action	Delight factor	Rationale
Drag-edge phase stretch	Haptic bump when phase hits recommended 3 wk minimum	Mirrors BridgeAthletic “clone” speed but adds science guard-rails  ￼.
Workout Card drawer	Tap a session → card flips, revealing set & %1 RM table and Velocity-Loss slider (auto-fills from velocityAutoReg.js)	Gives VBT tweak without opening modal.
ForgeAssist	Natural-language prompt (“Shift everything two days later”) runs adaptiveScheduler.js in preview mode; yellow diff overlay shows changes before commit	Reddit coaches complain every tool is “OK until athlete misses a week”  ￼.
Scenario slider	Toggle “What if my star QB sprains an ankle in Wk 6?” → AI proposes swap to upper-body focus; risk gauges recalc live	Differentiates from static calendar builders.
Multi-athlete overlay	Holding ⌥ while dragging shows ghost cards for every athlete sharing the template	Saves time for 15-100 athlete range.
Undo-History bar	30-step vertical scrub (like Figma)	High-stakes programming demands non-linear undo.
Mobile preview	1-tap phone icon shows athlete view; scroll syncs to selected day	Ensures coach sees what athlete will.



⸻

4. Must-have analytics widgets
	1.	Load-Heatmap Mini-map – tiny row under Phase Ribbon; darker = higher tonnage.
	2.	Muscle-Group Volume pie – recalculates instantly via periodizationEngine.js.
	3.	Injury-risk Sniffer – if ACWR > 1.5 for two consecutive weeks, red toast top-right (why + one-tap fix)  ￼.
	4.	RPE Drift trend – pulls last block’s average actual vs planned RPE to inform initial targets, echoing TrainHeroic readiness polling  ￼.

⸻

5. Research-backed extras that wow coaches

Gap coaches mention	SetForge answer
“I still need spreadsheets for set/tonnage totals.”  ￼	Live totals row + CSV export under Footer.
“No tool links readiness & programming.”	HRV/Sleep import feeds readinessScore.js; cards auto-dim when readiness < 60.
“I can’t version blocks.”	Git-style Commit button stores JSON diff; Version drawer allows restore/compare.
“Not enough media.”	Inspector panel supports drag-in Loom/YouTube; thumbnail appears on card front.



⸻

6. Motion & theming guidelines
	•	Glass-morphism dark slate / molten-orange highlights (inherit root CSS variables).
	•	Micro-motion: Workout Cards rise 4 px with a soft spring on hover; Phase Ribbon edges pulse during edge-drag.
	•	Accessibility: All colour cues duplicated with shapes (e.g., danger stripes on blocks > ACWR 1.5).

⸻

7. Tech fit & MVP cut-list (6-week sprint)
	1.	Canvas grid (React + Framer Motion).
	2.	Drag-drop + edge-resize with live ACWR gauge.
	3.	Inspector Library (filter, search, add exercise).
	4.	ForgeAssist minimal: “shift week” + adaptiveScheduler.js integration.
	5.	Heatmap mini and ACWR/Monotony footer.

Remaining bells & whistles (scenario slider, version diff) land in Sprint 2.

⸻

Outcome: a BlockBuilder that feels as playful as Figma, as smart as Excel, and as coach-centric as a whiteboard—while solving the exact “I still export to sheets” and “what if sessions change?” pain points that plague every competing platform.