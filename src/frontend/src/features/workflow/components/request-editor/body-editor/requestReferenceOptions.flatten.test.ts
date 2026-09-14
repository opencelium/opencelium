import { describe, expect, it } from 'vitest';
import { buildReferenceValue, flattenReferencePaths } from './requestReferenceOptions';

describe('flattenReferencePaths', () => {
	it('emits a reference-grammar path for every scalar leaf, and none for containers', () => {
		const entries = flattenReferencePaths({
			id: 0,
			customer: { email: '', active: true },
		});

		expect(entries.map((entry) => entry.path)).toEqual([
			'$.id', '$.customer.email', '$.customer.active',
		]);
		expect(entries.map((entry) => entry.kind)).toEqual(['number', 'string', 'boolean']);
	});

	it('pairs each path with the react-json-view address of the same leaf', () => {
		const entries = flattenReferencePaths({ customer: { email: '' } });

		expect(entries[0]).toMatchObject({ namespace: ['customer'], name: 'email' });
	});

	it('descends into an array through its first element', () => {
		const entries = flattenReferencePaths({ items: [{ sku: '' }] });

		expect(entries[0].path).toBe('$.items[0].sku');
		expect(entries[0]).toMatchObject({ namespace: ['items', '0'], name: 'sku' });
	});

	it('quotes keys the reference grammar cannot express bare', () => {
		const entries = flattenReferencePaths({ 'order no': '' });

		expect(entries[0].path).toBe("$.['order no']");
	});

	it('produces paths buildReferenceValue accepts unchanged', () => {
		const [entry] = flattenReferencePaths({ items: [{ sku: '' }] });

		expect(buildReferenceValue('#aabbcc', 'body', entry.path))
			.toBe('#aabbcc.(response).body.$.items[0].sku');
	});

	it('stops at a self-referencing depth rather than recursing forever', () => {
		const node: Record<string, unknown> = { name: '' };
		node.child = node;

		expect(() => flattenReferencePaths(node)).not.toThrow();
	});
});
