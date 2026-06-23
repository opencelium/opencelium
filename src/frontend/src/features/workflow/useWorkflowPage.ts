import { useRef, useState } from 'react';
import { addEdge, useEdgesState, useNodesState } from '@xyflow/react';
import type { Connection } from '@xyflow/react';
import type { ReactFlowInstance, Viewport } from '@xyflow/react';
import type { InvokerOperation } from '@entities/invoker/model/types';
import { initialEdges, initialNodes } from './data/initialGraph';
import type { WorkflowAction, WorkflowContextMenu, WorkflowEdgeModel, WorkflowNodeModel } from './types/workflow.types';
import type { WorkflowConditionEditorState, WorkflowMethodConfig, WorkflowMethodEditorState } from './types/request-config.types';
import type { ConditionConfig } from './components/condition-builder/conditionBuilder.types';
import { ALL_COLORS } from './constants/colors';
import { createNodeFromAction, deleteNodeGraph } from './utils/graphUtils';
import { getOperatorBottomBranch } from './utils/graph.traversal';
import {
  moveOrCopyWorkflowNodes,
  type InvalidReference,
  type WorkflowDropMode,
} from './utils/graph.dragDrop';

type UseWorkflowPageOptions = {
  onDeleteNodes?: (deletedNodeIds: string[], previousNodes: WorkflowNodeModel[]) => void;
  fieldBindings?: any[];
  onFieldBindingsChange?: (fieldBindings: any[] | undefined) => void;
  confirmDependencyDrop?: (invalidReferences: InvalidReference[]) => Promise<boolean>;
};

const DROP_EDGE_MAX_DISTANCE = 90;
const DROP_LEAF_MAX_DISTANCE = 70;

export function useWorkflowPage(options: UseWorkflowPageOptions = {}) {
  const reactFlowInstance = useRef<ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel> | null>(null);
  const dragSnapshot = useRef<{
    nodes: WorkflowNodeModel[];
    edges: WorkflowEdgeModel[];
    mode: WorkflowDropMode;
    operatorConfigs: Map<string, ConditionConfig>;
    highlightedNodeIds: Set<string>;
    highlightedEdgeIds: Set<string>;
  } | null>(null);
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

  const stabilizeMethodColors = (sourceNodes: WorkflowNodeModel[]) => {
    let methodIndex = 0;
    const usedColors = new Set<string>();
    return sourceNodes.map((item) => {
      if (item.type !== 'connector' && item.type !== 'system') return item;
      let color = item.data.color;
      if (!color || usedColors.has(color.toLowerCase())) {
        color = ALL_COLORS.find((candidate) => !usedColors.has(candidate.toLowerCase()))
          ?? ALL_COLORS[methodIndex % ALL_COLORS.length];
      }
      usedColors.add(color.toLowerCase());
      methodIndex += 1;
      if (item.data.color === color) return item;
      return {
        ...item,
        data: {
          ...item.data,
          color,
        },
      };
    });
  };

  const restoreStableNodeData = (
    nextNodes: WorkflowNodeModel[],
    previousNodes: WorkflowNodeModel[],
    operatorConfigs?: Map<string, ConditionConfig>,
  ) => {
    const stablePreviousNodes = stabilizeMethodColors(previousNodes);
    const previousById = new Map(stablePreviousNodes.map((item) => [item.id, item]));
    return nextNodes.map((item) => {
      const savedConfig = operatorConfigs?.get(item.id);
      const previous = previousById.get(item.id);
      if ((item.type === 'connector' || item.type === 'system')) {
        const color = previous?.data.color ?? item.data.color;
        if (!color) return item;
        return {
          ...item,
          data: {
            ...item.data,
            color,
          },
        };
      }
      if (item.type !== 'if' && item.type !== 'loop') return item;
      const conditionConfig = item.data.conditionConfig ?? savedConfig ?? previous?.data.conditionConfig;
      if (!conditionConfig) return item;
      return {
        ...item,
        data: {
          ...item.data,
          conditionConfig,
        },
      };
    });
  };

  const clearDragFlags = (sourceNodes: WorkflowNodeModel[]) => sourceNodes.map((item) => ({
    ...item,
    data: {
      ...item.data,
      highlighted: false,
      dropTarget: false,
      dropInvalid: false,
    },
  }));

  const clearEdgeDragFlags = (sourceEdges: WorkflowEdgeModel[]) => sourceEdges.map((item) => ({
    ...item,
    data: {
      ...item.data,
      highlighted: false,
      dropTarget: false,
      dropInvalid: false,
    },
  }));

  const findDropTarget = (
    event: { clientX?: number; clientY?: number } | undefined,
    sourceNodeId: string,
    snapshotNodes: WorkflowNodeModel[],
    snapshotEdges: WorkflowEdgeModel[],
  ) => {
    const instance = reactFlowInstance.current;
    if (!instance || typeof event?.clientX !== 'number' || typeof event?.clientY !== 'number') return undefined;
    const point = instance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const nodeById = new Map(snapshotNodes.map((item) => [item.id, item]));
    const source = nodeById.get(sourceNodeId);
    const sourceBranch = source && (source.type === 'if' || source.type === 'loop')
      ? getOperatorBottomBranch(source.id, snapshotNodes, snapshotEdges)
      : { nodeIds: new Set<string>() };
    const movedNodeIds = new Set([sourceNodeId, ...sourceBranch.nodeIds]);

    const closestEdge = snapshotEdges
      .filter((edge) => !movedNodeIds.has(edge.source) && !movedNodeIds.has(edge.target))
      .map((edge) => {
        const sourceNode = nodeById.get(edge.source);
        const targetNode = nodeById.get(edge.target);
        if (!sourceNode || !targetNode || sourceNode.type === 'start' && targetNode.type === 'start') return undefined;
        const sourceWidth = sourceNode.measured?.width ?? sourceNode.width ?? 80;
        const sourceHeight = sourceNode.measured?.height ?? sourceNode.height ?? 80;
        const targetWidth = targetNode.measured?.width ?? targetNode.width ?? 80;
        const targetHeight = targetNode.measured?.height ?? targetNode.height ?? 80;
        const sourceCenter = {
          x: sourceNode.position.x + sourceWidth / 2,
          y: sourceNode.position.y + sourceHeight / 2,
        };
        const targetCenter = {
          x: targetNode.position.x + targetWidth / 2,
          y: targetNode.position.y + targetHeight / 2,
        };
        const mid = {
          x: (sourceCenter.x + targetCenter.x) / 2,
          y: (sourceCenter.y + targetCenter.y) / 2,
        };
        const distance = Math.hypot(point.x - mid.x, point.y - mid.y);
        const direction = edge.targetHandle === 'top' || edge.sourceHandle === 'true' || edge.sourceHandle === 'bottom'
          ? 'bottom'
          : 'right';
        return { edge, target: { nodeId: edge.source, direction } as const, distance };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((left, right) => left.distance - right.distance)[0];
    if (closestEdge && closestEdge.distance <= DROP_EDGE_MAX_DISTANCE) return closestEdge;

    const hasRightEdge = (nodeId: string) => snapshotEdges.some((edge) =>
      edge.source === nodeId &&
      (edge.sourceHandle === 'right' || edge.sourceHandle === 'false' || edge.sourceHandle === undefined),
    );
    const hasBottomEdge = (nodeId: string) => snapshotEdges.some((edge) =>
      edge.source === nodeId &&
      (edge.sourceHandle === 'bottom' || edge.sourceHandle === 'true'),
    );
    return snapshotNodes
      .filter((item) => item.type !== 'start' && !movedNodeIds.has(item.id))
      .map((item) => {
        const width = item.measured?.width ?? item.width ?? 80;
        const height = item.measured?.height ?? item.height ?? 80;
        const center = {
          x: item.position.x + width / 2,
          y: item.position.y + height / 2,
        };
        const direction = (item.type === 'if' || item.type === 'loop') && Math.abs(point.x - center.x) < width && point.y > center.y
          ? 'bottom'
          : 'right';
        if (direction === 'right' && hasRightEdge(item.id)) return undefined;
        if (direction === 'bottom' && hasBottomEdge(item.id)) return undefined;
        const anchor = direction === 'bottom'
          ? { x: center.x, y: item.position.y + height + 30 }
          : { x: item.position.x + width + 30, y: center.y };
        return {
          edge: undefined,
          target: { nodeId: item.id, direction } as const,
          distance: Math.hypot(point.x - anchor.x, point.y - anchor.y),
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((left, right) => left.distance - right.distance)
      .find((item) => item.distance <= DROP_LEAF_MAX_DISTANCE);
  };

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
    onNodeDragStart: (event: any, node: WorkflowNodeModel) => {
      const stableNodes = stabilizeMethodColors(nodes);
      const draggedNode = stableNodes.find((item) => item.id === node.id);
      const highlightedBranch = draggedNode && (draggedNode.type === 'if' || draggedNode.type === 'loop')
        ? getOperatorBottomBranch(draggedNode.id, stableNodes, edges)
        : { nodeIds: new Set<string>(), edgeIds: new Set<string>() };
      dragSnapshot.current = {
        nodes: stableNodes,
        edges,
        mode: event?.ctrlKey ? 'copy' : 'move',
        operatorConfigs: new Map(
          stableNodes
            .filter((item) => (item.type === 'if' || item.type === 'loop') && item.data.conditionConfig)
            .map((item) => [item.id, item.data.conditionConfig as ConditionConfig]),
        ),
        highlightedNodeIds: highlightedBranch.nodeIds,
        highlightedEdgeIds: highlightedBranch.edgeIds,
      };
      if (highlightedBranch.nodeIds.size > 0) {
        setNodes((currentNodes) => currentNodes.map((item) => ({
          ...item,
          data: {
            ...item.data,
            highlighted: highlightedBranch.nodeIds.has(item.id),
          },
        })));
        setEdges((currentEdges) => currentEdges.map((item) => ({
          ...item,
          data: {
            ...item.data,
            highlighted: highlightedBranch.edgeIds.has(item.id),
          },
        })));
      }
    },
    onNodeDrag: (event: any, node: WorkflowNodeModel) => {
      const snapshot = dragSnapshot.current;
      if (!snapshot || node.type === 'start') return;
      const dropTarget = findDropTarget(event, node.id, snapshot.nodes, snapshot.edges);
      if (!dropTarget) {
        setNodes((currentNodes) => currentNodes.map((item) => ({
          ...item,
          data: {
            ...item.data,
            highlighted: snapshot.highlightedNodeIds.has(item.id),
            dropTarget: false,
            dropInvalid: false,
          },
        })));
        setEdges((currentEdges) => currentEdges.map((item) => ({
          ...item,
          data: {
            ...item.data,
            highlighted: snapshot.highlightedEdgeIds.has(item.id),
            dropTarget: false,
            dropInvalid: false,
          },
        })));
        return;
      }
      const preview = moveOrCopyWorkflowNodes({
        sourceNodeId: node.id,
        target: dropTarget.target,
        mode: snapshot.mode,
        nodes: snapshot.nodes,
        edges: snapshot.edges,
        fieldBindings: options.fieldBindings,
      });
      setNodes((currentNodes) => currentNodes.map((item) => ({
        ...item,
        data: {
          ...item.data,
          highlighted: snapshot.highlightedNodeIds.has(item.id),
          dropTarget: !dropTarget.edge && item.id === dropTarget.target.nodeId,
          dropInvalid: !dropTarget.edge && item.id === dropTarget.target.nodeId && preview.invalidReferences.length > 0,
        },
      })));
      setEdges((currentEdges) => currentEdges.map((item) => ({
        ...item,
        data: {
          ...item.data,
          highlighted: snapshot.highlightedEdgeIds.has(item.id) || item.id === dropTarget.edge?.id,
          dropTarget: item.id === dropTarget.edge?.id,
          dropInvalid: item.id === dropTarget.edge?.id && preview.invalidReferences.length > 0,
        },
      })));
    },
    onNodeDragStop: async (event: any, node: WorkflowNodeModel) => {
      const snapshot = dragSnapshot.current;
      dragSnapshot.current = null;
      if (!snapshot || node.type === 'start') return;

      const dropTarget = findDropTarget(event, node.id, snapshot.nodes, snapshot.edges);
      if (!dropTarget) {
        setNodes((currentNodes) => clearDragFlags(currentNodes));
        setEdges((currentEdges) => clearEdgeDragFlags(currentEdges));
        return;
      }
      const preview = moveOrCopyWorkflowNodes({
        sourceNodeId: node.id,
        target: dropTarget.target,
        mode: snapshot.mode,
        nodes: snapshot.nodes,
        edges: snapshot.edges,
        fieldBindings: options.fieldBindings,
      });

      let next = preview;
      if (preview.invalidReferences.length > 0) {
        const ok = await options.confirmDependencyDrop?.(preview.invalidReferences);
        if (!ok) {
          setNodes(clearDragFlags(snapshot.nodes));
          setEdges(clearEdgeDragFlags(snapshot.edges));
          return;
        }
        next = moveOrCopyWorkflowNodes({
          sourceNodeId: node.id,
          target: dropTarget.target,
          mode: snapshot.mode,
          nodes: snapshot.nodes,
          edges: snapshot.edges,
          fieldBindings: options.fieldBindings,
          cleanInvalid: true,
        });
      }

      setNodes(clearDragFlags(restoreStableNodeData(next.nodes, snapshot.nodes, snapshot.operatorConfigs)));
      setEdges(clearEdgeDragFlags(next.edges));
      options.onFieldBindingsChange?.(next.fieldBindings);
    },
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
    onChangeNodeLabel: (nodeId: string, label: string) => setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, subtitle: label, labelEdited: true } } : node)),
    onSaveMethodConfig: (nodeId: string, methodConfig: WorkflowMethodConfig) => {
      // The request editor rebuilds the config without the operation `name`;
      // keep the existing one so it stays read-only across method-config edits.
      setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, methodConfig: { ...methodConfig, name: methodConfig.name ?? node.data.methodConfig?.name } } } : node));
      setMethodEditor(null);
    },
    onSaveConditionConfig: (nodeId: string, conditionConfig: ConditionConfig) => {
      setNodes((currentNodes) => currentNodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, conditionConfig } } : node));
      setConditionEditor(null);
    },
  };
}
