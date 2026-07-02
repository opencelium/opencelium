import { MarkerType } from '@xyflow/react';
import type { CreateNodeFromActionArgs, WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { OFFSETS, SUBTITLES, TITLES } from './graph.constants';
import { getDefaultSourceHandle, getDefaultTargetHandle, getNodeType } from './graph.handles';
import { getBranchMaxX, rebalanceOperatorRightChains, shiftNodesByIds } from './graph.layout';
import { collectDescendantNodeIds } from './graph.traversal';
import { createMethodConfigFromOperation } from './requestConfig';
import { createShortId } from '@shared/lib/createId';
import { ALL_COLORS } from '../constants/colors';

function findOutgoingEdgeForAction(sourceNodeId: string, action: CreateNodeFromActionArgs['action'], edges: WorkflowEdgeModel[]) {
  return edges.find(
    (edge) => edge.source === sourceNodeId && (edge.sourceHandle ?? undefined) === (action.sourceHandle ?? undefined),
  );
}

function buildNewNode(args: CreateNodeFromActionArgs, sourceNode: WorkflowNodeModel, interceptedTargetNode?: WorkflowNodeModel) {
  const nodeType = getNodeType(args.action.kind!);
  const nextId = createShortId(args.action.kind);
  const usedColors = new Set(args.nodes.map((node) => node.data.color?.toLowerCase()).filter(Boolean));
  const nextColor = nodeType === 'connector' || nodeType === 'system'
    ? ALL_COLORS.find((color) => !usedColors.has(color.toLowerCase()))
    : undefined;
  const baseX = sourceNode.type === 'if' || sourceNode.type === 'loop'
    ? getBranchMaxX(sourceNode.id, args.nodes, args.edges)
    : sourceNode.position.x;
  const targetPosition = args.action.direction === 'right'
    ? { x: baseX + OFFSETS.right.x, y: sourceNode.position.y }
    : { x: sourceNode.position.x, y: sourceNode.position.y + OFFSETS.bottom.y };

  const branch = sourceNode.type === 'if' ? (args.action.direction === 'bottom' ? 'true' : 'false') : undefined;
  const newNode: WorkflowNodeModel = {
    id: nextId,
    type: nodeType,
    position: targetPosition,
    data: {
      title: args.action.kind === 'connector' && args.action.connector
        ? args.action.connector.title
        : TITLES[args.action.kind!],
      subtitle: args.action.methodName ?? SUBTITLES[args.action.kind!],
      kind: nodeType,
      connector: args.action.connector,
      color: nextColor,
      methodConfig: nodeType === 'connector' || nodeType === 'system' ? createMethodConfigFromOperation(args.action.methodOperation) : undefined,
    },
  };
  const newEdge: WorkflowEdgeModel = {
    id: `edge-${sourceNode.id}-${nextId}`,
    source: sourceNode.id,
    target: nextId,
    sourceHandle: args.action.sourceHandle ?? undefined,
    targetHandle: getDefaultTargetHandle(args.action.direction),
    type: 'workflow-edge',
    markerEnd: { type: MarkerType.ArrowClosed },
    data: { branch },
  };
  return { newNode, newEdge, nodeType, nextId };
}

function reconnectExistingBranch(
  args: CreateNodeFromActionArgs,
  sourceNode: WorkflowNodeModel,
  interceptedEdge: WorkflowEdgeModel,
  interceptedTargetNode: WorkflowNodeModel,
  built: ReturnType<typeof buildNewNode>,
) {
  const asRow = args.action.direction === 'bottom' && (sourceNode.type === 'if' || sourceNode.type === 'loop');
  const shiftedNodes = shiftNodesByIds(args.nodes, collectDescendantNodeIds(interceptedTargetNode.id, args.edges), asRow ? { x: OFFSETS.right.x, y: 0 } : args.action.direction === 'right' ? { x: OFFSETS.right.x, y: 0 } : { x: 0, y: OFFSETS.bottom.y });
  const bridgedEdge: WorkflowEdgeModel = {
    id: `edge-${built.nextId}-${interceptedTargetNode.id}`,
    source: built.nextId,
    target: interceptedTargetNode.id,
    sourceHandle: getDefaultSourceHandle(built.nodeType, asRow ? 'right' : args.action.direction),
    targetHandle: asRow ? getDefaultTargetHandle('right') : interceptedEdge.targetHandle ?? getDefaultTargetHandle(args.action.direction),
    type: 'workflow-edge',
    markerEnd: { type: MarkerType.ArrowClosed },
    data: { branch: asRow ? undefined : args.action.direction === 'right' && built.nodeType === 'if' ? 'false' : interceptedEdge.data?.branch },
  };
  const nextEdges = [...args.edges.filter((edge) => edge.id !== interceptedEdge.id), built.newEdge, bridgedEdge];
  return { nodes: rebalanceOperatorRightChains([...shiftedNodes, built.newNode], nextEdges), edges: nextEdges };
}

export function createNodeFromAction(args: CreateNodeFromActionArgs) {
  const sourceNode = args.nodes.find((node) => node.id === args.action.sourceNodeId);
  if (!sourceNode || !args.action.kind) return { nodes: args.nodes, edges: args.edges };
  const interceptedEdge = findOutgoingEdgeForAction(sourceNode.id, args.action, args.edges);
  const interceptedTargetNode = args.nodes.find((node) => node.id === interceptedEdge?.target);
  const built = buildNewNode(args, sourceNode, interceptedTargetNode);
  if (interceptedEdge && interceptedTargetNode) {
    return reconnectExistingBranch(args, sourceNode, interceptedEdge, interceptedTargetNode, built);
  }
  const nextEdges = [...args.edges, built.newEdge];
  return { nodes: rebalanceOperatorRightChains([...args.nodes, built.newNode], nextEdges), edges: nextEdges };
}
