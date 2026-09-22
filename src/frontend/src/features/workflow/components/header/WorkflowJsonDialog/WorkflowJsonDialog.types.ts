import type { WorkflowJsonPayload } from './workflowJson.schema';

export type WorkflowJsonDialogProps = {
	open: boolean;
	readOnly: boolean;
	value: Record<string, unknown>;
	onClose: () => void;
	onApply: (value: WorkflowJsonPayload) => void;
};
