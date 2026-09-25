import type { MethodWithId } from '../../../types/connection';
import type { ConditionRule, ConditionRuleProperties } from '../conditionBuilder.types';

export type RuleRowProps = {
	rule: ConditionRule;
	operatorType: 'if' | 'loop';
	methods: MethodWithId[];
	allMethods: MethodWithId[];
	iterators: string[];
	canDelete: boolean;
	onChange: (patch: Partial<ConditionRuleProperties>) => void;
	onDelete: () => void;
	onDuplicate: () => void;
};
