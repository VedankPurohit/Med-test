import {
  ContributionDraft,
  ContributionManifestProtocol,
  ContributionManifestV1,
  ContributionManifestView
} from "@/features/contribution/types";
import { ViewId } from "@/features/planner/types/planner";

const VIEW_IDS: ViewId[] = ["axial", "sagittal", "coronal"];

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg"
};

export const slugifyId = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  const slug = trimmed
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
  return slug || "protocol";
};

const extensionForImage = (mimeType: string, fileName: string): string => {
  if (MIME_EXT[mimeType]) {
    return MIME_EXT[mimeType];
  }

  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext && /^[a-z0-9]+$/.test(ext)) {
    return ext;
  }

  return "bin";
};

const viewToManifest = (
  viewId: ViewId,
  image: NonNullable<ContributionDraft["views"][ViewId]>
): ContributionManifestView => {
  const ext = extensionForImage(image.mimeType, image.fileName);

  return {
    viewId,
    zipPath: `images/${viewId}.${ext}`,
    originalFileName: image.fileName,
    mimeType: image.mimeType,
    sizeBytes: image.sizeBytes
  };
};

const protocolToManifest = (protocol: ContributionDraft["protocols"][number], placement: NonNullable<ContributionDraft["placements"][string]>): ContributionManifestProtocol => {
  const safeId = slugifyId(protocol.id);

  return {
    id: protocol.id,
    label: protocol.label,
    origin: protocol.origin,
    sourcePlannerCaseId: protocol.sourcePlannerCaseId,
    sourcePlannerProtocolId: protocol.sourcePlannerProtocolId,
    notes: protocol.notes,
    parameterSpecs: protocol.parameterSpecs,
    parameterValues: protocol.parameterValues,
    placementZipPath: `protocols/${safeId}/placement.json`,
    placement
  };
};

export const buildContributionManifest = (
  draft: ContributionDraft,
  options: { sourceAppVersion: string; createdAt?: string }
): ContributionManifestV1 => {
  const views = Object.fromEntries(
    VIEW_IDS.map((viewId) => {
      const image = draft.views[viewId];
      if (!image) {
        throw new Error(`Missing required image for ${viewId}.`);
      }
      return [viewId, viewToManifest(viewId, image)];
    })
  ) as ContributionManifestV1["views"];

  const protocols = draft.protocols.map((protocol) => {
    const placement = draft.placements[protocol.id];
    if (!placement) {
      throw new Error(`Missing required placement for protocol ${protocol.id}.`);
    }
    return protocolToManifest(protocol, placement);
  });

  return {
    schemaVersion: 1,
    createdAt: options.createdAt ?? new Date().toISOString(),
    sourceAppVersion: options.sourceAppVersion,
    anatomy: draft.anatomy,
    views,
    protocols,
    exportMeta: {
      protocolCount: protocols.length,
      viewCount: 3
    }
  };
};
