import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiExecutor } from '@shared/api/apiExecutor';
import { validateReference } from './referenceValidationApi';

vi.mock('@shared/api/apiExecutor', () => ({ apiExecutor: vi.fn() }));

const execute = vi.mocked(apiExecutor);
const ok = { valid: true, reference: '#ababab.(response).status', type: 'DIRECT', part: 'STATUS', path: null,
	sampleMatched: null, errors: [], warnings: [] };

beforeEach(() => execute.mockReset());

describe('validateReference', () => {
	it('posts the request without toasting errors or invalidating entity caches', async () => {
		execute.mockResolvedValue(ok);
		await expect(validateReference({ reference: 'a', iterators: null })).resolves.toEqual(ok);
		expect(execute).toHaveBeenCalledWith({ url: '/connection/reference/validate', method: 'POST',
			body: { reference: 'a', iterators: null }, options: { ignoreError: true, skipEntityInvalidation: true } });
	});

	it('answers an identical request from the cache', async () => {
		execute.mockResolvedValue(ok);
		await validateReference({ reference: 'b', iterators: ['i'] });
		await validateReference({ reference: 'b', iterators: ['i'] });
		expect(execute).toHaveBeenCalledTimes(1);
	});

	it('resolves a failed check to null and retries it next time', async () => {
		execute.mockResolvedValueOnce({ status: 500, data: null });
		await expect(validateReference({ reference: 'c', iterators: null })).resolves.toBeNull();
		execute.mockResolvedValueOnce(ok);
		await expect(validateReference({ reference: 'c', iterators: null })).resolves.toEqual(ok);
		expect(execute).toHaveBeenCalledTimes(2);
	});
});
