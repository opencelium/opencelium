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
	/** Whether this workflow has been saved at least once (has a persisted connectionId).
	 * "Download as Template" hits a backend endpoint keyed by connectionId, so it's
	 * disabled until that's true. */
	hasSavedConnection?: boolean;
};

export type EditField = 'name' | 'description' | null;

export type WorkflowHeaderStateProps = Pick<
	WorkflowHeaderProps,
	'initialName' | 'initialDescription' | 'onChange' | 'validateTitle'
> & {
	onNameCommitted?: (title: string, description: string) => void | Promise<void>;
	onDescriptionCommitted?: (title: string, description: string) => void | Promise<void>;
};
