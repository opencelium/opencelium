import type { WorkflowTemplate } from '../../../types/workflowTemplate.types';

export type LoadConnectionTemplateDialogProps = {
	open: boolean;
	templates: WorkflowTemplate[];
	selectedId?: string;
	loading: boolean;
	uploading: boolean;
	applying: boolean;
	onSelect: (id: string) => void;
	onUpload: () => void;
	onClose: () => void;
	onLoad: () => void;
};
