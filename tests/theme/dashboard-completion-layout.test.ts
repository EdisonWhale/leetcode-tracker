import fs from "fs";
import path from "path";

import { describe, expect, test } from "vitest";

const dashboardSource = fs.readFileSync(
  path.join(process.cwd(), "components/dashboard-view.tsx"),
  "utf8",
);

describe("Dashboard completion layout", () => {
  test("surfaces solved-today progress and places the heatmap in the top summary row", () => {
    expect(dashboardSource).toContain("Solved today");
    expect(dashboardSource).toContain("workspace.dashboard.completedTodayIds.length");

    const heatmapIndex = dashboardSource.indexOf("<CompletionHeatmap");
    const dueReviewsIndex = dashboardSource.indexOf('eyebrow="Due reviews"');

    expect(heatmapIndex).toBeGreaterThan(-1);
    expect(dueReviewsIndex).toBeGreaterThan(-1);
    expect(heatmapIndex).toBeLessThan(dueReviewsIndex);
  });
});
