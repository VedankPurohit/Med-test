import { NextResponse } from "next/server";
import { buildContributionZipBytes } from "@/features/contribution/lib/export";
import {
  MAX_TOTAL_VIEW_BYTES,
  VIEW_IDS,
  createSimpleRateLimiter,
  parseContributionPayload,
  toContributionDraft,
  toContributionImageInput,
  validateViewFile
} from "@/features/contribution/lib/exportApi";
import { buildContributionManifest } from "@/features/contribution/lib/manifest";
import { validateContributionDraft } from "@/features/contribution/lib/validation";
import { ContributionExportError } from "@/features/contribution/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const exportRateLimiter = createSimpleRateLimiter(10, 10 * 60 * 1000);

const jsonError = (status: number, error: ContributionExportError, extraHeaders?: Record<string, string>) =>
  NextResponse.json(error, { status, headers: extraHeaders });

const getIpKey = (request: Request): string =>
  request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  request.headers.get("x-real-ip")?.trim() ||
  "unknown";

export async function POST(request: Request) {
  const rate = exportRateLimiter.consume(getIpKey(request));
  if (!rate.ok) {
    return jsonError(
      429,
      {
        code: "RATE_LIMITED",
        message: "Too many export requests. Please retry later."
      },
      { "Retry-After": String(rate.retryAfterSeconds) }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, {
      code: "BAD_MULTIPART",
      message: "Request body must be multipart/form-data."
    });
  }

  const parsedPayload = parseContributionPayload(formData.get("payload"));
  if (!parsedPayload.ok) {
    return jsonError(422, parsedPayload.error);
  }

  const payload = parsedPayload.payload;
  if (!payload.phiAttestation) {
    return jsonError(422, {
      code: "PHI_ATTESTATION_REQUIRED",
      message: "PHI attestation is required before export."
    });
  }

  const files: Record<string, File> = {};
  let totalSize = 0;

  for (const viewId of VIEW_IDS) {
    const fileCheck = validateViewFile(formData.get(viewId), viewId);
    if (!fileCheck.ok) {
      return jsonError(422, fileCheck.error);
    }
    files[viewId] = fileCheck.file;
    totalSize += fileCheck.file.size;
  }

  if (totalSize > MAX_TOTAL_VIEW_BYTES) {
    return jsonError(413, {
      code: "TOTAL_FILE_SIZE_TOO_LARGE",
      message: `Combined image size exceeds ${MAX_TOTAL_VIEW_BYTES} bytes.`
    });
  }

  try {
    const imageInputs = {
      axial: await toContributionImageInput(files.axial),
      sagittal: await toContributionImageInput(files.sagittal),
      coronal: await toContributionImageInput(files.coronal)
    };

    const draft = toContributionDraft(payload, imageInputs);
    const issues = validateContributionDraft(draft);
    if (issues.length > 0) {
      return jsonError(422, {
        code: "VALIDATION_FAILED",
        message: `Draft validation failed with ${issues.length} issue(s).`,
        details: issues
      });
    }

    const manifest = buildContributionManifest(draft, {
      sourceAppVersion: payload.sourceAppVersion
    });

    const bytes = await buildContributionZipBytes(manifest, {
      axial: imageInputs.axial.bytes,
      sagittal: imageInputs.sagittal.bytes,
      coronal: imageInputs.coronal.bytes
    });

    const fileName = `contribution-${manifest.anatomy.primaryType}-${Date.now()}.zip`;
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "X-Export-File-Name": fileName
      }
    });
  } catch (error) {
    return jsonError(500, {
      code: "EXPORT_FAILED",
      message: error instanceof Error ? error.message : "Export generation failed."
    });
  }
}

