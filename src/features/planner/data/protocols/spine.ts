import { ProtocolConfig } from "@/features/planner/types/planner";
import { makeParams, makeProtocol, makeTarget } from "@/features/planner/data/protocols/helpers";

export const SPINE_PROTOCOLS: ProtocolConfig[] = [
  makeProtocol({
    id: "cspine_sag_t2",
    label: "C-Spine Sagittal T2",
    target: makeTarget(
      { x: -0.12, y: -0.08, z: 0.0 },
      { x: 0.62, y: 1.02, z: 0.58 },
      { rx: 14, ry: 8, rz: -4 },
      makeParams(3000, 105, 260, 15, 3, 0.3)
    ),
    initial: makeTarget(
      { x: 0.2, y: 0.28, z: -0.24 },
      { x: 0.44, y: 0.68, z: 0.34 },
      { rx: -4, ry: -7, rz: 8 },
      makeParams(2300, 70, 300, 12, 4, 1)
    ),
    tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 }
  }),
  makeProtocol({
    id: "lspine_ax_t2",
    label: "L-Spine Axial T2",
    target: makeTarget(
      { x: 0.06, y: -0.14, z: -0.18 },
      { x: 0.76, y: 0.56, z: 0.44 },
      { rx: -8, ry: 3, rz: 12 },
      makeParams(3500, 100, 210, 20, 4, 0.4)
    ),
    initial: makeTarget(
      { x: -0.22, y: 0.1, z: 0.18 },
      { x: 0.48, y: 0.38, z: 0.3 },
      { rx: 10, ry: -6, rz: -10 },
      makeParams(2400, 75, 260, 14, 5, 1.2)
    ),
    tolerances: { center: 0.22, size: 0.2, rotation: 16, param: 0.22 }
  })
];
