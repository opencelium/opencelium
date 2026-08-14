import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import type { WorkflowCanvasProps } from './WorkflowCanvas.types';

export type LeafInfo = { isLeaf: boolean; rightLeaf: boolean; bottomLeaf: boolean };

export type PrepareWorkflowParams = Pick<
	WorkflowCanvasProps,
	'nodes' | 'edges' | 'activeAction' | 'isAnyNodeDragging' | 'onOpenAddStep' |
	'onOpenContextMenu' | 'onDeleteNode' | 'onOpenAggregatorEditor'
> & { cache?: PrepareWorkflowCache };

type NodeCacheEntry = {
	src: WorkflowNodeModel;
	sig: string;
	onAddStep: PrepareWorkflowParams['onOpenAddStep'];
	onOpenContextMenu: PrepareWorkflowParams['onOpenContextMenu'];
	onDeleteNode: PrepareWorkflowParams['onDeleteNode'];
	onOpenAggregatorEditor: PrepareWorkflowParams['onOpenAggregatorEditor'];
	out: WorkflowNodeModel;
};

type EdgeCacheEntry = {
	src: WorkflowEdgeModel;
	highlighted: boolean;
	out: WorkflowEdgeModel;
};

export type WorkflowTopology = {
	sig: string;
	onlyStartNode: boolean;
	methodInstanceById: Map<string, { index: number; color: string }>;
	highlightedBranch: { nodeIds: Set<string>; edgeIds: Set<string> };
	leafById: Map<string, LeafInfo>;
};

export type PrepareWorkflowCache = {
	nodes: Map<string, NodeCacheEntry>;
	edges: Map<string, EdgeCacheEntry>;
	topology?: WorkflowTopology;
};
