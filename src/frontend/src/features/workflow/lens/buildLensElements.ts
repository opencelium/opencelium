import { resolveMethodIdentities } from '../components/request-editor/legacyConnectionBuilder';
import type { WorkflowNodeModel } from '../types/workflow.types';
import type { LensBinding, LensBindingGraph, LensElements, LensView } from './bindingLens.types';
import { isBindingInFocus } from './bindingFocus';
import { buildLensCards } from './buildLensCards';
import { buildLensPairEdges } from './buildLensEdges';
import { buildLensFieldEdges } from './buildLensFieldEdges';
import { bindingAnchorNodeId, buildLensSummary } from './buildLensSummary';

export type LensActions = {
	onExpandPair: (nodeIds: string[]) => void;
	onCollapseCard: (nodeId: string) => void;
	onSelectBinding: (bindingKey: string) => void;
};

const buildAnchors = (nodes: WorkflowNodeModel[], neededIds: Set<string>) => {
	if (neededIds.size === 0) return new Map<string, never>();
	const positionById = new Map(nodes.map((node) => [node.id, node.position]));
	return new Map(resolveMethodIdentities(nodes)
		.filter((identity) => neededIds.has(identity.id) && positionById.has(identity.id))
		.map((identity) => [identity.id, {
			id: identity.id,
			position: positionById.get(identity.id) as { x: number; y: number },
			label: identity.name,
			color: identity.color,
		}]));
};

export const buildLensElements = (
	graph: LensBindingGraph,
	nodes: WorkflowNodeModel[],
	view: LensView,
	actions: LensActions,
): LensElements => {
	// The legend states the whole workflow's tally whatever is in focus: it is the
	// overview the focused view is a slice of, not a description of the slice.
	const summary = buildLensSummary(graph);
	if (!view.focusNodeId) return { nodes: [], edges: [], summary };

	const focusNodeId = view.focusNodeId;
	const inFocus = graph.bindings.filter((binding) => isBindingInFocus(binding, focusNodeId));
	const expanded = new Set(view.expandedNodeIds);
	// An arc needs both ends; a card row needs only its own, which is how a
	// reference to a method that is no longer there still shows up as a broken row
	// on the method that wanted it (buildLensCards checks each end itself).
	const drawable = inFocus.filter((binding) =>
		!!bindingAnchorNodeId(binding) && !!binding.consumer.nodeId);
	const touchesExpanded = (binding: LensBinding) =>
		expanded.has(bindingAnchorNodeId(binding) as string)
		|| expanded.has(binding.consumer.nodeId as string);

	return {
		nodes: buildLensCards(inFocus, expanded, buildAnchors(nodes, expanded),
			view.selectedKey, actions.onCollapseCard, actions.onSelectBinding),
		edges: [
			...buildLensPairEdges(drawable.filter((binding) => !touchesExpanded(binding)),
				view.selectedKey, actions),
			...buildLensFieldEdges(drawable.filter(touchesExpanded), expanded,
				view.selectedKey, actions.onSelectBinding),
		],
		summary,
	};
};
