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
  // Default to flat2d — clean 2D-rectangle look across all three panels. The
  // editable views (axial, sagittal) get drag handles for resize / rotate;
  // the derived (coronal) view renders as a flat polygon outline of the
  // projected cube, computed via getProjectedGeometry — so it still reflects
  // rotations made in the editable views (rx, rz) without showing 3D wire
  // edges. See drawHullOutline in LocalizerCanvas.tsx for that path. Users
  // who want the full 3D wire view can flip the top-bar toggle to cube3d.
  const [boxRenderMode, setBoxRenderMode] = useState<BoxRenderMode>('flat2d');
  const plannerCaseId = planner.caseId;
  const plannerProtocolId = planner.protocolId;
  const selectCase = planner.selectCase;
  const selectProtocol = planner.selectProtocol;

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

    // Case needs to change — switch planner case (hook persists current snapshot internally)
    if (plannerCaseId !== targetCaseId) {
      selectCase(targetCaseId);
      return;
    }

    // Case is loaded — select the specific protocol if one is resolved
    if (resolved && plannerProtocolId !== resolved.protocolConfig.id) {
      selectProtocol(resolved.protocolConfig.id);
    }
  }, [caseId, plannerCaseId, plannerProtocolId, resolved, selectCase, selectProtocol]);

  // Active when canvases should be shown (after survey, with planner initialized)
  const isActive =
    (phase === 'survey-complete' || phase === 'protocol-active') &&
    plannerCaseId !== null;

  return {
    planner,
    resolved,
    isActive,
    boxRenderMode,
    setBoxRenderMode,
  };
}

export type PlannerBridge = ReturnType<typeof usePlannerBridge>;
