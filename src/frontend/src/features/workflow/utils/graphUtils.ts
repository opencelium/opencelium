import type { WorkflowEdgeModel } from '../types/workflow.types';
export { createNodeFromAction } from './createNodeFromAction';
export { deleteNodeGraph } from './deleteNodeGraph';
export { getOperatorBottomBranch } from './graph.traversal';

export function isLeafNode(
  nodeId: string,
  edges: WorkflowEdgeModel[],
  handleId?: string,
): boolean {
  return !edges.some((edge) => {
    if (edge.source !== nodeId) return false;
    if (!handleId) return true;
    return edge.sourceHandle === handleId;
  });
}

export function getOutgoingCount(nodeId: string, edges: WorkflowEdgeModel[]): number {
  return edges.filter((edge) => edge.source === nodeId).length;
}
