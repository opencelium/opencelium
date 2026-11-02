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

type WorkflowConnectorRef = WorkflowNodeModel['data']['connector'];
type PasteTarget = { nodeId: string; direction: 'right' | 'bottom' };

const CLIPBOARD_START_ID = 'start-1';

export function findInvalidClipboardReferences(nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[],
	insertedIds: Set<string>, fieldBindings: unknown[]) {
	return uniqueReferences([
		...findInvalidWorkflowReferences(nodes, edges, insertedIds, fieldBindings),
		...findOutOfScopeIteratorReferences(nodes, edges, insertedIds, fieldBindings),
	]);
}

// Roots are chained one after another behind a synthetic start node so the
// clone/insert helpers see one connected graph, as they would in the source.
const chainRootsFromStart = (snapshot: WorkflowClipboard) => {
	const start: WorkflowNodeModel = { id: CLIPBOARD_START_ID, type: 'start', position: { x: 0, y: 0 },
		data: { title: 'Start', kind: 'start' } };
	const nodes = [start, ...snapshot.nodes];
	const handleAfter = (id: string | undefined) => {
		const type = nodes.find((node) => node.id === id)?.type;
		if (type === 'if') return 'false';
		if (type === 'loop') return 'right';
		return undefined;
	};
	const rootEdges: WorkflowEdgeModel[] = snapshot.rootIds.map((id, index) => ({
		id: `clipboard-root-${index}`,
		source: snapshot.rootIds[index - 1] ?? CLIPBOARD_START_ID,
		target: id,
		sourceHandle: handleAfter(snapshot.rootIds[index - 1]),
	}));
	const edges = [...snapshot.edges, ...rootEdges.filter((edge) => !snapshot.edges.some((existing) =>
		existing.source === edge.source && existing.target === edge.target))];
	return { nodes, edges };
};

const randomUnusedColor = (used: Set<string>) => {
	let next: string;
	do { next = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`; } while (used.has(next));
	used.add(next);
	return next;
};

export function prepareClipboardPaste(snapshot: WorkflowClipboard, targetNodes: WorkflowNodeModel[],
	targetEdges: WorkflowEdgeModel[], targetBindings: unknown[] | undefined, target: PasteTarget,
	connectors: Map<string, WorkflowConnectorRef>, skipped: Set<string>, isolateExternal = true) {
	let source = chainRootsFromStart(snapshot);
	skipped.forEach((id) => { source = deleteNodeGraph(id, source.nodes, source.edges); });
	source.nodes = source.nodes.map((node) => ({ ...node, data: { ...node.data,
		connector: connectors.get(node.id) ?? node.data.connector } }));

	const copied = source.nodes.filter((node) => node.id !== CLIPBOARD_START_ID);
	const copiedColors = new Set(copied.map((node) => normalizeReferenceColor(node.data.color)).filter(Boolean));
	const externalColors = new Set(collectReferenceOccurrences(copied, snapshot.fieldBindings)
		.map(({ parsed }) => normalizeReferenceColor(parsed.color)).filter((color) => !copiedColors.has(color)));
	const used = new Set([...targetNodes, ...copied].flatMap((node) =>
		[normalizeReferenceColor(node.data.color), ...collectReferenceColors(node.data)]));
	// External references get a color no target step owns, so they can't bind to
	// an unrelated target step that happens to share the source color.
	const isolated = new Map<string, string>();
	if (isolateExternal) externalColors.forEach((color) => isolated.set(color, randomUnusedColor(used)));

	const remapped = remapWorkflowReferences(source.nodes, snapshot.fieldBindings,
		{ colors: isolated, references: new Map() });
	source.nodes = remapped.nodes;
	const sourceNodes = source.nodes.filter((node) => node.id !== CLIPBOARD_START_ID &&
		(node.type !== 'comment' || source.nodes.some((anchor) => anchor.id === node.data.comment?.anchorNodeId)));
	const sourceIds = new Set(sourceNodes.map((node) => node.id));
	const cloned = cloneWorkflowSubtree(sourceNodes,
		source.edges.filter((edge) => sourceIds.has(edge.source) && sourceIds.has(edge.target)),
		targetNodes, targetEdges, source);
	const clonedBindings = cloneWorkflowFieldBindings(remapped.fieldBindings, cloned.colorMap,
		cloned.clonedColorBySourceId, sourceNodes, source.nodes, source.edges)
		?.slice(remapped.fieldBindings?.length ?? 0) ?? [];

	let graph = { nodes: targetNodes, edges: targetEdges };
	let destination = target;
	snapshot.rootIds.filter((id) => sourceIds.has(id)).forEach((id) => {
		const subtree = getWorkflowSubtree(id, sourceNodes, source.edges);
		const ids = new Set(subtree.nodes.map((node) => cloned.idMap.get(node.id)));
		const root = cloned.idMap.get(id)!;
		const insertNodes = cloned.nodes.filter((node) => ids.has(node.id) && node.type !== 'comment');
		insertNodes.sort((a, b) => a.id === root ? -1 : b.id === root ? 1 : 0);
		graph = insertWorkflowSubtree(insertNodes,
			cloned.edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target)),
			destination, graph.nodes, graph.edges);
		destination = { nodeId: root, direction: 'right' };
	});

	const insertedIds = new Set(cloned.idMap.values());
	const comments = cloned.nodes.filter((node) => node.type === 'comment').map((node) => ({ ...node,
		data: { ...node.data, comment: node.data.comment ? { ...node.data.comment,
			anchorNodeId: cloned.idMap.get(node.data.comment.anchorNodeId) ?? node.data.comment.anchorNodeId,
		} : undefined } }));
	graph.nodes = [...graph.nodes, ...comments].map((node) => ({ ...node, selected: insertedIds.has(node.id) }));
	const fieldBindings = [...(targetBindings ?? []), ...clonedBindings];
	// Stand-ins for the source-only steps, so the remap dialog can list them by name.
	const ghosts: WorkflowNodeModel[] = [...isolated].map(([original, color]) => ({
		id: createShortId('external'), type: 'system', position: { x: 0, y: 0 },
		data: { title: snapshot.externalTitles?.[original] ?? original, kind: 'system', color },
	}));
	const before = { ...graph, nodes: [...graph.nodes, ...ghosts] };
	return { ...graph, fieldBindings, insertedIds, idMap: cloned.idMap, before,
		targets: buildReferenceRemapTargets(before, graph, fieldBindings),
		invalidReferences: findInvalidClipboardReferences(graph.nodes, graph.edges, insertedIds, fieldBindings) };
}
