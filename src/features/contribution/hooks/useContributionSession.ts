"use client";

import { useCallback, useMemo, useState } from "react";
import {
  FLAT_VIEW_AXES,
  VIEW_CONFIG,
  clamp,
  hitTestCube,
  hitTestFlat,
  inPlaneAngle
} from "@/features/planner/lib/geometry";
import {
  BoxRenderMode,
  HandleId,
  Point2,
  Rotation3,
  Vector3,
  ViewId
} from "@/features/planner/types/planner";
import {
  ContributionPlacement,
  ContributionPlacementMap,
  ContributionProtocolEntry,
  DEFAULT_BOX
} from "@/features/contribution/types";
import {
  createPlacementMap,
  getPlacementForProtocol,
  savePlacementSnapshot
} from "@/features/contribution/lib/session";

const ROTATION_AXIS_FOR_VIEW: Record<ViewId, keyof Rotation3> = {
  axial: "rz",
  sagittal: "rx",
  coronal: "ry"
};

type DragState =
  | { mode: "move"; viewId: ViewId; axisA: keyof Vector3; axisB: keyof Vector3; offsetA: number; offsetB: number }
  | { mode: "resize-edge"; viewId: ViewId; edgeIndex: 0 | 1 | 2 | 3; sizeAxis: keyof Vector3; angle: number }
  | { mode: "resize-corner"; viewId: ViewId; sizeAxisA: keyof Vector3; sizeAxisB: keyof Vector3; angle: number }
  | { mode: "rotate"; viewId: ViewId; rotationAxis: keyof Rotation3; initialPointerAngle: number; initialRotationDeg: number };

const createDefaultPlacement = (protocol: ContributionProtocolEntry): ContributionPlacement => ({
  box: { ...DEFAULT_BOX, center: { ...DEFAULT_BOX.center }, size: { ...DEFAULT_BOX.size }, rotation: { ...DEFAULT_BOX.rotation } },
  params: { ...protocol.parameterValues },
  boxRenderMode: "flat2d"
});

export const useContributionSession = (protocols: ContributionProtocolEntry[]) => {
  const [placements, setPlacements] = useState<ContributionPlacementMap>(() =>
    createPlacementMap(
      protocols.map((protocol) => protocol.id),
      Object.fromEntries(protocols.map((protocol) => [protocol.id, createDefaultPlacement(protocol)]))
    )
  );
  const [activeProtocolId, setActiveProtocolId] = useState<string | null>(protocols[0]?.id ?? null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const activeProtocol = useMemo(
    () => protocols.find((protocol) => protocol.id === activeProtocolId) ?? null,
    [activeProtocolId, protocols]
  );

  const activePlacement = useMemo(() => {
    if (!activeProtocolId) {
      return null;
    }
    return placements[activeProtocolId] ?? null;
  }, [activeProtocolId, placements]);

  const ensureProtocols = useCallback((nextProtocols: ContributionProtocolEntry[]) => {
    setPlacements((current) => {
      const next: ContributionPlacementMap = {};
      for (const protocol of nextProtocols) {
        next[protocol.id] = current[protocol.id]
          ? getPlacementForProtocol(current, protocol.id)
          : createDefaultPlacement(protocol);
      }
      return next;
    });

    setActiveProtocolId((current) => {
      if (current && nextProtocols.some((protocol) => protocol.id === current)) {
        return current;
      }
      return nextProtocols[0]?.id ?? null;
    });
  }, []);

  const setProtocolActive = useCallback((protocolId: string) => {
    setActiveProtocolId(protocolId);
    setDrag(null);
  }, []);

  const updateActivePlacement = useCallback((updater: (current: ContributionPlacement) => ContributionPlacement) => {
    setPlacements((current) => {
      if (!activeProtocolId || !current[activeProtocolId]) {
        return current;
      }
      return savePlacementSnapshot(current, {
        protocolId: activeProtocolId,
        placement: updater(current[activeProtocolId]!)
      });
    });
  }, [activeProtocolId]);

  const setBoxRenderMode = useCallback((mode: BoxRenderMode) => {
    updateActivePlacement((current) => ({ ...current, boxRenderMode: mode }));
  }, [updateActivePlacement]);

  const changeParam = useCallback((key: string, value: number) => {
    if (!Number.isFinite(value)) {
      return;
    }

    const spec = activeProtocol?.parameterSpecs.find((entry) => String(entry.key) === key);
    const min = spec?.min;
    const max = spec?.max;
    const rounded = spec?.integer ? Math.round(value) : value;
    const bounded =
      min !== undefined && max !== undefined
        ? clamp(rounded, min, max)
        : min !== undefined
          ? Math.max(min, rounded)
          : max !== undefined
            ? Math.min(max, rounded)
            : rounded;

    updateActivePlacement((current) => ({
      ...current,
      params: {
        ...current.params,
        [key]: bounded
      }
    }));
  }, [activeProtocol, updateActivePlacement]);

  const beginDrag = useCallback((viewId: ViewId, point: Point2) => {
    if (!activePlacement) {
      return false;
    }

    const mode = activePlacement.boxRenderMode;
    const handle = mode === "flat2d"
      ? hitTestFlat(point, activePlacement.box, viewId)
      : hitTestCube(point, activePlacement.box, viewId);

    if (!handle) {
      return false;
    }

    if (handle.kind === "move") {
      const [axisA, axisB] = VIEW_CONFIG[viewId].moveAxes;
      setDrag({
        mode: "move",
        viewId,
        axisA,
        axisB,
        offsetA: point.x - activePlacement.box.center[axisA],
        offsetB: point.y - activePlacement.box.center[axisB]
      });
      return true;
    }

    if (handle.kind === "edge" && mode === "flat2d") {
      const [axisA, axisB] = FLAT_VIEW_AXES[viewId];
      const angle = inPlaneAngle(activePlacement.box, viewId);
      const sizeAxis = handle.index % 2 === 0 ? axisB : axisA;
      setDrag({ mode: "resize-edge", viewId, edgeIndex: handle.index, sizeAxis, angle });
      return true;
    }

    if (handle.kind === "corner" && mode === "flat2d") {
      const [axisA, axisB] = FLAT_VIEW_AXES[viewId];
      const angle = inPlaneAngle(activePlacement.box, viewId);
      setDrag({ mode: "resize-corner", viewId, sizeAxisA: axisA, sizeAxisB: axisB, angle });
      return true;
    }

    if (handle.kind === "rotate") {
      const [axisA, axisB] = FLAT_VIEW_AXES[viewId];
      const center2D = { x: activePlacement.box.center[axisA], y: activePlacement.box.center[axisB] };
      const pointerAngle = Math.atan2(point.y - center2D.y, point.x - center2D.x);
      const rotAxis = ROTATION_AXIS_FOR_VIEW[viewId];
      setDrag({
        mode: "rotate",
        viewId,
        rotationAxis: rotAxis,
        initialPointerAngle: pointerAngle,
        initialRotationDeg: activePlacement.box.rotation[rotAxis]
      });
      return true;
    }

    return false;
  }, [activePlacement]);

  const moveDrag = useCallback((viewId: ViewId, point: Point2) => {
    if (!drag || drag.viewId !== viewId) {
      return;
    }

    if (drag.mode === "move") {
      updateActivePlacement((current) => ({
        ...current,
        box: {
          ...current.box,
          center: {
            ...current.box.center,
            [drag.axisA]: clamp(point.x - drag.offsetA, -1, 1),
            [drag.axisB]: clamp(point.y - drag.offsetB, -1, 1)
          }
        }
      }));
      return;
    }

    if (drag.mode === "resize-edge") {
      updateActivePlacement((current) => {
        const [axisA, axisB] = FLAT_VIEW_AXES[drag.viewId];
        const center2D = { x: current.box.center[axisA], y: current.box.center[axisB] };
        const dx = point.x - center2D.x;
        const dy = point.y - center2D.y;
        const edgeNormalAngle = drag.edgeIndex % 2 === 0 ? drag.angle + Math.PI / 2 : drag.angle;
        const projected = dx * Math.cos(edgeNormalAngle) + dy * Math.sin(edgeNormalAngle);
        return {
          ...current,
          box: {
            ...current.box,
            size: {
              ...current.box.size,
              [drag.sizeAxis]: clamp(2 * Math.abs(projected), 0.2, 1.8)
            }
          }
        };
      });
      return;
    }

    if (drag.mode === "resize-corner") {
      updateActivePlacement((current) => {
        const [axisA, axisB] = FLAT_VIEW_AXES[drag.viewId];
        const center2D = { x: current.box.center[axisA], y: current.box.center[axisB] };
        const dx = point.x - center2D.x;
        const dy = point.y - center2D.y;
        const projA = dx * Math.cos(drag.angle) + dy * Math.sin(drag.angle);
        const projB = -dx * Math.sin(drag.angle) + dy * Math.cos(drag.angle);
        return {
          ...current,
          box: {
            ...current.box,
            size: {
              ...current.box.size,
              [drag.sizeAxisA]: clamp(2 * Math.abs(projA), 0.2, 1.8),
              [drag.sizeAxisB]: clamp(2 * Math.abs(projB), 0.2, 1.8)
            }
          }
        };
      });
      return;
    }

    if (drag.mode === "rotate") {
      updateActivePlacement((current) => {
        const [axisA, axisB] = FLAT_VIEW_AXES[drag.viewId];
        const center2D = { x: current.box.center[axisA], y: current.box.center[axisB] };
        const currentAngle = Math.atan2(point.y - center2D.y, point.x - center2D.x);
        const deltaRad = currentAngle - drag.initialPointerAngle;
        const deltaDeg = (deltaRad * 180) / Math.PI;

        return {
          ...current,
          box: {
            ...current.box,
            rotation: {
              ...current.box.rotation,
              [drag.rotationAxis]: clamp(drag.initialRotationDeg + deltaDeg, -45, 45)
            }
          }
        };
      });
    }
  }, [drag, updateActivePlacement]);

  const endDrag = useCallback(() => {
    setDrag(null);
  }, []);

  const hitTest = useCallback((viewId: ViewId, point: Point2): HandleId | null => {
    if (!activePlacement) {
      return null;
    }
    return activePlacement.boxRenderMode === "flat2d"
      ? hitTestFlat(point, activePlacement.box, viewId)
      : hitTestCube(point, activePlacement.box, viewId);
  }, [activePlacement]);

  return {
    placements,
    activeProtocolId,
    activeProtocol,
    activePlacement,
    ensureProtocols,
    setProtocolActive,
    setBoxRenderMode,
    changeParam,
    beginDrag,
    moveDrag,
    endDrag,
    hitTest
  };
};
