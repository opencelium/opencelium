import type { Connection, MethodWithId } from '../../../../types/connection';

export type LegacyBodyReferenceGeneratorProps = {
	connection: Connection;
	currentMethod: MethodWithId;
	onApply: (reference: string) => void;
	showWebhookOption?: boolean;
};

export type WorkflowEdgeLike = {
	source?: string;
	target?: string;
};
