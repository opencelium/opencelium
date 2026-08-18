import type { WorkflowEdgeModel, WorkflowNodeModel } from './workflow.types';

/**
 * One in-session canvas state. Nodes/edges are held by reference — every
 * mutation path in the editor replaces them immutably, so an entry costs a few
 * pointers rather than a deep clone.
 *
 * `signature` is the graph reduced to the parts a user actually authored (see
 * `buildWorkflowUndoSignature`). Two states with the same signature are the
 * same edit, which is what keeps selection, measured sizes, hover/drag
 * decorations and test-run flags off the undo stack.
 */
export type WorkflowUndoSnapshot = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	/** Reference/enhancement bindings, kept in step with the graph so undoing a
	 * node deletion also brings back the references that were cleaned with it.
	 * `unknown[]` because the binding shape is still untyped legacy data. */
	fieldBindings: unknown[] | undefined;
	signature: string;
};

export type WorkflowUndoStack = {
	past: WorkflowUndoSnapshot[];
	present: WorkflowUndoSnapshot | null;
	future: WorkflowUndoSnapshot[];
};
