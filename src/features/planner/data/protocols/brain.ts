import { ProtocolConfig } from "@/features/planner/types/planner";
import { DEFAULT_PARAMETER_SPECS, makeParams, makeProtocol, makeTarget } from "@/features/planner/data/protocols/helpers";

const STANDARD_SPECS = DEFAULT_PARAMETER_SPECS;
const FLAIR_SPECS = [
  ...DEFAULT_PARAMETER_SPECS,
  { key: "TI", label: "TI", unit: "ms", min: 0, step: 1, weight: 1 }
];
const DWI_SPECS = [
  ...DEFAULT_PARAMETER_SPECS,
  { key: "bValue", label: "b-value", unit: "s/mm2", min: 0, step: 50, integer: true, weight: 1 }
];

export const BRAIN_PROTOCOLS: ProtocolConfig[] = [
  makeProtocol({
    id: "brain_t1_sagittal",
    label: "T1 Sagittal",
    workflowOrder: 1,
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
    parameterSpecs: STANDARD_SPECS,
    teaching: {
      purpose: "Establish a reliable midline reference and full head coverage before the axial sequences.",
      planningHint: "Center the slab on the brain midline and keep the sagittal plane tracking the corpus callosum and brainstem.",
      planningChecklist: [
        "Cover frontal pole through occipital pole.",
        "Keep the slab centered near isocenter.",
        "Avoid unnecessary obliquity."
      ],
      parameterHighlights: [
        { key: "TR", explanation: "Use a short TR so the sequence keeps T1 weighting." },
        { key: "TE", explanation: "Keep TE short to avoid drifting toward T2-style contrast." },
        { key: "FOV", explanation: "FOV must include the whole head profile without clipping." }
      ]
    },
    clinicalNotes: [
      "Keep midline orientation through corpus callosum and brainstem.",
      "Cover from frontal sinus margin through occipital pole."
    ]
  }),
  makeProtocol({
    id: "brain_t2_axial",
    label: "T2 Axial",
    workflowOrder: 2,
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
    acceptedTargets: [
      makeTarget(
        { x: 0.01, y: -0.06, z: 0.13 },
        { x: 0.93, y: 0.75, z: 0.55 },
        { rx: -7, ry: 2, rz: 8 },
        makeParams(4800, 100, 220, 24, 5, 0.5)
      )
    ],
    tolerances: { center: 0.22, size: 0.21, rotation: 16, param: 0.22 },
    parameterSpecs: STANDARD_SPECS,
    teaching: {
      purpose: "Demonstrate fluid-sensitive whole-brain coverage for edema, mass effect, and routine pathology review.",
      planningHint: "Plan parallel to the AC-PC region and cover vertex through posterior fossa without dropping into the neck.",
      planningChecklist: [
        "Keep the routine axial brain plane.",
        "Cover cortex, ventricles, and posterior fossa.",
        "Stay centered instead of drifting inferiorly."
      ],
      parameterHighlights: [
        { key: "TR", explanation: "Long TR preserves T2 contrast." },
        { key: "TE", explanation: "Long TE keeps the sequence fluid-sensitive." },
        { key: "Slices", explanation: "Slice count must support full head coverage." }
      ]
    },
    clinicalNotes: [
      "Prescribe parallel to AC-PC region for supratentorial coverage.",
      "Ensure full cortical and ventricular coverage without excessive neck inclusion."
    ]
  }),
  makeProtocol({
    id: "brain_t2_flair_axial",
    label: "FLAIR Axial",
    workflowOrder: 3,
    target: makeTarget(
      { x: 0.03, y: -0.04, z: 0.11 },
      { x: 0.95, y: 0.78, z: 0.58 },
      { rx: -5, ry: 2, rz: 9 },
      { ...makeParams(9000, 120, 230, 26, 5, 0.5), TI: 2500 }
    ),
    initial: makeTarget(
      { x: -0.18, y: 0.15, z: 0.29 },
      { x: 0.68, y: 0.57, z: 0.44 },
      { rx: 6, ry: -6, rz: -9 },
      { ...makeParams(7000, 90, 250, 20, 4, 1.0), TI: 1800 }
    ),
    tolerances: { center: 0.21, size: 0.2, rotation: 15, param: 0.2 },
    parameterSpecs: FLAIR_SPECS,
    teaching: {
      purpose: "Suppress CSF while preserving lesion conspicuity for routine brain review.",
      planningHint: "Mirror the T2 axial plane so lesion comparison stays consistent across sequences.",
      planningChecklist: [
        "Use the same whole-brain coverage strategy as T2 axial.",
        "Keep the routine axial orientation.",
        "Do not undershoot superior cortex or posterior fossa."
      ],
      parameterHighlights: [
        { key: "TR", explanation: "FLAIR still needs a long TR for T2-style contrast." },
        { key: "TE", explanation: "A long TE keeps fluid-sensitive signal behavior." },
        { key: "TI", explanation: "TI is the teaching-critical parameter because it suppresses CSF." }
      ]
    },
    clinicalNotes: [
      "FLAIR axial slab usually mirrors T2 axial plane with robust supratentorial coverage.",
      "This protocol includes TI scoring in addition to core geometric parameters."
    ]
  }),
  makeProtocol({
    id: "brain_dwi_axial",
    label: "DWI",
    workflowOrder: 4,
    target: makeTarget(
      { x: 0.03, y: -0.04, z: 0.1 },
      { x: 0.94, y: 0.78, z: 0.55 },
      { rx: -5, ry: 1, rz: 8 },
      { ...makeParams(3200, 85, 230, 26, 5, 0.0), bValue: 1000 }
    ),
    initial: makeTarget(
      { x: -0.2, y: 0.17, z: 0.31 },
      { x: 0.65, y: 0.56, z: 0.4 },
      { rx: 7, ry: -5, rz: -9 },
      { ...makeParams(2500, 70, 250, 18, 4, 1.0), bValue: 800 }
    ),
    tolerances: { center: 0.2, size: 0.2, rotation: 15, param: 0.2 },
    parameterSpecs: DWI_SPECS,
    teaching: {
      purpose: "Evaluate diffusion restriction for acute infarct and other high-priority pathology.",
      planningHint: "Keep the slab aligned with the routine axial brain plane and avoid unnecessary inferior coverage that increases distortion.",
      planningChecklist: [
        "Cover the whole brain with minimal neck inclusion.",
        "Keep slice gap very small.",
        "Match the routine axial orientation for comparison."
      ],
      parameterHighlights: [
        { key: "TE", explanation: "TE is often constrained but still affects diffusion image quality." },
        { key: "SliceGap", explanation: "Small gap reduces the chance of missing focal restriction between slices." },
        { key: "bValue", explanation: "b-value is the core diffusion teaching parameter in this sequence." }
      ]
    },
    clinicalNotes: [
      "DWI axial should avoid inferior non-brain inclusion while covering whole brain.",
      "Keep slab aligned with routine axial brain plane for diffusion comparability."
    ]
  })
];
