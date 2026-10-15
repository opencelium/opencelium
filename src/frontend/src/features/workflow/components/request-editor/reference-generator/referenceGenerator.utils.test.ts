import { describe, expect, it } from 'vitest';
import { getReferenceFilterTerm } from './referenceGenerator.utils';

describe('getReferenceFilterTerm', () => {
	it('filters by the key being typed after the last separator', () => {
		expect(getReferenceFilterTerm('node.Obj')).toBe('obj');
		expect(getReferenceFilterTerm('servers[0].na')).toBe('na');
		expect(getReferenceFilterTerm('node.')).toBe('');
	});

	it('turns an unfinished bracket into a syntax term', () => {
		expect(getReferenceFilterTerm('servers[')).toBe('[');
		expect(getReferenceFilterTerm('servers[-')).toBe('[-');
		expect(getReferenceFilterTerm("node['")).toBe("['");
	});
});
