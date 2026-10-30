'use client';

import { useEffect, useCallback } from 'react';
import { useGuidanceStore } from '@/features/guidance/stores/useGuidanceStore';
import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';
import type { GuidanceStepId } from '@/features/guidance/types/guidance';

/**
 * Orchestrates the per-sequence guided flow.
 * Listens to workstation store protocol activations and
 * advances the guidance step accordingly.
 */
export function useGuidanceFlow() {
  const tipsEnabled = useGuidanceStore((s) => s.tipsEnabled);
  const sequenceSteps = useGuidanceStore((s) => s.sequenceSteps);
  const setSequenceStep = useGuidanceStore((s) => s.setSequenceStep);
  const showCorrectOverlay = useGuidanceStore((s) => s.showCorrectOverlay);
  const hideCorrectOverlay = useGuidanceStore((s) => s.hideCorrectOverlay);

  const phase = useWorkstationStore((s) => s.phase);
  const activeIndex = useWorkstationStore((s) => s.activeProtocolIndex);
  const addedProtocols = useWorkstationStore((s) => s.addedProtocols);

  const activeProtocolId =
    activeIndex !== null ? addedProtocols[activeIndex]?.protocolId ?? null : null;

  const currentStep: GuidanceStepId | null = activeProtocolId
    ? sequenceSteps[activeProtocolId] ?? null
    : null;

  // When a new protocol is activated and tips are on, start the guided flow
  useEffect(() => {
    if (
      phase === 'protocol-active' &&
      activeProtocolId &&
      !sequenceSteps[activeProtocolId] &&
      tipsEnabled
    ) {
      setSequenceStep(activeProtocolId, 'show_target');
      showCorrectOverlay();
    }
  }, [
    phase,
    activeProtocolId,
    tipsEnabled,
    sequenceSteps,
    setSequenceStep,
    showCorrectOverlay,
  ]);

  const advanceStep = useCallback(
    (toStep: GuidanceStepId) => {
      if (!activeProtocolId) return;
      setSequenceStep(activeProtocolId, toStep);

      if (toStep === 'show_target') {
        showCorrectOverlay();
      } else {
        hideCorrectOverlay();
      }
    },
    [activeProtocolId, setSequenceStep, showCorrectOverlay, hideCorrectOverlay]
  );

  const skipToPlanning = useCallback(() => {
    if (!activeProtocolId) return;
    setSequenceStep(activeProtocolId, 'planning');
    hideCorrectOverlay();
  }, [activeProtocolId, setSequenceStep, hideCorrectOverlay]);

  return {
    activeProtocolId,
    currentStep,
    tipsEnabled,
    advanceStep,
    skipToPlanning,
  };
}
