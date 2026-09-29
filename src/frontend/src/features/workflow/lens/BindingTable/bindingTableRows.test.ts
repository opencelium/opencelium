import { describe, expect, it } from 'vitest';
import type { LensBinding, LensBindingGraph } from '../bindingLens.types';
import { countBroken, selectBindingTableRows } from './bindingTableRows';

const endpoint = (label: string | null, path: string) => ({
	nodeId: label, label, color: '#3fa9f5', direction: 'response' as const,
	messageProperty: 'body', field: path, path: `body.$.${path}`,
});

const lensBinding = (overrides: Partial<LensBinding> = {}): LensBinding => ({
	key: 'en-1:VAR_0',
	source: { kind: 'enhancement', enhanceId: 'en-1', varKey: 'VAR_0' },
	consumer: { ...endpoint('CreateTicket', 'userId'), direction: 'request' },
	provider: endpoint('GetUsers', 'id'),
	isScript: false,
	invalidReason: null,
	unreadableProviderNodeId: null,
	...overrides,
});

const graph = (bindings: LensBinding[]): LensBindingGraph =>
	({ bindings, skipped: { malformed: 0, outsideScope: 0, unanchored: 0 } });

describe('selectBindingTableRows', () => {
	const notify = lensBinding({ key: 'en-2:VAR_0',
		consumer: { ...endpoint('Notify', 'body'), direction: 'request' },
		provider: endpoint('GetOrders', 'total') });
	const broken = lensBinding({ key: 'en-3:VAR_0', invalidReason: 'missing-method',
		provider: endpoint(null, 'gone') });

	it('puts anything broken first, then orders by the method being filled', () => {
		const rows = selectBindingTableRows(graph([notify, lensBinding(), broken]),
			{ search: '' });
		expect(rows.map((row) => row.key))
			.toEqual(['en-3:VAR_0', 'en-1:VAR_0', 'en-2:VAR_0']);
	});

	it('searches both ends, method and field alike, case-insensitively', () => {
		const bindings = graph([notify, lensBinding()]);
		expect(selectBindingTableRows(bindings, { search: 'getusers' })
			.map((row) => row.key)).toEqual(['en-1:VAR_0']);
		expect(selectBindingTableRows(bindings, { search: 'userId' })
			.map((row) => row.key)).toEqual(['en-1:VAR_0']);
		expect(selectBindingTableRows(bindings, { search: 'nope' }))
			.toEqual([]);
	});

	it('leaves the graph it was given untouched', () => {
		const bindings = [notify, broken];
		selectBindingTableRows(graph(bindings), { search: '' });
		expect(bindings.map((row) => row.key)).toEqual(['en-2:VAR_0', 'en-3:VAR_0']);
	});
});

describe('countBroken', () => {
	it('counts the bindings that cannot resolve', () => {
		expect(countBroken([lensBinding(), lensBinding({ invalidReason: 'out-of-scope' })]))
			.toBe(1);
	});
});
