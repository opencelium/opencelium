import type { ComponentProps } from 'react';
import type { WorkflowCanvas } from '../WorkflowCanvas/WorkflowCanvas';

export type WorkflowMainProps = {
	loading: boolean;
	canvas: Omit<ComponentProps<typeof WorkflowCanvas>, 'children'>;
};
