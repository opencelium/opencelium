import type {
  WorkflowEdgeModel,
  WorkflowNodeModel,
} from '../types/workflow.types';
import { COLLISION_LIMITS, FREE_POSITION_STEP, OFFSETS } from './graph.constants';
import { getRightSourceHandle } from './graph.handles';
import {
  collectDescendantNodeIds,
  getOperatorBottomBranch,
} from './graph.traversal';

export type PositionShift = { x: number; y: number };

export function shiftNodesByIds(
  nodes: WorkflowNodeModel[],
  nodeIds: Set<string>,
  shift: PositionShift,
): WorkflowNodeModel[] {
  return nodes.map((node) =>
    nodeIds.has(node.id)
      ? { ...node, position: { x: node.position.x + shift.x, y: node.position.y + shift.y } }
      : node,
  );
}

export function findFreePosition(
  nodes: WorkflowNodeModel[],
  startX: number,
  startY: number,
  direction: 'right' | 'bottom',
): { x: number; y: number } {
  let x = startX;
  let y = startY;
  for (let i = 0; i < 10; i += 1) {
    const hasCloseNode = nodes.some((node) => {
      const dx = Math.abs(node.position.x - x);
      const dy = Math.abs(node.position.y - y);
      return dx < COLLISION_LIMITS.x && dy < COLLISION_LIMITS.y;
    });
    if (!hasCloseNode) return { x, y };
    x += FREE_POSITION_STEP[direction].x;
    y += FREE_POSITION_STEP[direction].y;
  }
  return { x, y };
}

export function getBranchMaxX(
  nodeId: string,
  nodes: WorkflowNodeModel[],
  edges: WorkflowEdgeModel[],
): number {
  const operatorNode = nodes.find((node) => node.id === nodeId);
  if (!operatorNode || (operatorNode.type !== 'if' && operatorNode.type !== 'loop')) {
    return operatorNode?.position.x ?? 0;
  }
  let maxX = operatorNode.position.x;
  getOperatorBottomBranch(nodeId, nodes, edges).nodeIds.forEach((branchNodeId) => {
    const branchNode = nodes.find((node) => node.id === branchNodeId);
    if (branchNode) maxX = Math.max(maxX, branchNode.position.x);
  });
  return maxX;
}

function shiftOperatorRightChainIfNeeded(
  operatorNode: WorkflowNodeModel,
  nodes: WorkflowNodeModel[],
  edges: WorkflowEdgeModel[],
): WorkflowNodeModel[] {
  if (operatorNode.type !== 'if' && operatorNode.type !== 'loop') return nodes;
  const rightEdge = edges.find(
    (edge) => edge.source === operatorNode.id && edge.sourceHandle === getRightSourceHandle(operatorNode.type),
  );
  const rightTargetNode = nodes.find((node) => node.id === rightEdge?.target);
  if (!rightEdge || !rightTargetNode) return nodes;
  const bottomBranch = getOperatorBottomBranch(operatorNode.id, nodes, edges);
  const requiredX = bottomBranch.nodeIds.size > 0
    ? getBranchMaxX(operatorNode.id, nodes, edges) + OFFSETS.right.x
    : operatorNode.position.x + OFFSETS.right.x;
  const shiftX = requiredX - rightTargetNode.position.x;
  if (shiftX <= 0) return nodes;
  return shiftNodesByIds(nodes, collectDescendantNodeIds(rightTargetNode.id, edges), { x: shiftX, y: 0 });
}

export function rebalanceOperatorRightChains(
  nodes: WorkflowNodeModel[],
  edges: WorkflowEdgeModel[],
): WorkflowNodeModel[] {
  let currentNodes = nodes;
  for (let i = 0; i < nodes.length; i += 1) {
    const nextNodes = currentNodes.reduce((acc, node) => shiftOperatorRightChainIfNeeded(node, acc, edges), currentNodes);
    const hasChanges = nextNodes.some((node, index) =>
      currentNodes[index].position.x !== node.position.x ||
      currentNodes[index].position.y !== node.position.y,
    );
    currentNodes = nextNodes;
    if (!hasChanges) break;
  }
  return currentNodes;
}
