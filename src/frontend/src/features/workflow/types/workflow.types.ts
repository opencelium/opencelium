import type { Edge, Node } from '@xyflow/react';
import type { WorkflowMethodConfig } from './request-config.types';
import type { ConditionConfig } from '../components/condition-builder/conditionBuilder.types';
import type { InvokerOperation } from '@entities/invoker/model/types';

export type WorkflowNodeType = 'start' | 'connector' | 'system' | 'trigger-connection' | 'if' | 'loop';

export type WorkflowAddDirection = 'right' | 'bottom';
export type WorkflowCreateKind = 'connector' | 'system' | 'trigger-connection' | 'if' | 'loop';
export type WorkflowOperatorKind = 'if' | 'loop';

export type WorkflowTriggerConnectionRef = {
	connectionId: number;
	connectionTitle: string;
	schedulerId: number;
	scheduleTitle: string;
	webhookUrl: string;
};

export type WorkflowAction = {
	sourceNodeId: string;
	sourceHandle?: string | null;
	direction: WorkflowAddDirection;
	kind?: WorkflowCreateKind;
	methodName?: string;
	methodOperation?: InvokerOperation;
	connector?: {
		connectorId: number;
		title: string;
		icon?: string | null;
	};
	triggerConnection?: WorkflowTriggerConnectionRef;
};

export type WorkflowContextMenu = {
	nodeId: string;
	x: number;
	y: number;
	kind: WorkflowNodeType;
};

export type WorkflowNodeData = {
	title: string;
	subtitle?: string;
	kind: WorkflowNodeType;
	color?: string;
	connector?: {
		connectorId: number;
		title: string;
		icon?: string | null;
		invokerName?: string | null;
		lastTestPassed?: boolean | null;
		lastTestError?: string | null;
	};
	methodConfig?: WorkflowMethodConfig;
	conditionConfig?: ConditionConfig;
	triggerConnection?: WorkflowTriggerConnectionRef;
	dataAggregator?: number | null;
	labelEdited?: boolean;
	isLeaf?: boolean;
	rightLeaf?: boolean;
	bottomLeaf?: boolean;
	duplicateMethodIndex?: number;
	duplicateMethodColor?: string;
	alwaysShowRightAdd?: boolean;
	highlighted?: boolean;
	/** Set by the command-palette `workflow find method/property` search — a
	 * live match ring distinct from the drag-preview `highlighted` state and
	 * the `hasError` state, so all three can coexist without visual collision. */
	searchHighlighted?: boolean;
	hasError?: boolean;
	errorMessage?: string;
	dropTarget?: boolean;
	dropInvalid?: boolean;
	dragGhost?: boolean;
	dropPlaceholder?: boolean;
	dragSourceMoving?: boolean;
	dragSourceFaint?: boolean;
	hideAddControls?: boolean;
	suppressHoverAddControls?: boolean;
	lockVisibleAddControls?: boolean;
	isAnyNodeDragging?: boolean;
	onAddStep?: (action: WorkflowAction) => void;
	onOpenContextMenu?: (menu: WorkflowContextMenu | null) => void;
	onDeleteNode?: (nodeId: string) => void;
	onOpenAggregatorEditor?: (nodeId: string) => void;
};

export type WorkflowEdgeData = {
	branch?: 'true' | 'false';
	highlighted?: boolean;
	dropTarget?: boolean;
	dropInvalid?: boolean;
	dragGhost?: boolean;
	dropPlaceholder?: boolean;
};

export type StartWorkflowNode = Node<WorkflowNodeData, 'start'>;
export type ConnectorWorkflowNode = Node<WorkflowNodeData, 'connector'>;
export type SystemWorkflowNode = Node<WorkflowNodeData, 'system'>;
export type TriggerConnectionWorkflowNode = Node<WorkflowNodeData, 'trigger-connection'>;
export type IfWorkflowNode = Node<WorkflowNodeData, 'if'>;
export type LoopWorkflowNode = Node<WorkflowNodeData, 'loop'>;

export type WorkflowNodeModel =
	| StartWorkflowNode
	| ConnectorWorkflowNode
	| SystemWorkflowNode
	| TriggerConnectionWorkflowNode
	| IfWorkflowNode
	| LoopWorkflowNode;

export type WorkflowEdgeModel = Edge<WorkflowEdgeData, 'workflow-edge'>;

export type CreateNodeFromActionArgs = {
	action: WorkflowAction;
	nodes: WorkflowNodeModel[];
	edges: WorkflowEdgeModel[];
};

export type WorkflowHeaderMenuItem = {
	id: string;
	labelKey: string;
	section?: 'template' | 'history' | 'shortcuts' | 'exit';
	keepOpenOnSelect?: boolean;
	disabled?: boolean;
	/** Tooltip shown while `disabled` explaining why the action is unavailable. */
	disabledTooltipKey?: string;
	badgeKey?: string;
};

export type WorkflowNodeMenuItem = {
	id: string;
	labelKey: string;
};
