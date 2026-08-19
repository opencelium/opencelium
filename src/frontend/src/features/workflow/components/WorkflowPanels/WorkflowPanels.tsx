import { WorkflowSidebar } from '../WorkflowSidebar/WorkflowSidebar';
import { WorkflowSchedulesPanel } from '../schedules/WorkflowSchedulesPanel/WorkflowSchedulesPanel';
import { HistoryPanel } from '../header/HistoryPanel/HistoryPanel';
import { NodeContextMenu } from '../NodeContextMenu/NodeContextMenu';
import type { WorkflowPanelsProps } from './WorkflowPanels.types';

export const WorkflowPanels = ({ sidebar, schedules, history,
	contextMenu }: WorkflowPanelsProps) => <>
	<WorkflowSidebar {...sidebar} />
	<WorkflowSchedulesPanel {...schedules} />
	<HistoryPanel {...history} />
	<NodeContextMenu {...contextMenu} />
</>;
