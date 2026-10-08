import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { deleteNodeGraph } from './deleteNodeGraph';
import type { DropTarget, WorkflowDropMode,
  WorkflowDropResult } from './graph.dragDrop.types';
import { normalizeReferenceColor as normalizeColor,
  uniqueReferences } from './graph.referenceColors';
import { insertWorkflowSubtree as insertSubtree } from './graph.subtreeInsertion';
import { findInvalidWorkflowReferences as invalidReferencesForGraph } from './graph.invalidReferences';
import { cleanInvalidWorkflowReferences as cleanInvalidReferences } from './graph.invalidReferenceCleanup';
import { cloneWorkflowFieldBindings as cloneFieldBindingsForCopy } from './graph.fieldBindingClone';
import { restoreExternalOperatorConditions } from './graph.operatorConditionRestore';
import { findOutOfScopeIteratorReferences } from './graph.iteratorScope';
import {
  findInvalidReferencesToMovedProviders as invalidExternalReferencesToMovedProviders,
} from './graph.movedReferenceValidation';
import {
  cloneWorkflowSubtree as cloneSubtree,
  getWorkflowSubtree as subtreeForNode,
} from './graph.subtreeClone';
export { normalizeWorkflowPositions } from './graph.dragDropGeometry';
export type { InvalidReference, WorkflowDropMode,
  WorkflowDropResult } from './graph.dragDrop.types';

const isMethodNode = (node: WorkflowNodeModel) =>
  node.type === 'connector' || node.type === 'system';

type DropArgs = {
  target: DropTarget;
  nodes: WorkflowNodeModel[];
  edges: WorkflowEdgeModel[];
  fieldBindings?: unknown[];
  cleanInvalid?: boolean;
};

const collectRootSubtrees = (
  sourceNodeIds: string[],
  nodes: WorkflowNodeModel[],
  edges: WorkflowEdgeModel[],
) => {
  const carriedIds = new Set<string>();
  const subtrees = sourceNodeIds.map((id) => ({ rootId: id, ...subtreeForNode(id, nodes, edges) }));
  subtrees.forEach((subtree) => subtree.nodes
    .filter((node) => node.id !== subtree.rootId)
    .forEach((node) => carriedIds.add(node.id)));
  const seenRootIds = new Set<string>();
  return subtrees.filter((subtree) => {
    const root = subtree.nodes.find((node) => node.id === subtree.rootId);
    if (!root || root.type === 'start' || root.type === 'comment') return false;
    if (carriedIds.has(subtree.rootId) || seenRootIds.has(subtree.rootId)) return false;
    seenRootIds.add(subtree.rootId);
    return true;
  });
};

/**
 * Moves or copies several roots (each carrying its operator subtree) as one
 * operation: the first lands on `target`, every next one to the right of the
 * previous. Copies are cloned in a single pass so a reference between two
 * copied roots is re-pointed at the copy, and references are validated once
 * against the final graph — checking after every intermediate step both misses
 * references an earlier step broke and flags ones a later step repairs.
 */
export function dropWorkflowNodeGroup({
  sourceNodeIds,
  mode,
  target,
  nodes,
  edges,
  fieldBindings,
  cleanInvalid = false,
}: DropArgs & { sourceNodeIds: string[]; mode: WorkflowDropMode }): WorkflowDropResult {
  const unchanged: WorkflowDropResult = { nodes, edges, fieldBindings, invalidReferences: [] };
  const subtrees = collectRootSubtrees(sourceNodeIds, nodes, edges);
  if (subtrees.length === 0 || !nodes.some((node) => node.id === target.nodeId)) return unchanged;

  const rootIds = subtrees.map((subtree) => subtree.rootId);
  const sourceNodes = subtrees.flatMap((subtree) => subtree.nodes);
  const sourceEdges = subtrees.flatMap((subtree) => subtree.edges);
  // Pasting a copy next to one of the copied roots is fine — the original
  // stays where it is — but never into the middle of a carried subtree.
  const targetIsCopiedRoot = mode === 'copy' && rootIds.includes(target.nodeId);
  if (sourceNodes.some((node) => node.id === target.nodeId) && !targetIsCopiedRoot) {
    return unchanged;
  }

  const prepared = mode === 'copy'
    ? cloneSubtree(sourceNodes, sourceEdges, nodes, edges)
    : { nodes: sourceNodes, edges: sourceEdges, colorMap: new Map<string, string>(),
      idMap: new Map<string, string>(), clonedColorBySourceId: new Map<string, string>() };
  const nextFieldBindings = mode === 'copy'
    ? cloneFieldBindingsForCopy(fieldBindings, prepared.colorMap, prepared.clonedColorBySourceId, sourceNodes, nodes, edges)
    : fieldBindings;
  const preparedNodeById = new Map(sourceNodes.map((node, index) => [node.id, prepared.nodes[index]]));
  const preparedEdgeById = new Map(sourceEdges.map((item, index) => [item.id, prepared.edges[index]]));
  const preparedId = (id: string) => prepared.idMap.get(id) ?? id;

  const base = mode === 'move'
    ? rootIds.reduce((graph, rootId) => deleteNodeGraph(rootId, graph.nodes, graph.edges), { nodes, edges })
    : { nodes, edges };
  const inserted = subtrees.reduce((graph, subtree, index) => insertSubtree(
    subtree.nodes.map((node) => preparedNodeById.get(node.id) ?? node),
    subtree.edges.map((item) => preparedEdgeById.get(item.id) ?? item),
    index === 0 ? target : { nodeId: preparedId(rootIds[index - 1]), direction: 'right' },
    graph.nodes,
    graph.edges,
  ), base);

  const movedConsumerIds = new Set(prepared.nodes.map((node) => node.id));
  const movedColors = new Set(
    prepared.nodes
      .filter(isMethodNode)
      .map((node) => normalizeColor(node.data.color))
      .filter(Boolean),
  );
  const invalidReferences = uniqueReferences([
    ...invalidReferencesForGraph(inserted.nodes, inserted.edges, movedConsumerIds,
      nextFieldBindings, prepared.colorMap, movedColors),
    ...invalidExternalReferencesToMovedProviders(inserted.nodes, inserted.edges,
      movedConsumerIds, movedColors, nextFieldBindings, prepared.colorMap),
    ...findOutOfScopeIteratorReferences(inserted.nodes, inserted.edges,
      movedConsumerIds, nextFieldBindings),
  ]);

  if (!cleanInvalid || invalidReferences.length === 0) {
    return {
      nodes: restoreExternalOperatorConditions(nodes, inserted.nodes, movedConsumerIds),
      edges: inserted.edges,
      fieldBindings: nextFieldBindings,
      invalidReferences,
      idMap: prepared.idMap,
    };
  }

  const cleaned = cleanInvalidReferences(inserted.nodes, invalidReferences, nextFieldBindings);
  const cleanedNodeIds = new Set(invalidReferences.map((ref) => ref.consumerNodeId));
  return {
    nodes: restoreExternalOperatorConditions(nodes, cleaned.nodes, movedConsumerIds, cleanedNodeIds),
    edges: inserted.edges,
    fieldBindings: cleaned.fieldBindings,
    invalidReferences: [],
    idMap: prepared.idMap,
  };
}

export const moveOrCopyWorkflowNodes = ({ sourceNodeId, ...args }:
  DropArgs & { sourceNodeId: string; mode: WorkflowDropMode }) =>
  dropWorkflowNodeGroup({ ...args, sourceNodeIds: [sourceNodeId] });

export const moveWorkflowNodeGroup = (args: DropArgs & { sourceNodeIds: string[] }) =>
  dropWorkflowNodeGroup({ ...args, mode: 'move' });

export const copyWorkflowNodeGroup = (args: DropArgs & { sourceNodeIds: string[] }) =>
  dropWorkflowNodeGroup({ ...args, mode: 'copy' });
