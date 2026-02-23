import JSZip from "jszip";
import { ContributionManifestV1 } from "@/features/contribution/types";
import { ViewId } from "@/features/planner/types/planner";

const VIEW_IDS: ViewId[] = ["axial", "sagittal", "coronal"];

const assertRequiredViewBytes = (
  viewBytes: Record<ViewId, Uint8Array>,
  viewId: ViewId
): Uint8Array => {
  const bytes = viewBytes[viewId];
  if (!(bytes instanceof Uint8Array) || bytes.length === 0) {
    throw new Error(`Missing binary bytes for ${viewId}.`);
  }
  return bytes;
};

export const buildContributionZipBytes = async (
  manifest: ContributionManifestV1,
  viewBytes: Record<ViewId, Uint8Array>
): Promise<Uint8Array> => {
  const zip = new JSZip();

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  for (const viewId of VIEW_IDS) {
    const bytes = assertRequiredViewBytes(viewBytes, viewId);
    zip.file(manifest.views[viewId].zipPath, bytes);
  }

  for (const protocol of manifest.protocols) {
    zip.file(protocol.placementZipPath, JSON.stringify(protocol.placement, null, 2));
  }

  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE", compressionOptions: { level: 9 } });
};

export const buildContributionZipBlob = async (
  manifest: ContributionManifestV1,
  viewBytes: Record<ViewId, Uint8Array>
): Promise<Blob> => {
  const bytes = await buildContributionZipBytes(manifest, viewBytes);
  return new Blob([bytes], { type: "application/zip" });
};

export const downloadBlob = (fileName: string, blob: Blob): void => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
};
