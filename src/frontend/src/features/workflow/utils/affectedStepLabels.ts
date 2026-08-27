import type { WorkflowNodeModel } from '../types/workflow.types';

export type AffectedSteps = {
	names: string[];
	/** How many affected steps the names leave out. */
	more: number;
};

const stepLabel = (node: WorkflowNodeModel) =>
	node.data.subtitle || node.data.title || node.id;

/**
 * The steps a change breaks, by the name they carry on the canvas. A count on
 * its own ("3 other steps") tells the user the size of the damage but not where
 * it is, which is the half they need to go and fix it — and it is the same
 * count whether the three steps are next to the one being deleted or scattered
 * across a workflow they have to scroll.
 *
 * Capped rather than complete: a confirm dialog is read in a second, and a
 * clearing of forty steps is a decision about the number, not about the names.
 */
export const describeAffectedSteps = (
	nodes: WorkflowNodeModel[],
	affectedNodeIds: string[],
	limit = 3,
): AffectedSteps => {
	const byId = new Map(nodes.map((node) => [node.id, node]));
	const names = affectedNodeIds
		.map((id) => byId.get(id))
		.filter((node): node is WorkflowNodeModel => !!node)
		.map(stepLabel);
	return { names: names.slice(0, limit), more: Math.max(0, names.length - limit) };
};
