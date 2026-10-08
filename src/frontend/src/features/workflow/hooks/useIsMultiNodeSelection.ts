import { useStore, type ReactFlowState } from '@xyflow/react';

// Every node subscribes, so the selector returns a boolean (re-render only on flip)
// and stops at the second selected node instead of counting the whole graph.
const isMultiNodeSelection = (state: ReactFlowState) => {
	let selectedCount = 0;
	for (const node of state.nodes) {
		if (node.selected && ++selectedCount > 1) return true;
	}
	return false;
};

export function useIsMultiNodeSelection() {
	return useStore(isMultiNodeSelection);
}
