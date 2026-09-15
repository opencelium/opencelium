import { describe, expect, it } from 'vitest';
import { buildConnectionPayload } from '../../../api/connectionPayload';
import { initialEdges, initialNodes } from '../../../data/initialGraph';
import { workflowJsonSchema } from './workflowJson.schema';

describe('workflowJsonSchema', () => {
	it('accepts the exact payload produced by buildConnectionPayload', () => {
		const payload = buildConnectionPayload({
			title: 'Workflow',
			description: '',
			nodes: initialNodes,
			edges: initialEdges,
			fieldBindings: [],
			categoryId: null,
		});

		expect(workflowJsonSchema.safeParse(payload).success).toBe(true);
	});

	it.each([
		['title', (payload: Record<string, unknown>) => { payload.title = ''; }],
		['name', (payload: Record<string, unknown>) => { payload.name = ''; }],
		['description', (payload: Record<string, unknown>) => { payload.description = null; }],
		['categoryId', (payload: Record<string, unknown>) => { payload.categoryId = 'invalid'; }],
		['fieldBinding', (payload: Record<string, unknown>) => { payload.fieldBinding = {}; }],
		['fromConnector.methods', (payload: Record<string, unknown>) => {
			(payload.fromConnector as Record<string, unknown>).methods = null;
		}],
		['fromConnector.operators', (payload: Record<string, unknown>) => {
			(payload.fromConnector as Record<string, unknown>).operators = null;
		}],
		['ui.workflowNodes', (payload: Record<string, unknown>) => {
			(payload.ui as Record<string, unknown>).workflowNodes = null;
		}],
		['ui.workflowEdges', (payload: Record<string, unknown>) => {
			(payload.ui as Record<string, unknown>).workflowEdges = null;
		}],
		['toConnector', (payload: Record<string, unknown>) => { payload.toConnector = {}; }],
	])('rejects malformed %s', (path, mutate) => {
		const payload = buildConnectionPayload({
			title: 'Workflow', description: '', nodes: initialNodes, edges: initialEdges,
		});
		mutate(payload);
		const result = workflowJsonSchema.safeParse(payload);
		expect(result.success).toBe(false);
		if (!result.success) expect(result.error.issues[0].path.join('.')).toBe(path);
	});
});
