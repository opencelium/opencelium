import { WorkflowHeader } from '../WorkflowHeader/WorkflowHeader';
import { WorkflowSchedulesPill } from '../schedules/WorkflowSchedulesPill/WorkflowSchedulesPill';
import type { WorkflowPageHeaderProps } from './WorkflowPageHeader.types';

export const WorkflowPageHeader = ({ header, connectionId, schedulesOpen,
	onToggleSchedules, runPolicy }: WorkflowPageHeaderProps) =>
	<WorkflowHeader {...header} schedulesSlot={connectionId
		? <WorkflowSchedulesPill connectionId={connectionId} open={schedulesOpen}
			onToggle={onToggleSchedules} runPolicy={runPolicy} />
		: null}
		onToggleSchedules={connectionId ? onToggleSchedules : undefined} />;
