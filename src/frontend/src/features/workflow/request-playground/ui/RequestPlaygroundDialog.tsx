import type { Connector } from '@entities/connector/model/types';
import type { WorkflowMethodConfig } from '../../types/request-config.types';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import { usePlaygroundSession } from '../hooks/usePlaygroundSession';
import { RequestPlaygroundContent } from './RequestPlaygroundContent';

export type RequestPlaygroundDialogProps = {
	open: boolean;
	node: WorkflowNodeModel | null;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings: readonly unknown[] | undefined;
	connectionId: number | null;
	connectors: readonly Connector[];
	isReadOnly: boolean;
	onApplyConfig: (nodeId: string, config: WorkflowMethodConfig) => void;
	onClose: () => void;
};

type SessionProps = Omit<RequestPlaygroundDialogProps, 'open' | 'node'> & { node: WorkflowNodeModel };

function PlaygroundSessionGate({ node, nodes, edges, fieldBindings, connectionId, connectors, ...props }: SessionProps) {
	const session = usePlaygroundSession({ node, nodes, edges, fieldBindings, connectionId, connectors });
	if (!session) return null;
	return <RequestPlaygroundContent session={session} liveNode={node} connectionId={connectionId} {...props} />;
}

export function RequestPlaygroundDialog({ open, node, ...props }: RequestPlaygroundDialogProps) {
	if (!open || !node) return null;
	// Keyed by node: every opening is a fresh session with freshly prefilled values.
	return <PlaygroundSessionGate key={node.id} node={node} {...props} />;
}
