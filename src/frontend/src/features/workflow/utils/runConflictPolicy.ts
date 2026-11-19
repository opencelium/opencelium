import type { WorkflowNodeModel, WorkflowRunConflictPolicy } from '../types/workflow.types';

export const DEFAULT_RUN_CONFLICT_POLICY: WorkflowRunConflictPolicy = 'QUEUE';

const isPolicy = (value: unknown): value is WorkflowRunConflictPolicy => value === 'QUEUE' || value === 'REJECT';

// Kept on the Start node so it rides along with the graph: saved, undone and diffed like any edit.
export const readRunConflictPolicy = (nodes: WorkflowNodeModel[]): WorkflowRunConflictPolicy | undefined =>
	nodes.find((node) => node.type === 'start')?.data.runConflictPolicy;

export const withRunConflictPolicy = (nodes: WorkflowNodeModel[], policy: unknown): WorkflowNodeModel[] =>
	isPolicy(policy)
		? nodes.map((node) => (node.type === 'start' ? { ...node, data: { ...node.data, runConflictPolicy: policy } } : node))
		: nodes;
