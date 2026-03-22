import fs from "fs";
import path from "path";

import { describe, expect, test } from "vitest";

const shellSource = fs.readFileSync(
  path.join(process.cwd(), "components/workspace-shell.tsx"),
  "utf8",
);

const workspaceSource = fs.readFileSync(
  path.join(process.cwd(), "components/study-workspace.tsx"),
  "utf8",
);

const pathsSource = fs.readFileSync(
  path.join(process.cwd(), "components/paths-view.tsx"),
  "utf8",
);

describe("Paths shell", () => {
  test("adds paths to the primary workspace navigation", () => {
    expect(shellSource).toContain('"paths"');
    expect(shellSource).toContain('href: "/paths"');
    expect(shellSource).toContain('label: "Paths"');
  });

  test("mounts a dedicated paths view and path detail sidebar state", () => {
    expect(workspaceSource).toContain('page === "paths"');
    expect(workspaceSource).toContain("selectedPathId");
    expect(workspaceSource).toContain("<PathsView");
    expect(workspaceSource).toContain("onOpenSolveRating");
  });

  test("treats paths as a dedicated fullscreen surface with a collapsible sidebar", () => {
    expect(workspaceSource).toContain('if (page === "paths")');
    expect(workspaceSource).toContain("return <PathsView");
    expect(pathsSource).toContain("sidebarCollapsed");
    expect(pathsSource).toContain("setSidebarCollapsed");
  });

  test("supports pan and zoom on the roadmap canvas and shows details in a separate drawer layer", () => {
    expect(pathsSource).toContain("zoomLevel");
    expect(pathsSource).toContain("panOffset");
    expect(pathsSource).toContain("activeDrawerPathId");
    expect(pathsSource).toContain("setActiveDrawerPathId");
    expect(pathsSource).toContain("onWheel");
    expect(pathsSource).toContain("onPointerDown");
    expect(pathsSource).toContain("translate3d(");
    expect(pathsSource).toContain("scale(${zoomLevel})");
  });

  test("mounts the roadmap stage as a fullscreen absolute layer inside the canvas", () => {
    expect(pathsSource).toContain('className="absolute inset-0 overflow-hidden"');
    expect(pathsSource).toContain("h-full w-full origin-top-left");
    expect(pathsSource).toContain("pointer-events-none absolute inset-0 rounded-[30px]");
    expect(pathsSource).not.toContain("Click a node to open its detail drawer");
  });

  test("adds rich drawer controls for searching, filtering, and sorting path problems", () => {
    expect(pathsSource).toContain("useDeferredValue");
    expect(pathsSource).toContain("drawerQuery");
    expect(pathsSource).toContain("Search ${drawerProblemItems.length} problems");
    expect(pathsSource).toContain("FilterPillGroup");
    expect(pathsSource).toContain('label="Diff"');
    expect(pathsSource).toContain('label="Status"');
    expect(pathsSource).toContain('label="List"');
    expect(pathsSource).toContain('label="Sort"');
    expect(pathsSource).toContain("Reset");
  });

  test("renders the sidebar focus card as a tracking panel with difficulty stats and a ring summary", () => {
    expect(pathsSource).toContain("PathTrackingCard");
    expect(pathsSource).toContain("strokeDasharray");
    expect(pathsSource).toContain("Easy");
    expect(pathsSource).toContain("Med");
    expect(pathsSource).toContain("Hard");
    expect(pathsSource).not.toContain("Current Focus");
  });

  test("uses a compact filter rail and a reduced row layout inside the drawer", () => {
    expect(pathsSource).toContain("FilterPillGroup");
    expect(pathsSource).toContain("DrawerProblemTable");
    expect(pathsSource).toContain("No problems match the current filters.");
    expect(pathsSource).toContain("flex items-start gap-2.5");
    expect(pathsSource).not.toContain("min-w-[720px]");
  });

  test("turns the drawer status column into a compact check button that uses the solve completion flow", () => {
    expect(pathsSource).toContain("onOpenSolveRating");
    expect(pathsSource).toContain("Mark as complete");
    expect(pathsSource).toContain("h-5 w-5");
    expect(pathsSource).toContain("px-2.5 py-1");
  });

  test("keeps tracking stats and filter controls on a consistent rhythm without overlap", () => {
    expect(pathsSource).toContain("grid-cols-[1fr_130px]");
    expect(pathsSource).toContain("tabular-nums");
    expect(pathsSource).toContain("h-10");
    expect(pathsSource).toContain("grid grid-cols-[30px_1fr]");
    expect(pathsSource).not.toContain("mb-[1px] h-11");
  });

  test("uses the full problem set for the sidebar tracking card instead of only the selected path", () => {
    expect(pathsSource).toContain('title="All Problems"');
    expect(pathsSource).toContain("const trackingItems = workspace.problemRows.map");
    expect(pathsSource).toContain("items={trackingItems}");
  });
});
