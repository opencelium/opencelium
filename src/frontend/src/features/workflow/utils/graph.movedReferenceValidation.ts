import { buildWorkflowIndexes } from '../api/connectionPayload';
import { buildLegacyConnection } from '../components/request-editor/legacyAdapter';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import {
  collectNodeReferenceColors,
  collectReferenceColors,
  normalizeReferenceColor,
} from './graph.referenceColors';
import { isWorkflowReferenceVisible } from './graph.referenceVisibility';

const isReferenceConsumer = (node: WorkflowNodeModel) =>
  node.type === 'connector'
  || node.type === 'system'
  || node.type === 'if'
  || node.type === 'loop';

export const findInvalidReferencesToMovedProviders = (
  nodes: WorkflowNodeModel[],
  edges: WorkflowEdgeModel[],
  movedNodeIds: Set<string>,
  movedColors: Set<string>,
  fieldBindings?: any[],
  providerColorOverrides = new Map<string, string>(),
) => {
  const indexes = buildWorkflowIndexes(nodes, edges);
  const providerByColor = new Map<string, WorkflowNodeModel>();
  const nodeByColor = new Map<string, WorkflowNodeModel>();
  const fieldBindingRefsByConsumer = new Map<string, Set<string>>();

  nodes.filter((node) => node.type === 'connector' || node.type === 'system')
    .forEach((node) => {
      const color = normalizeReferenceColor(node.data.color);
      if (!color) return;
      providerByColor.set(color, node);
      nodeByColor.set(color, node);
    });
  buildLegacyConnection(nodes).fromConnector.method.forEach((method) => {
    const node = nodes.find((item) => item.id === method.id);
    if (!node) return;
    const color = normalizeReferenceColor(method.color);
    if (!color) return;
    providerByColor.set(color, node);
    nodeByColor.set(color, node);
  });

  if (Array.isArray(fieldBindings)) {
    fieldBindings.forEach((binding) => {
      const resultColors = collectReferenceColors(binding?.enhancement?.args?.RESULT_VAR ?? '');
      const consumer = nodeByColor.get([...resultColors][0] ?? '');
      if (!consumer) return;
      const sourceColors = collectReferenceColors(Object.fromEntries(
        Object.entries(binding?.enhancement?.args ?? {})
          .filter(([key]) => key !== 'RESULT_VAR'),
      ));
      if (sourceColors.size === 0) return;
      fieldBindingRefsByConsumer.set(consumer.id, new Set([
        ...(fieldBindingRefsByConsumer.get(consumer.id) ?? []),
        ...sourceColors,
      ]));
    });
  }

  return nodes.flatMap((node) => {
    if (movedNodeIds.has(node.id) || !isReferenceConsumer(node)) return [];
    const refs = new Set([
      ...collectNodeReferenceColors(node.data),
      ...(fieldBindingRefsByConsumer.get(node.id) ?? []),
    ]);
    return [...refs]
      .filter((sourceColor) => movedColors.has(sourceColor))
      .flatMap((sourceColor) => {
        const provider = providerByColor.get(providerColorOverrides.get(sourceColor) ?? sourceColor);
        const providerIndex = provider ? indexes.get(provider.id) : undefined;
        return provider && providerIndex
          && isWorkflowReferenceVisible(providerIndex, indexes.get(node.id))
          ? []
          : [{ consumerNodeId: node.id, sourceColor }];
      });
  });
};
