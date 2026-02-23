import { ContributionDraft, ValidationIssue } from "@/features/contribution/types";
import { validateProtocolConfig } from "@/features/planner/lib/validation";
import { ProtocolConfig } from "@/features/planner/types/planner";

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const toProtocolConfig = (draftProtocol: ContributionDraft["protocols"][number]): ProtocolConfig => {
  const params = draftProtocol.parameterValues;

  return {
    id: draftProtocol.id,
    label: draftProtocol.label,
    target: {
      center: { x: 0, y: 0, z: 0 },
      size: { x: 1, y: 1, z: 1 },
      rotation: { rx: 0, ry: 0, rz: 0 },
      params
    },
    initial: {
      center: { x: 0, y: 0, z: 0 },
      size: { x: 1, y: 1, z: 1 },
      rotation: { rx: 0, ry: 0, rz: 0 },
      params
    },
    tolerances: {
      center: 0.2,
      size: 0.2,
      rotation: 15,
      param: 0.2
    },
    parameterSpecs: draftProtocol.parameterSpecs
  };
};

const push = (
  issues: ValidationIssue[],
  code: string,
  field: string,
  message: string,
  severity: ValidationIssue["severity"] = "error"
): void => {
  issues.push({ code, field, message, severity });
};

export const validateContributionDraft = (draft: ContributionDraft): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];

  if (draft.anatomy.primaryType === "other" && !draft.anatomy.customTypeText?.trim()) {
    push(issues, "ANATOMY_CUSTOM_REQUIRED", "anatomy.customTypeText", "Custom anatomy text is required when type is 'other'.");
  }

  for (const [viewId, image] of Object.entries(draft.views)) {
    if (!image) {
      push(issues, "VIEW_REQUIRED", `views.${viewId}`, `Missing required ${viewId} image.`);
      continue;
    }

    if (!image.fileName.trim()) {
      push(issues, "VIEW_FILENAME_REQUIRED", `views.${viewId}.fileName`, `Missing filename for ${viewId} image.`);
    }
    if (!image.mimeType.trim()) {
      push(issues, "VIEW_MIME_REQUIRED", `views.${viewId}.mimeType`, `Missing mime type for ${viewId} image.`);
    }
    if (!finite(image.sizeBytes) || image.sizeBytes <= 0) {
      push(issues, "VIEW_SIZE_INVALID", `views.${viewId}.sizeBytes`, `Invalid file size for ${viewId} image.`);
    }
    if (image.dataUrl && !image.dataUrl.startsWith("data:image/")) {
      push(issues, "VIEW_DATAURL_INVALID", `views.${viewId}.dataUrl`, `${viewId} image must be a valid image data URL.`);
    }
    if (!(image.bytes instanceof Uint8Array) || image.bytes.length === 0) {
      push(issues, "VIEW_BYTES_INVALID", `views.${viewId}.bytes`, `Missing binary bytes for ${viewId} image.`);
    }
  }

  if (draft.protocols.length === 0) {
    push(issues, "PROTOCOLS_REQUIRED", "protocols", "At least one protocol must be selected.");
  }

  const seenIds = new Set<string>();

  for (const protocol of draft.protocols) {
    if (!protocol.id.trim()) {
      push(issues, "PROTOCOL_ID_REQUIRED", "protocols.id", "Protocol id is required.");
      continue;
    }

    if (seenIds.has(protocol.id)) {
      push(issues, "PROTOCOL_ID_DUPLICATE", `protocols.${protocol.id}`, `Duplicate protocol id '${protocol.id}'.`);
      continue;
    }
    seenIds.add(protocol.id);

    if (!protocol.label.trim()) {
      push(issues, "PROTOCOL_LABEL_REQUIRED", `protocols.${protocol.id}.label`, "Protocol label is required.");
    }

    const protocolErrors = validateProtocolConfig(toProtocolConfig(protocol));
    for (const error of protocolErrors) {
      push(issues, "PROTOCOL_SPEC_INVALID", `protocols.${protocol.id}.parameterSpecs`, error);
    }

    for (const spec of protocol.parameterSpecs) {
      const key = String(spec.key);
      const value = protocol.parameterValues[key];
      if (!finite(value)) {
        push(issues, "PROTOCOL_PARAM_VALUE_INVALID", `protocols.${protocol.id}.parameterValues.${key}`, `Invalid value for parameter '${key}'.`);
        continue;
      }
      if (spec.min !== undefined && value < spec.min) {
        push(issues, "PROTOCOL_PARAM_OUT_OF_RANGE", `protocols.${protocol.id}.parameterValues.${key}`, `Parameter '${key}' is below minimum ${spec.min}.`);
      }
      if (spec.max !== undefined && value > spec.max) {
        push(issues, "PROTOCOL_PARAM_OUT_OF_RANGE", `protocols.${protocol.id}.parameterValues.${key}`, `Parameter '${key}' is above maximum ${spec.max}.`);
      }
    }

    const placement = draft.placements[protocol.id];
    if (!placement) {
      push(issues, "PLACEMENT_REQUIRED", `placements.${protocol.id}`, `Placement is missing for protocol '${protocol.label}'.`);
      continue;
    }

    for (const spec of protocol.parameterSpecs) {
      const key = String(spec.key);
      const value = placement.params[key];
      if (!finite(value)) {
        push(issues, "PLACEMENT_PARAM_INVALID", `placements.${protocol.id}.params.${key}`, `Placement parameter '${key}' is missing or invalid.`);
      }
    }
  }

  return issues;
};
