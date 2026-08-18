import type { InvokerOperation } from '@entities/invoker/model/types';
import type {
	WorkflowAction,
	WorkflowCreateKind,
	WorkflowNodeModel,
	WorkflowTriggerConnectionRef,
} from '../../types/workflow.types';

export type WorkflowSidebarProps = {
	action: WorkflowAction | null;
	selectedNode: WorkflowNodeModel | null;
	connectionId?: string;
	onClose: () => void;
	onSelect: (
		kind: WorkflowCreateKind,
		methodName?: string,
		connector?: { connectorId: number; title: string; icon?: string | null },
		methodOperation?: InvokerOperation,
		triggerConnection?: WorkflowTriggerConnectionRef,
	) => void;
	onStartJoint?: (sourceNodeId: string) => void;
};
