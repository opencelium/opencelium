import { useEffect, useState } from 'react';
import { useWorkflowValidation } from './useWorkflowValidation';
import { useSaveWorkflow } from './useSaveWorkflow';
import { useAssignWorkflowCategory } from './useAssignWorkflowCategory';
import { useWorkflowTemplates } from './useWorkflowTemplates';
import { useWorkflowHistoryActions } from './useWorkflowHistoryActions';
import { useWorkflowCanvasActions } from './useWorkflowCanvasActions';
import { useWorkflowHeaderActions } from './useWorkflowHeaderActions';
import { useBuildTestPayload } from './useBuildTestPayload';
import { useDeleteSelectedNode } from './useDeleteSelectedNode';
import { useWorkflowUndoShortcuts } from './useWorkflowUndoShortcuts';
import type { useWorkflowPageState } from './useWorkflowPageState';

type Params = {
	connectionId?: string;
	readOnly: boolean;
	/** True while a test run is executing — synced up from inside TestRunProvider
	 * by TestRunEditLockSync. Locks every edit surface for its duration. */
	isTestRunLocked?: boolean;
	page: ReturnType<typeof useWorkflowPageState>;
};

export const useWorkflowActions = ({ connectionId, readOnly,
	isTestRunLocked = false, page }: Params) => {
	const isEditLocked = readOnly || isTestRunLocked;
	const { connection, workflow, connectors, invokers, view, changes } = page;
	const { headerState, fieldBindings, categoryId } = connection;
	const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
	const [schedulesOpen, setSchedulesOpen] = useState(false);
	const [changeHistoryOpen, setChangeHistoryOpen] = useState(false);
	const validation = useWorkflowValidation({ persistedTitle: connection.persistedTitle,
		nodes: view.hydratedNodes, edges: workflow.edges,
		setNodeError: workflow.onSetNodeError,
		centerOnNode: workflow.centerOnNode });
	const saveWorkflow = useSaveWorkflow({ connectionId: view.activeConnectionId,
		categoryId, nodes: view.hydratedNodes, edges: workflow.edges, fieldBindings,
		getViewport: workflow.getViewport, clearNodeErrors: workflow.onClearNodeErrors,
		resolveError: validation.resolveAndHighlightError,
		validateEnhancementScripts: validation.validateEnhancementScripts,
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
		isTestRunLocked,
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
		setConditionEditor: workflow.setConditionEditor,
		cancelJoint: workflow.onCancelJoint });
	const header = useWorkflowHeaderActions({
		openAssignCategory: () => category.setOpen(true),
		downloadTemplate: templates.downloadConnectionTemplate,
		openSaveTemplate: templates.openSaveTemplateDialog,
		openLoadTemplate: templates.openLoadTemplateDialog,
		openShortcuts: () => setIsShortcutsOpen(true),
		openHistory: () => workflow.setHistoryOpen(true),
		openChangeHistory: () => {
			setSchedulesOpen(false);
			workflow.setHistoryOpen(false);
			canvas.closeCanvasPanels();
			setChangeHistoryOpen(true);
		},
		closeChangeHistory: () => setChangeHistoryOpen(false),
		closeSchedules: () => setSchedulesOpen(false),
		closeCanvasPanels: canvas.closeCanvasPanels,
		refreshHistory: history.refreshVersions,
	});
	const buildTestPayload = useBuildTestPayload({ connectionId,
		title: headerState.title, description: headerState.description,
		nodes: view.hydratedNodes, edges: workflow.edges, fieldBindings,
		getViewport: workflow.getViewport, clearNodeErrors: workflow.onClearNodeErrors,
		validateEnhancementScripts: validation.validateEnhancementScripts });

	// Anything hosting its own editing surface: canvas-level keyboard shortcuts
	// must not reach past it into the graph underneath.
	const isEditorDialogOpen = !!(workflow.methodEditor || workflow.conditionEditor ||
		workflow.aggregatorEditor || workflow.historyOpen || templates.templateDialogOpen ||
		templates.loadTemplateDialogOpen || templates.connectorMappingDialogOpen ||
		isShortcutsOpen);

	useDeleteSelectedNode({ readOnly: isEditLocked, nodes: workflow.nodes,
		onDeleteNode: workflow.onDeleteNode, disabled: isEditorDialogOpen });
	useWorkflowUndoShortcuts({ readOnly: isEditLocked, undo: workflow.undo,
		redo: workflow.redo,
		disabled: isEditorDialogOpen || !!workflow.responseNodeId });

	// When a run starts, close the non-modal edit surfaces that may already be
	// open — the sidebar could still add a step and the history panel could still
	// swap the whole graph out from under the executing run.
	const { setSidebarAction, setContextMenu, setHistoryOpen } = workflow;
	useEffect(() => {
		if (!isTestRunLocked) return;
		setSidebarAction(null);
		setContextMenu(null);
		setHistoryOpen(false);
		setChangeHistoryOpen(false);
	}, [isTestRunLocked, setSidebarAction, setContextMenu, setHistoryOpen]);

	return { validation, saveWorkflow, category, templates, history, canvas, header,
		buildTestPayload, isShortcutsOpen, setIsShortcutsOpen,
		schedulesOpen, setSchedulesOpen, changeHistoryOpen, setChangeHistoryOpen };
};
