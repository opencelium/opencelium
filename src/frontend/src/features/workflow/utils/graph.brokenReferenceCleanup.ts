import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { InvalidReference } from './graph.dragDrop.types';
import { cleanInvalidWorkflowReferences } from './graph.invalidReferenceCleanup';
import { collectProviderColors, findInvalidWorkflowReferences } from './graph.invalidReferences';
import { uniqueReferences } from './graph.referenceColors';

export type BrokenReferenceCleanup = {
	nodes: WorkflowNodeModel[];
	/** `unknown[]` at this boundary: the field bindings are a legacy `any[]` shape
	 *  further in, and this pass only ever hands them through. */
	fieldBindings?: unknown[];
	/** Consumer/provider-colour pairs the graph can no longer satisfy; 0 when the
	 *  change costs nothing. Not what a confirmation should state — one step
	 *  referencing one deleted method in four of its fields is one pair. */
	brokenCount: number;
	/** The steps that lose a reference. What a confirmation counts, because it is
	 *  what the user will have to go and fix. */
	affectedNodeIds: string[];
};

/** The graph as it stood before the change, against which this pass decides what
 *  the change itself broke. */
export type BrokenReferenceBaseline = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
};

const referenceKey = (reference: InvalidReference) =>
	`${reference.consumerNodeId} ${reference.sourceColor}`;

const setDifference = (left: Set<string>, right: Set<string>) =>
	new Set([...left].filter((item) => !right.has(item)));

/**
 * Clears every reference the graph as given can no longer satisfy: a field value
 * loses the reference, an enhancement loses the argument (its script keeping
 * VARIABLE_NOT_EXIST where that argument was used), and an operator condition
 * loses the term.
 *
 * Run it after a structural change that can invalidate a reference without moving
 * anything — deleting a method, removing a joint. A drop runs the same detection
 * and cleanup through graph.dragDrop; this is that pass for changes which do not
 * go through it, and which used to leave the references dangling instead.
 *
 * Pass `baseline` — the same graph before the change — whenever there is one. A
 * loaded connection can already hold references this visibility model calls
 * unreadable (a legacy workflow reading a method inside an earlier loop body, for
 * instance): nothing clears them on load, so without a baseline they are charged
 * to whichever structural edit happens to run this pass next, and removing a
 * joint would clear references that never depended on it. With a baseline the
 * only references cleared are the ones this change is answerable for:
 *
 *  - readable before and not after — a joint removal clears exactly the
 *    references the joint was what made readable, and nothing else;
 *  - naming a method the change took off the graph — out of scope and provider
 *    gone are different failures, and a reference to a method that is not there
 *    any more is what this pass was written for. A provider already missing
 *    before the change is not the change's doing, so it stays.
 */
export const cleanBrokenWorkflowReferences = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	fieldBindings?: unknown[],
	baseline?: BrokenReferenceBaseline,
): BrokenReferenceCleanup => {
	const alreadyBroken = baseline
		? new Set(findInvalidWorkflowReferences(
			baseline.nodes, baseline.edges, undefined, fieldBindings).map(referenceKey))
		: undefined;
	const removedProviderColors = baseline
		? setDifference(collectProviderColors(baseline.nodes), collectProviderColors(nodes))
		: undefined;
	const invalidReferences = uniqueReferences(
		findInvalidWorkflowReferences(nodes, edges, undefined, fieldBindings))
		.filter((reference) => !alreadyBroken?.has(referenceKey(reference))
			|| removedProviderColors?.has(reference.sourceColor));
	if (invalidReferences.length === 0) {
		return { nodes, fieldBindings, brokenCount: 0, affectedNodeIds: [] };
	}

	const cleaned = cleanInvalidWorkflowReferences(nodes, invalidReferences, fieldBindings);
	return {
		nodes: cleaned.nodes,
		fieldBindings: cleaned.fieldBindings,
		brokenCount: invalidReferences.length,
		affectedNodeIds: [...new Set(invalidReferences.map((item) => item.consumerNodeId))],
	};
};
