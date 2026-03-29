import { ProtocolConfig } from "@/features/planner/types/planner";
import { EXTENDED_PARAMETER_SPECS, makeFullParams, makeProtocol, makeTarget } from "@/features/planner/data/protocols/helpers";

const BRAIN_SPECS = EXTENDED_PARAMETER_SPECS;
const FLAIR_SPECS = [
  ...EXTENDED_PARAMETER_SPECS,
  { key: "TI", label: "TI", unit: "ms", min: 0, step: 1, weight: 1 }
];
const DWI_SPECS = [
  ...EXTENDED_PARAMETER_SPECS,
  { key: "bValue", label: "b-value", unit: "s/mm2", min: 0, step: 50, integer: true, weight: 1 }
];

// PhaseEncDir encoding: 0=AP, 1=PA, 2=RL, 3=LR, 4=SI, 5=IS
// FatSuppression encoding: 0=None, 1=CHESS, 2=STIR, 3=SPAIR, 4=Dixon

export const BRAIN_PROTOCOLS: ProtocolConfig[] = [
  makeProtocol({
    id: "brain_t1_sagittal",
    label: "Brain T1 Sagittal",
    workflowOrder: 1,
    target: makeTarget(
      { x: 0.0, y: -0.06, z: 0.08 },
      { x: 0.74, y: 1.0, z: 0.6 },
      { rx: 14, ry: 0, rz: -2 },
      makeFullParams(600, 14, 230, 22, 4, 0.4, 90, 256, 192, 1, 150, 4, 0, 0)
    ),
    initial: makeTarget(
      { x: 0.2, y: 0.18, z: -0.2 },
      { x: 0.52, y: 0.7, z: 0.38 },
      { rx: -7, ry: -5, rz: 7 },
      makeFullParams(850, 24, 250, 16, 5, 1.2, 70, 192, 160, 2, 200, 3, 0, 0)
    ),
    tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 },
    parameterSpecs: BRAIN_SPECS,
    clinicalNotes: [
      "Keep midline orientation through corpus callosum and brainstem.",
      "Cover from frontal sinus margin through occipital pole."
    ],
    teaching: {
      purpose: "Establish a reliable midline reference for anatomical orientation and structural assessment.",
      planningHint: "Align slices along the inter-hemispheric fissure using the corpus callosum as a guide on the axial localizer.",
      planningChecklist: [
        "Midline aligned to inter-hemispheric fissure",
        "Full AP coverage from frontal to occipital pole",
        "Brainstem and cerebellum included inferiorly"
      ],
      parameterHighlights: [
        { key: "TR", explanation: "Short TR (400-700ms) gives T1 weighting — like a quick camera flash that captures bright fat and dark fluid." },
        { key: "TE", explanation: "Short TE (8-20ms) minimizes T2 effects — listen to the echo quickly before it fades." },
        { key: "FOV", explanation: "230mm covers the full brain width. Too small and anatomy gets cut off, like zooming in too much on a camera." },
        { key: "SliceThickness", explanation: "4mm slices give good detail for midline structures. Thinner = sharper but noisier." }
      ],
      correctOrderHint: 1
    }
  }),
  makeProtocol({
    id: "brain_t2_axial",
    label: "Brain T2 Axial",
    workflowOrder: 2,
    target: makeTarget(
      { x: 0.03, y: -0.05, z: 0.12 },
      { x: 0.94, y: 0.76, z: 0.56 },
      { rx: -6, ry: 2, rz: 9 },
      makeFullParams(4800, 100, 220, 24, 5, 0.5, 150, 320, 256, 2, 150, 15, 0, 0)
    ),
    initial: makeTarget(
      { x: -0.24, y: 0.17, z: 0.34 },
      { x: 0.62, y: 0.56, z: 0.42 },
      { rx: 8, ry: -5, rz: -8 },
      makeFullParams(3000, 70, 240, 18, 4, 1.2, 120, 256, 192, 1, 200, 10, 0, 0)
    ),
    acceptedTargets: [
      makeTarget(
        { x: 0.01, y: -0.06, z: 0.13 },
        { x: 0.93, y: 0.75, z: 0.55 },
        { rx: -7, ry: 2, rz: 8 },
        makeFullParams(4800, 100, 220, 24, 5, 0.5, 150, 320, 256, 2, 150, 15, 0, 0)
      )
    ],
    tolerances: { center: 0.22, size: 0.21, rotation: 16, param: 0.22 },
    parameterSpecs: BRAIN_SPECS,
    clinicalNotes: [
      "Prescribe parallel to AC-PC region for supratentorial coverage.",
      "Ensure full cortical and ventricular coverage without excessive neck inclusion."
    ],
    teaching: {
      purpose: "Detect edema, tumors, inflammation, and demyelination through T2-weighted contrast.",
      planningHint: "Plan slices parallel to the AC-PC line. Cover the entire brain from vertex to foramen magnum.",
      planningChecklist: [
        "Slices parallel to AC-PC line",
        "Full vertex to skull base coverage",
        "Symmetric left-right coverage"
      ],
      parameterHighlights: [
        { key: "TR", explanation: "Long TR (4000-6000ms) allows full tissue relaxation — wait longer between flashes so tissues show their true T2 contrast." },
        { key: "TE", explanation: "Long TE (80-120ms) highlights T2 differences — wait longer to hear the echo, fluid appears bright." },
        { key: "ETL", explanation: "ETL of 15 means collecting 15 echoes per TR, making the scan much faster than conventional spin echo." },
        { key: "NEX", explanation: "NEX=2 averages two acquisitions for better signal — like taking a photo twice and combining for clarity." }
      ],
      correctOrderHint: 2
    }
  }),
  makeProtocol({
    id: "brain_t1_axial_se",
    label: "Brain T1 Axial SE",
    workflowOrder: 3,
    target: makeTarget(
      { x: 0.03, y: -0.05, z: 0.11 },
      { x: 0.94, y: 0.76, z: 0.56 },
      { rx: -5, ry: 2, rz: 9 },
      makeFullParams(620, 15, 220, 24, 5, 0.5, 90, 256, 192, 2, 150, 4, 0, 0)
    ),
    initial: makeTarget(
      { x: -0.2, y: 0.14, z: 0.32 },
      { x: 0.65, y: 0.56, z: 0.42 },
      { rx: 7, ry: -6, rz: -10 },
      makeFullParams(900, 25, 250, 18, 4, 1.0, 70, 192, 160, 1, 200, 3, 0, 0)
    ),
    tolerances: { center: 0.22, size: 0.2, rotation: 16, param: 0.2 },
    parameterSpecs: BRAIN_SPECS,
    clinicalNotes: [
      "Maintain standard axial plane alignment for pre-contrast T1 comparisons.",
      "Avoid inferior neck inclusion while preserving full supratentorial coverage."
    ],
    teaching: {
      purpose: "Provide baseline T1 anatomy for pre-contrast comparison and structural evaluation.",
      planningHint: "Match slice positions to the T2 axial series for direct comparison. Use AC-PC alignment.",
      planningChecklist: [
        "Matches T2 axial slice positions",
        "AC-PC aligned orientation",
        "Complete supratentorial coverage"
      ],
      parameterHighlights: [
        { key: "TR", explanation: "Short TR gives T1 contrast where grey/white matter are easily distinguished." },
        { key: "FlipAngle", explanation: "90° flip angle is standard for spin echo — the RF pulse tips protons fully sideways, like pushing a compass needle horizontal." },
        { key: "MatrixPhase", explanation: "192 phase steps balance resolution and scan time — more steps = sharper image but longer scan." }
      ],
      correctOrderHint: 3
    }
  }),
  makeProtocol({
    id: "brain_t2_flair_axial",
    label: "Brain T2 FLAIR Axial",
    workflowOrder: 4,
    target: makeTarget(
      { x: 0.03, y: -0.04, z: 0.11 },
      { x: 0.95, y: 0.78, z: 0.58 },
      { rx: -5, ry: 2, rz: 9 },
      { ...makeFullParams(9000, 120, 230, 26, 5, 0.5, 150, 320, 224, 1, 140, 13, 0, 0), TI: 2500 }
    ),
    initial: makeTarget(
      { x: -0.18, y: 0.15, z: 0.29 },
      { x: 0.68, y: 0.57, z: 0.44 },
      { rx: 6, ry: -6, rz: -9 },
      { ...makeFullParams(7000, 90, 250, 20, 4, 1.0, 120, 256, 192, 1, 180, 10, 0, 0), TI: 1800 }
    ),
    tolerances: { center: 0.21, size: 0.2, rotation: 15, param: 0.2 },
    parameterSpecs: FLAIR_SPECS,
    clinicalNotes: [
      "FLAIR axial slab usually mirrors T2 axial plane with robust supratentorial coverage.",
      "This protocol includes TI scoring in addition to core geometric parameters."
    ],
    teaching: {
      purpose: "Suppress CSF signal to reveal periventricular and cortical lesions that T2 alone may miss.",
      planningHint: "Mirror T2 axial slice positions. FLAIR is critical for detecting white matter disease near ventricles.",
      planningChecklist: [
        "Matches T2 axial orientation",
        "Periventricular regions fully covered",
        "Extended coverage to include posterior fossa"
      ],
      parameterHighlights: [
        { key: "TI", explanation: "TI of 2500ms nulls CSF signal — like turning off a light, waiting just the right amount of time, then turning it back on to see everything except the fluid." },
        { key: "TR", explanation: "Very long TR (8000-11000ms) is needed for the inversion recovery preparation." },
        { key: "ETL", explanation: "ETL of 13 collects multiple echoes per TR to keep scan time reasonable despite the long TR." }
      ],
      correctOrderHint: 4
    }
  }),
  makeProtocol({
    id: "brain_dwi_axial",
    label: "Brain DWI Axial",
    workflowOrder: 5,
    target: makeTarget(
      { x: 0.03, y: -0.04, z: 0.1 },
      { x: 0.94, y: 0.78, z: 0.55 },
      { rx: -5, ry: 1, rz: 8 },
      { ...makeFullParams(5000, 90, 230, 26, 5, 0.0, 90, 192, 192, 3, 1500, 1, 0, 1), bValue: 1000 }
    ),
    initial: makeTarget(
      { x: -0.2, y: 0.17, z: 0.31 },
      { x: 0.65, y: 0.56, z: 0.4 },
      { rx: 7, ry: -5, rz: -9 },
      { ...makeFullParams(2500, 70, 250, 18, 4, 1.0, 90, 128, 128, 2, 1200, 1, 0, 0), bValue: 800 }
    ),
    tolerances: { center: 0.2, size: 0.2, rotation: 15, param: 0.2 },
    parameterSpecs: DWI_SPECS,
    clinicalNotes: [
      "DWI axial should avoid inferior non-brain inclusion while covering whole brain.",
      "Keep slab aligned with routine axial brain plane for diffusion comparability."
    ],
    teaching: {
      purpose: "Detect acute ischemic stroke and cytotoxic edema by measuring water molecule diffusion.",
      planningHint: "Cover entire brain with no gaps. DWI is the most sensitive sequence for acute stroke — every slice matters.",
      planningChecklist: [
        "Zero gap between slices for complete coverage",
        "Full brain coverage including posterior fossa",
        "Aligned with standard axial orientation"
      ],
      parameterHighlights: [
        { key: "bValue", explanation: "b=1000 s/mm2 is standard for stroke detection. Higher b-value = stronger diffusion weighting." },
        { key: "Bandwidth", explanation: "Very high bandwidth (1500 Hz/px) is needed for EPI readout — like tuning to a wide radio band to capture the fast signal." },
        { key: "FatSuppression", explanation: "CHESS fat suppression removes fat signal that would otherwise create artifacts in EPI sequences." },
        { key: "NEX", explanation: "NEX=3 averages multiple acquisitions to compensate for EPI's inherently noisy signal." }
      ],
      correctOrderHint: 5
    }
  }),
  makeProtocol({
    id: "brain_swi_axial",
    label: "Brain SWI Axial",
    workflowOrder: 6,
    target: makeTarget(
      { x: 0.04, y: -0.03, z: 0.1 },
      { x: 0.95, y: 0.8, z: 0.6 },
      { rx: -4, ry: 2, rz: 8 },
      makeFullParams(45, 28, 220, 48, 2, 0.0, 15, 256, 192, 1, 100, 1, 2, 0)
    ),
    initial: makeTarget(
      { x: -0.17, y: 0.15, z: 0.27 },
      { x: 0.7, y: 0.6, z: 0.43 },
      { rx: 5, ry: -6, rz: -8 },
      makeFullParams(70, 18, 240, 30, 3, 0.8, 10, 192, 160, 1, 130, 1, 2, 0)
    ),
    tolerances: { center: 0.22, size: 0.2, rotation: 15, param: 0.2 },
    parameterSpecs: BRAIN_SPECS,
    clinicalNotes: [
      "Thin contiguous slices are preferred for venous and microhemorrhage conspicuity.",
      "Keep slab parallel to routine axial brain acquisition for correlation."
    ],
    teaching: {
      purpose: "Detect microhemorrhages, calcium deposits, and venous abnormalities using susceptibility differences.",
      planningHint: "Use thin contiguous slices (2mm, no gap) aligned with standard axial plane. SWI needs full brain coverage.",
      planningChecklist: [
        "Thin slices (2mm) with zero gap",
        "Complete brain coverage",
        "Standard axial orientation"
      ],
      parameterHighlights: [
        { key: "FlipAngle", explanation: "Low flip angle (15°) is used in gradient echo — a gentle push instead of a full 90° tilt, optimizing susceptibility contrast." },
        { key: "TR", explanation: "Very short TR (45ms) enables fast gradient echo acquisition for susceptibility imaging." },
        { key: "Bandwidth", explanation: "Lower bandwidth (100 Hz/px) increases SNR but may increase susceptibility artifacts — a deliberate trade-off for SWI." }
      ],
      correctOrderHint: 6
    }
  }),
  makeProtocol({
    id: "brain_t1_se_coronal",
    label: "Brain T1 SE Coronal",
    workflowOrder: 7,
    target: makeTarget(
      { x: 0.02, y: -0.02, z: 0.07 },
      { x: 0.84, y: 0.68, z: 0.75 },
      { rx: -12, ry: -4, rz: 2 },
      makeFullParams(600, 12, 220, 22, 4, 0.4, 90, 256, 192, 1, 150, 4, 2, 0)
    ),
    initial: makeTarget(
      { x: -0.15, y: 0.11, z: -0.24 },
      { x: 0.66, y: 0.6, z: 0.44 },
      { rx: 9, ry: 7, rz: 11 },
      makeFullParams(850, 20, 250, 18, 5, 1.0, 70, 192, 160, 1, 200, 3, 2, 0)
    ),
    tolerances: { center: 0.23, size: 0.2, rotation: 17, param: 0.22 },
    parameterSpecs: BRAIN_SPECS,
    clinicalNotes: [
      "Coronal SE T1 should center through temporal horns and mesial temporal structures.",
      "Avoid strong obliquity unless protocol specifically requests it."
    ],
    teaching: {
      purpose: "Evaluate temporal lobe anatomy, hippocampal structures, and coronal anatomical relationships.",
      planningHint: "Orient perpendicular to the hippocampal axis. Center through temporal horns for mesial temporal evaluation.",
      planningChecklist: [
        "Perpendicular to hippocampal long axis",
        "Temporal lobes fully covered bilaterally",
        "Symmetric left-right coverage"
      ],
      parameterHighlights: [
        { key: "PhaseEncDir", explanation: "RL phase encoding in coronal view moves eye motion artifacts away from the temporal lobes." },
        { key: "SliceThickness", explanation: "4mm slices provide good spatial resolution for hippocampal assessment." }
      ],
      correctOrderHint: 7
    }
  }),
  makeProtocol({
    id: "brain_t2_coronal",
    label: "Brain T2 Coronal",
    workflowOrder: 8,
    target: makeTarget(
      { x: 0.02, y: -0.02, z: 0.07 },
      { x: 0.86, y: 0.7, z: 0.76 },
      { rx: -11, ry: -4, rz: 2 },
      makeFullParams(4200, 100, 220, 24, 4, 0.4, 150, 320, 256, 2, 150, 15, 2, 0)
    ),
    initial: makeTarget(
      { x: -0.16, y: 0.1, z: -0.22 },
      { x: 0.64, y: 0.58, z: 0.44 },
      { rx: 8, ry: 7, rz: 10 },
      makeFullParams(3200, 78, 250, 18, 5, 1.0, 120, 256, 192, 1, 200, 10, 2, 0)
    ),
    tolerances: { center: 0.23, size: 0.2, rotation: 17, param: 0.22 },
    parameterSpecs: BRAIN_SPECS,
    clinicalNotes: [
      "Coronal T2 should include temporal lobes through vertex with symmetric coverage.",
      "Tilt only as needed to maintain consistent bilateral anatomy coverage."
    ],
    teaching: {
      purpose: "Complement coronal T1 for fluid-sensitive evaluation of temporal lobes and posterior fossa.",
      planningHint: "Match coronal T1 slice positions for direct comparison. Include temporal poles to vertex.",
      planningChecklist: [
        "Matches coronal T1 slice positions",
        "Full temporal lobe coverage",
        "Vertex to skull base included"
      ],
      parameterHighlights: [
        { key: "TR", explanation: "Long TR for T2 contrast — tissues relax fully between repetitions, revealing fluid-filled structures." },
        { key: "ETL", explanation: "ETL=15 speeds up acquisition significantly compared to conventional spin echo." }
      ],
      correctOrderHint: 8
    }
  }),
  makeProtocol({
    id: "brain_t2_sagittal",
    label: "Brain T2 Sagittal",
    workflowOrder: 9,
    target: makeTarget(
      { x: 0.0, y: -0.05, z: 0.08 },
      { x: 0.72, y: 0.98, z: 0.62 },
      { rx: 14, ry: 1, rz: -2 },
      makeFullParams(4200, 95, 240, 24, 4, 0.5, 150, 320, 256, 2, 150, 15, 0, 0)
    ),
    initial: makeTarget(
      { x: 0.18, y: 0.18, z: -0.2 },
      { x: 0.52, y: 0.7, z: 0.35 },
      { rx: -6, ry: -6, rz: 8 },
      makeFullParams(3200, 70, 260, 16, 5, 1.2, 120, 256, 192, 1, 200, 10, 0, 0)
    ),
    tolerances: { center: 0.24, size: 0.22, rotation: 18, param: 0.22 },
    parameterSpecs: BRAIN_SPECS,
    clinicalNotes: [
      "Midline sagittal orientation should track corpus callosum and posterior fossa profile.",
      "Ensure anterior frontal pole to occipital pole coverage."
    ],
    teaching: {
      purpose: "Provide T2-weighted sagittal overview for midline pathology and posterior fossa assessment.",
      planningHint: "Align along the inter-hemispheric fissure, matching T1 sagittal orientation for comparison.",
      planningChecklist: [
        "Matches T1 sagittal orientation",
        "Midline clearly visualized",
        "Posterior fossa included"
      ],
      parameterHighlights: [
        { key: "FOV", explanation: "Slightly larger FOV (240mm) ensures full anterior-posterior brain coverage in sagittal view." },
        { key: "TR", explanation: "Long TR for T2 contrast — allows full relaxation between repetitions." }
      ],
      correctOrderHint: 9
    }
  }),
  makeProtocol({
    id: "brain_t1_axial_post",
    label: "Brain T1 Axial Post-Contrast",
    workflowOrder: 10,
    target: makeTarget(
      { x: 0.03, y: -0.05, z: 0.11 },
      { x: 0.94, y: 0.76, z: 0.56 },
      { rx: -5, ry: 2, rz: 9 },
      makeFullParams(620, 15, 220, 24, 5, 0.5, 90, 256, 192, 2, 150, 4, 0, 1)
    ),
    initial: makeTarget(
      { x: -0.2, y: 0.15, z: 0.3 },
      { x: 0.66, y: 0.57, z: 0.43 },
      { rx: 7, ry: -6, rz: -10 },
      makeFullParams(920, 24, 250, 18, 4, 1.0, 70, 192, 160, 1, 200, 3, 0, 0)
    ),
    tolerances: { center: 0.22, size: 0.2, rotation: 16, param: 0.2 },
    parameterSpecs: BRAIN_SPECS,
    clinicalNotes: [
      "Planning geometry should mirror pre-contrast axial T1 for interval comparison.",
      "Maintain full intracranial coverage in post-contrast series."
    ],
    teaching: {
      purpose: "Detect enhancing lesions (tumors, infections, inflammation) after gadolinium contrast administration.",
      planningHint: "Copy exact slice positions from pre-contrast T1 axial. Same geometry enables direct before/after comparison.",
      planningChecklist: [
        "Identical geometry to pre-contrast T1 axial",
        "Fat suppression enabled to improve enhancement conspicuity",
        "Full brain coverage maintained"
      ],
      parameterHighlights: [
        { key: "FatSuppression", explanation: "CHESS fat suppression makes enhancing lesions more conspicuous by removing bright fat signal that could mask enhancement." },
        { key: "NEX", explanation: "NEX=2 improves signal for better visualization of subtle enhancement." }
      ],
      correctOrderHint: 10
    }
  })
];
