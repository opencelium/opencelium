import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { MethodWithId } from '../../../types/connection';
import type { ReferenceValidationRequest, ReferenceValidationResult } from '../../../types/referenceValidation.types';
import { validateReference } from '../../../api/referenceValidationApi';
import { useReferenceValidation } from './useReferenceValidation';

vi.mock('@shared/i18n/hooks/useI18n', () => ({
	useI18n: () => ({ t: (key: string) => key, lang: 'en' }),
}));
vi.mock('../../../api/referenceValidationApi', () => ({ validateReference: vi.fn() }));

const validate = vi.mocked(validateReference);

const method = { color: '#ababab', response: { success: { body: { type: 'object', format: 'json',
	fields: { data: { type: 'array', fields: { id: '' } } } } } } } as unknown as MethodWithId;
const xmlMethod = { color: '#cdcdcd', response: { success: { body: { type: 'object', format: 'xml',
	fields: {} } } } } as unknown as MethodWithId;

const answer = (reference: string): ReferenceValidationResult => ({
	valid: false, reference, type: 'DIRECT', part: 'BODY', path: null, sampleMatched: null,
	errors: [{ code: 'UNKNOWN_ITERATOR', message: 'm', hint: 'use [0]', position: 31, fragment: '[i]' }],
	warnings: [],
});

type Props = Parameters<typeof useReferenceValidation>[0];
const base: Props = { method, type: 'body', path: 'data[i].id', iterators: [], isPaused: false };

const render = (props: Props) =>
	renderHook((current: Props) => useReferenceValidation(current), { initialProps: props });

const flush = () => act(async () => { await vi.advanceTimersByTimeAsync(300); });

beforeEach(() => {
	vi.useFakeTimers();
	validate.mockImplementation(async (request: ReferenceValidationRequest) => answer(request.reference));
});
afterEach(() => {
	vi.useRealTimers();
	validate.mockReset();
});

describe('useReferenceValidation', () => {
	it('sends the full reference, iterators and declared sample', async () => {
		const { result } = render(base);
		await flush();
		expect(validate).toHaveBeenCalledWith({ reference: '#ababab.(response).body.$.data[i].id', iterators: [],
			sample: { data: [{ id: '' }] } });
		expect(result.current).toEqual({ severity: 'error', message: 'references.issues.UNKNOWN_ITERATOR',
			hint: 'use [0]' });
	});

	it('waits until the path has stopped changing', async () => {
		const { rerender, result } = render(base);
		await flush();
		validate.mockClear();
		rerender({ ...base, path: 'data[0].id' });
		expect(result.current).toBeNull();
		await act(async () => { await vi.advanceTimersByTimeAsync(200); });
		expect(validate).not.toHaveBeenCalled();
		await act(async () => { await vi.advanceTimersByTimeAsync(100); });
		expect(validate).toHaveBeenCalledWith(expect.objectContaining({ reference: '#ababab.(response).body.$.data[0].id' }));
	});

	it('does not send again for an equal iterators array', async () => {
		const { rerender } = render(base);
		await flush();
		rerender({ ...base, iterators: [] });
		await flush();
		expect(validate).toHaveBeenCalledTimes(1);
	});

	it('sends null iterators when the loops in scope are unknown', async () => {
		render({ ...base, iterators: undefined });
		await flush();
		expect(validate).toHaveBeenCalledWith(expect.objectContaining({ iterators: null }));
	});

	it('checks headers without a sample', async () => {
		render({ ...base, type: 'header', path: 'Content-Type' });
		await flush();
		expect(validate).toHaveBeenCalledWith({ reference: '#ababab.(response).header.$.Content-Type', iterators: [] });
	});

	it.each([
		['paused', { isPaused: true }],
		['empty', { path: '  ' }],
		['status', { type: 'status' as const }],
		['xml', { method: xmlMethod }],
		['no method', { method: undefined }],
	])('skips the check when %s', async (_, override) => {
		const { result } = render({ ...base, ...override });
		await flush();
		expect(validate).not.toHaveBeenCalled();
		expect(result.current).toBeNull();
	});

	it('drops the feedback as soon as the user starts typing again', async () => {
		const { rerender, result } = render(base);
		await flush();
		expect(result.current).not.toBeNull();
		rerender({ ...base, isPaused: true });
		expect(result.current).toBeNull();
	});

	it('shows nothing when the check failed', async () => {
		validate.mockResolvedValue(null);
		const { result } = render(base);
		await flush();
		expect(result.current).toBeNull();
	});
});
