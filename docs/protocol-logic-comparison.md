# Med-Test vs Med-Dummy: Protocol Planning Logic Comparison

## 1. Protocol Coverage

| Aspect | Med-Test (planner v1) | Med-Dummy |
|--------|----------------------|-----------|
| **Brain protocols** | 10 | 8 |
| **Spine protocols** | 2 | 5 |
| **Total** | 12 | 13 |
| **Unique to Med-Test** | T2 Sagittal Brain, T1 Axial Post-Contrast | — |
| **Unique to Med-Dummy** | — | 3D MPRAGE, Spine STIR, Spine Axial T1, Spine Sagittal T1 |

Med-Test has slightly more brain coverage (post-contrast, extra sagittal). Med-Dummy has significantly richer spine coverage (5 vs 2) and includes advanced sequences like 3D MPRAGE and STIR.

---

## 2. Coordinate System — Fundamentally Different

This is the biggest architectural difference:

| Aspect | Med-Test | Med-Dummy |
|--------|----------|-----------|
| **Units** | **Normalized [-1, 1]** | **Real-world millimeters** |
| **Center example** | `{x: 0.03, y: -0.05, z: 0.12}` | `{ap: 0, rl: 3, fh: 5}` |
| **Axis naming** | Generic `x, y, z` | Anatomical `ap, rl, fh` |
| **Rotation naming** | Generic `rx, ry, rz` | View-based `sagittal, coronal, axial` |
| **FOV in box?** | Size is part of box (`size.x/y/z`) | FOV is in scan parameters (`fovAP, fovRL`) |

Med-Dummy is more clinically intuitive — a radiographer reads `ap: 5mm` and immediately knows what it means. Med-Test's normalized coordinates require mental mapping.

---

## 3. Scoring Architecture

### 3.1 Scoring Criteria

| Criterion | Med-Test | Med-Dummy |
|-----------|----------|-----------|
| **Position/Center** | `position` (40%) | `midline` (20%) |
| **Coverage/Size** | `coverage` (25%) | `coverage` (25%) |
| **Angulation** | `angulation` (20%) | `angulation` (25%) |
| **Symmetry** | — | `symmetry` (15%) |
| **Parameters** | `parameters` (15%) | `parameters` (15%) |
| **Total criteria** | **4** | **5** |

Med-Dummy adds a **symmetry criterion** (tilt on the perpendicular view) that Med-Test doesn't evaluate. This is clinically important — asymmetric scan planes produce uneven anatomy coverage.

### 3.2 Scoring Math

| Aspect | Med-Test | Med-Dummy |
|--------|----------|-----------|
| **Score range** | 0.0–1.0 (displayed as %) | 0–100 integer |
| **Falloff** | `clamp(1 - error/tolerance)` | `linearFalloff(error, maxError)` — same math |
| **Pass/Fail gates** | Yes: 75% overall, 55% position, 55% coverage, 45% angulation | No explicit pass gates |
| **Per-protocol weights** | Overridable via `scoringProfile` | Always defined per protocol |

Med-Test's **pass gates** are a significant educational feature — students must meet minimums in each category, not just optimize overall. Med-Dummy lacks this.

### 3.3 Parameter Scoring

| Aspect | Med-Test | Med-Dummy |
|--------|----------|-----------|
| **Method** | Continuous: `\|attempt - expected\| / \|expected\|` | **Three-tier**: good (1.0), warning (0.5), bad (0.0) |
| **Range system** | Single target value + tolerance | **Dual range**: ideal range + acceptable range |
| **Feedback** | Generic improvement suggestions | Specific: "TE is below ideal (80ms). Ideal: 80-120ms" |

Med-Dummy's **dual-range system** (`idealMin/idealMax` + `min/max`) is more clinically realistic — in practice, MRI parameters have "optimal" and "acceptable" windows, not single correct values. A TR of 4500ms and 5500ms are both perfectly fine for T2.

Med-Test treats parameters as point targets with tolerance, which is less forgiving and less realistic.

---

## 4. Protocol Definition Richness

| Feature | Med-Test | Med-Dummy |
|---------|----------|-----------|
| **Clinical notes** | Brief 1-liner per protocol | — |
| **Planning instructions** | — | Detailed step-by-step per protocol |
| **Clinical explanations** | — | Per-criterion `why` + `clinical` text |
| **Tissue signal tables** | — | Full tissue appearance per sequence |
| **Sequence type** | Implicit | Explicit (`TSE`, `EPI`, `GRE`, `3D-IR-GRE`) |
| **Editable param list** | All params always editable | Per-protocol `editableParameters` array |
| **Initial box (imperfect)** | — | Deliberately off-target starting position |

Med-Dummy protocols are dramatically richer educationally. Each one includes:
- Why angulation matters for this specific sequence
- What happens clinically if you get it wrong
- What each tissue looks like on this sequence
- Which parameters the student should adjust (not all)
- A deliberately imperfect starting box that mimics real workflow

Med-Test protocols are more like data records — clinically correct values, but minimal educational scaffolding.

---

## 5. Localizer Images

| Aspect | Med-Test | Med-Dummy |
|--------|----------|-----------|
| **Brain sets** | **3 sets** (basal ganglia, centrum semiovale, posterior fossa) | 1 set |
| **Spine sets** | 1 set | 1 set |
| **Image source** | Real MRI from Wikimedia Commons | Brain: real images; Spine: **procedurally generated** |
| **FOV metadata** | Not stored per-image | **Real-world FOV in mm** per image |
| **Upload support** | Yes (localStorage) | No |
| **Calibration mode** | Yes (instructor override) | No |

Med-Test wins on **localizer variety** — 3 brain sets at different anatomical levels is more realistic training (different patients look different). It also has instructor calibration and image upload.

Med-Dummy wins on **projection accuracy** — each localizer stores `realWorldFovH/V` in mm, so the projection math converts mm to pixels correctly. Med-Test uses normalized coordinates, so the relationship between pixel space and anatomy is less precise.

Med-Dummy's **procedurally generated spine localizers** are impressive — anatomically accurate T1-weighted images with vertebral bodies, spinal cord, CSF, discs, and neural foramina at correct signal intensities.

---

## 6. 3D Geometry

| Aspect | Med-Test | Med-Dummy |
|--------|----------|-----------|
| **Rotation model** | Full 3D Euler (RX->RY->RZ) with 8-corner projection | Per-view rotation angles (simpler) |
| **Box rendering** | Two modes: `cube3d` (convex hull) and `flat2d` | Single mode: rectangle with rotation |
| **Hit testing** | Ray-casting polygon containment | Handled by canvas library |
| **Drag mapping** | Per-view axis mapping | Per-view with mm scale factors |

Med-Test has a more sophisticated 3D model — true 3D rotation with 8-corner projection and convex hull rendering. This means tilted boxes look genuinely 3D on screen.

Med-Dummy uses a simpler per-view rotation — each view has its own rotation angle, and the box renders as a rotated rectangle. This is less physically accurate but perfectly adequate for training.

---

## 7. Advanced Features

| Feature | Med-Test | Med-Dummy |
|---------|----------|-----------|
| **Multi-target matching** | Yes — accepted alternative positions | No |
| **Expert consensus system** | Yes — median-based from multiple raters | No |
| **Calibration mode** | Yes — instructor overrides stored in localStorage | No |
| **Pass/fail gates** | Yes — minimum per-criterion | No |
| **Feedback hints** | Generic ranked suggestions | **Specific directional**: "Drag 5mm left on CORONAL" |
| **Orientation-aware scoring** | No — same logic for all orientations | Yes — midline axis and coverage axis adapt |

Med-Test has more infrastructure for flexibility (multi-target, consensus, calibration). Med-Dummy has more clinical intelligence baked into the scoring (orientation-aware axis selection, directional hints).

---

## 8. Medical Accuracy Verdict

| Dimension | Med-Test | Med-Dummy |
|-----------|----------|-----------|
| **Parameter values** | Clinically correct | Clinically correct |
| **Angulation references** | Correct (AC-PC, corpus callosum) | Correct + more specific (sinuses for DWI) |
| **Physics constraints** | Tested (TR>=TE, FLAIR TR>=7000) | Encoded in ranges (MPRAGE gap=0, STIR TI) |
| **Sequence-specific logic** | Minimal — same scoring for all | Rich — DWI weighted for angulation, MPRAGE for coverage |
| **Spine accuracy** | Basic (2 protocols) | Detailed (5 protocols, thinner slices, cord-specific) |

Both are clinically accurate. Med-Dummy goes deeper — it knows DWI needs steeper angulation to avoid EPI artifacts at air-tissue interfaces, that MPRAGE gap must be 0mm for 3D contiguous partitions, and that spine needs thinner slices to resolve the narrow spinal cord.

---

## Summary

| | Med-Test | Med-Dummy |
|---|---------|-----------|
| **Strength** | Infrastructure & flexibility | Clinical depth & education |
| **Coordinate system** | Normalized (abstract) | Real mm (clinical) |
| **Scoring** | 4 criteria + pass gates | 5 criteria + orientation-aware |
| **Parameters** | Point-target + tolerance | Dual-range (ideal + acceptable) |
| **Educational content** | Minimal | Extensive per-protocol |
| **Localizer variety** | 3 brain sets + upload/calibration | 1 brain set + synthetic spine |
| **Advanced features** | Multi-target, consensus, calibration | Directional hints, tissue signals |
| **3D model** | True 3D with Euler rotation | Simplified per-view |

**Bottom line**: Med-Test has the better *platform* (multi-target, consensus, calibration, multiple localizer sets). Med-Dummy has the better *medical content* (richer protocols, dual-range parameters, orientation-aware scoring, clinical explanations, tissue signals). The ideal system would combine Med-Test's infrastructure with Med-Dummy's clinical depth — which appears to be what the planner-v2 in Med-Test is working toward.
