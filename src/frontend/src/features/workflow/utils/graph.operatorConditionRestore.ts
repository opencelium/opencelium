import type { WorkflowNodeModel } from '../types/workflow.types';

const cloneValue = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

export const restoreExternalOperatorConditions = (
  beforeNodes: WorkflowNodeModel[],
  afterNodes: WorkflowNodeModel[],
  movedNodeIds: Set<string>,
  skipNodeIds = new Set<string>(),
) => {
  const beforeById = new Map(beforeNodes.map((node) => [node.id, node]));

  return afterNodes.map((node) => {
    const isOperator = node.type === 'if' || node.type === 'loop';
    if (!isOperator || movedNodeIds.has(node.id) || skipNodeIds.has(node.id)) return node;
    const before = beforeById.get(node.id);
    if (!before?.data.conditionConfig) return node;
    return {
      ...node,
      data: {
        ...node.data,
        conditionConfig: cloneValue(before.data.conditionConfig),
      },
    };
  });
};
