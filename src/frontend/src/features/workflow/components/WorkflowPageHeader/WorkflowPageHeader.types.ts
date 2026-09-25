import type { ComponentProps } from 'react';
import type { WorkflowHeader } from '../WorkflowHeader/WorkflowHeader';

export type WorkflowPageHeaderProps = {
	header: Omit<ComponentProps<typeof WorkflowHeader>, 'schedulesSlot'>;
	connectionId?: string;
	schedulesOpen: boolean;
	onToggleSchedules: () => void;
};
