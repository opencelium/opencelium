import { useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import './styles.css';
import { WorkflowPageHeader } from './components/WorkflowPageHeader/WorkflowPageHeader';
import { WorkflowNodeEditors } from './components/WorkflowNodeEditors/WorkflowNodeEditors';
import { WorkflowPanels } from './components/WorkflowPanels/WorkflowPanels';
import { WorkflowMain } from './components/WorkflowMain/WorkflowMain';
import { WorkflowPageDialogs } from './components/WorkflowPageDialogs/WorkflowPageDialogs';
import { TestRunProvider } from './test-run/TestRunProvider';
import { TestRunEditLockSync } from './test-run/TestRunEditLockSync';
import { useWorkflowPageState } from './hooks/useWorkflowPageState';
import { useWorkflowActions } from './hooks/useWorkflowActions';
import { buildLoopAncestorsByIndexPath } from './test-run/liveGraphStatus';
import { buildWorkflowIndexes } from './api/connectionPayload';

type WorkflowProps = {
  readOnly?: boolean;
};

export default function Workflow({ readOnly = false }: WorkflowProps = {}) {
  const { connectionId } = useParams<{ connectionId: string }>();
  const { t } = useI18n('workflow');
  // Mirrored up from inside TestRunProvider by TestRunEditLockSync — see there
  // for why paused does not count as locked.
  const [isTestRunLocked, setIsTestRunLocked] = useState(false);
  const { connection, workflow, connectors, invokers, view, changes, derived,
    isLoading } = useWorkflowPageState({ connectionId, readOnly,
      leaveConfirmMessage: t('messages.unsavedLeaveConfirm') });
  const { headerState, setHeaderState, fieldBindings: loadedFieldBindings,
    setFieldBindings: setLoadedFieldBindings,
    selectedHistoryVersionId, setSelectedHistoryVersionId, categoryId, setCategoryId,
    isLoading: isConnectionLoading } = connection;
  const { hydratedNodes, activeConnectionId, displayedHistoryVersions } = view;
  const { hasChanges: hasConnectionChanges,
    hasManualChanges: hasManualUnsavedChanges } = changes;
  const { selectedNode, contextMenuNode, editorNode, conditionNode, aggregatorNode,
    conditionConnection } = derived;
  const loopAncestorsByIndexPath = useMemo(
    () => buildLoopAncestorsByIndexPath(hydratedNodes, workflow.edges),
    [hydratedNodes, workflow.edges],
  );
  // nodeId -> workflow tree-path index, for correlating a canvas node with its
  // live execution element (see ResponseDialog's paused live-response lookup).
  const nodeIndexById = useMemo(
    () => buildWorkflowIndexes(hydratedNodes, workflow.edges),
    [hydratedNodes, workflow.edges],
  );

  const actions = useWorkflowActions({ connectionId, readOnly, isTestRunLocked,
    page: { connection, workflow, connectors, invokers, view, changes, derived,
      isLoading } });
  const { validation, saveWorkflow: handleSave, category, templates: templateActions,
    history: historyActions, canvas, header, buildTestPayload, isShortcutsOpen,
    setIsShortcutsOpen, schedulesOpen, setSchedulesOpen } = actions;
  const { validateTitle, resolveAndHighlightError: resolveAndHighlightWorkflowError } = validation;
  const { closeCanvasPanels, handleNodeDoubleClick } = canvas;
  const { selectMenuItem: handleHeaderMenuSelect, showHistory: handleOpenHistory } = header;
  const { open: assignCategoryOpen, setOpen: setAssignCategoryOpen,
    isAssigning: isAssigningCategory, assignCategory: handleAssignCategory } = category;
  const { templateDialogOpen, templateName, setTemplateName, templateDescription,
    setTemplateDescription, templateNameError, setTemplateNameError,
    isSavingTemplate, isDownloadingTemplate, closeSaveTemplateDialog,
    saveConnectionAsTemplate, downloadConnectionTemplate, loadTemplateDialogOpen,
    templates, selectedTemplateId, setSelectedTemplateId, isLoadingTemplates,
    isUploadingTemplate, uploadTemplateInLoadDialog, closeLoadTemplateDialog, isApplyingTemplate,
    connectorMappingDialogOpen, connectorMappingGroups, applySelectedTemplate,
    handleConfirmConnectorMapping, handleCancelConnectorMapping } = templateActions;

  return (
    <TestRunProvider connectionId={connectionId} connectionTitle={headerState.title}
      buildTestPayload={buildTestPayload}
      onResolveStartError={resolveAndHighlightWorkflowError}
      loopAncestorsByIndexPath={loopAncestorsByIndexPath}>
    <TestRunEditLockSync onLockChange={setIsTestRunLocked} />
    <div className="page" data-testid="workflow-page">
      <WorkflowPageHeader connectionId={activeConnectionId} schedulesOpen={schedulesOpen}
        onToggleSchedules={() => setSchedulesOpen((open) => {
          if (!open) workflow.setHistoryOpen(false);
          return !open;
        })}
        header={{ initialName: headerState.title,
          initialDescription: headerState.description, onChange: setHeaderState,
          onMenuItemSelect: handleHeaderMenuSelect,
          menuLoadingItemId: isDownloadingTemplate ? 'download-template' : null,
          validateTitle, onSave: handleSave,
          saveDisabled: isLoading || !hasConnectionChanges,
          onOpenHistory: handleOpenHistory,
          readOnly: readOnly || isTestRunLocked, testRunLocked: isTestRunLocked,
          loading: isConnectionLoading,
          hasSavedConnection: !!activeConnectionId,
          undoRedo: { canUndo: workflow.canUndo, canRedo: workflow.canRedo,
            onUndo: workflow.undo, onRedo: workflow.redo,
            entries: workflow.undoEntries, onJumpTo: workflow.jumpToUndoEntry } }} />
      <WorkflowPageDialogs
        templates={{
          save: { open: templateDialogOpen, name: templateName,
            description: templateDescription, nameError: templateNameError,
            loading: isSavingTemplate, onNameChange: setTemplateName,
            onDescriptionChange: setTemplateDescription,
            onClearNameError: () => setTemplateNameError(''),
            onClose: closeSaveTemplateDialog, onSave: saveConnectionAsTemplate },
          load: { open: loadTemplateDialogOpen, templates, selectedId: selectedTemplateId,
            loading: isLoadingTemplates, uploading: isUploadingTemplate,
            applying: isApplyingTemplate, onSelect: setSelectedTemplateId,
            onUpload: uploadTemplateInLoadDialog,
            onClose: () => closeLoadTemplateDialog(isApplyingTemplate),
            onLoad: applySelectedTemplate },
          mapping: { open: connectorMappingDialogOpen, groups: connectorMappingGroups,
            connectors, invokers, onConfirm: handleConfirmConnectorMapping,
            onCancel: handleCancelConnectorMapping },
        }}
        shortcuts={{ open: isShortcutsOpen, onClose: () => setIsShortcutsOpen(false) }}
        category={{ open: assignCategoryOpen, currentCategoryId: categoryId,
          loading: isAssigningCategory, onClose: () => setAssignCategoryOpen(false),
          onAssign: handleAssignCategory }} />
      <WorkflowMain loading={isLoading} canvas={{ nodes: hydratedNodes,
        edges: workflow.edges, isAnyNodeDragging: workflow.isAnyNodeDragging,
        restoredViewport: workflow.restoredViewport,
        viewportRestoreVersion: workflow.viewportRestoreVersion,
        centerStartVersion: workflow.centerStartVersion,
        onInit: workflow.setReactFlowInstance, activeAction: workflow.sidebarAction,
        onNodesChange: workflow.onNodesChange, onEdgesChange: workflow.onEdgesChange,
        onConnect: workflow.onConnect, onNodeDragStart: workflow.onNodeDragStart,
        onNodeDrag: workflow.onNodeDrag, onNodeDragStop: workflow.onNodeDragStop,
        onOpenAddStep: workflow.onOpenAddStep, onOpenContextMenu: workflow.setContextMenu,
        onNodeDoubleClick: handleNodeDoubleClick, onDeleteNode: workflow.onDeleteNode,
        onOpenAggregatorEditor: (nodeId) => workflow.setAggregatorEditor({ nodeId }),
        onChangeCommentText: workflow.onChangeCommentText,
        onToggleComment: workflow.onToggleComment,
        onPaneClick: closeCanvasPanels }} />
      <WorkflowPanels
        sidebar={{ action: isTestRunLocked ? null : workflow.sidebarAction, selectedNode,
          connectionId: activeConnectionId, onClose: () => workflow.setSidebarAction(null),
          onSelect: workflow.onAddStep }}
        schedules={{ open: schedulesOpen, connectionId: activeConnectionId,
          connectionTitle: headerState.title, onClose: () => setSchedulesOpen(false) }}
        history={{ open: workflow.historyOpen, items: displayedHistoryVersions,
          selectedId: selectedHistoryVersionId,
          onSelectedIdChange: setSelectedHistoryVersionId,
          hasUnsavedChanges: hasManualUnsavedChanges,
          onClose: () => workflow.setHistoryOpen(false),
          onSelectVersion: historyActions.selectVersion,
          onSaveComment: historyActions.saveComment,
          onDeleteVersion: historyActions.deleteVersion,
          onDownloadTemplate: downloadConnectionTemplate }}
        contextMenu={{ menu: workflow.contextMenu, node: contextMenuNode,
          onChangeLabel: workflow.onChangeNodeLabel,
          onOpenRequestEditor: (nodeId, mode) => workflow.setMethodEditor({ nodeId, mode }),
          onOpenConditionEditor: (nodeId) => workflow.setConditionEditor({ nodeId }),
          onShowResponse: workflow.onShowResponse,
          onOpenAggregatorEditor: (nodeId) => workflow.setAggregatorEditor({ nodeId }),
          onClose: () => workflow.setContextMenu(null) }} />
      <WorkflowNodeEditors
        response={{ open: !!workflow.responseNodeId,
          node: hydratedNodes.find((node) => node.id === workflow.responseNodeId) ?? null,
          nodeIndexById, loopAncestorsByIndexPath,
          onClose: workflow.onCloseResponse }}
        method={{ open: !!workflow.methodEditor, node: editorNode,
          mode: workflow.methodEditor?.mode ?? null, nodes: hydratedNodes,
          edges: workflow.edges, fieldBindings: loadedFieldBindings,
          onFieldBindingsChange: setLoadedFieldBindings,
          onClose: () => workflow.setMethodEditor(null),
          onSave: (nodeId, config, nextBindings) => {
            if (Array.isArray(nextBindings)) setLoadedFieldBindings(nextBindings);
            workflow.onSaveMethodConfig(nodeId, config);
          } }}
        condition={{ open: !!workflow.conditionEditor, node: conditionNode,
          nodes: hydratedNodes, edges: workflow.edges, connection: conditionConnection,
          onClose: () => workflow.setConditionEditor(null),
          onSave: workflow.onSaveConditionConfig }}
        aggregator={{ open: !!workflow.aggregatorEditor, node: aggregatorNode,
          onClose: () => workflow.setAggregatorEditor(null),
          onSave: workflow.onSaveDataAggregator }} />
    </div>
    </TestRunProvider>
  );
}
