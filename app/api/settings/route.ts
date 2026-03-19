import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

import { normalizeSettings, type StudySettings } from "@/lib/study";

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

function readSettings(): StudySettings {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf-8");
    return normalizeSettings(JSON.parse(raw) as Partial<StudySettings>);
  } catch {
    return normalizeSettings();
  }
}

function writeSettings(settings: StudySettings) {
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
}

export async function GET() {
  return NextResponse.json(readSettings());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const settings = normalizeSettings(body as Partial<StudySettings>);

  writeSettings(settings);
  return NextResponse.json({ ok: true, settings });
}
