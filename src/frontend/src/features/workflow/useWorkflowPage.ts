import { useRef, useState } from 'react';
import { addEdge, useEdgesState, useNodesState } from '@xyflow/react';
import type { Connection } from '@xyflow/react';
import type { ReactFlowInstance, Viewport } from '@xyflow/react';
import type { InvokerOperation } from '@entities/invoker/model/types';
import { initialEdges, initialNodes } from './data/initialGraph';
import type { WorkflowAction, WorkflowContextMenu, WorkflowEdgeModel, WorkflowNodeModel } from './types/workflow.types';
import type { WorkflowConditionEditorState, WorkflowMethodConfig, WorkflowMethodEditorState } from './types/request-config.types';
import type { ConditionConfig } from './components/condition-builder/conditionBuilder.types';
import { createNodeFromAction, deleteNodeGraph } from './utils/graphUtils';

type UseWorkflowPageOptions = {
  onDeleteNodes?: (deletedNodeIds: string[], previousNodes: WorkflowNodeModel[]) => void;
};

export function useWorkflowPage(options: UseWorkflowPageOptions = {}) {
  const reactFlowInstance = useRef<ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel> | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNodeModel>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdgeModel>(initialEdges);
  const [sidebarAction, setSidebarAction] = useState<WorkflowAction | null>(null);
  const [contextMenu, setContextMenu] = useState<WorkflowContextMenu | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [methodEditor, setMethodEditor] = useState<WorkflowMethodEditorState | null>(null);
  const [conditionEditor, setConditionEditor] = useState<WorkflowConditionEditorState | null>(null);
  const [restoredViewport, setRestoredViewport] = useState<Viewport | undefined>();
  const [viewportRestoreVersion, setViewportRestoreVersion] = useState(0);
  const [centerStartVersion, setCenterStartVersion] = useState(1);

  return {
    nodes,
    edges,
    sidebarAction,
    contextMenu,
    historyOpen,
    methodEditor,
    conditionEditor,
    restoredViewport,
    viewportRestoreVersion,
    centerStartVersion,
    getViewport: () => reactFlowInstance.current?.getViewport(),
    setReactFlowInstance: (instance: ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel>) => {
      reactFlowInstance.current = instance;
    },
    onNodesChange,
    onEdgesChange,
    setContextMenu,
    setHistoryOpen,
    setSidebarAction,
    setMethodEditor,
    setConditionEditor,
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
    onOpenAddStep: (action: WorkflowAction) => { setSidebarAction(action); setContextMenu(null); setHistoryOpen(false); setMethodEditor(null); setConditionEditor(null); },
    onAddStep: (
      kind: WorkflowAction['kind'],
      methodName?: string,
      connector?: WorkflowAction['connector'],
      methodOperation?: InvokerOperation,
    ) => {
      if (!sidebarAction || !kind) return;
      const result = createNodeFromAction({ action: { ...sidebarAction, kind, methodName, connector, methodOperation }, nodes, edges });
      setNodes(result.nodes);
      setEdges(result.edges);
      setSidebarAction(null);
    },
    onDeleteNode: (nodeId: string) => {
      const targetNode = nodes.find((node) => node.id === nodeId);
      if (!targetNode || targetNode.type === 'start') return;
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
    onChangeNodeLabel: (nodeId: string, label: string) => setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, subtitle: label } } : node)),
    onSaveMethodConfig: (nodeId: string, methodConfig: WorkflowMethodConfig) => {
      setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, methodConfig } } : node));
      setMethodEditor(null);
    },
    onSaveConditionConfig: (nodeId: string, conditionConfig: ConditionConfig) => {
      setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, conditionConfig } } : node));
      setConditionEditor(null);
    },
  };
}
