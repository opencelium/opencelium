import type { WorkflowMethodConfig } from '../../../types/request-config.types';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../../types/workflow.types';

export type MethodConfigMode = 'url' | 'body' | 'header' | null;

export type MethodConfigDialogProps = {
	open: boolean;
	node: WorkflowNodeModel | null;
	mode: MethodConfigMode;
	nodes: WorkflowNodeModel[];
	edges?: WorkflowEdgeModel[];
	fieldBindings?: any[];
	onFieldBindingsChange?: (fieldBindings: any[]) => void;
	onClose: () => void;
	onSave: (nodeId: string, config: WorkflowMethodConfig, fieldBindings?: any[]) => void;
};
