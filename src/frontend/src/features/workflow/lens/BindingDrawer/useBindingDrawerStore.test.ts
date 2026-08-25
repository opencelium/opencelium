import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { WorkflowNodeModel } from '../../types/workflow.types';
import { updateConnection } from '../../store/connection/connectionSlice';
import type { Enhancement } from '../../types/connection';
import type { LensBinding } from '../bindingLens.types';
import { useBindingDrawerStore } from './useBindingDrawerStore';

const method = (id: string, name: string, color: string) => ({
	id, type: 'connector', position: { x: 0, y: 0 },
	data: {
		title: name, subtitle: name, kind: 'connector', color,
		connector: { connectorId: 1, title: 'i-doit' },
		methodConfig: { name, url: '/x', method: 'GET', headers: {}, queryParams: [],
			endpointArgs: {}, bodyFormat: 'json', bodyData: 'raw', body: {} },
	},
}) as unknown as WorkflowNodeModel;

const nodes = [
	{ id: 'start-1', type: 'start', position: { x: 0, y: 0 },
		data: { title: 'Start', kind: 'start' } } as unknown as WorkflowNodeModel,
	method('m1', 'getUsers', '#3fa9f5'),
	method('m2', 'createTicket', '#f5a623'),
];

const enhancement = (script = 'RESULT_VAR = VAR_0'): Enhancement => ({
	enhanceId: 'e1', language: 'js', script,
	args: { RESULT_VAR: '#f5a623.(request).body.$.userId', VAR_0: '#3fa9f5.(response).body.$.id' },
});

const fieldBindings = [{ enhancement: enhancement() }];

const binding = {
	key: 'e1:VAR_0', source: { kind: 'enhancement', enhanceId: 'e1', varKey: 'VAR_0' },
	consumer: { nodeId: 'm2', label: 'createTicket', color: '#f5a623', direction: 'request',
		messageProperty: 'body', field: 'userId', path: 'body.$.userId' },
	provider: { nodeId: 'm1', label: 'getUsers', color: '#3fa9f5', direction: 'response',
		messageProperty: 'body', field: 'id', path: 'body.$.id' },
	isScript: false, invalidReason: null, unreadableProviderNodeId: null,
} as LensBinding;

const setup = (selected: LensBinding | null = binding) => {
	const onFieldBindingsChange = vi.fn();
	const rendered = renderHook(() => useBindingDrawerStore({
		nodes, edges: [], fieldBindings, binding: selected, onFieldBindingsChange,
	}));
	return { ...rendered, onFieldBindingsChange };
};

describe('useBindingDrawerStore', () => {
	it('seeds the store with the selected binding and tree-path method indices', () => {
		const { result } = setup();
		const connection = result.current.store.getState().connection.connection;
		expect(connection?.fieldBindings).toMatchObject([{ enhancement: { enhanceId: 'e1' } }]);
		// buildEditorConnection's whole point: the indices decide reference scope.
		expect(connection?.fromConnector.method.map((item) => [item.id, item.index]))
			.toEqual([['m1', '0'], ['m2', '1']]);
	});

	it('publishes nothing when the drawer is opened and closed unchanged', () => {
		const { result, onFieldBindingsChange } = setup();
		act(() => result.current.persist());
		expect(onFieldBindingsChange).not.toHaveBeenCalled();
	});

	it('publishes a script edit once, not on every persist', () => {
		const { result, onFieldBindingsChange } = setup();
		act(() => {
			result.current.store.dispatch(updateConnection({
				fieldBindings: [{ enhancement: enhancement('RESULT_VAR = VAR_0.toUpperCase()') }],
			}));
		});

		act(() => result.current.persist());
		expect(onFieldBindingsChange).toHaveBeenCalledTimes(1);
		expect(onFieldBindingsChange.mock.calls[0][0])
			.toMatchObject([{ enhancement: { script: 'RESULT_VAR = VAR_0.toUpperCase()' } }]);

		act(() => result.current.persist());
		expect(onFieldBindingsChange).toHaveBeenCalledTimes(1);
	});

	it('publishes an edit as it is made, and not twice when reseeding', () => {
		const onFieldBindingsChange = vi.fn();
		const { result, rerender } = renderHook(
			(props: { binding: LensBinding | null }) => useBindingDrawerStore({
				nodes, edges: [], fieldBindings, onFieldBindingsChange, binding: props.binding,
			}),
			{ initialProps: { binding } },
		);
		act(() => {
			result.current.store.dispatch(updateConnection({
				fieldBindings: [{ enhancement: enhancement('RESULT_VAR = 1') }],
			}));
		});
		// Published as it is typed, so a save with the drawer still open includes it.
		expect(onFieldBindingsChange).toHaveBeenCalledTimes(1);
		expect(onFieldBindingsChange.mock.calls[0][0])
			.toMatchObject([{ enhancement: { script: 'RESULT_VAR = 1' } }]);

		// Selecting another arc keeps the drawer mounted; the edit is already out,
		// so reseeding under it must not publish the same thing again.
		act(() => {
			rerender({ binding: { ...binding, key: 'e1:VAR_1',
				source: { kind: 'enhancement', enhanceId: 'e1', varKey: 'VAR_1' } } });
		});
		expect(onFieldBindingsChange).toHaveBeenCalledTimes(1);
		// ...and the reseed put the page's own bindings back in the store.
		expect(result.current.store.getState().connection.connection?.fieldBindings)
			.toMatchObject([{ enhancement: { script: 'RESULT_VAR = VAR_0' } }]);
	});

	it('drops the binding on delete and publishes the shorter list', () => {
		const { result, onFieldBindingsChange } = setup();
		act(() => result.current.deleteEnhancement());
		expect(onFieldBindingsChange).toHaveBeenCalledWith([]);
	});

	it('holds no connection while nothing is selected', () => {
		const { result } = setup(null);
		expect(result.current.store.getState().connection.connection).toBeNull();
	});
});
