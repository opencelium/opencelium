import { createShortId } from '@shared/lib/createId';
import type { ConditionGroup, ConditionRule } from './conditionBuilder.types';

export const createConditionId = (prefix: string) => createShortId(prefix);

export const createEmptyRule = (): ConditionRule => ({
	id: createConditionId('rule'),
	type: 'rule',
});

export const createEmptyGroup = (operatorType: 'if' | 'loop'): ConditionGroup => ({
	id: createConditionId('group'),
	type: 'group',
	properties: { not: false },
	items: operatorType === 'loop' ? [createEmptyRule()] : undefined,
});
