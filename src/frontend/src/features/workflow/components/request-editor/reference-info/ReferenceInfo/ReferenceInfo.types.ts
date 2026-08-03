import type { MessageProperty } from '../../shared/messageProperty';
import type { MethodWithId } from '../../../../types/connection';

export type ReferenceInfoProps = {
	messageProperty: MessageProperty;
	data: any;
	onReferenceClick?: (enhanceId: string) => void;
};

export type FieldReference = {
	target: string;
	method: MethodWithId | null;
	color: string;
	enhanceId: string;
	sourceMessageProperty: string;
};
