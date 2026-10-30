import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { LiveLogNode, LiveLogTree } from '@features/logs';
import type { FieldBinding } from '@features/workflow/types/connection';
import type { WorkflowNodeModel } from '@features/workflow/types/workflow.types';
import { useRunFailureAssist } from './useRunFailureAssist';

const broken = '#C77E7E.(response).body.$.[i].id[as';
const fixedBody = JSON.stringify({ name: '#C77E7E.(response).body.$.[0].department', id: '#C77E7E.(response).body.$.[i].id', units: [] }, null, 2);

vi.mock('../api/aiApi', () => ({
	useExplainRunMutation: () => [() => ({ unwrap: async () => ({ summary: 's', cause: 'c', fix: ['f'], isRequestFixable: true, durationMs: 1, model: 'm' }) })],
	useFixRunMutation: () => [() => ({ unwrap: async () => ({ body: fixedBody, headers: [{ name: 'Content-Type', value: 'application/json' }], changes: ['id'], problems: [], durationMs: 1, model: 'm' }) })],
}));

vi.mock('@shared/i18n/hooks/useI18n', () => ({ useI18n: () => ({ t: (key: string) => key, lang: 'en' }) }));

vi.mock('@features/logs', () => ({
	resolveTraceTarget: async () => ({ type: 'OPERATION', id: 'log-1' }),
	fetchMethodDetails: async () => null,
}));

const logNode = (indexPath: string, type: LiveLogNode['type'], patch: Partial<LiveLogNode> = {}): LiveLogNode => ({
	key: `${indexPath}@`, id: `id-${indexPath}`, indexPath, loopIndex: '', type, status: 'COMPLETE', connectorName: null,
	properties: {}, segment: {}, error: null, childKeys: [], storedIteration: null, latestIteration: null, iterationCount: 0, ...patch,
});

const tree: LiveLogTree = {
	rootKeys: [],
	nodes: {
		'0@': logNode('0', 'OPERATION'),
		'1@': logNode('1', 'LOOP'),
		'1_0@0': logNode('1_0', 'OPERATION', { loopIndex: '0', status: 'FAIL',
			error: { message: `Failed to resolve reference = ${broken}. Reason = x`, code: null, originOfErrorPath: '1_0', stackTrace: null } }),
	},
	executionStatus: 'FAIL',
	errorLocations: [{ indexPath: '1_0', loopIndex: '0' }],
};

const method = (id: string, title: string, color: string, body: unknown) => ({
	id, type: 'connector', position: { x: 0, y: 0 },
	data: { title, subtitle: title, kind: 'connector', color, connector: { connectorId: 1, title: 'fake', invokerName: 'fake_api' },
		methodConfig: { name: title, url: '{url}/x', headers: { 'Content-Type': 'application/json' }, queryParams: [], endpointArgs: {},
			bodyFormat: 'json', bodyData: 'raw', body } },
}) as unknown as WorkflowNodeModel;

describe('useRunFailureAssist', () => {
	it('applies the proposed body to the failing step and to the binding of the field it changed', async () => {
		const nodes = [
			{ id: 'start-1', type: 'start', position: { x: 0, y: 0 }, data: { title: 'Start' } } as unknown as WorkflowNodeModel,
			method('n-all', 'GetAllUser', '#C77E7E', {}),
			{ id: 'n-loop', type: 'loop', position: { x: 0, y: 0 }, data: { title: 'Loop', kind: 'loop' } } as unknown as WorkflowNodeModel,
			method('n-add', 'AddUser', '#AAAAAA', { name: '#C77E7E.(response).body.$.[0].department', id: broken, units: [] }),
		];
		const edges = [
			{ id: 'e1', source: 'start-1', target: 'n-all' }, { id: 'e2', source: 'n-all', target: 'n-loop' },
			{ id: 'e3', source: 'n-loop', target: 'n-add', sourceHandle: 'bottom' },
		] as never;
		const binding = (enhanceId: string, field: string, source: string) => ({ enhancement: { enhanceId, language: 'js', script: 'RESULT_VAR = VAR_0 + "";',
			args: { RESULT_VAR: `#AAAAAA.(request).body.$.${field}`, VAR_0: source } } }) as unknown as FieldBinding;
		const fieldBindings = [binding('e-name', 'name', '#C77E7E.(response).body.$.[0].department'), binding('e-id', 'id', broken)];
		const onSave = vi.fn();
		const onBindings = vi.fn();
		const { result } = renderHook(() => useRunFailureAssist({ tree, nodes, edges, workflowTitle: 'fake2', onSaveMethodConfig: onSave,
			fieldBindings, onFieldBindingsChange: onBindings, runKey: 1 }));
		await act(async () => { await result.current.explain(); });
		await act(async () => { await result.current.fix(); });
		act(() => { result.current.apply(); });
		expect(onSave).toHaveBeenCalledWith('n-add', expect.objectContaining({
			body: expect.objectContaining({ id: '#C77E7E.(response).body.$.[i].id' }),
		}));
		const saved = onBindings.mock.calls[0]?.[0] as FieldBinding[];
		expect(saved.map((item) => item.enhancement.args)).toEqual([
			{ RESULT_VAR: '#AAAAAA.(request).body.$.name', VAR_0: '#C77E7E.(response).body.$.[0].department' },
			{ RESULT_VAR: '#AAAAAA.(request).body.$.id', VAR_0: '#C77E7E.(response).body.$.[i].id' },
		]);
		expect(saved[1]?.enhancement).toMatchObject({ enhanceId: 'e-id', script: 'RESULT_VAR = VAR_0 + "";' });
	});
});
