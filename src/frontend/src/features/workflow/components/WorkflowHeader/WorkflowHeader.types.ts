import type { ReactNode } from 'react';
import type { WorkflowHeaderMenuItem } from '../../types/workflow.types';

export type WorkflowHeaderProps = {
	initialName?: string;
	initialDescription?: string;
	onOpenHistory: () => void;
	onSave: (values: { title: string; description: string; comment: string }) => void | Promise<void>;
	/** Asked on an explicit Save before the comment dialog opens; `false` cancels the save. */
	confirmBeforeSave?: () => Promise<boolean>;
	onChange?: (values: { title: string; description: string }) => void;
	onMenuItemSelect?: (item: WorkflowHeaderMenuItem) => void;
	menuLoadingItemId?: string | null;
	validateTitle?: (title: string) => Promise<string | null>;
	saveDisabled?: boolean;
	readOnly?: boolean;
	/** True while a test run is active. On top of `readOnly` (which callers set
	 * alongside it), disables the menu entries that would replace or mutate the
	 * workflow mid-run (load template, version history, assign category). */
	testRunLocked?: boolean;
	loading?: boolean;
	schedulesSlot?: ReactNode;
	/** Rendered just before Save, at every width — what it flags is what Save is about to refuse. */
	problemsSlot?: ReactNode;
	/** Set only for a saved workflow, like `schedulesSlot`; the `…` menu's Schedules entry calls it on narrow screens. */
	onToggleSchedules?: () => void;
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
