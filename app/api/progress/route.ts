import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

import { getLocalDate } from "@/lib/dates";
import {
  normalizeProgressData,
  reduceProgressAction,
  type ProgressAction,
  type StudyProgressRecord,
} from "@/lib/study";

const DATA_PATH = path.join(process.cwd(), "data", "progress.json");

type ProgressData = Record<string, StudyProgressRecord>;

type LegacyBody = {
  id: number;
  status?: "solved" | "review" | null;
  note?: string;
  confidence?: 1 | 2 | 3 | 4;
};

type ActionBody = {
  id: number;
  action: ProgressAction;
};

function readProgress(): ProgressData {
  try {
    const raw = fs.readFileSync(DATA_PATH, "utf-8");
    return normalizeProgressData(JSON.parse(raw) as Record<string, Record<string, unknown>>);
  } catch {
    return {};
  }
}

function writeProgress(data: ProgressData) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function isActionBody(body: unknown): body is ActionBody {
  return typeof body === "object" && body !== null && "action" in body;
}

function mapLegacyBodyToAction(body: LegacyBody): ProgressAction | null {
  if (body.note !== undefined) {
    return { type: "save-note", note: body.note };
  }

  if (body.confidence !== undefined) {
    return {
      type: body.status ? "rate-review" : "complete-solve",
      confidence: body.confidence,
    };
  }

  if (body.status === "solved") {
    return { type: "start-solve" };
  }

  if (body.status === "review") {
    return { type: "schedule", scheduledDate: getLocalDate() };
  }

  if (body.status === null) {
    return { type: "clear-progress" };
  }

  return null;
}

export async function GET() {
  return NextResponse.json(readProgress());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const id = typeof body?.id === "number" ? body.id : null;

  if (id === null) {
    return NextResponse.json({ ok: false, error: "Problem id is required." }, { status: 400 });
  }

  const data = readProgress();
  const key = String(id);
  const action = isActionBody(body) ? body.action : mapLegacyBodyToAction(body as LegacyBody);

  if (!action) {
    return NextResponse.json({ ok: false, error: "Unsupported progress update." }, { status: 400 });
  }

  const record = reduceProgressAction({
    existing: data[key],
    action,
    today: getLocalDate(),
  });

  data[key] = record;
  writeProgress(data);

  return NextResponse.json({ ok: true, record });
}

export type { ProgressData };
