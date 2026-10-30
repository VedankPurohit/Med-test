# Reference Video Comparison: Current Web App vs Workstation-Style References

## Purpose

This document summarizes what the provided videos appear to be comparing, what the current MedAssist web app already does well, and what is still missing or weak relative to workstation-style MRI planning tools and stronger training experiences.

Image evidence for this write-up is stored in:

- [reference-video-analysis/README.md](/Users/vedank/Github/Med-test/doc/reference-video-analysis/README.md)

## Assumption About The Videos

- **Video 1** (`08.51.26.mp4`) appears to show a real or workstation-style MRI planning console with dense clinical UI, visible prescription boxes, and direct multi-planar planning interaction.
- **Videos 2-4** (`09.19.03.mp4`, `09.19.16.mp4`, `09.19.27.mp4`) appear to show a web-based MRI planning trainer or closely related prototype with planning, validation, and scoring/review states.

If this mapping is slightly wrong, the comparison still holds at a product level:
- the benchmark is a **clinical/workstation-like planning experience**
- our product is a **browser-based training simulator**

## What The Comparison Is Really About

The videos are not just comparing visual style. They are comparing four deeper things:

1. **Clinical realism**
   How much the app feels like a real MRI planning workstation.

2. **Training clarity**
   How easily a learner understands what to do, what is wrong, and how to improve.

3. **Planning interaction quality**
   How visible and controllable the prescription box, angles, coverage, and orientation are.

4. **Review and feedback quality**
   How well the app explains pass/fail and whether the feedback helps the learner correct the next attempt.

### Plain-Language Explanation

- **Clinical realism** means: does this feel like real MRI planning work, or just a generic educational app?
- **Training clarity** means: can a learner quickly understand what to do next and why they are wrong?
- **Planning interaction quality** means: is the prescription box easy to see, place, rotate, and reason about?
- **Review and feedback quality** means: after checking the answer, does the app actually help the learner improve?

## What Our Current Web App Does Well

## 1. Strong training structure

Compared with a real MRI console, our app is much easier to enter and understand:

- clear region selection
- guided protocol flow
- explicit sequence ordering
- tips/guidance toggles
- dedicated feedback/report states

This is a real advantage. A clinical console is powerful, but it is not designed for teaching beginners.

Why this matters:

- a learner can get into the exercise quickly
- the product already has a teachable flow
- this is a real strength we should not lose while making the UI more clinical

## 2. Clean tri-planar planning layout

The current workstation UI gives the learner:

- three synchronized views
- orientation labels
- a protocol list
- patient context
- a dedicated feedback area

That makes the learning objective legible. The overall structure is better for training than a raw clinical console.

Why this matters:

- the three-view layout is already the right core surface
- the improvement opportunity is to strengthen what sits on top of it, not replace it

## 3. Better educational scaffolding than a pure workstation clone

The app already includes capabilities that matter for teaching:

- scoring
- pass/fail logic
- tips
- protocol ordering flow
- simulated scan results
- session/report concepts

This is one of the biggest strengths of the current product direction. We are not just copying a scanner UI; we are building a trainer.

Why this matters:

- a workstation clone alone would not be enough
- the teaching scaffolding is part of the product advantage

## 4. Good platform foundation

From the current implementation, the app already has solid product building blocks:

- typed protocol definitions
- planner-to-workstation bridge
- volume-backed slice viewing
- guidance overlays
- scan result simulation
- test coverage around core planning logic

That means the main gaps are mostly in **clinical depth**, **feedback quality**, and **interaction design**, not in basic architecture.

Why this matters:

- we do not need to rebuild from scratch
- we can improve the training experience by deepening the core surfaces that already exist

## What The Reference/Other Tools Do Better

## 1. More believable workstation feel

The workstation-style reference has stronger clinical credibility because the UI shows:

- denser scan-planning chrome
- clearer prescription overlays
- more obvious crosshair and geometry relationships
- less “app shell”, more “scanner console”

Our app currently feels more like a polished simulator than a true planning console.

What that means in practice:

- users may understand the product, but not fully trust it as “real MRI planning”
- the UI currently reads as educational software first and workstation second

## 2. Better immediate visibility of planning intent

In the reference material, it is easier to read:

- where the box is
- how it is angled
- which planes are editable vs derived
- how the three views relate to one another

In our current UI, the planning images are strong, but the prescription state is not always visually dominant enough.

What that means in practice:

- the learner can see the anatomy
- but the planning task itself is not commanding enough attention
- this weakens confidence and slows correction

## 3. More integrated planning + parameter context

The reference flows make it feel like planning and scan setup belong to the same action. In our app, parameters and planning are present, but the relationship is still too separated.

The result is:

- the learner can see images
- the learner can see workflow panels
- but the “why this plan is correct for this protocol” is still not strong enough on-screen

What that means in practice:

- the learner may edit parameters and adjust planning without feeling the connection between them
- the UI still needs stronger protocol-specific teaching cues

## 4. More confidence-inspiring review states

The external examples communicate review more explicitly through dense visible controls, criteria, and visual confirmation. Our feedback exists, but it still feels like a side panel rather than the center of the learning loop.

What that means in practice:

- the check result is visible
- but it does not yet feel like a strong guided debrief
- this limits how much the learner improves from each attempt

## What Is Good In Ours

These are the strongest parts of the current MedAssist app and should be preserved:

### A. The app is teachable

The flow is much easier for a learner than a clinical workstation:

- select region
- pick protocols
- confirm order
- plan
- check
- review

That is a major product strength.

Explanation:

- this is where MedAssist is already ahead of a raw console
- real consoles are powerful but not beginner-friendly
- MedAssist already has a clearer educational path

### B. The tri-planar images are the right foundation

The three-panel brain planning view is the correct core metaphor. It maps well to MRI planning and gives the right surface for future improvement.

Explanation:

- the central layout does not need a conceptual reset
- it needs stronger planning overlays, clearer geometry, and better teaching context

### C. Guidance is already part of the product

Tips, feedback, simulated scan results, and reporting mean the app is already pointed toward training outcomes rather than pure UI imitation.

Explanation:

- this is important because it gives the product a differentiated role
- it should become a clinically believable trainer, not just a pretty clone

### D. It is easier to evolve than the reference tools

Because it is web-based and modular, we can add:

- protocol-specific hints
- directional feedback
- view-specific scoring
- better overlays
- richer protocol data

without having to rebuild the platform.

Explanation:

- the architecture is good enough to support the next wave of improvements
- most of the work is product refinement, not foundational rescue

## What Is Missing Or Weak In Ours

## 1. The planning box / geometry is not visually assertive enough

This is the biggest UX gap against the workstation-style reference.

The learner should instantly understand:

- what box is active
- where its center is
- how it is rotated
- what anatomy it is supposed to cover
- which views are directly editable

Right now that understanding takes too much interpretation.

Explanation:

- if the learner has to hunt for the key geometry, the training loop becomes weaker
- the planning box should be one of the first things the eye notices

## 2. Feedback is still too generic

Current scoring is useful, but the product still needs more of:

- directional feedback
- per-view feedback
- landmark-based feedback
- protocol-specific correction advice

Instead of only “position/coverage/angulation/parameters”, the learner eventually needs guidance like:

- move superior
- reduce coronal tilt
- align to AC-PC line
- extend coverage to include posterior fossa

Explanation:

- generic scoring tells the learner that they are wrong
- coaching-style feedback tells them how to fix it
- the product needs much more of the second kind

## 3. The app is not yet clinically dense enough

The current UI is understandable, but it lacks some of the “serious console” feeling that creates user trust for MRI planning training.

What is missing is not decoration. It is visible context such as:

- stronger planning annotations
- clearer slice/prescription indicators
- more explicit sequence context
- stronger visual connection between protocol and planning target

Explanation:

- a more clinical look is useful only when it improves trust and comprehension
- the goal is not visual noise, but visible planning context

## 4. Parameter teaching is present but not yet convincing

The app has parameter panels, but the learning loop between:

- protocol choice
- parameter choice
- scan planning
- expected image outcome

is still weaker than it needs to be.

Parameter editing should feel like part of the same planning decision, not a separate admin form.

Explanation:

- in MRI planning, parameter choice and slice planning are linked
- the product should teach that relationship more directly on-screen

## 5. Too much value is hidden in secondary panels

Several important concepts are present in the product, but they do not command enough attention in the default view:

- feedback
- parameter rationale
- scan result consequences
- editable vs derived logic

The product has the right ideas, but they are not yet winning the attention hierarchy.

Explanation:

- the content exists
- the layout still needs to decide more clearly what the learner must notice first

## 6. Realism and educational clarity are not yet fully combined

Today the app sits in between:

- a clean educational simulator
- a convincing workstation replica

That middle position is useful, but it also means it does not yet fully win on either axis.

The best next step is **not** to chase raw visual polish. It is to make the planning interaction feel more clinically real while keeping the app teachable.

Explanation:

- this aligns with the project rule of core correctness before UI polish
- the right work is high-signal interaction improvement, not cosmetic redesign

## Prioritized Recommendations

## Priority 1: Strengthen the planning canvas first

Improve the central planning experience before adding more surface UI.

Focus on:

- stronger prescription box visibility
- clearer center/angle/crosshair presentation
- clearer editable vs derived states
- more obvious anatomy coverage cues

This is the highest-leverage improvement.

Why this is first:

- the center of the product is planning
- if the planning geometry is not strong enough, every other panel becomes less effective

## Priority 2: Upgrade feedback from score summary to coaching

Move from generic results to instructional correction.

Add:

- directional movement hints
- per-view explanation
- landmark references
- protocol-specific reasons for failure

Why this is second:

- stronger coaching creates immediate value without requiring a total UI rewrite
- it also reinforces the app’s main identity as a trainer

This will make the app feel much smarter without changing its architecture.

## Priority 3: Keep parameters visible in-context during planning

Do not make scan parameters feel detached from planning.

The learner should be able to see, while planning:

- what sequence they are planning
- which parameters matter for this sequence
- what is editable
- how parameter choices affect expected outcome

Why this matters:

- this is how the app can teach MRI reasoning, not just box manipulation

## Priority 4: Improve workstation credibility without over-investing in polish

Add realism where it improves trust and learning:

- stronger planning chrome
- better status/readout density
- more convincing protocol context
- clearer scan-state transitions

Avoid spending time on cosmetic polish that does not improve planning correctness.

Why this matters:

- “looks more like a console” is not enough by itself
- realism only helps when it supports trust, planning accuracy, or teaching clarity

## Priority 5: Deepen protocol-specific teaching content

This is where the product can surpass simple UI imitation.

Add:

- landmark notes
- common mistakes
- why-this-matters explanations
- expected anatomy coverage notes
- protocol-specific success criteria

Why this matters:

- this is one of the clearest ways for MedAssist to outperform simple workstation mimicry
- educational depth is a strategic advantage

This fits the product’s educational goal much better than visual polish alone.

## Suggested Product Positioning

The app should not try to become a perfect scanner clone.

A stronger target is:

**“A clinically believable MRI planning trainer with explicit teaching and review.”**

That means:

- more credible planning interaction than today
- much better teaching and correction than a clinical console
- less emphasis on decorative realism
- more emphasis on clinically grounded guidance

## Short Verdict

The current app is already good at **structure, teachability, and platform design**.

The main weaknesses are:

- the planning interaction does not yet feel clinically strong enough
- the geometry/prescription state is not emphasized enough
- the feedback is not yet specific enough to coach a learner
- important teaching value is still hidden in secondary panels

So the right conclusion is:

**our app is better than the references at guided learning flow, but weaker at clinical planning realism and immediate visual confidence.**

That should drive the next iteration.

## Implementation Areas In The Current Codebase

If we turn this comparison into product work, the most relevant implementation areas are:

- [src/features/workstation/components/workstation/WorkstationLayout.tsx](/Users/vedank/Github/Med-test/src/features/workstation/components/workstation/WorkstationLayout.tsx)
- [src/features/workstation/components/workstation/PlanningCanvasPanel.tsx](/Users/vedank/Github/Med-test/src/features/workstation/components/workstation/PlanningCanvasPanel.tsx)
- [src/features/workstation/components/workstation/ProtocolBrowser.tsx](/Users/vedank/Github/Med-test/src/features/workstation/components/workstation/ProtocolBrowser.tsx)
- [src/features/workstation/components/workstation/DynamicParameterPanel.tsx](/Users/vedank/Github/Med-test/src/features/workstation/components/workstation/DynamicParameterPanel.tsx)
- [src/features/workstation/components/workstation/FeedbackPanel.tsx](/Users/vedank/Github/Med-test/src/features/workstation/components/workstation/FeedbackPanel.tsx)
- [src/features/guidance/components/ScanResultPanel.tsx](/Users/vedank/Github/Med-test/src/features/guidance/components/ScanResultPanel.tsx)

Those files already contain the core surfaces needed for the next round of improvements.
