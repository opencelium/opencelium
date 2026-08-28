import { describe, expect, it } from 'vitest';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';
import { deleteNodeGraph } from './deleteNodeGraph';
import { buildReferenceRemapTargets } from './graph.referenceRemapTargets';

const config = (overrides: Record<string, unknown> = {}) => ({
	url: '', headers: {}, queryParams: [], endpointArgs: {},
	bodyFormat: 'json', bodyData: 'json', body: {}, ...overrides,
});

const method = (id: string, color: string, body?: unknown) => ({
	id, type: 'connector', position: { x: 0, y: 0 },
	data: { title: 'Method', subtitle: id, kind: 'connector', color,
		methodConfig: config({ body: body ?? {} }) },
}) as unknown as WorkflowNodeModel;

const startNode = {
	id: 'start-1', type: 'start', position: { x: 0, y: 0 },
	data: { title: 'Start', kind: 'start' },
} as unknown as WorkflowNodeModel;

const edge = (id: string, source: string, target: string) =>
	({ id, type: 'workflow-edge', source, target }) as unknown as WorkflowEdgeModel;

const reads = (color: string) => ({ userId: `${color}.(response).body.$.id` });

const M1 = '#3fa9f5';
const M2 = '#7ed321';
const M3 = '#f5a623';
const M4 = '#bd10e0';

// start → m1 → m2 → m3, where m3 reads m2.
const chain = () => ({
	nodes: [startNode, method('m1', M1), method('m2', M2), method('m3', M3, reads(M2))],
	edges: [edge('e1', 'start-1', 'm1'), edge('e2', 'm1', 'm2'), edge('e3', 'm2', 'm3')],
});

const deleting = (before: { nodes: WorkflowNodeModel[]; edges: WorkflowEdgeModel[] },
	nodeId: string, fieldBindings?: unknown[]) => {
	const after = deleteNodeGraph(nodeId, before.nodes, before.edges);
	return buildReferenceRemapTargets(before, after, fieldBindings);
};

describe('buildReferenceRemapTargets', () => {
	it('offers nothing when the change breaks nothing', () => {
		expect(deleting(chain(), 'm3')).toEqual([]);
	});

	it('names the method going away and the steps that read it', () => {
		const [target] = deleting(chain(), 'm2');
		expect(target.color).toBe(M2);
		expect(target.label).toBe('m2');
		expect(target.consumerNodeIds).toEqual(['m3']);
	});

	// A remap rewrites one colour everywhere at once, so anything it offers has
	// to be readable by every step that reads the doomed method.
	it('offers only what the reading step can actually read', () => {
		const [target] = deleting(chain(), 'm2');
		expect(target.candidates.map((candidate) => candidate.nodeId)).toEqual(['m1']);
	});

	it('leaves out a candidate that only some of the readers can see', () => {
		// start → m1 → m2 → m3 → m4, where m2 and m4 both read m3. m1 is upstream
		// of both readers; anything between them is not.
		const before = {
			nodes: [startNode, method('m1', M1), method('m2', M2, reads(M3)),
				method('m3', M3), method('m4', M4, reads(M3))],
			edges: [edge('e1', 'start-1', 'm1'), edge('e2', 'm1', 'm2'),
				edge('e3', 'm2', 'm3'), edge('e4', 'm3', 'm4')],
		};

		const [target] = deleting(before, 'm3');

		expect(target.consumerNodeIds.sort()).toEqual(['m2', 'm4']);
		// m2 is upstream of m4 but not of itself, so only m1 survives the rule.
		expect(target.candidates.map((candidate) => candidate.nodeId)).toEqual(['m1']);
	});

	it('reports a doomed method with nothing to replace it as an empty offer', () => {
		// start → m1 → m2, m2 reading m1: deleting m1 leaves nothing upstream.
		const before = {
			nodes: [startNode, method('m1', M1), method('m2', M2, reads(M1))],
			edges: [edge('e1', 'start-1', 'm1'), edge('e2', 'm1', 'm2')],
		};

		const [target] = deleting(before, 'm1');

		expect(target.color).toBe(M1);
		expect(target.candidates).toEqual([]);
	});

	it('sees a reference that lives in an enhancement, not in a field value', () => {
		const before = {
			nodes: [startNode, method('m1', M1), method('m2', M2), method('m3', M3)],
			edges: [edge('e1', 'start-1', 'm1'), edge('e2', 'm1', 'm2'), edge('e3', 'm2', 'm3')],
		};
		const fieldBindings = [{
			enhancement: { enhanceId: 'en-1', language: 'js', script: 'return VAR_0;',
				args: { VAR_0: `${M2}.(response).body.$.id`,
					RESULT_VAR: `${M3}.(request).body.$.total` } },
		}];

		const [target] = deleting(before, 'm2', fieldBindings);

		expect(target.color).toBe(M2);
		expect(target.consumerNodeIds).toEqual(['m3']);
		expect(target.candidates.map((candidate) => candidate.nodeId)).toEqual(['m1']);
	});

	// A path choice needs to know which fields are actually read, and two steps
	// reading the same field are one question, not two.
	it('lists each field of the doomed method that is read, once', () => {
		const before = {
			nodes: [startNode, method('m1', M1), method('m2', M2),
				method('m3', M3, { a: `${M2}.(response).body.$.id`,
					b: `${M2}.(response).body.$.name` }),
				method('m4', M4, { c: `${M2}.(response).body.$.id` })],
			edges: [edge('e1', 'start-1', 'm1'), edge('e2', 'm1', 'm2'),
				edge('e3', 'm2', 'm3'), edge('e4', 'm3', 'm4')],
		};

		const [target] = deleting(before, 'm2');

		expect(target.sources.map((source) => source.label).sort())
			.toEqual(['body.$.id', 'body.$.name']);
		expect(target.sources.map((source) => source.messageProperty)).toEqual(['body', 'body']);
	});

	it('carries the replacement method itself, for the field picker to read', () => {
		const [target] = deleting(chain(), 'm2');
		expect(target.candidates[0].method.id).toBe('m1');
	});

	it('sees the field a script reads, not just the ones in a field value', () => {
		const before = {
			nodes: [startNode, method('m1', M1), method('m2', M2), method('m3', M3)],
			edges: [edge('e1', 'start-1', 'm1'), edge('e2', 'm1', 'm2'), edge('e3', 'm2', 'm3')],
		};
		const fieldBindings = [{
			enhancement: { enhanceId: 'en-1', language: 'js', script: 'return VAR_0;',
				args: { VAR_0: `${M2}.(response).body.$.items[0].id`,
					RESULT_VAR: `${M3}.(request).body.$.total` } },
		}];

		const [target] = deleting(before, 'm2', fieldBindings);

		// The RESULT_VAR names the field being *filled* — the consumer's own, and
		// not something a replacement provider changes.
		expect(target.sources.map((source) => source.label)).toEqual(['body.$.items[0].id']);
	});
});
