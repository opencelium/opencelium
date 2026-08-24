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
import type { LensView } from '../../lens/bindingLens.types';
import type { LensActions } from '../../lens/buildLensElements';
import type {
	WorkflowAction,
	WorkflowContextMenu,
	WorkflowEdgeModel,
	WorkflowNodeModel,
} from '../../types/workflow.types';
import type { JointTargetVerdict } from '../../utils/jumpValidator';

export type WorkflowCanvasProps = PropsWithChildren<{
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
	isAnyNodeDragging?: boolean;
	activeAction: WorkflowAction | null;
	jointSourceId?: string | null;
	/** Verdict per node while a joint is being drawn from `jointSourceId` — legal
	 * targets light up, the rest carry the reason they cannot be picked. */
	jointVerdicts?: Map<string, JointTargetVerdict>;
	onConfirmJoint?: (targetNodeId: string) => void;
	onCancelJoint?: () => void;
	onAddJoint?: (nodeId: string) => void;
	onRemoveJoint?: (nodeId: string) => void;
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
	onAddComment: (nodeId: string) => void;
	onPaneClick?: () => void;
	fieldBindings?: readonly unknown[];
	bindingLens?: {
		open: boolean;
		view: LensView;
		/** Set only while the focused method is pinned rather than hovered. */
		pinnedNodeId: string | null;
		/** The binding list panel — the canvas only hosts its toggle. */
		tableOpen: boolean;
		onToggleTable: () => void;
		onToggle: () => void;
		onHoverNode: (nodeId: string | null) => void;
		onToggleFocus: (nodeId: string) => void;
		onClearFocus: () => void;
		actions: LensActions;
	};
	restoredViewport?: Viewport;
	viewportRestoreVersion?: number;
	centerStartVersion?: number;
	onInit?: (instance: ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel>) => void;
}>;
