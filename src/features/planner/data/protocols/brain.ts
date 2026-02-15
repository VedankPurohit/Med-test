import { ProtocolConfig } from "@/features/planner/types/planner";
import { makeParams, makeProtocol, makeTarget } from "@/features/planner/data/protocols/helpers";

export const BRAIN_PROTOCOLS: ProtocolConfig[] = [
  makeProtocol({
    id: "brain_t1_sagittal",
    label: "Brain T1 Sagittal",
    target: makeTarget(
      { x: 0.0, y: -0.06, z: 0.08 },
      { x: 0.74, y: 1.0, z: 0.6 },
      { rx: 14, ry: 0, rz: -2 },
      makeParams(600, 14, 230, 22, 4, 0.4)
    ),
    initial: makeTarget(
      { x: 0.2, y: 0.18, z: -0.2 },
      { x: 0.52, y: 0.7, z: 0.38 },
      { rx: -7, ry: -5, rz: 7 },
      makeParams(850, 24, 250, 16, 5, 1.2)
    ),
    tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 },
    clinicalNotes: [
      "Keep midline orientation through corpus callosum and brainstem.",
      "Cover from frontal sinus margin through occipital pole."
    ]
  }),
  makeProtocol({
    id: "brain_t2_axial",
    label: "Brain T2 Axial",
    target: makeTarget(
      { x: 0.03, y: -0.05, z: 0.12 },
      { x: 0.94, y: 0.76, z: 0.56 },
      { rx: -6, ry: 2, rz: 9 },
      makeParams(4800, 100, 220, 24, 5, 0.5)
    ),
    initial: makeTarget(
      { x: -0.24, y: 0.17, z: 0.34 },
      { x: 0.62, y: 0.56, z: 0.42 },
      { rx: 8, ry: -5, rz: -8 },
      makeParams(3000, 70, 240, 18, 4, 1.2)
    ),
    tolerances: { center: 0.22, size: 0.21, rotation: 16, param: 0.22 },
    clinicalNotes: [
      "Prescribe parallel to AC-PC region for supratentorial coverage.",
      "Ensure full cortical and ventricular coverage without excessive neck inclusion."
    ]
  }),
  makeProtocol({
    id: "brain_t1_axial_se",
    label: "Brain T1 Axial SE",
    target: makeTarget(
      { x: 0.03, y: -0.05, z: 0.11 },
      { x: 0.94, y: 0.76, z: 0.56 },
      { rx: -5, ry: 2, rz: 9 },
      makeParams(620, 15, 220, 24, 5, 0.5)
    ),
    initial: makeTarget(
      { x: -0.2, y: 0.14, z: 0.32 },
      { x: 0.65, y: 0.56, z: 0.42 },
      { rx: 7, ry: -6, rz: -10 },
      makeParams(900, 25, 250, 18, 4, 1.0)
    ),
    tolerances: { center: 0.22, size: 0.2, rotation: 16, param: 0.2 },
    clinicalNotes: [
      "Maintain standard axial plane alignment for pre-contrast T1 comparisons.",
      "Avoid inferior neck inclusion while preserving full supratentorial coverage."
    ]
  }),
  makeProtocol({
    id: "brain_t2_flair_axial",
    label: "Brain T2 FLAIR Axial",
    target: makeTarget(
      { x: 0.03, y: -0.04, z: 0.11 },
      { x: 0.95, y: 0.78, z: 0.58 },
      { rx: -5, ry: 2, rz: 9 },
      makeParams(9000, 120, 230, 26, 5, 0.5)
    ),
    initial: makeTarget(
      { x: -0.18, y: 0.15, z: 0.29 },
      { x: 0.68, y: 0.57, z: 0.44 },
      { rx: 6, ry: -6, rz: -9 },
      makeParams(7000, 90, 250, 20, 4, 1.0)
    ),
    tolerances: { center: 0.21, size: 0.2, rotation: 15, param: 0.2 },
    clinicalNotes: [
      "FLAIR axial slab usually mirrors T2 axial plane with robust supratentorial coverage.",
      "TI is not modeled yet; the trainer currently scores TR, TE, FOV, and slice geometry only."
    ]
  }),
  makeProtocol({
    id: "brain_dwi_axial",
    label: "Brain DWI Axial",
    target: makeTarget(
      { x: 0.03, y: -0.04, z: 0.1 },
      { x: 0.94, y: 0.78, z: 0.55 },
      { rx: -5, ry: 1, rz: 8 },
      makeParams(3200, 85, 230, 26, 5, 0.0)
    ),
    initial: makeTarget(
      { x: -0.2, y: 0.17, z: 0.31 },
      { x: 0.65, y: 0.56, z: 0.4 },
      { rx: 7, ry: -5, rz: -9 },
      makeParams(2500, 70, 250, 18, 4, 1.0)
    ),
    tolerances: { center: 0.2, size: 0.2, rotation: 15, param: 0.2 },
    clinicalNotes: [
      "DWI axial should avoid inferior non-brain inclusion while covering whole brain.",
      "Keep slab aligned with routine axial brain plane for diffusion comparability."
    ]
  }),
  makeProtocol({
    id: "brain_swi_axial",
    label: "Brain SWI Axial",
    target: makeTarget(
      { x: 0.04, y: -0.03, z: 0.1 },
      { x: 0.95, y: 0.8, z: 0.6 },
      { rx: -4, ry: 2, rz: 8 },
      makeParams(45, 28, 220, 48, 2, 0.0)
    ),
    initial: makeTarget(
      { x: -0.17, y: 0.15, z: 0.27 },
      { x: 0.7, y: 0.6, z: 0.43 },
      { rx: 5, ry: -6, rz: -8 },
      makeParams(70, 18, 240, 30, 3, 0.8)
    ),
    tolerances: { center: 0.22, size: 0.2, rotation: 15, param: 0.2 },
    clinicalNotes: [
      "Thin contiguous slices are preferred for venous and microhemorrhage conspicuity.",
      "Keep slab parallel to routine axial brain acquisition for correlation."
    ]
  }),
  makeProtocol({
    id: "brain_t1_se_coronal",
    label: "Brain T1 SE Coronal",
    target: makeTarget(
      { x: 0.02, y: -0.02, z: 0.07 },
      { x: 0.84, y: 0.68, z: 0.75 },
      { rx: -12, ry: -4, rz: 2 },
      makeParams(600, 12, 220, 22, 4, 0.4)
    ),
    initial: makeTarget(
      { x: -0.15, y: 0.11, z: -0.24 },
      { x: 0.66, y: 0.6, z: 0.44 },
      { rx: 9, ry: 7, rz: 11 },
      makeParams(850, 20, 250, 18, 5, 1.0)
    ),
    tolerances: { center: 0.23, size: 0.2, rotation: 17, param: 0.22 },
    clinicalNotes: [
      "Coronal SE T1 should center through temporal horns and mesial temporal structures.",
      "Avoid strong obliquity unless protocol specifically requests it."
    ]
  }),
  makeProtocol({
    id: "brain_t2_coronal",
    label: "Brain T2 Coronal",
    target: makeTarget(
      { x: 0.02, y: -0.02, z: 0.07 },
      { x: 0.86, y: 0.7, z: 0.76 },
      { rx: -11, ry: -4, rz: 2 },
      makeParams(4200, 100, 220, 24, 4, 0.4)
    ),
    initial: makeTarget(
      { x: -0.16, y: 0.1, z: -0.22 },
      { x: 0.64, y: 0.58, z: 0.44 },
      { rx: 8, ry: 7, rz: 10 },
      makeParams(3200, 78, 250, 18, 5, 1.0)
    ),
    tolerances: { center: 0.23, size: 0.2, rotation: 17, param: 0.22 },
    clinicalNotes: [
      "Coronal T2 should include temporal lobes through vertex with symmetric coverage.",
      "Tilt only as needed to maintain consistent bilateral anatomy coverage."
    ]
  }),
  makeProtocol({
    id: "brain_t2_sagittal",
    label: "Brain T2 Sagittal",
    target: makeTarget(
      { x: 0.0, y: -0.05, z: 0.08 },
      { x: 0.72, y: 0.98, z: 0.62 },
      { rx: 14, ry: 1, rz: -2 },
      makeParams(4200, 95, 240, 24, 4, 0.5)
    ),
    initial: makeTarget(
      { x: 0.18, y: 0.18, z: -0.2 },
      { x: 0.52, y: 0.7, z: 0.35 },
      { rx: -6, ry: -6, rz: 8 },
      makeParams(3200, 70, 260, 16, 5, 1.2)
    ),
    tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 },
    clinicalNotes: [
      "Midline sagittal orientation should track corpus callosum and posterior fossa profile.",
      "Ensure anterior frontal pole to occipital pole coverage."
    ]
  }),
  makeProtocol({
    id: "brain_t1_axial_post",
    label: "Brain T1 Axial Post-Contrast",
    target: makeTarget(
      { x: 0.03, y: -0.05, z: 0.11 },
      { x: 0.94, y: 0.76, z: 0.56 },
      { rx: -5, ry: 2, rz: 9 },
      makeParams(620, 15, 220, 24, 5, 0.5)
    ),
    initial: makeTarget(
      { x: -0.2, y: 0.15, z: 0.3 },
      { x: 0.66, y: 0.57, z: 0.43 },
      { rx: 7, ry: -6, rz: -10 },
      makeParams(920, 24, 250, 18, 4, 1.0)
    ),
    tolerances: { center: 0.22, size: 0.2, rotation: 16, param: 0.2 },
    clinicalNotes: [
      "Planning geometry should mirror pre-contrast axial T1 for interval comparison.",
      "Maintain full intracranial coverage in post-contrast series."
    ]
  })
];
