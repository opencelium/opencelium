import type { ConditionConfig } from '../components/condition-builder/conditionBuilder.types';
import type { InvalidReference, WorkflowDropMode } from '../utils/graph.dragDrop';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';

export type UseWorkflowPageOptions = {
	onDeleteNodes?: (deletedNodeIds: string[], previousNodes: WorkflowNodeModel[]) => void;
	fieldBindings?: any[];
	onFieldBindingsChange?: (fieldBindings: any[] | undefined) => void;
	confirmDependencyDrop?: (invalidReferences: InvalidReference[]) => Promise<boolean>;
};

export type DragDropTarget = {
	edge?: WorkflowEdgeModel;
	target: { nodeId: string; direction: 'right' | 'bottom' };
	distance: number;
};

export type WorkflowPosition = { x: number; y: number };

export type InsertionLayout = {
	draggedIds: Set<string>;
	placeholderIds: Set<string>;
	positionsByRealId: Map<string, WorkflowPosition>;
	sourcePositionByDraggedId: Map<string, WorkflowPosition>;
	sourceDimmedPositionByDraggedId: Map<string, WorkflowPosition>;
	placeholderPositionByDraggedId: Map<string, WorkflowPosition>;
	placeholderPositionByPreviewId: Map<string, WorkflowPosition>;
};

export type WorkflowDragSnapshot = {
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	mode: WorkflowDropMode;
	operatorConfigs: Map<string, ConditionConfig>;
	highlightedNodeIds: Set<string>;
	highlightedEdgeIds: Set<string>;
	previewEdgeKey?: string;
	previewNodeKey?: string;
	activeDropTarget?: DragDropTarget;
	pointerOffsetFromRoot?: WorkflowPosition;
	lastGhostRootPosition?: WorkflowPosition;
	lastInsertionPreview?: {
		sourceNodeId: string;
		targetNodeId: string;
		direction: 'right' | 'bottom';
		layout: InsertionLayout;
	};
};
