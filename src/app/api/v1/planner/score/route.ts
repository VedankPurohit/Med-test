import { NextResponse } from "next/server";
import { parsePlannerScorePayload, scorePlannerRequest } from "@/features/planner/lib/scoreApi";

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

  const parsed = parsePlannerScorePayload(payload);
  if (!parsed.ok) {
    return NextResponse.json(parsed.error, { status: 422 });
  }

  const scored = scorePlannerRequest(parsed.value);
  if (!scored.ok) {
    return NextResponse.json(scored.error, { status: 422 });
  }

  return NextResponse.json(scored.data, { status: 200 });
}

