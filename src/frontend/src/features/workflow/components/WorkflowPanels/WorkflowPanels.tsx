import { WorkflowSidebar } from '../WorkflowSidebar/WorkflowSidebar';
import { WorkflowSchedulesPanel } from '../schedules/WorkflowSchedulesPanel/WorkflowSchedulesPanel';
import { HistoryPanel } from '../header/HistoryPanel/HistoryPanel';
import { ChangeHistoryPanel } from '../header/ChangeHistoryPanel/ChangeHistoryPanel';
import { NodeContextMenu } from '../NodeContextMenu/NodeContextMenu';
import type { WorkflowPanelsProps } from './WorkflowPanels.types';

export const WorkflowPanels = ({ sidebar, schedules, history, changeHistory,
	contextMenu }: WorkflowPanelsProps) => <>
	<WorkflowSidebar {...sidebar} />
	<WorkflowSchedulesPanel {...schedules} />
	<HistoryPanel {...history} />
	<ChangeHistoryPanel {...changeHistory} />
	<NodeContextMenu {...contextMenu} />
</>;
