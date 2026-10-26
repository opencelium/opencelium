import { appendLoopIndex, type RevealLocation } from "./liveLogTree";
import type { FlowchartChildLog, FlowchartLog, LogType } from "./types";

export type FetchElementChildren = (
  id: string,
  loopIndex?: number,
) => Promise<FlowchartChildLog[]>;

export type StoredErrorTarget = {
  location: RevealLocation;
  element: { id: string; type: LogType };
};

// A stored run can't be followed down to its failure by status: the error is
// recorded only on the failing element (ancestors stay COMPLETE), and some
// failures — e.g. an exception while building a loop's values — reach the raw
// log file but are not stored on any element at all. What always holds is that
// a run stops at its first error, so the failure is wherever execution stopped:
// the last child logged at every level, and inside a loop the last iteration
// that ran (iterations that never ran have no children, so the ones that did
// form a prefix and can be binary-searched). A container that started but
// logged nothing inside is itself where the run stopped.
export async function findStoredErrorLocation(
  connectors: FlowchartLog[],
  fetchChildren: FetchElementChildren,
): Promise<StoredErrorTarget | null> {
  for (const connector of [...connectors].reverse()) {
    const target = await lastExecuted(
      connector.id,
      undefined,
      "",
      fetchChildren,
    );
    if (target) return target;
  }
  return null;
}

async function lastExecuted(
  parentId: string,
  loopIndex: number | undefined,
  loopIndexPath: string,
  fetchChildren: FetchElementChildren,
): Promise<StoredErrorTarget | null> {
  const children = await fetchChildren(parentId, loopIndex);
  const last = children.at(-1);
  if (!last) return null;
  const target: StoredErrorTarget = {
    location: { indexPath: last.indexPath, loopIndex: loopIndexPath },
    element: { id: last.id, type: last.type },
  };
  if (last.error?.message) return target;
  switch (last.type) {
    case "OPERATION":
      return target;
    case "IF":
      return (
        (await lastExecuted(last.id, 0, loopIndexPath, fetchChildren)) ?? target
      );
    case "LOOP": {
      const iteration = await lastRunIteration(
        last.id,
        last.properties.size,
        fetchChildren,
      );
      if (iteration === null) return target;
      return (
        (await lastExecuted(
          last.id,
          iteration,
          appendLoopIndex(loopIndexPath, iteration),
          fetchChildren,
        )) ?? target
      );
    }
    default: {
      const _exhaustive: never = last;
      return _exhaustive;
    }
  }
}

async function lastRunIteration(
  loopId: string,
  size: number,
  fetchChildren: FetchElementChildren,
): Promise<number | null> {
  let low = 0;
  let high = (Number(size) || 0) - 1;
  let last: number | null = null;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const children = await fetchChildren(loopId, mid);
    if (children.length > 0) {
      last = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return last;
}
