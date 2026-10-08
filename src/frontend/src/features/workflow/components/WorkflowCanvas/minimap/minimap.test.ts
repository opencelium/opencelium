import { describe, expect, it } from 'vitest';
import type { ConnectorMetaDTO } from '@entities/connector/model/types';
import type { LensBindingGraph } from '../../../lens/bindingLens.types';
import type { WorkflowEdgeModel, WorkflowNodeData, WorkflowNodeModel } from '../../../types/workflow.types';
import { buildMinimapModel } from './minimap.model';
import { fitViewBox, flowViewRect } from './minimapGeometry';
import { collectMinimapIssues } from './minimapIssues';
import { CONNECTOR_SLOT_COUNT } from './minimapPalette';

const SIZE = { width: 40, height: 40 };

const node = (id: string, x: number, y: number, data: Partial<WorkflowNodeData>) => ({
	id, type: data.kind, position: { x, y }, measured: SIZE,
	data: { title: id, ...data },
}) as unknown as WorkflowNodeModel;

const method = (id: string, x: number, y: number, connectorId: number, extra: Partial<WorkflowNodeData> = {}) =>
	node(id, x, y, { kind: 'connector', connector: { connectorId, title: `Connector ${connectorId}` }, ...extra });

const edge = (id: string, source: string, target: string, sourceHandle: string) =>
	({ id, source, target, sourceHandle }) as unknown as WorkflowEdgeModel;

const NO_BINDINGS: LensBindingGraph = { bindings: [], skipped: { malformed: 0, outsideScope: 0, unanchored: 0 } };

describe('buildMinimapModel', () => {
	const nodes = [
		node('start', 0, 0, { kind: 'start' }),
		method('a', 100, 0, 7),
		node('if', 200, 0, { kind: 'if' }),
		method('b', 200, 100, 3),
		node('note', 300, 0, { kind: 'comment' }),
	];

	it('counts methods and operators as steps, not the start node or comments', () => {
		expect(buildMinimapModel(nodes, []).stepCount).toBe(3);
	});

	// Colour follows the connector, so it must not depend on where the node sits.
	it('orders connector groups by id and adds only the neutral groups present', () => {
		const { groups } = buildMinimapModel(nodes, []);
		expect(groups.map((group) => group.key)).toEqual(['connector-3', 'connector-7', 'operator']);
	});

	it('folds connectors past the last colour into a shared swatch', () => {
		const many = Array.from({ length: CONNECTOR_SLOT_COUNT + 2 }, (_, index) => method(`m${index}`, index * 100, 0, index + 1));
		const slots = buildMinimapModel(many, []).groups.map((group) => group.kind === 'connector' && group.slot);
		expect(slots.slice(0, CONNECTOR_SLOT_COUNT)).toEqual([...Array(CONNECTOR_SLOT_COUNT).keys()]);
		expect(slots.slice(CONNECTOR_SLOT_COUNT)).toEqual(['other', 'other']);
	});

	it('bends a downward edge vertically first and a rightward one horizontally first', () => {
		const { lines } = buildMinimapModel(nodes, [edge('down', 'if', 'b', 'true'), edge('right', 'start', 'b', 'right')]);
		expect(lines.find((line) => line.id === 'down')!.points).toEqual([[220, 20], [220, 120], [220, 120]]);
		expect(lines.find((line) => line.id === 'right')!.points).toEqual([[20, 20], [220, 20], [220, 120]]);
	});

	it('skips joints, which are jumps rather than graph edges', () => {
		const joint = { ...edge('j', 'a', 'b', 'right'), data: { joint: true } } as WorkflowEdgeModel;
		expect(buildMinimapModel(nodes, [joint]).lines).toEqual([]);
	});
});

describe('collectMinimapIssues', () => {
	const collect = (nodes: WorkflowNodeModel[], extra: Partial<Parameters<typeof collectMinimapIssues>[0]> = {}) =>
		collectMinimapIssues({ nodes, bindingGraph: NO_BINDINGS, liveHealth: undefined, ...extra });

	it('flags an operator whose condition is empty, and not one that has one', () => {
		const configured = node('if1', 0, 0, { kind: 'if', conditionConfig: { operatorType: 'if', tree: {} as never, expression: 'a = b' } });
		const empty = node('loop1', 100, 0, { kind: 'loop' });
		expect(collect([configured, empty])).toEqual([
			{ nodeId: 'loop1', title: 'loop1', problems: [{ kind: 'operator-unconfigured', operator: 'loop' }] },
		]);
	});

	// The socket snapshot is newer than whatever the node was loaded with.
	it('prefers the live connector status over the stored one', () => {
		const stale = method('m', 0, 0, 5, { connector: { connectorId: 5, title: 'C', status: 'UP' } });
		const live = [{ connectorId: 5, status: 'DOWN', lastTestError: 'timeout' }] as ConnectorMetaDTO[];
		expect(collect([stale], { liveHealth: live })[0].problems)
			.toEqual([{ kind: 'connector', status: 'DOWN', lastError: 'timeout' }]);
		expect(collect([stale])).toEqual([]);
	});

	it('gathers every problem on a node, and groups broken bindings by reason', () => {
		const target = method('m', 0, 0, 1, { hasError: true, errorMessage: 'Rejected', testRunFailedVisible: true });
		const broken = (key: string, reason: 'out-of-scope' | 'missing-method') => ({
			key, invalidReason: reason, consumer: { nodeId: 'm' },
		});
		const bindingGraph = { ...NO_BINDINGS,
			bindings: [broken('1', 'out-of-scope'), broken('2', 'out-of-scope'), broken('3', 'missing-method')] } as unknown as LensBindingGraph;
		expect(collect([target], { bindingGraph })[0].problems).toEqual([
			{ kind: 'validation', message: 'Rejected' },
			{ kind: 'test-run', message: null },
			{ kind: 'binding', reason: 'out-of-scope', count: 2 },
			{ kind: 'binding', reason: 'missing-method', count: 1 },
		]);
	});

	it('lists issues left to right, then top to bottom', () => {
		const nodes = [node('c', 200, 0, { kind: 'if' }), node('b', 100, 50, { kind: 'if' }), node('a', 100, 0, { kind: 'if' })];
		expect(collect(nodes).map((issue) => issue.nodeId)).toEqual(['a', 'b', 'c']);
	});
});

describe('minimap geometry', () => {
	it('maps the pane back to flow coordinates', () => {
		expect(flowViewRect([-100, -50, 2], 400, 200)).toEqual({ x: 50, y: 25, width: 200, height: 100 });
	});

	// One scale on both axes, so markers stay round and the viewport keeps its shape.
	it('fits graph and view with a uniform scale, centred on the spare axis', () => {
		const box = fitViewBox({ x: 0, y: 0, width: 1000, height: 100 }, { x: 0, y: 0, width: 100, height: 100 }, 228, 128);
		expect(box.width / box.height).toBeCloseTo(228 / 128);
		expect(box.x + box.width / 2).toBeCloseTo(500);
		expect(box.y + box.height / 2).toBeCloseTo(50);
	});
});
