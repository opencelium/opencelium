import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { TestMethodDialogContent } from './TestMethodDialogContent';
import { useTestMethodContext } from './useTestMethodContext';

export type TestMethodDialogProps = {
	open: boolean;
	node: WorkflowNodeModel | null;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings: readonly unknown[] | undefined;
	connectionId: number | null;
	onClose: () => void;
};

type SessionProps = Omit<TestMethodDialogProps, 'open' | 'node'> & { node: WorkflowNodeModel };

function TestMethodSession({ node, nodes, edges, fieldBindings, connectionId, onClose }: SessionProps) {
	const context = useTestMethodContext({ nodeId: node.id, nodes, edges, fieldBindings, connectionId });
	if (!context) return null;
	return <TestMethodDialogContent context={context} title={node.data.subtitle || context.draft.name}
		connectionId={connectionId} onClose={onClose} />;
}

export function TestMethodDialog({ open, node, ...props }: TestMethodDialogProps) {
	if (!open || !node) return null;
	// Keyed by node: every opening is a fresh session with freshly prefilled inputs.
	return <TestMethodSession key={node.id} node={node} {...props} />;
}
