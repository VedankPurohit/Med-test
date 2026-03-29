import { CASE_MAP } from '@/features/planner/data/planner-config';
import type { CaseId, CaseConfig, ProtocolConfig } from '@/features/planner/types/planner';
import type { CaseId as WorkstationCaseId } from '@/features/workstation/types/mri';
import type { ExamCardFolder, ExamCardEntry } from '@/features/workstation/types/workstation';
import { isFolder, isProtocol } from '@/features/workstation/types/workstation';

/** Mapping from ExamCard protocol ID to planner protocol identity */
const EXAMCARD_TO_PLANNER: Record<string, { caseId: CaseId; plannerProtocolId: string }> = {
  // Brain
  'axial-t2-tse':          { caseId: 'brain', plannerProtocolId: 'brain_t2_axial' },
  'axial-t2-flair':        { caseId: 'brain', plannerProtocolId: 'brain_t2_flair_axial' },
  'axial-t1-tse':          { caseId: 'brain', plannerProtocolId: 'brain_t1_axial_se' },
  'sagittal-t1-tse':       { caseId: 'brain', plannerProtocolId: 'brain_t1_sagittal' },
  'coronal-t1-tse':        { caseId: 'brain', plannerProtocolId: 'brain_t1_se_coronal' },
  'axial-dwi':             { caseId: 'brain', plannerProtocolId: 'brain_dwi_axial' },
  'axial-swi':             { caseId: 'brain', plannerProtocolId: 'brain_swi_axial' },
  // Dorsal spine (thoracic)
  'spine-sagittal-t2-tse': { caseId: 'tspine', plannerProtocolId: 'tspine_sag_t2' },
  // Dorsal spine (lumbar)
  'spine-sagittal-t1-tse': { caseId: 'lspine', plannerProtocolId: 'lspine_sag_t1' },
  'spine-sagittal-stir':   { caseId: 'lspine', plannerProtocolId: 'lspine_sag_stir' },
  'spine-coronal-stir':    { caseId: 'lspine', plannerProtocolId: 'lspine_cor_stir' },
  'spine-axial-t2-tse':    { caseId: 'lspine', plannerProtocolId: 'lspine_ax_t2' },
  // Neck (cervical)
  'neck-sag-t2':           { caseId: 'cspine', plannerProtocolId: 'cspine_sag_t2' },
  'neck-ax-t2':            { caseId: 'cspine', plannerProtocolId: 'cspine_ax_t2' },
  'neck-cor-stir':         { caseId: 'cspine', plannerProtocolId: 'cspine_cor_stir' },
  'neck-ax-t1-post':       { caseId: 'cspine', plannerProtocolId: 'cspine_ax_t1_post' },
  // Knee
  'knee-sag-pd':           { caseId: 'knee', plannerProtocolId: 'knee_sag_pd' },
  'knee-sag-t2-fs':        { caseId: 'knee', plannerProtocolId: 'knee_sag_t2_fs' },
  'knee-cor-pd':           { caseId: 'knee', plannerProtocolId: 'knee_cor_pd' },
  'knee-ax-pd':            { caseId: 'knee', plannerProtocolId: 'knee_ax_pd' },
  'knee-cor-t1':           { caseId: 'knee', plannerProtocolId: 'knee_cor_t1' },
};

export type ResolvedProtocol = {
  examCardId: string;
  caseId: CaseId;
  caseConfig: CaseConfig;
  protocolConfig: ProtocolConfig;
};

/** Resolve an ExamCard protocol ID to its full planner config. Returns null if unmapped. */
export function resolveProtocol(examCardId: string): ResolvedProtocol | null {
  const mapping = EXAMCARD_TO_PLANNER[examCardId];
  if (!mapping) return null;

  const caseConfig = CASE_MAP[mapping.caseId];
  if (!caseConfig) return null;

  const protocolConfig = caseConfig.protocols.find(p => p.id === mapping.plannerProtocolId);
  if (!protocolConfig) return null;

  return { examCardId, caseId: mapping.caseId, caseConfig, protocolConfig };
}

/** Check if an ExamCard protocol has a corresponding planner definition */
export function hasPlannerDefinition(examCardId: string): boolean {
  return examCardId in EXAMCARD_TO_PLANNER;
}

/** Check if an ExamCard protocol belongs to a given case */
export function isForCase(examCardId: string, caseId: WorkstationCaseId): boolean {
  const mapping = EXAMCARD_TO_PLANNER[examCardId];
  return mapping?.caseId === caseId;
}

/** Filter ExamCard tree to only include protocols with planner definitions,
 *  optionally filtered to a specific case. Empty folders are removed. */
export function filterPlannableExamCards(
  folders: ExamCardFolder[],
  caseId?: WorkstationCaseId | null,
): ExamCardFolder[] {
  return folders
    .map(folder => filterFolder(folder, caseId ?? null))
    .filter((f): f is ExamCardFolder => f !== null);
}

function filterFolder(folder: ExamCardFolder, caseId: WorkstationCaseId | null): ExamCardFolder | null {
  const filtered = folder.children
    .map(child => {
      if (isProtocol(child)) {
        if (!hasPlannerDefinition(child.id)) return null;
        if (caseId && !isForCase(child.id, caseId)) return null;
        return child;
      }
      if (isFolder(child)) {
        return filterFolder(child, caseId);
      }
      return null;
    })
    .filter((c): c is ExamCardEntry => c !== null);

  if (filtered.length === 0) return null;
  return { ...folder, children: filtered };
}
