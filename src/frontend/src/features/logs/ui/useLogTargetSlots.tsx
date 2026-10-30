import { useContext } from "react";
import { LogTargetSlotsContext } from "./logTargetSlots";

// `depth` is the error's indent, which the addon lines up with.
export function useLogTargetSlots(indexPath: string, loopIndex: string, depth = 0) {
  const slots = useContext(LogTargetSlotsContext);
  const isTarget = !!slots.target && slots.target.indexPath === indexPath && slots.target.loopIndex === loopIndex;
  return {
    actions: isTarget && slots.targetActions ? (
      // The row toggles on click; its actions must not.
      <span className="oc-log-target-actions" onClick={(event) => event.stopPropagation()}>{slots.targetActions}</span>
    ) : null,
    addon: isTarget && slots.targetAddon ? (
      <div className="oc-log-target-addon" style={{ paddingLeft: 22 + depth * 22 }}>{slots.targetAddon}</div>
    ) : null,
    headerStatus: slots.headerStatus ?? null,
  };
}
