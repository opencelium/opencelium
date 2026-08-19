import type { WorkflowNodeModel } from '../types/workflow.types';
import type { InvalidReference } from './graph.dragDrop.types';
import { removeConditionReferenceColors } from './graph.conditionReferenceCleanup';
import {
  collectReferenceColors,
  normalizeReferenceColor,
} from './graph.referenceColors';
import { removeNodeDataReferenceColors } from './graph.referenceCleanup';

const cloneValue = <T,>(value: T): T =>
  value === undefined ? value : JSON.parse(JSON.stringify(value));

export const cleanInvalidWorkflowReferences = (
  nodes: WorkflowNodeModel[],
  invalidReferences: InvalidReference[],
  fieldBindings?: any[],
) => {
  const invalidByNode = new Map<string, Set<string>>();
  invalidReferences.forEach((reference) => {
    invalidByNode.set(reference.consumerNodeId, new Set([
      ...(invalidByNode.get(reference.consumerNodeId) ?? []),
      reference.sourceColor,
    ]));
  });
  const invalidByConsumerColor = new Map<string, Set<string>>();
  nodes.forEach((node) => {
    const colors = invalidByNode.get(node.id);
    const consumerColor = normalizeReferenceColor(node.data.color);
    if (colors && consumerColor) invalidByConsumerColor.set(consumerColor, colors);
  });

  const cleanBinding = (binding: any) => {
    const resultColors = collectReferenceColors(binding?.enhancement?.args?.RESULT_VAR ?? '');
    const consumerColor = [...resultColors][0]
      ?? (Array.isArray(binding?.to) ? normalizeReferenceColor(binding.to[0]?.color) : '');
    const invalidColors = consumerColor ? invalidByConsumerColor.get(consumerColor) : undefined;
    if (!invalidColors) return binding;

    const next = cloneValue(binding);
    if (next?.enhancement?.args && typeof next.enhancement.args === 'object') {
      next.enhancement.args = Object.fromEntries(
        Object.entries(next.enhancement.args).filter(([key, value]) => {
          if (key === 'RESULT_VAR') return true;
          return ![...collectReferenceColors(value)]
            .some((color) => invalidColors.has(color));
        }),
      );
    }
    if (Array.isArray(next?.from)) {
      next.from = next.from
        .filter((item: any) => !invalidColors.has(normalizeReferenceColor(item?.color)));
    }
    if (typeof next?.enhancement?.expertVar === 'string') {
      next.enhancement.expertVar = next.enhancement.expertVar
        .split('\n')
        .filter((line: string) => ![...collectReferenceColors(line)]
          .some((color) => invalidColors.has(color)))
        .join('\n');
    }

    const sourceArgs = Object.entries(next?.enhancement?.args ?? {})
      .filter(([key]) => key !== 'RESULT_VAR');
    return sourceArgs.length > 0 || (Array.isArray(next?.from) && next.from.length > 0)
      ? next
      : null;
  };

  return {
    nodes: nodes.map((node) => {
      const colors = invalidByNode.get(node.id);
      if (!colors) return node;
      if (node.type === 'if' || node.type === 'loop') {
        return {
          ...node,
          data: {
            ...node.data,
            conditionConfig: removeConditionReferenceColors(node.data.conditionConfig, colors),
          },
        };
      }
      return { ...node, data: removeNodeDataReferenceColors(node.data, colors) };
    }),
    fieldBindings: Array.isArray(fieldBindings)
      ? fieldBindings.map(cleanBinding).filter(Boolean)
      : fieldBindings,
  };
};
