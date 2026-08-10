import type { MessageProperty } from '../../shared/messageProperty';

export type ReferenceInfoSectionProps = {
	messageProperty: MessageProperty;
	data: any;
	onReferenceClick?: (enhanceId: string) => void;
};
