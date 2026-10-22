import { createShortId } from '@shared/lib/createId';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { buildConditionConfig } from '../components/condition-builder/conditionBuilder.utils';
import type { ConditionChild,
	ConditionGroup } from '../components/condition-builder/conditionBuilder.types';
import type { ReferenceMatcher } from './graph.referenceColors';

// A conjunction joins two or more items; the condition dialog rejects one left on a
// group that the cleanup shrank to a single item.
const withoutLoneConjunction = (group: ConditionGroup): ConditionGroup => {
	if ((group.items ?? []).length > 1 || group.properties?.conjunction === undefined) return group;
	const properties = { ...group.properties };
	delete properties.conjunction;
	return { ...group, properties };
};

const removeMatchingRules = (
	group: ConditionGroup,
	matches: ReferenceMatcher,
): ConditionGroup => withoutLoneConjunction({
	...group,
	items: (group.items ?? []).flatMap<ConditionChild>((item) => {
		if (item.type === 'rule') {
			return matches([item.properties?.leftField, item.properties?.rightField]) ? [] : [item];
		}
		const nested = removeMatchingRules(item, matches);
		return (nested.items ?? []).length ? [nested] : [];
	}),
});

export const removeConditionReferences = (
	conditionConfig: WorkflowNodeModel['data']['conditionConfig'],
	matches: ReferenceMatcher,
) => {
	if (!conditionConfig?.tree) return conditionConfig;
	const cleanedTree = removeMatchingRules(conditionConfig.tree, matches);
	const tree = conditionConfig.operatorType === 'loop' && !cleanedTree.items?.length
		? { ...cleanedTree, items: [{ id: createShortId('rule'), type: 'rule' as const }] }
		: cleanedTree;
	return buildConditionConfig(
		conditionConfig.operatorType,
		tree,
		conditionConfig.iterator,
	);
};
