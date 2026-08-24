import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { cleanInvalidWorkflowReferences } from './graph.invalidReferenceCleanup';
import { findInvalidWorkflowReferences } from './graph.invalidReferences';
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
 */
export const cleanBrokenWorkflowReferences = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
	fieldBindings?: unknown[],
): BrokenReferenceCleanup => {
	const invalidReferences = uniqueReferences(
		findInvalidWorkflowReferences(nodes, edges, undefined, fieldBindings));
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
