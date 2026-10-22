import { describe, expect, it } from 'vitest';
import { buildConditionConfig } from '../components/condition-builder/conditionBuilder.utils';
import { Conjunction, IfOperatorName, type ConditionGroup, type ConditionRule }
	from '../components/condition-builder/conditionBuilder.types';
import { removeConditionReferences } from './graph.conditionReferenceCleanup';

const DELETED = '#98BEC7.(response).body.$.items';
const KEPT = '#111111.(response).body.$.a';
const matchesDeleted = (value: unknown) => JSON.stringify(value).includes('98BEC7');
const rule = (id: string, leftField: string, rightField = 'x'): ConditionRule =>
	({ id, type: 'rule', properties: { operator: IfOperatorName.Equal, leftField, rightField } });
const ifConfig = (tree: ConditionGroup) => buildConditionConfig('if', tree);

describe('removeConditionReferences', () => {
	it('drops the conjunction of a group left with a single rule', () => {
		const cleaned = removeConditionReferences(ifConfig({ id: 'g', type: 'group',
			properties: { conjunction: Conjunction.AND }, items: [rule('r1', DELETED), rule('r2', KEPT, 'y')] }), matchesDeleted);
		expect(cleaned?.tree.properties?.conjunction).toBeUndefined();
		expect(cleaned?.tree.items).toHaveLength(1);
		expect(cleaned?.expression).toBe(`({%${KEPT}%} = 'y')`);
	});

	it('keeps the conjunction while two or more items remain, nested groups included', () => {
		const nested: ConditionGroup = { id: 'n', type: 'group', properties: { conjunction: Conjunction.OR },
			items: [rule('r3', DELETED), rule('r4', KEPT)] };
		const cleaned = removeConditionReferences(ifConfig({ id: 'g', type: 'group',
			properties: { conjunction: Conjunction.AND }, items: [rule('r1', KEPT), rule('r2', KEPT), nested] }), matchesDeleted);
		expect(cleaned?.tree.properties?.conjunction).toBe(Conjunction.AND);
		const [, , cleanedNested] = cleaned?.tree.items ?? [];
		expect(cleanedNested?.type === 'group' && cleanedNested.properties?.conjunction).toBeUndefined();
	});
});
