import type { WorkflowContextMenu, WorkflowNodeModel } from '../../types/workflow.types';

export type NodeContextMenuProps = {
	menu: WorkflowContextMenu | null;
	node: WorkflowNodeModel | null;
	onClose: () => void;
	onChangeLabel: (nodeId: string, label: string) => void;
	onOpenRequestEditor: (nodeId: string, mode: 'url' | 'body' | 'header') => void;
	onOpenConditionEditor: (nodeId: string) => void;
	onShowResponse: (nodeId: string) => void;
	onOpenAggregatorEditor: (nodeId: string) => void;
};
