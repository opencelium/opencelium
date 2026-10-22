import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Connector } from '@entities/connector/model/types';
import type { Invoker } from '@entities/invoker/model/types';
import { useTemplateConnectorMapping } from './useTemplateConnectorMapping';
const create = vi.hoisted(() => vi.fn());
vi.mock('@/engine/entity/runtime/genererics/useWizardSubmit', () => ({
	useWizardSubmit: () => create,
}));
const connector = (connectorId: number, name: string) => ({ connectorId, title: name, invoker: { name } }) as Connector;
const groups = [
	{
		oldConnectorId: 1,
		templateTitle: 'Old A',
		invokerName: 'A',
		methodNames: [],
	},
	{
		oldConnectorId: 2,
		templateTitle: 'Old B',
		invokerName: 'B',
		methodNames: [],
	},
];
const initialProps = {
	open: true,
	groups,
	connectors: [connector(10, 'A'), connector(11, 'A')],
	invokers: [] as Invoker[],
};
describe('useTemplateConnectorMapping', () => {
	it('keeps selected connectors after inline creation and refresh', async () => {
		create.mockResolvedValue(connector(20, 'B'));
		const { result, rerender } = renderHook(useTemplateConnectorMapping, {
			initialProps,
		});
		expect(result.current.isComplete).toBe(false);
		act(() => result.current.selectConnector(1, 11));
		await act(async () => {
			await result.current.createConnectorForGroup(2, {});
		});
		expect(result.current.mapping).toEqual({ 1: 11, 2: 20 });
		expect(result.current.isComplete).toBe(true);
		rerender({
			...initialProps,
			connectors: [...initialProps.connectors, connector(20, 'B')],
		});
		expect(result.current.mapping).toEqual({ 1: 11, 2: 20 });
	});
	it('clears selections when the dialog reopens', () => {
		const { result, rerender } = renderHook(useTemplateConnectorMapping, {
			initialProps,
		});
		act(() => result.current.selectConnector(1, 11));
		rerender({ ...initialProps, open: false });
		rerender(initialProps);
		expect(result.current.mapping[1]).toBeUndefined();
	});

	it('does not preselect when several connectors match', () => {
		const { result } = renderHook(useTemplateConnectorMapping, { initialProps });
		expect(result.current.mapping[1]).toBeUndefined();
		expect(result.current.suggestedConnectors(groups[0]).map((c) => c.connectorId)).toEqual([10, 11]);
	});
	it.each([{ invokers: [] as Invoker[] }, { invokers: [{ name: 'a' } as Invoker] }])(
		'matches invokers case-insensitively with registry $invokers',
		({ invokers }) => {
			const { result } = renderHook(useTemplateConnectorMapping, {
				initialProps: {
					...initialProps,
					invokers,
					connectors: [connector(10, 'a'), connector(20, 'other')],
				},
			});
			expect(result.current.mapping).toEqual({ 1: 10, 2: undefined });
			expect(result.current.suggestedConnectors(groups[0])).toHaveLength(1);
		},
	);
	it('invalidates a selection when its connector disappears', () => {
		const { result, rerender } = renderHook(useTemplateConnectorMapping, { initialProps });
		act(() => result.current.selectConnector(1, 11));
		rerender({ ...initialProps, connectors: [connector(20, 'B')] });
		expect(result.current.mapping).toEqual({ 1: undefined, 2: 20 });
		expect(result.current.isComplete).toBe(false);
	});
	it('keeps selections unchanged when inline creation fails', async () => {
		create.mockRejectedValueOnce(new Error('Create failed'));
		const { result } = renderHook(useTemplateConnectorMapping, { initialProps });
		act(() => result.current.selectConnector(1, 11));
		await act(async () => {
			await expect(result.current.createConnectorForGroup(2, {})).rejects.toThrow('Create failed');
		});
		expect(result.current.mapping).toEqual({ 1: 11, 2: undefined });
		expect(result.current.createdConnectors).toEqual([]);
		expect(result.current.isComplete).toBe(false);
	});
	it('deduplicates a created connector after the list refreshes', async () => {
		create.mockResolvedValueOnce(connector(20, 'B'));
		const { result, rerender } = renderHook(useTemplateConnectorMapping, { initialProps });
		await act(async () => {
			await result.current.createConnectorForGroup(2, {});
		});
		rerender({ ...initialProps, connectors: [...initialProps.connectors, connector(20, 'B')] });
		expect(result.current.suggestedConnectors(groups[1])).toHaveLength(1);
	});
	it('forgets created connectors when the dialog closes', async () => {
		create.mockResolvedValueOnce(connector(20, 'B'));
		const { result, rerender } = renderHook(useTemplateConnectorMapping, { initialProps });
		await act(async () => {
			await result.current.createConnectorForGroup(2, {});
		});
		rerender({ ...initialProps, open: false });
		rerender(initialProps);
		expect(result.current.createdConnectors).toEqual([]);
		expect(result.current.mapping[2]).toBeUndefined();
	});
	it('cannot confirm an empty mapping', () => {
		const { result } = renderHook(useTemplateConnectorMapping, { initialProps: { ...initialProps, groups: [] } });
		expect(result.current.isComplete).toBe(false);
	});
 it('cannot confirm a connector from another invoker', () => {
  const { result } = renderHook(useTemplateConnectorMapping, { initialProps: {
   ...initialProps, connectors: [connector(10, 'A'), connector(20, 'B')],
  } });
  expect(result.current.isComplete).toBe(true);
  act(() => result.current.selectConnector(1, 20));
  expect(result.current.isComplete).toBe(false);
 });

});
