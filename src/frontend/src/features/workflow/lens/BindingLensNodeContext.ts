import { createContext, useContext } from 'react';
import type { NodeBindingSummary } from './bindingLens.types';

export type BindingLensNodeState = {
	summaryByNodeId: ReadonlyMap<string, NodeBindingSummary>;
	/** The method whose bindings are drawn right now — pinned, or merely hovered. */
	focusNodeId: string | null;
	/** Set only while the focus is pinned, so the badge can show it is holding. */
	pinnedNodeId: string | null;
	/** The methods at the other end of the focused method's bindings. */
	relatedNodeIds: ReadonlySet<string>;
	onToggleFocus: (nodeId: string) => void;
};

const BindingLensNodeContext = createContext<BindingLensNodeState | null>(null);

export const BindingLensNodeProvider = BindingLensNodeContext.Provider;

/** null while the lens is closed, or on a canvas mounted without it — the badge
 *  and the node's dimming are both absent then. Read through context rather than
 *  threaded onto node data: the whole point of the lens is that it derives itself
 *  per render and never enters the graph's own state. */
export const useBindingLensNode = () => useContext(BindingLensNodeContext);
