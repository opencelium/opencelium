import { createContext, useContext } from "react";

// Drives the live tree's "jump to the error" behaviour after a failed test run.
// `nonce` bumps once per reveal request so rows apply it exactly once (and never
// fight the user re-collapsing afterwards). `revealKeys` is the chain of node
// keys from the connector root down to the failing element; `targetKey` is that
// element — the row that should open its detail and scroll into view.
export type LiveRevealState = {
  nonce: number;
  revealKeys: Set<string>;
  targetKey: string | null;
};

const EMPTY_REVEAL: LiveRevealState = {
  nonce: 0,
  revealKeys: new Set<string>(),
  targetKey: null,
};

export const LiveRevealContext = createContext<LiveRevealState>(EMPTY_REVEAL);

export function useLiveReveal(): LiveRevealState {
  return useContext(LiveRevealContext);
}
