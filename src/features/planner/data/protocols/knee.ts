import { ProtocolConfig } from "@/features/planner/types/planner";
import { EXTENDED_PARAMETER_SPECS, makeFullParams, makeProtocol, makeTarget } from "@/features/planner/data/protocols/helpers";

// PhaseEncDir encoding: 0=AP, 1=PA, 2=RL, 3=LR, 4=SI, 5=IS
// FatSuppression encoding: 0=None, 1=CHESS, 2=STIR, 3=SPAIR, 4=Dixon

export const KNEE_PROTOCOLS: ProtocolConfig[] = [
  makeProtocol({
    id: "knee_sag_pd",
    label: "Knee PD Sagittal",
    workflowOrder: 1,
    target: makeTarget(
      { x: 0.0, y: -0.02, z: 0.0 },
      { x: 0.5, y: 0.8, z: 0.55 },
      { rx: 0, ry: 0, rz: 0 },
      makeFullParams(3000, 30, 160, 24, 3, 0.3, 150, 320, 256, 2, 150, 11, 0, 1)
    ),
    initial: makeTarget(
      { x: 0.15, y: 0.13, z: -0.15 },
      { x: 0.38, y: 0.68, z: 0.43 },
      { rx: 5, ry: -7, rz: 8 },
      makeFullParams(2500, 25, 180, 24, 3, 0.3, 150, 320, 256, 2, 150, 11, 0, 1)
    ),
    tolerances: { center: 0.22, size: 0.2, rotation: 16, param: 0.22 },
    parameterSpecs: EXTENDED_PARAMETER_SPECS,
    clinicalNotes: [
      "Primary sagittal PD sequence for meniscus and cartilage evaluation.",
      "Ensure full medial-to-lateral coverage of both femoral condyles."
    ],
    teaching: {
      purpose: "Primary sequence for meniscus evaluation. Proton density weighting provides excellent contrast between meniscal tissue and articular cartilage.",
      planningHint: "Align parallel to lateral femoral condyle on axial localizer. Center slab on intercondylar notch for symmetric medial and lateral coverage.",
      planningChecklist: [
        "Slices parallel to lateral femoral condyle",
        "Full medial-to-lateral condylar coverage",
        "Intercondylar notch centered in FOV"
      ],
      parameterHighlights: [
        { key: "TR", explanation: "TR of 3000ms provides proton density weighting with sufficient SNR for meniscal detail." },
        { key: "TE", explanation: "Short TE (30ms) minimizes T2 weighting, keeping meniscal tears conspicuous against bright cartilage." },
        { key: "FOV", explanation: "160mm FOV gives high spatial resolution for small structures like menisci and ligaments." },
        { key: "FatSuppression", explanation: "CHESS fat suppression improves conspicuity of meniscal tears and cartilage lesions against a dark background." }
      ],
      correctOrderHint: 1
    }
  }),
  makeProtocol({
    id: "knee_sag_t2_fs",
    label: "Knee T2 FS Sagittal",
    workflowOrder: 2,
    target: makeTarget(
      { x: 0.0, y: -0.02, z: 0.0 },
      { x: 0.5, y: 0.8, z: 0.55 },
      { rx: 0, ry: 0, rz: 0 },
      makeFullParams(4000, 60, 160, 24, 3, 0.3, 150, 320, 256, 2, 150, 15, 0, 3)
    ),
    initial: makeTarget(
      { x: 0.15, y: 0.13, z: -0.15 },
      { x: 0.38, y: 0.68, z: 0.43 },
      { rx: 5, ry: -7, rz: 8 },
      makeFullParams(2500, 25, 180, 24, 3, 0.3, 150, 320, 256, 2, 150, 15, 0, 3)
    ),
    tolerances: { center: 0.22, size: 0.2, rotation: 16, param: 0.22 },
    parameterSpecs: EXTENDED_PARAMETER_SPECS,
    clinicalNotes: [
      "T2 fat-suppressed sagittal for fluid-sensitive assessment of bone and soft tissue.",
      "Mirror sagittal PD geometry for direct comparison of findings."
    ],
    teaching: {
      purpose: "Detect bone marrow edema, ligament tears, and cartilage abnormalities. Fat suppression makes edema and fluid conspicuous as bright signal.",
      planningHint: "Copy slice positions from sagittal PD for direct comparison. SPAIR fat suppression provides uniform signal across the curved knee anatomy.",
      planningChecklist: [
        "Matches sagittal PD slice positions",
        "Uniform fat suppression across entire FOV",
        "Full condylar coverage maintained"
      ],
      parameterHighlights: [
        { key: "TE", explanation: "Longer TE (60ms) gives T2 weighting where fluid and edema appear bright against suppressed fat." },
        { key: "TR", explanation: "TR of 4000ms allows adequate T2 relaxation for fluid-sensitive contrast." },
        { key: "FatSuppression", explanation: "SPAIR provides more homogeneous fat suppression than CHESS across off-center anatomy like the knee." },
        { key: "ETL", explanation: "ETL of 15 keeps scan time manageable despite the long TR needed for T2 weighting." }
      ],
      correctOrderHint: 2
    }
  }),
  makeProtocol({
    id: "knee_cor_pd",
    label: "Knee PD Coronal",
    workflowOrder: 3,
    target: makeTarget(
      { x: 0.0, y: -0.02, z: 0.0 },
      { x: 0.55, y: 0.5, z: 0.78 },
      { rx: -90, ry: 0, rz: 0 },
      makeFullParams(3000, 30, 160, 24, 3, 0.3, 150, 320, 256, 2, 150, 11, 4, 1)
    ),
    initial: makeTarget(
      { x: 0.15, y: 0.13, z: -0.15 },
      { x: 0.43, y: 0.38, z: 0.66 },
      { rx: -85, ry: -7, rz: 8 },
      makeFullParams(2500, 25, 180, 24, 3, 0.3, 150, 320, 256, 2, 150, 11, 4, 1)
    ),
    tolerances: { center: 0.22, size: 0.2, rotation: 16, param: 0.22 },
    parameterSpecs: EXTENDED_PARAMETER_SPECS,
    clinicalNotes: [
      "Coronal PD for collateral ligament and meniscal body assessment.",
      "Align parallel to the posterior femoral condylar line for reproducible imaging."
    ],
    teaching: {
      purpose: "For collateral ligament assessment. Coronal plane optimally displays the MCL and LCL along their full length from femoral to tibial attachments.",
      planningHint: "Parallel to posterior femoral condylar line on axial localizer. Center on the joint line for symmetric femoral and tibial coverage.",
      planningChecklist: [
        "Parallel to posterior femoral condylar line",
        "Full anterior-to-posterior joint coverage",
        "Both collateral ligaments included"
      ],
      parameterHighlights: [
        { key: "PhaseEncDir", explanation: "SI phase encoding in coronal view prevents wrap artifacts from the leg above and below the knee." },
        { key: "TR", explanation: "TR of 3000ms provides PD weighting optimal for ligament and meniscal contrast." }
      ],
      correctOrderHint: 3
    }
  }),
  makeProtocol({
    id: "knee_ax_pd",
    label: "Knee PD Axial",
    workflowOrder: 4,
    target: makeTarget(
      { x: 0.0, y: -0.02, z: 0.0 },
      { x: 0.55, y: 0.55, z: 0.5 },
      { rx: 0, ry: 0, rz: 0 },
      makeFullParams(3500, 30, 160, 20, 4, 0.4, 150, 256, 192, 2, 150, 11, 0, 1)
    ),
    initial: makeTarget(
      { x: 0.15, y: 0.13, z: -0.15 },
      { x: 0.43, y: 0.43, z: 0.38 },
      { rx: 5, ry: -7, rz: 8 },
      makeFullParams(2500, 25, 180, 20, 4, 0.4, 150, 256, 192, 2, 150, 11, 0, 1)
    ),
    tolerances: { center: 0.22, size: 0.2, rotation: 16, param: 0.22 },
    parameterSpecs: EXTENDED_PARAMETER_SPECS,
    clinicalNotes: [
      "Axial PD for patellofemoral compartment and retinacular evaluation.",
      "Cover from above the patella through the tibial tuberosity."
    ],
    teaching: {
      purpose: "Evaluate patellar tracking, trochlear groove, and retinaculum. Axial plane uniquely demonstrates patellofemoral alignment and anterior structures.",
      planningHint: "Prescribe slices perpendicular to the long axis of the femur. Cover from suprapatellar pouch through the tibial tuberosity.",
      planningChecklist: [
        "Perpendicular to femoral shaft axis",
        "Suprapatellar pouch included superiorly",
        "Tibial tuberosity included inferiorly"
      ],
      parameterHighlights: [
        { key: "SliceThickness", explanation: "4mm slices balance coverage and resolution for the patellofemoral compartment." },
        { key: "MatrixPhase", explanation: "192 phase steps keep scan time short while providing adequate resolution for patellar cartilage." },
        { key: "Slices", explanation: "20 slices cover the full patellofemoral compartment from suprapatellar pouch to tibial tuberosity." }
      ],
      correctOrderHint: 4
    }
  }),
  makeProtocol({
    id: "knee_cor_t1",
    label: "Knee T1 Coronal",
    workflowOrder: 5,
    target: makeTarget(
      { x: 0.0, y: -0.02, z: 0.0 },
      { x: 0.55, y: 0.5, z: 0.78 },
      { rx: -90, ry: 0, rz: 0 },
      makeFullParams(550, 12, 160, 24, 3, 0.3, 90, 256, 192, 1, 150, 4, 4, 0)
    ),
    initial: makeTarget(
      { x: 0.15, y: 0.13, z: -0.15 },
      { x: 0.43, y: 0.38, z: 0.66 },
      { rx: -85, ry: -7, rz: 8 },
      makeFullParams(2500, 25, 180, 24, 3, 0.3, 90, 256, 192, 1, 150, 4, 4, 0)
    ),
    tolerances: { center: 0.22, size: 0.2, rotation: 16, param: 0.22 },
    parameterSpecs: EXTENDED_PARAMETER_SPECS,
    clinicalNotes: [
      "Coronal T1 for bone marrow assessment without fat suppression.",
      "Match coronal PD geometry for direct comparison."
    ],
    teaching: {
      purpose: "Assess bone marrow signal and structural anatomy without fat suppression. T1 weighting shows normal bright marrow fat, making infiltrative processes and fractures conspicuous.",
      planningHint: "Copy slice positions from coronal PD for direct comparison. T1 coronal is the reference for marrow signal assessment.",
      planningChecklist: [
        "Matches coronal PD slice positions",
        "Full femoral and tibial condylar coverage",
        "No fat suppression to preserve marrow signal"
      ],
      parameterHighlights: [
        { key: "TR", explanation: "Short TR (550ms) gives strong T1 weighting where normal marrow fat is bright and edema appears dark." },
        { key: "TE", explanation: "Short TE (12ms) minimizes T2 contamination for pure T1 contrast." },
        { key: "FatSuppression", explanation: "No fat suppression preserves the bright marrow signal needed to detect infiltrative pathology." },
        { key: "NEX", explanation: "NEX=1 keeps scan time short since T1 sequences inherently have good SNR." }
      ],
      correctOrderHint: 5
    }
  })
];
