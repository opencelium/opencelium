import type { WorkflowAction } from '../../types/workflow.types';

export type AddStepTriggerProps = {
	direction: 'right' | 'bottom';
	action: WorkflowAction;
	showAlways?: boolean;
	lineVisible?: boolean;
	locked?: boolean;
	onAdd: (action: WorkflowAction) => void;
};
