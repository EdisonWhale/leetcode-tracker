import fs from "fs";
import path from "path";

import { describe, expect, test } from "vitest";

const problemsViewSource = fs.readFileSync(
  path.join(process.cwd(), "components/problems-view.tsx"),
  "utf8",
);

describe("Problems filter bar", () => {
  test("uses compact pill tabs and wrapped custom selects", () => {
    expect(problemsViewSource).toContain("h-11");
    expect(problemsViewSource).toContain("rounded-[14px]");
    expect(problemsViewSource).toContain("appearance-none");
    expect(problemsViewSource).toContain("pointer-events-none absolute inset-y-0 right-0");
    expect(problemsViewSource).toContain("Search questions, topics, or problem #");
  });

  test("treats the review filter as the whole review queue, not only due items", () => {
    expect(problemsViewSource).toContain('if (filter === "due") return row.isInReviewQueue;');
  });
});
