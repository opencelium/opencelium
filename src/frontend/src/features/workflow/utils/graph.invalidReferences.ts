import { buildWorkflowIndexes } from '../api/connectionPayload';
import { buildLegacyConnection } from '../components/request-editor/legacyAdapter';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import type { InvalidReference } from './graph.dragDrop.types';
import {
  collectNodeReferenceColors,
  collectReferenceColors,
  normalizeReferenceColor,
} from './graph.referenceColors';
import { collectWorkflowJumpLinks, isWorkflowReferenceVisible } from './graph.referenceVisibility';

// A webhook step carries a request config of its own (buildLegacyMethod treats
// 'trigger-connection' as an HTTP request), so it consumes references like any
// other method. Leaving it out meant its references were never validated: they
// survived a delete, a joint removal and a drop alike.
const isMethodNode = (node: WorkflowNodeModel) =>
  node.type === 'connector' || node.type === 'system'
  || node.type === 'trigger-connection';

const isOperatorNode = (node: WorkflowNodeModel) =>
  node.type === 'if' || node.type === 'loop';

/** Every colour some method on the graph still answers for. A reference naming a
 *  colour outside this set has no provider at all, which is a different failure
 *  from a provider that is merely out of scope. */
export const collectProviderColors = (nodes: WorkflowNodeModel[]) => {
  const colors = new Set(nodes.filter(isMethodNode)
    .map((node) => normalizeReferenceColor(node.data.color))
    .filter(Boolean));
  buildLegacyConnection(nodes).fromConnector.method.forEach((method) => {
    if (!nodes.some((item) => item.id === method.id)) return;
    const color = normalizeReferenceColor(method.color);
    if (color) colors.add(color);
  });
  return colors;
};

export const findInvalidWorkflowReferences = (
  nodes: WorkflowNodeModel[],
  edges: WorkflowEdgeModel[],
  consumerNodeIds?: Set<string>,
  fieldBindings?: any[],
  providerColorOverrides = new Map<string, string>(),
  preservedSourceColors = new Set<string>(),
): InvalidReference[] => {
  const indexes = buildWorkflowIndexes(nodes, edges);
  const jumps = collectWorkflowJumpLinks(nodes, indexes);
  const providerByColor = new Map<string, WorkflowNodeModel>();
  const nodeByColor = new Map<string, WorkflowNodeModel>();
  const fieldBindingRefsByConsumer = new Map<string, Set<string>>();

  nodes.filter(isMethodNode).forEach((node) => {
    const color = normalizeReferenceColor(node.data.color);
    providerByColor.set(color, node);
    nodeByColor.set(color, node);
  });
  buildLegacyConnection(nodes).fromConnector.method.forEach((method) => {
    const node = nodes.find((item) => item.id === method.id);
    if (!node) return;
    const color = normalizeReferenceColor(method.color);
    providerByColor.set(color, node);
    nodeByColor.set(color, node);
  });

  if (Array.isArray(fieldBindings)) {
    fieldBindings.forEach((binding) => {
      const resultColors = collectReferenceColors(binding?.enhancement?.args?.RESULT_VAR ?? '');
      const consumerColor = [...resultColors][0];
      const consumer = consumerColor ? nodeByColor.get(consumerColor) : undefined;
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

  const isReferenceValid = (
    provider: WorkflowNodeModel | undefined,
    consumer: WorkflowNodeModel,
  ) => {
    if (!provider || provider.id === consumer.id) return false;
    return isWorkflowReferenceVisible(indexes.get(provider.id), indexes.get(consumer.id), jumps);
  };

  return nodes.flatMap((node) => {
    if (!isMethodNode(node) && !isOperatorNode(node)) return [];
    if (consumerNodeIds && !consumerNodeIds.has(node.id)) return [];
    const refs = new Set([
      ...collectNodeReferenceColors(node.data),
      ...(fieldBindingRefsByConsumer.get(node.id) ?? []),
    ]);
    return [...refs].flatMap((sourceColor) => {
      if (preservedSourceColors.has(sourceColor)) return [];
      const provider = providerByColor.get(providerColorOverrides.get(sourceColor) ?? sourceColor);
      return isReferenceValid(provider, node)
        ? []
        : [{ consumerNodeId: node.id, sourceColor }];
    });
  });
};
