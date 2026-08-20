import { useMemo } from 'react';
import type { MethodLabelResolver } from '@features/logs';
import { buildWorkflowIndexes } from '../../api/connectionPayload';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';

/**
 * Labels the user gave the graph's steps, keyed by the same tree-path index the
 * payload's methods are built with — which is what a log line's `indexPath` is.
 *
 * `labelEdited` is the condition `buildMethodPayload` uses to send a `label` at
 * all: until a node is renamed its subtitle *is* the operation name, so passing
 * it as a label would add nothing.
 */
export const buildMethodLabels = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
): Map<string, string> => {
	const nodeById = new Map(nodes.map((node) => [node.id, node]));
	const labelByIndex = new Map<string, string>();
	buildWorkflowIndexes(nodes, edges).forEach((index, nodeId) => {
		const node = nodeById.get(nodeId);
		const label = node?.data.labelEdited ? node.data.subtitle?.trim() : undefined;
		if (label) labelByIndex.set(index, label);
	});
	return labelByIndex;
};

export const useMethodLabels = (
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
): MethodLabelResolver => useMemo(() => {
	const labelByIndex = buildMethodLabels(nodes, edges);
	return (indexPath: string) => labelByIndex.get(indexPath);
}, [nodes, edges]);
