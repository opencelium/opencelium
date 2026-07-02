export type ConditionValueSource = 'constant' | 'direct' | 'webhook';

export const Conjunction = {
	AND: '&&',
	OR: '||',
} as const;

export type Conjunction = (typeof Conjunction)[keyof typeof Conjunction];

export type ConditionRuleProperties = {
	leftField?: string;
	operator?: IfOperatorName | LoopOperatorName | '';
	rightField?: string;
};

export type ConditionRule = {
	id: string;
	type: 'rule';
	error?: string;
	properties?: ConditionRuleProperties;
};

export type ConditionGroupProperties = {
	conjunction?: Conjunction;
	not?: boolean;
};

export type ConditionGroup = {
	id: string;
	type: 'group';
	error?: string;
	properties?: ConditionGroupProperties;
	items?: ConditionChild[];
};

export type ConditionChild = ConditionRule | ConditionGroup;

export type ConditionTree = ConditionGroup;

export type ConditionConfig = {
	operatorType: 'if' | 'loop';
	tree: ConditionTree;
	expression: string;
	iterator?: string;
};

export const IfOperatorName = {
	Equal: '=',
	NotEqual: '!=',
	Like: 'Like',
	NotLike: 'NotLike',
	GreaterThan: '>',
	GreaterOrEqual: '>=',
	LessThan: '<',
	LessOrEqual: '<=',
	Contains: 'Contains',
	NotContains: 'NotContains',
	ContainsSubStr: 'ContainsSubStr',
	NotContainsSubStr: 'NotContainsSubStr',
	AllowList: 'AllowList',
	DenyList: 'DenyList',
	IsTypeOf: 'IsTypeOf',
	PropertyExists: 'PropertyExists',
	PropertyNotExists: 'PropertyNotExists',
	RegEx: 'RegExp',
	IsEmpty: 'IsEmpty',
	IsNotEmpty: 'NotEmpty',
	IsNull: 'IsNull',
	IsNotNull: 'NotNull',
} as const;

export type IfOperatorName = (typeof IfOperatorName)[keyof typeof IfOperatorName];

export const LoopOperatorName = {
	For: 'for',
	ForIn: 'forin',
	SplitString: 'SplitString',
} as const;

export type LoopOperatorName = (typeof LoopOperatorName)[keyof typeof LoopOperatorName];

export const IF_OPERATOR_LABEL_KEYS: Record<IfOperatorName, string> = {
	[IfOperatorName.Equal]: 'conditionBuilder.operators.if.equal',
	[IfOperatorName.NotEqual]: 'conditionBuilder.operators.if.notEqual',
	[IfOperatorName.Like]: 'conditionBuilder.operators.if.like',
	[IfOperatorName.NotLike]: 'conditionBuilder.operators.if.notLike',
	[IfOperatorName.GreaterThan]: 'conditionBuilder.operators.if.greaterThan',
	[IfOperatorName.GreaterOrEqual]: 'conditionBuilder.operators.if.greaterOrEqual',
	[IfOperatorName.LessThan]: 'conditionBuilder.operators.if.lessThan',
	[IfOperatorName.LessOrEqual]: 'conditionBuilder.operators.if.lessOrEqual',
	[IfOperatorName.Contains]: 'conditionBuilder.operators.if.contains',
	[IfOperatorName.NotContains]: 'conditionBuilder.operators.if.notContains',
	[IfOperatorName.ContainsSubStr]: 'conditionBuilder.operators.if.containsSubStr',
	[IfOperatorName.NotContainsSubStr]: 'conditionBuilder.operators.if.notContainsSubStr',
	[IfOperatorName.AllowList]: 'conditionBuilder.operators.if.allowList',
	[IfOperatorName.DenyList]: 'conditionBuilder.operators.if.denyList',
	[IfOperatorName.IsTypeOf]: 'conditionBuilder.operators.if.isTypeOf',
	[IfOperatorName.PropertyExists]: 'conditionBuilder.operators.if.propertyExists',
	[IfOperatorName.PropertyNotExists]: 'conditionBuilder.operators.if.propertyNotExists',
	[IfOperatorName.RegEx]: 'conditionBuilder.operators.if.regEx',
	[IfOperatorName.IsEmpty]: 'conditionBuilder.operators.if.isEmpty',
	[IfOperatorName.IsNotEmpty]: 'conditionBuilder.operators.if.isNotEmpty',
	[IfOperatorName.IsNull]: 'conditionBuilder.operators.if.isNull',
	[IfOperatorName.IsNotNull]: 'conditionBuilder.operators.if.isNotNull',
};

export const LOOP_OPERATOR_LABEL_KEYS: Record<LoopOperatorName, string> = {
	[LoopOperatorName.For]: 'conditionBuilder.operators.loop.for',
	[LoopOperatorName.ForIn]: 'conditionBuilder.operators.loop.forIn',
	[LoopOperatorName.SplitString]: 'conditionBuilder.operators.loop.splitString',
};

export const UNARY_IF_OPERATORS = new Set<IfOperatorName>([
	IfOperatorName.IsEmpty,
	IfOperatorName.IsNotEmpty,
	IfOperatorName.IsNull,
	IfOperatorName.IsNotNull,
]);
