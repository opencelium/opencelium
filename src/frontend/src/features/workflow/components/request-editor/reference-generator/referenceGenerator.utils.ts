import type { Connection, MethodWithId } from '../../../types/connection';

type WorkflowEdgeLike = { source?: string; target?: string };

export const getReferenceFilterTerm = (value: string) => {
	const normalized = String(value || '');
	const splitIndex = Math.max(normalized.lastIndexOf('.'), normalized.lastIndexOf(']'));
	return (splitIndex >= 0 ? normalized.slice(splitIndex + 1) : normalized).toLowerCase();
};

const getWorkflowEdges = (connection: Connection): WorkflowEdgeLike[] => {
	const ui = connection.ui as any;
	if (Array.isArray(ui?.workflowEdges)) return ui.workflowEdges;
	if (Array.isArray(ui?.flowchartEdges)) return ui.flowchartEdges;
	return [];
};

const getUpstreamNodeIds = (methodId: string, edges: WorkflowEdgeLike[]) => {
	const sourcesByTarget = new Map<string, string[]>();
	edges.forEach(({ source, target }) => {
		if (source && target) sourcesByTarget.set(target, [...(sourcesByTarget.get(target) ?? []), source]);
	});
	const upstream = new Set<string>();
	const queue = [...(sourcesByTarget.get(methodId) ?? [])];
	while (queue.length) {
		const nodeId = queue.shift();
		if (!nodeId || upstream.has(nodeId)) continue;
		upstream.add(nodeId);
		queue.push(...(sourcesByTarget.get(nodeId) ?? []));
	}
	return upstream;
};

export const getEligibleReferenceMethods = (connection: Connection | null,
	currentMethod: MethodWithId) => {
	if (!connection) return [];
	const methods = connection.fromConnector.method;
	const edges = getWorkflowEdges(connection);
	if (edges.length) {
		const upstream = getUpstreamNodeIds(currentMethod.id, edges);
		return methods.filter((method) => method.id !== currentMethod.id && upstream.has(method.id));
	}
	const currentIndex = (currentMethod as any).index ?? (currentMethod as any).order ?? 0;
	if (currentIndex == null) return methods.filter((method) => method.id !== currentMethod.id);
	return methods.filter((method) => method.id !== currentMethod.id
		&& ((method as any).index ?? (method as any).order ?? 0) < currentIndex);
};

export const getReferenceMethodLabel = (method: MethodWithId) =>
	String(method.label || method.name || (method as any).index || method.id);
