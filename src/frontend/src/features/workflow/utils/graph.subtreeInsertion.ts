import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { OFFSETS } from './graph.constants';
import type { DropTarget } from './graph.dragDrop.types';
import {
  createWorkflowEdge,
  findOutgoingDropEdge,
  normalizeWorkflowPositions,
} from './graph.dragDropGeometry';
import { rebalanceOperatorRightChains, shiftNodesByIds } from './graph.layout';
import { collectDescendantNodeIds } from './graph.traversal';

const isOperatorNode = (node: WorkflowNodeModel) =>
  node.type === 'if' || node.type === 'loop';

export const insertWorkflowSubtree = (
  insertNodes: WorkflowNodeModel[],
  insertEdges: WorkflowEdgeModel[],
  target: DropTarget,
  nodes: WorkflowNodeModel[],
  edges: WorkflowEdgeModel[],
) => {
  const targetNode = nodes.find((node) => node.id === target.nodeId);
  const rootNode = insertNodes[0];
  if (!targetNode || !rootNode) return { nodes, edges };

  const interceptedEdge = findOutgoingDropEdge(targetNode.id, edges, target.direction);
  const interceptedTarget = nodes.find((node) => node.id === interceptedEdge?.target);
  const offset = target.direction === 'bottom' ? OFFSETS.bottom : OFFSETS.right;
  const shiftedInsertNodes = insertNodes.map((node) => ({
    ...node,
    position: {
      x: node.position.x - rootNode.position.x + targetNode.position.x + offset.x,
      y: node.position.y - rootNode.position.y + targetNode.position.y + offset.y,
    },
  }));
  const shiftedExistingNodes = interceptedTarget
    ? shiftNodesByIds(nodes, collectDescendantNodeIds(interceptedTarget.id, edges), {
        x: OFFSETS.right.x,
        y: 0,
      })
    : nodes;
  const nextRootNode = shiftedInsertNodes[0];
  const continuationSourceNode = isOperatorNode(nextRootNode)
    ? nextRootNode
    : shiftedInsertNodes[shiftedInsertNodes.length - 1];
  const nextEdges = edges.filter((item) => item.id !== interceptedEdge?.id);

  nextEdges.push(createWorkflowEdge(targetNode, nextRootNode, target.direction));
  nextEdges.push(...insertEdges);

  if (interceptedTarget && continuationSourceNode) {
    nextEdges.push(createWorkflowEdge(continuationSourceNode, interceptedTarget, 'right'));
  }

  const nextNodes = rebalanceOperatorRightChains(
    [...shiftedExistingNodes, ...shiftedInsertNodes],
    nextEdges,
  );
  const normalizedNodes = normalizeWorkflowPositions(nextNodes, nextEdges);

  return {
    nodes: rebalanceOperatorRightChains(normalizedNodes, nextEdges),
    edges: nextEdges,
  };
};
