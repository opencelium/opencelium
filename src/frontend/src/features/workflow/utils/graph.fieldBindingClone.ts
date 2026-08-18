import { createShortId } from '@shared/lib/createId';
import { buildWorkflowIndexes } from '../api/connectionPayload';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { collectReferenceColors, normalizeReferenceColor } from './graph.referenceColors';
import { compareWorkflowIndexes, isWorkflowReferenceVisible } from './graph.referenceVisibility';

const isMethodNode = (node: WorkflowNodeModel) =>
  node.type === 'connector' || node.type === 'system';

const cloneValue = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const replaceColor = (value: unknown, source?: string, next?: string): unknown =>
  typeof value === 'string' && source && next
    ? value.replace(new RegExp(source, 'gi'), next)
    : value;

export const cloneWorkflowFieldBindings = (
  fieldBindings: any[] | undefined,
  colorMap: Map<string, string>,
  clonedColorBySourceId: Map<string, string>,
  sourceNodes: WorkflowNodeModel[],
  allNodes: WorkflowNodeModel[],
  allEdges: WorkflowEdgeModel[],
) => {
  if (!Array.isArray(fieldBindings) || colorMap.size === 0) return fieldBindings;
  const sourceNodeIds = new Set(sourceNodes.map((node) => node.id));
  const indexes = buildWorkflowIndexes(allNodes, allEdges);
  const methodNodes = allNodes.filter(isMethodNode);
  const sourceMethodNodes = sourceNodes.filter(isMethodNode);

  const resolveProvider = (sourceColor: string, consumer?: WorkflowNodeModel) => {
    if (!consumer) return undefined;
    const consumerIndex = indexes.get(consumer.id);
    const candidates = methodNodes
      .filter((node) => normalizeReferenceColor(node.data.color) === sourceColor)
      .filter((node) => isWorkflowReferenceVisible(indexes.get(node.id), consumerIndex))
      .sort((left, right) => compareWorkflowIndexes(
        indexes.get(right.id) ?? '', indexes.get(left.id) ?? '',
      ));
    const sourceCandidate = candidates.find((node) => sourceNodeIds.has(node.id));
    if (sourceCandidate) return sourceCandidate;
    const externalCandidate = candidates[0];
    const title = externalCandidate?.data.subtitle || externalCandidate?.data.title;
    if (!title) return externalCandidate;
    return sourceMethodNodes
      .filter((node) => node.data.subtitle === title || node.data.title === title)
      .filter((node) => isWorkflowReferenceVisible(indexes.get(node.id), consumerIndex))
      .sort((left, right) => compareWorkflowIndexes(
        indexes.get(right.id) ?? '', indexes.get(left.id) ?? '',
      ))[0] ?? externalCandidate;
  };
  const resolveConsumer = (color: string) => sourceMethodNodes
    .find((node) => normalizeReferenceColor(node.data.color) === color);
  const sourceColorForArg = (binding: any, key: string, value: unknown) => {
    if (key === 'RESULT_VAR') {
      return [...collectReferenceColors(value)][0]
        ?? (Array.isArray(binding?.to) ? normalizeReferenceColor(binding.to[0]?.color) : '');
    }
    const match = key.match(/^VAR_(\d+)$/);
    if (match && Array.isArray(binding?.from)) {
      const color = normalizeReferenceColor(binding.from[Number(match[1])]?.color);
      if (color) return color;
    }
    return [...collectReferenceColors(value)][0];
  };
  const nextColorForArg = (
    binding: any,
    key: string,
    value: unknown,
    consumer?: WorkflowNodeModel,
  ) => {
    const sourceColor = sourceColorForArg(binding, key, value);
    if (!sourceColor) return undefined;
    if (key === 'RESULT_VAR') {
      return consumer ? clonedColorBySourceId.get(consumer.id) : colorMap.get(sourceColor);
    }
    const provider = resolveProvider(sourceColor, consumer);
    return provider && sourceNodeIds.has(provider.id)
      ? clonedColorBySourceId.get(provider.id) ?? colorMap.get(sourceColor)
      : undefined;
  };

  const copied = fieldBindings.filter((binding) => {
    const color = [...collectReferenceColors(binding?.enhancement?.args?.RESULT_VAR ?? '')][0]
      ?? (Array.isArray(binding?.to) ? normalizeReferenceColor(binding.to[0]?.color) : '');
    return !!resolveConsumer(color);
  }).map((binding) => {
    const next = cloneValue(binding);
    const resultColor = [...collectReferenceColors(next?.enhancement?.args?.RESULT_VAR ?? '')][0]
      ?? (Array.isArray(next?.to) ? normalizeReferenceColor(next.to[0]?.color) : '');
    const consumer = resolveConsumer(resultColor);
    if (next?.enhancement?.enhanceId) next.enhancement.enhanceId = createShortId('enh');
    if (next?.enhancement?.args && typeof next.enhancement.args === 'object') {
      next.enhancement.args = Object.fromEntries(Object.entries(next.enhancement.args)
        .map(([key, value]) => [key, replaceColor(
          value,
          sourceColorForArg(binding, key, value),
          nextColorForArg(binding, key, value, consumer),
        )]));
    }
    if (typeof next?.enhancement?.expertVar === 'string') {
      next.enhancement.expertVar = Object.entries(next.enhancement.args ?? {}).reduce(
        (expertVar, [key, value]) => replaceColor(
          expertVar,
          sourceColorForArg(binding, key, binding?.enhancement?.args?.[key]),
          [...collectReferenceColors(value)][0],
        ) as string,
        next.enhancement.expertVar,
      );
    }
    (['to', 'from'] as const).forEach((key) => {
      if (!Array.isArray(next?.[key])) return;
      next[key] = next[key].map((item: any) => {
        const color = colorMap.get(normalizeReferenceColor(item?.color));
        return color ? { ...item, color } : item;
      });
    });
    return next;
  });
  return copied.length ? [...fieldBindings, ...copied] : fieldBindings;
};
