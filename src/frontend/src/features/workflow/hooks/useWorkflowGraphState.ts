import { useRef, useState } from 'react';
import { useEdgesState, useNodesState } from '@xyflow/react';
import type { ReactFlowInstance, Viewport } from '@xyflow/react';
import { initialEdges, initialNodes } from '../data/initialGraph';
import type {
	WorkflowAction,
	WorkflowContextMenu,
	WorkflowEdgeModel,
	WorkflowNodeModel,
} from '../types/workflow.types';
import type {
	WorkflowAggregatorEditorState,
	WorkflowConditionEditorState,
	WorkflowMethodEditorState,
} from '../types/request-config.types';
import type { WorkflowDragSnapshot } from '../drag-drop/workflowPage.types';

export const useWorkflowGraphState = () => {
	const reactFlowInstance = useRef<ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel> | null>(null);
	const dragSnapshot = useRef<WorkflowDragSnapshot | null>(null);
	const draggedPositionLockRef = useRef<Set<string> | null>(null);
	const multiDragRef = useRef(false);
	const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNodeModel>(initialNodes);
	const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdgeModel>(initialEdges);
	const [isAnyNodeDragging, setIsAnyNodeDragging] = useState(false);
	const [sidebarAction, setSidebarAction] = useState<WorkflowAction | null>(null);
	const [contextMenu, setContextMenu] = useState<WorkflowContextMenu | null>(null);
	const [historyOpen, setHistoryOpen] = useState(false);
	const [methodEditor, setMethodEditor] = useState<WorkflowMethodEditorState | null>(null);
	const [responseNodeId, setResponseNodeId] = useState<string | null>(null);
	const [conditionEditor, setConditionEditor] = useState<WorkflowConditionEditorState | null>(null);
	const [aggregatorEditor, setAggregatorEditor] = useState<WorkflowAggregatorEditorState | null>(null);
	const [restoredViewport, setRestoredViewport] = useState<Viewport | undefined>();
	const [viewportRestoreVersion, setViewportRestoreVersion] = useState(0);
	const [centerStartVersion, setCenterStartVersion] = useState(1);
	const [bindingLensOpen, setBindingLensOpen] = useState(false);
	const [bindingLensExpanded, setBindingLensExpanded] = useState<string[]>([]);
	const [bindingLensSelectedKey, setBindingLensSelectedKey] = useState<string | null>(null);
	const handleNodesChange: typeof onNodesChange = (changes) => {
		const locked = draggedPositionLockRef.current;
		onNodesChange(!locked?.size ? changes : changes.filter((change) =>
			!(change.type === 'position' && locked.has(change.id))));
	};

	return {
		reactFlowInstance, dragSnapshot, draggedPositionLockRef, multiDragRef,
		nodes, setNodes, handleNodesChange, edges, setEdges, onEdgesChange,
		isAnyNodeDragging, setIsAnyNodeDragging,
		sidebarAction, setSidebarAction, contextMenu, setContextMenu,
		historyOpen, setHistoryOpen, methodEditor, setMethodEditor,
		responseNodeId, setResponseNodeId, conditionEditor, setConditionEditor,
		aggregatorEditor, setAggregatorEditor, restoredViewport, setRestoredViewport,
		viewportRestoreVersion, setViewportRestoreVersion,
		bindingLensOpen, setBindingLensOpen, bindingLensExpanded, setBindingLensExpanded,
		bindingLensSelectedKey, setBindingLensSelectedKey,
		centerStartVersion, setCenterStartVersion,
	};
};
