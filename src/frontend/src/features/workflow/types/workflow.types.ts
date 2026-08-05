import type { Edge, Node } from '@xyflow/react';
import type { WorkflowMethodConfig } from './request-config.types';
import type { ConditionConfig } from '../components/condition-builder/conditionBuilder.types';
import type { InvokerOperation } from '@entities/invoker/model/types';
import type { ConnectorHealthStatus } from '@entities/connector/model/types';

export type WorkflowNodeType = 'start' | 'connector' | 'system' | 'trigger-connection' | 'if' | 'loop';

// What a LOOP node shows while running, set by WorkflowCanvas. 'count' updates
// live ("i = 3"); 'fast' is a static fallback ("i = …") for loops whose first
// iteration took under a second — a live count for those would just flicker
// unreadably. Nothing is shown at all before iteration 2 begins: there's no
// speed measurement yet, and no useful number to show either (see
// getTestRunScope/reduceLiveGraphStatus).
export type WorkflowLoopIterationDisplay =
	| { kind: 'count'; iterator: string; count: number }
	| { kind: 'fast'; iterator: string };

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
		status?: ConnectorHealthStatus;
		lastTestError?: string | null;
		lastCheckedAt?: number | null;
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
	/** Set by the command-palette `workflow search <term>` fuzzy search — a
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
	/** Set by WorkflowCanvas from the live test-run status — this exact
	 * method/operator is currently executing (PENDING right now). */
	testRunActive?: boolean;
	/** Set by WorkflowCanvas — this node lies inside the (taken) body of a
	 * currently-running LOOP/IF, marking the scope's extent. Never set together
	 * with `testRunActive` for the same node. */
	testRunInScope?: boolean;
	/** Set by WorkflowCanvas for a LOOP node currently executing (from
	 * iteration 2 onward) — see WorkflowLoopIterationDisplay. */
	testRunIteration?: WorkflowLoopIterationDisplay;
	/** Set by WorkflowCanvas — this node is where a test-run error actually
	 * happened. Renders the same red-ring styling as `hasError`, but is a
	 * distinct flag: `hasError` is a config-validation concern, this is a live
	 * execution outcome, and clearing one must not clear the other. Persists
	 * after the run ends, until the next run starts. */
	testRunFailed?: boolean;
	testRunFailedMessage?: string;
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
	/** Set by WorkflowCanvas from the live test-run status — this edge feeds a
	 * method/operator that is currently executing. Distinct from `highlighted`
	 * (hover/path-selection) so both states render independently. */
	testRunActive?: boolean;
	/** Set by WorkflowCanvas — this edge lies inside the (taken) body of a
	 * currently-running LOOP/IF, marking the scope's extent. Never set together
	 * with `testRunActive` for the same edge. */
	testRunInScope?: boolean;
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
