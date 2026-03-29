import { ProtocolConfig } from "@/features/planner/types/planner";
import { EXTENDED_PARAMETER_SPECS, makeFullParams, makeProtocol, makeTarget } from "@/features/planner/data/protocols/helpers";

const TSPINE_SPECS = EXTENDED_PARAMETER_SPECS;

// PhaseEncDir encoding: 0=AP, 1=PA, 2=RL, 3=LR, 4=SI, 5=IS
// FatSuppression encoding: 0=None, 1=CHESS, 2=STIR, 3=SPAIR, 4=Dixon

export const TSPINE_PROTOCOLS: ProtocolConfig[] = [
  makeProtocol({
    id: "tspine_sag_t2",
    label: "T-Spine Sagittal T2",
    workflowOrder: 1,
    target: makeTarget(
      { x: 0.0, y: -0.08, z: 0.0 },
      { x: 0.50, y: 1.00, z: 0.80 },
      { rx: 6, ry: 0, rz: 0 },
      makeFullParams(3800, 100, 320, 18, 3, 0.3, 150, 384, 256, 2, 150, 17, 0, 0)
    ),
    initial: makeTarget(
      { x: 0.16, y: 0.10, z: 0.25 },
      { x: 0.35, y: 0.72, z: 0.55 },
      { rx: -4, ry: -5, rz: 6 },
      makeFullParams(2800, 72, 360, 14, 4, 1.0, 120, 256, 192, 1, 200, 12, 0, 0)
    ),
    tolerances: { center: 0.26, size: 0.24, rotation: 18, param: 0.22 },
    parameterSpecs: TSPINE_SPECS,
    clinicalNotes: [
      "Sagittal slab must cover the full thoracic canal from T1 through T12-L1 junction.",
      "Larger FOV (300-350mm) needed to span the thoracic kyphosis curvature."
    ],
    teaching: {
      purpose: "Evaluate thoracic cord compression, disc herniations, and demyelinating lesions through T2-weighted sagittal imaging.",
      planningHint: "Center the sagittal slab on the midline using the axial localizer. Align to follow the thoracic kyphosis on the sagittal scout.",
      planningChecklist: [
        "Midline slab covering full thoracic canal from T1 to T12-L1",
        "Slices aligned to follow the thoracic kyphosis curvature",
        "FOV large enough (320mm) to capture the full thoracic spine length"
      ],
      parameterHighlights: [
        { key: "TR", explanation: "Long TR (3800ms) allows full T2 relaxation for bright CSF that outlines the thoracic cord." },
        { key: "FOV", explanation: "320mm FOV is needed to cover the long thoracic spine from T1 to T12 without aliasing." },
        { key: "ETL", explanation: "ETL of 17 enables efficient acquisition over the large thoracic coverage area." }
      ],
      correctOrderHint: 1
    }
  }),
  makeProtocol({
    id: "tspine_sag_t1",
    label: "T-Spine Sagittal T1",
    workflowOrder: 2,
    target: makeTarget(
      { x: 0.0, y: -0.08, z: 0.0 },
      { x: 0.50, y: 1.00, z: 0.80 },
      { rx: 6, ry: 0, rz: 0 },
      makeFullParams(550, 12, 320, 13, 3, 0.3, 90, 256, 192, 2, 150, 4, 0, 0)
    ),
    initial: makeTarget(
      { x: -0.14, y: 0.10, z: 0.22 },
      { x: 0.35, y: 0.72, z: 0.55 },
      { rx: -3, ry: 4, rz: -5 },
      makeFullParams(780, 20, 360, 10, 4, 1.0, 70, 192, 160, 1, 200, 3, 0, 0)
    ),
    tolerances: { center: 0.26, size: 0.24, rotation: 18, param: 0.22 },
    parameterSpecs: TSPINE_SPECS,
    clinicalNotes: [
      "T1 sagittal should mirror T2 sagittal coverage for marrow signal comparison.",
      "Short TR essential for detecting vertebral body marrow replacement lesions."
    ],
    teaching: {
      purpose: "Provide T1-weighted marrow evaluation and anatomical baseline for the thoracic spine.",
      planningHint: "Copy the sagittal T2 geometry exactly. Short TR produces T1 contrast where normal marrow is bright and pathology appears dark.",
      planningChecklist: [
        "Geometry matches sagittal T2 prescription for direct comparison",
        "Short TR confirmed for proper T1 marrow contrast",
        "Full T1 through T12-L1 coverage maintained"
      ],
      parameterHighlights: [
        { key: "TR", explanation: "Short TR (550ms) creates T1 weighting — normal fatty marrow appears bright, while infiltrative pathology appears dark." },
        { key: "TE", explanation: "Minimum TE (~12ms) preserves pure T1 contrast without T2 contamination." },
        { key: "FlipAngle", explanation: "90-degree flip angle maximizes T1 contrast in conventional spin echo sequences." }
      ],
      correctOrderHint: 2
    }
  }),
  makeProtocol({
    id: "tspine_ax_t2",
    label: "T-Spine Axial T2",
    workflowOrder: 3,
    target: makeTarget(
      { x: 0.03, y: -0.04, z: 0.02 },
      { x: 0.88, y: 0.70, z: 0.48 },
      { rx: -4, ry: 2, rz: 8 },
      makeFullParams(4500, 100, 200, 20, 4, 0.4, 150, 320, 256, 2, 150, 15, 0, 0)
    ),
    initial: makeTarget(
      { x: 0.18, y: 0.11, z: -0.13 },
      { x: 0.62, y: 0.48, z: 0.32 },
      { rx: 3, ry: -4, rz: 2 },
      makeFullParams(2800, 68, 240, 14, 5, 1.0, 120, 256, 192, 1, 200, 10, 0, 0)
    ),
    tolerances: { center: 0.22, size: 0.20, rotation: 16, param: 0.22 },
    parameterSpecs: TSPINE_SPECS,
    clinicalNotes: [
      "Prescribe axial slices perpendicular to the thoracic cord at levels of clinical interest.",
      "Cover symptomatic levels identified on sagittal sequences with disc-level angulation."
    ],
    teaching: {
      purpose: "Visualize disc-cord relationship and foraminal pathology in cross-section at symptomatic thoracic levels.",
      planningHint: "Angle axial slices perpendicular to the cord using the sagittal T2 as a guide. Focus on levels of abnormality seen on sagittal images.",
      planningChecklist: [
        "Slices angled perpendicular to the thoracic cord at each target level",
        "Coverage focused on symptomatic levels identified on sagittal images",
        "Small FOV (200mm) for adequate in-plane resolution of the thoracic canal"
      ],
      parameterHighlights: [
        { key: "FOV", explanation: "200mm FOV provides high resolution for the narrow thoracic canal and small thoracic discs." },
        { key: "SliceThickness", explanation: "4mm axial slices balance resolution and signal-to-noise for thoracic cross-sections." },
        { key: "TR", explanation: "Long TR (4500ms) with T2 weighting highlights CSF and delineates the cord-disc interface." }
      ],
      correctOrderHint: 3
    }
  })
];
