import { describe, expect, it } from 'vitest';
import { ensureMethodConfig } from './requestConfig';

describe('ensureMethodConfig', () => {
	it('builds the query param rows from the URL when none are stored', () => {
		const config = ensureMethodConfig({ url: 'http://127.0.0.1:8099/test?a=1&b=2' });
		expect(config.queryParams.map(({ key, value, enabled }) => ({ key, value, enabled }))).toEqual([
			{ key: 'a', value: '1', enabled: true },
			{ key: 'b', value: '2', enabled: true },
			{ key: '', value: '', enabled: false },
		]);
	});

	it('keeps the stored query param rows when present', () => {
		const stored = [{ id: 'q1', key: 'x', value: '9', enabled: true }];
		expect(ensureMethodConfig({ url: 'http://host/test?a=1', queryParams: stored }).queryParams).toBe(stored);
	});
});
