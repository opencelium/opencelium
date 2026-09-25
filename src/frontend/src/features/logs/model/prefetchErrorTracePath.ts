import { store } from "@app/store/store";
import { logsApi } from "../api/logsApi";
import {
  appendLoopIndex,
  loopRevealIteration,
  nodeKey,
  type LiveLogTree,
  type RevealLocation,
} from "./liveLogTree";
import type { DetailedMethodLog, LogType } from "./types";

// Shared by prefetchErrorTracePath/prefetchPauseTracePath below (which only
// care about warming the cache) and by any caller that needs the target's
// actual live execution element (e.g. resolving a canvas node's live
// response while paused — see ResponseDialog.tsx): walks the ancestor chain
// down to `target`, resolving each level's element id/type from the local
// LiveLogTree when available or a getElementChildren REST call once the path
// enters a loop's non-first iteration. `locations` feeds loopRevealIteration
// at each loop step (the error cascade passes the run's full error list —
// several failures may share a loop ancestor at different iterations — a
// single arbitrary target passes a single-item list, since there is only one
// location to resolve toward).
//
// Structural elements up to the point where the path enters a loop's
// non-first iteration are already in `tree` from the live socket stream (see
// this module's memory-bound design: only the first iteration of every loop
// is kept locally). This only ever needs to fetch from that boundary
// downward, and once it has crossed into REST territory it never goes back to
// local lookups — nothing below a dropped loop iteration was ever stored.
//
// The iteration to descend into at each loop is computed via
// `loopRevealIteration` — the exact same function the live rows call from
// their own reveal effect — rather than re-deriving it here, so this can
// never disagree with what the cascade actually requests.
export async function resolveTraceTarget(
  tree: LiveLogTree,
  target: RevealLocation,
  locations: RevealLocation[],
): Promise<{ id: string; type: LogType } | null> {
  const segments = target.indexPath.split("_");
  let loopIndexPrefix = "";
  let inRest = false;
  let parentId: string | null = null;
  let parentFetchIteration = 0;
  let leaf: { id: string; type: LogType } | null = null;

  for (let take = 1; take <= segments.length; take += 1) {
    const prefixIndexPath = segments.slice(0, take).join("_");
    let nodeType: LogType | undefined;
    let nodeId: string | undefined;

    if (!inRest) {
      const localNode = tree.nodes[nodeKey(prefixIndexPath, loopIndexPrefix)];
      if (localNode) {
        nodeType = localNode.type;
        nodeId = localNode.id;
      } else {
        inRest = true;
      }
    }
    if (inRest && nodeType === undefined) {
      if (!parentId) return null;
      const result = await store.dispatch(
        logsApi.endpoints.getElementChildren.initiate(
          { id: parentId, loopIndex: parentFetchIteration },
          { subscribe: false },
        ),
      );
      const children = "data" in result && Array.isArray(result.data) ? result.data : [];
      const match = children.find((child) => child.indexPath === prefixIndexPath);
      if (!match) return null;
      nodeType = match.type;
      nodeId = match.id;
    }
    if (!nodeId || !nodeType) return null;

    parentId = nodeId;
    leaf = { id: nodeId, type: nodeType };
    if (nodeType === "LOOP") {
      const iter = loopRevealIteration(locations, prefixIndexPath, loopIndexPrefix) ?? 0;
      loopIndexPrefix = appendLoopIndex(loopIndexPrefix, iter);
      parentFetchIteration = iter;
    } else if (nodeType === "IF") {
      parentFetchIteration = 0;
    }
  }
  return leaf;
}

// Warms the RTK Query cache for every getElementChildren / getMethodDetails
// call the test-run reveal will need to expand down to the failing element
// and show its detail, so that when TestRunProvider bumps errorRevealNonce
// the cascade of on-trace rows (LiveConnectorRow / LiveLogElementRow /
// LogElementRow / MethodLogDetails, all already nonce- or expanded-gated)
// finds every query already resolved — no per-level network wait, and no
// spinner on the target's own detail panel, during the reveal itself.
export async function prefetchErrorTracePath(tree: LiveLogTree): Promise<void> {
  const location = tree.errorLocations[0];
  if (!location) return;

  const leaf = await resolveTraceTarget(tree, location, tree.errorLocations);
  if (leaf?.type === "OPERATION") {
    // The target itself: its row auto-expands on reveal and, unless the
    // light listing already carried an error message, renders
    // MethodLogDetails — which fetches request/response/error detail on
    // its own via getMethodDetails. Warm that too, so the reveal's final
    // "arrived" moment doesn't land on its own spinner.
    await store.dispatch(logsApi.endpoints.getMethodDetails.initiate(leaf.id, { subscribe: false }));
  }
}

// Same walk, for the debugger's pause target — warms only the tree STRUCTURE
// (getElementChildren down every ancestor, paging loops to the iteration the
// run was actually on when it paused) so the tree can expand all the way down
// to the paused-on row and render it immediately, expandable and clickable.
// Deliberately does NOT prefetch getMethodDetails: the paused-on element's own
// request/response is fetched only when the user opens its row, same as every
// other row in this app — pausing reveals the PATH to the node, not its data.
export async function prefetchPauseTracePath(
  tree: LiveLogTree,
  target: RevealLocation,
): Promise<void> {
  await resolveTraceTarget(tree, target, [target]);
}

// Fetches full method detail by dispatching directly against the real app
// store singleton, bypassing the useGetMethodDetailsQuery hook entirely.
// Needed by any caller that might render inside a FOREIGN nested
// react-redux <Provider> — e.g. useLiveReferenceValue.ts, called from
// BodyPointer/RequestReferenceTokens/XmlReferenceTokens, which sit inside
// MethodConfigDialog's own legacy Redux store. RTK Query's generated hooks
// resolve useSelector/useDispatch against the NEAREST ancestor <Provider>,
// which there is the legacy store (no `api` reducer/middleware) — silently
// wrong at best, an "RTK-Query middleware not added" crash at worst. Dispatch
// against the explicit store import instead, same as resolveTraceTarget's own
// getElementChildren/getMethodDetails calls above, so it's correct regardless
// of which component tree the caller happens to be mounted in.
export async function fetchMethodDetails(id: string): Promise<DetailedMethodLog | null> {
  const result = await store.dispatch(logsApi.endpoints.getMethodDetails.initiate(id, { subscribe: false }));
  return "data" in result && result.data ? result.data : null;
}
