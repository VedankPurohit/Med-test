# Core Review: MRI Planning Training Simulator

**All 23 tests pass. The code is well-structured.**

---

## 1. CODE QUALITY - Strong (8/10)

### What's done well

- Clean separation of concerns: types, geometry, scoring, consensus, validation, and protocols are all in distinct modules
- Immutable scoring pipeline: `computeScore` is pure, returns a complete `PlannerScore` with schema version, raw errors, component breakdowns, and feedback
- Defensive math everywhere: `finiteOr`, `clamp`, wrapped `angleDiff` for angles, `scoreFromError` clamped to [0,1]
- Weight normalization divides by sum, so custom per-protocol weights always work even if they don't add to 1
- `validateProtocolConfig` runs at module load time (`planner-config.ts:45-47`) - invalid protocol data crashes at startup, not at scoring time
- The `acceptedTargets` pattern for multiple valid placements is a good design choice for real MRI training

### Issues found

#### A. Center error uses Manhattan distance, not Euclidean (`scoring.ts:95-99`)

```ts
const centerErr =
  (Math.abs(box.center.x - target.center.x) +
    Math.abs(box.center.y - target.center.y) +
    Math.abs(box.center.z - target.center.z)) / 3;
```

This averages absolute per-axis differences. A shift of (0.15, 0.15, 0) scores the same as (0, 0, 0.3) which is misleading. Euclidean distance (`sqrt(dx^2+dy^2+dz^2)`) would be a more faithful representation of how far off the box actually is in 3D space. Same issue with `sizeErr` on lines 101-105.

#### B. Rotation scoring uses independent Euler-angle comparison (`scoring.ts:107-111`)

This is the biggest technical concern. Comparing `rx, ry, rz` independently and averaging them does NOT correctly measure the angular difference between two 3D orientations. Two different Euler-angle triples can represent the same or very similar orientations (gimbal lock regions, wrapping). For small angles (<15 degrees) this is approximately fine, but it becomes inaccurate for larger deviations. For a training tool where typical tolerance is ~15-18 degrees, this is acceptable for now but would need quaternion-based geodesic distance for precision.

#### C. The `angleDiff` function wraps at 360 (`geometry.ts:217-223`)

MRI slice angulation is typically in [-45, 45] degrees (enforced in your UI), so the 360 wrap is correct math but not specifically needed. More importantly: it correctly handles the wrap, so no bug here.

#### D. Feedback is generic (`scoring.ts:172-188`)

The `buildFeedback` function returns canned strings like "Re-center the prescription box." For a training tool, this should eventually say *which direction* the student is off (e.g., "Box is shifted too far anteriorly" or "Angulation is 8 degrees too steep on the axial plane"). This is a client expectation gap.

---

## 2. MEDICAL ACCURACY - Good foundation, some gaps (7/10)

### What's correct

- Brain protocol parameter values are clinically realistic:
  - T1 Sagittal: TR=600, TE=14, FOV=230 (correct for spin-echo T1)
  - T2 Axial: TR=4800, TE=100, FOV=220 (correct for fast spin-echo T2)
  - FLAIR: TR=9000, TE=120, TI=2500 (correct for 3T FLAIR)
  - DWI: TR=3200, TE=85, b=1000 (standard clinical DWI)
  - SWI: TR=45, TE=28, thin slices at 2mm (correct for susceptibility-weighted)
- The test on `brain-protocols.test.ts:60-89` validates clinical sanity (TR >= TE, FOV in 180-300, etc.)
- Clinical notes are protocol-specific and accurate (e.g., "parallel to AC-PC" for axial brain)

### Gaps

#### A. Spine protocols are very thin

Only 2 protocols (C-spine sag T2, L-spine axial T2). A real clinical workflow would need at minimum:

- C-spine sagittal T1
- C-spine axial T2 (through disc levels)
- T-spine sagittal T1 and T2
- L-spine sagittal T1
- L-spine sagittal STIR
- Whole-spine screening sagittal

#### B. No anatomical landmark reference for rotation targets

The target rotations (e.g., `rx: -6, ry: 2, rz: 9` for brain T2 axial) are hard-coded numbers in normalized space. In real MRI, the angulation depends on the specific patient's anatomy (e.g., AC-PC line angle varies per patient). The consensus system addresses this well for instructor-calibrated cases, but the default targets assume a "standard" head position. This is a known limitation that should be documented.

#### C. The coordinate system is normalized [-1, 1] not in real mm

This is fine for a training tool, but it means the `tolerances.center = 0.22` doesn't directly translate to mm. As long as the localizer images and the box are in the same coordinate space, this works. But it means you can't say "you're 5mm off" in feedback, only relative percentages. Clients who are MRI technologists will expect mm-based feedback eventually.

#### D. Brain T2 Sagittal has `rz: -2` (`brain.ts:203-206`)

For a sagittal acquisition, the primary angulation landmark is the midline (interhemispheric fissure). A non-zero rz (axial-plane rotation) of -2 degrees is unusual as a *target*. This might confuse trainees who are taught that sagittal should be strictly midline. Consider whether this is intentional patient-position compensation or a data entry issue.

---

## 3. CLIENT EXPECTATIONS - Core is solid, some missing pieces (6/10)

### What clients will love

- Multi-target scoring (primary + accepted alternatives) handles real-world variability well
- Component breakdown (position/coverage/angulation/parameters) maps directly to how MRI planning is taught
- Pass/fail gates with per-component minimums prevent "gaming" (can't pass with 100% position but 10% angulation)
- Instructor calibration mode lets educators override defaults for their own patient images
- Score export to JSON for record-keeping
- Clinical notes per protocol for educational context

### What clients will expect that's missing

#### A. No per-view scoring breakdown

Right now the score is a single 3D comparison. An MRI tech adjusts the box on each of the 3 views independently. They'll want to know: "Your axial placement was good but your sagittal alignment was off." The `ViewId` concept exists in the types but scoring is purely 3D.

#### B. No attempt history / progress tracking

Currently `lastScore` is a single score. For a training tool, clients expect to see improvement over time (e.g., "Your average score on brain T2 axial improved from 62% to 84% this week"). The `PlannerScore` type is well-structured for this (has `timestamp`, `caseId`, `protocolId`), but there's no persistence beyond localStorage.

#### C. No difficulty levels

The `tolerances` are fixed per protocol. Clients will want a "beginner" mode with wider tolerances and an "advanced" mode with tighter ones. The type system supports this via `scoringProfile`, but no protocols use it.

#### D. No "show me how" / guided mode

When a trainee fails, there's no way to animate or step-through the correct placement. The `showTarget` boolean just overlays the target box. A proper training tool needs a mode that shows the target on one view at a time with anatomical landmark callouts.

#### E. Coverage scoring uses size comparison, not actual anatomical coverage

`sizeErr` compares box dimensions (x, y, z), not whether the box actually covers the required anatomy. If the box is the right size but positioned to miss the posterior fossa, the coverage score could still be high. In MRI planning, "coverage" means specific anatomy is included. The `position` and `coverage` scores partially overlap in what they measure.

---

## Summary Verdict

| Area | Rating | Notes |
|------|--------|-------|
| Code quality | **8/10** | Clean, testable, defensive. Manhattan vs Euclidean and Euler-angle comparison are the main technical debts |
| Medical accuracy | **7/10** | Brain protocols are solid. Spine is skeletal. Parameter values are clinically correct |
| Client readiness | **6/10** | Core scoring loop works. Missing per-view feedback, history, difficulty levels, and mm-based feedback |

**The architecture is sound for what you're building.** The type system, scoring pipeline, and protocol structure are well-designed to support the features you'll need. The most impactful improvements would be:

1. Switch center/size error to Euclidean distance (small code change, better accuracy)
2. Add directional feedback ("too far anterior", "angulation too steep")
3. Flesh out spine protocols
4. Add per-view scoring breakdown
