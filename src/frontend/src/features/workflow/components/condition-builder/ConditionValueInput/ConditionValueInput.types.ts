import type { MethodWithId } from '../../../types/connection';
import type { ConditionRuleProperties } from '../conditionBuilder.types';

export type ConditionValueInputProps = {
	side: 'left' | 'right';
	properties: ConditionRuleProperties;
	methods: MethodWithId[];
	allMethods: MethodWithId[];
	iterators: string[];
	onChange: (patch: Partial<ConditionRuleProperties>) => void;
};
