import { describe, expect, it } from 'vitest';
import { conditionTreeToExpression } from './conditionBuilder.utils';
import { generateTreeByExpression } from './conditionExpressionParser';

const direct = (path: string, direction: 'request' | 'response' = 'response') =>
	`{%#C77E7E.(${direction}).body.$.${path}%}`;

describe('conditionExpressionParser', () => {
	it('parses compound AND conditions from legacy workflows', () => {
		const tree = generateTreeByExpression(
			`(${direct('first')} NotEmpty && ${direct('second')} NotEmpty)`, 'if');

		expect(tree).toMatchObject({ properties: { conjunction: '&&' }, items: [
			{ type: 'rule', properties: { leftField: '#C77E7E.(response).body.$.first',
				operator: 'NotEmpty' } },
			{ type: 'rule', properties: { leftField: '#C77E7E.(response).body.$.second',
				operator: 'NotEmpty' } },
		] });
	});

	it('parses nested AND, OR, and NOT groups', () => {
		const expression = `(${direct('enabled')} = 'true' && !(${direct('count')} >= 5 || ${
			direct('state')} = 'blocked'))`;
		const tree = generateTreeByExpression(expression, 'if');

		expect(tree).toMatchObject({ properties: { conjunction: '&&' }, items: [
			{ type: 'rule', properties: { operator: '=', rightField: 'true' } },
			{ type: 'group', properties: { conjunction: '||', not: true }, items: [
				{ type: 'rule', properties: { operator: '>=', rightField: '5' } },
				{ type: 'rule', properties: { operator: '=', rightField: 'blocked' } },
			] },
		] });
	});

	it('accepts request references, webhooks, and unquoted literals', () => {
		expect(generateTreeByExpression(`${direct('id', 'request')} = 42`, 'if')).not.toBeNull();
		expect(generateTreeByExpression("${payload.id} != '0'", 'if')).not.toBeNull();
	});

	it('parses all LOOP expression forms', () => {
		expect(generateTreeByExpression(`for ${direct('items')}`, 'loop')).not.toBeNull();
		expect(generateTreeByExpression(`forin ${direct('items')} 'value'`, 'loop')).not.toBeNull();
		expect(generateTreeByExpression(`${direct('csv')} SplitString ','`, 'loop')).not.toBeNull();
	});

	it('rejects malformed expressions', () => {
		expect(generateTreeByExpression(`${direct('id')} =`, 'if')).toBeNull();
		expect(generateTreeByExpression(`(${direct('id')} = 1 &&)`, 'if')).toBeNull();
		expect(generateTreeByExpression(`for`, 'loop')).toBeNull();
		expect(generateTreeByExpression(`(${direct('id')} NotEmpty`, 'if')).toBeNull();
	});

	it('serializes parsed NOT groups without losing negation', () => {
		const tree = generateTreeByExpression(`!(${direct('id')} NotEmpty)`, 'if');
		expect(tree).not.toBeNull();
		expect(conditionTreeToExpression(tree!, 'if')).toMatch(/^!\(/);
	});
});
