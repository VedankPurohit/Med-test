import { CalibrationMap, UploadMap } from "@/features/planner/types/planner";

export const STORAGE_KEYS = {
  uploads: "mriTrainerUploadedLocalizersV2",
  calibrations: "mriTrainerCalibratedTargetsV2"
} as const;

const isBrowser = (): boolean => typeof window !== "undefined";

export const readJsonStorage = <T>(key: string, fallback: T): T => {
  if (!isBrowser()) {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return fallback;
  }
};

export const writeJsonStorage = (key: string, value: unknown): void => {
  if (!isBrowser()) {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const createEmptyUploadMap = (): UploadMap => ({
  brain: { axial: null, sagittal: null, coronal: null },
  cspine: { axial: null, sagittal: null, coronal: null },
  tspine: { axial: null, sagittal: null, coronal: null },
  lspine: { axial: null, sagittal: null, coronal: null },
  knee: { axial: null, sagittal: null, coronal: null }
});

export const createEmptyCalibrations = (): CalibrationMap => ({});
