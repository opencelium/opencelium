import { useState } from 'react';
import { useWorkflowValidation } from './useWorkflowValidation';
import { useSaveWorkflow } from './useSaveWorkflow';
import { useAssignWorkflowCategory } from './useAssignWorkflowCategory';
import { useWorkflowTemplates } from './useWorkflowTemplates';
import { useWorkflowHistoryActions } from './useWorkflowHistoryActions';
import { useWorkflowCanvasActions } from './useWorkflowCanvasActions';
import { useWorkflowHeaderActions } from './useWorkflowHeaderActions';
import { useBuildTestPayload } from './useBuildTestPayload';
import { useDeleteSelectedNode } from './useDeleteSelectedNode';
import type { useWorkflowPageState } from './useWorkflowPageState';

type Params = {
	connectionId?: string;
	readOnly: boolean;
	page: ReturnType<typeof useWorkflowPageState>;
};

export const useWorkflowActions = ({ connectionId, readOnly, page }: Params) => {
	const { connection, workflow, connectors, invokers, view, changes } = page;
	const { headerState, fieldBindings, categoryId } = connection;
	const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
	const [schedulesOpen, setSchedulesOpen] = useState(false);
	const validation = useWorkflowValidation({ persistedTitle: connection.persistedTitle,
		nodes: view.hydratedNodes, edges: workflow.edges,
		setNodeError: workflow.onSetNodeError });
	const saveWorkflow = useSaveWorkflow({ connectionId: view.activeConnectionId,
		categoryId, nodes: view.hydratedNodes, edges: workflow.edges, fieldBindings,
		getViewport: workflow.getViewport, clearNodeErrors: workflow.onClearNodeErrors,
		resolveError: validation.resolveAndHighlightError,
		setFieldBindings: connection.setFieldBindings,
		setHeaderState: connection.setHeaderState,
		setPersistedTitle: connection.setPersistedTitle,
		setCategoryId: connection.setCategoryId,
		setBaselineSnapshot: changes.setBaselineSnapshot,
		setChangeSource: changes.setChangeSource,
		setHistoryPreviewSnapshot: changes.setHistoryPreviewSnapshot,
		setHistoryVersions: connection.setHistoryVersions,
		setSelectedHistoryVersionId: connection.setSelectedHistoryVersionId,
		setCreatedConnectionId: connection.setCreatedConnectionId,
	});
	const category = useAssignWorkflowCategory({ title: headerState.title,
		description: headerState.description, saveWorkflow });
	const templates = useWorkflowTemplates({ connectionId: view.activeConnectionId,
		headerState, setHeaderState: connection.setHeaderState, nodes: view.hydratedNodes,
		edges: workflow.edges, fieldBindings,
		setFieldBindings: connection.setFieldBindings, connectors,
		getViewport: workflow.getViewport, setWorkflowGraph: workflow.setWorkflowGraph });
	const history = useWorkflowHistoryActions({ connectionId: view.activeConnectionId,
		baselineSnapshot: changes.baselineSnapshot, connectors, invokers,
		setHistoryVersions: connection.setHistoryVersions,
		setSelectedId: connection.setSelectedHistoryVersionId,
		setHeaderState: connection.setHeaderState,
		setFieldBindings: connection.setFieldBindings,
		setHistoryPreviewSnapshot: changes.setHistoryPreviewSnapshot,
		setChangeSource: changes.setChangeSource,
		applyGraph: (state) => workflow.setWorkflowGraph(
			state.nodes, state.edges, state.viewport, { centerStart: true }),
		closeEditors: () => {
			workflow.setSidebarAction(null);
			workflow.setContextMenu(null);
			workflow.setMethodEditor(null);
			workflow.setConditionEditor(null);
		},
	});
	const canvas = useWorkflowCanvasActions({ setSidebarAction: workflow.setSidebarAction,
		setContextMenu: workflow.setContextMenu, setHistoryOpen: workflow.setHistoryOpen,
		setMethodEditor: workflow.setMethodEditor,
		setConditionEditor: workflow.setConditionEditor });
	const header = useWorkflowHeaderActions({
		openAssignCategory: () => category.setOpen(true),
		downloadTemplate: templates.downloadConnectionTemplate,
		openSaveTemplate: templates.openSaveTemplateDialog,
		openLoadTemplate: templates.openLoadTemplateDialog,
		openShortcuts: () => setIsShortcutsOpen(true),
		openHistory: () => workflow.setHistoryOpen(true),
		closeSchedules: () => setSchedulesOpen(false),
		closeCanvasPanels: canvas.closeCanvasPanels,
		refreshHistory: history.refreshVersions,
	});
	const buildTestPayload = useBuildTestPayload({ connectionId,
		title: headerState.title, description: headerState.description,
		nodes: view.hydratedNodes, edges: workflow.edges, fieldBindings,
		getViewport: workflow.getViewport, clearNodeErrors: workflow.onClearNodeErrors });

	useDeleteSelectedNode({ readOnly, nodes: workflow.nodes,
		onDeleteNode: workflow.onDeleteNode,
		disabled: !!(workflow.methodEditor || workflow.conditionEditor ||
			workflow.aggregatorEditor || workflow.historyOpen || templates.templateDialogOpen ||
			templates.loadTemplateDialogOpen || templates.connectorMappingDialogOpen ||
			isShortcutsOpen),
	});

	return { validation, saveWorkflow, category, templates, history, canvas, header,
		buildTestPayload, isShortcutsOpen, setIsShortcutsOpen,
		schedulesOpen, setSchedulesOpen };
};
