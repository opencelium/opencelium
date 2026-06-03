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
  childKeys: string[];
  // LOOP nodes only: ordered child keys per iteration index.
  iterations: Record<string, string[]>;
};

export type LiveLogTree = {
  rootKeys: string[];
  nodes: Record<string, LiveLogNode>;
  executionStatus: LogStatus | null;
};

export const EMPTY_LIVE_LOG_TREE: LiveLogTree = {
  rootKeys: [],
  nodes: {},
  executionStatus: null,
};

const nodeKey = (indexPath: string, loopIndex: string) =>
  `${indexPath}@${loopIndex}`;

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
  iterations: {},
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

// Attach a freshly created node to its parent. Returns the parent patch, or
// null when no parent was found (orphans fall back to the current connector).
const attachToParent = (
  tree: LiveLogTree,
  node: LiveLogNode,
): Record<string, LiveLogNode> | null => {
  const parentPath = node.indexPath.split("_").slice(0, -1).join("_");
  if (!parentPath) return null;

  // Parent in the same loop context (connector child, IF child, …).
  const direct = tree.nodes[nodeKey(parentPath, node.loopIndex)];
  if (direct && direct.type !== "LOOP") {
    return { [direct.key]: { ...direct, childKeys: [...direct.childKeys, node.key] } };
  }

  // Loop parent: the child's loopIndex is the parent's plus one trailing
  // iteration index — strip it to find the loop, use it as the bucket.
  const parts = node.loopIndex.split(",");
  const iteration = parts[parts.length - 1] ?? "";
  const loopParent = tree.nodes[nodeKey(parentPath, parts.slice(0, -1).join(","))];
  if (loopParent?.type === "LOOP" && node.loopIndex) {
    return {
      [loopParent.key]: {
        ...loopParent,
        iterations: {
          ...loopParent.iterations,
          [iteration]: [...(loopParent.iterations[iteration] ?? []), node.key],
        },
      },
    };
  }
  return null;
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

export function reduceLiveLog(tree: LiveLogTree, log: ExecutionSocketLog): LiveLogTree {
  if (log.type === "EXECUTION") {
    return attachError({ ...tree, executionStatus: log.status }, log);
  }
  if (!log.indexPath) {
    return log.type === "FLOWCHART"
      ? attachError(reduceFlowchart(tree, log), log)
      : tree;
  }

  const key = nodeKey(log.indexPath, log.properties?.loopIndex ?? "");
  const existing = tree.nodes[key];
  if (existing) {
    return attachError(
      { ...tree, nodes: { ...tree.nodes, [key]: mergeNode(existing, log) } },
      log,
    );
  }

  const node = createNode(key, log);
  const parentPatch = attachToParent(tree, node);
  if (parentPatch) {
    return attachError(
      { ...tree, nodes: { ...tree.nodes, ...parentPatch, [key]: node } },
      log,
    );
  }

  // Top-level element (or orphan): attach to the open connector root.
  const rootKey =
    [...tree.rootKeys].reverse().find((k) => tree.nodes[k].status === "PENDING") ??
    tree.rootKeys[tree.rootKeys.length - 1];
  if (!rootKey) return tree;
  const root = tree.nodes[rootKey];
  return attachError(
    {
      ...tree,
      nodes: {
        ...tree.nodes,
        [rootKey]: { ...root, childKeys: [...root.childKeys, key] },
        [key]: node,
      },
    },
    log,
  );
}
