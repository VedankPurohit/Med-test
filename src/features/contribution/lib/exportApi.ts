import {
  ContributionDraft,
  ContributionExportError,
  ContributionExportPayload,
  ContributionImageInput
} from "@/features/contribution/types";
import { ViewId } from "@/features/planner/types/planner";

export const VIEW_IDS: ViewId[] = ["axial", "sagittal", "coronal"];
export const MAX_VIEW_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_TOTAL_VIEW_BYTES = 45 * 1024 * 1024;
export const ALLOWED_VIEW_MIME_TYPES = new Set<string>(["image/png", "image/jpeg", "image/webp"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isProtocolShape = (value: unknown): boolean => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.label === "string" &&
    (value.origin === "existing" || value.origin === "custom") &&
    Array.isArray(value.parameterSpecs) &&
    isRecord(value.parameterValues)
  );
};

const isPayloadShape = (value: unknown): value is ContributionExportPayload => {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.createdAt === "string" &&
    typeof value.sourceAppVersion === "string" &&
    typeof value.phiAttestation === "boolean" &&
    isRecord(value.anatomy) &&
    typeof value.anatomy.primaryType === "string" &&
    Array.isArray(value.protocols) &&
    value.protocols.every((entry) => isProtocolShape(entry)) &&
    isRecord(value.placements)
  );
};

export const parseContributionPayload = (
  payloadRaw: FormDataEntryValue | null
): { ok: true; payload: ContributionExportPayload } | { ok: false; error: ContributionExportError } => {
  if (typeof payloadRaw !== "string") {
    return {
      ok: false,
      error: {
        code: "MISSING_PAYLOAD",
        message: "Missing JSON payload field."
      }
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(payloadRaw);
  } catch {
    return {
      ok: false,
      error: {
        code: "INVALID_PAYLOAD",
        message: "Payload is not valid JSON."
      }
    };
  }

  if (!isPayloadShape(parsed)) {
    return {
      ok: false,
      error: {
        code: "INVALID_PAYLOAD",
        message: "Payload does not match expected shape."
      }
    };
  }

  return {
    ok: true,
    payload: parsed
  };
};

export const validateViewFile = (
  fileRaw: FormDataEntryValue | null,
  viewId: ViewId
): { ok: true; file: File } | { ok: false; error: ContributionExportError } => {
  if (!(fileRaw instanceof File)) {
    return {
      ok: false,
      error: {
        code: "MISSING_VIEW_FILE",
        message: `Missing ${viewId} image file.`
      }
    };
  }

  if (!ALLOWED_VIEW_MIME_TYPES.has(fileRaw.type)) {
    return {
      ok: false,
      error: {
        code: "INVALID_VIEW_FILE",
        message: `${viewId} image mime type '${fileRaw.type || "unknown"}' is not allowed.`
      }
    };
  }

  if (!Number.isFinite(fileRaw.size) || fileRaw.size <= 0) {
    return {
      ok: false,
      error: {
        code: "INVALID_VIEW_FILE",
        message: `${viewId} image file is empty or invalid.`
      }
    };
  }

  if (fileRaw.size > MAX_VIEW_FILE_BYTES) {
    return {
      ok: false,
      error: {
        code: "VIEW_FILE_TOO_LARGE",
        message: `${viewId} image exceeds ${MAX_VIEW_FILE_BYTES} bytes.`
      }
    };
  }

  return { ok: true, file: fileRaw };
};

export const sanitizeFileName = (value: string): string => {
  const base = value.split(/[\\/]/).pop() ?? "";
  const clean = base
    .trim()
    .replace(/[^\w.-]+/g, "_")
    .replace(/^_+/, "")
    .replace(/_+$/, "");
  return clean || "image.bin";
};

export const toContributionImageInput = async (file: File): Promise<ContributionImageInput> => {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  return {
    fileName: sanitizeFileName(file.name),
    mimeType,
    sizeBytes: file.size,
    // Server export path only needs binary bytes; dataUrl is optional for validation.
    dataUrl: "",
    bytes
  };
};

export const toContributionDraft = (
  payload: ContributionExportPayload,
  views: Record<ViewId, ContributionImageInput>
): ContributionDraft => ({
  createdAt: payload.createdAt,
  anatomy: payload.anatomy,
  views,
  protocols: payload.protocols,
  placements: payload.placements
});

type RateWindow = { count: number; resetAt: number };

export const createSimpleRateLimiter = (maxRequests: number, windowMs: number) => {
  const windows = new Map<string, RateWindow>();

  const consume = (key: string, now = Date.now()): { ok: true } | { ok: false; retryAfterSeconds: number } => {
    const current = windows.get(key);
    if (!current || now >= current.resetAt) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true };
    }

    if (current.count >= maxRequests) {
      return {
        ok: false,
        retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000))
      };
    }

    current.count += 1;
    windows.set(key, current);
    return { ok: true };
  };

  const clear = () => windows.clear();

  return { consume, clear };
};
