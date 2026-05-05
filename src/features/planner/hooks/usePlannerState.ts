"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CASE_MAP, CASES } from "@/features/planner/data/planner-config";
import {
  FLAT_VIEW_AXES,
  getFlatGeometry,
  clamp,
  getProjectedGeometry,
  hitTestCube,
  hitTestFlat,
  VIEW_CONFIG
} from "@/features/planner/lib/geometry";
import { deepClone, withFallbackTarget } from "@/features/planner/lib/scoring";
import {
  getSavedPlacement,
  placementKey,
  savePlacementSnapshot,
  type PlacementMap
} from "@/features/planner/lib/protocolPlacements";
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
  PlannerScoreRequest,
  PlannerScoreResponse,
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
  | { mode: "rotate"; viewId: ViewId; rotationAxis: keyof Rotation3; initialPointerAngle: number; initialRotationDeg: number };

const ROTATION_AXIS_FOR_VIEW: Record<ViewId, keyof Rotation3> = {
  axial: "rz",
  sagittal: "rx",
  coronal: "ry"
};
const protocolKey = placementKey;
const isLikelyImageSource = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") {
    return false;
  }
  return (
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  );
};

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
  const [showTargetAlwaysState, setShowTargetAlwaysState] = useState(false);
  const [canRevealTarget, setCanRevealTarget] = useState(false);
  const [instructorMode, setInstructorMode] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("Choose case/protocol and start planning.");
  const [statusKind, setStatusKind] = useState<"info" | "warn">("info");
  const [lastScore, setLastScore] = useState<PlannerScore | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [savedPlacements, setSavedPlacements] = useState<PlacementMap>({});

  // Refs for stable callbacks that need to read current state without re-creating
  const boxRef = useRef(box);
  boxRef.current = box;
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const lastScoreRef = useRef(lastScore);
  lastScoreRef.current = lastScore;
  const caseIdRef = useRef(caseId);
  caseIdRef.current = caseId;
  const protocolIdRef = useRef(protocolId);
  protocolIdRef.current = protocolId;
  const savedPlacementsRef = useRef(savedPlacements);
  savedPlacementsRef.current = savedPlacements;

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
      const nextPlacements = savePlacementSnapshot(savedPlacementsRef.current, {
        caseId: caseIdRef.current,
        protocolId: protocolIdRef.current,
        box: boxRef.current,
        params: paramsRef.current,
        lastScore: lastScoreRef.current
      });
      if (nextPlacements !== savedPlacementsRef.current) {
        setSavedPlacements(nextPlacements);
      }
      const restored = getSavedPlacement(nextPlacements, nextCaseId, nextProtocol.id);

      setCaseId(nextCaseId);
      setProtocolId(nextProtocol.id);
      setLocalizerSetId(nextLocalizerSet?.id ?? null);
      if (restored) {
        setBox(restored.box);
        setParams(restored.params);
        setLastScore(restored.lastScore);
        setStatusMessage("Restored previous placement.");
      } else {
        setBox(deepClone(nextProtocol.initial));
        setParams(deepClone(nextProtocol.initial.params));
        setLastScore(null);
        setStatusMessage("Adjust planning box and parameters, then check score.");
      }
      setDrag(null);
      setShowTarget(false);
      setShowTargetAlwaysState(false);
      setCanRevealTarget(false);
      setStatusKind("info");
    },
    []
  );

  const saveCurrent = useCallback(() => {
    const nextPlacements = savePlacementSnapshot(savedPlacementsRef.current, {
      caseId: caseIdRef.current,
      protocolId: protocolIdRef.current,
      box: boxRef.current,
      params: paramsRef.current,
      lastScore: lastScoreRef.current
    });
    if (nextPlacements !== savedPlacementsRef.current) {
      setSavedPlacements(nextPlacements);
    }
  }, []);

  const selectProtocol = useCallback(
    (nextProtocolId: string) => {
      if (!caseConfig) {
        return;
      }

      // Save current placement before switching (skip if same protocol, e.g. after selectCase)
      const curCaseId = caseIdRef.current;
      const nextPlacements = savePlacementSnapshot(
        savedPlacementsRef.current,
        {
          caseId: curCaseId,
          protocolId: protocolIdRef.current,
          box: boxRef.current,
          params: paramsRef.current,
          lastScore: lastScoreRef.current
        },
        { skipProtocolId: nextProtocolId }
      );
      if (nextPlacements !== savedPlacementsRef.current) {
        setSavedPlacements(nextPlacements);
      }

      if (!curCaseId) {
        return;
      }

      const nextProtocol = getProtocolById(caseConfig, nextProtocolId);

      setProtocolId(nextProtocol.id);
      setDrag(null);
      setShowTarget(false);
      setShowTargetAlwaysState(false);
      setCanRevealTarget(false);

      // Restore saved placement or use initial
      const saved = getSavedPlacement(nextPlacements, curCaseId, nextProtocolId);
      if (saved) {
        setBox(saved.box);
        setParams(saved.params);
        setLastScore(saved.lastScore);
        setStatusMessage("Restored previous placement.");
        setStatusKind("info");
      } else {
        setBox(deepClone(nextProtocol.initial));
        setParams(deepClone(nextProtocol.initial.params));
        setLastScore(null);
        setStatusMessage("Protocol updated. Reposition box and check planning.");
        setStatusKind("info");
      }
    },
    [caseConfig]
  );

  const selectLocalizerSet = useCallback((nextLocalizerSetId: string) => {
    setLocalizerSetId(nextLocalizerSetId);
    setStatusMessage("Localizer set changed.");
    setStatusKind("info");
  }, []);

  const setShowTargetAlways = useCallback((next: boolean) => {
    if (next && !(canRevealTarget || instructorMode)) {
      setStatusKind("warn");
      setStatusMessage("Run scoring first to reveal the target.");
      return;
    }
    setShowTargetAlwaysState(next);
  }, [canRevealTarget, instructorMode]);

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
          // Generous bounds (~12.5 mm – 1000 mm at NORM_TO_MM = 250) so the
          // box can extend along the slice axis as Slices/Thickness/Gap grow,
          // while keeping a small floor that prevents collapse on bad input.
          [axis]: clamp(value, 0.05, 4.0)
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

      // Resize-via-UI is intentionally disabled: the canvas only supports move
      // and rotate gestures. Box size is parameter-driven (Slices,
      // SliceThickness, SliceGap on the slice axis; FOV in-plane) and is
      // updated through the DynamicParameterPanel inputs.
      if (handle.kind === "edge" || handle.kind === "corner") {
        return false;
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

  const checkPlanning = useCallback(async () => {
    if (!caseId || !currentProtocol || !box || !params) {
      return;
    }

    const calibration = calibrations[protocolKey(caseId, currentProtocol.id)];
    const payload: PlannerScoreRequest = {
      caseId,
      protocolId: currentProtocol.id,
      box,
      params,
      calibrationTarget: calibration,
      instructorMode
    };

    setIsChecking(true);

    try {
      const response = await fetch("/api/v1/planner/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        let message = `Scoring failed (${response.status}).`;
        try {
          const data = await response.json();
          if (typeof data?.message === "string") {
            message = data.message;
          }
        } catch {
          // Keep fallback message.
        }
        throw new Error(message);
      }

      const data = (await response.json()) as PlannerScoreResponse;
      const revealTarget = Boolean(data.revealTarget) || instructorMode;
      setCanRevealTarget(revealTarget);
      setShowTarget(revealTarget);
      setLastScore(data.score);
      setStatusKind(data.score.pass ? "info" : "warn");
      setStatusMessage(
        data.score.pass
          ? `PASS - ${data.score.finalScorePercent}% overall`
          : `NOT YET - ${data.score.finalScorePercent}% overall`
      );
    } catch (error) {
      setStatusKind("warn");
      setStatusMessage(error instanceof Error ? error.message : "Scoring failed.");
    } finally {
      setIsChecking(false);
    }
  }, [box, calibrations, caseId, currentProtocol, instructorMode, params]);

  const resetPlan = useCallback(() => {
    if (!baseProtocol) {
      return;
    }
    setBox(deepClone(baseProtocol.initial));
    setParams(deepClone(baseProtocol.initial.params));
    setLastScore(null);
    setShowTarget(false);
    setShowTargetAlwaysState(false);
    setCanRevealTarget(false);
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
    setCanRevealTarget(true);
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
    setCanRevealTarget(false);
    setShowTarget(false);
    setShowTargetAlwaysState(false);
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
      if (uploaded && isLikelyImageSource(uploaded)) {
        return uploaded;
      }

      if (localizerSet) {
        return localizerSet.views[viewId];
      }

      return "";
    },
    [caseId, localizerSet, uploads]
  );

  const getAllPlacements = useCallback(() => {
    return savePlacementSnapshot(savedPlacementsRef.current, {
      caseId: caseIdRef.current,
      protocolId: protocolIdRef.current,
      box: boxRef.current,
      params: paramsRef.current,
      lastScore: lastScoreRef.current
    });
  }, []);

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
    showTargetAlways: showTargetAlwaysState,
    setShowTargetAlways,
    canRevealTarget,
    instructorMode,
    setInstructorMode,
    statusMessage,
    statusKind,
    isChecking,
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
    getImageSource,
    savedPlacements,
    saveCurrent,
    getAllPlacements
  };
};
