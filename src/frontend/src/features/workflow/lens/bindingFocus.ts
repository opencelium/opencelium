import type { LensBinding, LensBindingGraph, NodeBindingSummary } from './bindingLens.types';
import { bindingAnchorNodeId } from './buildLensSummary';

/** A binding belongs to a method's focus from either end: the method reads it
 *  (consumer) or is read by it (provider — or the provider it names but cannot
 *  read, so a break shows up on the method it was meant to happen on). */
export const isBindingInFocus = (binding: LensBinding, focusNodeId: string) =>
	binding.consumer.nodeId === focusNodeId || bindingAnchorNodeId(binding) === focusNodeId;

/** The methods at the other end of the focused method's bindings. Everything
 *  outside this set (and the focused node itself) is dimmed on the canvas. */
export const resolveFocusRelatedNodeIds = (
	graph: LensBindingGraph,
	focusNodeId: string | null,
): ReadonlySet<string> => {
	const related = new Set<string>();
	if (!focusNodeId) return related;
	graph.bindings.forEach((binding) => {
		if (!isBindingInFocus(binding, focusNodeId)) return;
		const anchorNodeId = bindingAnchorNodeId(binding);
		if (binding.consumer.nodeId) related.add(binding.consumer.nodeId);
		if (anchorNodeId) related.add(anchorNodeId);
	});
	related.delete(focusNodeId);
	return related;
};

const countPath = (paths: Map<string, Set<string>>, nodeId: string, path: string) => {
	const forNode = paths.get(nodeId) ?? new Set<string>();
	forNode.add(path);
	paths.set(nodeId, forNode);
};

/** Per-method counts for the node badges — the lens's at-rest state, so this
 *  describes every binding that touches a method, including the ones no arc can
 *  be drawn for (a reference naming a method that is gone has no second end, and
 *  used to be visible only as the legend's "not shown" tally). */
export const buildNodeBindingSummaries = (
	graph: LensBindingGraph,
): ReadonlyMap<string, NodeBindingSummary> => {
	const receives = new Map<string, Set<string>>();
	const provides = new Map<string, Set<string>>();
	const broken = new Map<string, number>();
	const addBroken = (nodeId: string) => broken.set(nodeId, (broken.get(nodeId) ?? 0) + 1);

	graph.bindings.forEach((binding) => {
		const consumerNodeId = binding.consumer.nodeId;
		const anchorNodeId = bindingAnchorNodeId(binding);
		if (consumerNodeId) countPath(receives, consumerNodeId, binding.consumer.path);
		// A broken reference provides nothing — the field cannot be read from the
		// consumer at all — so it is counted only as the break it is, on both the
		// method that wanted it and the method it named.
		if (anchorNodeId && !binding.invalidReason) {
			countPath(provides, anchorNodeId, binding.provider.path);
		}
		if (binding.invalidReason) {
			if (consumerNodeId) addBroken(consumerNodeId);
			if (anchorNodeId) addBroken(anchorNodeId);
		}
	});

	const summaries = new Map<string, NodeBindingSummary>();
	[...receives.keys(), ...provides.keys(), ...broken.keys()].forEach((nodeId) => {
		if (summaries.has(nodeId)) return;
		summaries.set(nodeId, {
			receives: receives.get(nodeId)?.size ?? 0,
			provides: provides.get(nodeId)?.size ?? 0,
			broken: broken.get(nodeId) ?? 0,
		});
	});
	return summaries;
};
