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
  fieldBindings?: unknown[];
  cleanInvalid?: boolean;
}): WorkflowDropResult {
  if (sourceNodeId === target.nodeId && mode === 'move') {
    return { nodes, edges, fieldBindings, invalidReferences: [] };
  }

  const source = nodes.find((node) => node.id === sourceNodeId);
  const targetNode = nodes.find((node) => node.id === target.nodeId);
  if (!source || !targetNode || source.type === 'start') {
    return { nodes, edges, fieldBindings, invalidReferences: [] };
  }

  const subtree = subtreeForNode(sourceNodeId, nodes, edges);
  if (subtree.nodes.some((node) => node.id === target.nodeId) &&
    !(mode === 'copy' && sourceNodeId === target.nodeId)) {
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
      idMap: prepared.idMap,
    };
  }

  const cleaned = cleanInvalidReferences(insertedNodes, invalidReferences, nextFieldBindings);
  const cleanedNodeIds = new Set(invalidReferences.map((ref) => ref.consumerNodeId));
  return {
    nodes: restoreExternalOperatorConditions(nodes, cleaned.nodes, movedConsumerIds, cleanedNodeIds),
    edges: inserted.edges,
    fieldBindings: cleaned.fieldBindings,
    invalidReferences: [],
    idMap: prepared.idMap,
  };
}
