import { WorkflowSidebar } from '../WorkflowSidebar/WorkflowSidebar';
import { WorkflowSchedulesPanel } from '../schedules/WorkflowSchedulesPanel/WorkflowSchedulesPanel';
import { HistoryPanel } from '../header/HistoryPanel/HistoryPanel';
import { ChangeHistoryPanel } from '../header/ChangeHistoryPanel/ChangeHistoryPanel';
import { NodeContextMenu } from '../NodeContextMenu/NodeContextMenu';
import { BindingDrawer } from '../../lens/BindingDrawer/BindingDrawer';
import type { WorkflowPanelsProps } from './WorkflowPanels.types';

export const WorkflowPanels = ({ sidebar, schedules, history, changeHistory,
	contextMenu, bindingDrawer }: WorkflowPanelsProps) => <>
	<WorkflowSidebar {...sidebar} />
	<WorkflowSchedulesPanel {...schedules} />
	<HistoryPanel {...history} />
	<ChangeHistoryPanel {...changeHistory} />
	<NodeContextMenu {...contextMenu} />
	<BindingDrawer {...bindingDrawer} />
</>;
