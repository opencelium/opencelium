import { useMemo } from 'react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import type { LensBinding } from '../bindingLens.types';
import { buildBindingGraph } from '../buildBindingGraph';

type Params = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings?: readonly unknown[];
	selectedKey: string | null;
};

/** Re-derived rather than carried in state: the selection is a key, and the
 *  binding behind it has to reflect the current graph (a deleted method, a moved
 *  node) instead of a snapshot taken when it was clicked. */
export const useSelectedBinding = ({ nodes, edges, fieldBindings,
	selectedKey }: Params): LensBinding | null =>
	useMemo(() => {
		if (!selectedKey) return null;
		return buildBindingGraph(nodes, edges, fieldBindings).bindings
			.find((binding) => binding.key === selectedKey) ?? null;
	}, [edges, fieldBindings, nodes, selectedKey]);
