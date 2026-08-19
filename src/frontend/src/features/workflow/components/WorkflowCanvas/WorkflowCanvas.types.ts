import type {
	OnConnect,
	OnEdgesChange,
	OnNodeDrag,
	NodeMouseHandler,
	OnNodesChange,
	ReactFlowInstance,
	Viewport,
} from '@xyflow/react';
import type { PropsWithChildren } from 'react';
import type {
	WorkflowAction,
	WorkflowContextMenu,
	WorkflowEdgeModel,
	WorkflowNodeModel,
} from '../../types/workflow.types';

export type WorkflowCanvasProps = PropsWithChildren<{
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	isAnyNodeDragging?: boolean;
	activeAction: WorkflowAction | null;
	onNodesChange: OnNodesChange<WorkflowNodeModel>;
	onEdgesChange: OnEdgesChange<WorkflowEdgeModel>;
	onConnect: OnConnect;
	onNodeDragStart?: OnNodeDrag<WorkflowNodeModel>;
	onNodeDrag?: OnNodeDrag<WorkflowNodeModel>;
	onNodeDragStop?: OnNodeDrag<WorkflowNodeModel>;
	onOpenAddStep: (action: WorkflowAction) => void;
	onOpenContextMenu: (menu: WorkflowContextMenu | null) => void;
	onNodeDoubleClick?: NodeMouseHandler<WorkflowNodeModel>;
	onDeleteNode: (nodeId: string) => void;
	onOpenAggregatorEditor: (nodeId: string) => void;
	onChangeCommentText: (nodeId: string, text: string) => void;
	onToggleComment: (commentNodeId: string) => void;
	onPaneClick?: () => void;
	restoredViewport?: Viewport;
	viewportRestoreVersion?: number;
	centerStartVersion?: number;
	onInit?: (instance: ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel>) => void;
}>;
