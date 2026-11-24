import { describe, expect, it } from 'vitest';
import { deserializeMethodConfigReferences } from './legacyMethodConfig';
import type { WorkflowMethodConfig } from '../../types/request-config.types';

describe('deserializeMethodConfigReferences', () => {
	it('turns a reference that is the whole query part back into the same pill in URL and row', () => {
		const reference = '{%#C77E7E.(response).body.$.[i].role%}';
		const config = deserializeMethodConfigReferences({
			url: `{url}/users?${reference}`,
			queryParams: [{ id: '1', key: reference, value: '', enabled: true, isFlag: true }],
			endpointArgs: {},
		} as unknown as WorkflowMethodConfig);
		const [row] = config.queryParams;
		expect(row.key).toMatch(/^#\{%ref_[0-9a-f]+%\}$/);
		expect(config.url).toBe(`{url}/users?${row.key}`);
		expect(Object.values(config.endpointArgs)).toHaveLength(1);
	});
});
