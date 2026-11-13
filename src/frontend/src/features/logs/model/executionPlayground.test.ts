import { beforeEach, expect, it, vi } from 'vitest';
import { executionPlaygroundSearch, loadLoggedExecution, readExecutionPlaygroundSearch } from './executionPlayground';

const { dispatch } = vi.hoisted(() => ({ dispatch: vi.fn() }));
vi.mock('@app/store/store', () => ({ store: { dispatch } }));
vi.mock('../api/logsApi', () => ({
	logsApi: { endpoints: {
		getExecutionConnectors: { initiate: (id: string) => ['connectors', id] },
		getElementChildren: { initiate: ({ id, loopIndex }: { id: string; loopIndex?: number }) => ['children', id, loopIndex] },
		getMethodDetails: { initiate: (id: string) => ['details', id] },
	} },
}));

const location = {
	executionId: '17', indexPath: '2_0_1', loopIndex: '2,1', direction: 'source' as const, elementId: 'selected',
};

beforeEach(() => {
	dispatch.mockReset().mockImplementation(([kind, id, iteration]: [string, string, number?]) => ({
		unwrap: async () => {
			if (kind === 'connectors') return [
				{ id: 'other-root', connectionId: 9, properties: { DIRECTION: 'target' } },
				{ id: 'root', connectionId: 9, properties: { DIRECTION: 'source', CONNECTOR_ID: '-1' } },
			];
			if (kind === 'details') return { id };
			if (id === 'root') return [
				{ id: 'before-loops', type: 'OPERATION', indexPath: '0' },
				{ id: 'outer', type: 'LOOP', indexPath: '2', properties: { iterator: 'i', size: 4 } },
			];
			if (id === 'outer' && iteration === 2) return [
				{ id: 'inner', type: 'LOOP', indexPath: '2_0', properties: { iterator: 'j', size: 3 } },
			];
			if (id === 'inner' && iteration === 1) return [
				{ id: 'upstream', type: 'OPERATION', indexPath: '2_0_0', startOffset: 20 },
				{ id: 'upstream-later', type: 'OPERATION', indexPath: '2_0_0', startOffset: 40 },
				{ id: 'selected', type: 'OPERATION', indexPath: '2_0_1', startOffset: 30 },
				{ id: 'later', type: 'OPERATION', indexPath: '2_0_3', startOffset: 50 },
			];
			return [];
		},
	}));
});

it('round-trips the execution and selected nested iterations through the URL', () => {
	expect(readExecutionPlaygroundSearch(new URLSearchParams(executionPlaygroundSearch(location)))).toEqual(location);
});

it('loads references from the selected iterations and leaves an unexecuted branch empty', async () => {
	const execution = await loadLoggedExecution(location, 9);
	expect(execution?.method.id).toBe('selected');
	expect(execution?.iteratorIndex('i')).toBe(2);
	expect(execution?.iteratorIndex('j')).toBe(1);
	expect(execution?.iteratorIndex('other')).toBeNull();
	expect(await execution?.findMethod('0')).toEqual({ id: 'before-loops' });
	expect(await execution?.findMethod('2_0_0')).toEqual({ id: 'upstream' });
	expect(await execution?.findMethod('2_0_1')).toBeNull();
	expect(await execution?.findMethod('2_0_2')).toBeNull();
	expect(await execution?.findMethod('2_0_3')).toBeNull();
	expect(dispatch.mock.calls.filter(([key]) => key[0] === 'children')).toEqual([
		[['children', 'root', undefined]], [['children', 'outer', 2]], [['children', 'inner', 1]],
	]);
});

it('rejects another workflow, the other loop iteration, and a different element at the same path', async () => {
	expect(await loadLoggedExecution(location, 10)).toBeNull();
	expect(await loadLoggedExecution({ ...location, loopIndex: '0,1' }, 9)).toBeNull();
	expect(await loadLoggedExecution({ ...location, elementId: 'other' }, 9)).toBeNull();
});
