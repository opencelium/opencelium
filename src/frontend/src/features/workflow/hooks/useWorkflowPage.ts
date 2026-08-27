import { useCallback, useMemo, useState } from 'react';
import { addEdge } from '@xyflow/react';
import type { Connection } from '@xyflow/react';
import type { ReactFlowInstance, Viewport } from '@xyflow/react';
import type { InvokerOperation } from '@entities/invoker/model/types';
import type { WorkflowAction, WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { createNodeFromAction, deleteNodeGraph } from '../utils/graphUtils';
import { cleanBrokenWorkflowReferences } from '../utils/graph.brokenReferenceCleanup';
import { describeAffectedSteps } from '../utils/affectedStepLabels';
import { message } from 'antd';
import { createCommentNode } from '../utils/createCommentNode';
import { findAnchoredComment } from '../utils/commentAnchor';
import { centerOnWorkflowNode } from '../utils/centerOnWorkflowNode';
import { useConfirm } from '@shared/ui/confirm/ConfirmDialogContext';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { UseWorkflowPageOptions } from '../drag-drop/workflowPage.types';
import { useWorkflowCommandBridge } from '../command/useWorkflowCommandBridge';
import { useWorkflowGraphState } from './useWorkflowGraphState';
import { useWorkflowDragPreviewState } from './useWorkflowDragPreviewState';
import { useWorkflowDragStart } from './useWorkflowDragStart';
import { useWorkflowDragMove } from './useWorkflowDragMove';
import { useWorkflowDragStop } from './useWorkflowDragStop';
import { useWorkflowNodeUpdates } from './useWorkflowNodeUpdates';
import { evaluateJointTargets } from '../utils/jumpValidator';
import { useWorkflowUndoHistory } from './useWorkflowUndoHistory';
import { useBindingLensState } from '../lens/useBindingLensState';

export function useWorkflowPage(options: UseWorkflowPageOptions = {}) {
  const confirm = useConfirm();
  const { t } = useI18n('workflow');
  const state = useWorkflowGraphState();
  const { reactFlowInstance, dragSnapshot, draggedPositionLockRef, multiDragRef,
    nodes, setNodes, handleNodesChange, edges, setEdges, onEdgesChange,
    isAnyNodeDragging, setIsAnyNodeDragging, sidebarAction, setSidebarAction,
    contextMenu, setContextMenu, historyOpen, setHistoryOpen, methodEditor,
    setMethodEditor, responseNodeId, setResponseNodeId, conditionEditor,
    setConditionEditor, aggregatorEditor, setAggregatorEditor, restoredViewport,
    setRestoredViewport, viewportRestoreVersion, setViewportRestoreVersion,
    centerStartVersion, setCenterStartVersion, bindingLensOpen,
    setBindingLensOpen, bindingLensExpanded, setBindingLensExpanded,
    bindingLensSelectedKey, setBindingLensSelectedKey, bindingLensPinnedNodeId,
    setBindingLensPinnedNodeId, bindingLensHoveredNodeId,
    setBindingLensHoveredNodeId, bindingTableOpen, setBindingTableOpen } = state;

  const bindingLens = useBindingLensState({ open: bindingLensOpen, setOpen: setBindingLensOpen,
    pinnedNodeId: bindingLensPinnedNodeId, setPinnedNodeId: setBindingLensPinnedNodeId,
    hoveredNodeId: bindingLensHoveredNodeId, setHoveredNodeId: setBindingLensHoveredNodeId,
    tableOpen: bindingTableOpen, setTableOpen: setBindingTableOpen,
    expandedNodeIds: bindingLensExpanded, setExpandedNodeIds: setBindingLensExpanded,
    selectedKey: bindingLensSelectedKey, setSelectedKey: setBindingLensSelectedKey });

  const dragPreview = useWorkflowDragPreviewState(setNodes, setEdges);
  const { updateEdges: updateDragPreviewEdges, updateNodes: updateDragPreviewNodes,
    clear: clearAllDragPreviewState, commitFreeReposition } = dragPreview;
  const handleNodeDragStart = useWorkflowDragStart({ nodes, edges, setNodes,
    setIsDragging: setIsAnyNodeDragging, reactFlowInstance, dragSnapshot,
    positionLock: draggedPositionLockRef, multiDrag: multiDragRef });
  const handleNodeDrag = useWorkflowDragMove({ fieldBindings: options.fieldBindings,
    setNodes, reactFlowInstance, dragSnapshot, multiDrag: multiDragRef,
    updateNodes: updateDragPreviewNodes, updateEdges: updateDragPreviewEdges,
    clearPreview: clearAllDragPreviewState });
  const handleNodeDragStop = useWorkflowDragStop({ options, setNodes, setEdges,
    setIsDragging: setIsAnyNodeDragging, reactFlowInstance, dragSnapshot,
    positionLock: draggedPositionLockRef, multiDrag: multiDragRef,
    clearPreview: clearAllDragPreviewState, commitFreeReposition,
    onJointsRemoved: (count) => message.warning(t('joint.removedAfterMove', { count })) });
  const undoHistory = useWorkflowUndoHistory({ nodes, edges,
    fieldBindings: options.fieldBindings, isDragging: isAnyNodeDragging,
    setNodes, setEdges, onFieldBindingsChange: options.onFieldBindingsChange });
  const nodeUpdates = useWorkflowNodeUpdates(setNodes,
    () => setMethodEditor(null), () => setConditionEditor(null),
    () => setAggregatorEditor(null));

  const [jointSourceId, setJointSourceId] = useState<string | null>(null);
  const jointVerdicts = useMemo(
    () => (jointSourceId
      ? evaluateJointTargets(jointSourceId, nodes, edges, options.fieldBindings ?? [])
      : undefined),
    [jointSourceId, nodes, edges, options.fieldBindings],
  );

  // Stable: the instance is read from the ref at call time, so every consumer
  // (command bridge, save-error highlighting) can hold on to one identity.
  const centerOnNode = useCallback((nodeId: string) =>
    centerOnWorkflowNode(reactFlowInstance.current, nodeId), [reactFlowInstance]);

  useWorkflowCommandBridge({
    nodes,
    setNodes,
    centerOnNode,
    hasOpenDialog: methodEditor !== null || conditionEditor !== null ||
      aggregatorEditor !== null || responseNodeId !== null || historyOpen,
  });

  return {
    nodes,
    edges,
    isAnyNodeDragging,
    sidebarAction,
    jointSourceId,
    jointVerdicts,
    contextMenu,
    historyOpen,
    methodEditor,
    responseNodeId,
    conditionEditor,
    aggregatorEditor,
    restoredViewport,
    viewportRestoreVersion,
    centerStartVersion,
    bindingLens,
    canUndo: undoHistory.canUndo,
    canRedo: undoHistory.canRedo,
    undo: undoHistory.undo,
    redo: undoHistory.redo,
    undoEntries: undoHistory.entries,
    jumpToUndoEntry: undoHistory.jumpTo,
    getViewport: () => reactFlowInstance.current?.getViewport(),
    centerOnNode,
    setReactFlowInstance: (instance: ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel>) => {
      reactFlowInstance.current = instance;
    },
    onNodesChange: handleNodesChange,
    onEdgesChange,
    setContextMenu,
    setHistoryOpen,
    setSidebarAction,
    setMethodEditor,
    setConditionEditor,
    setAggregatorEditor,
    setWorkflowGraph: (
      nextNodes: WorkflowNodeModel[],
      nextEdges: WorkflowEdgeModel[],
      nextViewport?: Viewport,
      options?: { centerStart?: boolean },
    ) => {
      // A wholesale replacement (connection load, template, version rollback)
      // is not an in-session edit — starting a fresh stack keeps undo from
      // splicing the previous workflow into this one.
      undoHistory.reset();
      setNodes(nextNodes);
      setEdges(nextEdges);
      setRestoredViewport(nextViewport);
      if (nextViewport) setViewportRestoreVersion((version) => version + 1);
      if (options?.centerStart) setCenterStartVersion((version) => version + 1);
    },
    onConnect: (connection: Connection) => setEdges((currentEdges) => addEdge({ ...connection, type: 'workflow-edge' }, currentEdges) as WorkflowEdgeModel[]),
    onNodeDragStart: handleNodeDragStart,
    onNodeDrag: handleNodeDrag,
    onNodeDragStop: handleNodeDragStop,
    onShowResponse: (nodeId: string) => { setResponseNodeId(nodeId); setContextMenu(null); },
    onCloseResponse: () => setResponseNodeId(null),
    onOpenAddStep: (action: WorkflowAction) => { setSidebarAction(action); setContextMenu(null); setHistoryOpen(false); setMethodEditor(null); setConditionEditor(null); setAggregatorEditor(null); },
    onStartJoint: (sourceNodeId: string) => {
      setSidebarAction(null);
      setContextMenu(null);
      setJointSourceId(sourceNodeId);
    },
    onConfirmJoint: (targetNodeId: string) => {
      if (!jointSourceId || !jointVerdicts?.get(targetNodeId)?.valid) return;
      setNodes((current) => current.map((item) =>
        item.id === jointSourceId ? { ...item, data: { ...item.data, jump: targetNodeId } } : item,
      ));
      setJointSourceId(null);
    },
    onCancelJoint: () => setJointSourceId(null),
    onRemoveJoint: async (nodeId: string) => {
      const withoutJoint = nodes.map((item) =>
        item.id === nodeId ? { ...item, data: { ...item.data, jump: undefined } } : item,
      );
      // A joint widens what its target can read, so removing one can put a
      // reference out of scope — the same cost a drop asks about, so it is asked
      // about here too rather than silently leaving an unreadable reference.
      const cleanup = cleanBrokenWorkflowReferences(
        withoutJoint, edges, options.fieldBindings, { nodes, edges });
      if (cleanup.brokenCount > 0) {
        const confirmed = await confirm({
          title: t('confirmRemoveJoint.title'),
          message: t('confirmRemoveJoint.message',
            { count: cleanup.affectedNodeIds.length }),
          confirmText: t('actions.removeJoint'),
          cancelText: t('actions.cancel'),
          confirmVariant: 'danger',
        });
        if (!confirmed) return;
        options.onFieldBindingsChange?.(cleanup.fieldBindings);
      }
      setNodes(cleanup.nodes);
    },
    onAddStep: (
      kind: WorkflowAction['kind'],
      methodName?: string,
      connector?: WorkflowAction['connector'],
      methodOperation?: InvokerOperation,
      triggerConnection?: WorkflowAction['triggerConnection'],
    ) => {
      if (!sidebarAction || !kind) return;
      const result = createNodeFromAction({ action: { ...sidebarAction, kind, methodName, connector, methodOperation, triggerConnection }, nodes, edges });
      setNodes(result.nodes);
      setEdges(result.edges);
      setSidebarAction(null);
    },
    // A note is an annotation, not a step: it belongs to the node it is added
    // from, gets no edge, and never enters the executed graph — which is why it
    // is raised from the node's own toolbar rather than the add-step sidebar. A
    // node holds at most one note, so a second request reveals the existing one
    // (which may just be minimized) instead of stacking another on top.
    onAddComment: (nodeId: string) => {
      const existing = findAnchoredComment(nodes, nodeId);
      if (existing) {
        if (existing.data.comment?.collapsed) nodeUpdates.onToggleComment(existing.id);
        return;
      }
      const comment = createCommentNode(nodes, nodeId);
      if (comment) setNodes([...nodes, comment]);
    },
    onDeleteNode: async (nodeId: string) => {
      const targetNode = nodes.find((node) => node.id === nodeId);
      if (!targetNode || targetNode.type === 'start') return;
      const result = deleteNodeGraph(nodeId, nodes, edges);
      // What the deletion costs elsewhere, resolved before it is confirmed: every
      // reference to the method being deleted, plus anything the smaller graph can
      // no longer reach. Leaving them behind was the old behaviour and it left
      // methods reading a method that is not there any more.
      const cleanup = cleanBrokenWorkflowReferences(
        result.nodes, result.edges, options.fieldBindings, { nodes, edges });
      // Named, not just counted: the count says how big the damage is, the names
      // say where it is — which is the half the user needs once the dialog is
      // gone and the references are already cleared.
      const affected = describeAffectedSteps(result.nodes, cleanup.affectedNodeIds);
      const affectedList = [
        ...affected.names,
        affected.more > 0 ? t('confirmDelete.andMore', { count: affected.more }) : '',
      ].filter(Boolean).join(', ');
      const confirmed = await confirm({
        title: t('confirmDelete.title'),
        message: cleanup.affectedNodeIds.length > 0
          ? `${t('confirmDelete.message')} ${t('confirmDelete.clearsReferences',
            { count: cleanup.affectedNodeIds.length, steps: affectedList })}`
          : t('confirmDelete.message'),
        confirmText: t('actions.delete'),
        cancelText: t('actions.cancel'),
        confirmVariant: 'solid',
      });
      if (!confirmed) return;
      setNodes(cleanup.nodes);
      setEdges(result.edges);
      if (cleanup.brokenCount > 0) options.onFieldBindingsChange?.(cleanup.fieldBindings);
      setContextMenu(null);
    },
    ...nodeUpdates,
  };
}
