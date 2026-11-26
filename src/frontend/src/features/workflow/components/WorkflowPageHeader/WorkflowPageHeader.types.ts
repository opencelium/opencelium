import type { ComponentProps } from 'react';
import type { RunPolicyNotice } from '../run-policy/useWorkflowRunPolicyNotice';
import type { WorkflowHeader } from '../WorkflowHeader/WorkflowHeader';

export type WorkflowPageHeaderProps = {
	header: Omit<ComponentProps<typeof WorkflowHeader>, 'schedulesSlot' | 'onToggleSchedules'>;
	connectionId?: string;
	schedulesOpen: boolean;
	onToggleSchedules: () => void;
	runPolicy?: RunPolicyNotice | null;
};
