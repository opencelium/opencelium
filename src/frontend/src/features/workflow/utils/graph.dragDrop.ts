import { MarkerType } from '@xyflow/react';
import { createShortId } from '@shared/lib/createId';
import { ALL_COLORS } from '../constants/colors';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { buildWorkflowIndexes } from '../api/connectionPayload';
import { buildLegacyConnection } from '../components/request-editor/legacyAdapter';
import { buildConditionConfig } from '../components/condition-builder/conditionBuilder.utils';
import type { ConditionChild, ConditionGroup } from '../components/condition-builder/conditionBuilder.types';
import { collectDescendantNodeIds, getOperatorBottomBranch } from './graph.traversal';
import { getBottomSourceHandle, getDefaultSourceHandle, getDefaultTargetHandle, getRightSourceHandle } from './graph.handles';
import { OFFSETS } from './graph.constants';
import { rebalanceOperatorRightChains, shiftNodesByIds } from './graph.layout';
import { deleteNodeGraph } from './deleteNodeGraph';

export type WorkflowDropMode = 'move' | 'copy';

export type WorkflowDropResult = {
  nodes: WorkflowNodeModel[];
  edges: WorkflowEdgeModel[];
  fieldBindings?: any[];
  invalidReferences: InvalidReference[];
};

export type InvalidReference = {
  consumerNodeId: string;
  sourceColor: string;
};

type DropTarget = {
  nodeId: string;
  direction: 'right' | 'bottom';
};

const REFERENCE_COLOR_RE = /#[A-Fa-f0-9]{6}\.\((?:request|response)\)/g;
const ENDPOINT_ARG_TOKEN_RE = /#\{%\s*([A-Za-z0-9_-]+)\s*%}/g;

const isMethodNode = (node: WorkflowNodeModel) =>
  node.type === 'connector' || node.type === 'system';

const isOperatorNode = (node: WorkflowNodeModel) =>
  node.type === 'if' || node.type === 'loop';

const cloneValue = <T,>(value: T): T =>
  value === undefined ? value : JSON.parse(JSON.stringify(value));

const normalizeColor = (color?: string) =>
  color?.startsWith('#') ? color.toLowerCase() : color ? `#${color}`.toLowerCase() : '';

const parseIndex = (value: string) =>
  value.split('_').map((part) => Number(part)).map((part) => (Number.isFinite(part) ? part : 0));

const compareIndex = (left: string, right: string) => {
  const leftPath = parseIndex(left);
  const rightPath = parseIndex(right);
  const length = Math.max(leftPath.length, rightPath.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = leftPath[index] ?? -1;
    const rightPart = rightPath[index] ?? -1;
    if (leftPart !== rightPart) return leftPart - rightPart;
  }

  return leftPath.length - rightPath.length;
};

const isSamePath = (left: number[], right: number[]) =>
  left.length === right.length && left.every((part, index) => part === right[index]);

const isPathPrefix = (prefix: number[], path: number[]) =>
  prefix.length < path.length && prefix.every((part, index) => part === path[index]);

const isReferenceVisible = (providerIndex?: string, consumerIndex?: string) => {
  if (!providerIndex || !consumerIndex) return false;
  if (compareIndex(providerIndex, consumerIndex) >= 0) return false;

  const providerPath = parseIndex(providerIndex);
  const consumerPath = parseIndex(consumerIndex);

  if (isPathPrefix(providerPath, consumerPath)) return true;

  for (let level = consumerPath.length - 1; level >= 0; level -= 1) {
    const parentPath = consumerPath.slice(0, level);
    const consumerSegment = consumerPath[level];
    if (providerPath.length !== level + 1) continue;
    if (!isSamePath(providerPath.slice(0, level), parentPath)) continue;
    if ((providerPath[level] ?? -1) < consumerSegment) return true;
  }

  return false;
};

const collectReferenceColors = (value: unknown): Set<string> => {
  const colors = new Set<string>();
  const visit = (next: unknown) => {
    if (typeof next === 'string') {
      next.match(REFERENCE_COLOR_RE)?.forEach((reference) => {
        colors.add(normalizeColor(reference.split('.')[0]));
      });
      return;
    }
    if (Array.isArray(next)) {
      next.forEach(visit);
      return;
    }
    if (next && typeof next === 'object') {
      Object.values(next as Record<string, unknown>).forEach(visit);
    }
  };
  visit(value);
  return colors;
};

const collectNodeReferenceColors = (value: unknown): Set<string> => {
  const colors = new Set<string>();
  const visit = (next: unknown) => {
    if (typeof next === 'string') {
      next.match(REFERENCE_COLOR_RE)?.forEach((reference) => {
        colors.add(normalizeColor(reference.split('.')[0]));
      });
      return;
    }
    if (Array.isArray(next)) {
      next.forEach(visit);
      return;
    }
    if (next && typeof next === 'object') {
      Object.entries(next as Record<string, unknown>).forEach(([key, nested]) => {
        if (key === 'enhancement') return;
        visit(nested);
      });
    }
  };
  visit(value);
  return colors;
};

const referenceKey = (ref: InvalidReference) => `${ref.consumerNodeId}:${ref.sourceColor}`;

const uniqueReferences = (refs: InvalidReference[]) => {
  const seen = new Set<string>();
  return refs.filter((ref) => {
    const key = referenceKey(ref);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const replaceColors = (value: unknown, colorMap: Map<string, string>): unknown => {
  if (typeof value === 'string') {
    let result = value;
    colorMap.forEach((nextColor, prevColor) => {
      result = result.replace(new RegExp(prevColor, 'gi'), nextColor);
    });
    return result;
  }
  if (Array.isArray(value)) return value.map((item) => replaceColors(item, colorMap));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        replaceColors(nested, colorMap),
      ]),
    );
  }
  return value;
};

const removeColors = (value: unknown, colors: Set<string>): unknown => {
  if (typeof value === 'string') {
    return value
      .split(';')
      .map((part) => part.trim())
      .filter((part) => {
        const refs = collectReferenceColors(part);
        return refs.size === 0 || ![...refs].some((color) => colors.has(color));
      })
      .join(';');
  }
  if (Array.isArray(value)) return value.map((item) => removeColors(item, colors));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
        key,
        removeColors(nested, colors),
      ]),
    );
  }
  return value;
};

const endpointArgIdsForColors = (
  methodConfig: unknown,
  colors: Set<string>,
) => {
  if (!methodConfig || typeof methodConfig !== 'object') return new Set<string>();
  const endpointArgs = (methodConfig as Record<string, any>).endpointArgs;
  if (!endpointArgs || typeof endpointArgs !== 'object') return new Set<string>();
  return new Set(
    Object.entries(endpointArgs)
      .filter(([, arg]: [string, any]) =>
        [...collectReferenceColors(arg?.source)].some((color) => colors.has(color)),
      )
      .map(([id]) => id),
  );
};

const removeEndpointArgTokens = (value: string, argIds: Set<string>) =>
  value.replace(ENDPOINT_ARG_TOKEN_RE, (token, argId: string) => (argIds.has(argId) ? '' : token));

const removeEndpointArgReferences = (
  methodConfig: unknown,
  colors: Set<string>,
  sourceMethodConfig = methodConfig,
) => {
  const argIds = endpointArgIdsForColors(sourceMethodConfig, colors);
  if (!methodConfig || typeof methodConfig !== 'object') return methodConfig;
  const config = methodConfig as Record<string, any>;
  const cleanedConfig = removeColors(config, colors) as Record<string, any>;
  if (argIds.size === 0) return cleanedConfig;
  return {
    ...cleanedConfig,
    url: typeof config.url === 'string' ? removeEndpointArgTokens(config.url, argIds) : config.url,
    queryParams: Array.isArray(config.queryParams)
      ? config.queryParams
        .map((param: any) => ({
          ...param,
          key: typeof param?.key === 'string' ? removeEndpointArgTokens(param.key, argIds) : param?.key,
          value: typeof param?.value === 'string' ? removeEndpointArgTokens(param.value, argIds) : param?.value,
        }))
      : config.queryParams,
    endpointArgs: Object.fromEntries(
      Object.entries(cleanedConfig.endpointArgs ?? {}).filter(([id]) => !argIds.has(id)),
    ),
  };
};

const removeNodeDataColors = (
  data: WorkflowNodeModel['data'],
  colors: Set<string>,
): WorkflowNodeModel['data'] => {
  const { methodConfig, ...restData } = data;
  const cleaned = removeColors(restData, colors) as Omit<WorkflowNodeModel['data'], 'methodConfig'>;
  if (!methodConfig) return cleaned as WorkflowNodeModel['data'];
  return {
    ...cleaned,
    methodConfig: removeEndpointArgReferences(methodConfig, colors, methodConfig) as WorkflowNodeModel['data']['methodConfig'],
  };
};

const removeConditionRulesWithColors = (
  group: ConditionGroup,
  colors: Set<string>,
): ConditionGroup => ({
  ...group,
  items: (group.items ?? [])
    .flatMap<ConditionChild>((item) => {
      if (item.type === 'rule') {
        const refs = collectReferenceColors({
          leftField: item.properties?.leftField,
          rightField: item.properties?.rightField,
        });
        return [...refs].some((color) => colors.has(color)) ? [] : [item];
      }
      const nested = removeConditionRulesWithColors(item, colors);
      return (nested.items ?? []).length > 0 ? [nested] : [];
    }),
});

const removeConditionConfigColors = (
  conditionConfig: WorkflowNodeModel['data']['conditionConfig'],
  colors: Set<string>,
) => {
  if (!conditionConfig?.tree) return conditionConfig;
  const cleanedTree = removeConditionRulesWithColors(conditionConfig.tree, colors);
  const tree = conditionConfig.operatorType === 'loop' && (cleanedTree.items ?? []).length === 0
    ? {
      ...cleanedTree,
      items: [{
        id: createShortId('rule'),
        type: 'rule' as const,
      }],
    }
    : cleanedTree;
  return buildConditionConfig(conditionConfig.operatorType, tree, conditionConfig.iterator);
};

const usedMethodColors = (nodes: WorkflowNodeModel[]) =>
  new Set(
    nodes
      .filter(isMethodNode)
      .map((node) => normalizeColor(node.data.color))
      .filter(Boolean),
  );

const nextFreeColor = (used: Set<string>) => {
  const found = ALL_COLORS.find((color) => !used.has(normalizeColor(color)));
  const color = found ?? `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
  used.add(normalizeColor(color));
  return color;
};

const findOutgoingEdge = (
  nodeId: string,
  edges: WorkflowEdgeModel[],
  direction: 'right' | 'bottom',
) => {
  const targetHandle = getDefaultTargetHandle(direction);
  return edges.find((edge) =>
    edge.source === nodeId &&
    (direction === 'bottom'
      ? edge.targetHandle === targetHandle || edge.sourceHandle === 'true' || edge.sourceHandle === 'bottom'
      : edge.targetHandle === targetHandle || edge.sourceHandle === 'false' || edge.sourceHandle === 'right' || !edge.sourceHandle),
  );
};

const edge = (
  source: WorkflowNodeModel,
  target: WorkflowNodeModel,
  direction: 'right' | 'bottom',
): WorkflowEdgeModel => {
  const sourceHandle = getDefaultSourceHandle(source.type, direction);
  return {
    id: `edge-${source.id}-${target.id}-${sourceHandle ?? 'default'}-${getDefaultTargetHandle(direction)}`,
    source: source.id,
    target: target.id,
    sourceHandle,
    targetHandle: getDefaultTargetHandle(direction),
    type: 'workflow-edge',
    markerEnd: { type: MarkerType.ArrowClosed },
    data: source.type === 'if' && sourceHandle === 'true'
      ? { branch: 'true' }
      : source.type === 'if' && sourceHandle === 'false'
        ? { branch: 'false' }
        : undefined,
  };
};

const findDirectionalEdge = (
  source: WorkflowNodeModel,
  edges: WorkflowEdgeModel[],
  direction: 'right' | 'bottom',
) => {
  const sourceHandle = direction === 'bottom'
    ? getBottomSourceHandle(source.type) ?? 'bottom'
    : getRightSourceHandle(source.type);
  const targetHandle = getDefaultTargetHandle(direction);

  return edges.find((item) => {
    if (item.source !== source.id) return false;
    if (item.targetHandle === targetHandle) {
      if (sourceHandle === undefined) {
        return item.sourceHandle === undefined || item.sourceHandle === 'right';
      }
      return item.sourceHandle === sourceHandle;
    }
    return false;
  });
};

const normalizeWorkflowPositions = (
  nodes: WorkflowNodeModel[],
  edges: WorkflowEdgeModel[],
) => {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const startNode = nodes.find((node) => node.type === 'start') ?? nodes[0];
  if (!startNode) return nodes;

  const positions = new Map<string, { x: number; y: number }>();
  const visited = new Set<string>();

  const layoutFrom = (nodeId: string, position: { x: number; y: number }): number => {
    const node = nodeById.get(nodeId);
    if (!node) return position.x;
    if (visited.has(nodeId)) return positions.get(nodeId)?.x ?? position.x;
    visited.add(nodeId);
    positions.set(nodeId, position);

    let maxX = position.x;
    const bottomEdge = findDirectionalEdge(node, edges, 'bottom');
    if (bottomEdge) {
      maxX = Math.max(
        maxX,
        layoutFrom(bottomEdge.target, {
          x: position.x + OFFSETS.bottom.x,
          y: position.y + OFFSETS.bottom.y,
        }),
      );
    }

    const rightEdge = findDirectionalEdge(node, edges, 'right');
    if (rightEdge) {
      maxX = Math.max(
        maxX,
        layoutFrom(rightEdge.target, {
          x: Math.max(position.x + OFFSETS.right.x, maxX + OFFSETS.right.x),
          y: position.y + OFFSETS.right.y,
        }),
      );
    }

    return maxX;
  };

  layoutFrom(startNode.id, startNode.position);

  return nodes.map((node) => ({
    ...node,
    position: positions.get(node.id) ?? node.position,
  }));
};

const insertSubtree = (
  insertNodes: WorkflowNodeModel[],
  insertEdges: WorkflowEdgeModel[],
  target: DropTarget,
  nodes: WorkflowNodeModel[],
  edges: WorkflowEdgeModel[],
) => {
  const targetNode = nodes.find((node) => node.id === target.nodeId);
  const rootNode = insertNodes[0];
  if (!targetNode || !rootNode) return { nodes, edges };

  const interceptedEdge = findOutgoingEdge(targetNode.id, edges, target.direction);
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
    ? shiftNodesByIds(nodes, collectDescendantNodeIds(interceptedTarget.id, edges), target.direction === 'bottom' ? { x: OFFSETS.right.x, y: 0 } : { x: OFFSETS.right.x, y: 0 })
    : nodes;
  const nextRootNode = shiftedInsertNodes[0];
  const continuationSourceNode = isOperatorNode(nextRootNode)
    ? nextRootNode
    : shiftedInsertNodes[shiftedInsertNodes.length - 1];
  const nextEdges = edges.filter((item) => item.id !== interceptedEdge?.id);

  nextEdges.push(edge(targetNode, nextRootNode, target.direction));
  nextEdges.push(...insertEdges);

  if (interceptedTarget && continuationSourceNode) {
    nextEdges.push(edge(continuationSourceNode, interceptedTarget, 'right'));
  }

  const nextNodes = rebalanceOperatorRightChains([...shiftedExistingNodes, ...shiftedInsertNodes], nextEdges);
  const normalizedNodes = normalizeWorkflowPositions(nextNodes, nextEdges);

  return {
    nodes: rebalanceOperatorRightChains(normalizedNodes, nextEdges),
    edges: nextEdges,
  };
};

const subtreeForNode = (
  sourceId: string,
  nodes: WorkflowNodeModel[],
  edges: WorkflowEdgeModel[],
) => {
  const source = nodes.find((node) => node.id === sourceId);
  if (!source) return { nodes: [], edges: [] };
  if (source.type === 'if' || source.type === 'loop') {
    const bottomBranch = getOperatorBottomBranch(sourceId, nodes, edges);
    const nodeIds = new Set([sourceId, ...bottomBranch.nodeIds]);
    return {
      nodes: nodes.filter((node) => nodeIds.has(node.id)),
      edges: edges.filter((item) => bottomBranch.edgeIds.has(item.id)),
    };
  }

  const nodeIds = new Set([sourceId]);
  return {
    nodes: nodes.filter((node) => nodeIds.has(node.id)),
    edges: edges.filter((item) => nodeIds.has(item.source) && nodeIds.has(item.target)),
  };
};

const cloneSubtree = (
  sourceNodes: WorkflowNodeModel[],
  sourceEdges: WorkflowEdgeModel[],
  allNodes: WorkflowNodeModel[],
  allEdges: WorkflowEdgeModel[],
) => {
  const idMap = new Map<string, string>();
  const colorMap = new Map<string, string>();
  const clonedColorBySourceId = new Map<string, string>();
  const usedColors = usedMethodColors(allNodes);
  const sourceNodeIds = new Set(sourceNodes.map((node) => node.id));
  const sourceMethodNodes = sourceNodes.filter(isMethodNode);
  const methodNodes = allNodes.filter(isMethodNode);
  const indexes = buildWorkflowIndexes(allNodes, allEdges);

  sourceNodes.forEach((node) => {
    idMap.set(node.id, createShortId(node.type));
    if (isMethodNode(node)) {
      const nextColor = nextFreeColor(usedColors);
      colorMap.set(normalizeColor(node.data.color), nextColor);
      clonedColorBySourceId.set(node.id, nextColor);
    }
  });

  const resolveSourceProvider = (sourceColor: string, consumer: WorkflowNodeModel) => {
    const consumerIndex = indexes.get(consumer.id);
    const candidates = methodNodes
      .filter((node) => normalizeColor(node.data.color) === sourceColor)
      .filter((node) => isReferenceVisible(indexes.get(node.id), consumerIndex))
      .sort((left, right) => compareIndex(indexes.get(right.id) ?? '', indexes.get(left.id) ?? ''));
    const sourceCandidate = candidates.find((node) => sourceNodeIds.has(node.id));
    if (sourceCandidate) return sourceCandidate;

    const externalCandidate = candidates[0];
    const externalTitle = externalCandidate?.data.subtitle || externalCandidate?.data.title;
    if (!externalTitle) return externalCandidate;

    return sourceMethodNodes
      .filter((node) => node.data.subtitle === externalTitle || node.data.title === externalTitle)
      .filter((node) => isReferenceVisible(indexes.get(node.id), consumerIndex))
      .sort((left, right) => compareIndex(indexes.get(right.id) ?? '', indexes.get(left.id) ?? ''))[0]
      ?? externalCandidate;
  };

  const replaceNodeReferenceColors = (value: unknown, consumer: WorkflowNodeModel): unknown => {
    if (typeof value === 'string') {
      let result = value;
      collectReferenceColors(value).forEach((sourceColor) => {
        const provider = resolveSourceProvider(sourceColor, consumer);
        const nextColor = provider && sourceNodeIds.has(provider.id)
          ? clonedColorBySourceId.get(provider.id)
          : undefined;
        if (nextColor) {
          result = result.replace(new RegExp(sourceColor, 'gi'), nextColor);
        }
      });
      return result;
    }
    if (Array.isArray(value)) return value.map((item) => replaceNodeReferenceColors(item, consumer));
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, nested]) => [
          key,
          replaceNodeReferenceColors(nested, consumer),
        ]),
      );
    }
    return value;
  };

  const nodes = sourceNodes.map((node) => ({
    ...node,
    id: idMap.get(node.id) ?? node.id,
    selected: false,
    data: replaceNodeReferenceColors(cloneValue({
      ...node.data,
      color: isMethodNode(node) ? clonedColorBySourceId.get(node.id) : node.data.color,
    }), node) as WorkflowNodeModel['data'],
  }));

  const edges = sourceEdges.map((item) => ({
    ...item,
    id: `edge-${idMap.get(item.source)}-${idMap.get(item.target)}-${item.sourceHandle ?? 'default'}-${item.targetHandle ?? 'default'}`,
    source: idMap.get(item.source) ?? item.source,
    target: idMap.get(item.target) ?? item.target,
    selected: false,
  }));

  return { nodes, edges, colorMap, idMap, clonedColorBySourceId };
};

const invalidReferencesForGraph = (
  nodes: WorkflowNodeModel[],
  edges: WorkflowEdgeModel[],
  consumerNodeIds?: Set<string>,
  fieldBindings?: any[],
  providerColorOverrides = new Map<string, string>(),
  preservedSourceColors = new Set<string>(),
): InvalidReference[] => {
  const indexes = buildWorkflowIndexes(nodes, edges);
  const providerByColor = new Map<string, WorkflowNodeModel>();
  const nodeByColor = new Map<string, WorkflowNodeModel>();
  const fieldBindingRefsByConsumer = new Map<string, Set<string>>();
  nodes.filter(isMethodNode).forEach((node) => {
    providerByColor.set(normalizeColor(node.data.color), node);
    nodeByColor.set(normalizeColor(node.data.color), node);
  });
  buildLegacyConnection(nodes).fromConnector.method.forEach((method) => {
    const node = nodes.find((item) => item.id === method.id);
    if (!node) return;
    providerByColor.set(normalizeColor(method.color), node);
    nodeByColor.set(normalizeColor(method.color), node);
  });

  if (Array.isArray(fieldBindings)) {
    fieldBindings.forEach((binding) => {
      const resultColors = collectReferenceColors(binding?.enhancement?.args?.RESULT_VAR ?? '');
      const consumerColor = [...resultColors][0];
      const consumer = consumerColor ? nodeByColor.get(consumerColor) : undefined;
      if (!consumer) return;
      const sourceColors = collectReferenceColors(
        Object.fromEntries(
          Object.entries(binding?.enhancement?.args ?? {}).filter(([key]) => key !== 'RESULT_VAR'),
        ),
      );
      if (sourceColors.size === 0) return;
      fieldBindingRefsByConsumer.set(consumer.id, new Set([
        ...(fieldBindingRefsByConsumer.get(consumer.id) ?? []),
        ...sourceColors,
      ]));
    });
  }

  const isReferenceValid = (provider: WorkflowNodeModel | undefined, consumer: WorkflowNodeModel) => {
    if (!provider || provider.id === consumer.id) return false;
    const providerIndex = indexes.get(provider.id);
    const consumerIndex = indexes.get(consumer.id);
    return isReferenceVisible(providerIndex, consumerIndex);
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
      if (!isReferenceValid(provider, node)) {
        return [{ consumerNodeId: node.id, sourceColor }];
      }
      return [];
    });
  });
};

const newInvalidReferencesForGraph = (
  beforeNodes: WorkflowNodeModel[],
  beforeEdges: WorkflowEdgeModel[],
  afterNodes: WorkflowNodeModel[],
  afterEdges: WorkflowEdgeModel[],
  beforeFieldBindings?: any[],
  afterFieldBindings?: any[],
) => {
  const before = new Set(
    invalidReferencesForGraph(beforeNodes, beforeEdges, undefined, beforeFieldBindings).map(referenceKey),
  );

  return invalidReferencesForGraph(afterNodes, afterEdges, undefined, afterFieldBindings)
    .filter((ref) => !before.has(referenceKey(ref)));
};

const invalidExternalReferencesToMovedProviders = (
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

  nodes.filter(isMethodNode).forEach((node) => {
    const color = normalizeColor(node.data.color);
    if (!color) return;
    providerByColor.set(color, node);
    nodeByColor.set(color, node);
  });
  buildLegacyConnection(nodes).fromConnector.method.forEach((method) => {
    const node = nodes.find((item) => item.id === method.id);
    if (!node) return;
    const color = normalizeColor(method.color);
    if (!color) return;
    providerByColor.set(color, node);
    nodeByColor.set(color, node);
  });

  if (Array.isArray(fieldBindings)) {
    fieldBindings.forEach((binding) => {
      const resultColors = collectReferenceColors(binding?.enhancement?.args?.RESULT_VAR ?? '');
      const consumer = nodeByColor.get([...resultColors][0] ?? '');
      if (!consumer) return;
      const sourceColors = collectReferenceColors(
        Object.fromEntries(
          Object.entries(binding?.enhancement?.args ?? {}).filter(([key]) => key !== 'RESULT_VAR'),
        ),
      );
      if (sourceColors.size === 0) return;
      fieldBindingRefsByConsumer.set(consumer.id, new Set([
        ...(fieldBindingRefsByConsumer.get(consumer.id) ?? []),
        ...sourceColors,
      ]));
    });
  }

  return nodes.flatMap((node) => {
    if (movedNodeIds.has(node.id) || (!isMethodNode(node) && !isOperatorNode(node))) return [];
    const consumerIndex = indexes.get(node.id);
    const refs = new Set([
      ...collectNodeReferenceColors(node.data),
      ...(fieldBindingRefsByConsumer.get(node.id) ?? []),
    ]);

    return [...refs]
      .filter((sourceColor) => movedColors.has(sourceColor))
      .flatMap((sourceColor) => {
        const provider = providerByColor.get(providerColorOverrides.get(sourceColor) ?? sourceColor);
        const providerIndex = provider ? indexes.get(provider.id) : undefined;
        if (!provider || !providerIndex) return [{ consumerNodeId: node.id, sourceColor }];
        if (isReferenceVisible(providerIndex, consumerIndex)) return [];
        return [{ consumerNodeId: node.id, sourceColor }];
      });
  });
};

const cleanInvalidReferences = (
  nodes: WorkflowNodeModel[],
  invalidReferences: InvalidReference[],
  fieldBindings?: any[],
) => {
  const invalidByNode = new Map<string, Set<string>>();
  invalidReferences.forEach((ref) => {
    invalidByNode.set(ref.consumerNodeId, new Set([...(invalidByNode.get(ref.consumerNodeId) ?? []), ref.sourceColor]));
  });
  const invalidByConsumerColor = new Map<string, Set<string>>();
  nodes.forEach((node) => {
    const colors = invalidByNode.get(node.id);
    const consumerColor = normalizeColor(node.data.color);
    if (colors && consumerColor) invalidByConsumerColor.set(consumerColor, colors);
  });

  const cleanBinding = (binding: any) => {
    const resultColors = collectReferenceColors(binding?.enhancement?.args?.RESULT_VAR ?? '');
    const consumerColor = [...resultColors][0]
      ?? (Array.isArray(binding?.to) ? normalizeColor(binding.to[0]?.color) : '');
    const invalidColors = consumerColor ? invalidByConsumerColor.get(consumerColor) : undefined;
    if (!invalidColors) return binding;

    const next = cloneValue(binding);
    if (next?.enhancement?.args && typeof next.enhancement.args === 'object') {
      next.enhancement.args = Object.fromEntries(
        Object.entries(next.enhancement.args).filter(([key, value]) => {
          if (key === 'RESULT_VAR') return true;
          const colors = collectReferenceColors(value);
          return ![...colors].some((color) => invalidColors.has(color));
        }),
      );
    }
    if (Array.isArray(next?.from)) {
      next.from = next.from.filter((item: any) => !invalidColors.has(normalizeColor(item?.color)));
    }
    if (typeof next?.enhancement?.expertVar === 'string') {
      next.enhancement.expertVar = next.enhancement.expertVar
        .split('\n')
        .filter((line: string) => ![...collectReferenceColors(line)].some((color) => invalidColors.has(color)))
        .join('\n');
    }

    const sourceArgs = Object.entries(next?.enhancement?.args ?? {}).filter(([key]) => key !== 'RESULT_VAR');
    const hasSources = sourceArgs.length > 0 || (Array.isArray(next?.from) && next.from.length > 0);
    return hasSources ? next : null;
  };

  return {
    nodes: nodes.map((node) => {
      const colors = invalidByNode.get(node.id);
      if (!colors) return node;
      if (isOperatorNode(node)) {
        const conditionConfig = removeConditionConfigColors(node.data.conditionConfig, colors);
        return {
          ...node,
          data: {
            ...node.data,
            conditionConfig,
          },
        };
      }
      return {
        ...node,
        data: removeNodeDataColors(node.data, colors),
      };
    }),
    fieldBindings: Array.isArray(fieldBindings)
      ? fieldBindings.map(cleanBinding).filter(Boolean)
      : fieldBindings,
  };
};

const cloneFieldBindingsForCopy = (
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

  const resolveProvider = (sourceColor: string, consumer: WorkflowNodeModel | undefined) => {
    if (!consumer) return undefined;
    const consumerIndex = indexes.get(consumer.id);
    const candidates = methodNodes
      .filter((node) => normalizeColor(node.data.color) === sourceColor)
      .filter((node) => isReferenceVisible(indexes.get(node.id), consumerIndex))
      .sort((left, right) => compareIndex(indexes.get(right.id) ?? '', indexes.get(left.id) ?? ''));
    const sourceCandidate = candidates.find((node) => sourceNodeIds.has(node.id));
    if (sourceCandidate) return sourceCandidate;

    const externalCandidate = candidates[0];
    const externalTitle = externalCandidate?.data.subtitle || externalCandidate?.data.title;
    if (!externalTitle) return externalCandidate;

    return sourceMethodNodes
      .filter((node) => node.data.subtitle === externalTitle || node.data.title === externalTitle)
      .filter((node) => isReferenceVisible(indexes.get(node.id), consumerIndex))
      .sort((left, right) => compareIndex(indexes.get(right.id) ?? '', indexes.get(left.id) ?? ''))[0]
      ?? externalCandidate;
  };

  const resolveConsumer = (resultColor: string) =>
    sourceMethodNodes.find((node) => normalizeColor(node.data.color) === resultColor);

  const replaceReferenceColor = (
    value: unknown,
    sourceColor: string | undefined,
    nextColor: string | undefined,
  ): unknown => {
    if (typeof value !== 'string' || !sourceColor || !nextColor) return value;
    return value.replace(new RegExp(sourceColor, 'gi'), nextColor);
  };

  const getSourceColorForArg = (binding: any, key: string, value: unknown) => {
    if (key === 'RESULT_VAR') {
      return [...collectReferenceColors(value)][0]
        ?? (Array.isArray(binding?.to) ? normalizeColor(binding.to[0]?.color) : '');
    }
    const match = key.match(/^VAR_(\d+)$/);
    if (match && Array.isArray(binding?.from)) {
      const fromColor = normalizeColor(binding.from[Number(match[1])]?.color);
      if (fromColor) return fromColor;
    }
    return [...collectReferenceColors(value)][0];
  };

  const getNextColorForArg = (
    binding: any,
    key: string,
    value: unknown,
    consumer: WorkflowNodeModel | undefined,
  ) => {
    const sourceColor = getSourceColorForArg(binding, key, value);
    if (!sourceColor) return undefined;
    if (key === 'RESULT_VAR') {
      return consumer ? clonedColorBySourceId.get(consumer.id) : colorMap.get(sourceColor);
    }
    const provider = resolveProvider(sourceColor, consumer);
    return provider && sourceNodeIds.has(provider.id)
      ? clonedColorBySourceId.get(provider.id) ?? colorMap.get(sourceColor)
      : undefined;
  };

  const copied = fieldBindings
    .filter((binding) => {
      const resultColor = [...collectReferenceColors(binding?.enhancement?.args?.RESULT_VAR ?? '')][0]
        ?? (Array.isArray(binding?.to) ? normalizeColor(binding.to[0]?.color) : '');
      return !!resolveConsumer(resultColor);
    })
    .map((binding) => {
      const next = cloneValue(binding) as any;
      const resultColor = [...collectReferenceColors(next?.enhancement?.args?.RESULT_VAR ?? '')][0]
        ?? (Array.isArray(next?.to) ? normalizeColor(next.to[0]?.color) : '');
      const consumer = resolveConsumer(resultColor);
      if (next?.enhancement?.enhanceId) {
        next.enhancement.enhanceId = createShortId('enh');
      }
      if (next?.enhancement?.args && typeof next.enhancement.args === 'object') {
        next.enhancement.args = Object.fromEntries(
          Object.entries(next.enhancement.args).map(([key, value]) => {
            const sourceColor = getSourceColorForArg(binding, key, value);
            const nextColor = getNextColorForArg(binding, key, value, consumer);
            return [key, replaceReferenceColor(value, sourceColor, nextColor)];
          }),
        );
      }
      if (typeof next?.enhancement?.expertVar === 'string') {
        next.enhancement.expertVar = Object.entries(next.enhancement.args ?? {}).reduce(
          (expertVar, [key, value]) => {
            const sourceColor = getSourceColorForArg(binding, key, binding?.enhancement?.args?.[key]);
            const nextColor = [...collectReferenceColors(value)][0];
            return replaceReferenceColor(expertVar, sourceColor, nextColor) as string;
          },
          next.enhancement.expertVar,
        );
      }
      if (Array.isArray(next?.to)) {
        next.to = next.to.map((item: any) => {
          const nextColor = colorMap.get(normalizeColor(item?.color));
          return nextColor ? { ...item, color: nextColor } : item;
        });
      }
      if (Array.isArray(next?.from)) {
        next.from = next.from.map((item: any) => {
          const nextColor = colorMap.get(normalizeColor(item?.color));
          return nextColor ? { ...item, color: nextColor } : item;
        });
      }
      return next;
    });
  return copied.length ? [...fieldBindings, ...copied] : fieldBindings;
};

const restoreExternalOperatorConditions = (
  beforeNodes: WorkflowNodeModel[],
  afterNodes: WorkflowNodeModel[],
  movedNodeIds: Set<string>,
  skipNodeIds = new Set<string>(),
) => {
  const beforeById = new Map(beforeNodes.map((node) => [node.id, node]));

  return afterNodes.map((node) => {
    if (!isOperatorNode(node) || movedNodeIds.has(node.id) || skipNodeIds.has(node.id)) return node;
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

export function moveOrCopyWorkflowNodes({
  sourceNodeId,
  target,
  mode,
  nodes,
  edges,
  fieldBindings,
  cleanInvalid = false,
}: {
  sourceNodeId: string;
  target: DropTarget;
  mode: WorkflowDropMode;
  nodes: WorkflowNodeModel[];
  edges: WorkflowEdgeModel[];
  fieldBindings?: any[];
  cleanInvalid?: boolean;
}): WorkflowDropResult {
  if (sourceNodeId === target.nodeId) {
    return { nodes, edges, fieldBindings, invalidReferences: [] };
  }

  const source = nodes.find((node) => node.id === sourceNodeId);
  const targetNode = nodes.find((node) => node.id === target.nodeId);
  if (!source || !targetNode || source.type === 'start') {
    return { nodes, edges, fieldBindings, invalidReferences: [] };
  }

  const subtree = subtreeForNode(sourceNodeId, nodes, edges);
  if (subtree.nodes.some((node) => node.id === target.nodeId)) {
    return { nodes, edges, fieldBindings, invalidReferences: [] };
  }

  const prepared = mode === 'copy'
    ? cloneSubtree(subtree.nodes, subtree.edges, nodes, edges)
    : { ...subtree, colorMap: new Map<string, string>(), idMap: new Map<string, string>(), clonedColorBySourceId: new Map<string, string>() };
  const nextFieldBindings = mode === 'copy'
    ? cloneFieldBindingsForCopy(fieldBindings, prepared.colorMap, prepared.clonedColorBySourceId, subtree.nodes, nodes, edges)
    : fieldBindings;
  const base = mode === 'move'
    ? deleteNodeGraph(sourceNodeId, nodes, edges)
    : { nodes, edges };
  const inserted = insertSubtree(prepared.nodes, prepared.edges, target, base.nodes, base.edges);
  const insertedNodes = inserted.nodes;
  const movedConsumerIds = new Set(prepared.nodes.map((node) => node.id));
  const movedColors = new Set(
    prepared.nodes
      .filter(isMethodNode)
      .map((node) => normalizeColor(node.data.color))
      .filter(Boolean),
  );
  const movedInvalidReferences = invalidReferencesForGraph(
    insertedNodes,
    inserted.edges,
    movedConsumerIds,
    nextFieldBindings,
    prepared.colorMap,
    movedColors,
  );
  const invalidReferences = uniqueReferences(
    [
      ...movedInvalidReferences,
      ...invalidExternalReferencesToMovedProviders(
        insertedNodes,
        inserted.edges,
        movedConsumerIds,
        movedColors,
        nextFieldBindings,
        prepared.colorMap,
      ),
    ],
  );

  if (!cleanInvalid || invalidReferences.length === 0) {
    return {
      nodes: restoreExternalOperatorConditions(nodes, insertedNodes, movedConsumerIds),
      edges: inserted.edges,
      fieldBindings: nextFieldBindings,
      invalidReferences,
    };
  }

  const cleaned = cleanInvalidReferences(insertedNodes, invalidReferences, nextFieldBindings);
  const cleanedNodeIds = new Set(invalidReferences.map((ref) => ref.consumerNodeId));
  return {
    nodes: restoreExternalOperatorConditions(nodes, cleaned.nodes, movedConsumerIds, cleanedNodeIds),
    edges: inserted.edges,
    fieldBindings: cleaned.fieldBindings,
    invalidReferences: [],
  };
}
