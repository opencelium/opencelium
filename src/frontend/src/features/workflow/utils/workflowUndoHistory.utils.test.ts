import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { buildWorkflowUndoSignature, hasWorkflowDragPreview } from './workflowUndoHistory.utils';

const nodes = [
	{ id: 'start-1', type: 'start', position: { x: 0, y: 0 }, data: { title: 'Start', kind: 'start' } },
	{
		id: 'method-1', type: 'connector', position: { x: 240, y: 0 },
		data: {
			title: 'GetAllUser', subtitle: 'getAllUser', kind: 'connector', color: '#C77E7E',
			methodConfig: { name: 'getAllUser', url: '/user', method: 'GET' },
		},
	},
] as unknown as WorkflowNodeModel[];

const edges = [
	{ id: 'e1', type: 'workflow-edge', source: 'start-1', target: 'method-1', data: { branch: 'true' } },
] as unknown as WorkflowEdgeModel[];

const signatureOf = (
	nextNodes: WorkflowNodeModel[] = nodes,
	nextEdges: WorkflowEdgeModel[] = edges,
	fieldBindings?: unknown[],
) => buildWorkflowUndoSignature(nextNodes, nextEdges, fieldBindings);

const patchMethodNode = (data: Record<string, unknown>) => nodes.map((node) =>
	node.id !== 'method-1' ? node : { ...node, data: { ...node.data, ...data } },
) as WorkflowNodeModel[];

describe('buildWorkflowUndoSignature', () => {
	it('ignores render-only node state so selection and decorations never land on the undo stack', () => {
		const decorated = patchMethodNode({
			highlighted: true, searchHighlighted: true, hasError: true, errorMessage: 'boom',
			isLeaf: true, duplicateMethodIndex: 2, testRunActive: true, hideAddControls: true,
			onDeleteNode: () => {},
		}).map((node) => ({ ...node, selected: true, dragging: true, measured: { width: 96, height: 96 } }));
		expect(signatureOf(decorated)).toBe(signatureOf());
	});

	it('ignores render-only edge state', () => {
		const decorated = edges.map((edge) => ({
			...edge,
			selected: true,
			data: { ...edge.data, highlighted: true, testRunActive: true, testRunNonce: 4 },
		})) as WorkflowEdgeModel[];
		expect(signatureOf(nodes, decorated)).toBe(signatureOf());
	});

	it('is stable against key order, so re-saving an unchanged config is not a new edit', () => {
		const reordered = patchMethodNode({
			methodConfig: { method: 'GET', url: '/user', name: 'getAllUser' },
		});
		expect(signatureOf(reordered)).toBe(signatureOf());
	});

	it('ignores sub-pixel drag noise but registers a real move', () => {
		const nudged = nodes.map((node) => node.id !== 'method-1' ? node
			: { ...node, position: { x: 240.4, y: 0.2 } }) as WorkflowNodeModel[];
		expect(signatureOf(nudged)).toBe(signatureOf());

		const moved = nodes.map((node) => node.id !== 'method-1' ? node
			: { ...node, position: { x: 300, y: 40 } }) as WorkflowNodeModel[];
		expect(signatureOf(moved)).not.toBe(signatureOf());
	});

	it('ignores what a request-dialog round-trip normalises when nothing was edited', () => {
		// Closing the URL/body dialog always writes the config back through the
		// legacy adapter, which fills in `response`, remints query-row ids and
		// appends the editor's blank template row. None of that is a user edit.
		const roundTripped = patchMethodNode({
			methodConfig: {
				name: 'getAllUser', url: '/user', method: 'GET',
				response: { responseId: 'response-method-1', success: { status: '200' } },
				queryParams: [{ id: 'freshly-minted', key: '', value: '', enabled: false }],
			},
		});
		expect(signatureOf(roundTripped)).toBe(signatureOf());
	});

	it('still registers a real query-param edit', () => {
		const edited = patchMethodNode({
			methodConfig: {
				name: 'getAllUser', url: '/user', method: 'GET',
				queryParams: [{ id: 'row-1', key: 'page', value: '2', enabled: true }],
			},
		});
		expect(signatureOf(edited)).not.toBe(signatureOf());
	});

	it('registers authored changes: config, label, colour, topology and field bindings', () => {
		expect(signatureOf(patchMethodNode({
			methodConfig: { name: 'getAllUser', url: '/user/1', method: 'GET' },
		}))).not.toBe(signatureOf());
		expect(signatureOf(patchMethodNode({ subtitle: 'renamed', labelEdited: true })))
			.not.toBe(signatureOf());
		expect(signatureOf(patchMethodNode({ color: '#6477AB' }))).not.toBe(signatureOf());
		expect(signatureOf(nodes.slice(0, 1))).not.toBe(signatureOf());
		expect(signatureOf(nodes, [])).not.toBe(signatureOf());
		expect(signatureOf(nodes, edges, [{ enhancement: { args: { one: '#C77E7E' } } }]))
			.not.toBe(signatureOf());
	});
});

describe('hasWorkflowDragPreview', () => {
	it('detects an in-flight drag so half-finished graphs are not recorded', () => {
		expect(hasWorkflowDragPreview(nodes)).toBe(false);
		expect(hasWorkflowDragPreview(patchMethodNode({ dragGhost: true }))).toBe(true);
		expect(hasWorkflowDragPreview(patchMethodNode({ dropPlaceholder: true }))).toBe(true);
	});
});
