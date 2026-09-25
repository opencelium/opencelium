import type { WorkflowHeaderMenuItem } from '../../../types/workflow.types';

export type HeaderMenuProps = {
	open: boolean;
	items: WorkflowHeaderMenuItem[];
	onClose: () => void;
	onSelect?: (item: WorkflowHeaderMenuItem) => void;
	loadingItemId?: string | null;
};
