import type {
  ExecutionSocketLog,
  LogStatus,
  LogType,
  SocketLogError,
  SocketLogProperties,
  SocketLogSegment,
} from "./types";

// Normalized tree assembled from the live socket stream of a test run.
// Nodes are keyed by `indexPath@loopIndex` — the structural position plus the
// loop-iteration context — because the same indexPath repeats once per loop
// iteration. FLOWCHART lines (no indexPath) become the connector roots;
// everything below them attaches via its indexPath prefix.
//
// Memory bound: only the FIRST iteration of every loop is stored locally.
// Lines from later iterations just bump the loop's `iterationCount` and are
// dropped — a loop with a million iterations costs one subtree plus a
// counter. Other iterations are persisted server-side and fetched on demand
// when the user pages to them (same REST lazy-loading as the stored-logs
// viewer).
export type LiveLogNode = {
  key: string;
  // Persisted element id used to fetch full method details (same REST
  // endpoint as the stored-logs viewer). The backend merges the end-of-phase
  // line into the document created by the start line, so the FIRST id seen
  // for a node is the one that exists in the database; '' when no line
  // carried an id.
  id: string;
  indexPath: string;
  // Comma-separated iteration indices of all enclosing loops (outermost
  // first), '' when the node is not inside a loop.
  loopIndex: string;
  type: LogType;
  status: LogStatus;
  connectorName: string | null;
  properties: SocketLogProperties;
  segment: SocketLogSegment;
  error: SocketLogError;
  // Ordered children; for LOOP nodes these are the stored iteration's children.
  childKeys: string[];
  // LOOP nodes only: which iteration index is kept locally (the first seen),
  // the latest iteration observed, and how many distinct iterations ran.
  storedIteration: string | null;
  latestIteration: string | null;
  iterationCount: number;
};

// Where an error originated: its structural indexPath plus the loop-iteration
// context it happened in (the enclosing loops' iteration indices, outermost
// first, e.g. "9,1,1"). Captured straight from the socket so it survives the
// tree dropping the failing loop iteration's subtree.
export type ErrorLocation = { indexPath: string; loopIndex: string };

export type LiveLogTree = {
  rootKeys: string[];
  nodes: Record<string, LiveLogNode>;
  executionStatus: LogStatus | null;
  // Origins of every error seen this run. The trace markers are derived from
  // this (see `makeErrorTraceMatcher`) so they light up the exact path —
  // including the specific loop iterations — that led to the failure.
  errorLocations: ErrorLocation[];
};

export const EMPTY_LIVE_LOG_TREE: LiveLogTree = {
  rootKeys: [],
  nodes: {},
  executionStatus: null,
  errorLocations: [],
};

const nodeKey = (indexPath: string, loopIndex: string) =>
  `${indexPath}@${loopIndex}`;

// Extend a loop-iteration context with one more enclosing loop's iteration —
// used to thread the cumulative context down to (REST-fetched) children, so it
// stays comparable with a node's `loopIndex` and the captured error locations.
export const appendLoopIndex = (base: string, iteration: number | string): string =>
  base === "" ? String(iteration) : `${base},${iteration}`;

// Errors are intentionally not stored here: a line may carry an error that
// originated in another element — `attachError` routes it via
// `error.originOfErrorPath` instead.
const createNode = (key: string, log: ExecutionSocketLog): LiveLogNode => ({
  key,
  id: log.id ?? "",
  indexPath: log.indexPath ?? "",
  loopIndex: log.properties?.loopIndex ?? "",
  type: log.type,
  status: log.status,
  connectorName: log.connectorName ?? null,
  properties: log.properties ?? {},
  segment: log.segment ?? {},
  error: null,
  childKeys: [],
  storedIteration: null,
  latestIteration: null,
  iterationCount: 0,
});

// A phase emits one line when it starts (PENDING) and one when it ends
// (COMPLETE/FAIL) — merge the end line into the started node.
const mergeNode = (node: LiveLogNode, log: ExecutionSocketLog): LiveLogNode => ({
  ...node,
  // Keep the first id: the end line carries a fresh id that is discarded
  // server-side when it merges into the start line's document.
  id: node.id || log.id || "",
  status: log.status,
  connectorName: node.connectorName ?? log.connectorName ?? null,
  properties: { ...node.properties, ...log.properties },
  segment: {
    request: { ...node.segment.request, ...log.segment?.request },
    response: { ...node.segment.response, ...log.segment?.response },
    result: log.segment?.result ?? node.segment.result,
  },
});

const reduceFlowchart = (tree: LiveLogTree, log: ExecutionSocketLog): LiveLogTree => {
  if (log.status === "PENDING") {
    const key = `fc:${tree.rootKeys.length}`;
    return {
      ...tree,
      rootKeys: [...tree.rootKeys, key],
      nodes: { ...tree.nodes, [key]: createNode(key, log) },
    };
  }
  // End line: close the most recently opened connector.
  const openKey = [...tree.rootKeys]
    .reverse()
    .find((key) => tree.nodes[key].status === "PENDING");
  if (!openKey) return tree;
  return {
    ...tree,
    nodes: { ...tree.nodes, [openKey]: mergeNode(tree.nodes[openKey], log) },
  };
};

// Attach a freshly created node to its parent.
//  - { patch, keepChild: true }  — store the node under its parent
//  - { patch, keepChild: false } — loop bookkeeping only, node is dropped
//  - "drop"                      — ancestor was dropped, discard silently
//  - null                        — top-level element, attach to the connector
type AttachOutcome =
  | { patch: Record<string, LiveLogNode>; keepChild: boolean }
  | "drop"
  | null;

const attachToParent = (tree: LiveLogTree, node: LiveLogNode): AttachOutcome => {
  const parentPath = node.indexPath.split("_").slice(0, -1).join("_");
  if (!parentPath) return null;

  // Parent in the same loop context (connector child, IF child, …).
  const direct = tree.nodes[nodeKey(parentPath, node.loopIndex)];
  if (direct && direct.type !== "LOOP") {
    return {
      patch: { [direct.key]: { ...direct, childKeys: [...direct.childKeys, node.key] } },
      keepChild: true,
    };
  }

  // Loop parent: the child's loopIndex is the parent's plus one trailing
  // iteration index. Only the first iteration's children are stored; later
  // iterations only advance the counter.
  const parts = node.loopIndex.split(",");
  const iteration = parts[parts.length - 1] ?? "";
  const loopParent = tree.nodes[nodeKey(parentPath, parts.slice(0, -1).join(","))];
  if (loopParent?.type === "LOOP" && node.loopIndex) {
    const storedIteration = loopParent.storedIteration ?? iteration;
    const isNewIteration = loopParent.latestIteration !== iteration;
    const keepChild = iteration === storedIteration;
    return {
      patch: {
        [loopParent.key]: {
          ...loopParent,
          storedIteration,
          latestIteration: iteration,
          iterationCount: loopParent.iterationCount + (isNewIteration ? 1 : 0),
          childKeys: keepChild
            ? [...loopParent.childKeys, node.key]
            : loopParent.childKeys,
        },
      },
      keepChild,
    };
  }

  // The parent itself was dropped (it lives in a non-stored loop iteration).
  return "drop";
};

// Most recently created node at a given indexPath — for elements inside a
// loop the same indexPath exists once per iteration, and the error always
// belongs to the latest one (insertion order of `nodes` is arrival order).
const findLastKeyByIndexPath = (
  tree: LiveLogTree,
  indexPath: string,
): string | undefined => {
  let found: string | undefined;
  for (const node of Object.values(tree.nodes)) {
    if (node.indexPath === indexPath) found = node.key;
  }
  return found;
};

// Show the error on the element where it happened (`originOfErrorPath`),
// falling back to the carrying line's own element. An errored phase never
// completes, so a still-pending target is marked FAIL.
const attachError = (tree: LiveLogTree, log: ExecutionSocketLog): LiveLogTree => {
  const error = log.error;
  if (!error?.message) return tree;
  const targetKey =
    (error.originOfErrorPath
      ? findLastKeyByIndexPath(tree, error.originOfErrorPath)
      : undefined) ??
    (log.indexPath ? findLastKeyByIndexPath(tree, log.indexPath) : undefined);
  if (!targetKey) return tree;
  const target = tree.nodes[targetKey];
  return {
    ...tree,
    nodes: {
      ...tree.nodes,
      [targetKey]: {
        ...target,
        error: target.error ?? error,
        status: target.status === "PENDING" ? "FAIL" : target.status,
      },
    },
  };
};

// Once a run is over (failed, terminated, or the socket dropped) nothing is
// in flight anymore — flip still-pending nodes to FAIL so their spinners
// become red dots marking exactly where the run stopped.
export function failPendingNodes(tree: LiveLogTree): LiveLogTree {
  const pending = Object.values(tree.nodes).filter(
    (node) => node.status === "PENDING",
  );
  if (pending.length === 0 && tree.executionStatus !== "PENDING") return tree;
  const nodes = { ...tree.nodes };
  for (const node of pending) {
    nodes[node.key] = { ...node, status: "FAIL" };
  }
  return {
    ...tree,
    nodes,
    executionStatus:
      tree.executionStatus === "PENDING" ? "FAIL" : tree.executionStatus,
  };
}

// Whether a row is the failing element itself (exact indexPath + iteration
// context) — used by auto-reveal to open its detail and scroll to it.
export function isErrorTarget(
  errorLocations: ErrorLocation[],
  indexPath: string,
  loopIndexPath: string,
): boolean {
  return errorLocations.some(
    (e) => e.indexPath === indexPath && e.loopIndex === loopIndexPath,
  );
}

// For a loop on the trace, the iteration its pager must move to so the trail
// continues toward the error — the loop-index component right after this loop's
// own iteration context. Null when no captured error runs through this loop.
// This is what makes auto-reveal page nested loops to the failing iterations
// (e.g. i, then j, then k) before fetching the next level over REST.
export function loopRevealIteration(
  errorLocations: ErrorLocation[],
  indexPath: string,
  loopIndexPath: string,
): number | null {
  for (const err of errorLocations) {
    const indexMatch =
      err.indexPath === indexPath || err.indexPath.startsWith(`${indexPath}_`);
    if (!indexMatch) continue;
    let rest: string;
    if (loopIndexPath === "") rest = err.loopIndex;
    else if (err.loopIndex.startsWith(`${loopIndexPath},`))
      rest = err.loopIndex.slice(loopIndexPath.length + 1);
    else continue;
    const next = rest.split(",")[0];
    if (next !== "") return Number(next);
  }
  return null;
}

// Build a predicate that tells whether a row (identified by its structural
// indexPath and the loop-iteration context it is rendered in) lies on a path to
// an error — i.e. it is the failing element or one of its ancestors, *in the
// matching loop iterations*. A row qualifies when, for some captured error:
//   - the error's indexPath is the row's indexPath or a descendant of it, AND
//   - the row's loop-iteration context is a prefix of the error's (so paging a
//     loop away from the failing iteration hides that branch's markers).
// Index-path + loop-index based (not node-key based) so it works for non-stored
// loop iterations, whose rows are re-fetched over REST.
export function makeErrorTraceMatcher(
  errorLocations: ErrorLocation[],
): (indexPath: string, loopIndexPath: string) => boolean {
  return (indexPath, loopIndexPath) => {
    if (!indexPath) return false;
    return errorLocations.some((err) => {
      const indexMatch =
        err.indexPath === indexPath || err.indexPath.startsWith(`${indexPath}_`);
      if (!indexMatch) return false;
      return (
        loopIndexPath === "" ||
        err.loopIndex === loopIndexPath ||
        err.loopIndex.startsWith(`${loopIndexPath},`)
      );
    });
  };
}

// Record where an error originated, straight from the socket line, before any
// node-storage decision — so a failure in a dropped loop iteration is still
// captured (structural indexPath + the iteration context it happened in).
const captureErrorLocation = (
  tree: LiveLogTree,
  log: ExecutionSocketLog,
): LiveLogTree => {
  const error = log.error;
  // Capture on any error indicator — a line can carry `originOfErrorPath`
  // without a `message` (the message may ride on a different line).
  if (!error || (!error.message && !error.originOfErrorPath)) return tree;
  const indexPath = error.originOfErrorPath || log.indexPath || "";
  if (!indexPath) return tree;
  const loopIndex = log.properties?.loopIndex ?? "";
  const exists = tree.errorLocations.some(
    (e) => e.indexPath === indexPath && e.loopIndex === loopIndex,
  );
  if (exists) return tree;
  return {
    ...tree,
    errorLocations: [...tree.errorLocations, { indexPath, loopIndex }],
  };
};

export function reduceLiveLog(tree: LiveLogTree, log: ExecutionSocketLog): LiveLogTree {
  const t = captureErrorLocation(tree, log);

  if (log.type === "EXECUTION") {
    return attachError({ ...t, executionStatus: log.status }, log);
  }
  if (!log.indexPath) {
    return log.type === "FLOWCHART"
      ? attachError(reduceFlowchart(t, log), log)
      : t;
  }

  const key = nodeKey(log.indexPath, log.properties?.loopIndex ?? "");
  const existing = t.nodes[key];
  if (existing) {
    return attachError(
      { ...t, nodes: { ...t.nodes, [key]: mergeNode(existing, log) } },
      log,
    );
  }

  const node = createNode(key, log);
  const outcome = attachToParent(t, node);
  if (outcome === "drop") return t;
  if (outcome) {
    return attachError(
      {
        ...t,
        nodes: outcome.keepChild
          ? { ...t.nodes, ...outcome.patch, [key]: node }
          : { ...t.nodes, ...outcome.patch },
      },
      log,
    );
  }

  // Top-level element (or orphan): attach to the open connector root.
  const rootKey =
    [...t.rootKeys].reverse().find((k) => t.nodes[k].status === "PENDING") ??
    t.rootKeys[t.rootKeys.length - 1];
  if (!rootKey) return t;
  const root = t.nodes[rootKey];
  return attachError(
    {
      ...t,
      nodes: {
        ...t.nodes,
        [rootKey]: { ...root, childKeys: [...root.childKeys, key] },
        [key]: node,
      },
    },
    log,
  );
}
