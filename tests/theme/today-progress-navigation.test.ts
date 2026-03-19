import fs from "fs";
import path from "path";

import { describe, expect, test } from "vitest";

const shellSource = fs.readFileSync(
  path.join(process.cwd(), "components/workspace-shell.tsx"),
  "utf8",
);

const dashboardSource = fs.readFileSync(
  path.join(process.cwd(), "components/dashboard-view.tsx"),
  "utf8",
);

const workspaceSource = fs.readFileSync(
  path.join(process.cwd(), "components/study-workspace.tsx"),
  "utf8",
);

describe("today progress navigation", () => {
  test("sidebar Today tile links to today's completed section and displays progress", () => {
    expect(shellSource).toContain("/#today-completed");
    expect(shellSource).toContain('label="Today"');
    expect(shellSource).toContain('clickable={true}');

    expect(workspaceSource).toContain("completedTodayIds.length");
    expect(workspaceSource).toContain("todayTarget");
  });

  test("dashboard exposes a today-completed section", () => {
    expect(dashboardSource).toContain('id="today-completed"');
    expect(dashboardSource).toContain('eyebrow="Today\'s completed"');
  });
});
