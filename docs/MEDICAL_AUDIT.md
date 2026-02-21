# Medical Correctness Audit - MRI Planning Trainer

I reviewed all protocol definitions, scoring calculations, feedback logic, geometry math, and clinical validation. Here's my assessment broken into what's **correct**, what has **minor concerns**, and what has **actual issues**.

---

## CORRECT - Clinically Sound

### 1. MRI Parameter Ranges
- **Brain T1**: TR=600ms, TE=14ms - textbook T1 spin echo values
- **Brain T2**: TR=4800ms, TE=100ms - proper long TR/TE for T2 weighting
- **FLAIR**: TR=9000ms, TI=2500ms - correct for CSF nulling at 1.5T (TI ~2200-2500ms is standard)
- **DWI**: b=1000 s/mm^2 - standard clinical b-value for stroke/tumor DWI
- **SWI**: TR=45ms, TE=28ms, 2mm slices - correct gradient-echo parameters, thin slices appropriate for microbleed detection
- **Spine T1**: TR=550ms, TE=12ms - proper short TR for marrow characterization
- **Spine T2**: TR=3500-3800ms, TE=95-100ms - standard spine T2 values
- **STIR TI=160ms** - correct for fat nulling at 1.5T (standard is ~150-170ms)

### 2. Anatomical Planning Guidance
- AC-PC alignment for brain axials - correct standard reference
- Midline sagittal through corpus callosum - correct
- Cervical axials perpendicular to cord at each disc level - correct clinical practice
- Lumbar axials angled through each disc space - correct
- Coronal T1 centered on temporal horns - correct for epilepsy/temporal lobe protocols
- Whole spine FOV 450-500mm - realistic for C2-sacrum coverage

### 3. Scoring Architecture
- Component-weighted scoring (position 40%, coverage 25%, angulation 20%, parameters 15%) is a reasonable educational breakdown
- Pass gates requiring minimum scores per component (not just overall) prevents "gaming" by acing one axis
- Multi-target matching (accepted alternatives) is smart for protocols where slight variations are clinically equivalent
- Consensus from multiple expert annotations using median + MAD is statistically robust

### 4. Geometry Math
- Euler rotation order (Rx -> Ry -> Rz) is correct and consistent
- `angleDiff` wraps properly at 360 degrees - important for rotation scoring
- Convex hull algorithm (Andrew's monotone chain) is correct
- View projection mappings (axial=XY, sagittal=YZ, coronal=XZ) are standard radiological convention

---

## MINOR CONCERNS - Clinically Acceptable but Worth Noting

### 1. FLAIR TI at 3T
**File:** `src/features/planner/data/protocols/brain.ts:96`

TI=2500ms is correct for 1.5T. At 3T, optimal TI for CSF nulling is ~2800-2900ms. The clinical note at `src/features/planner/data/protocols/spine.ts:181` mentions "adjust TI for 3T if needed" for STIR, but the brain FLAIR protocol has no such note. Consider adding a similar note.

### 2. DWI TR=3200ms is slightly low
**File:** `src/features/planner/data/protocols/brain.ts:118`

Clinical DWI often uses TR >= 5000ms (or even 8000-10000ms) to allow sufficient slices per TR. TR=3200ms would limit slice coverage. This is not "wrong" per se, but the initial (student starting point) uses TR=2500ms which is unrealistically low.

### 3. SWI TE=28ms may be too long or short depending on field strength
**File:** `src/features/planner/data/protocols/brain.ts:140`

At 1.5T, optimal SWI TE is ~40ms; at 3T it's ~20ms. TE=28ms splits the difference. Not incorrect but could be more specific per field strength.

### 4. Slice gap = 0mm for DWI and SWI
**File:** `src/features/planner/data/protocols/brain.ts:118,140`

Zero gap (contiguous slices) is correct for SWI. For DWI, some institutions use a small gap (10-20%) to reduce crosstalk. Zero gap is defensible though.

### 5. Coronal T1 rotation rx=-12
**File:** `src/features/planner/data/protocols/brain.ts:161`

This tilts the coronal plane forward 12 degrees, which is appropriate for oblique coronal through hippocampi. The clinical note mentions "temporal horns and mesial temporal structures" which aligns. However, the note then says "avoid strong obliquity unless protocol specifically requests it" - this is slightly contradictory since the target itself has 12 degrees of obliquity. Consider rewording.

### 6. Brain T2 Sagittal TR=4200ms
**File:** `src/features/planner/data/protocols/brain.ts:203`

While adequate for T2 weighting, sagittal T2 of the brain is typically acquired as a 3D sequence (e.g., 3D SPACE/CUBE) with higher TR. For a 2D TSE this value works fine.

---

## ACTUAL ISSUES - Should Be Fixed

### 1. Missing TR >= TE validation in scoring
**File:** `src/features/planner/lib/scoring.ts`

The scoring engine does **not** enforce that TR must always be >= TE. A student could submit TR=100, TE=200 and only get a parameter mismatch penalty rather than a hard clinical error. This is a fundamental MRI physics constraint (TE can never exceed TR in standard sequences).

**Recommendation**: Add a hard validation rule in `computeScore` or as a clinical validator that flags TR < TE as an automatic fail or at minimum generates a specific feedback message like "TR must always be >= TE - this is physically impossible."

### 2. No field-strength context
**Scope:** Global

All parameters are field-strength-agnostic. T1 relaxation times differ significantly between 1.5T and 3T, affecting optimal TR, TI, and TE. For a training tool this is acceptable if you declare "all values assume 1.5T", but this is never stated anywhere in the code or UI.

**Recommendation**: Add a field strength indicator (even if fixed to 1.5T) with a note in the UI.

### 3. Position/size scoring uses Manhattan distance, not Euclidean
**File:** `src/features/planner/lib/scoring.ts:95-104`

Center error is `(|Δx| + |Δy| + |Δz|) / 3` (L1/Manhattan) rather than Euclidean distance `sqrt(Δx² + Δy² + Δz²)`. This means a box offset diagonally by (0.1, 0.1, 0.1) scores the same as one offset by (0.3, 0, 0), but anatomically they represent very different mispositioning. The diagonal offset covers a shorter actual physical distance (0.17 normalized) vs the axis-aligned offset (0.3 normalized).

**Impact**: Students could be scored more leniently when offset along a single axis vs. distributed errors. This is more of a pedagogical concern than a clinical one.

**Recommendation**: Consider using Euclidean distance for center error, or at minimum document this as a known simplification.

### 4. Rotation scoring averages all 3 axes equally
**File:** `src/features/planner/lib/scoring.ts:107-111`

The rotation error averages rx, ry, rz equally. But clinically, the critical rotation axis depends on the protocol. For a brain axial, the rz (in-plane rotation) is often less critical than rx (tilt relative to AC-PC). For a sagittal, ry (off-midline tilt) is more critical than rx.

**Recommendation**: Allow per-axis rotation weights in `ProtocolConfig`, similar to how parameter weights already work.

### 5. Feedback messages are generic
**File:** `src/features/planner/lib/scoring.ts:172-188`

"Re-center the prescription box on target anatomy" doesn't tell the student *which direction* to move. The raw errors contain signed direction information (the `box.center - target.center` components), but this is lost in the absolute value calculation and never surfaced in feedback.

**Recommendation**: Generate directional feedback like "Shift the box inferiorly and to the left" based on the signed error vector.

### 6. Spine axial protocols model a single slab, not per-disc-level groups
**File:** `src/features/planner/data/protocols/spine.ts:56-72, 144-160`

Clinical C-spine and L-spine axials are prescribed as **separate angle groups at each disc level**, each angled to match the local disc angle. The current model uses a single box with one rotation, which is a significant simplification. The clinical notes correctly describe per-disc prescriptions, but the actual scoring model can't evaluate this.

**Impact**: This is a known architectural limitation. A student can't practice the real workflow of prescribing 3-5 separate axial groups.

**Recommendation**: For now, add a UI note acknowledging this is a simplified single-slab model. Long-term, consider supporting multi-group prescriptions.

### 7. No validation that STIR TI is appropriate for the TR
**File:** `src/features/planner/data/protocols/spine.ts:162-183`

STIR requires TI << TR for proper fat nulling. The protocol has TI=160ms with TR=4500ms which is correct, but nothing prevents a student from setting TI > TR/2 (which would produce incorrect contrast). There's no feedback for this.

---

## SUMMARY SCORECARD

| Category | Rating | Notes |
|----------|--------|-------|
| **Parameter values (TR/TE/FOV/TI)** | Correct | Textbook-accurate for 1.5T MRI |
| **Anatomical guidance** | Correct | AC-PC, midline, disc-level references all standard |
| **Scoring math** | Mostly correct | Manhattan vs Euclidean is a simplification; rotation axis weighting missing |
| **Feedback quality** | Adequate | Generic messages; could add directional guidance |
| **Clinical validation** | Incomplete | Missing TR>=TE hard check, TI vs TR ratio, field strength context |
| **Protocol modeling** | Simplified | Single-slab model for inherently multi-group protocols (spine axials) |
| **Consensus algorithm** | Correct | Median + MAD is appropriate for inter-rater aggregation |
| **Geometry/projection** | Correct | Euler rotations, view projections, hit detection all accurate |

**Overall**: The clinical content is **solid for a training tool**. The parameter values would pass review by a radiologist/MRI physicist. The main gaps are in validation guardrails (TR>=TE, field strength) and feedback specificity (directional hints), not in the core clinical data itself.
