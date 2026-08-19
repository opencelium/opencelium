import type { Dispatch, SetStateAction } from 'react';
import type { NodeMouseHandler } from '@xyflow/react';
import type { WorkflowAction, WorkflowContextMenu,
	WorkflowNodeModel } from '../types/workflow.types';
import type { WorkflowConditionEditorState,
	WorkflowMethodEditorState } from '../types/request-config.types';

type Params = {
	setSidebarAction: Dispatch<SetStateAction<WorkflowAction | null>>;
	setContextMenu: Dispatch<SetStateAction<WorkflowContextMenu | null>>;
	setHistoryOpen: Dispatch<SetStateAction<boolean>>;
	setMethodEditor: Dispatch<SetStateAction<WorkflowMethodEditorState | null>>;
	setConditionEditor: Dispatch<SetStateAction<WorkflowConditionEditorState | null>>;
};

export const useWorkflowCanvasActions = ({ setSidebarAction, setContextMenu,
	setHistoryOpen, setMethodEditor, setConditionEditor }: Params) => {
	const closeCanvasPanels = () => {
		setSidebarAction(null);
		setContextMenu(null);
		setHistoryOpen(false);
		setConditionEditor(null);
	};

	const handleNodeDoubleClick: NodeMouseHandler<WorkflowNodeModel> = (_, node) => {
		setSidebarAction(null);
		setContextMenu(null);
		setHistoryOpen(false);
		if (node.type === 'connector' || node.type === 'system' ||
			node.type === 'trigger-connection') {
			setConditionEditor(null);
			setMethodEditor({ nodeId: node.id, mode: 'body' });
			return;
		}
		if (node.type === 'if' || node.type === 'loop') {
			setMethodEditor(null);
			setConditionEditor({ nodeId: node.id });
		}
	};

	return { closeCanvasPanels, handleNodeDoubleClick };
};
