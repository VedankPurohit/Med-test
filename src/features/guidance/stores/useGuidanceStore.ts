import { create } from "zustand";
import type { GuidanceStepId } from "@/features/guidance/types/guidance";

interface GuidanceState {
  tipsEnabled: boolean;
  showCorrectPlanning: boolean;
  correctPlanningTimerSeconds: number;
  activeTeachingStrategy: string;
  sequenceSteps: Record<string, GuidanceStepId>;
  orderConfirmed: boolean;
  protocolNotes: Record<string, string>;
}

interface GuidanceActions {
  toggleTips: () => void;
  setTipsEnabled: (enabled: boolean) => void;
  showCorrectOverlay: () => void;
  hideCorrectOverlay: () => void;
  setCorrectPlanningTimer: (seconds: number) => void;
  setTeachingStrategy: (id: string) => void;
  setSequenceStep: (protocolId: string, step: GuidanceStepId) => void;
  getSequenceStep: (protocolId: string) => GuidanceStepId | undefined;
  setOrderConfirmed: (confirmed: boolean) => void;
  setProtocolNote: (protocolId: string, note: string) => void;
  getProtocolNote: (protocolId: string) => string;
  resetGuidance: () => void;
}

const INITIAL_STATE: GuidanceState = {
  tipsEnabled: true,
  showCorrectPlanning: false,
  correctPlanningTimerSeconds: 15,
  activeTeachingStrategy: "popup",
  sequenceSteps: {},
  orderConfirmed: false,
  protocolNotes: {},
};

export const useGuidanceStore = create<GuidanceState & GuidanceActions>(
  (set, get) => ({
    ...INITIAL_STATE,

    toggleTips: () => set((s) => ({ tipsEnabled: !s.tipsEnabled })),

    setTipsEnabled: (enabled) => set({ tipsEnabled: enabled }),

    showCorrectOverlay: () => set({ showCorrectPlanning: true }),

    hideCorrectOverlay: () => set({ showCorrectPlanning: false }),

    setCorrectPlanningTimer: (seconds) =>
      set({ correctPlanningTimerSeconds: seconds }),

    setTeachingStrategy: (id) => set({ activeTeachingStrategy: id }),

    setSequenceStep: (protocolId, step) =>
      set((s) => ({
        sequenceSteps: { ...s.sequenceSteps, [protocolId]: step },
      })),

    getSequenceStep: (protocolId) => get().sequenceSteps[protocolId],

    setOrderConfirmed: (confirmed) => set({ orderConfirmed: confirmed }),

    setProtocolNote: (protocolId, note) =>
      set((s) => ({
        protocolNotes: { ...s.protocolNotes, [protocolId]: note },
      })),

    getProtocolNote: (protocolId) => get().protocolNotes[protocolId] ?? "",

    resetGuidance: () => set(INITIAL_STATE),
  })
);
