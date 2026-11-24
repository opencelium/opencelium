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
