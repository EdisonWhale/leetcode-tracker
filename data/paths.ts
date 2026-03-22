import { problems, type Problem } from "@/data/problems";

export type PathId =
  | "arrays-hashing"
  | "two-pointers"
  | "stack"
  | "binary-search"
  | "sliding-window"
  | "linked-list"
  | "trees"
  | "tries"
  | "backtracking"
  | "heap-priority-queue"
  | "graphs"
  | "1-d-dp"
  | "intervals"
  | "greedy"
  | "advanced-graphs"
  | "2-d-dp"
  | "bit-manipulation"
  | "math-geometry";

export interface PathDefinition {
  id: PathId;
  slug: PathId;
  label: string;
  description: string;
  x: number;
  y: number;
  edges: PathId[];
}

export interface PathMembership {
  core: number[];
  additional: number[];
}

export const PATH_DEFINITIONS: PathDefinition[] = [
  {
    id: "arrays-hashing",
    slug: "arrays-hashing",
    label: "Arrays & Hashing",
    description: "Pattern inventory, fast lookup habits, and the foundation for the rest of the roadmap.",
    x: 356,
    y: 28,
    edges: ["two-pointers", "stack"],
  },
  {
    id: "two-pointers",
    slug: "two-pointers",
    label: "Two Pointers",
    description: "Pointer choreography, sorted scans, and in-place array and string movement.",
    x: 224,
    y: 158,
    edges: ["binary-search", "sliding-window", "linked-list"],
  },
  {
    id: "stack",
    slug: "stack",
    label: "Stack",
    description: "LIFO reasoning, monotonic patterns, and expression parsing.",
    x: 520,
    y: 158,
    edges: [],
  },
  {
    id: "binary-search",
    slug: "binary-search",
    label: "Binary Search",
    description: "Answer-space search, sorted structure probing, and range narrowing.",
    x: 112,
    y: 286,
    edges: ["trees"],
  },
  {
    id: "sliding-window",
    slug: "sliding-window",
    label: "Sliding Window",
    description: "Keep live state over a moving range without recomputing the world.",
    x: 356,
    y: 286,
    edges: [],
  },
  {
    id: "linked-list",
    slug: "linked-list",
    label: "Linked List",
    description: "Pointer mutation, cycle detection, and list surgery.",
    x: 632,
    y: 286,
    edges: ["trees"],
  },
  {
    id: "trees",
    slug: "trees",
    label: "Trees",
    description: "Traversal fluency, recursion discipline, and structural reasoning.",
    x: 312,
    y: 418,
    edges: ["tries", "heap-priority-queue", "backtracking"],
  },
  {
    id: "tries",
    slug: "tries",
    label: "Tries",
    description: "Prefix indexing, dictionary search, and branching state compression.",
    x: 66,
    y: 560,
    edges: [],
  },
  {
    id: "backtracking",
    slug: "backtracking",
    label: "Backtracking",
    description: "State search, pruning, and build-recurse-undo loops.",
    x: 716,
    y: 560,
    edges: ["graphs", "1-d-dp"],
  },
  {
    id: "heap-priority-queue",
    slug: "heap-priority-queue",
    label: "Heap / Priority Queue",
    description: "Top-k selection, streaming order, and greedy extraction.",
    x: 214,
    y: 706,
    edges: ["intervals", "greedy", "advanced-graphs"],
  },
  {
    id: "graphs",
    slug: "graphs",
    label: "Graphs",
    description: "Traversal over arbitrary relationships, components, and reachability.",
    x: 578,
    y: 706,
    edges: ["advanced-graphs", "2-d-dp"],
  },
  {
    id: "1-d-dp",
    slug: "1-d-dp",
    label: "1-D DP",
    description: "Linear-state recurrence, memory compression, and sequence optimization.",
    x: 850,
    y: 706,
    edges: ["2-d-dp", "bit-manipulation"],
  },
  {
    id: "intervals",
    slug: "intervals",
    label: "Intervals",
    description: "Range merging, overlap reasoning, and schedule-style constraints.",
    x: 14,
    y: 840,
    edges: [],
  },
  {
    id: "greedy",
    slug: "greedy",
    label: "Greedy",
    description: "Local choices with global intent, tradeoff pruning, and direct construction.",
    x: 246,
    y: 840,
    edges: [],
  },
  {
    id: "advanced-graphs",
    slug: "advanced-graphs",
    label: "Advanced Graphs",
    description: "Shortest paths, MSTs, and graph problems with stronger algorithmic structure.",
    x: 434,
    y: 840,
    edges: [],
  },
  {
    id: "2-d-dp",
    slug: "2-d-dp",
    label: "2-D DP",
    description: "Grid and pair-state recurrence where one dimension is not enough.",
    x: 726,
    y: 840,
    edges: ["math-geometry"],
  },
  {
    id: "bit-manipulation",
    slug: "bit-manipulation",
    label: "Bit Manipulation",
    description: "Binary representation tricks, masks, and low-level arithmetic shortcuts.",
    x: 934,
    y: 840,
    edges: ["math-geometry"],
  },
  {
    id: "math-geometry",
    slug: "math-geometry",
    label: "Math & Geometry",
    description: "Numerical reasoning, grids, coordinate intuition, and formula-driven solutions.",
    x: 736,
    y: 986,
    edges: [],
  },
];

export const DEFAULT_PATH_ID: PathId = "arrays-hashing";

const CORE_PATH_TITLES: Record<PathId, string[]> = {
  "arrays-hashing": [
    "Contains Duplicate",
    "Valid Anagram",
    "Two Sum",
    "Group Anagrams",
    "Top K Frequent Elements",
    "Encode and Decode Strings",
    "Product of Array Except Self",
    "Valid Sudoku",
    "Longest Consecutive Sequence",
  ],
  "two-pointers": [
    "Valid Palindrome",
    "Two Sum II - Input Array Is Sorted",
    "3Sum",
    "Container With Most Water",
    "Trapping Rain Water",
  ],
  stack: [
    "Valid Parentheses",
    "Min Stack",
    "Evaluate Reverse Polish Notation",
    "Daily Temperatures",
    "Car Fleet",
    "Largest Rectangle in Histogram",
  ],
  "binary-search": [
    "Binary Search",
    "Search a 2D Matrix",
    "Koko Eating Bananas",
    "Find Minimum in Rotated Sorted Array",
    "Search in Rotated Sorted Array",
    "Time Based Key-Value Store",
    "Median of Two Sorted Arrays",
  ],
  "sliding-window": [
    "Best Time to Buy and Sell Stock",
    "Longest Substring Without Repeating Characters",
    "Longest Repeating Character Replacement",
    "Permutation in String",
    "Minimum Window Substring",
    "Sliding Window Maximum",
  ],
  "linked-list": [
    "Reverse Linked List",
    "Merge Two Sorted Lists",
    "Linked List Cycle",
    "Reorder List",
    "Remove Nth Node From End of List",
    "Copy List with Random Pointer",
    "Add Two Numbers",
    "Find the Duplicate Number",
    "LRU Cache",
    "Merge k Sorted Lists",
    "Reverse Nodes in k-Group",
  ],
  trees: [
    "Invert Binary Tree",
    "Maximum Depth of Binary Tree",
    "Diameter of Binary Tree",
    "Balanced Binary Tree",
    "Same Tree",
    "Subtree of Another Tree",
    "Lowest Common Ancestor of a Binary Search Tree",
    "Binary Tree Level Order Traversal",
    "Binary Tree Right Side View",
    "Count Good Nodes in Binary Tree",
    "Validate Binary Search Tree",
    "Kth Smallest Element in a BST",
    "Construct Binary Tree from Preorder and Inorder Traversal",
    "Binary Tree Maximum Path Sum",
    "Serialize and Deserialize Binary Tree",
  ],
  tries: [
    "Implement Trie (Prefix Tree)",
    "Design Add and Search Words Data Structure",
    "Word Search II",
  ],
  backtracking: [
    "Subsets",
    "Combination Sum",
    "Combination Sum II",
    "Permutations",
    "Subsets II",
    "Generate Parentheses",
    "Word Search",
    "Palindrome Partitioning",
    "Letter Combinations of a Phone Number",
    "N-Queens",
  ],
  "heap-priority-queue": [
    "Kth Largest Element in a Stream",
    "Last Stone Weight",
    "K Closest Points to Origin",
    "Kth Largest Element in an Array",
    "Task Scheduler",
    "Design Twitter",
    "Find Median from Data Stream",
  ],
  graphs: [
    "Number of Islands",
    "Max Area of Island",
    "Clone Graph",
    "Walls and Gates",
    "Rotting Oranges",
    "Pacific Atlantic Water Flow",
    "Surrounded Regions",
    "Course Schedule",
    "Course Schedule II",
    "Graph Valid Tree",
    "Number of Connected Components in an Undirected Graph",
    "Redundant Connection",
    "Word Ladder",
  ],
  "advanced-graphs": [
    "Network Delay Time",
    "Reconstruct Itinerary",
    "Min Cost to Connect All Points",
    "Swim in Rising Water",
    "Alien Dictionary",
    "Cheapest Flights Within K Stops",
  ],
  "1-d-dp": [
    "Climbing Stairs",
    "Min Cost Climbing Stairs",
    "House Robber",
    "House Robber II",
    "Longest Palindromic Substring",
    "Palindromic Substrings",
    "Decode Ways",
    "Coin Change",
    "Maximum Product Subarray",
    "Word Break",
    "Longest Increasing Subsequence",
    "Partition Equal Subset Sum",
  ],
  "2-d-dp": [
    "Unique Paths",
    "Longest Common Subsequence",
    "Best Time to Buy and Sell Stock with Cooldown",
    "Coin Change II",
    "Target Sum",
    "Interleaving String",
    "Longest Increasing Path in a Matrix",
    "Distinct Subsequences",
    "Edit Distance",
    "Burst Balloons",
    "Regular Expression Matching",
  ],
  greedy: [
    "Maximum Subarray",
    "Jump Game",
    "Jump Game II",
    "Gas Station",
    "Hand of Straights",
    "Merge Triplets to Form Target Triplet",
    "Partition Labels",
    "Valid Parenthesis String",
  ],
  intervals: [
    "Insert Interval",
    "Merge Intervals",
    "Non-overlapping Intervals",
    "Meeting Rooms",
    "Meeting Rooms II",
    "Minimum Interval to Include Each Query",
  ],
  "math-geometry": [
    "Rotate Image",
    "Spiral Matrix",
    "Set Matrix Zeroes",
    "Happy Number",
    "Plus One",
    "Pow(x, n)",
    "Multiply Strings",
    "Detect Squares",
  ],
  "bit-manipulation": [
    "Single Number",
    "Number of 1 Bits",
    "Counting Bits",
    "Reverse Bits",
    "Missing Number",
    "Sum of Two Integers",
    "Reverse Integer",
  ],
};

const ADDITIONAL_OVERRIDES: Partial<Record<number, PathId>> = {
  175: "arrays-hashing",
  176: "arrays-hashing",
  182: "arrays-hashing",
  224: "stack",
  305: "graphs",
  354: "1-d-dp",
  359: "heap-priority-queue",
  373: "heap-priority-queue",
  410: "binary-search",
  528: "binary-search",
  547: "graphs",
  550: "arrays-hashing",
  584: "arrays-hashing",
  595: "arrays-hashing",
  642: "tries",
  715: "intervals",
  799: "2-d-dp",
  901: "stack",
  1075: "arrays-hashing",
  1415: "backtracking",
  1878: "math-geometry",
  2667: "arrays-hashing",
  3129: "1-d-dp",
  3600: "advanced-graphs",
};

const TAG_PATH_PRIORITY: Array<[string, PathId]> = [
  ["Trie", "tries"],
  ["Linked List", "linked-list"],
  ["Doubly-Linked List", "linked-list"],
  ["Tree", "trees"],
  ["Backtracking", "backtracking"],
  ["Shortest Path", "advanced-graphs"],
  ["Minimum Spanning Tree", "advanced-graphs"],
  ["Topological Sort", "advanced-graphs"],
  ["Graph Theory", "advanced-graphs"],
  ["Heap", "heap-priority-queue"],
  ["Data Stream", "heap-priority-queue"],
  ["Bit Manipulation", "bit-manipulation"],
  ["Intervals", "intervals"],
  ["Segment Tree", "intervals"],
  ["Ordered Set", "intervals"],
  ["Sweep Line", "intervals"],
  ["Greedy", "greedy"],
  ["Sliding Window", "sliding-window"],
  ["Stack", "stack"],
  ["Monotonic Stack", "stack"],
  ["Queue", "stack"],
  ["Binary Search", "binary-search"],
  ["Two Pointers", "two-pointers"],
  ["Union-Find", "graphs"],
  ["DFS", "graphs"],
  ["BFS", "graphs"],
  ["Dynamic Programming", "1-d-dp"],
  ["Math", "math-geometry"],
  ["Geometry", "math-geometry"],
  ["Simulation", "math-geometry"],
  ["Enumeration", "math-geometry"],
  ["Number Theory", "math-geometry"],
  ["Array", "arrays-hashing"],
  ["Hash Map", "arrays-hashing"],
  ["String", "arrays-hashing"],
  ["Sorting", "arrays-hashing"],
  ["Prefix Sum", "arrays-hashing"],
  ["Counting", "arrays-hashing"],
];

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function inferSupplementalPath(problem: Problem): PathId {
  const overridden = ADDITIONAL_OVERRIDES[problem.id];
  if (overridden) {
    return overridden;
  }

  for (const [tag, pathId] of TAG_PATH_PRIORITY) {
    if (problem.cats.includes(tag)) {
      return pathId;
    }
  }

  return DEFAULT_PATH_ID;
}

const problemByNormalizedTitle = new Map(
  problems.map((problem) => [normalizeTitle(problem.title), problem] as const),
);

function problemIdForTitle(title: string): number {
  const matched = problemByNormalizedTitle.get(normalizeTitle(title));

  if (!matched) {
    throw new Error(`Missing problem for roadmap title: ${title}`);
  }

  return matched.id;
}

const coreMembership = Object.fromEntries(
  PATH_DEFINITIONS.map((path) => [
    path.id,
    CORE_PATH_TITLES[path.id].map(problemIdForTitle).sort((left, right) => left - right),
  ]),
) as Record<PathId, number[]>;

const coreProblemIds = new Set(Object.values(coreMembership).flat());

const additionalMembership = PATH_DEFINITIONS.reduce(
  (acc, path) => {
    acc[path.id] = [];
    return acc;
  },
  {} as Record<PathId, number[]>,
);

problems
  .filter((problem) => problem.sources.includes("google tag") && !problem.sources.includes("neetcode150"))
  .forEach((problem) => {
    if (coreProblemIds.has(problem.id)) {
      return;
    }

    const pathId = inferSupplementalPath(problem);
    additionalMembership[pathId].push(problem.id);
  });

Object.values(additionalMembership).forEach((ids) => ids.sort((left, right) => left - right));

export const PATH_MEMBERSHIP = PATH_DEFINITIONS.reduce(
  (acc, path) => {
    acc[path.id] = {
      core: coreMembership[path.id],
      additional: additionalMembership[path.id],
    };
    return acc;
  },
  {} as Record<PathId, PathMembership>,
);

const PATH_ID_SET = new Set<PathId>(PATH_DEFINITIONS.map((path) => path.id));

export function isPathId(value: string | null | undefined): value is PathId {
  return typeof value === "string" && PATH_ID_SET.has(value as PathId);
}
