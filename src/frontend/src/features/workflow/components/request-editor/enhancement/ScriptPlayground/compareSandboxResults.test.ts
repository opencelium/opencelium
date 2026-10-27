import { describe, expect, it } from 'vitest';
import { compareSandboxResults } from './compareSandboxResults';

const value = (data: unknown) => ({ kind: 'value' as const, value: data, serverType: 'String' as const, console: [] });

describe('compareSandboxResults', () => {
	it('waits for both results', () => {
		expect(compareSandboxResults(value('a'), null)).toBe('pending');
	});

	it('compares printed values and ignores console output', () => {
		expect(compareSandboxResults(value('a'), { ...value('a'), console: ['log'] })).toBe('same');
		expect(compareSandboxResults(value('a'), value('b'))).toBe('different');
		expect(compareSandboxResults(value('a'), { kind: 'timeout' })).toBe('different');
	});
});
