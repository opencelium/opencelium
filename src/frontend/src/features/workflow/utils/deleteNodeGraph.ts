import { MarkerType } from '@xyflow/react';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { collectDescendantNodeIds, getOperatorBottomBranch } from './graph.traversal';

function getEdgeShift(
  deletedNode: WorkflowNodeModel,
  targetNode: WorkflowNodeModel,
  outgoingEdge: WorkflowEdgeModel,
) {
  const isVertical = outgoingEdge.targetHandle === 'top' || outgoingEdge.sourceHandle === 'bottom';
  return isVertical
    ? { x: 0, y: deletedNode.position.y - targetNode.position.y }
    : { x: deletedNode.position.x - targetNode.position.x, y: 0 };
}

export function deleteNodeGraph(
  nodeId: string,
  nodes: WorkflowNodeModel[],
  edges: WorkflowEdgeModel[],
): { nodes: WorkflowNodeModel[]; edges: WorkflowEdgeModel[] } {
  const operatorBranch = getOperatorBottomBranch(nodeId, nodes, edges);
  if (operatorBranch.nodeIds.size > 0) {
    const branchResult = [...operatorBranch.nodeIds].reduce(
      (acc, branchNodeId) => deleteNodeGraph(branchNodeId, acc.nodes, acc.edges),
      { nodes, edges },
    );

    return deleteNodeGraph(nodeId, branchResult.nodes, branchResult.edges);
  }

  const deletedNode = nodes.find((node) => node.id === nodeId);
  if (!deletedNode) return { nodes, edges };
  const incomingEdges = edges.filter((edge) => edge.target === nodeId);
  const outgoingEdges = edges.filter((edge) => edge.source === nodeId);
  const filteredEdges = edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId);
  const nextNodes = nodes.filter((node) => node.id !== nodeId).map((node) => {
    const outgoingEdge = outgoingEdges.find((edge) => collectDescendantNodeIds(edge.target, filteredEdges).has(node.id));
    const targetNode = outgoingEdge && nodes.find((item) => item.id === outgoingEdge.target);
    if (!outgoingEdge || !targetNode) return node;
    const shift = getEdgeShift(deletedNode, targetNode, outgoingEdge);
    return { ...node, position: { x: node.position.x + shift.x, y: node.position.y + shift.y } };
  });

  const reconnectedEdges = incomingEdges.flatMap((incomingEdge) =>
    outgoingEdges.flatMap((outgoingEdge) => {
      const duplicate = filteredEdges.some((edge) =>
        edge.source === incomingEdge.source &&
        edge.target === outgoingEdge.target &&
        edge.sourceHandle === incomingEdge.sourceHandle &&
        edge.targetHandle === outgoingEdge.targetHandle,
      );
      if (duplicate || incomingEdge.source === outgoingEdge.target) return [];
      return [{
        id: `edge-${incomingEdge.source}-${outgoingEdge.target}-${incomingEdge.sourceHandle ?? 'default'}-${outgoingEdge.targetHandle ?? 'default'}`,
        source: incomingEdge.source,
        target: outgoingEdge.target,
        sourceHandle: incomingEdge.sourceHandle,
        targetHandle: outgoingEdge.targetHandle,
        type: 'workflow-edge' as const,
        markerEnd: { type: MarkerType.ArrowClosed },
        data: { branch: incomingEdge.data?.branch },
      }];
    }),
  );

  return { nodes: nextNodes, edges: [...filteredEdges, ...reconnectedEdges] };
}
