import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { WorkflowNodeModel } from '../../../types/workflow.types';
import { setConnection, updateEndpoint } from '../../../store/connection/connectionSlice';
import { useMethodConfigDialogState } from './useMethodConfigDialogState';

const methodNode = {
	id: 'm1',
	type: 'connector',
	position: { x: 0, y: 0 },
	data: {
		title: 'GetAllUser', subtitle: 'getAllUser', kind: 'connector', color: '#C77E7E',
		connector: { connectorId: 4, title: 'i-doit' },
		methodConfig: {
			name: 'getAllUser', url: '/user', method: 'GET', headers: {},
			queryParams: [], endpointArgs: {}, bodyFormat: 'json', bodyData: 'raw', body: {},
		},
	},
} as unknown as WorkflowNodeModel;

const nodes = [
	{ id: 'start-1', type: 'start', position: { x: 0, y: 0 },
		data: { title: 'Start', kind: 'start' } } as unknown as WorkflowNodeModel,
	methodNode,
];

const setup = () => {
	const onSave = vi.fn();
	const onClose = vi.fn();
	const onFieldBindingsChange = vi.fn();
	const rendered = renderHook(() => useMethodConfigDialogState({
		open: true, node: methodNode, mode: 'url', nodes, edges: [],
		fieldBindings: undefined, onFieldBindingsChange, onClose, onSave,
	}));
	return { ...rendered, onSave, onClose, onFieldBindingsChange };
};

const enhancement = (script: string) => [{ enhancement: { enhanceId: 'e1', language: 'js', script,
	args: { RESULT_VAR: '#C77E7E.(request).body.$.name', VAR_0: 'x' } } }];

// persistCurrentConfig defers its read to the next animation frame.
const flushFrame = () => act(() => new Promise<void>((resolve) => {
	requestAnimationFrame(() => resolve());
}));

describe('useMethodConfigDialogState', () => {
	it('does not touch the graph when the dialog is opened and closed unchanged', async () => {
		const { result, onSave, onClose, onFieldBindingsChange } = setup();

		act(() => result.current.persistCurrentConfig());
		await flushFrame();

		// The legacy round-trip would otherwise write back a config carrying a
		// synthesised `response` and a freshly minted query-param template row,
		// marking the workflow dirty and adding an undo entry for a dialog the
		// user only looked at.
		expect(onSave).not.toHaveBeenCalled();
		expect(onFieldBindingsChange).not.toHaveBeenCalled();
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('publishes an enhancement-only edit as bindings alone, without rewriting the config', async () => {
		const { result, onSave, onClose, onFieldBindingsChange } = setup();

		// A script edit lands in the connection's fieldBindings, never on the method
		// config. Writing the config back too would add a second, unexplained
		// "Edited request of ..." entry to the change history.
		act(() => {
			const current = result.current.store.getState().connection.connection;
			result.current.store.dispatch(setConnection({
				...current, fieldBindings: enhancement('RESULT_VAR = VAR_0.trim()'),
			} as never));
		});
		act(() => result.current.persistCurrentConfig());
		await flushFrame();

		expect(onSave).not.toHaveBeenCalled();
		expect(onFieldBindingsChange).toHaveBeenCalledWith(enhancement('RESULT_VAR = VAR_0.trim()'));
		expect(onClose).toHaveBeenCalledTimes(1);
	});

	it('publishes a body edit and its new binding together, in one write', async () => {
		const { result, onSave, onFieldBindingsChange } = setup();

		// Adding a reference to a body field changes the config *and* creates its
		// binding. Reporting them separately produced two entries — an "Edited Body
		// Enhancement" for the binding, then an "Added Body Reference" for the body.
		act(() => {
			const current = result.current.store.getState().connection.connection;
			result.current.store.dispatch(setConnection({
				...current, fieldBindings: enhancement('RESULT_VAR = VAR_0'),
			} as never));
			result.current.store.dispatch(
				updateEndpoint({ methodId: 'm1', endpoint: '/user?page=2' }),
			);
		});
		act(() => result.current.persistCurrentConfig());
		await flushFrame();

		expect(onFieldBindingsChange).not.toHaveBeenCalled();
		expect(onSave).toHaveBeenCalledTimes(1);
		expect(onSave.mock.calls[0][2]).toEqual(enhancement('RESULT_VAR = VAR_0'));
	});

	it('reports nothing at all while the dialog is still open', async () => {
		const { result, onSave, onFieldBindingsChange } = setup();

		act(() => {
			const current = result.current.store.getState().connection.connection;
			result.current.store.dispatch(setConnection({
				...current, fieldBindings: enhancement('RESULT_VAR = VAR_0.trim()'),
			} as never));
		});
		await flushFrame();

		// No live push: a half-applied edit must never reach the page.
		expect(onSave).not.toHaveBeenCalled();
		expect(onFieldBindingsChange).not.toHaveBeenCalled();
	});

	it('persists once the session actually edited something', async () => {
		const { result, onSave, onClose } = setup();

		act(() => {
			result.current.store.dispatch(
				updateEndpoint({ methodId: 'm1', endpoint: '/user?page=2' }),
			);
		});
		act(() => result.current.persistCurrentConfig());
		await flushFrame();

		expect(onClose).not.toHaveBeenCalled();
		expect(onSave).toHaveBeenCalledTimes(1);
		expect(onSave.mock.calls[0][0]).toBe('m1');
		expect(onSave.mock.calls[0][1].url).toContain('page=2');
	});
});
