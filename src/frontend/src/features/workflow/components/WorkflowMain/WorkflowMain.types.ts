import type { ComponentProps } from 'react';
import type { WorkflowCanvas } from '../WorkflowCanvas/WorkflowCanvas';
import type { WorkflowRunAssistProps } from '../WorkflowLogs/WorkflowLogs.types';

export type WorkflowMainProps = {
	loading: boolean;
	canvas: Omit<ComponentProps<typeof WorkflowCanvas>, 'children'>;
	runAssist: Omit<WorkflowRunAssistProps, 'nodes' | 'edges'>;
};
