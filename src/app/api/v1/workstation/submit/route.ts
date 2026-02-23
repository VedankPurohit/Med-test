import { NextResponse } from "next/server";
import {
  buildSubmissionSummaryResponse,
  parseBuildSubmissionSummaryRequest
} from "@/features/workstation/lib/summaryApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      {
        code: "INVALID_PAYLOAD",
        message: "Request body must be JSON."
      },
      { status: 400 }
    );
  }

  const parsed = parseBuildSubmissionSummaryRequest(payload);
  if (!parsed.ok) {
    return NextResponse.json(parsed.error, { status: 422 });
  }

  const response = buildSubmissionSummaryResponse(parsed.value);
  return NextResponse.json(response, { status: 200 });
}

