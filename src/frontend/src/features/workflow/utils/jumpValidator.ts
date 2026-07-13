import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { buildWorkflowIndexes } from '../api/connectionPayload';

const isOperatorNode = (node: WorkflowNodeModel) => node.type === 'if' || node.type === 'loop';

const parentIndex = (index: string) => {
  const segments = index.split('_');
  segments.pop();
  return segments.join('_');
};

const lastSegment = (index: string) => {
  const segments = index.split('_');
  return Number(segments[segments.length - 1]);
};

const compareIndex = (left: string, right: string) => {
  const leftParts = left.split('_').map(Number);
  const rightParts = right.split('_').map(Number);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let i = 0; i < length; i += 1) {
    const a = Number.isFinite(leftParts[i]) ? leftParts[i] : -1;
    const b = Number.isFinite(rightParts[i]) ? rightParts[i] : -1;
    if (a !== b) return a - b;
  }
  return 0;
};

const HEX_COLOR_RE = /#[0-9A-Fa-f]{6}/g;

const referencedColorsOf = (
  target: WorkflowNodeModel,
  fieldBindings: any[],
): Set<string> => {
  const colors = new Set<string>();
  const config = target.data.methodConfig;
  if (config) {
    const serialized = JSON.stringify({
      url: config.url,
      headers: config.headers,
      queryParams: config.queryParams,
      body: config.body,
      endpointArgs: config.endpointArgs,
    });
    for (const match of serialized.match(HEX_COLOR_RE) ?? []) colors.add(match.toLowerCase());
  }
  const targetColor = target.data.color?.toLowerCase();
  if (targetColor && Array.isArray(fieldBindings)) {
    for (const binding of fieldBindings) {
      const toColors = (binding?.to ?? []).map((item: any) => item?.color?.toLowerCase()).filter(Boolean);
      if (!toColors.includes(targetColor)) continue;
      for (const from of binding?.from ?? []) {
        if (from?.color) colors.add(String(from.color).toLowerCase());
      }
    }
  }
  return colors;
};

export const getNodeIndexMap = (nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[]) =>
  buildWorkflowIndexes(nodes, edges);

export const getValidJumpTargetIds = (
  sourceId: string,
  nodes: WorkflowNodeModel[],
  edges: WorkflowEdgeModel[],
  fieldBindings: any[] = [],
): Set<string> => {
  const indexes = buildWorkflowIndexes(nodes, edges);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const idByIndex = new Map<string, string>();
  indexes.forEach((index, id) => idByIndex.set(index, id));

  const source = nodeById.get(sourceId);
  const sourceIndex = indexes.get(sourceId);
  if (!source || isOperatorNode(source) || sourceIndex == null) return new Set();

  const reachable = new Map<string, string>();
  reachable.set(parentIndex(sourceIndex), sourceIndex);

  const segments = sourceIndex.split('_');
  for (let length = segments.length - 1; length >= 1; length -= 1) {
    const prefix = segments.slice(0, length).join('_');
    const containerId = idByIndex.get(prefix);
    const container = containerId ? nodeById.get(containerId) : undefined;
    if (!container || !isOperatorNode(container)) continue;
    if (container.type === 'loop') break;
    reachable.set(parentIndex(prefix), prefix);
  }

  const validTargetIds = new Set<string>();
  for (const node of nodes) {
    if (node.id === sourceId) continue;
    if (isOperatorNode(node)) continue;
    const targetIndex = indexes.get(node.id);
    if (targetIndex == null) continue;
    const anchorIndex = reachable.get(parentIndex(targetIndex));
    if (anchorIndex == null) continue;
    if (lastSegment(targetIndex) <= lastSegment(anchorIndex)) continue;

    const referenced = referencedColorsOf(node, fieldBindings);
    if (referenced.size > 0) {
      let skipsReferenced = false;
      for (const other of nodes) {
        if (isOperatorNode(other)) continue;
        const otherIndex = indexes.get(other.id);
        if (otherIndex == null) continue;
        if (compareIndex(otherIndex, sourceIndex) <= 0) continue;
        if (compareIndex(otherIndex, targetIndex) >= 0) continue;
        const color = other.data.color?.toLowerCase();
        if (color && referenced.has(color)) {
          skipsReferenced = true;
          break;
        }
      }
      if (skipsReferenced) continue;
    }

    validTargetIds.add(node.id);
  }

  return validTargetIds;
};
