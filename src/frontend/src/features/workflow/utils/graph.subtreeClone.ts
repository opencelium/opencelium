import { createShortId } from '@shared/lib/createId';
import { buildWorkflowIndexes } from '../api/connectionPayload';
import { ALL_COLORS } from '../constants/colors';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import {
  collectReferenceColors,
  normalizeReferenceColor,
} from './graph.referenceColors';
import {
  compareWorkflowIndexes,
  collectWorkflowJumpLinks,
  isWorkflowReferenceVisible,
} from './graph.referenceVisibility';
import { getOperatorBottomBranch } from './graph.traversal';

const isMethodNode = (node: WorkflowNodeModel) =>
  node.type === 'connector' || node.type === 'system';

const cloneValue = <T,>(value: T): T =>
  value === undefined ? value : JSON.parse(JSON.stringify(value));

const nextFreeColor = (used: Set<string>) => {
  const found = ALL_COLORS.find((color) => !used.has(normalizeReferenceColor(color)));
  const color = found ?? `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;
  used.add(normalizeReferenceColor(color));
  return color;
};

export const getWorkflowSubtree = (
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

export const cloneWorkflowSubtree = (
  sourceNodes: WorkflowNodeModel[],
  sourceEdges: WorkflowEdgeModel[],
  allNodes: WorkflowNodeModel[],
  allEdges: WorkflowEdgeModel[],
) => {
  const idMap = new Map<string, string>();
  const colorMap = new Map<string, string>();
  const clonedColorBySourceId = new Map<string, string>();
  const usedColors = new Set(
    allNodes.filter(isMethodNode)
      .map((node) => normalizeReferenceColor(node.data.color))
      .filter(Boolean),
  );
  const sourceNodeIds = new Set(sourceNodes.map((node) => node.id));
  const sourceMethodNodes = sourceNodes.filter(isMethodNode);
  const methodNodes = allNodes.filter(isMethodNode);
  const indexes = buildWorkflowIndexes(allNodes, allEdges);
  const jumps = collectWorkflowJumpLinks(allNodes, indexes);

  sourceNodes.forEach((node) => {
    idMap.set(node.id, createShortId(node.type));
    if (isMethodNode(node)) {
      const nextColor = nextFreeColor(usedColors);
      colorMap.set(normalizeReferenceColor(node.data.color), nextColor);
      clonedColorBySourceId.set(node.id, nextColor);
    }
  });

  const resolveProvider = (sourceColor: string, consumer: WorkflowNodeModel) => {
    const consumerIndex = indexes.get(consumer.id);
    const candidates = methodNodes
      .filter((node) => normalizeReferenceColor(node.data.color) === sourceColor)
      .filter((node) => isWorkflowReferenceVisible(indexes.get(node.id), consumerIndex, jumps))
      .sort((left, right) => compareWorkflowIndexes(
        indexes.get(right.id) ?? '', indexes.get(left.id) ?? '',
      ));
    const sourceCandidate = candidates.find((node) => sourceNodeIds.has(node.id));
    if (sourceCandidate) return sourceCandidate;

    const externalCandidate = candidates[0];
    const externalTitle = externalCandidate?.data.subtitle || externalCandidate?.data.title;
    if (!externalTitle) return externalCandidate;

    return sourceMethodNodes
      .filter((node) => node.data.subtitle === externalTitle || node.data.title === externalTitle)
      .filter((node) => isWorkflowReferenceVisible(indexes.get(node.id), consumerIndex, jumps))
      .sort((left, right) => compareWorkflowIndexes(
        indexes.get(right.id) ?? '', indexes.get(left.id) ?? '',
      ))[0] ?? externalCandidate;
  };

  const replaceColors = (value: unknown, consumer: WorkflowNodeModel): unknown => {
    if (typeof value === 'string') {
      let result = value;
      collectReferenceColors(value).forEach((sourceColor) => {
        const provider = resolveProvider(sourceColor, consumer);
        const nextColor = provider && sourceNodeIds.has(provider.id)
          ? clonedColorBySourceId.get(provider.id)
          : undefined;
        if (nextColor) result = result.replace(new RegExp(sourceColor, 'gi'), nextColor);
      });
      return result;
    }
    if (Array.isArray(value)) return value.map((item) => replaceColors(item, consumer));
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value as Record<string, unknown>)
        .map(([key, nested]) => [key, replaceColors(nested, consumer)]));
    }
    return value;
  };

  const nodes = sourceNodes.map((node) => ({
    ...node,
    id: idMap.get(node.id) ?? node.id,
    selected: false,
    data: replaceColors(cloneValue({
      ...node.data,
      color: isMethodNode(node) ? clonedColorBySourceId.get(node.id) : node.data.color,
      // A joint only survives a copy when its target came along: point it at the
      // target's clone, and drop it when the target stayed behind (a joint out of
      // the copied subtree would break the same-scope rule anyway).
      jumpTo: node.data.jumpTo ? idMap.get(node.data.jumpTo) : undefined,
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
