"use client";

import Link from "next/link";
import {
  useDeferredValue,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent as ReactWheelEvent,
} from "react";

import type { Problem } from "@/data/problems";
import { PATH_DEFINITIONS, type PathId } from "@/data/paths";
import {
  filterPathProblems,
  sortPathProblems,
  type PathProblemListFilters,
  type PathProblemListItem,
  type PathProblemSort,
} from "@/lib/path-problem-list";
import { HAS_STABLE_PROBLEM_FREQUENCY, getProblemFrequencyScore } from "@/lib/problem-frequency";
import type { StudyWorkspace } from "@/lib/study";

import { NAV_ITEMS } from "@/components/workspace-shell";

type PathsViewProps = {
  problemById: Record<number, Problem>;
  workspace: StudyWorkspace;
  selectedPathId: PathId;
  onSelectPath: (pathId: PathId) => void;
  onOpenProblem: (problemId: number) => void;
  onOpenSolveRating: (problemId: number) => void;
  onOpenReviewRating: (problemId: number) => void;
  onOpenSettings: () => void;
  onStartSolve: (problem: Problem) => Promise<unknown>;
  overlays?: ReactNode;
};

type PanOffset = {
  x: number;
  y: number;
};

const ROADMAP_NODE_WIDTH = 174;
const ROADMAP_NODE_HEIGHT = 66;
const MIN_ZOOM = 0.45;
const MAX_ZOOM = 1.65;
const DEFAULT_PAN_OFFSET: PanOffset = { x: 10, y: 0 };
const DEFAULT_DRAWER_FILTERS: PathProblemListFilters = {
  query: "",
  difficulty: "all",
  source: "all",
  status: "all",
  bucket: "all",
};

export function PathsView({
  problemById,
  workspace,
  selectedPathId,
  onSelectPath,
  onOpenProblem,
  onOpenSolveRating,
  onOpenReviewRating,
  onOpenSettings,
  onStartSolve,
  overlays,
}: PathsViewProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeDrawerPathId, setActiveDrawerPathId] = useState<PathId | null>(null);
  const [drawerQuery, setDrawerQuery] = useState("");
  const [drawerFilters, setDrawerFilters] = useState<PathProblemListFilters>(DEFAULT_DRAWER_FILTERS);
  const [drawerSort, setDrawerSort] = useState<PathProblemSort>("roadmap");
  const [zoomLevel, setZoomLevel] = useState(0.9);
  const [panOffset, setPanOffset] = useState<PanOffset>(DEFAULT_PAN_OFFSET);
  const [isDragging, setIsDragging] = useState(false);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const selectedPath = workspace.paths.byId[selectedPathId];
  const drawerPath = activeDrawerPathId ? workspace.paths.byId[activeDrawerPathId] : null;
  const rowById = Object.fromEntries(workspace.problemRows.map((row) => [row.problem.id, row]));
  const showFrequency = HAS_STABLE_PROBLEM_FREQUENCY;
  const solvedProblemCount = workspace.problemRows.filter((row) => row.record.workflowState === "done").length;
  const deferredDrawerQuery = useDeferredValue(drawerQuery);
  const trackingItems = workspace.problemRows.map((row) => ({
    problem: row.problem,
    bucket: "core" as const,
    isDone: row.record.workflowState === "done",
    isDue: row.isDue,
    isInReviewQueue: row.isInReviewQueue,
  }));

  const drawerProblemItems: PathProblemListItem[] = drawerPath
    ? [...drawerPath.coreIds.map((problemId) => buildDrawerProblemItem(problemId, "core", rowById, problemById)),
      ...drawerPath.additionalIds.map((problemId) => buildDrawerProblemItem(problemId, "additional", rowById, problemById))]
        .filter((item): item is PathProblemListItem => item !== null)
    : [];

  const filteredDrawerItems = sortPathProblems(
    filterPathProblems(drawerProblemItems, {
      ...drawerFilters,
      query: deferredDrawerQuery,
    }),
    drawerSort,
  );

  useEffect(() => {
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveDrawerPathId(null);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  function openDrawer(pathId: PathId) {
    onSelectPath(pathId);
    resetDrawerControls();
    setActiveDrawerPathId(pathId);
  }

  function resetDrawerControls() {
    setDrawerQuery("");
    setDrawerFilters(DEFAULT_DRAWER_FILTERS);
    setDrawerSort("roadmap");
  }

  function updateZoom(nextZoom: number) {
    setZoomLevel(clampZoom(nextZoom));
  }

  function handleCanvasWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const step = event.deltaY < 0 ? 0.08 : -0.08;
    setZoomLevel((current) => clampZoom(current + step));
  }

  function handleCanvasPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    if (event.target instanceof Element && event.target.closest("[data-path-node='true']")) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: panOffset.x,
      originY: panOffset.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }

  function handleCanvasPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) {
      return;
    }

    const nextX = dragState.originX + (event.clientX - dragState.startX);
    const nextY = dragState.originY + (event.clientY - dragState.startY);
    setPanOffset({ x: nextX, y: nextY });
  }

  function handleCanvasPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
      setIsDragging(false);
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function resetView() {
    setPanOffset(DEFAULT_PAN_OFFSET);
    setZoomLevel(0.9);
  }

  return (
    <>
      <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(74,95,255,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(255,177,85,0.1),transparent_22%),linear-gradient(180deg,#080a10_0%,#0e1118_42%,#141922_100%)]">
        <div className="flex min-h-screen">
          <aside
            className={`relative hidden shrink-0 border-r border-[rgba(255,255,255,0.08)] bg-[rgba(9,11,16,0.92)] backdrop-blur xl:flex ${
              sidebarCollapsed ? "w-[88px]" : "w-[264px]"
            } transition-[width] duration-200`}
          >
            <div className="flex w-full flex-col px-3 py-4">
              <div className={`flex items-center gap-3 ${sidebarCollapsed ? "justify-center" : "justify-between"}`}>
                <Link
                  href="/"
                  className={`rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[rgba(255,255,255,0.08)] ${
                    sidebarCollapsed ? "w-full text-center" : ""
                  }`}
                >
                  {sidebarCollapsed ? "LP" : "LeetPlan OS"}
                </Link>
                <button
                  type="button"
                  aria-expanded={!sidebarCollapsed}
                  aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                  onClick={() => setSidebarCollapsed((current) => !current)}
                  className={`rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-white transition-colors hover:bg-[rgba(255,255,255,0.08)] ${
                    sidebarCollapsed ? "absolute right-3 top-3" : ""
                  }`}
                >
                  {sidebarCollapsed ? "+" : "-"}
                </button>
              </div>

              <nav className="mt-6 flex-1 space-y-2">
                {NAV_ITEMS.map((item) => {
                  const active = item.page === "paths";

                  return (
                    <Link
                      key={item.page}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-[20px] border px-3 py-3 transition-all ${
                        active
                          ? "border-[rgba(121,136,255,0.34)] bg-[rgba(82,95,255,0.18)] shadow-[0_14px_34px_rgba(19,28,82,0.34)]"
                          : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(255,255,255,0.16)] hover:bg-[rgba(255,255,255,0.06)]"
                      } ${sidebarCollapsed ? "justify-center" : ""}`}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[rgba(255,255,255,0.07)] text-xs font-semibold uppercase tracking-[0.18em] text-white">
                        {item.label
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      {!sidebarCollapsed ? (
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-white">{item.label}</span>
                          <span className="mt-0.5 block text-[11px] uppercase tracking-[0.18em] text-white/45">
                            {item.kicker}
                          </span>
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </nav>

              <div className="space-y-3">
                {!sidebarCollapsed ? (
                  <PathTrackingCard title="All Problems" items={trackingItems} />
                ) : null}

                <button
                  type="button"
                  onClick={onOpenSettings}
                  className={`w-full rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-3 text-sm text-white transition-colors hover:bg-[rgba(255,255,255,0.08)] ${
                    sidebarCollapsed ? "text-center" : "text-left"
                  }`}
                >
                  {sidebarCollapsed ? "S" : "Settings"}
                </button>
              </div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(9,11,15,0.78)] px-4 py-3 backdrop-blur xl:hidden">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.24em] text-white/42">Paths</div>
                  <div className="mt-1 text-sm font-medium text-white">{selectedPath.definition.label}</div>
                </div>
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-sm text-white"
                >
                  Settings
                </button>
              </div>
            </div>

            <main className="relative flex-1 p-3 md:p-4 xl:p-5">
              <section className="relative flex min-h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-[34px] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,13,19,0.9)] shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.08)] px-5 py-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.28em] text-white/42">NeetCode Roadmap</div>
                    <h1 className="mt-2 font-[family-name:var(--font-display)] text-[1.8rem] leading-none text-white md:text-[2.25rem]">
                      Drag the graph, zoom in, and open a path only when you need it.
                    </h1>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusChip label="Solved" value={`${solvedProblemCount}/${workspace.problemRows.length}`} />
                    <StatusChip label="Due" value={workspace.dashboard.dueReviewCount} />
                    <StatusChip label="Focus" value={selectedPath.definition.label} />
                  </div>
                </div>

                <div
                  onWheel={handleCanvasWheel}
                  onPointerDown={handleCanvasPointerDown}
                  onPointerMove={handleCanvasPointerMove}
                  onPointerUp={handleCanvasPointerUp}
                  onPointerCancel={handleCanvasPointerUp}
                  className={`relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(86,101,255,0.08),transparent_18%),linear-gradient(180deg,rgba(9,11,17,0.96),rgba(6,8,12,1))] ${
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                  }`}
                >
                  <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-[linear-gradient(180deg,rgba(7,9,14,0.94),transparent)]" />
                  <div className="pointer-events-none absolute inset-0 rounded-[30px] border border-[rgba(255,255,255,0.08)] bg-[radial-gradient(circle_at_top,rgba(91,104,255,0.14),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(40,205,140,0.08),transparent_26%),linear-gradient(180deg,rgba(16,19,27,0.98),rgba(8,10,15,0.98))]" />

                  <div className="absolute left-4 top-4 z-20 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateZoom(zoomLevel - 0.1)}
                      className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(13,17,24,0.88)] px-4 py-2 text-sm text-white transition-colors hover:bg-[rgba(255,255,255,0.08)]"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => updateZoom(zoomLevel + 0.1)}
                      className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(13,17,24,0.88)] px-4 py-2 text-sm text-white transition-colors hover:bg-[rgba(255,255,255,0.08)]"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={resetView}
                      className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(13,17,24,0.88)] px-4 py-2 text-sm text-white transition-colors hover:bg-[rgba(255,255,255,0.08)]"
                    >
                      Reset
                    </button>
                    <div className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(13,17,24,0.88)] px-4 py-2 text-sm text-white/68">
                      Zoom {Math.round(zoomLevel * 100)}%
                    </div>
                  </div>

                  <div className="absolute inset-0 overflow-hidden">
                    <div
                      className="relative h-full w-full origin-top-left will-change-transform"
                      style={{
                        transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomLevel})`,
                      }}
                    >
                      <div className="absolute left-0 top-0 h-[1110px] w-[1120px]">
                        <RoadmapLines selectedPathId={selectedPathId} />
                        {PATH_DEFINITIONS.map((definition) => {
                          const stats = workspace.paths.byId[definition.id];
                          const active = definition.id === selectedPathId;
                          const drawerOpen = definition.id === activeDrawerPathId;

                          return (
                            <button
                              key={definition.id}
                              type="button"
                              data-path-node="true"
                              onClick={() => openDrawer(definition.id)}
                              className={`absolute rounded-[18px] border px-4 py-3 text-left transition-[transform,border-color,box-shadow,background-color] hover:-translate-y-0.5 ${
                                drawerOpen
                                  ? "border-[rgba(255,255,255,0.9)] bg-[linear-gradient(180deg,rgba(104,118,255,0.98),rgba(71,84,221,0.96))] shadow-[0_28px_65px_rgba(31,45,140,0.6)]"
                                  : active
                                    ? "border-[rgba(134,146,255,0.86)] bg-[linear-gradient(180deg,rgba(86,101,255,0.96),rgba(67,76,208,0.96))] shadow-[0_24px_55px_rgba(33,43,126,0.52)]"
                                    : "border-[rgba(255,255,255,0.12)] bg-[linear-gradient(180deg,rgba(70,80,224,0.95),rgba(57,64,173,0.95))] shadow-[0_16px_38px_rgba(11,13,20,0.4)]"
                              }`}
                              style={{
                                left: definition.x,
                                top: definition.y,
                                width: ROADMAP_NODE_WIDTH,
                                minHeight: ROADMAP_NODE_HEIGHT,
                              }}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="truncate text-sm font-semibold text-white">{definition.label}</div>
                                <span className="rounded-full bg-white/14 px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/88">
                                  {stats.solvedCount}/{stats.totalCount}
                                </span>
                              </div>
                              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/18">
                                <div
                                  className="h-full rounded-full bg-[linear-gradient(90deg,#8af3b0,#ffffff)]"
                                  style={{ width: `${stats.progressPercent}%` }}
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <div
                className={`pointer-events-none absolute inset-y-3 right-3 z-40 flex w-full max-w-[760px] justify-end md:inset-y-4 md:right-4 xl:inset-y-5 xl:right-5 ${
                  activeDrawerPathId ? "" : ""
                }`}
              >
                <div
                  className={`flex h-full w-full max-w-[760px] flex-col overflow-hidden rounded-[32px] border border-[rgba(255,255,255,0.08)] bg-[rgba(20,23,30,0.96)] shadow-[0_40px_120px_rgba(0,0,0,0.48)] backdrop-blur transition-[transform,opacity] duration-300 ${
                    activeDrawerPathId ? "pointer-events-auto translate-x-0 opacity-100" : "translate-x-[104%] opacity-0"
                  }`}
                >
                  {drawerPath ? (
                    <>
                      <div className="flex items-center gap-4 border-b border-[rgba(255,255,255,0.08)] px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => setActiveDrawerPathId(null)}
                          className="shrink-0 rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-sm text-white/74 transition-colors hover:bg-[rgba(255,255,255,0.08)]"
                        >
                          ← Close
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] uppercase tracking-[0.24em] text-white/36">Path</div>
                          <div className="mt-0.5 truncate text-sm font-medium text-white">{drawerPath.definition.label}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-[10px] uppercase tracking-[0.24em] text-white/36">Progress</div>
                          <div className="mt-0.5 text-sm tabular-nums text-white/80">
                            {drawerPath.solvedCount}<span className="text-white/36">/{drawerPath.totalCount}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto">
                        <div className="px-6 pb-6 pt-5">
                          <div className="text-center">
                            <h2 className="font-[family-name:var(--font-display)] text-[2.4rem] leading-none text-white">
                              {drawerPath.definition.label}
                            </h2>
                            <div className="mt-4 text-[2rem] font-medium text-white/88">
                              ({drawerPath.solvedCount} / {drawerPath.totalCount})
                            </div>
                            <div className="mx-auto mt-5 h-3 max-w-[540px] overflow-hidden rounded-full bg-white/12">
                              <div
                                className="h-full rounded-full bg-[linear-gradient(90deg,#eef2ff,#a9c3ff)]"
                                style={{ width: `${drawerPath.progressPercent}%` }}
                              />
                            </div>
                          </div>

                          <section className="mt-10">
                            <h3 className="text-center font-[family-name:var(--font-display)] text-[1.75rem] text-white">Prerequisites</h3>
                            <div className="mt-5 grid gap-3 md:grid-cols-2">
                              {getPrerequisiteIds(drawerPath.definition.id).length === 0 ? (
                                <div className="rounded-[22px] border border-dashed border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.03)] px-5 py-5 text-sm text-white/52 md:col-span-2">
                                  This path starts a branch in the roadmap, so there are no prerequisites.
                                </div>
                              ) : (
                                getPrerequisiteIds(drawerPath.definition.id).map((prerequisiteId) => {
                                  const prerequisite = workspace.paths.byId[prerequisiteId];
                                  return (
                                    <button
                                      key={prerequisiteId}
                                      type="button"
                                      onClick={() => openDrawer(prerequisiteId)}
                                      className="rounded-[22px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-5 py-5 text-left transition-colors hover:bg-[rgba(255,255,255,0.06)]"
                                    >
                                      <div className="text-[1.05rem] font-semibold text-white">{prerequisite.definition.label}</div>
                                      <div className="mt-3 text-sm text-[#8394ff]">Roadmap prerequisite</div>
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </section>

                          <section className="mt-10 overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]">
                            <DrawerToolbar
                              drawerQuery={drawerQuery}
                              drawerFilters={drawerFilters}
                              drawerSort={drawerSort}
                              filteredDrawerItems={filteredDrawerItems}
                              drawerProblemItems={drawerProblemItems}
                              onQueryChange={setDrawerQuery}
                              onFiltersChange={setDrawerFilters}
                              onSortChange={setDrawerSort}
                              onReset={resetDrawerControls}
                            />

                            <DrawerProblemTable
                              items={filteredDrawerItems}
                              onOpenProblem={onOpenProblem}
                              onOpenSolveRating={onOpenSolveRating}
                              onOpenReviewRating={onOpenReviewRating}
                              onStartSolve={onStartSolve}
                            />
                          </section>

                          <div className="mt-6 grid gap-3 md:grid-cols-2">
                            <DetailStat
                              label="Difficulty"
                              value={`${drawerPath.difficultyCounts.easy}/${drawerPath.difficultyCounts.medium}/${drawerPath.difficultyCounts.hard}`}
                              caption="Easy / Medium / Hard"
                            />
                            <DetailStat
                              label="Sources"
                              value={`${drawerPath.sourceCounts.neetcode150}/${drawerPath.sourceCounts.googleTag}`}
                              caption={`${drawerPath.sourceCounts.both} live in both lists`}
                            />
                            {showFrequency ? (
                              <DetailStat
                                label="Frequency"
                                value="Available"
                                caption="Stable frequency source is enabled"
                              />
                            ) : null}
                            <DetailStat
                              label="Description"
                              value={drawerPath.definition.label}
                              caption={drawerPath.definition.description}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
      {overlays}
    </>
  );
}

function RoadmapLines({ selectedPathId }: { selectedPathId: PathId }) {
  const centers = Object.fromEntries(
    PATH_DEFINITIONS.map((definition) => [
      definition.id,
      {
        x: definition.x + ROADMAP_NODE_WIDTH / 2,
        y: definition.y + ROADMAP_NODE_HEIGHT / 2,
      },
    ]),
  ) as Record<PathId, { x: number; y: number }>;

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 1120 1110" fill="none" aria-hidden="true">
      {PATH_DEFINITIONS.flatMap((definition) =>
        definition.edges.map((edgeId) => {
          const start = centers[definition.id];
          const end = centers[edgeId];
          const isSelected = definition.id === selectedPathId || edgeId === selectedPathId;

          return (
            <path
              key={`${definition.id}-${edgeId}`}
              d={`M ${start.x} ${start.y} C ${start.x} ${(start.y + end.y) / 2}, ${end.x} ${(start.y + end.y) / 2}, ${end.x} ${end.y}`}
              stroke={isSelected ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.52)"}
              strokeWidth={isSelected ? 4 : 3}
              strokeLinecap="round"
            />
          );
        }),
      )}
    </svg>
  );
}

function StatusChip({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 py-2 text-white">
      <span className="text-[10px] uppercase tracking-[0.22em] text-white/45">{label}</span>
      <span className="ml-2 text-sm font-medium">{value}</span>
    </div>
  );
}

function PathTrackingCard({ title, items }: { title: string; items: PathProblemListItem[] }) {
  const totals = {
    easy: items.filter((item) => item.problem.diff === "Easy").length,
    medium: items.filter((item) => item.problem.diff === "Medium").length,
    hard: items.filter((item) => item.problem.diff === "Hard").length,
  };
  const solved = {
    easy: items.filter((item) => item.problem.diff === "Easy" && item.isDone).length,
    medium: items.filter((item) => item.problem.diff === "Medium" && item.isDone).length,
    hard: items.filter((item) => item.problem.diff === "Hard" && item.isDone).length,
  };
  const solvedCount = solved.easy + solved.medium + solved.hard;
  const totalCount = items.length;
  const ringRadius = 68;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const segments = buildTrackingSegments(
    [
      { total: totals.easy, solved: solved.easy, color: "rgba(71,215,155,0.92)" },
      { total: totals.medium, solved: solved.medium, color: "rgba(255,183,44,0.92)" },
      { total: totals.hard, solved: solved.hard, color: "rgba(255,114,120,0.82)" },
    ],
    totalCount,
    ringCircumference,
  );

  return (
    <div className="rounded-[30px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.025))] p-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <div className="grid gap-3">
        <div className="text-[11px] uppercase tracking-[0.24em] text-white/42">Path Tracking</div>
        <div className="text-[1.1rem] font-medium leading-tight text-white">{title}</div>

        <div className="grid grid-cols-[1fr_130px] items-center gap-3">
          <div className="grid gap-3">
            <TrackingStat label="Easy" solved={solved.easy} total={totals.easy} color="#47d79b" />
            <TrackingStat label="Med" solved={solved.medium} total={totals.medium} color="#ffb72c" />
            <TrackingStat label="Hard" solved={solved.hard} total={totals.hard} color="#ff7278" />
          </div>

          <div className="relative h-[130px] w-[130px]">
            <svg viewBox="0 0 160 160" className="h-[130px] w-[130px]">
              <circle cx="80" cy="80" r={ringRadius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
              {/* Dim layer: full segment at 0.7 opacity */}
              {segments.map((segment) => (
                <circle
                  key={`dim-${segment.color}`}
                  cx="80"
                  cy="80"
                  r={ringRadius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${segment.length} ${ringCircumference}`}
                  strokeDashoffset={segment.offset}
                  transform="rotate(-145 80 80)"
                  opacity={0.7}
                />
              ))}
              {/* Solid layer: solved portion at full opacity */}
              {segments.filter((s) => s.solvedLength > 0).map((segment) => (
                <circle
                  key={`solid-${segment.color}`}
                  cx="80"
                  cy="80"
                  r={ringRadius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${segment.solvedLength} ${ringCircumference}`}
                  strokeDashoffset={segment.offset}
                  transform="rotate(-145 80 80)"
                  opacity={1}
                />
              ))}
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <div className="text-[1.45rem] font-semibold leading-none text-white tabular-nums">
                  {solvedCount}
                  <span className="ml-0.5 text-[0.88rem] text-white/68 tabular-nums">/{totalCount}</span>
                </div>
                <div className="mt-1 text-[9px] uppercase tracking-[0.16em] text-white/38">Solved</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrackingStat({
  label,
  solved,
  total,
  color,
}: {
  label: "Easy" | "Med" | "Hard";
  solved: number;
  total: number;
  color: string;
}) {
  return (
    <div className="grid grid-cols-[30px_1fr] items-center gap-2 text-[0.82rem] leading-none">
      <span className="font-medium tracking-[-0.02em]" style={{ color }}>
        {label}
      </span>
      <span className="text-right text-white/88 tabular-nums">
        {solved}/{total}
      </span>
    </div>
  );
}

function buildTrackingSegments(
  segments: Array<{ total: number; solved: number; color: string }>,
  totalCount: number,
  circumference: number,
) {
  if (totalCount === 0) {
    return [];
  }

  const visibleSegments = segments.filter((segment) => segment.total > 0);
  if (visibleSegments.length === 0) {
    return [];
  }

  const gap = 12;
  const drawableLength = circumference - gap * visibleSegments.length;
  let cursor = 0;

  return visibleSegments.map((segment) => {
    const length = Math.max(16, (segment.total / totalCount) * drawableLength);
    const solvedLength = segment.total > 0 ? (segment.solved / segment.total) * length : 0;
    const current = {
      color: segment.color,
      length,
      solvedLength,
      offset: -cursor,
    };

    cursor += length + gap;
    return current;
  });
}

function DetailStat({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div className="rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.24em] text-white/42">{label}</div>
      <div className="mt-2 text-[1.35rem] font-semibold text-white">{value}</div>
      <div className="mt-1 text-xs leading-5 text-white/48">{caption}</div>
    </div>
  );
}

function DrawerToolbar({
  drawerQuery,
  drawerFilters,
  drawerSort,
  filteredDrawerItems,
  drawerProblemItems,
  onQueryChange,
  onFiltersChange,
  onSortChange,
  onReset,
}: {
  drawerQuery: string;
  drawerFilters: PathProblemListFilters;
  drawerSort: PathProblemSort;
  filteredDrawerItems: PathProblemListItem[];
  drawerProblemItems: PathProblemListItem[];
  onQueryChange: (value: string) => void;
  onFiltersChange: React.Dispatch<React.SetStateAction<PathProblemListFilters>>;
  onSortChange: React.Dispatch<React.SetStateAction<PathProblemSort>>;
  onReset: () => void;
}) {
  const isFiltered =
    drawerQuery !== "" ||
    drawerFilters.difficulty !== "all" ||
    drawerFilters.source !== "all" ||
    drawerFilters.status !== "all" ||
    drawerFilters.bucket !== "all" ||
    drawerSort !== "roadmap";

  return (
    <div className="sticky top-0 z-20 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(18,21,29,0.98)] px-5 py-4 backdrop-blur">
      <div className="space-y-3">
        {/* Search */}
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={drawerQuery}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={`Search ${drawerProblemItems.length} problems…`}
            className="h-10 min-w-0 flex-1 rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-4 text-sm text-white outline-none transition-colors placeholder:text-white/28 focus:border-[rgba(133,147,255,0.42)] focus:bg-[rgba(255,255,255,0.06)]"
          />
          {isFiltered && (
            <button
              type="button"
              onClick={onReset}
              className="h-10 shrink-0 rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 text-xs text-white/52 transition-colors hover:bg-[rgba(255,255,255,0.08)] hover:text-white/80"
            >
              Reset
            </button>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-y-2">
          <FilterPillGroup
            label="Diff"
            value={drawerFilters.difficulty}
            onChange={(v) => onFiltersChange((c) => ({ ...c, difficulty: v as PathProblemListFilters["difficulty"] }))}
            options={[
              { value: "all", label: "All" },
              { value: "Easy", label: "Easy" },
              { value: "Medium", label: "Med" },
              { value: "Hard", label: "Hard" },
            ]}
          />
          <div className="mx-3 w-px self-stretch bg-[rgba(255,255,255,0.08)]" />
          <FilterPillGroup
            label="Status"
            value={drawerFilters.status}
            onChange={(v) => onFiltersChange((c) => ({ ...c, status: v as PathProblemListFilters["status"] }))}
            options={[
              { value: "all", label: "All" },
              { value: "open", label: "Open" },
              { value: "due", label: "Due" },
              { value: "review", label: "Review" },
              { value: "done", label: "Done" },
            ]}
          />
          <div className="mx-3 w-px self-stretch bg-[rgba(255,255,255,0.08)]" />
          <FilterPillGroup
            label="List"
            value={drawerFilters.source}
            onChange={(v) => onFiltersChange((c) => ({ ...c, source: v as PathProblemListFilters["source"] }))}
            options={[
              { value: "all", label: "All" },
              { value: "neetcode150", label: "NC150" },
              { value: "google tag", label: "Google" },
              { value: "both", label: "Both" },
            ]}
          />
          <div className="mx-3 w-px self-stretch bg-[rgba(255,255,255,0.08)]" />
          <FilterPillGroup
            label="Sort"
            value={drawerSort}
            onChange={(v) => onSortChange(v as PathProblemSort)}
            options={[
              { value: "roadmap", label: "Order" },
              { value: "difficulty", label: "Diff" },
              { value: "status", label: "Status" },
              { value: "title", label: "A–Z" },
            ]}
          />
        </div>

        {/* Result count */}
        <div className="text-[11px] text-white/36">
          {filteredDrawerItems.length === drawerProblemItems.length ? (
            <span>{drawerProblemItems.length} problems</span>
          ) : (
            <span>
              {filteredDrawerItems.length} of {drawerProblemItems.length} shown
            </span>
          )}
          <span className="ml-3 text-white/22">
            {filteredDrawerItems.filter((i) => i.bucket === "core").length} core ·{" "}
            {filteredDrawerItems.filter((i) => i.bucket === "additional").length} additional
          </span>
        </div>
      </div>
    </div>
  );
}

function DrawerProblemTable({
  items,
  onOpenProblem,
  onOpenSolveRating,
  onOpenReviewRating,
  onStartSolve,
}: {
  items: PathProblemListItem[];
  onOpenProblem: (problemId: number) => void;
  onOpenSolveRating: (problemId: number) => void;
  onOpenReviewRating: (problemId: number) => void;
  onStartSolve: (problem: Problem) => Promise<unknown>;
}) {
  if (items.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-white/36">
        No problems match the current filters.
      </div>
    );
  }

  return (
    <div>
      {items.map((item) => (
        <PathProblemRow
          key={item.problem.id}
          item={item}
          onOpenProblem={onOpenProblem}
          onOpenSolveRating={onOpenSolveRating}
          onOpenReviewRating={onOpenReviewRating}
          onStartSolve={onStartSolve}
        />
      ))}
    </div>
  );
}

function FilterPillGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-[10px] uppercase tracking-[0.2em] text-white/30">{label}</span>
      <div className="flex gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${
              value === opt.value
                ? "bg-[rgba(133,147,255,0.2)] text-white ring-1 ring-[rgba(133,147,255,0.4)]"
                : "bg-[rgba(255,255,255,0.04)] text-white/46 hover:bg-[rgba(255,255,255,0.08)] hover:text-white/72"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "open" | "due" | "review" | "done" }) {
  const styles = {
    done: "bg-[rgba(71,215,155,0.12)] text-[#47d79b] ring-1 ring-[rgba(71,215,155,0.24)]",
    due: "bg-[rgba(239,71,67,0.12)] text-[#ef4743] ring-1 ring-[rgba(239,71,67,0.24)]",
    review: "bg-[rgba(255,183,44,0.12)] text-[#ffb72c] ring-1 ring-[rgba(255,183,44,0.24)]",
    open: "bg-[rgba(255,255,255,0.05)] text-white/40",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] ${styles[status]}`}>
      {status}
    </span>
  );
}

function PathProblemRow({
  item,
  onOpenProblem,
  onOpenSolveRating,
  onOpenReviewRating,
  onStartSolve,
}: {
  item: PathProblemListItem;
  onOpenProblem: (problemId: number) => void;
  onOpenSolveRating: (problemId: number) => void;
  onOpenReviewRating: (problemId: number) => void;
  onStartSolve: (problem: Problem) => Promise<unknown>;
}) {
  const { problem } = item;

  const primaryAction = item.isInReviewQueue
    ? { label: "Review", onClick: () => onOpenReviewRating(problem.id) }
    : item.isDone
      ? { label: "Detail", onClick: () => onOpenProblem(problem.id) }
      : { label: "Solve", onClick: () => onStartSolve(problem) };

  const statusLabel = item.isDue ? "due" : item.isDone ? "done" : item.isInReviewQueue ? "review" : "open";

  return (
    <div className="flex items-start gap-2.5 border-b border-[rgba(255,255,255,0.06)] px-5 py-3 last:border-b-0 hover:bg-[rgba(255,255,255,0.02)]">
      {/* Completion toggle */}
      <button
        type="button"
        onClick={() => onOpenSolveRating(problem.id)}
        disabled={item.isDone}
        aria-label={item.isDone ? "Completed" : "Mark as complete"}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          item.isDone
            ? "cursor-default border-[rgba(71,215,155,0.4)] bg-[rgba(71,215,155,0.14)] text-[#47d79b]"
            : "border-[rgba(255,255,255,0.12)] bg-transparent text-transparent hover:border-[rgba(255,255,255,0.28)]"
        }`}
      >
        {item.isDone && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Main content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => onOpenProblem(problem.id)}
            className="min-w-0 flex-1 text-left text-[0.93rem] font-medium leading-snug text-white/92 transition-colors hover:text-[#9db6ff]"
          >
            <span className="mr-1.5 tabular-nums text-white/32">#{problem.id}</span>
            {problem.title}
          </button>
          <span className={`shrink-0 text-xs font-semibold ${difficultyClass(problem.diff)}`}>{problem.diff}</span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <StatusPill status={statusLabel} />
          {item.bucket === "core" && (
            <Pill>NC150</Pill>
          )}
          {problem.sources.includes("google tag") && !problem.sources.includes("neetcode150") && (
            <Pill>Google</Pill>
          )}
          {problem.sources.includes("google tag") && problem.sources.includes("neetcode150") && (
            <Pill>Both</Pill>
          )}
          {problem.cats.slice(0, 2).map((cat) => (
            <Pill key={cat}>{cat}</Pill>
          ))}
          {showFrequencyForProblem(problem.id) ? <Pill>★ {getProblemFrequencyScore(problem.id)}</Pill> : null}
        </div>
      </div>

      {/* Action */}
      <button
        type="button"
        onClick={primaryAction.onClick}
        className="shrink-0 rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] px-2.5 py-1 text-[11px] font-medium text-white/72 transition-colors hover:bg-[rgba(255,255,255,0.1)] hover:text-white"
      >
        {primaryAction.label}
      </button>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/54">
      {children}
    </span>
  );
}

function buildDrawerProblemItem(
  problemId: number,
  bucket: PathProblemListItem["bucket"],
  rowById: Record<number, StudyWorkspace["problemRows"][number]>,
  problemById: Record<number, Problem>,
): PathProblemListItem | null {
  const row = rowById[problemId];
  const problem = problemById[problemId];

  if (!row || !problem) {
    return null;
  }

  return {
    problem,
    bucket,
    isDone: row.record.workflowState === "done",
    isDue: row.isDue,
    isInReviewQueue: row.isInReviewQueue,
  };
}

function getPrerequisiteIds(pathId: PathId) {
  return PATH_DEFINITIONS.filter((definition) => definition.edges.includes(pathId)).map((definition) => definition.id);
}

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(value.toFixed(2))));
}

function difficultyClass(diff: Problem["diff"]) {
  if (diff === "Easy") {
    return "text-[#2fd17f]";
  }
  if (diff === "Medium") {
    return "text-[#ffc72e]";
  }
  return "text-[#ff587d]";
}

function showFrequencyForProblem(problemId: number) {
  return HAS_STABLE_PROBLEM_FREQUENCY && getProblemFrequencyScore(problemId) !== null;
}
