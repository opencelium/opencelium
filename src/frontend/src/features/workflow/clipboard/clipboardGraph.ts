import { createShortId } from '@shared/lib/createId';
import type { WorkflowClipboard } from './workflowClipboard';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { cloneWorkflowSubtree, getWorkflowSubtree } from '../utils/graph.subtreeClone';
import { cloneWorkflowFieldBindings } from '../utils/graph.fieldBindingClone';
import { insertWorkflowSubtree } from '../utils/graph.subtreeInsertion';
import { deleteNodeGraph } from '../utils/deleteNodeGraph';
import { collectReferenceOccurrences } from '../utils/graph.referenceLocations';
import { collectReferenceColors, normalizeReferenceColor, uniqueReferences } from '../utils/graph.referenceColors';
import { remapWorkflowReferences } from '../utils/graph.referenceRemap';
import { buildReferenceRemapTargets } from '../utils/graph.referenceRemapTargets';
import { findInvalidWorkflowReferences } from '../utils/graph.invalidReferences';
import { findOutOfScopeIteratorReferences } from '../utils/graph.iteratorScope';

export function findInvalidClipboardReferences(nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[],
    insertedIds: Set<string>, fieldBindings: unknown[]) {
    return uniqueReferences([
        ...findInvalidWorkflowReferences(nodes, edges, insertedIds, fieldBindings),
        ...findOutOfScopeIteratorReferences(nodes, edges, insertedIds, fieldBindings),
    ]);
}

export function prepareClipboardPaste(snapshot: WorkflowClipboard, targetNodes: WorkflowNodeModel[],
    targetEdges: WorkflowEdgeModel[], targetBindings: unknown[] | undefined,
    target: {nodeId: string; direction: 'right' | 'bottom'},
    connectors: Map<string, WorkflowNodeModel['data']['connector']>, skipped: Set<string>, isolateExternal = true) {
    const startId = 'start-1';
    const start: WorkflowNodeModel = {id: startId, type: 'start', position: {x: 0, y: 0},
        data: {title: 'Start', kind: 'start'}};
    let source = {nodes: [start, ...snapshot.nodes], edges: [...snapshot.edges]};
    source.edges.push(...snapshot.rootIds.map((id, index) => ({
        id: `clipboard-root-${index}`, source: snapshot.rootIds[index - 1] ?? startId,
        target: id, sourceHandle: source.nodes.find((node) => node.id === snapshot.rootIds[index - 1])?.type === 'if'
            ? 'false' : source.nodes.find((node) => node.id === snapshot.rootIds[index - 1])?.type === 'loop' ? 'right' : undefined,
    })).filter((edge) => !source.edges.some((existing) => existing.source === edge.source && existing.target === edge.target)));
    skipped.forEach((id) => { source = deleteNodeGraph(id, source.nodes, source.edges); });
    source.nodes = source.nodes.map((node) => ({...node, data: {...node.data,
        connector: connectors.get(node.id) ?? node.data.connector}}));
    const copied = source.nodes.filter((node) => node.id !== startId);
    const copiedColors = new Set(copied.map((node) => normalizeReferenceColor(node.data.color)).filter(Boolean));
    const externalColors = new Set(collectReferenceOccurrences(copied, snapshot.fieldBindings)
        .map(({parsed}) => normalizeReferenceColor(parsed.color)).filter((color) => !copiedColors.has(color)));
    const used = new Set([...targetNodes, ...copied].flatMap((node) =>
        [normalizeReferenceColor(node.data.color), ...collectReferenceColors(node.data)]));
    const isolated = new Map<string, string>();
    if (isolateExternal) externalColors.forEach((color) => {
        let next: string;
        do { next = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`; } while (used.has(next));
        used.add(next); isolated.set(color, next);
    });
    const remapped = remapWorkflowReferences(source.nodes, snapshot.fieldBindings,
        {colors: isolated, references: new Map()});
    source.nodes = remapped.nodes;
    const sourceNodes = source.nodes.filter((node) => node.id !== startId &&
        (node.type !== 'comment' || source.nodes.some((anchor) => anchor.id === node.data.comment?.anchorNodeId)));
    const sourceIds = new Set(sourceNodes.map((node) => node.id));
    const cloned = cloneWorkflowSubtree(sourceNodes,
        source.edges.filter((edge) => sourceIds.has(edge.source) && sourceIds.has(edge.target)),
        targetNodes, targetEdges, source);
    const clonedBindings = cloneWorkflowFieldBindings(remapped.fieldBindings, cloned.colorMap,
        cloned.clonedColorBySourceId, sourceNodes, source.nodes, source.edges)
        ?.slice(remapped.fieldBindings?.length ?? 0) ?? [];
    let graph = {nodes: targetNodes, edges: targetEdges};
    let destination = target;
    snapshot.rootIds.filter((id) => sourceIds.has(id)).forEach((id) => {
        const subtree = getWorkflowSubtree(id, sourceNodes, source.edges);
        const ids = new Set(subtree.nodes.map((node) => cloned.idMap.get(node.id)));
        const root = cloned.idMap.get(id)!;
        const insertNodes = cloned.nodes.filter((node) => ids.has(node.id) && node.type !== 'comment');
        insertNodes.sort((a, b) => a.id === root ? -1 : b.id === root ? 1 : 0);
        graph = insertWorkflowSubtree(insertNodes, cloned.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target)),
            destination, graph.nodes, graph.edges);
        destination = {nodeId: root, direction: 'right'};
    });
    const insertedIds = new Set(cloned.idMap.values());
    const comments = cloned.nodes.filter((node) => node.type === 'comment').map((node) => ({...node,
        data: {...node.data, comment: node.data.comment ? {...node.data.comment,
            anchorNodeId: cloned.idMap.get(node.data.comment.anchorNodeId) ?? node.data.comment.anchorNodeId} : undefined}}));
    graph.nodes = [...graph.nodes, ...comments].map((node) => ({...node, selected: insertedIds.has(node.id)}));
    const fieldBindings = [...(targetBindings ?? []), ...clonedBindings];
    const ghosts: WorkflowNodeModel[] = [...isolated].map(([old, color]) => ({
        id: createShortId('external'), type: 'system', position: {x: 0, y: 0},
        data: {title: old, kind: 'system', color},
    }));
    const before = {...graph, nodes: [...graph.nodes, ...ghosts]};
    return {...graph, fieldBindings, insertedIds, idMap: cloned.idMap, before,
        targets: buildReferenceRemapTargets(before, graph, fieldBindings),
        invalidReferences: findInvalidClipboardReferences(graph.nodes, graph.edges, insertedIds, fieldBindings)};
}
