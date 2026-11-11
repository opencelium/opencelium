import type { WorkflowMethodConfig } from '../../../types/request-config.types';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../../../types/workflow.types';
import type { AiDialogStep } from '../../../utils/aiDialogSteps';

/** What a method dialog would save right now. */
export type MethodDraft = { config: WorkflowMethodConfig | null; fieldBindings: unknown[] | undefined };

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
	/** AI applies made inside the dialog, handed over right before its save so each gets its own history entry. */
	onRecordAiSteps?: (nodeId: string, steps: AiDialogStep<MethodDraft>[]) => void;
};
