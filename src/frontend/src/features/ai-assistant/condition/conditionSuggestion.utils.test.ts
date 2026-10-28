import { describe, expect, it } from 'vitest';
import { conditionTreeToExpression, validateConditionTreeWithErrors } from '@features/workflow/components/condition-builder/conditionBuilder.utils';
import { generateTreeByExpression } from '@features/workflow/components/condition-builder/conditionExpressionParser';
import type { ConditionRule } from '@features/workflow/components/condition-builder/conditionBuilder.types';
import type { MappingSource } from '../mapping/mappingCandidates';
import type { ConditionSuggestion } from '../model/aiGateway.types';
import { suggestionToTree } from './conditionSuggestion.utils';

const source = (id: string, path: string): MappingSource => ({
	id, methodId: 'm', step: 'Get tickets', system: 'Zammad', path, reference: `#FFCFB5.(response).body.$.${path}`,
});
const sources = [source('s1', 'tickets[i].priority'), source('s2', 'tickets[i].state'), source('s3', 'existing[*].title')];

const suggestion = (rules: ConditionSuggestion['rules'], conjunction: 'and' | 'or' = 'and'): ConditionSuggestion =>
	({ conjunction, not: false, rules, explanation: '', durationMs: 1, model: 'm' });

const rulesOf = (tree: ReturnType<typeof suggestionToTree>) => (tree?.items ?? []) as ConditionRule[];

describe('suggestionToTree', () => {
	const tree = suggestionToTree(suggestion([
		{ left: 's1', operator: '=', right: { kind: 'value', value: 'high' } },
		{ left: 's2', operator: 'NotEmpty', right: { kind: 'none' } },
		{ left: 's3', operator: 'NotContains', right: { kind: 'source', source: 's1' } },
	]), sources);

	it('writes each side as the reference the dialog pickers would, or as the fixed text', () => {
		expect(tree?.properties).toEqual({ conjunction: '&&', not: false });
		expect(rulesOf(tree).map((rule) => rule.properties)).toEqual([
			{ leftField: '#FFCFB5.(response).body.$.tickets[i].priority', operator: '=', rightField: 'high' },
			{ leftField: '#FFCFB5.(response).body.$.tickets[i].state', operator: 'NotEmpty' },
			{ leftField: '#FFCFB5.(response).body.$.existing[*].title', operator: 'NotContains', rightField: '#FFCFB5.(response).body.$.tickets[i].priority' },
		]);
	});

	it('passes the dialog validation and survives the round trip through its expression', () => {
		expect(validateConditionTreeWithErrors(tree!, 'if').isValid).toBe(true);
		const expression = conditionTreeToExpression(tree!, 'if');
		const parsed = generateTreeByExpression(expression, 'if');
		expect(conditionTreeToExpression(parsed!, 'if')).toBe(expression);
	});

	it('refuses a rule that names a value that was not offered', () => {
		expect(suggestionToTree(suggestion([{ left: 's9', operator: '=', right: { kind: 'value', value: 'x' } }]), sources)).toBeUndefined();
	});
});
