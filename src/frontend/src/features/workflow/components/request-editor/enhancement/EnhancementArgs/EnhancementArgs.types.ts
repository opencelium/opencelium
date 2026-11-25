import type { Enhancement } from '../../../../types/connection';

export type EnhancementArgsProps = {
	enhancement: Enhancement;
};

export type ParsedArgEntry = {
	key: string;
	path: string;
	color: string;
	methodName: string;
	direction: 'request' | 'response';
	messageProperty: string;
};

export type GlobalArgEntry = {
	key: string;
	reference: string;
};

export type ArgRow =
	| { kind: 'method'; entry: ParsedArgEntry }
	| { kind: 'global'; entry: GlobalArgEntry };
