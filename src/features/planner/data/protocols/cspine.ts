import { ProtocolConfig } from "@/features/planner/types/planner";
import { makeParams, makeProtocol, makeTarget } from "@/features/planner/data/protocols/helpers";

export const CSPINE_PROTOCOLS: ProtocolConfig[] = [
  makeProtocol({
    id: "cspine_sag_t2",
    label: "C-Spine Sagittal T2",
    target: makeTarget(
      { x: 0.0, y: -0.08, z: 0.0 },
      { x: 0.50, y: 0.85, z: 0.72 },
      { rx: 10, ry: 0, rz: 0 },
      makeParams(3500, 100, 260, 15, 3, 0.3)
    ),
    initial: makeTarget(
      { x: 0.18, y: 0.15, z: -0.25 },
      { x: 0.35, y: 0.58, z: 0.48 },
      { rx: -5, ry: -6, rz: 7 },
      makeParams(2500, 70, 300, 12, 4, 1.0)
    ),
    tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 },
    clinicalNotes: [
      "Center sagittal slab on midline through cervical spinal canal from skull base to C7-T1.",
      "Align slab parallel to cervical lordosis for optimal cord visualization."
    ]
  }),
  makeProtocol({
    id: "cspine_sag_t1",
    label: "C-Spine Sagittal T1",
    target: makeTarget(
      { x: 0.0, y: -0.08, z: 0.0 },
      { x: 0.50, y: 0.85, z: 0.72 },
      { rx: 10, ry: 0, rz: 0 },
      makeParams(550, 12, 260, 15, 3, 0.3)
    ),
    initial: makeTarget(
      { x: -0.15, y: 0.12, z: -0.22 },
      { x: 0.35, y: 0.60, z: 0.50 },
      { rx: -4, ry: 5, rz: -6 },
      makeParams(780, 20, 290, 12, 4, 1.0)
    ),
    tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 },
    clinicalNotes: [
      "T1 sagittal should mirror T2 sagittal coverage for pre/post-contrast comparison.",
      "Short TR (< 700ms) essential for proper T1 weighting of vertebral marrow."
    ]
  }),
  makeProtocol({
    id: "cspine_ax_t2",
    label: "C-Spine Axial T2",
    target: makeTarget(
      { x: 0.0, y: -0.12, z: -0.02 },
      { x: 0.65, y: 0.52, z: 0.35 },
      { rx: -5, ry: 0, rz: 0 },
      makeParams(3800, 95, 200, 20, 3, 0.3)
    ),
    initial: makeTarget(
      { x: 0.15, y: 0.10, z: -0.28 },
      { x: 0.45, y: 0.36, z: 0.24 },
      { rx: 8, ry: -5, rz: -7 },
      makeParams(2600, 68, 240, 14, 4, 1.0)
    ),
    tolerances: { center: 0.22, size: 0.20, rotation: 16, param: 0.22 },
    clinicalNotes: [
      "Prescribe axial slices perpendicular to the cervical cord at each disc level.",
      "Cover C3-C4 through C6-C7 disc levels; angle each group to match local cord axis."
    ]
  })
];
