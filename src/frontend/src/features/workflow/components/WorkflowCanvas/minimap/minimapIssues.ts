import type { ConnectorMetaDTO } from '@entities/connector/model/types';
import type { LensBindingGraph, LensInvalidReason } from '../../../lens/bindingLens.types';
import type { WorkflowNodeModel } from '../../../types/workflow.types';

export type MinimapProblem =
	/** Set on the node by a rejected save or test run (see useWorkflowValidation). */
	| { kind: 'validation'; message: string }
	| { kind: 'test-run'; message: string | null }
	| { kind: 'connector'; status: 'AUTH_FAILED' | 'DOWN'; lastError: string | null }
	| { kind: 'binding'; reason: LensInvalidReason; count: number }
	| { kind: 'operator-unconfigured'; operator: 'if' | 'loop' };

export type MinimapIssue = { nodeId: string; title: string; problems: MinimapProblem[] };

type Params = {
	nodes: WorkflowNodeModel[];
	bindingGraph: LensBindingGraph;
	/** Live health from the connector status socket, which outranks what the node was loaded with. */
	liveHealth: readonly ConnectorMetaDTO[] | undefined;
};

const connectorProblem = (node: WorkflowNodeModel, liveHealth: Params['liveHealth']): MinimapProblem | null => {
	const connector = node.data.kind === 'connector' ? node.data.connector : undefined;
	if (!connector) return null;
	const live = liveHealth?.find((health) => health.connectorId === connector.connectorId);
	const status = live?.status ?? connector.status;
	// The same pair isConnectorConnectionError checks, spelled out so the union narrows.
	if (status !== 'AUTH_FAILED' && status !== 'DOWN') return null;
	return { kind: 'connector', status, lastError: live?.lastTestError ?? connector.lastTestError ?? null };
};

const operatorProblem = (node: WorkflowNodeModel): MinimapProblem | null => {
	const { kind } = node.data;
	if (kind !== 'if' && kind !== 'loop') return null;
	return node.data.conditionConfig?.expression.trim() ? null : { kind: 'operator-unconfigured', operator: kind };
};

const bindingProblemsByNode = (graph: LensBindingGraph): Map<string, MinimapProblem[]> => {
	const counts = new Map<string, Map<LensInvalidReason, number>>();
	graph.bindings.forEach(({ consumer, invalidReason }) => {
		if (!invalidReason || !consumer.nodeId) return;
		const byReason = counts.get(consumer.nodeId) ?? new Map<LensInvalidReason, number>();
		byReason.set(invalidReason, (byReason.get(invalidReason) ?? 0) + 1);
		counts.set(consumer.nodeId, byReason);
	});
	return new Map([...counts].map(([nodeId, byReason]) => [nodeId,
		[...byReason].map(([reason, count]): MinimapProblem => ({ kind: 'binding', reason, count }))]));
};

/** Reading order — left to right, then top to bottom — so the arrows walk the graph the way it runs. */
const byPosition = (a: WorkflowNodeModel, b: WorkflowNodeModel) =>
	a.position.x - b.position.x || a.position.y - b.position.y;

export const collectMinimapIssues = ({ nodes, bindingGraph, liveHealth }: Params): MinimapIssue[] => {
	const bindingProblems = bindingProblemsByNode(bindingGraph);
	return [...nodes]
		.filter((node) => node.data.kind !== 'comment' && !node.data.dropPlaceholder)
		.sort(byPosition)
		.flatMap((node): MinimapIssue[] => {
			const problems: MinimapProblem[] = [
				...(node.data.hasError && node.data.errorMessage
					? [{ kind: 'validation', message: node.data.errorMessage } as const] : []),
				...(node.data.testRunFailedVisible
					? [{ kind: 'test-run', message: node.data.testRunFailedMessage ?? null } as const] : []),
				...[connectorProblem(node, liveHealth), operatorProblem(node)].filter((p) => p !== null),
				...(bindingProblems.get(node.id) ?? []),
			];
			// The label the canvas prints under the node; `title` alone is the method colour's name.
			return problems.length ? [{ nodeId: node.id, title: node.data.subtitle || node.data.title, problems }] : [];
		});
};
