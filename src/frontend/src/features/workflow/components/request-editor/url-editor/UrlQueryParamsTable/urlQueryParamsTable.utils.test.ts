import { describe, expect, it } from 'vitest';
import { hasInlineReference } from './urlQueryParamsTable.utils';

describe('hasInlineReference', () => {
	it('detects endpoint args', () => {
		expect(hasInlineReference('#{%arg1%}')).toBe(true);
	});

	it('detects global references in a key or value', () => {
		expect(hasInlineReference('{{global.tewe}}')).toBe(true);
		expect(hasInlineReference('prefix-{{global.a.b}}')).toBe(true);
	});

	it('ignores plain text, unfinished and escaped globals', () => {
		expect(hasInlineReference('')).toBe(false);
		expect(hasInlineReference('limit')).toBe(false);
		expect(hasInlineReference('{{global.tewe')).toBe(false);
		expect(hasInlineReference('\\{{global.tewe}}')).toBe(false);
	});
});
