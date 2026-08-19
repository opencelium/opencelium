import type { Edge, Node } from '@xyflow/react';
import type { WorkflowMethodConfig } from './request-config.types';
import type { ConditionConfig } from '../components/condition-builder/conditionBuilder.types';
import type { InvokerOperation } from '@entities/invoker/model/types';
import type { ConnectorHealthStatus } from '@entities/connector/model/types';
import type { JointRejectionReason } from '../utils/jumpValidator';

export type WorkflowNodeType = 'start' | 'connector' | 'system' | 'trigger-connection' | 'if' | 'loop' | 'comment';

// What a LOOP node shows while running, set by WorkflowCanvas — a live count
// ("i = 3"), refreshed on every iteration. Nothing is shown at all before
// iteration 2 begins (no speed measurement yet), or once the loop is
// classified as fast (its first iteration took under a second) — a live
// count for those would just flicker unreadably (see
// getTestRunScope/reduceLiveGraphStatus).
export type WorkflowLoopIterationDisplay = { iterator: string; count: number; indexPath: string };

export type WorkflowAddDirection = 'right' | 'bottom';
export type WorkflowCreateKind = 'connector' | 'system' | 'trigger-connection' | 'if' | 'loop' | 'comment';
export type WorkflowOperatorKind = 'if' | 'loop';

/** A free-text annotation belonging to one node. Carried in the connection's
 * schema-less `ui.workflowNodes` blob only — a comment is never a method or an
 * operator, so it never reaches `fromConnector` and never executes. */
export type WorkflowCommentData = {
	text: string;
	/** The node this note belongs to. It is toggled from that node's badge and
	 * deleted together with it, so a comment without a live anchor cannot exist. */
	anchorNodeId: string;
	/** Where the note sits relative to its anchor's position. The note's own
	 * `position` is *derived* from this on every render (prepareWorkflowElements),
	 * which is what makes it follow the anchor through drags, insertions and
	 * auto-layout without any of that code having to know comments exist. */
	offset: { x: number; y: number };
	/** Minimized into the anchor node's comment badge — the note is not rendered
	 * at all, but its text/size/offset are kept and saved. */
	collapsed?: boolean;
};

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
	/** Only on a 'comment' node — the note itself. */
	comment?: WorkflowCommentData;
	/** Set by prepareWorkflowElements on a node that *has* a note, so NodeShell
	 * can render its show/hide badge. The note itself lives on the comment node. */
	anchoredComment?: { nodeId: string; collapsed: boolean };
	dataAggregator?: number | null;
	labelEdited?: boolean;
	isLeaf?: boolean;
	rightLeaf?: boolean;
	bottomLeaf?: boolean;
	duplicateMethodIndex?: number;
	duplicateMethodColor?: string;
	alwaysShowRightAdd?: boolean;
	highlighted?: boolean;
	/** Target node id of this node's joint — the method execution jumps to after
	 * this one. Serialized as a workflow index (see connectionPayload.methods). */
	jump?: string;
	/** Joint picking state, set by prepareWorkflowElements while a joint is being
	 * drawn: this node is a legal target / is the node the joint starts from /
	 * cannot be the target and why (rendered as a hover-only error ring plus a
	 * tooltip naming the reason). */
	jointCandidate?: boolean;
	jointSource?: boolean;
	jointInvalidReason?: JointRejectionReason;
	/** Method whose response the target consumes and the joint would skip over —
	 * fills the `skips-referenced-method` tooltip. */
	jointBlockingLabel?: string;
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
	/** Set by WorkflowCanvas from the paced test-run playback — this exact
	 * method/operator is the step the playback is showing as executing right
	 * now. Execution is consecutive, so at most one node carries this flag. */
	testRunActive?: boolean;
	/** Set by WorkflowCanvas for a LOOP node currently executing (from
	 * iteration 2 onward) — see WorkflowLoopIterationDisplay. */
	testRunIteration?: WorkflowLoopIterationDisplay;
	/** Set by WorkflowCanvas for an IF node the current step relates to —
	 * 'true' while on the IF itself (true result) or inside its true branch,
	 * 'continue' once the false/continue edge has been taken (false result,
	 * or the true branch finished and the flow moved on) — highlights the
	 * corresponding label. */
	testRunActiveBranch?: 'true' | 'continue';
	/** Set by WorkflowCanvas — this node is where a test-run error actually
	 * happened. Renders the same red-ring styling as `hasError`, but is a
	 * distinct flag: `hasError` is a config-validation concern, this is a live
	 * execution outcome, and clearing one must not clear the other. Persists
	 * after the run ends, until the next run starts. */
	testRunFailed?: boolean;
	testRunFailedMessage?: string;
	/** True while the failure should still render (red ring + pulse +
	 * tooltip). `testRunFailed` itself stays true until the next run starts —
	 * this is the one Escape clears early (WorkflowCanvas), dismissing the
	 * whole highlight without forgetting that this run did fail here. */
	testRunFailedVisible?: boolean;
	onAddStep?: (action: WorkflowAction) => void;
	onOpenContextMenu?: (menu: WorkflowContextMenu | null) => void;
	onDeleteNode?: (nodeId: string) => void;
	onRemoveJoint?: (nodeId: string) => void;
	onOpenAggregatorEditor?: (nodeId: string) => void;
	/** Absent while the graph is not editable (test run in progress, read-only
	 * page) — CommentNode renders its text as read-only then. */
	onChangeCommentText?: (nodeId: string, text: string) => void;
	/** Minimize/restore the note. Called with the *comment* node's id, from both
	 * the anchor node's badge and the note's own minimize button. */
	onToggleComment?: (commentNodeId: string) => void;
};

export type WorkflowEdgeData = {
	branch?: 'true' | 'false';
	highlighted?: boolean;
	dropTarget?: boolean;
	dropInvalid?: boolean;
	dragGhost?: boolean;
	dropPlaceholder?: boolean;
	/** Set by WorkflowCanvas from the paced test-run playback — this edge feeds
	 * the step currently shown as executing (at most one edge at a time).
	 * Distinct from `highlighted` (hover/path-selection) so both states render
	 * independently. */
	testRunActive?: boolean;
	/** Per-transition nonce for the active edge (0 otherwise) — keys the
	 * travelling-dot animation so it restarts once per playback step, including
	 * re-entries of the same edge on the next loop iteration. */
	testRunNonce?: number;
	/** A joint (see WorkflowNodeData.jump) rather than a real graph edge: same
	 * path geometry as every other edge, drawn in the joint color, and carrying
	 * its own hover-revealed delete control. */
	joint?: boolean;
	jointSourceNodeId?: string;
	onRemoveJoint?: (nodeId: string) => void;
};

export type StartWorkflowNode = Node<WorkflowNodeData, 'start'>;
export type ConnectorWorkflowNode = Node<WorkflowNodeData, 'connector'>;
export type SystemWorkflowNode = Node<WorkflowNodeData, 'system'>;
export type TriggerConnectionWorkflowNode = Node<WorkflowNodeData, 'trigger-connection'>;
export type IfWorkflowNode = Node<WorkflowNodeData, 'if'>;
export type LoopWorkflowNode = Node<WorkflowNodeData, 'loop'>;
export type CommentWorkflowNode = Node<WorkflowNodeData, 'comment'>;

export type WorkflowNodeModel =
	| StartWorkflowNode
	| ConnectorWorkflowNode
	| SystemWorkflowNode
	| TriggerConnectionWorkflowNode
	| IfWorkflowNode
	| LoopWorkflowNode
	| CommentWorkflowNode;

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
