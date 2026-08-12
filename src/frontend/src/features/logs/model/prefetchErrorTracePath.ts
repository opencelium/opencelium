import { store } from "@app/store/store";
import { logsApi } from "../api/logsApi";
import { appendLoopIndex, loopRevealIteration, nodeKey, type LiveLogTree } from "./liveLogTree";
import type { LogType } from "./types";

// Warms the RTK Query cache for every getElementChildren / getMethodDetails
// call the test-run reveal will need to expand down to the failing element
// and show its detail, so that when TestRunProvider bumps errorRevealNonce
// the cascade of on-trace rows (LiveConnectorRow / LiveLogElementRow /
// LogElementRow / MethodLogDetails, all already nonce- or expanded-gated)
// finds every query already resolved — no per-level network wait, and no
// spinner on the target's own detail panel, during the reveal itself.
//
// Structural elements up to the point where the path enters a loop's
// non-first iteration are already in `tree` from the live socket stream
// (see this module's memory-bound design: only the first iteration of every
// loop is kept locally). This only ever needs to fetch from that boundary
// downward, and once it has crossed into REST territory it never goes back
// to local lookups — nothing below a dropped loop iteration was ever stored.
//
// The iteration to descend into at each loop is computed via
// `loopRevealIteration` — the exact same function the live rows call from
// their own reveal effect — rather than re-deriving it here, so this can
// never disagree with what the cascade actually requests.
export async function prefetchErrorTracePath(tree: LiveLogTree): Promise<void> {
  const location = tree.errorLocations[0];
  if (!location) return;

  const segments = location.indexPath.split("_");
  let loopIndexPrefix = "";
  let inRest = false;
  let parentId: string | null = null;
  let parentFetchIteration = 0;

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
      if (!parentId) return;
      const result = await store.dispatch(
        logsApi.endpoints.getElementChildren.initiate(
          { id: parentId, loopIndex: parentFetchIteration },
          { subscribe: false },
        ),
      );
      const children = "data" in result && Array.isArray(result.data) ? result.data : [];
      const match = children.find((child) => child.indexPath === prefixIndexPath);
      if (!match) return;
      nodeType = match.type;
      nodeId = match.id;
    }
    if (!nodeId || !nodeType) return;

    parentId = nodeId;
    if (nodeType === "LOOP") {
      const iter = loopRevealIteration(tree.errorLocations, prefixIndexPath, loopIndexPrefix) ?? 0;
      loopIndexPrefix = appendLoopIndex(loopIndexPrefix, iter);
      parentFetchIteration = iter;
    } else if (nodeType === "IF") {
      parentFetchIteration = 0;
    } else if (nodeType === "OPERATION" && take === segments.length) {
      // The target itself: its row auto-expands on reveal and, unless the
      // light listing already carried an error message, renders
      // MethodLogDetails — which fetches request/response/error detail on
      // its own via getMethodDetails. Warm that too, so the reveal's final
      // "arrived" moment doesn't land on its own spinner.
      await store.dispatch(logsApi.endpoints.getMethodDetails.initiate(nodeId, { subscribe: false }));
    }
  }
}
