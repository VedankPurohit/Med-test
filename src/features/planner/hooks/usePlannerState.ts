"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CASE_MAP, CASES } from "@/features/planner/data/planner-config";
import {
  FLAT_VIEW_AXES,
  getFlatGeometry,
  clamp,
  getProjectedGeometry,
  hitTestCube,
  hitTestFlat,
  inPlaneAngle,
  VIEW_CONFIG
} from "@/features/planner/lib/geometry";
import { computeScore, deepClone, withFallbackTarget } from "@/features/planner/lib/scoring";
import {
  createEmptyCalibrations,
  createEmptyUploadMap,
  readJsonStorage,
  STORAGE_KEYS,
  writeJsonStorage
} from "@/features/planner/lib/storage";
import {
  BoxRenderMode,
  CalibrationMap,
  CaseConfig,
  CaseId,
  HandleId,
  PlannerBox,
  PlannerParams,
  PlannerScore,
  Point2,
  ProtocolConfig,
  Rotation3,
  UploadMap,
  Vector3,
  ViewId
} from "@/features/planner/types/planner";
import { downloadJson } from "@/features/planner/lib/media";

type DragState =
  | { mode: "move"; viewId: ViewId; axisA: keyof Vector3; axisB: keyof Vector3; offsetA: number; offsetB: number }
  | { mode: "resize-edge"; viewId: ViewId; edgeIndex: 0 | 1 | 2 | 3; sizeAxis: keyof Vector3; angle: number; initialSize: number; initialProjected: number }
  | { mode: "resize-corner"; viewId: ViewId; cornerIndex: 0 | 1 | 2 | 3; sizeAxisA: keyof Vector3; sizeAxisB: keyof Vector3; angle: number; initialSizeA: number; initialSizeB: number; initialProjectedA: number; initialProjectedB: number }
  | { mode: "rotate"; viewId: ViewId; rotationAxis: keyof Rotation3; initialPointerAngle: number; initialRotationDeg: number };

const ROTATION_AXIS_FOR_VIEW: Record<ViewId, keyof Rotation3> = {
  axial: "rz",
  sagittal: "rx",
  coronal: "ry"
};

const protocolKey = (caseId: CaseId, protocolId: string): string => `${caseId}:${protocolId}`;

const getProtocolById = (caseConfig: CaseConfig, protocolId: string | null): ProtocolConfig => {
  if (!protocolId) {
    return caseConfig.protocols[0];
  }
  return caseConfig.protocols.find((protocol) => protocol.id === protocolId) ?? caseConfig.protocols[0];
};

export const usePlannerState = () => {
  const [caseId, setCaseId] = useState<CaseId | null>(null);
  const [protocolId, setProtocolId] = useState<string | null>(null);
  const [localizerSetId, setLocalizerSetId] = useState<string | null>(null);
  const [box, setBox] = useState<PlannerBox | null>(null);
  const [params, setParams] = useState<PlannerParams | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [uploads, setUploads] = useState<UploadMap>(createEmptyUploadMap);
  const [calibrations, setCalibrations] = useState<CalibrationMap>(createEmptyCalibrations);
  const [showTarget, setShowTarget] = useState(false);
  const [showTargetAlways, setShowTargetAlways] = useState(false);
  const [instructorMode, setInstructorMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("Choose case/protocol and start planning.");
  const [statusKind, setStatusKind] = useState<"info" | "warn">("info");
  const [lastScore, setLastScore] = useState<PlannerScore | null>(null);

  useEffect(() => {
    setUploads(readJsonStorage(STORAGE_KEYS.uploads, createEmptyUploadMap()));
    setCalibrations(readJsonStorage(STORAGE_KEYS.calibrations, createEmptyCalibrations()));
  }, []);

  const caseConfig = useMemo<CaseConfig | null>(() => (caseId ? CASE_MAP[caseId] : null), [caseId]);

  const baseProtocol = useMemo<ProtocolConfig | null>(() => {
    if (!caseConfig) {
      return null;
    }
    return getProtocolById(caseConfig, protocolId);
  }, [caseConfig, protocolId]);

  const currentProtocol = useMemo<ProtocolConfig | null>(() => {
    if (!caseId || !baseProtocol) {
      return null;
    }
    return withFallbackTarget(baseProtocol, calibrations[protocolKey(caseId, baseProtocol.id)]);
  }, [baseProtocol, calibrations, caseId]);

  const localizerSet = useMemo(() => {
    if (!caseConfig) {
      return null;
    }
    if (!localizerSetId) {
      return caseConfig.localizerSets[0] ?? null;
    }
    return caseConfig.localizerSets.find((entry) => entry.id === localizerSetId) ?? caseConfig.localizerSets[0] ?? null;
  }, [caseConfig, localizerSetId]);

  const selectCase = useCallback(
    (nextCaseId: CaseId) => {
      const nextCase = CASE_MAP[nextCaseId];
      const nextProtocol = nextCase.protocols[0];
      const nextLocalizerSet = nextCase.localizerSets[0] ?? null;

      setCaseId(nextCaseId);
      setProtocolId(nextProtocol.id);
      setLocalizerSetId(nextLocalizerSet?.id ?? null);
      setBox(deepClone(nextProtocol.initial));
      setParams(deepClone(nextProtocol.initial.params));
      setDrag(null);
      setLastScore(null);
      setShowTarget(false);
      setStatusMessage("Adjust planning box and parameters, then check score.");
      setStatusKind("info");
    },
    []
  );

  const selectProtocol = useCallback(
    (nextProtocolId: string) => {
      if (!caseConfig) {
        return;
      }
      const nextProtocol = getProtocolById(caseConfig, nextProtocolId);
      setProtocolId(nextProtocol.id);
      setBox(deepClone(nextProtocol.initial));
      setParams(deepClone(nextProtocol.initial.params));
      setDrag(null);
      setLastScore(null);
      setShowTarget(false);
      setStatusMessage("Protocol updated. Reposition box and check planning.");
      setStatusKind("info");
    },
    [caseConfig]
  );

  const selectLocalizerSet = useCallback((nextLocalizerSetId: string) => {
    setLocalizerSetId(nextLocalizerSetId);
    setStatusMessage("Localizer set changed.");
    setStatusKind("info");
  }, []);

  const changeParam = useCallback(
    (key: string, value: number) => {
      if (!Number.isFinite(value)) {
        return;
      }

      const spec = currentProtocol?.parameterSpecs.find((entry) => String(entry.key) === key);
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

      setParams((current) => {
        if (!current) {
          return current;
        }
        return {
          ...current,
          [key]: bounded
        };
      });
    },
    [currentProtocol]
  );

  const changeSize = useCallback((axis: keyof PlannerBox["size"], value: number) => {
    setBox((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        size: {
          ...current.size,
          [axis]: clamp(value, 0.2, 1.8)
        }
      };
    });
  }, []);

  const changeRotation = useCallback((axis: keyof PlannerBox["rotation"], value: number) => {
    setBox((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        rotation: {
          ...current.rotation,
          [axis]: clamp(value, -45, 45)
        }
      };
    });
  }, []);

  const beginDrag = useCallback(
    (viewId: ViewId, point: Point2, mode: BoxRenderMode = "cube3d") => {
      if (!box) {
        return false;
      }

      const handle = mode === "flat2d"
        ? hitTestFlat(point, box, viewId)
        : hitTestCube(point, box, viewId);

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
          offsetA: point.x - box.center[axisA],
          offsetB: point.y - box.center[axisB]
        });
        return true;
      }

      if (handle.kind === "edge" && mode === "flat2d") {
        const [axisA, axisB] = FLAT_VIEW_AXES[viewId];
        const angle = inPlaneAngle(box, viewId);
        // Edges 0,2 (horizontal in local space) control axisB
        // Edges 1,3 (vertical in local space) control axisA
        const sizeAxis = handle.index % 2 === 0 ? axisB : axisA;
        const center2D = { x: box.center[axisA], y: box.center[axisB] };
        // Project pointer onto edge normal direction
        const edgeNormalAngle = handle.index % 2 === 0
          ? angle + Math.PI / 2  // horizontal edge -> perpendicular is vertical
          : angle;               // vertical edge -> perpendicular is horizontal
        const dx = point.x - center2D.x;
        const dy = point.y - center2D.y;
        const projected = dx * Math.cos(edgeNormalAngle) + dy * Math.sin(edgeNormalAngle);

        setDrag({
          mode: "resize-edge",
          viewId,
          edgeIndex: handle.index,
          sizeAxis,
          angle,
          initialSize: box.size[sizeAxis],
          initialProjected: projected
        });
        return true;
      }

      if (handle.kind === "corner" && mode === "flat2d") {
        const [axisA, axisB] = FLAT_VIEW_AXES[viewId];
        const angle = inPlaneAngle(box, viewId);
        const center2D = { x: box.center[axisA], y: box.center[axisB] };
        const dx = point.x - center2D.x;
        const dy = point.y - center2D.y;
        // Project onto both local axes (rotated)
        const projA = dx * Math.cos(angle) + dy * Math.sin(angle);
        const projB = -dx * Math.sin(angle) + dy * Math.cos(angle);

        setDrag({
          mode: "resize-corner",
          viewId,
          cornerIndex: handle.index,
          sizeAxisA: axisA,
          sizeAxisB: axisB,
          angle,
          initialSizeA: box.size[axisA],
          initialSizeB: box.size[axisB],
          initialProjectedA: projA,
          initialProjectedB: projB
        });
        return true;
      }

      if (handle.kind === "rotate") {
        const [axisA, axisB] = FLAT_VIEW_AXES[viewId];
        const center2D = { x: box.center[axisA], y: box.center[axisB] };
        const pointerAngle = Math.atan2(point.y - center2D.y, point.x - center2D.x);
        const rotAxis = ROTATION_AXIS_FOR_VIEW[viewId];

        setDrag({
          mode: "rotate",
          viewId,
          rotationAxis: rotAxis,
          initialPointerAngle: pointerAngle,
          initialRotationDeg: box.rotation[rotAxis]
        });
        return true;
      }

      return false;
    },
    [box]
  );

  const moveDrag = useCallback((viewId: ViewId, point: Point2) => {
    setDrag((currentDrag) => {
      if (!currentDrag || currentDrag.viewId !== viewId) {
        return currentDrag;
      }

      if (currentDrag.mode === "move") {
        setBox((currentBox) => {
          if (!currentBox) {
            return currentBox;
          }
          return {
            ...currentBox,
            center: {
              ...currentBox.center,
              [currentDrag.axisA]: clamp(point.x - currentDrag.offsetA, -1, 1),
              [currentDrag.axisB]: clamp(point.y - currentDrag.offsetB, -1, 1)
            }
          };
        });
      } else if (currentDrag.mode === "resize-edge") {
        setBox((currentBox) => {
          if (!currentBox) {
            return currentBox;
          }
          const [axisA, axisB] = FLAT_VIEW_AXES[currentDrag.viewId];
          const center2D = { x: currentBox.center[axisA], y: currentBox.center[axisB] };
          const dx = point.x - center2D.x;
          const dy = point.y - center2D.y;
          const edgeNormalAngle = currentDrag.edgeIndex % 2 === 0
            ? currentDrag.angle + Math.PI / 2
            : currentDrag.angle;
          const projected = dx * Math.cos(edgeNormalAngle) + dy * Math.sin(edgeNormalAngle);
          const newSize = clamp(2 * Math.abs(projected), 0.2, 1.8);
          return {
            ...currentBox,
            size: { ...currentBox.size, [currentDrag.sizeAxis]: newSize }
          };
        });
      } else if (currentDrag.mode === "resize-corner") {
        setBox((currentBox) => {
          if (!currentBox) {
            return currentBox;
          }
          const [axisA, axisB] = FLAT_VIEW_AXES[currentDrag.viewId];
          const center2D = { x: currentBox.center[axisA], y: currentBox.center[axisB] };
          const dx = point.x - center2D.x;
          const dy = point.y - center2D.y;
          const projA = dx * Math.cos(currentDrag.angle) + dy * Math.sin(currentDrag.angle);
          const projB = -dx * Math.sin(currentDrag.angle) + dy * Math.cos(currentDrag.angle);
          const newSizeA = clamp(2 * Math.abs(projA), 0.2, 1.8);
          const newSizeB = clamp(2 * Math.abs(projB), 0.2, 1.8);
          return {
            ...currentBox,
            size: {
              ...currentBox.size,
              [currentDrag.sizeAxisA]: newSizeA,
              [currentDrag.sizeAxisB]: newSizeB
            }
          };
        });
      } else if (currentDrag.mode === "rotate") {
        setBox((currentBox) => {
          if (!currentBox) {
            return currentBox;
          }
          const [axisA, axisB] = FLAT_VIEW_AXES[currentDrag.viewId];
          const center2D = { x: currentBox.center[axisA], y: currentBox.center[axisB] };
          const currentAngle = Math.atan2(point.y - center2D.y, point.x - center2D.x);
          const deltaRad = currentAngle - currentDrag.initialPointerAngle;
          const deltaDeg = (deltaRad * 180) / Math.PI;
          const newRotation = clamp(currentDrag.initialRotationDeg + deltaDeg, -45, 45);
          return {
            ...currentBox,
            rotation: { ...currentBox.rotation, [currentDrag.rotationAxis]: newRotation }
          };
        });
      }

      return currentDrag;
    });
  }, []);

  const endDrag = useCallback(() => {
    setDrag(null);
  }, []);

  const hitTest = useCallback(
    (viewId: ViewId, point: Point2, mode: BoxRenderMode): HandleId | null => {
      if (!box) {
        return null;
      }
      return mode === "flat2d"
        ? hitTestFlat(point, box, viewId)
        : hitTestCube(point, box, viewId);
    },
    [box]
  );

  const checkPlanning = useCallback(() => {
    if (!caseId || !currentProtocol || !box || !params) {
      return;
    }

    const score = computeScore(
      currentProtocol,
      box,
      params,
      Boolean(calibrations[protocolKey(caseId, currentProtocol.id)]),
      caseId
    );

    setShowTarget(true);
    setLastScore(score);
    setStatusKind(score.pass ? "info" : "warn");
    setStatusMessage(
      score.pass
        ? `PASS - ${score.finalScorePercent}% overall`
        : `NOT YET - ${score.finalScorePercent}% overall`
    );
  }, [box, calibrations, caseId, currentProtocol, params]);

  const resetPlan = useCallback(() => {
    if (!baseProtocol) {
      return;
    }
    setBox(deepClone(baseProtocol.initial));
    setParams(deepClone(baseProtocol.initial.params));
    setLastScore(null);
    setShowTarget(false);
    setStatusMessage("Reset to protocol start.");
    setStatusKind("info");
  }, [baseProtocol]);

  const setUploadedView = useCallback(
    (targetCaseId: CaseId, viewId: ViewId, dataUrl: string | null) => {
      setUploads((current) => {
        const next: UploadMap = {
          ...current,
          [targetCaseId]: {
            ...current[targetCaseId],
            [viewId]: dataUrl
          }
        };
        writeJsonStorage(STORAGE_KEYS.uploads, next);
        return next;
      });
    },
    []
  );

  const clearCaseUploads = useCallback(() => {
    if (!caseId) {
      return;
    }
    setUploads((current) => {
      const next: UploadMap = {
        ...current,
        [caseId]: { axial: null, sagittal: null, coronal: null }
      };
      writeJsonStorage(STORAGE_KEYS.uploads, next);
      return next;
    });
    setStatusMessage("Cleared uploaded localizers for selected case.");
    setStatusKind("info");
  }, [caseId]);

  const setCalibrationForCurrent = useCallback(() => {
    if (!instructorMode || !caseId || !currentProtocol || !box || !params) {
      setStatusKind("warn");
      setStatusMessage("Enable instructor mode and select a case/protocol first.");
      return;
    }

    const key = protocolKey(caseId, currentProtocol.id);
    const calibration = {
      center: deepClone(box.center),
      size: deepClone(box.size),
      rotation: deepClone(box.rotation),
      params: deepClone(params)
    };

    setCalibrations((current) => {
      const next: CalibrationMap = { ...current, [key]: calibration };
      writeJsonStorage(STORAGE_KEYS.calibrations, next);
      return next;
    });

    setShowTarget(true);
    setStatusKind("info");
    setStatusMessage("Instructor calibration target saved for this protocol.");
  }, [box, caseId, currentProtocol, instructorMode, params]);

  const resetCalibrationForCurrent = useCallback(() => {
    if (!instructorMode || !caseId || !currentProtocol) {
      setStatusKind("warn");
      setStatusMessage("Enable instructor mode and select a case/protocol first.");
      return;
    }

    const key = protocolKey(caseId, currentProtocol.id);
    setCalibrations((current) => {
      if (!(key in current)) {
        return current;
      }
      const next = { ...current };
      delete next[key];
      writeJsonStorage(STORAGE_KEYS.calibrations, next);
      return next;
    });

    setStatusKind("info");
    setStatusMessage("Calibration reset. Default protocol target active.");
  }, [caseId, currentProtocol, instructorMode]);

  const exportLastScore = useCallback(() => {
    if (!caseId || !currentProtocol || !lastScore) {
      setStatusKind("warn");
      setStatusMessage("Run scoring once before export.");
      return;
    }

    downloadJson(`mri-score-${caseId}-${currentProtocol.id}-${Date.now()}.json`, lastScore);
  }, [caseId, currentProtocol, lastScore]);

  const getImageSource = useCallback(
    (viewId: ViewId): string => {
      if (!caseId) {
        return "";
      }

      const uploaded = uploads[caseId][viewId];
      if (uploaded) {
        return uploaded;
      }

      if (localizerSet) {
        return localizerSet.views[viewId];
      }

      return "";
    },
    [caseId, localizerSet, uploads]
  );

  const calibrationActive = useMemo(() => {
    if (!caseId || !currentProtocol) {
      return false;
    }
    return Boolean(calibrations[protocolKey(caseId, currentProtocol.id)]);
  }, [calibrations, caseId, currentProtocol]);

  return {
    cases: CASES,
    caseId,
    caseConfig,
    protocolId: currentProtocol?.id ?? null,
    currentProtocol,
    localizerSetId: localizerSet?.id ?? null,
    localizerSet,
    box,
    params,
    showTarget,
    setShowTarget,
    showTargetAlways,
    setShowTargetAlways,
    instructorMode,
    setInstructorMode,
    statusMessage,
    statusKind,
    lastScore,
    calibrationActive,
    beginDrag,
    moveDrag,
    endDrag,
    hitTest,
    selectCase,
    selectProtocol,
    selectLocalizerSet,
    changeParam,
    changeSize,
    changeRotation,
    checkPlanning,
    resetPlan,
    setUploadedView,
    clearCaseUploads,
    setCalibrationForCurrent,
    resetCalibrationForCurrent,
    exportLastScore,
    getImageSource
  };
};
