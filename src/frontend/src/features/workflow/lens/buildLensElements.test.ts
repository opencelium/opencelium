import { describe, expect, it, vi } from 'vitest';
import type { WorkflowNodeModel } from '../types/workflow.types';
import type { LensBinding, LensBindingGraph, LensBindingSource } from './bindingLens.types';
import { buildLensElements } from './buildLensElements';

const node = (id: string, name: string, color: string, x = 0) => ({
	id, type: 'connector', position: { x, y: 100 },
	data: { title: 'Method', subtitle: name, kind: 'connector', color },
}) as unknown as WorkflowNodeModel;

const nodes = [
	node('m1', 'GetUsers', '#3fa9f5', 0),
	node('m2', 'CreateTicket', '#f5a623', 300),
	node('m3', 'Notify', '#7ed321', 600),
];

const endpoint = (nodeId: string | null, color: string, path: string) => ({
	nodeId, label: nodeId === 'm1' ? 'GetUsers' : nodeId === 'm2' ? 'CreateTicket'
		: nodeId === 'm3' ? 'Notify' : null,
	color, direction: 'response' as const, messageProperty: 'body', field: path,
	path: `body.$.${path}`,
});

const enhancement = (enhanceId: string, varKey = 'VAR_0'): LensBindingSource =>
	({ kind: 'enhancement', enhanceId, varKey });

const lensBinding = (overrides: Partial<LensBinding> = {}): LensBinding => ({
	key: 'en-1:VAR_0',
	source: { kind: 'enhancement', enhanceId: 'en-1', varKey: 'VAR_0' },
	consumer: { ...endpoint('m2', '#f5a623', 'userId'), direction: 'request' },
	provider: endpoint('m1', '#3fa9f5', 'id'),
	isScript: false,
	invalidReason: null,
	unreadableProviderNodeId: null,
	...overrides,
});

const graph = (bindings: LensBinding[],
	skipped = { malformed: 0, outsideScope: 0, unanchored: 0 }): LensBindingGraph =>
	({ bindings, skipped });

const actions = () => ({ onExpandPair: vi.fn(), onCollapseCard: vi.fn(),
	onSelectBinding: vi.fn() });

// Every binding in this fixture is consumed by m2, so focusing it is the
// equivalent of the lens's old draw-everything default.
const view = (expandedNodeIds: string[] = [], selectedKey: string | null = null,
	focusNodeId: string | null = 'm2') => ({ focusNodeId, expandedNodeIds, selectedKey });

describe('buildLensElements', () => {
	it('collapses a pair into one arc while both ends are collapsed', () => {
		const { nodes: cards, edges } = buildLensElements(graph([
			lensBinding(),
			lensBinding({ key: 'en-2:VAR_0', source: enhancement('en-2'), isScript: true }),
		]), nodes, view(), actions());
		expect(cards).toHaveLength(0);
		expect(edges).toHaveLength(1);
		expect(edges[0]).toMatchObject({ id: 'lens:pair:m1:m2', source: 'm1', target: 'm2',
			sourceHandle: 'bottom', targetHandle: 'left', selectable: false });
		expect(edges[0].data).toMatchObject({ variant: 'pair', count: 2, invalidCount: 0,
			hasScript: true, color: '#3fa9f5', bindingKeys: ['en-1:VAR_0', 'en-2:VAR_0'] });
	});

	it('expands both ends into cards and splits the arc onto field rows', () => {
		const { nodes: cards, edges } = buildLensElements(graph([lensBinding()]),
			nodes, view(['m1', 'm2']), actions());
		expect(edges).toHaveLength(1);
		expect(edges[0]).toMatchObject({
			id: 'lens:ref:en-1:VAR_0',
			source: 'lens:card:m1', sourceHandle: 'source:body.$.id',
			target: 'lens:card:m2', targetHandle: 'target:body.$.userId',
		});
		expect(edges[0].data).toMatchObject({ variant: 'reference', count: 1,
			sourcePath: 'body.$.id', targetPath: 'body.$.userId' });

		expect(cards.map((card) => card.id).sort()).toEqual(['lens:card:m1', 'lens:card:m2']);
		const provider = cards.find((card) => card.id === 'lens:card:m1');
		expect(provider).toMatchObject({ type: 'binding-lens-card', draggable: false,
			// centred under the 62px circle, whose position is its centre
			position: { x: -120, y: 164 } });
		expect(provider?.data).toMatchObject({ anchorNodeId: 'm1', label: 'GetUsers',
			rows: [{ role: 'source', path: 'body.$.id', counterpartLabel: 'CreateTicket' }] });
		expect(cards.find((card) => card.id === 'lens:card:m2')?.data.rows)
			.toMatchObject([{ role: 'target', path: 'body.$.userId', counterpartLabel: 'GetUsers' }]);
	});

	it('keeps a half-expanded arc attached to the collapsed end node', () => {
		const { edges } = buildLensElements(graph([lensBinding()]), nodes, view(['m2']), actions());
		expect(edges[0]).toMatchObject({
			source: 'm1', sourceHandle: 'bottom',
			target: 'lens:card:m2', targetHandle: 'target:body.$.userId',
		});
	});

	it('merges several bindings into one row per field, keeping every key', () => {
		const { nodes: cards } = buildLensElements(graph([
			lensBinding(),
			lensBinding({ key: 'en-3:VAR_0', source: enhancement('en-3'), isScript: true,
				provider: endpoint('m3', '#7ed321', 'x') }),
		]), nodes, view(['m2']), actions());
		const rows = cards.find((card) => card.id === 'lens:card:m2')?.data.rows ?? [];
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			path: 'body.$.userId', hasScript: true, bindingKeys: ['en-1:VAR_0', 'en-3:VAR_0'],
			// two different providers feed this field, so no single counterpart
			counterpartLabel: null,
		});
	});

	it('opens a row backed by one enhancement, whichever reference feeds it', () => {
		const handlers = actions();
		const { nodes: cards } = buildLensElements(graph([
			lensBinding({ isScript: true }),
			lensBinding({ key: 'en-1:VAR_1', source: enhancement('en-1', 'VAR_1'), isScript: true,
				provider: endpoint('m3', '#7ed321', 'x') }),
		]), nodes, view(['m2']), handlers);
		const rows = cards[0]?.data.rows ?? [];
		expect(rows).toHaveLength(1);
		rows[0].onActivate?.();
		// Both references are the same enhancement, so both open the same editor.
		expect(handlers.onSelectBinding).toHaveBeenCalledWith('en-1:VAR_0');
	});

	it('leaves a row spanning several enhancements without an action', () => {
		const { nodes: cards } = buildLensElements(graph([
			lensBinding(),
			lensBinding({ key: 'en-4:VAR_0', source: enhancement('en-4'),
				consumer: { ...endpoint('m3', '#7ed321', 'ref'), direction: 'request' } }),
		]), nodes, view(['m1'], null, 'm1'), actions());
		// One response field read by two methods is two editors: the row cannot
		// pick between them, its two arcs can.
		const rows = cards[0]?.data.rows ?? [];
		expect(rows).toHaveLength(1);
		expect(rows[0].bindingKeys).toHaveLength(2);
		expect(rows[0].onActivate).toBeUndefined();
	});

	it('anchors a broken reference on the method it names and marks the row', () => {
		const { nodes: cards, edges } = buildLensElements(graph([
			lensBinding({ provider: endpoint(null, '#7ed321', 'ticketId'),
				invalidReason: 'out-of-scope', unreadableProviderNodeId: 'm3' }),
		]), nodes, view(['m3']), actions());
		expect(edges[0]).toMatchObject({ source: 'lens:card:m3',
			sourceHandle: 'source:body.$.ticketId', target: 'm2' });
		expect(cards[0]?.data.rows).toMatchObject([{ role: 'source', isBroken: true }]);
	});

	it('expands a pair that stands for several bindings', () => {
		const handlers = actions();
		const { edges } = buildLensElements(graph([
			lensBinding(),
			lensBinding({ key: 'en-9:VAR_0', source: enhancement('en-9') }),
		]), nodes, view(), handlers);
		expect(edges[0].data?.activates).toBe('expand');
		edges[0].data?.onActivate?.();
		expect(handlers.onExpandPair).toHaveBeenCalledWith(['m1', 'm2']);
		expect(handlers.onSelectBinding).not.toHaveBeenCalled();
	});

	it('opens a one-binding pair straight into the editor', () => {
		const handlers = actions();
		const { edges } = buildLensElements(graph([lensBinding()]), nodes, view(), handlers);
		expect(edges[0].data?.activates).toBe('select');
		edges[0].data?.onActivate?.();
		expect(handlers.onSelectBinding).toHaveBeenCalledWith('en-1:VAR_0');
		expect(handlers.onExpandPair).not.toHaveBeenCalled();
	});

	it('selects an expanded field arc and collapses through its card', () => {
		const handlers = actions();
		const { nodes: cards, edges } = buildLensElements(graph([lensBinding()]),
			nodes, view(['m1']), handlers);
		edges[0].data?.onActivate?.();
		expect(handlers.onSelectBinding).toHaveBeenCalledWith('en-1:VAR_0');
		cards[0].data.onCollapse?.();
		expect(handlers.onCollapseCard).toHaveBeenCalledWith('m1');
	});

	it('marks the selected binding on both its arc and its field rows', () => {
		const { nodes: cards, edges } = buildLensElements(graph([
			lensBinding(),
			lensBinding({ key: 'en-8:VAR_0', source: enhancement('en-8'),
				provider: endpoint('m3', '#7ed321', 'other') }),
		]), nodes, view(['m1', 'm2'], 'en-1:VAR_0'), actions());
		expect(edges.find((edge) => edge.id === 'lens:ref:en-1:VAR_0')?.data?.isSelected).toBe(true);
		expect(edges.find((edge) => edge.id === 'lens:ref:en-8:VAR_0')?.data?.isSelected).toBe(false);
		expect(cards.find((card) => card.id === 'lens:card:m1')?.data.rows)
			.toMatchObject([{ path: 'body.$.id', isSelected: true }]);
	});

	it('summarises regardless of expansion, counting what it cannot draw', () => {
		const { summary } = buildLensElements(graph([
			lensBinding(),
			lensBinding({ key: 'en-5:VAR_0', isScript: true }),
			lensBinding({ key: 'en-6:VAR_0', provider: endpoint(null, '#000001', 'y'),
				invalidReason: 'missing-method' }),
		], { malformed: 1, outsideScope: 2, unanchored: 0 }), nodes, view(['m1']), actions());
		expect(summary).toEqual({ total: 3, direct: 2, script: 1, invalid: 1, notShown: 4 });
	});

	it('draws nothing until a method is focused', () => {
		const unfocused = buildLensElements(graph([lensBinding()]), nodes,
			view([], null, null), actions());
		expect(unfocused).toMatchObject({ nodes: [], edges: [], summary: { total: 1 } });
	});

	it('draws only the bindings the focused method takes part in', () => {
		const { edges } = buildLensElements(graph([
			lensBinding(),
			lensBinding({ key: 'en-7:VAR_0', source: enhancement('en-7'),
				provider: endpoint('m3', '#7ed321', 'ref') }),
		]), nodes, view([], null, 'm1'), actions());
		expect(edges).toHaveLength(1);
		expect(edges[0]).toMatchObject({ id: 'lens:pair:m1:m2' });
	});

	it('gives a reference whose method is gone a row on the method that wanted it', () => {
		const { nodes: cards, edges } = buildLensElements(graph([
			lensBinding({ provider: endpoint(null, '#000001', 'ticketId'),
				invalidReason: 'missing-method' }),
		]), nodes, view(['m2']), actions());
		// No arc — there is no second end to draw one to — but the field it fills
		// still says so, which is the only place this binding is visible at all.
		expect(edges).toHaveLength(0);
		expect(cards[0]?.data.rows).toMatchObject([
			{ role: 'target', path: 'body.$.userId', isBroken: true, counterpartLabel: null },
		]);
	});

	it('draws nothing for a workflow with no bindings', () => {
		const empty = buildLensElements(graph([]), nodes, view(), actions());
		expect(empty).toMatchObject({ nodes: [], edges: [],
			summary: { total: 0, notShown: 0 } });
	});
});
