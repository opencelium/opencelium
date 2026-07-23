import type { ReactNode } from 'react';
import type { WorkflowHeaderMenuItem } from '../../types/workflow.types';

export type WorkflowHeaderProps = {
	initialName?: string;
	initialDescription?: string;
	onOpenHistory: () => void;
	onSave: (values: { title: string; description: string; comment: string }) => void | Promise<void>;
	onChange?: (values: { title: string; description: string }) => void;
	onMenuItemSelect?: (item: WorkflowHeaderMenuItem) => void;
	menuLoadingItemId?: string | null;
	validateTitle?: (title: string) => Promise<string | null>;
	saveDisabled?: boolean;
	readOnly?: boolean;
	loading?: boolean;
	schedulesSlot?: ReactNode;
};

export type EditField = 'name' | 'description' | null;
