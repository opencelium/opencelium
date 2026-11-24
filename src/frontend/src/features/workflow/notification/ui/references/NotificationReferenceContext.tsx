import { useMemo, useState, type PropsWithChildren } from 'react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../../types/workflow.types';
import { buildEditorConnection } from '../../../components/request-editor/editorConnection';
import { describeReference } from './referenceDescription';
import { NotificationReferenceContext, type NotificationReferenceContextValue } from './notificationReferenceContextValue';

type Props = PropsWithChildren<{
	nodeId: string;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings?: readonly unknown[];
}>;

export function NotificationReferenceProvider({ nodeId, nodes, edges, fieldBindings, children }: Props) {
	const [activePickerId, setActivePickerId] = useState<string | null>(null);
	const connection = useMemo(() => buildEditorConnection(nodes, edges, fieldBindings), [nodes, edges, fieldBindings]);
	const value = useMemo<NotificationReferenceContextValue>(() => {
		const methods = connection.fromConnector.method;
		return {
			connection,
			currentMethod: methods.find((method) => method.id === nodeId) ?? null,
			describe: (reference) => describeReference(reference, methods),
			activePickerId,
			setActivePickerId,
		};
	}, [connection, nodeId, activePickerId]);
	return <NotificationReferenceContext.Provider value={value}>{children}</NotificationReferenceContext.Provider>;
}
