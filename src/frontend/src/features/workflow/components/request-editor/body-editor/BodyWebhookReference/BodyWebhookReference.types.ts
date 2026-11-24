import type { Connection, MethodWithId } from '../../../../types/connection';

export type BodyWebhookReferenceProps = {
	webhook: string;
	onRemove?: (webhook: string) => void;
	/** Replaces this webhook with the reference picked in the editor. */
	onEdit?: (webhook: string, reference: string) => void;
	connection?: Connection;
	currentMethod?: MethodWithId;
};
