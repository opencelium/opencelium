import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiExecutor } from '@shared/api/apiExecutor';
import { executeScript, validateScript } from './langCodeApi';

vi.mock('@shared/api/apiExecutor', () => ({ apiExecutor: vi.fn() }));

const api = vi.mocked(apiExecutor);
const options = { ignoreError: true, skipEntityInvalidation: true };

beforeEach(() => api.mockReset());

describe('validateScript', () => {
	it('posts the script as js without toasting errors', async () => {
		const valid = { valid: true, language: 'js', errors: [] };
		api.mockResolvedValue(valid);

		await expect(validateScript('var a = 1;')).resolves.toEqual(valid);
		expect(api).toHaveBeenCalledWith({
			url: '/lang-code/validate', method: 'POST', body: { language: 'js', script: 'var a = 1;' }, options,
		});
	});

	it('resolves a failed request to null', async () => {
		api.mockResolvedValue({ status: 503, data: { error: 'SCRIPT_ENGINE_UNAVAILABLE' } });
		await expect(validateScript('x')).resolves.toBeNull();
	});
});

describe('executeScript', () => {
	const body = { language: 'js' as const, script: 'RESULT_VAR = 1', variables: {} };

	it('returns the response of a run, failed scripts included', async () => {
		const response = { success: false, language: 'js', result: null, resultType: null, output: '', durationMs: 1,
			error: { type: 'TIMEOUT', name: null, line: null, column: null, message: 'm', codeLine: null, hint: 'h' } };
		api.mockResolvedValue(response);

		await expect(executeScript(body)).resolves.toEqual({ kind: 'response', response });
		expect(api).toHaveBeenCalledWith({ url: '/lang-code/execute', method: 'POST', body, options });
	});

	it('returns the status and error code of a refused request', async () => {
		api.mockResolvedValue({ status: 429, data: { status: 429, error: 'TOO_MANY_SCRIPT_RUNS', message: 'busy' } });

		await expect(executeScript(body)).resolves.toEqual({
			kind: 'failure', failure: { status: 429, code: 'TOO_MANY_SCRIPT_RUNS' },
		});
	});

	it('returns a network failure without a status', async () => {
		api.mockResolvedValue({ status: 'FETCH_ERROR', error: 'Failed to fetch' });

		await expect(executeScript(body)).resolves.toEqual({ kind: 'failure', failure: { status: null, code: null } });
	});
});
