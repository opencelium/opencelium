import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';

export type WorkflowDropMode = 'move' | 'copy';

export type InvalidReference = {
	consumerNodeId: string;
	sourceColor: string;
};

export type WorkflowDropResult = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	fieldBindings?: any[];
	invalidReferences: InvalidReference[];
	idMap?: Map<string, string>;
};

export type DropTarget = {
	nodeId: string;
	direction: 'right' | 'bottom';
};
