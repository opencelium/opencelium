import { createShortId } from '@shared/lib/createId';
import type { WorkflowNodeModel } from '../types/workflow.types';
import { buildConditionConfig } from '../components/condition-builder/conditionBuilder.utils';
import type { ConditionChild,
	ConditionGroup } from '../components/condition-builder/conditionBuilder.types';
import { collectReferenceColors } from './graph.referenceColors';

const removeRulesWithColors = (
	group: ConditionGroup,
	colors: Set<string>,
): ConditionGroup => ({
	...group,
	items: (group.items ?? []).flatMap<ConditionChild>((item) => {
		if (item.type === 'rule') {
			const references = collectReferenceColors({
				leftField: item.properties?.leftField,
				rightField: item.properties?.rightField,
			});
			return [...references].some((color) => colors.has(color)) ? [] : [item];
		}
		const nested = removeRulesWithColors(item, colors);
		return (nested.items ?? []).length ? [nested] : [];
	}),
});

export const removeConditionReferenceColors = (
	conditionConfig: WorkflowNodeModel['data']['conditionConfig'],
	colors: Set<string>,
) => {
	if (!conditionConfig?.tree) return conditionConfig;
	const cleanedTree = removeRulesWithColors(conditionConfig.tree, colors);
	const tree = conditionConfig.operatorType === 'loop' && !cleanedTree.items?.length
		? { ...cleanedTree, items: [{ id: createShortId('rule'), type: 'rule' as const }] }
		: cleanedTree;
	return buildConditionConfig(
		conditionConfig.operatorType,
		tree,
		conditionConfig.iterator,
	);
};
