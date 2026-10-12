import { useMemo } from 'react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import type { LensBinding } from '../bindingLens.types';
import { buildBindingGraph } from '../buildBindingGraph';
import { fieldGroupKey } from '../groupBindingsByField';

type Params = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings?: readonly unknown[];
	selectedKey: string | null;
};

type SelectedBinding = {
	binding: LensBinding | null;
	/** Every reference filling the same field through the same source, the
	 *  selected one included — what the drawer's header lists. */
	fieldBindings: LensBinding[];
};

/** Re-derived rather than carried in state: the selection is a key, and the
 *  binding behind it has to reflect the current graph (a deleted method, a moved
 *  node) instead of a snapshot taken when it was clicked. */
export const useSelectedBinding = ({ nodes, edges, fieldBindings,
	selectedKey }: Params): SelectedBinding =>
	useMemo(() => {
		if (!selectedKey) return { binding: null, fieldBindings: [] };
		const { bindings } = buildBindingGraph(nodes, edges, fieldBindings);
		const binding = bindings.find((item) => item.key === selectedKey) ?? null;
		if (!binding) return { binding: null, fieldBindings: [] };
		const groupKey = fieldGroupKey(binding);
		return { binding, fieldBindings: bindings.filter((item) => fieldGroupKey(item) === groupKey) };
	}, [edges, fieldBindings, nodes, selectedKey]);
