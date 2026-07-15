import { Controls, ReactFlow } from '@xyflow/react';
import type {
  OnConnect,
  OnEdgesChange,
  OnNodeDrag,
  NodeMouseHandler,
  OnNodesChange,
  ReactFlowInstance,
  Viewport,
} from '@xyflow/react';
import { useEffect, useRef, type PropsWithChildren } from 'react';
import { WorkflowEdge } from '../edges/WorkflowEdge';
import { ConnectorMethodNode } from '../nodes/ConnectorMethodNode/ConnectorMethodNode';
import { IfOperatorNode } from '../nodes/IfOperatorNode';
import { LoopOperatorNode } from '../nodes/LoopOperatorNode';
import { StartNode } from '../nodes/StartNode/StartNode';
import { SystemMethodNode } from '../nodes/SystemMethodNode/SystemMethodNode';
import { TriggerConnectionNode } from '../nodes/TriggerConnectionNode/TriggerConnectionNode';
import {
  getOperatorBottomBranch,
  getOutgoingCount,
  isLeafNode,
} from '../utils/graphUtils';
import { ALL_COLORS } from '../constants/colors';
import type {
  WorkflowAction,
  WorkflowContextMenu,
  WorkflowEdgeModel,
  WorkflowNodeModel,
} from '../types/workflow.types';

type Props = PropsWithChildren<{
  nodes: WorkflowNodeModel[];
  edges: WorkflowEdgeModel[];
  isAnyNodeDragging?: boolean;
  activeAction: WorkflowAction | null;
  onNodesChange: OnNodesChange<WorkflowNodeModel>;
  onEdgesChange: OnEdgesChange<WorkflowEdgeModel>;
  onConnect: OnConnect;
  onNodeDragStart?: OnNodeDrag<WorkflowNodeModel>;
  onNodeDrag?: OnNodeDrag<WorkflowNodeModel>;
  onNodeDragStop?: OnNodeDrag<WorkflowNodeModel>;
  onOpenAddStep: (action: WorkflowAction) => void;
  onOpenContextMenu: (menu: WorkflowContextMenu | null) => void;
  onNodeDoubleClick?: NodeMouseHandler<WorkflowNodeModel>;
  onDeleteNode: (nodeId: string) => void;
  onPaneClick?: () => void;
  restoredViewport?: Viewport;
  viewportRestoreVersion?: number;
  centerStartVersion?: number;
  onInit?: (instance: ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel>) => void;
}>;

const nodeTypes = {
  start: StartNode,
  connector: ConnectorMethodNode,
  system: SystemMethodNode,
  'trigger-connection': TriggerConnectionNode,
  if: IfOperatorNode,
  loop: LoopOperatorNode,
};

const edgeTypes = {
  'workflow-edge': WorkflowEdge,
};

const START_NODE_SIZE = 62;

const centerStartNode = (
  instance: ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel> | null,
  nodes: WorkflowNodeModel[],
  zoom: number,
) => {
  const startNode = nodes.find((node) => node.type === 'start');
  if (!startNode || !instance) return;

  requestAnimationFrame(() => {
    instance.setCenter(
      startNode.position.x + START_NODE_SIZE / 2,
      startNode.position.y + START_NODE_SIZE / 2,
      { zoom, duration: 0 },
    );
  });
};

export function WorkflowCanvas({
  nodes,
  edges,
  isAnyNodeDragging = false,
  activeAction,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeDragStart,
  onNodeDrag,
  onNodeDragStop,
  onOpenAddStep,
  onOpenContextMenu,
  onNodeDoubleClick,
  onDeleteNode,
  onPaneClick,
  restoredViewport,
  viewportRestoreVersion = 0,
  centerStartVersion = 0,
  onInit,
  children,
}: Props) {
  const reactFlowInstance = useRef<ReactFlowInstance<WorkflowNodeModel, WorkflowEdgeModel> | null>(null);
  const restoredViewportKey = restoredViewport
    ? `${viewportRestoreVersion}:${restoredViewport.x}:${restoredViewport.y}:${restoredViewport.zoom}`
    : undefined;
  const appliedViewportKey = useRef<string | undefined>(undefined);
  const centeredStartVersion = useRef<number>(0);
  const onlyStartNode = nodes.length === 1 && nodes[0]?.type === 'start';
  const selectedOperator = nodes.find(
    (node) => node.selected && (node.type === 'if' || node.type === 'loop'),
  );
  const highlightedBranch = selectedOperator
    ? getOperatorBottomBranch(selectedOperator.id, nodes, edges)
    : { nodeIds: new Set<string>(), edgeIds: new Set<string>() };

  const methodInstanceById = new Map<string, { index: number; color: string }>();
  {
    const groups = new Map<string, WorkflowNodeModel[]>();
    for (const node of nodes) {
      if (node.type !== 'connector' && node.type !== 'system' && node.type !== 'trigger-connection') continue;
      if (node.data.dragGhost || node.data.dropPlaceholder) continue;
      const key = node.type === 'trigger-connection'
        ? `trigger-connection::${node.data.triggerConnection?.connectionId}::${node.data.triggerConnection?.schedulerId}`
        : `${node.data.connector?.connectorId ?? 'system'}::${node.data.subtitle ?? node.data.title}`;
      const list = groups.get(key) ?? [];
      list.push(node);
      groups.set(key, list);
    }
    const usedColors = new Set(
      nodes.map((node) => node.data.color?.toLowerCase()).filter(Boolean) as string[],
    );
    for (const members of groups.values()) {
      if (members.length < 2) continue;
      members.forEach((member, index) => {
        let color = member.data.color;
        if (!color) {
          color = ALL_COLORS.find((candidate) => !usedColors.has(candidate.toLowerCase()))
            ?? ALL_COLORS[index % ALL_COLORS.length];
          usedColors.add(color.toLowerCase());
        }
        methodInstanceById.set(member.id, { index: index + 1, color });
      });
    }
  }

  const preparedNodes: WorkflowNodeModel[] = nodes.map((node) => {
    const isPreviewNode = Boolean(node.data.dragGhost || node.data.dropPlaceholder);
    const outgoingCount = getOutgoingCount(node.id, edges);

    const rightLeaf =
      node.type === 'if'
        ? isLeafNode(node.id, edges, 'false')
        : node.type === 'loop'
          ? isLeafNode(node.id, edges, 'right')
          : outgoingCount === 0;

    const bottomLeaf =
      node.type === 'if'
        ? isLeafNode(node.id, edges, 'true')
        : node.type === 'loop'
          ? isLeafNode(node.id, edges, 'bottom')
          : false;

    return {
      ...node,
      selectable: node.type !== 'start' && !isPreviewNode,
      draggable: !isPreviewNode,
      data: {
        ...node.data,
        isLeaf: outgoingCount === 0,
        rightLeaf: isPreviewNode ? false : rightLeaf,
        bottomLeaf: isPreviewNode ? false : bottomLeaf,
        duplicateMethodIndex: methodInstanceById.get(node.id)?.index,
        duplicateMethodColor: methodInstanceById.get(node.id)?.color,
        alwaysShowRightAdd: !isPreviewNode && node.type === 'start' && onlyStartNode,
        highlighted: Boolean(node.data.highlighted) || highlightedBranch.nodeIds.has(node.id),
        suppressHoverAddControls: isPreviewNode || activeAction?.sourceNodeId === node.id,
        lockVisibleAddControls: !isPreviewNode && activeAction?.sourceNodeId === node.id,
        isAnyNodeDragging,
        onAddStep: onOpenAddStep,
        onOpenContextMenu,
        onDeleteNode,
      },
    };
  });

  const preparedEdges: WorkflowEdgeModel[] = edges.map((edge) => ({
    ...edge,
    data: {
      ...edge.data,
      highlighted: Boolean(edge.data?.highlighted) || highlightedBranch.edgeIds.has(edge.id),
    },
  }));

  useEffect(() => {
    if (!restoredViewport || !reactFlowInstance.current) return;
    if (appliedViewportKey.current === restoredViewportKey) return;
    appliedViewportKey.current = restoredViewportKey;
    requestAnimationFrame(() => {
      reactFlowInstance.current?.setViewport(restoredViewport, { duration: 0 });
    });
  }, [restoredViewport, restoredViewportKey]);

  useEffect(() => {
    if (!centerStartVersion || centeredStartVersion.current === centerStartVersion) return;
    if (!reactFlowInstance.current) return;
    centeredStartVersion.current = centerStartVersion;
    centerStartNode(reactFlowInstance.current, nodes, restoredViewport?.zoom ?? 1);
  }, [centerStartVersion, nodes, restoredViewport?.zoom]);

  return (
    <div className="canvasCard">
      <ReactFlow<WorkflowNodeModel, WorkflowEdgeModel>
        nodes={preparedNodes}
        edges={preparedEdges}
        proOptions={{ hideAttribution: true }}
        onInit={(instance) => {
          reactFlowInstance.current = instance;
          onInit?.(instance);
          if (centerStartVersion && centeredStartVersion.current !== centerStartVersion) {
            centeredStartVersion.current = centerStartVersion;
            centerStartNode(instance, nodes, restoredViewport?.zoom ?? 1);
          }
        }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable
        selectionOnDrag={false}
        selectionKeyCode={null}
        deleteKeyCode={null}
        panOnDrag
        zoomOnScroll
      >
        {children}
        <Controls position="top-left" className="workflowControls" />
      </ReactFlow>
    </div>
  );
}
