import { describe, expect, it } from 'vitest';
import { conditionTreeToExpression, getSourceFromField } from './conditionBuilder.utils';
import { generateTreeByExpression } from './conditionExpressionParser';
import type { ConditionGroup, ConditionRule } from './conditionBuilder.types';

const rule = (leftField: string, operator: string, rightField?: string): ConditionGroup => ({
	id: 'g', type: 'group', properties: { conjunction: '&&' },
	items: [{ id: 'r', type: 'rule', properties: { leftField, operator: operator as never, rightField } }],
});

const firstRule = (group: ConditionGroup | null) => group?.items?.[0] as ConditionRule | undefined;

describe('global variables in conditions', () => {
	it('recognises a global reference as its own source', () => {
		expect(getSourceFromField('{{global.maxItems}}')).toBe('global');
		expect(getSourceFromField('{{global.tenants[0].id}}')).toBe('global');
		expect(getSourceFromField("{{global.x}} plus text")).toBe('constant');
	});

	it('writes a global operand unquoted and reads it back', () => {
		const expression = conditionTreeToExpression(rule('{{global.maxItems}}', '>', '5'), 'if');
		expect(expression).toContain('{{global.maxItems}} >');
		expect(expression).not.toContain("'{{global.maxItems}}'");
		expect(firstRule(generateTreeByExpression(expression, 'if'))?.properties?.leftField).toBe('{{global.maxItems}}');
	});

	it('loops over a global array', () => {
		const expression = conditionTreeToExpression(rule('{{global.tenants}}', 'for'), 'loop');
		expect(expression).toBe('for {{global.tenants}}');
		expect(firstRule(generateTreeByExpression(expression, 'loop'))?.properties?.leftField).toBe('{{global.tenants}}');
	});
});
