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

export const IF_OPERATOR_LABELS: Record<IfOperatorName, string> = {
	[IfOperatorName.Equal]: '=',
	[IfOperatorName.NotEqual]: '!=',
	[IfOperatorName.Like]: 'Like',
	[IfOperatorName.NotLike]: 'Not Like',
	[IfOperatorName.GreaterThan]: '>',
	[IfOperatorName.GreaterOrEqual]: '>=',
	[IfOperatorName.LessThan]: '<',
	[IfOperatorName.LessOrEqual]: '<=',
	[IfOperatorName.Contains]: 'Contains',
	[IfOperatorName.NotContains]: 'Not Contains',
	[IfOperatorName.ContainsSubStr]: 'Contains Substring',
	[IfOperatorName.NotContainsSubStr]: 'Not Contains Substring',
	[IfOperatorName.AllowList]: 'Allow List',
	[IfOperatorName.DenyList]: 'Deny List',
	[IfOperatorName.IsTypeOf]: 'Is Type Of',
	[IfOperatorName.PropertyExists]: 'Property Exists',
	[IfOperatorName.PropertyNotExists]: 'Property Not Exists',
	[IfOperatorName.RegEx]: 'Reg Exp',
	[IfOperatorName.IsEmpty]: 'Is Empty',
	[IfOperatorName.IsNotEmpty]: 'Is Not Empty',
	[IfOperatorName.IsNull]: 'Is Null',
	[IfOperatorName.IsNotNull]: 'Is Not Null',
};

export const LOOP_OPERATOR_LABELS: Record<LoopOperatorName, string> = {
	[LoopOperatorName.For]: 'For',
	[LoopOperatorName.ForIn]: 'ForIn',
	[LoopOperatorName.SplitString]: 'SplitString',
};

export const UNARY_IF_OPERATORS = new Set<IfOperatorName>([
	IfOperatorName.IsEmpty,
	IfOperatorName.IsNotEmpty,
	IfOperatorName.IsNull,
	IfOperatorName.IsNotNull,
]);
