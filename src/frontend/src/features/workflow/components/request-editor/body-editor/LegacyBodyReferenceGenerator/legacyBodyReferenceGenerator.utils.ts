import type { Connection, MethodWithId } from '../../../../types/connection';
import type { WorkflowEdgeLike } from './LegacyBodyReferenceGenerator.types';

const getWorkflowEdges = (connection: Connection): WorkflowEdgeLike[] => {
	const ui = connection.ui as any;
	if (Array.isArray(ui?.workflowEdges)) return ui.workflowEdges;
	if (Array.isArray(ui?.flowchartEdges)) return ui.flowchartEdges;
	return [];
};

const getUpstreamNodeIds = (currentMethodId: string, edges: WorkflowEdgeLike[]) => {
	const sourcesByTarget = new Map<string, string[]>();
	edges.forEach((edge) => {
		if (!edge.source || !edge.target) return;
		sourcesByTarget.set(edge.target, [...(sourcesByTarget.get(edge.target) ?? []), edge.source]);
	});
	const upstream = new Set<string>();
	const queue = [...(sourcesByTarget.get(currentMethodId) ?? [])];
	while (queue.length) {
		const nodeId = queue.shift();
		if (!nodeId || upstream.has(nodeId)) continue;
		upstream.add(nodeId);
		queue.push(...(sourcesByTarget.get(nodeId) ?? []));
	}
	return upstream;
};

export const getReferenceMethods = (connection: Connection, currentMethod: MethodWithId) => {
	const workflowEdges = getWorkflowEdges(connection);
	if (workflowEdges.length) {
		const upstream = getUpstreamNodeIds(currentMethod.id, workflowEdges);
		return connection.fromConnector.method.filter(
			(method) => method.id !== currentMethod.id && upstream.has(method.id),
		);
	}
	return connection.fromConnector.method.filter(
		(method) => method.id !== currentMethod.id && Number(method.index) < Number(currentMethod.index),
	);
};
