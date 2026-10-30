import { ProtocolConfig } from "@/features/planner/types/planner";
import { EXTENDED_PARAMETER_SPECS, IR_PARAMETER_SPECS, makeFullParams, makeProtocol, makeTarget } from "@/features/planner/data/protocols/helpers";

const CSPINE_SPECS = EXTENDED_PARAMETER_SPECS;

// PhaseEncDir encoding: 0=AP, 1=PA, 2=RL, 3=LR, 4=SI, 5=IS
// FatSuppression encoding: 0=None, 1=CHESS, 2=STIR, 3=SPAIR, 4=Dixon

export const CSPINE_PROTOCOLS: ProtocolConfig[] = [
  makeProtocol({
    id: "cspine_sag_t2",
    label: "C-Spine Sagittal T2",
    workflowOrder: 1,
    target: makeTarget(
      { x: 0.0, y: -0.08, z: 0.0 },
      { x: 0.50, y: 0.85, z: 0.72 },
      { rx: 10, ry: 0, rz: 0 },
      makeFullParams(3500, 100, 260, 13, 3, 0.3, 150, 384, 256, 2, 150, 17, 0, 0)
    ),
    initial: makeTarget(
      { x: 0.18, y: 0.15, z: -0.25 },
      { x: 0.35, y: 0.58, z: 0.48 },
      { rx: -5, ry: -6, rz: 7 },
      makeFullParams(2500, 70, 300, 10, 4, 1.0, 120, 256, 192, 1, 200, 12, 0, 0)
    ),
    tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 },
    parameterSpecs: CSPINE_SPECS,
    clinicalNotes: [
      "Center sagittal slab on midline through cervical spinal canal from skull base to C7-T1.",
      "Align slab parallel to cervical lordosis for optimal cord visualization."
    ],
    teaching: {
      purpose: "Demonstrate CSF-cord contrast for disc herniations, cord compression, and myelopathy assessment.",
      planningHint: "Center the sagittal slab on the midline using the axial localizer. Align slices parallel to the cervical lordosis on the sagittal localizer.",
      planningChecklist: [
        "Midline slab centered on spinal canal from skull base to C7-T1",
        "Slices aligned parallel to cervical lordosis curvature",
        "Sufficient lateral coverage to include neural foramina bilaterally"
      ],
      parameterHighlights: [
        { key: "TR", explanation: "Long TR (3000-4000ms) allows full T2 relaxation for bright CSF contrast against the dark spinal cord." },
        { key: "TE", explanation: "TE ~100ms provides strong T2 weighting to highlight fluid-filled spaces and disc pathology." },
        { key: "ETL", explanation: "ETL of 17 speeds acquisition while maintaining adequate resolution for the thin cervical cord." }
      ],
      correctOrderHint: 1
    }
  }),
  makeProtocol({
    id: "cspine_sag_t1",
    label: "C-Spine Sagittal T1",
    workflowOrder: 2,
    target: makeTarget(
      { x: 0.0, y: -0.08, z: 0.0 },
      { x: 0.50, y: 0.85, z: 0.72 },
      { rx: 10, ry: 0, rz: 0 },
      makeFullParams(550, 12, 260, 13, 3, 0.3, 90, 256, 192, 2, 150, 4, 0, 0)
    ),
    initial: makeTarget(
      { x: -0.15, y: 0.12, z: -0.22 },
      { x: 0.35, y: 0.60, z: 0.50 },
      { rx: -4, ry: 5, rz: -6 },
      makeFullParams(780, 20, 290, 10, 4, 1.0, 70, 192, 160, 1, 200, 3, 0, 0)
    ),
    tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 },
    parameterSpecs: CSPINE_SPECS,
    clinicalNotes: [
      "T1 sagittal should mirror T2 sagittal coverage for pre/post-contrast comparison.",
      "Short TR (< 700ms) essential for proper T1 weighting of vertebral marrow."
    ],
    teaching: {
      purpose: "Provide T1-weighted anatomical detail for vertebral marrow evaluation and pre-contrast baseline.",
      planningHint: "Copy the sagittal T2 prescription exactly. Short TR gives T1 contrast showing bright marrow and dark CSF.",
      planningChecklist: [
        "Geometry matches sagittal T2 prescription for direct comparison",
        "Short TR confirmed for proper T1 weighting",
        "Coverage extends from skull base through C7-T1 junction"
      ],
      parameterHighlights: [
        { key: "TR", explanation: "Short TR (500-600ms) is essential for T1 weighting — it captures tissues before full relaxation, making fat bright and fluid dark." },
        { key: "TE", explanation: "Minimum TE (~12ms) avoids T2 contamination, keeping the image purely T1-weighted." },
        { key: "FlipAngle", explanation: "90-degree flip angle maximizes T1 contrast in spin echo sequences." }
      ],
      correctOrderHint: 2
    }
  }),
  makeProtocol({
    id: "cspine_ax_t2",
    label: "C-Spine Axial T2",
    workflowOrder: 3,
    target: makeTarget(
      { x: 0.0, y: -0.12, z: -0.02 },
      { x: 0.65, y: 0.52, z: 0.35 },
      { rx: -5, ry: 0, rz: 0 },
      makeFullParams(4500, 100, 200, 24, 4, 0.4, 150, 320, 256, 2, 150, 15, 0, 0)
    ),
    initial: makeTarget(
      { x: 0.15, y: 0.10, z: -0.28 },
      { x: 0.45, y: 0.36, z: 0.24 },
      { rx: 8, ry: -5, rz: -7 },
      makeFullParams(2600, 68, 240, 18, 5, 1.0, 120, 256, 192, 1, 200, 10, 0, 0)
    ),
    tolerances: { center: 0.22, size: 0.20, rotation: 16, param: 0.22 },
    parameterSpecs: CSPINE_SPECS,
    clinicalNotes: [
      "Prescribe axial slices perpendicular to the cervical cord at each disc level.",
      "Cover C3-C4 through C6-C7 disc levels; angle each group to match local cord axis."
    ],
    teaching: {
      purpose: "Visualize disc-cord relationship, foraminal stenosis, and lateral recess pathology in cross-section.",
      planningHint: "Angle axial slices perpendicular to the cord at each disc level. Use the sagittal T2 as a reference for slice angulation.",
      planningChecklist: [
        "Slices angled perpendicular to the cord at each disc level",
        "Coverage from C3-C4 through C6-C7 disc spaces",
        "Small FOV (200mm) for high in-plane resolution of the cervical cord"
      ],
      parameterHighlights: [
        { key: "FOV", explanation: "200mm FOV provides high resolution for the small cervical spinal canal — like zooming in on a map to see fine detail." },
        { key: "SliceThickness", explanation: "4mm axial slices balance resolution and signal for cross-sectional cord evaluation." },
        { key: "ETL", explanation: "ETL of 15 gives efficient acquisition while preserving fine anatomic detail at each disc level." }
      ],
      correctOrderHint: 3
    }
  }),
  makeProtocol({
    id: "cspine_cor_stir",
    label: "C-Spine Coronal STIR",
    workflowOrder: 4,
    target: makeTarget(
      { x: 0.02, y: -0.03, z: 0.06 },
      { x: 0.82, y: 0.68, z: 0.72 },
      { rx: -10, ry: -3, rz: 2 },
      { ...makeFullParams(5000, 40, 260, 20, 3, 0.3, 150, 320, 224, 2, 150, 13, 4, 2), TI: 160 }
    ),
    initial: makeTarget(
      { x: 0.17, y: 0.12, z: -0.09 },
      { x: 0.58, y: 0.48, z: 0.50 },
      { rx: -3, ry: 2, rz: -4 },
      { ...makeFullParams(3500, 30, 300, 16, 4, 0.8, 120, 256, 192, 1, 200, 10, 4, 2), TI: 120 }
    ),
    tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 },
    parameterSpecs: IR_PARAMETER_SPECS,
    clinicalNotes: [
      "Coronal STIR evaluates brachial plexus and nerve roots exiting cervical foramina.",
      "Fat suppression highlights edema in nerve roots, paraspinal muscles, and vertebral bodies."
    ],
    teaching: {
      purpose: "Detect nerve root edema and brachial plexus pathology using fat-suppressed coronal imaging.",
      planningHint: "Plan coronal slices through the neural foramina using the axial localizer. STIR fat suppression reveals subtle edema invisible on standard sequences.",
      planningChecklist: [
        "Coronal slab centered on neural foramina and brachial plexus",
        "STIR fat suppression confirmed with appropriate TI for field strength",
        "SI phase encoding direction selected to avoid aliasing artifacts"
      ],
      parameterHighlights: [
        { key: "TI", explanation: "TI of 160ms nulls fat signal at 1.5T, making edema conspicuous against suppressed background fat." },
        { key: "FatSuppression", explanation: "STIR (value 2) provides homogeneous fat suppression even in regions of magnetic field inhomogeneity." },
        { key: "PhaseEncDir", explanation: "SI phase encoding (value 4) avoids wrap-around from the arms into the cervical imaging volume." },
        { key: "TE", explanation: "Short TE (~40ms) in STIR maintains adequate signal while preserving fat suppression quality." }
      ],
      correctOrderHint: 4
    }
  }),
  makeProtocol({
    id: "cspine_ax_t1_post",
    label: "C-Spine Axial T1 Post-Contrast",
    workflowOrder: 5,
    target: makeTarget(
      { x: 0.03, y: -0.04, z: 0.08 },
      { x: 0.9, y: 0.72, z: 0.5 },
      { rx: -4, ry: 2, rz: 8 },
      makeFullParams(550, 12, 200, 24, 4, 0.4, 90, 256, 192, 2, 150, 4, 0, 1)
    ),
    initial: makeTarget(
      { x: 0.18, y: 0.11, z: -0.07 },
      { x: 0.65, y: 0.50, z: 0.35 },
      { rx: 3, ry: -4, rz: 2 },
      makeFullParams(780, 20, 240, 18, 5, 1.0, 70, 192, 160, 1, 200, 3, 0, 1)
    ),
    tolerances: { center: 0.22, size: 0.20, rotation: 16, param: 0.22 },
    parameterSpecs: CSPINE_SPECS,
    clinicalNotes: [
      "Post-contrast T1 axial highlights enhancing lesions, infections, and post-operative changes.",
      "CHESS fat suppression improves conspicuity of gadolinium enhancement against vertebral marrow."
    ],
    teaching: {
      purpose: "Identify enhancing pathology such as tumors, infections, or inflammatory processes after contrast administration.",
      planningHint: "Match axial T2 slice positions for direct comparison. CHESS fat suppression makes gadolinium enhancement more visible.",
      planningChecklist: [
        "Slice positions match pre-contrast axial T2 for comparison",
        "CHESS fat suppression enabled for enhancement conspicuity",
        "Scan acquired promptly after contrast injection for optimal enhancement"
      ],
      parameterHighlights: [
        { key: "TR", explanation: "Short TR (550ms) provides T1 weighting where gadolinium-enhanced tissues appear bright." },
        { key: "FatSuppression", explanation: "CHESS (value 1) selectively suppresses fat signal so enhancing lesions stand out against dark background." },
        { key: "FOV", explanation: "200mm FOV matches the axial T2 for direct pre/post comparison of cervical anatomy." }
      ],
      correctOrderHint: 5
    }
  })
];
