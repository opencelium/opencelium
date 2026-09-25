import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';

export type IndexedWorkflowEntry = {
	index: string;
	path: number[];
	node: WorkflowNodeModel;
	source: any;
};

export type SavedUiNode = {
	id: string;
	nodeId?: string;
	index?: string;
	color?: string;
	name?: string;
	type?: WorkflowNodeModel['type'];
	position: { x: number; y: number };
	width?: number;
	height?: number;
	data?: WorkflowNodeModel['data'];
	draggable?: boolean;
	deletable?: boolean;
};

export type SavedUiEdge = WorkflowEdgeModel;
