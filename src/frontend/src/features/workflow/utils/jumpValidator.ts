import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { buildWorkflowIndexes } from '../api/connectionPayload';

/** Why a node cannot be the target of a joint started on another node. */
export type JointRejectionReason =
  | 'self'
  | 'not-a-method'
  | 'different-loop-scope'
  | 'backwards'
  | 'skips-referenced-method';

/** The parts of a field binding this module reads: which method's data flows
 * into which. The full legacy binding shape is untyped elsewhere. */
export type JointFieldBinding = {
  from?: { color?: string }[];
  to?: { color?: string }[];
};

export type JointTargetVerdict =
  | { valid: true }
  | { valid: false; reason: JointRejectionReason; blockingNodeId?: string };

const VALID: JointTargetVerdict = { valid: true };

const isMethodNode = (node: WorkflowNodeModel) =>
  node.type === 'connector' || node.type === 'system' || node.type === 'trigger-connection';

/**
 * Index of the innermost LOOP the node at `index` runs inside, or '' when it
 * runs outside every loop. IF operators are deliberately transparent here: they
 * change nesting level but not the loop a method belongs to.
 */
const enclosingLoopIndex = (index: string, nodeByIndex: Map<string, WorkflowNodeModel>) => {
  const segments = index.split('_');
  for (let length = segments.length - 1; length >= 1; length -= 1) {
    const prefix = segments.slice(0, length).join('_');
    if (nodeByIndex.get(prefix)?.type === 'loop') return prefix;
  }
  return '';
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

/** Colors of the methods whose data `target` consumes — its own references plus
 * anything mapped into it through a field binding. */
const referencedColorsOf = (
  target: WorkflowNodeModel,
  fieldBindings: readonly JointFieldBinding[],
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
      const toColors = (binding?.to ?? []).map((item) => item?.color?.toLowerCase());
      if (!toColors.includes(targetColor)) continue;
      for (const from of binding?.from ?? []) {
        if (from?.color) colors.add(String(from.color).toLowerCase());
      }
    }
  }
  return colors;
};

/**
 * Verdict per node for a joint started on `sourceId`. A joint may only run
 * forward between two methods that live in the same loop scope: both outside
 * every loop, or both inside the very same loop. Nesting level does not have to
 * match — an IF operator changes the level but not the loop, so a joint may
 * leave or enter an IF branch — but a loop boundary is never crossed, so a
 * method in loop1 can never reach a method inside a loop2 nested under it. A
 * joint may also not skip over a method whose response the target consumes.
 */
export const evaluateJointTargets = (
  sourceId: string,
  nodes: WorkflowNodeModel[],
  edges: WorkflowEdgeModel[],
  fieldBindings: readonly JointFieldBinding[] = [],
): Map<string, JointTargetVerdict> => {
  const verdicts = new Map<string, JointTargetVerdict>();
  const indexes = buildWorkflowIndexes(nodes, edges);
  const nodeByIndex = new Map<string, WorkflowNodeModel>();
  nodes.forEach((node) => {
    const index = indexes.get(node.id);
    if (index != null) nodeByIndex.set(index, node);
  });
  const source = nodes.find((node) => node.id === sourceId);
  const sourceIndex = indexes.get(sourceId);
  if (!source || !isMethodNode(source) || sourceIndex == null) return verdicts;

  const sourceLoop = enclosingLoopIndex(sourceIndex, nodeByIndex);

  for (const node of nodes) {
    if (node.id === sourceId) {
      verdicts.set(node.id, { valid: false, reason: 'self' });
      continue;
    }
    if (!isMethodNode(node)) {
      verdicts.set(node.id, { valid: false, reason: 'not-a-method' });
      continue;
    }
    const targetIndex = indexes.get(node.id);
    if (targetIndex == null || enclosingLoopIndex(targetIndex, nodeByIndex) !== sourceLoop) {
      verdicts.set(node.id, { valid: false, reason: 'different-loop-scope' });
      continue;
    }
    if (compareIndex(targetIndex, sourceIndex) <= 0) {
      verdicts.set(node.id, { valid: false, reason: 'backwards' });
      continue;
    }

    const referenced = referencedColorsOf(node, fieldBindings);
    const skipped = referenced.size > 0
      ? nodes.find((other) => {
        if (!isMethodNode(other)) return false;
        const otherIndex = indexes.get(other.id);
        if (otherIndex == null) return false;
        if (compareIndex(otherIndex, sourceIndex) <= 0) return false;
        if (compareIndex(otherIndex, targetIndex) >= 0) return false;
        const color = other.data.color?.toLowerCase();
        return !!color && referenced.has(color);
      })
      : undefined;
    if (skipped) {
      verdicts.set(node.id, {
        valid: false,
        reason: 'skips-referenced-method',
        blockingNodeId: skipped.id,
      });
      continue;
    }

    verdicts.set(node.id, VALID);
  }

  return verdicts;
};

/**
 * Drops joints that stopped being legal — the target is gone, or the graph was
 * rearranged so source and target no longer share a loop scope. Returns the
 * nodes unchanged (same identity) when every joint still holds.
 */
export const pruneInvalidJoints = (
  nodes: WorkflowNodeModel[],
  edges: WorkflowEdgeModel[],
  fieldBindings: readonly JointFieldBinding[] = [],
): { nodes: WorkflowNodeModel[]; removedSourceIds: string[] } => {
  const removedSourceIds: string[] = [];
  const nextNodes = nodes.map((node) => {
    const targetId = node.data.jumpTo;
    if (!targetId) return node;
    const verdicts = evaluateJointTargets(node.id, nodes, edges, fieldBindings);
    if (verdicts.get(targetId)?.valid) return node;
    removedSourceIds.push(node.id);
    return { ...node, data: { ...node.data, jumpTo: undefined } };
  });
  return removedSourceIds.length > 0
    ? { nodes: nextNodes, removedSourceIds }
    : { nodes, removedSourceIds };
};
