import { useMemo } from 'react';
import { useEdges, useNodes } from '@xyflow/react';
import { useGetConnectorsMetaQuery } from '@entities/connector/api/connectorApi';
import { isLensElementId } from '../../../lens/lensIds';
import { buildBindingGraph } from '../../../lens/buildBindingGraph';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../../types/workflow.types';
import { buildMinimapModel } from './minimap.model';
import { collectMinimapIssues } from './minimapIssues';

/**
 * Read from the flow store rather than the page's graph state: the store holds the
 * prepared nodes, which carry the test-run failure flags and measured sizes that the
 * raw state does not. The lens is closed whenever the minimap is shown, so the only
 * lens ids to skip are stale ones from the frame it closed on.
 */
export const useWorkflowMinimap = (fieldBindings: readonly unknown[] | undefined) => {
	const flowNodes = useNodes();
	const flowEdges = useEdges();
	const { data: liveHealth } = useGetConnectorsMetaQuery();

	const nodes = useMemo(() => flowNodes.filter((node) => !isLensElementId(node.id)) as WorkflowNodeModel[],
		[flowNodes]);
	const edges = useMemo(() => flowEdges.filter((edge) => !isLensElementId(edge.id)) as WorkflowEdgeModel[],
		[flowEdges]);

	const model = useMemo(() => buildMinimapModel(nodes, edges), [nodes, edges]);
	const issues = useMemo(() => collectMinimapIssues({
		nodes, liveHealth, bindingGraph: buildBindingGraph(nodes, edges, fieldBindings),
	}), [nodes, edges, fieldBindings, liveHealth]);

	return { model, issues };
};
