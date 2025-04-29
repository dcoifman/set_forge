Below is a name-refresh, design blueprint, and step-by-step UX storyboard that a small team could hand straight to engineering and creative.

⸻

1 ️⃣  Name & brand hook

App name: SetForge
Forging training blocks as a blacksmith forges steel—precise heat, hammer, and cooling cycles.
Domains (all currently unregistered as of today): setforge.app | getsetforge.com

Palette seed ↗︎: deep slate (#1B1C22), molten orange accent (#FF703B), and cool steel (#CCD1D9). The contrast passes WCAG AA and aligns with dark-mode first design trends for 2025  ￼.

⸻

2 ️⃣  Information architecture & core modules

Root
│
├── Coach Dashboard
│   ├── Athlete Cards  ← quick status + ACWR gauge
│   ├── Today Queue   ← pending reviews & flagged loads
│   └── Analytics     ← period block heat-map
│
├── Block Builder
│   ├── Program Wizard (wizard flow)
│   ├── Template Library
│   └── “What-If” Simulator
│
├── Athlete Hub (mobile-first)
│   ├── Session View  ← stopwatch, velocity widgets
│   ├── Feedback      ← RPE, soreness quick sliders
│   └── Learn Cards   ← 30-sec explainers
│
└── Settings
    ├── Wearable Sync (HealthKit / Garmin)
    ├── CSV Import / Export
    └── Branding & Roles

Offline-first: local Realm DB w/ background sync when bandwidth returns—an explicit 2025 design trend for resilience  ￼.

⸻

3 ️⃣  Interaction design guidelines

Area	Key decisions	Rationale
Navigation	Tab bar (Coach app): Dashboard · Blocks · Analytics · Settings	Coaches juggle one-hand iPad use on a weight floor—thumb-reachable anchors.
Block Builder	4-screen wizard → inline visual periodization chart updates in real time	Immediate “aha” moment during onboarding cuts drop-off  ￼.
Data viz	ACWR & monotony ring uses minimalist glassmorphism panel floating over dark canvas	Modern aesthetic while maintaining contrast  ￼.
Micro-copy	Conversational labels (“Crush sets” not “Load Variation %”)	Proven onboarding retention tactic for sports apps  ￼.
Motion	Sub-200 ms spring animations for card expansion; confetti burst when block completes	Adds delight, signals state change without slowing flow.
Accessibility	All controls reachable at 44 × 44 pt; color-blind safe alt colors auto applied	High-school programs may include colour-vision-deficient athletes/coaches.



⸻

4 ️⃣  End-to-end UX storyboard

Scenario: Coach Riley (HS S&C coach, 55 athletes across football & track) signs up the day before off-season starts.

Frame	Description	Success metric
F1: Welcome & role priming	Riley opens SetForge → sees two-question splash: “How many athletes?” and “Main goal for next 8 wks?”. A progress bar shows 2 steps left.	< 90 sec time-to-value.
F2: Data source hook	HealthKit & Garmin toggles appear with one-line benefits (“Auto-pull readiness & HRV—no manual typing”). Skip allowed.	70 % connection rate.
F3: Block Builder wizard	Riley selects template “Triphasic HS Off-season”. Live timeline animates: colored phases update as he drags the total weeks slider.	First block built in < 3 min.
F4: Team split	Wizard asks “split across sport?” → quick multi-select list. The slider auto scales volumes for track vs. football (lighter total tonnage).	Demonstrates intelligence; prevents spreadsheet flight.
F5: Dashboard reveal	Coach sees Athlete Cards stack with traffic-light rings: green (good load), amber (rising), red (overload). A subtle pulse draws attention to 3 amber athletes.	Immediate perception of control.
F6: Athlete session (mobile)	Athlete Ava opens her phone → sees Today card: warm-up video thumbnail, set list with velocity targets. Real-time bar-speed arrives via Apple Watch; rep auto-logs.	Athlete friction-free logging.
F7: Adaptive alert	Ava misses Tuesday lift. Coach view shows a red flash. One tap opens What-If: SetForge suggests shifting today’s heavy triples to Saturday, recalculating ACWR. Coach hits Apply.	“One-tap adjust” feeling.
F8: Education & buy-in	Before deload week, athletes receive a Learn Card: “Why we’re dropping volume—muscle needs to super-compensate.” Coach gets alert that 92 % athletes viewed it.	Reduced DM chaos.
F9: Block wrap report	At week 8 end, SetForge auto-generates branded PDF: PRs, attendance, load graphs. Coach forwards to Athletic Director in two clicks.	Coach admin time ↓ > 50 %.



⸻

5 ️⃣  Visual language & components
	1.	Cards & panels: subtle glass blur (opacity 0.25) on dark pane.
	2.	Dynamic gradients: micro-motion radial gradient on phase bars indicating live load.
	3.	Typography: Inter for UI; alternate condensed face for large dashboard metrics.
	4.	Icon set: custom line icons forged-metal style; consistent stroke-width.

⸻

6 ️⃣  Technical delivery plan (MVP 16-week roadmap)

Sprint (2 wk)	Milestones
1-2	Authentication, local Realm schema, Settings shell
3-4	Block Builder wizard + inline chart (Swift Charts)
5-6	Sync engine (BKSync + CloudKit fallback), offline caching
7-8	Athlete mobile session logger + WatchKit bar-speed capture
9-10	ACWR analytics + alert rules
11-12	Adaptive What-If engine + deload logic
13-14	PDF report export (Swift-PDF) + basic email share
15-16	Accessibility polish, confetti micro-interactions, closed beta

Release criteria: < 150 MB app bundle; cold-start < 3 s on A13 chip; 95 % crash-free sessions.

⸻

7 ️⃣  Next steps
	•	Validate naming with quick .app trademark search, then spin up interactive Figma prototype of frames F1–F3 to user-test with 5 local HS coaches.
	•	Begin low-fidelity paper storyboard test on weight-room floor to ensure thumb-reach nav works with chalky fingers and mid-set use.

⸻

SetForge positions itself as the “block-engineering tool” that melds deep periodization science with modern, irresistible UX—filling the unmistakable gap left by template-only apps and enterprise giants alike.