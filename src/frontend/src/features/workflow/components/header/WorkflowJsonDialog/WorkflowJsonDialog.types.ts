import type { WorkflowJsonPayload } from './workflowJson.schema';

export type WorkflowJsonDialogProps = {
	open: boolean;
	readOnly: boolean;
	value: Record<string, unknown>;
	connectors: Array<{ connectorId: number; invoker: { name: string } }>;
	onClose: () => void;
	onApply: (value: WorkflowJsonPayload) => void;
};
