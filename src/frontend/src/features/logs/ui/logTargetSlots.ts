import { createContext, type ReactNode } from "react";

// Lets the panel hosting a tree add its own UI to the failing element — the
// workflow test run puts its AI actions there — without this feature knowing
// about it. The element is matched by structural position and loop context.
export type LogTargetSlots = {
  target?: { indexPath: string; loopIndex: string } | null;
  // On the target's row, before its status dot.
  targetActions?: ReactNode;
  // Right under the target's error.
  targetAddon?: ReactNode;
  // In the tree's top row, before its status dot: the run's outcome.
  headerStatus?: ReactNode;
};

export const LogTargetSlotsContext = createContext<LogTargetSlots>({});

export const LogTargetSlotsProvider = LogTargetSlotsContext.Provider;

