import type {
  WorkflowEdgeModel,
  WorkflowNodeModel,
} from '../types/workflow.types';
import { getBottomSourceHandle } from './graph.handles';

export function collectDescendantNodeIds(
  startNodeId: string,
  edges: WorkflowEdgeModel[],
): Set<string> {
  const visited = new Set<string>();
  const stack = [startNodeId];

  while (stack.length > 0) {
    const currentNodeId = stack.pop();
    if (!currentNodeId || visited.has(currentNodeId)) continue;
    visited.add(currentNodeId);
    edges.forEach((edge) => {
      if (edge.source === currentNodeId && !visited.has(edge.target)) {
        stack.push(edge.target);
      }
    });
  }

  return visited;
}

function collectDescendantEdgeIds(
  nodeIds: Set<string>,
  edges: WorkflowEdgeModel[],
): Set<string> {
  const edgeIds = new Set<string>();
  edges.forEach((edge) => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) edgeIds.add(edge.id);
  });
  return edgeIds;
}

export function getOperatorBottomBranch(
  nodeId: string,
  nodes: WorkflowNodeModel[],
  edges: WorkflowEdgeModel[],
): { nodeIds: Set<string>; edgeIds: Set<string> } {
  const operatorNode = nodes.find((node) => node.id === nodeId);
  if (!operatorNode || (operatorNode.type !== 'if' && operatorNode.type !== 'loop')) {
    return { nodeIds: new Set<string>(), edgeIds: new Set<string>() };
  }

  const rootEdge = edges.find(
    (edge) =>
      edge.source === nodeId &&
      edge.sourceHandle === getBottomSourceHandle(operatorNode.type),
  );
  if (!rootEdge) return { nodeIds: new Set<string>(), edgeIds: new Set<string>() };

  const nodeIds = collectDescendantNodeIds(rootEdge.target, edges);
  const edgeIds = collectDescendantEdgeIds(nodeIds, edges);
  edgeIds.add(rootEdge.id);
  return { nodeIds, edgeIds };
}
