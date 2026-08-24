import { useMemo } from 'react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { LensBindingGraph, LensElements, LensView } from './bindingLens.types';
import { buildBindingGraph } from './buildBindingGraph';
import { buildLensElements, type LensActions } from './buildLensElements';

const EMPTY_GRAPH: LensBindingGraph = {
	bindings: [],
	skipped: { malformed: 0, outsideScope: 0, unanchored: 0 },
};

type GraphParams = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings?: readonly unknown[];
	open: boolean;
};

// Recomputed whenever the nodes array changes, which includes every frame of a
// drag: the derivation is deliberately cheap enough for that (method identities
// + one graph walk, no request-config deserialization — see
// resolveMethodIdentities), and a card has to follow the node it hangs off.
export const useBindingGraph = ({ nodes, edges, fieldBindings, open }: GraphParams) =>
	useMemo(() => open ? buildBindingGraph(nodes, edges, fieldBindings) : EMPTY_GRAPH,
		[open, nodes, edges, fieldBindings]);

type Params = {
	graph: LensBindingGraph;
	nodes: WorkflowNodeModel[];
	view: LensView;
	actions: LensActions;
};

/** The drawable half of the lens — the arcs and cards for whatever is in focus.
 *  The graph itself is built one level up (useBindingGraph), because the node
 *  badges are derived from it too and neither should walk it twice. */
export const useBindingLens = ({ graph, nodes, view, actions }: Params): LensElements =>
	useMemo(() => buildLensElements(graph, nodes, view, actions), [graph, nodes, view, actions]);
