import type { MethodWithId } from '../../../types/connection';
import type { ConditionGroup } from '../conditionBuilder.types';

export type GroupEditorProps = {
	group: ConditionGroup;
	operatorType: 'if' | 'loop';
	methods: MethodWithId[];
	allMethods: MethodWithId[];
	iterators: string[];
	onDelete?: () => void;
	onChange: (group: ConditionGroup) => void;
};
