export type Operator = IfOperator | LoopOperator;
export type OperatorWithId = IfOperatorWithId | LoopOperatorWithId;

export interface GeneralOperator {
	index: string;
	ui?: string | null;
	dataAggregator?: number | null;
	expression?: string;
}

export interface GeneralOperatorWithId extends GeneralOperator {
	id: string;
}

export interface IfOperator extends GeneralOperator {
	type: typeof OperatorType.If;
}

export interface LoopOperator extends GeneralOperator {
	iterator: string;
	type: typeof OperatorType.Loop;
}

export interface IfOperatorWithId extends GeneralOperatorWithId {
	type: typeof OperatorType.If;
}

export interface LoopOperatorWithId extends GeneralOperatorWithId {
	iterator: string;
	type: typeof OperatorType.Loop;
}

export const OperatorType = { Loop: 'loop', If: 'if' } as const;
export type OperatorType = (typeof OperatorType)[keyof typeof OperatorType];
