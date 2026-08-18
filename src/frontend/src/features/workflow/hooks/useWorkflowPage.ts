import { useMemo, useState } from 'react';
import { addEdge } from '@xyflow/react';
import type { Connection } from '@xyflow/react';
import type { ReactFlowInstance, Viewport } from '@xyflow/react';
import type { InvokerOperation } from '@entities/invoker/model/types';
import type { WorkflowAction, WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { createNodeFromAction, deleteNodeGraph } from '../utils/graphUtils';
import { message } from 'antd';
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
    centerStartVersion, setCenterStartVersion } = state;

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

  useWorkflowCommandBridge({
    nodes,
    setNodes,
    reactFlowInstance,
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
    getViewport: () => reactFlowInstance.current?.getViewport(),
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
        item.id === jointSourceId ? { ...item, data: { ...item.data, jumpTo: targetNodeId } } : item,
      ));
      setJointSourceId(null);
    },
    onCancelJoint: () => setJointSourceId(null),
    onRemoveJoint: (nodeId: string) => {
      setNodes((current) => current.map((item) =>
        item.id === nodeId ? { ...item, data: { ...item.data, jumpTo: undefined } } : item,
      ));
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
    onDeleteNode: async (nodeId: string) => {
      const targetNode = nodes.find((node) => node.id === nodeId);
      if (!targetNode || targetNode.type === 'start') return;
      const confirmed = await confirm({
        title: t('confirmDelete.title'),
        message: t('confirmDelete.message'),
        confirmText: t('actions.delete'),
        cancelText: t('actions.cancel'),
        confirmVariant: 'solid',
      });
      if (!confirmed) return;
      const result = deleteNodeGraph(nodeId, nodes, edges);
      const nextNodeIds = new Set(result.nodes.map((node) => node.id));
      const deletedNodeIds = nodes
        .filter((node) => !nextNodeIds.has(node.id))
        .map((node) => node.id);
      if (deletedNodeIds.length > 0) {
        options.onDeleteNodes?.(deletedNodeIds, nodes);
      }
      setNodes(result.nodes);
      setEdges(result.edges);
      setContextMenu(null);
    },
    ...nodeUpdates,
  };
}
