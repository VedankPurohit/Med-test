import { create } from 'zustand';
import type { RegionId, CaseId } from '@/features/workstation/types/mri';
import type {
  WorkstationPhase,
  ProtocolListItem,
  RightPanelTab,
  ExamCardProtocol,
} from '@/features/workstation/types/workstation';
import type { ExamSubmissionSummary, ProtocolSummaryEntry } from '@/features/workstation/lib/examSummary';

const REGION_DEFAULT_FOLDER: Record<RegionId, string[]> = {
  brain: [],
  spine: [],
  extremity: [],
};

const SUBMISSION_SUMMARY_STORAGE_KEY = 'mriTrainerSubmissionSummaryV1';

const canUseBrowserStorage = (): boolean => typeof window !== 'undefined';

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isValidProtocolEntry = (value: unknown): value is ProtocolSummaryEntry => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const maybe = value as Partial<ProtocolSummaryEntry>;
  if (
    typeof maybe.examCardProtocolId !== 'string' ||
    typeof maybe.label !== 'string' ||
    typeof maybe.status !== 'string' ||
    typeof maybe.mapped !== 'boolean' ||
    typeof maybe.hasPlacement !== 'boolean' ||
    !Array.isArray(maybe.feedback)
  ) {
    return false;
  }
  if (maybe.plannerCaseId !== null && maybe.plannerCaseId !== undefined && typeof maybe.plannerCaseId !== 'string') {
    return false;
  }
  if (maybe.plannerProtocolId !== null && maybe.plannerProtocolId !== undefined && typeof maybe.plannerProtocolId !== 'string') {
    return false;
  }
  if (maybe.scorePercent !== null && maybe.scorePercent !== undefined && !isFiniteNumber(maybe.scorePercent)) {
    return false;
  }
  if (maybe.pass !== null && maybe.pass !== undefined && typeof maybe.pass !== 'boolean') {
    return false;
  }
  return maybe.feedback.every((item) => typeof item === 'string');
};

const isValidSubmissionSummary = (value: unknown): value is ExamSubmissionSummary => {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const maybe = value as Partial<ExamSubmissionSummary>;
  if (typeof maybe.generatedAt !== 'string' || !Number.isFinite(Date.parse(maybe.generatedAt))) {
    return false;
  }
  if (
    !isFiniteNumber(maybe.totalProtocols) ||
    !isFiniteNumber(maybe.visitedProtocols) ||
    !isFiniteNumber(maybe.scoredProtocols) ||
    !isFiniteNumber(maybe.passedProtocols)
  ) {
    return false;
  }
  if (maybe.averageScorePercent !== null && maybe.averageScorePercent !== undefined && !isFiniteNumber(maybe.averageScorePercent)) {
    return false;
  }
  if (typeof maybe.allVisited !== 'boolean' || !Array.isArray(maybe.protocols)) {
    return false;
  }
  if (maybe.protocols.length !== maybe.totalProtocols) {
    return false;
  }
  if (!maybe.protocols.every(isValidProtocolEntry)) {
    return false;
  }
  return true;
};

const readSubmissionSummary = (): ExamSubmissionSummary | null => {
  if (!canUseBrowserStorage()) {
    return null;
  }

  const raw = window.localStorage.getItem(SUBMISSION_SUMMARY_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!isValidSubmissionSummary(parsed)) {
      window.localStorage.removeItem(SUBMISSION_SUMMARY_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(SUBMISSION_SUMMARY_STORAGE_KEY);
    return null;
  }
};

const writeSubmissionSummary = (summary: ExamSubmissionSummary | null): void => {
  if (!canUseBrowserStorage()) {
    return;
  }
  if (!summary) {
    window.localStorage.removeItem(SUBMISSION_SUMMARY_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(SUBMISSION_SUMMARY_STORAGE_KEY, JSON.stringify(summary));
};

function getCleanExamState(regionId: RegionId | null) {
  return {
    addedProtocols: [] as ProtocolListItem[],
    activeProtocolIndex: null as number | null,
    browserOpen: true,
    expandedFolders: regionId ? REGION_DEFAULT_FOLDER[regionId] ?? [] : [],
    rightPanelTab: 'realtime' as RightPanelTab,
    surveyProgress: 0,
    confirmationWarning: null as string | null,
    showConfirmDialog: false,
    mismatchedProtocols: [] as string[],
    examStartTime: null as number | null,
    submissionSummary: readSubmissionSummary(),
  };
}

interface WorkstationState {
  phase: WorkstationPhase;
  regionId: RegionId | null;
  caseId: CaseId | null;
  addedProtocols: ProtocolListItem[];
  activeProtocolIndex: number | null;
  browserOpen: boolean;
  expandedFolders: string[];
  rightPanelTab: RightPanelTab;
  surveyProgress: number;
  confirmationWarning: string | null;
  showConfirmDialog: boolean;
  mismatchedProtocols: string[];
  examStartTime: number | null;
  submissionSummary: ExamSubmissionSummary | null;
}

interface WorkstationActions {
  selectRegion: (regionId: RegionId) => void;
  selectSubRegion: (caseId: CaseId) => void;
  goBackToRegionSelect: () => void;
  addProtocol: (protocol: ExamCardProtocol) => void;
  removeProtocol: (protocolId: string) => void;
  confirmProtocols: () => void;
  dismissConfirmDialog: () => void;
  removeMismatchedAndConfirm: () => void;
  startSurvey: () => void;
  setSurveyProgress: (progress: number) => void;
  completeSurvey: () => void;
  activateProtocol: (index: number) => void;
  completeProtocol: (index: number) => void;
  setBrowserOpen: (open: boolean) => void;
  toggleFolder: (folderId: string) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  isProtocolAdded: (protocolId: string) => boolean;
  setSubmissionSummary: (summary: ExamSubmissionSummary) => void;
  clearSubmissionSummary: () => void;
  resetExam: () => void;
  reorderProtocols: (orderedIds: string[]) => void;
}

export const useWorkstationStore = create<WorkstationState & WorkstationActions>(
  (set, get) => ({
    phase: 'region-select',
    regionId: null,
    caseId: null,
    ...getCleanExamState(null),

    selectRegion: (regionId) => {
      if (regionId === 'spine') {
        set({ phase: 'spine-subregion', regionId: 'spine', caseId: null, ...getCleanExamState('spine') });
      } else if (regionId === 'extremity') {
        set({ phase: 'exam-setup', regionId, caseId: 'knee', ...getCleanExamState(regionId) });
      } else {
        set({ phase: 'exam-setup', regionId, caseId: 'brain', ...getCleanExamState(regionId) });
      }
    },

    selectSubRegion: (caseId) => {
      set({ phase: 'exam-setup', caseId, ...getCleanExamState(get().regionId) });
    },

    goBackToRegionSelect: () => {
      set({ phase: 'region-select', regionId: null, caseId: null, ...getCleanExamState(null) });
    },

    addProtocol: (protocol) => {
      const { addedProtocols } = get();
      if (addedProtocols.some((p) => p.protocolId === protocol.id)) return;
      set({
        addedProtocols: [
          ...addedProtocols,
          {
            protocolId: protocol.id,
            label: protocol.label,
            shortName: protocol.shortName,
            orientation: protocol.orientation,
            region: protocol.region,
            status: 'pending',
            estimatedTime: protocol.estimatedTime,
          },
        ],
      });
    },

    removeProtocol: (protocolId) => {
      set((state) => ({
        addedProtocols: state.addedProtocols.filter((p) => p.protocolId !== protocolId),
      }));
    },

    confirmProtocols: () => {
      const { addedProtocols, regionId } = get();
      if (!regionId || addedProtocols.length === 0) return;

      const mismatched = addedProtocols.filter((p) => p.region !== regionId);
      if (mismatched.length > 0) {
        set({
          showConfirmDialog: true,
          mismatchedProtocols: mismatched.map((p) => p.protocolId),
          confirmationWarning: `You selected ${regionId.toUpperCase()} as the scan region, but ${mismatched.length} protocol(s) are for a different region.`,
        });
        return;
      }

      set({
        phase: 'protocols-confirmed',
        examStartTime: Date.now(),
        showConfirmDialog: false,
        confirmationWarning: null,
        mismatchedProtocols: [],
      });
    },

    dismissConfirmDialog: () => {
      set({
        showConfirmDialog: false,
        confirmationWarning: null,
        mismatchedProtocols: [],
      });
    },

    removeMismatchedAndConfirm: () => {
      const { mismatchedProtocols, addedProtocols } = get();
      const filtered = addedProtocols.filter(
        (p) => !mismatchedProtocols.includes(p.protocolId),
      );
      set({
        addedProtocols: filtered,
        showConfirmDialog: false,
        confirmationWarning: null,
        mismatchedProtocols: [],
        ...(filtered.length > 0 ? {
          phase: 'protocols-confirmed' as WorkstationPhase,
          examStartTime: Date.now(),
        } : {}),
      });
    },

    startSurvey: () => {
      set({ phase: 'survey-running', surveyProgress: 0 });
    },

    setSurveyProgress: (progress) => {
      set({ surveyProgress: Math.min(100, Math.max(0, progress)) });
    },

    completeSurvey: () => {
      set({ phase: 'survey-complete', surveyProgress: 100 });
    },

    activateProtocol: (index) => {
      set((state) => {
        if (index < 0 || index >= state.addedProtocols.length) return state;
        const protocols = [...state.addedProtocols];
        if (
          state.activeProtocolIndex !== null &&
          state.activeProtocolIndex !== index &&
          state.activeProtocolIndex < protocols.length
        ) {
          protocols[state.activeProtocolIndex] = {
            ...protocols[state.activeProtocolIndex],
            status: 'completed',
          };
        }
        protocols[index] = { ...protocols[index], status: 'active' };
        return {
          addedProtocols: protocols,
          activeProtocolIndex: index,
          phase: 'protocol-active' as WorkstationPhase,
          browserOpen: false,
        };
      });
    },

    completeProtocol: (index) => {
      set((state) => {
        if (index < 0 || index >= state.addedProtocols.length) return state;
        const protocols = [...state.addedProtocols];
        protocols[index] = { ...protocols[index], status: 'completed' };
        return { addedProtocols: protocols };
      });
    },

    setBrowserOpen: (open) => set({ browserOpen: open }),

    toggleFolder: (folderId) => {
      set((state) => {
        const expanded = state.expandedFolders.includes(folderId)
          ? state.expandedFolders.filter((id) => id !== folderId)
          : [...state.expandedFolders, folderId];
        return { expandedFolders: expanded };
      });
    },

    setRightPanelTab: (tab) => set({ rightPanelTab: tab }),

    isProtocolAdded: (protocolId) => {
      return get().addedProtocols.some((p) => p.protocolId === protocolId);
    },

    setSubmissionSummary: (summary) => {
      writeSubmissionSummary(summary);
      set({ submissionSummary: summary });
    },

    clearSubmissionSummary: () => {
      writeSubmissionSummary(null);
      set({ submissionSummary: null });
    },

    resetExam: () => {
      const { regionId } = get();
      set({ phase: 'exam-setup', ...getCleanExamState(regionId) });
    },

    reorderProtocols: (orderedIds) => {
      const { addedProtocols } = get();
      const idToProtocol = new Map(addedProtocols.map((p) => [p.protocolId, p]));
      const reordered = orderedIds
        .map((id) => idToProtocol.get(id))
        .filter((p): p is ProtocolListItem => p !== undefined);
      // Append any protocols not in the ordered list (safety net)
      for (const p of addedProtocols) {
        if (!orderedIds.includes(p.protocolId)) {
          reordered.push(p);
        }
      }
      set({ addedProtocols: reordered });
    },
  }),
);
