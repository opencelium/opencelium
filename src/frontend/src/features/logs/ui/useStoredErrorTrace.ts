import { useEffect, useMemo, useRef, useState } from "react";
import { store } from "@app/store/store";
import { logsApi } from "../api/logsApi";
import {
  isLocationTarget,
  loopRevealIteration,
  makeTraceMatcher,
  type RevealLocation,
} from "../model/liveLogTree";
import { findStoredErrorLocation } from "../model/findStoredErrorLocation";
import type { FlowchartChildLog } from "../model/types";
import type { LogErrorTrace } from "./logErrorTrace";

const fetchChildren = async (
  id: string,
  loopIndex?: number,
): Promise<FlowchartChildLog[]> => {
  const result = await store.dispatch(
    logsApi.endpoints.getElementChildren.initiate(
      { id, loopIndex },
      { subscribe: false },
    ),
  );
  return "data" in result && Array.isArray(result.data) ? result.data : [];
};

// Locates the failing element of a stored run and, once every level on the way
// down is in the RTK Query cache, bumps the nonce so the rows' reveal effects
// expand the path, page loops to the failing iteration and scroll the error in.
export function useStoredErrorTrace(
  executionId: string,
  isEnabled: boolean,
): LogErrorTrace {
  const [reveal, setReveal] = useState<{
    executionId: string;
    locations: RevealLocation[];
    nonce: number;
  } | null>(null);
  const nonceRef = useRef(0);

  useEffect(() => {
    if (!isEnabled) return;
    let isCancelled = false;
    void (async () => {
      const connectors = await store.dispatch(
        logsApi.endpoints.getExecutionConnectors.initiate(executionId, {
          subscribe: false,
        }),
      );
      if (isCancelled || !("data" in connectors) || !connectors.data) return;
      const target = await findStoredErrorLocation(
        connectors.data,
        fetchChildren,
      );
      if (isCancelled || !target) return;
      if (target.element.type === "OPERATION") {
        await store.dispatch(
          logsApi.endpoints.getMethodDetails.initiate(target.element.id, {
            subscribe: false,
          }),
        );
      }
      if (isCancelled) return;
      nonceRef.current += 1;
      setReveal({
        executionId,
        locations: [target.location],
        nonce: nonceRef.current,
      });
    })();
    return () => {
      isCancelled = true;
    };
  }, [executionId, isEnabled]);

  const isCurrent = isEnabled && reveal?.executionId === executionId;
  const locations = useMemo(
    () => (isCurrent && reveal ? reveal.locations : []),
    [isCurrent, reveal],
  );
  const nonce = isCurrent && reveal ? reveal.nonce : 0;

  return useMemo<LogErrorTrace>(
    () => ({
      nonce,
      isOnTrace: makeTraceMatcher(locations),
      isTarget: (indexPath, loopIndexPath) =>
        isLocationTarget(locations, indexPath, loopIndexPath),
      loopIteration: (indexPath, loopIndexPath) =>
        loopRevealIteration(locations, indexPath, loopIndexPath),
      pauseNonce: 0,
      isOnPauseTrace: () => false,
      isPauseTarget: () => false,
      pauseLoopIteration: () => null,
    }),
    [nonce, locations],
  );
}
