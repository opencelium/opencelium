import type { ComponentProps } from 'react';
import type { WorkflowSidebar } from '../WorkflowSidebar/WorkflowSidebar';
import type { WorkflowSchedulesPanel } from '../schedules/WorkflowSchedulesPanel/WorkflowSchedulesPanel';
import type { HistoryPanel } from '../header/HistoryPanel/HistoryPanel';
import type { ChangeHistoryPanel } from '../header/ChangeHistoryPanel/ChangeHistoryPanel';
import type { NodeContextMenu } from '../NodeContextMenu/NodeContextMenu';

export type WorkflowPanelsProps = {
	sidebar: ComponentProps<typeof WorkflowSidebar>;
	schedules: ComponentProps<typeof WorkflowSchedulesPanel>;
	history: ComponentProps<typeof HistoryPanel>;
	changeHistory: ComponentProps<typeof ChangeHistoryPanel>;
	contextMenu: ComponentProps<typeof NodeContextMenu>;
};
