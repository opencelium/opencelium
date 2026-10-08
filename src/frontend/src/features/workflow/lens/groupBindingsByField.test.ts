import { describe, expect, it } from 'vitest';
import type { LensBinding } from './bindingLens.types';
import { groupBindingsByField } from './groupBindingsByField';

const endpoint = (label: string, path: string) => ({
	nodeId: label, label, color: '#3fa9f5', direction: 'response' as const,
	messageProperty: 'body', field: path, path: `body.$.${path}`,
});

const lensBinding = (key: string, source: LensBinding['source'],
	overrides: Partial<LensBinding> = {}): LensBinding => ({
	key,
	source,
	consumer: { ...endpoint('CreateOrder', 'total'), direction: 'request' },
	provider: endpoint('GetCart', key),
	isScript: false,
	invalidReason: null,
	unreadableProviderNodeId: null,
	...overrides,
});

const enhancement = (enhanceId: string, varKey: string) =>
	({ kind: 'enhancement' as const, enhanceId, varKey });

describe('groupBindingsByField', () => {
	it('groups the references of one enhancement, broken ones first', () => {
		const groups = groupBindingsByField([
			lensBinding('a', enhancement('en-1', 'VAR_0')),
			lensBinding('b', enhancement('en-1', 'VAR_1'), { invalidReason: 'missing-method' }),
		]);
		expect(groups).toHaveLength(1);
		expect(groups[0].bindings.map((binding) => binding.key)).toEqual(['b', 'a']);
		expect(groups[0].invalidCount).toBe(1);
	});

	it('keeps two enhancements on one field apart, and the field value apart from both', () => {
		const groups = groupBindingsByField([
			lensBinding('a', enhancement('en-1', 'VAR_0')),
			lensBinding('b', enhancement('en-2', 'VAR_0')),
			lensBinding('c', { kind: 'value' }),
			lensBinding('d', { kind: 'value' }),
		]);
		expect(groups.map((group) => group.bindings.length)).toEqual([1, 1, 2]);
	});

	it('keeps the same field path on two methods apart', () => {
		const groups = groupBindingsByField([
			lensBinding('a', { kind: 'value' }),
			lensBinding('b', { kind: 'value' },
				{ consumer: { ...endpoint('Notify', 'total'), direction: 'request' } }),
		]);
		expect(groups).toHaveLength(2);
	});
});
