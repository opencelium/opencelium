import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../types/workflow.types';
import type { WorkflowCanvasProps } from './WorkflowCanvas.types';
import type { TestRunScope } from './testRunScope.utils';

export type LeafInfo = { isLeaf: boolean; rightLeaf: boolean; bottomLeaf: boolean };

export type PrepareWorkflowParams = Pick<
	WorkflowCanvasProps,
	'nodes' | 'edges' | 'activeAction' | 'isAnyNodeDragging' | 'onOpenAddStep' |
	'onOpenContextMenu' | 'onDeleteNode' | 'onOpenAggregatorEditor' |
	'jointSourceId' | 'jointVerdicts' | 'onRemoveJoint'
> & {
	cache?: PrepareWorkflowCache;
	testRunScope?: TestRunScope;
	isEditLocked?: boolean;
	testRunFailureDismissed?: boolean;
};

type NodeCacheEntry = {
	src: WorkflowNodeModel;
	sig: string;
	onAddStep: PrepareWorkflowParams['onOpenAddStep'];
	onOpenContextMenu: PrepareWorkflowParams['onOpenContextMenu'];
	onDeleteNode: PrepareWorkflowParams['onDeleteNode'];
	onOpenAggregatorEditor: PrepareWorkflowParams['onOpenAggregatorEditor'];
	onRemoveJoint: PrepareWorkflowParams['onRemoveJoint'];
	out: WorkflowNodeModel;
};

type EdgeCacheEntry = {
	src: WorkflowEdgeModel;
	highlighted: boolean;
	testRunActive: boolean;
	testRunNonce: number;
	out: WorkflowEdgeModel;
};

export type WorkflowTopology = {
	sig: string;
	onlyStartNode: boolean;
	methodInstanceById: Map<string, { index: number; color: string }>;
	highlightedBranch: { nodeIds: Set<string>; edgeIds: Set<string> };
	leafById: Map<string, LeafInfo>;
};

export type JointEdgeCache = Map<string, { sig: string; out: WorkflowEdgeModel }>;

export type PrepareWorkflowCache = {
	nodes: Map<string, NodeCacheEntry>;
	edges: Map<string, EdgeCacheEntry>;
	jointEdges: JointEdgeCache;
	topology?: WorkflowTopology;
};
