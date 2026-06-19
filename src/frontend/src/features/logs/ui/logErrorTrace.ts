import { createContext, useContext } from "react";

// Predicate `(indexPath, loopIndexPath) => boolean` telling whether a row lies
// on a path to an error, in the matching loop iterations (see
// `makeErrorTraceMatcher`). Provided by the live test-run tree and consumed by
// both the live rows and the REST-fetched rows (used for non-stored loop
// iterations), so a red trace marker can be drawn on every row in the chain
// regardless of how it was rendered. Defaults to "never on trace".
export type ErrorTraceMatcher = (indexPath: string, loopIndexPath: string) => boolean;

export const LogErrorTraceContext = createContext<ErrorTraceMatcher>(() => false);

export function useLogErrorTrace(): ErrorTraceMatcher {
  return useContext(LogErrorTraceContext);
}
