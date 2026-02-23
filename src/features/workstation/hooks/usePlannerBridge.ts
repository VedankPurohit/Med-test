'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWorkstationStore } from '@/features/workstation/stores/useWorkstationStore';
import { usePlannerState } from '@/features/planner/hooks/usePlannerState';
import { resolveProtocol, type ResolvedProtocol } from '@/features/workstation/lib/protocolRegistry';
import type { BoxRenderMode } from '@/features/planner/types/planner';

export function usePlannerBridge() {
  const phase = useWorkstationStore((s) => s.phase);
  const activeProtocolIndex = useWorkstationStore((s) => s.activeProtocolIndex);
  const addedProtocols = useWorkstationStore((s) => s.addedProtocols);
  const caseId = useWorkstationStore((s) => s.caseId);

  const planner = usePlannerState();
  const [boxRenderMode, setBoxRenderMode] = useState<BoxRenderMode>('flat2d');

  const activeExamCardId =
    activeProtocolIndex !== null
      ? addedProtocols[activeProtocolIndex]?.protocolId ?? null
      : null;

  const resolved: ResolvedProtocol | null = useMemo(
    () => (activeExamCardId ? resolveProtocol(activeExamCardId) : null),
    [activeExamCardId],
  );

  // Sync planner with workstation state.
  // Use the resolved protocol's caseId (spine protocols can span tspine/lspine/cspine).
  // Fall back to workstation caseId for pre-loading localizer images before activation.
  useEffect(() => {
    const targetCaseId = resolved?.caseId ?? caseId;
    if (!targetCaseId) return;

    // Case needs to change — save current placement, then switch
    if (planner.caseId !== targetCaseId) {
      planner.saveCurrent();
      planner.selectCase(targetCaseId);
      return;
    }

    // Case is loaded — select the specific protocol if one is resolved
    if (resolved && planner.protocolId !== resolved.protocolConfig.id) {
      planner.selectProtocol(resolved.protocolConfig.id);
    }
  }, [caseId, resolved, planner.caseId, planner.protocolId, planner.selectCase, planner.selectProtocol, planner.saveCurrent]);

  // Active when canvases should be shown (after survey, with planner initialized)
  const isActive =
    (phase === 'survey-complete' || phase === 'protocol-active') &&
    planner.caseId !== null;

  return {
    planner,
    resolved,
    isActive,
    boxRenderMode,
    setBoxRenderMode,
  };
}

export type PlannerBridge = ReturnType<typeof usePlannerBridge>;
