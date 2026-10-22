import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { QueryParam } from '../../../../types/connection';
import type { ActiveUrlReference } from './useActiveUrlReference';
import { useUrlReferenceInsertion } from './useUrlReferenceInsertion';

const raw = '/before/#{%a%}/middle/#{%a%}/after';
const root = () => document.createElement('div');
function setup(query = false, replace = true) {
	const field = root();
	const start = raw.lastIndexOf('#{%a%}');
	let active: ActiveUrlReference | null = replace
		? {
				root: field,
				index: 1,
				token: '#{%a%}',
				start,
				end: start + 6,
				...(query ? { rowId: 'q', field: 'value' as const } : {}),
			}
		: null;
	const saveAll = vi.fn(),
		setEndpointRaw = vi.fn(),
		setQueryParams = vi.fn();
	const rawRef = { current: query ? `/path?q=${raw}` : raw };
	const rows = query
		? ([{ id: 'q', key: 'q', value: raw, enabled: true, autoEncode: false }] as QueryParam[])
		: [];
	const references = {
		active,
		getActive: () => active,
		clear: () => {
			active = null;
		},
		setPickerOpen: vi.fn(),
		restore: vi.fn(),
	};
	const params = {
		endpointRaw: rawRef.current,
		queryParams: rows,
		createArgToken: vi.fn(() => ({ token: '#{%b%}' })),
		saveAll,
		setEndpointRaw,
		setQueryParams,
		setReferenceOpen: vi.fn(),
		endpointDivRef: { current: field },
		endpointArgsRef: { current: {} },
		rawRef,
		lastCaretRef: { current: 0 },
		lastRawCaretRef: { current: 8 },
		selectedTokenRef: { current: null },
		queryCaretTargetRef: { current: null },
		lastDispatchedRef: { current: null },
		references,
		wrapperRef: { current: root() },
	};
	vi.stubGlobal('requestAnimationFrame', vi.fn());
	const hook = renderHook(() => useUrlReferenceInsertion(params));
	act(() => hook.result.current('#ffffff.(response).body.$.new'));
	return { saveAll, setEndpointRaw, setQueryParams, params };
}
afterEach(() => vi.unstubAllGlobals());
describe('replace URL reference in place', () => {
	it('changes only the second occurrence in the endpoint, preserving both references', () => {
		const { saveAll, params } = setup();
		expect(saveAll.mock.calls[0][0]).toBe('/before/#{%a%}/middle/#{%b%}/after');
		expect(params.lastRawCaretRef.current).toBe(raw.lastIndexOf('#{%a%}') + 6);
		expect(params.references.getActive()).toBeNull();
	});
	it('changes only the selected query value occurrence and keeps the path', () => {
		const { saveAll, setQueryParams } = setup(true);
		expect(setQueryParams.mock.calls[0][0][0].value).toBe('/before/#{%a%}/middle/#{%b%}/after');
		expect(saveAll.mock.calls[0][0]).toBe('/path?q=/before/#{%a%}/middle/#{%b%}/after');
	});
	it('still inserts at the caret when no reference is active', () => {
		const { saveAll } = setup(false, false);
		expect(saveAll.mock.calls[0][0]).toBe(raw.slice(0, 8) + '#{%b%}' + raw.slice(8));
	});
});
