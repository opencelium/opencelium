import { describe, expect, it } from 'vitest';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { describeConditionTerms } from './graph.conditionTerms';

const READ = '#7ed321.(response).body.$.id';

const rule = (id: string, leftField: string, operator = '=', rightField = "'1'") =>
	({ id, type: 'rule' as const, properties: { leftField, operator, rightField } });

const operator = (items: unknown[], operatorType: 'if' | 'loop' = 'if') => ({
	id: 'if-1', type: operatorType, position: { x: 0, y: 0 },
	data: { title: 'Only new ones', kind: operatorType, conditionConfig: {
		operatorType, expression: '', tree: { id: 'root', type: 'group',
			properties: { conjunction: '&&' }, items } } },
}) as unknown as WorkflowNodeModel;

describe('describeConditionTerms', () => {
	it('reads each rule as the line the user wrote', () => {
		const node = operator([rule('r1', `{%${READ}%}`, '=', "'new'")]);

		expect(describeConditionTerms(node, READ))
			.toEqual([{ id: 'r1', text: `${READ} = new`, holdsReference: true }]);
	});

	// The operator's name is the same answer for every rule; this is the half
	// that says which of them.
	it('marks only the rules that hold the reference', () => {
		const node = operator([
			rule('r1', `{%${READ}%}`),
			rule('r2', "{%#3fa9f5.(response).body.$.id%}"),
			rule('r3', "'x'", '=', `{%${READ}%}`),
		]);

		expect(describeConditionTerms(node, READ).map((term) => term.holdsReference))
			.toEqual([true, false, true]);
	});

	it('matches a reference stored in another case', () => {
		const node = operator([rule('r1', '{%#7ED321.(response).body.$.id%}')]);

		expect(describeConditionTerms(node, READ)[0].holdsReference).toBe(true);
	});

	// Which bracket a rule sits in matters when authoring a condition, not when
	// asking which rules mention a method.
	it('reads rules out of nested groups too', () => {
		const node = operator([
			rule('r1', "'a'"),
			{ id: 'g1', type: 'group', properties: { conjunction: '||' },
				items: [rule('r2', `{%${READ}%}`)] },
		]);

		const terms = describeConditionTerms(node, READ);

		expect(terms.map((term) => term.id)).toEqual(['r1', 'r2']);
		expect(terms[1].holdsReference).toBe(true);
	});

	it('falls back to the expression when a condition has no tree', () => {
		const node = {
			id: 'if-1', type: 'if', position: { x: 0, y: 0 },
			data: { title: 'Legacy', kind: 'if', conditionConfig: {
				operatorType: 'if', expression: `{%${READ}%} = '1'`, tree: undefined } },
		} as unknown as WorkflowNodeModel;

		const terms = describeConditionTerms(node, READ);

		expect(terms).toHaveLength(1);
		expect(terms[0].holdsReference).toBe(true);
	});
});
