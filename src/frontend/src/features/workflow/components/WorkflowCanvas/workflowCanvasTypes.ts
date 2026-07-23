import { memo } from 'react';
import { WorkflowEdge } from '../../edges/WorkflowEdge/WorkflowEdge';
import { ConnectorMethodNode } from '../../nodes/ConnectorMethodNode/ConnectorMethodNode';
import { IfOperatorNode } from '../../nodes/IfOperatorNode/IfOperatorNode';
import { LoopOperatorNode } from '../../nodes/LoopOperatorNode/LoopOperatorNode';
import { StartNode } from '../../nodes/StartNode/StartNode';
import { SystemMethodNode } from '../../nodes/SystemMethodNode/SystemMethodNode';
import { TriggerConnectionNode } from '../../nodes/TriggerConnectionNode/TriggerConnectionNode';

export const workflowNodeTypes = {
	start: memo(StartNode),
	connector: memo(ConnectorMethodNode),
	system: memo(SystemMethodNode),
	'trigger-connection': memo(TriggerConnectionNode),
	if: memo(IfOperatorNode),
	loop: memo(LoopOperatorNode),
};

export const workflowEdgeTypes = {
	'workflow-edge': memo(WorkflowEdge),
};
