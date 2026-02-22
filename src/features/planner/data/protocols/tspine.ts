import { ProtocolConfig } from "@/features/planner/types/planner";
import { makeParams, makeProtocol, makeTarget } from "@/features/planner/data/protocols/helpers";

export const TSPINE_PROTOCOLS: ProtocolConfig[] = [
  makeProtocol({
    id: "tspine_sag_t2",
    label: "T-Spine Sagittal T2",
    target: makeTarget(
      { x: 0.0, y: -0.08, z: 0.0 },
      { x: 0.50, y: 1.00, z: 0.80 },
      { rx: 6, ry: 0, rz: 0 },
      makeParams(3800, 100, 320, 18, 3, 0.3)
    ),
    initial: makeTarget(
      { x: 0.16, y: 0.10, z: 0.25 },
      { x: 0.35, y: 0.72, z: 0.55 },
      { rx: -4, ry: -5, rz: 6 },
      makeParams(2800, 72, 360, 14, 4, 1.0)
    ),
    tolerances: { center: 0.26, size: 0.24, rotation: 18, param: 0.22 },
    clinicalNotes: [
      "Sagittal slab must cover the full thoracic canal from T1 through T12-L1 junction.",
      "Larger FOV (300-350mm) needed to span the thoracic kyphosis curvature."
    ]
  })
];
