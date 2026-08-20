import type { PropsWithChildren, ReactNode } from 'react';
import type { WorkflowAction, WorkflowNodeData } from '../../types/workflow.types';

export type NodeShellAddConfig = {
	action: WorkflowAction;
	showAlways?: boolean;
	lineVisible?: boolean;
};

export type NodeShellProps = PropsWithChildren<{
	id: string;
	data: WorkflowNodeData;
	selected?: boolean;
	topLabel?: string;
	bottomLabel?: string;
	bottomExtra?: ReactNode;
	rightAdd?: NodeShellAddConfig;
	bottomAdd?: NodeShellAddConfig;
}>;
