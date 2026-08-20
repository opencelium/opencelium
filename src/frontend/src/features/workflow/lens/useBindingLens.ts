import { useMemo } from 'react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { LensElements, LensView } from './bindingLens.types';
import { buildBindingGraph } from './buildBindingGraph';
import { buildLensElements, type LensActions } from './buildLensElements';

type Params = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings?: readonly unknown[];
	open: boolean;
	view: LensView;
	actions: LensActions;
};

const EMPTY_LENS: LensElements = {
	nodes: [],
	edges: [],
	summary: { total: 0, direct: 0, script: 0, invalid: 0, notShown: 0 },
};

// Recomputed whenever the nodes array changes, which includes every frame of a
// drag: the derivation is deliberately cheap enough for that (method identities
// + one graph walk, no request-config deserialization — see
// resolveMethodIdentities), and a card has to follow the node it hangs off.
export const useBindingLens = ({ nodes, edges, fieldBindings, open, view, actions }: Params) =>
	useMemo(() => open
		? buildLensElements(buildBindingGraph(nodes, edges, fieldBindings), nodes, view, actions)
		: EMPTY_LENS,
	[open, nodes, edges, fieldBindings, view, actions]);
