import { ProtocolConfig } from "@/features/planner/types/planner";
import { EXTENDED_PARAMETER_SPECS, makeFullParams, makeProtocol, makeTarget } from "@/features/planner/data/protocols/helpers";

const LSPINE_SPECS = EXTENDED_PARAMETER_SPECS;
const LSPINE_STIR_SPECS = [
  ...EXTENDED_PARAMETER_SPECS,
  { key: "TI", label: "TI", unit: "ms", min: 0, step: 1, weight: 1 }
];

// PhaseEncDir encoding: 0=AP, 1=PA, 2=RL, 3=LR, 4=SI, 5=IS
// FatSuppression encoding: 0=None, 1=CHESS, 2=STIR, 3=SPAIR, 4=Dixon

export const LSPINE_PROTOCOLS: ProtocolConfig[] = [
  makeProtocol({
    id: "lspine_sag_t2",
    label: "L-Spine Sagittal T2",
    workflowOrder: 1,
    target: makeTarget(
      { x: 0.0, y: -0.08, z: 0.0 },
      { x: 0.50, y: 0.90, z: 0.70 },
      { rx: 8, ry: 0, rz: 0 },
      makeFullParams(3800, 100, 320, 15, 4, 0.4, 150, 384, 256, 2, 150, 17, 0, 0)
    ),
    initial: makeTarget(
      { x: 0.16, y: 0.12, z: 0.27 },
      { x: 0.35, y: 0.62, z: 0.48 },
      { rx: -5, ry: -6, rz: 7 },
      makeFullParams(2500, 72, 360, 12, 5, 1.2, 120, 256, 192, 1, 200, 12, 0, 0)
    ),
    tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 },
    parameterSpecs: LSPINE_SPECS,
    clinicalNotes: [
      "Center on L3-L4 level covering T12-L1 through S1 for complete lumbar assessment.",
      "Midline sagittal orientation should track the lumbar lordosis curvature."
    ],
    teaching: {
      purpose: "Evaluate disc herniations, spinal stenosis, and cord/cauda equina compression through T2-weighted sagittal imaging.",
      planningHint: "Center on L3-L4 using the axial localizer. Align slices along the lumbar lordosis on the sagittal scout for optimal disc visualization.",
      planningChecklist: [
        "Midline slab centered on lumbar canal from T12-L1 through S1",
        "Slices aligned along lumbar lordosis curvature",
        "Lateral coverage includes neural foramina bilaterally"
      ],
      parameterHighlights: [
        { key: "TR", explanation: "Long TR (3800ms) provides full T2 relaxation for bright CSF that outlines the cauda equina and disc margins." },
        { key: "TE", explanation: "TE of 100ms gives strong T2 weighting to highlight disc degeneration and thecal sac compression." },
        { key: "FOV", explanation: "320mm FOV covers the full lumbar spine from T12 through the sacrum without truncation." }
      ],
      correctOrderHint: 1
    }
  }),
  makeProtocol({
    id: "lspine_sag_t1",
    label: "L-Spine Sagittal T1",
    workflowOrder: 2,
    target: makeTarget(
      { x: 0.0, y: -0.08, z: 0.0 },
      { x: 0.50, y: 0.90, z: 0.70 },
      { rx: 8, ry: 0, rz: 0 },
      makeFullParams(550, 12, 320, 15, 4, 0.4, 90, 256, 192, 2, 150, 4, 0, 0)
    ),
    initial: makeTarget(
      { x: -0.14, y: 0.10, z: 0.25 },
      { x: 0.35, y: 0.64, z: 0.50 },
      { rx: -4, ry: 5, rz: -6 },
      makeFullParams(780, 20, 360, 12, 5, 1.0, 70, 192, 160, 1, 200, 3, 0, 0)
    ),
    tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 },
    parameterSpecs: LSPINE_SPECS,
    clinicalNotes: [
      "T1 sagittal coverage should match T2 sagittal for marrow signal comparison.",
      "Short TR (< 700ms) essential for vertebral body marrow characterization."
    ],
    teaching: {
      purpose: "Provide T1-weighted marrow evaluation and anatomical baseline for vertebral body assessment.",
      planningHint: "Copy the sagittal T2 geometry exactly. Short TR produces bright marrow signal where pathology such as metastases appears dark.",
      planningChecklist: [
        "Geometry matches sagittal T2 for direct marrow comparison",
        "Short TR confirmed for proper T1 marrow contrast",
        "Full T12-L1 through S1 coverage maintained"
      ],
      parameterHighlights: [
        { key: "TR", explanation: "Short TR (550ms) creates T1 weighting — normal fatty marrow is bright, infiltrative disease appears dark." },
        { key: "TE", explanation: "Minimum TE (~12ms) avoids T2 contamination for pure T1 contrast." },
        { key: "FlipAngle", explanation: "90-degree flip angle maximizes signal in conventional T1 spin echo sequences." }
      ],
      correctOrderHint: 2
    }
  }),
  makeProtocol({
    id: "lspine_ax_t2",
    label: "L-Spine Axial T2",
    workflowOrder: 3,
    target: makeTarget(
      { x: 0.0, y: -0.12, z: 0.0 },
      { x: 0.68, y: 0.50, z: 0.40 },
      { rx: -8, ry: 0, rz: 0 },
      makeFullParams(4500, 100, 200, 20, 4, 0.4, 150, 320, 256, 2, 150, 15, 0, 0)
    ),
    initial: makeTarget(
      { x: -0.18, y: 0.08, z: 0.25 },
      { x: 0.46, y: 0.34, z: 0.28 },
      { rx: 6, ry: -5, rz: -8 },
      makeFullParams(2600, 72, 260, 14, 5, 1.2, 120, 256, 192, 1, 200, 10, 0, 0)
    ),
    tolerances: { center: 0.22, size: 0.20, rotation: 16, param: 0.22 },
    parameterSpecs: LSPINE_SPECS,
    clinicalNotes: [
      "Prescribe axial groups angled through each disc level from L3-L4 to L5-S1.",
      "Angle slices parallel to each disc space for optimal nerve root visualization."
    ],
    teaching: {
      purpose: "Visualize disc herniations, lateral recess stenosis, and nerve root compression in cross-section.",
      planningHint: "Angle axial slices parallel to each disc space using the sagittal T2 as reference. Cover L3-L4 through L5-S1.",
      planningChecklist: [
        "Slices angled parallel to each disc space at L3-L4 through L5-S1",
        "Small FOV (200mm) for high-resolution nerve root visualization",
        "Sufficient slices to cover all clinically relevant disc levels"
      ],
      parameterHighlights: [
        { key: "FOV", explanation: "200mm FOV provides high in-plane resolution for the lumbar canal and neural foramina." },
        { key: "SliceThickness", explanation: "4mm slices balance detail and signal for cross-sectional disc and nerve root assessment." },
        { key: "ETL", explanation: "ETL of 15 enables efficient T2-weighted acquisition at each disc level." }
      ],
      correctOrderHint: 3
    }
  }),
  makeProtocol({
    id: "lspine_sag_stir",
    label: "L-Spine Sagittal STIR",
    workflowOrder: 4,
    target: makeTarget(
      { x: 0.0, y: -0.08, z: 0.0 },
      { x: 0.50, y: 0.90, z: 0.70 },
      { rx: 8, ry: 0, rz: 0 },
      { ...makeFullParams(3800, 100, 320, 15, 4, 0.4, 150, 384, 256, 2, 150, 17, 0, 2), TI: 160 }
    ),
    initial: makeTarget(
      { x: 0.14, y: 0.10, z: 0.25 },
      { x: 0.35, y: 0.64, z: 0.50 },
      { rx: -4, ry: -5, rz: 6 },
      { ...makeFullParams(2800, 72, 360, 12, 5, 1.0, 120, 256, 192, 1, 200, 12, 0, 2), TI: 120 }
    ),
    tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 },
    parameterSpecs: LSPINE_STIR_SPECS,
    clinicalNotes: [
      "STIR sagittal mirrors T2 sagittal geometry for edema-sensitive marrow evaluation.",
      "TI ~160ms nulls fat signal at 1.5T; adjust TI for 3T if needed."
    ],
    teaching: {
      purpose: "Detect vertebral body marrow edema, compression fractures, and inflammatory spondylitis with fat-suppressed imaging.",
      planningHint: "Copy the sagittal T2 geometry. STIR suppresses fat uniformly, making bone marrow edema bright against a dark background.",
      planningChecklist: [
        "Geometry matches sagittal T2 for direct comparison",
        "STIR fat suppression confirmed with TI appropriate for field strength",
        "Coverage from T12-L1 through S1 for complete marrow evaluation"
      ],
      parameterHighlights: [
        { key: "TI", explanation: "TI of 160ms nulls fat signal at 1.5T — like tuning a radio to cancel out one frequency so you can hear another." },
        { key: "FatSuppression", explanation: "STIR (value 2) provides robust fat suppression even near metal implants and at field inhomogeneity regions." },
        { key: "TR", explanation: "Long TR (3800ms) combined with STIR gives sensitive detection of marrow edema patterns." }
      ],
      correctOrderHint: 4
    }
  }),
  makeProtocol({
    id: "lspine_cor_stir",
    label: "L-Spine Coronal STIR",
    workflowOrder: 5,
    target: makeTarget(
      { x: 0.0, y: -0.10, z: 0.0 },
      { x: 0.75, y: 0.45, z: 0.80 },
      { rx: 0, ry: 0, rz: 0 },
      { ...makeFullParams(3800, 100, 300, 18, 4, 0.4, 150, 384, 256, 2, 150, 17, 0, 2), TI: 160 }
    ),
    initial: makeTarget(
      { x: -0.16, y: 0.08, z: 0.25 },
      { x: 0.52, y: 0.32, z: 0.55 },
      { rx: 7, ry: -5, rz: -6 },
      { ...makeFullParams(2800, 72, 340, 14, 5, 1.0, 120, 256, 192, 1, 200, 12, 0, 2), TI: 120 }
    ),
    tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 },
    parameterSpecs: LSPINE_STIR_SPECS,
    clinicalNotes: [
      "Coronal STIR covers paraspinal soft tissues and sacroiliac joints bilaterally.",
      "Useful for detecting bone marrow edema, sacroiliitis, and paraspinal pathology."
    ],
    teaching: {
      purpose: "Evaluate paraspinal soft tissues, sacroiliac joints, and bilateral nerve roots for edema and inflammation.",
      planningHint: "Plan coronal slices through the lumbar spine and SI joints. STIR highlights edema in muscles, joints, and bone marrow.",
      planningChecklist: [
        "Coronal slab covers paraspinal muscles and sacroiliac joints bilaterally",
        "STIR fat suppression confirmed with appropriate TI",
        "Sufficient AP coverage to include posterior elements and paraspinal tissues"
      ],
      parameterHighlights: [
        { key: "TI", explanation: "TI of 160ms nulls fat at 1.5T, making sacroiliac joint inflammation and marrow edema conspicuous." },
        { key: "FatSuppression", explanation: "STIR (value 2) ensures uniform fat suppression across the wide coronal coverage area." },
        { key: "FOV", explanation: "300mm FOV captures both sacroiliac joints and paraspinal soft tissues in a single coronal slab." },
        { key: "Slices", explanation: "18 slices provide sufficient AP depth to cover from posterior elements through vertebral bodies." }
      ],
      correctOrderHint: 5
    }
  })
];
