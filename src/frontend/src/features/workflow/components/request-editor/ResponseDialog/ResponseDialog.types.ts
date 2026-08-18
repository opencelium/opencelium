import type { WorkflowNodeModel } from '../../../types/workflow.types';

export type ResponseDialogProps = {
	open: boolean;
	node: WorkflowNodeModel | null;
	onClose: () => void;
};
