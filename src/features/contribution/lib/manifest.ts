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

const protocolToManifest = (
  protocol: ContributionDraft["protocols"][number],
  placement: NonNullable<ContributionDraft["placements"][string]>,
  placementZipPath: string
): ContributionManifestProtocol => {
  return {
    id: protocol.id,
    label: protocol.label,
    origin: protocol.origin,
    sourcePlannerCaseId: protocol.sourcePlannerCaseId,
    sourcePlannerProtocolId: protocol.sourcePlannerProtocolId,
    notes: protocol.notes,
    parameterSpecs: protocol.parameterSpecs,
    parameterValues: protocol.parameterValues,
    placementZipPath,
    placement
  };
};

const buildPlacementZipPaths = (protocolIds: string[]): string[] => {
  const counts = new Map<string, number>();

  return protocolIds.map((protocolId, index) => {
    const base = slugifyId(protocolId);
    const seen = (counts.get(base) ?? 0) + 1;
    counts.set(base, seen);

    const collisionSuffix = seen > 1 ? `-${seen}` : "";
    const orderedPrefix = String(index + 1).padStart(2, "0");
    return `protocols/${orderedPrefix}-${base}${collisionSuffix}/placement.json`;
  });
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

  const placementPaths = buildPlacementZipPaths(draft.protocols.map((protocol) => protocol.id));

  const protocols = draft.protocols.map((protocol, index) => {
    const placement = draft.placements[protocol.id];
    if (!placement) {
      throw new Error(`Missing required placement for protocol ${protocol.id}.`);
    }
    return protocolToManifest(protocol, placement, placementPaths[index]);
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
      viewCount: VIEW_IDS.length
    }
  };
};
