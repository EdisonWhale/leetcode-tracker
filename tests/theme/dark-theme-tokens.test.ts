import fs from "fs";
import path from "path";

import { describe, expect, test } from "vitest";

const THEMED_COMPONENTS = [
  "components/review-view.tsx",
  "components/plan-view.tsx",
  "components/insights-view.tsx",
  "components/problem-sheet.tsx",
  "components/settings-panel.tsx",
  "components/study-workspace.tsx",
];

const FORBIDDEN_TOKENS = ["bg-white", "white/", "hover:bg-white"];

describe("dark theme token hygiene", () => {
  test("shared workspace components do not retain light-mode utility tokens", () => {
    const offenders = THEMED_COMPONENTS.flatMap((relativePath) => {
      const absolutePath = path.join(process.cwd(), relativePath);
      const source = fs.readFileSync(absolutePath, "utf8");

      return FORBIDDEN_TOKENS.filter((token) => source.includes(token)).map((token) => `${relativePath}: ${token}`);
    });

    expect(offenders).toEqual([]);
  });
});
