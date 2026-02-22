import type { RegionId } from './mri';

/** Phases of the workstation workflow */
export type WorkstationPhase =
  | 'region-select'
  | 'exam-setup'
  | 'protocols-confirmed'
  | 'survey-running'
  | 'survey-complete'
  | 'protocol-active';

/** Status of a protocol in the sidebar list */
export type ProtocolStatus = 'pending' | 'active' | 'completed' | 'skipped';

/** A protocol added to the exam's sidebar list */
export interface ProtocolListItem {
  protocolId: string;
  label: string;
  shortName: string;
  orientation: string;
  region: RegionId;
  status: ProtocolStatus;
}

/** Tab in the bottom-right panel */
export type RightPanelTab = 'realtime' | 'feedback';

/** A folder in the ExamCards browser */
export interface ExamCardFolder {
  id: string;
  label: string;
  children: ExamCardEntry[];
}

/** A protocol entry in the ExamCards browser */
export interface ExamCardProtocol {
  id: string;
  label: string;
  shortName: string;
  orientation: string;
  region: RegionId;
  estimatedTime: string;
}

/** An entry in the ExamCards browser (either folder or protocol) */
export type ExamCardEntry = ExamCardFolder | ExamCardProtocol;

/** Type guard for folder entries */
export function isFolder(entry: ExamCardEntry): entry is ExamCardFolder {
  return 'children' in entry;
}

/** Type guard for protocol entries */
export function isProtocol(entry: ExamCardEntry): entry is ExamCardProtocol {
  return 'estimatedTime' in entry;
}
