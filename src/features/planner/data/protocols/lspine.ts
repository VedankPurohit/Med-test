import { ProtocolConfig } from "@/features/planner/types/planner";
import { DEFAULT_PARAMETER_SPECS, makeParams, makeProtocol, makeTarget } from "@/features/planner/data/protocols/helpers";

const STIR_SPECS = [
  ...DEFAULT_PARAMETER_SPECS,
  { key: "TI", label: "TI", unit: "ms", min: 0, step: 1, weight: 1 }
];

export const LSPINE_PROTOCOLS: ProtocolConfig[] = [
  makeProtocol({
    id: "lspine_sag_t2",
    label: "L-Spine Sagittal T2",
    target: makeTarget(
      { x: 0.0, y: -0.08, z: 0.0 },
      { x: 0.50, y: 0.90, z: 0.70 },
      { rx: 8, ry: 0, rz: 0 },
      makeParams(3500, 100, 280, 15, 4, 0.4)
    ),
    initial: makeTarget(
      { x: 0.16, y: 0.12, z: 0.27 },
      { x: 0.35, y: 0.62, z: 0.48 },
      { rx: -5, ry: -6, rz: 7 },
      makeParams(2500, 72, 320, 12, 5, 1.2)
    ),
    tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 },
    clinicalNotes: [
      "Center on L3-L4 level covering T12-L1 through S1 for complete lumbar assessment.",
      "Midline sagittal orientation should track the lumbar lordosis curvature."
    ]
  }),
  makeProtocol({
    id: "lspine_sag_t1",
    label: "L-Spine Sagittal T1",
    target: makeTarget(
      { x: 0.0, y: -0.08, z: 0.0 },
      { x: 0.50, y: 0.90, z: 0.70 },
      { rx: 8, ry: 0, rz: 0 },
      makeParams(550, 12, 280, 15, 4, 0.4)
    ),
    initial: makeTarget(
      { x: -0.14, y: 0.10, z: 0.25 },
      { x: 0.35, y: 0.64, z: 0.50 },
      { rx: -4, ry: 5, rz: -6 },
      makeParams(780, 20, 320, 12, 5, 1.0)
    ),
    tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 },
    clinicalNotes: [
      "T1 sagittal coverage should match T2 sagittal for marrow signal comparison.",
      "Short TR (< 700ms) essential for vertebral body marrow characterization."
    ]
  }),
  makeProtocol({
    id: "lspine_ax_t2",
    label: "L-Spine Axial T2",
    target: makeTarget(
      { x: 0.0, y: -0.12, z: 0.0 },
      { x: 0.68, y: 0.50, z: 0.40 },
      { rx: -8, ry: 0, rz: 0 },
      makeParams(3800, 100, 220, 20, 4, 0.4)
    ),
    initial: makeTarget(
      { x: -0.18, y: 0.08, z: 0.25 },
      { x: 0.46, y: 0.34, z: 0.28 },
      { rx: 6, ry: -5, rz: -8 },
      makeParams(2600, 72, 260, 14, 5, 1.2)
    ),
    tolerances: { center: 0.22, size: 0.20, rotation: 16, param: 0.22 },
    clinicalNotes: [
      "Prescribe axial groups angled through each disc level from L3-L4 to L5-S1.",
      "Angle slices parallel to each disc space for optimal nerve root visualization."
    ]
  }),
  makeProtocol({
    id: "lspine_sag_stir",
    label: "L-Spine Sagittal STIR",
    target: makeTarget(
      { x: 0.0, y: -0.08, z: 0.0 },
      { x: 0.50, y: 0.90, z: 0.70 },
      { rx: 8, ry: 0, rz: 0 },
      { ...makeParams(4500, 60, 280, 15, 4, 0.4), TI: 160 }
    ),
    initial: makeTarget(
      { x: 0.14, y: 0.10, z: 0.25 },
      { x: 0.35, y: 0.64, z: 0.50 },
      { rx: -4, ry: -5, rz: 6 },
      { ...makeParams(3200, 45, 320, 12, 5, 1.0), TI: 120 }
    ),
    tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 },
    parameterSpecs: STIR_SPECS,
    clinicalNotes: [
      "STIR sagittal mirrors T2 sagittal geometry for edema-sensitive marrow evaluation.",
      "TI ~160ms nulls fat signal at 1.5T; adjust TI for 3T if needed."
    ]
  }),
  makeProtocol({
    id: "lspine_cor_stir",
    label: "L-Spine Coronal STIR",
    target: makeTarget(
      { x: 0.0, y: -0.10, z: 0.0 },
      { x: 0.75, y: 0.45, z: 0.80 },
      { rx: 0, ry: 0, rz: 0 },
      { ...makeParams(4500, 60, 300, 18, 4, 0.4), TI: 160 }
    ),
    initial: makeTarget(
      { x: -0.16, y: 0.08, z: 0.25 },
      { x: 0.52, y: 0.32, z: 0.55 },
      { rx: 7, ry: -5, rz: -6 },
      { ...makeParams(3200, 45, 340, 14, 5, 1.0), TI: 120 }
    ),
    tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 },
    parameterSpecs: STIR_SPECS,
    clinicalNotes: [
      "Coronal STIR covers paraspinal soft tissues and sacroiliac joints bilaterally.",
      "Useful for detecting bone marrow edema, sacroiliitis, and paraspinal pathology."
    ]
  })
];
