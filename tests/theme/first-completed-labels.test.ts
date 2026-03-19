import fs from "fs";
import path from "path";

import { describe, expect, test } from "vitest";

const files = [
  "components/problems-view.tsx",
  "components/dashboard-view.tsx",
  "components/plan-view.tsx",
  "components/review-view.tsx",
  "components/problem-sheet.tsx",
  "components/insights-view.tsx",
].map((relativePath) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8"));

describe("First completed labels", () => {
  test("surface first solved metadata on problem-facing views", () => {
    files.forEach((source) => {
      expect(source.includes("First solved") || source.includes("firstCompletedLabel")).toBe(true);
    });
  });
});
