import type { MessageProperty } from '../../shared/messageProperty';

export type ReferenceInfoSectionProps = {
	messageProperty: MessageProperty;
	data: any;
	readOnly?: boolean;
	onReferenceClick?: (enhanceId: string) => void;
};
