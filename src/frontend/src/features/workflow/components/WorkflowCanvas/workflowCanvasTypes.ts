import { WorkflowEdge } from '../../edges/WorkflowEdge';
import { ConnectorMethodNode } from '../../nodes/ConnectorMethodNode/ConnectorMethodNode';
import { IfOperatorNode } from '../../nodes/IfOperatorNode/IfOperatorNode';
import { LoopOperatorNode } from '../../nodes/LoopOperatorNode/LoopOperatorNode';
import { StartNode } from '../../nodes/StartNode/StartNode';
import { SystemMethodNode } from '../../nodes/SystemMethodNode/SystemMethodNode';
import { TriggerConnectionNode } from '../../nodes/TriggerConnectionNode/TriggerConnectionNode';

export const workflowNodeTypes = {
	start: StartNode,
	connector: ConnectorMethodNode,
	system: SystemMethodNode,
	'trigger-connection': TriggerConnectionNode,
	if: IfOperatorNode,
	loop: LoopOperatorNode,
};

export const workflowEdgeTypes = {
	'workflow-edge': WorkflowEdge,
};
