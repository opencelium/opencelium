import { createContext, useContext } from "react";

// Shared error-trace + auto-reveal state for the live test-run tree, consumed by
// both the live rows and the REST-fetched rows (non-stored loop iterations) so a
// failure can be marked and navigated to uniformly:
//  - `isOnTrace`  — row is the failing element or an ancestor, in the matching
//    loop iterations (drives the red trace markers).
//  - `isTarget`   — row is the failing element itself (open detail + scroll).
//  - `loopIteration` — for a loop on the trace, which iteration to page to so
//    the trail continues (its REST children are fetched on demand).
//  - `nonce`      — bumped once per failed run; rows apply the reveal once.
// All matchers take a row's structural indexPath and its loop-iteration context.
export type LogErrorTrace = {
  nonce: number;
  isOnTrace: (indexPath: string, loopIndexPath: string) => boolean;
  isTarget: (indexPath: string, loopIndexPath: string) => boolean;
  loopIteration: (indexPath: string, loopIndexPath: string) => number | null;
};

const EMPTY_TRACE: LogErrorTrace = {
  nonce: 0,
  isOnTrace: () => false,
  isTarget: () => false,
  loopIteration: () => null,
};

export const LogErrorTraceContext = createContext<LogErrorTrace>(EMPTY_TRACE);

export function useLogErrorTrace(): LogErrorTrace {
  return useContext(LogErrorTraceContext);
}
