"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CASE_MAP, CASES } from "@/features/planner/data/planner-config";
import {
  clamp,
  getProjectedGeometry,
  pointInPolygon,
  squaredDistance,
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
  CalibrationMap,
  CaseConfig,
  CaseId,
  PlannerBox,
  PlannerParams,
  PlannerScore,
  Point2,
  ProtocolConfig,
  UploadMap,
  ViewId
} from "@/features/planner/types/planner";
import { downloadJson } from "@/features/planner/lib/media";

type DragState = {
  viewId: ViewId;
  axisA: keyof PlannerBox["center"];
  axisB: keyof PlannerBox["center"];
  offsetA: number;
  offsetB: number;
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

  const changeParam = useCallback((key: keyof PlannerParams, value: number) => {
    if (!Number.isFinite(value)) {
      return;
    }

    setParams((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        [key]: key === "Slices" ? Math.max(1, Math.round(value)) : value
      };
    });
  }, []);

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
    (viewId: ViewId, point: Point2) => {
      if (!box) {
        return false;
      }

      const geometry = getProjectedGeometry(box, viewId);
      const hit = pointInPolygon(point, geometry.hull) || squaredDistance(point, geometry.center2D) <= 0.02;
      if (!hit) {
        return false;
      }

      const [axisA, axisB] = VIEW_CONFIG[viewId].moveAxes;
      setDrag({
        viewId,
        axisA,
        axisB,
        offsetA: point.x - box.center[axisA],
        offsetB: point.y - box.center[axisB]
      });

      return true;
    },
    [box]
  );

  const moveDrag = useCallback((viewId: ViewId, point: Point2) => {
    setDrag((currentDrag) => {
      if (!currentDrag || currentDrag.viewId !== viewId) {
        return currentDrag;
      }

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

      return currentDrag;
    });
  }, []);

  const endDrag = useCallback(() => {
    setDrag(null);
  }, []);

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
