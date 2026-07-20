import { ApiFetchError } from '@shared/api/apiFetch';
import { buildWorkflowIndexes } from '../api/connectionPayload';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';

type WorkflowErrorBody = { status?: number; error?: string; message?: string };

// Matches the backend's ExceptionMessages.OPERATOR_EXPRESSION_IS_EMPTY format:
// "Operator (index=%s, type=%s) has null or empty expression"
const OPERATOR_INDEX_RE = /index=([^,]+),\s*type=([^)]+)\)/;

export type WorkflowApiErrorResolution = {
	messageKey: string;
	messageParams?: Record<string, string>;
	nodeId?: string;
};

// antd's message.error default duration is 3s — these resolved messages are longer and
// name a specific node, so give the user more time to actually read them.
export const RESOLVED_WORKFLOW_ERROR_MESSAGE_DURATION_SEC = 8;

const findNodeIdByIndex = (nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[], index: string): string | undefined => {
	const indexes = buildWorkflowIndexes(nodes, edges);
	for (const [nodeId, nodeIndex] of indexes) {
		if (nodeIndex === index) return nodeId;
	}
	return undefined;
};

/**
 * Recognizes known backend validation error codes (GeneralServiceException's
 * `{status, error, message}` shape) and resolves them to a translation key —
 * plus, when the error names a specific operator (OPERATOR_EXPRESSION_IS_EMPTY
 * embeds its workflow tree-path index in the message text), the node it points
 * at so the caller can highlight it.
 *
 * Returns null for errors this doesn't recognize, so the caller can fall back
 * to its own generic "failed to save/start" message.
 */
export const resolveWorkflowApiError = (
	error: unknown,
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
): WorkflowApiErrorResolution | null => {
	const body = error instanceof ApiFetchError ? (error.body as WorkflowErrorBody | undefined) : undefined;
	const code = body?.error;
	if (!code) return null;

	if (code === 'CONNECTOR_NOT_FOUND') {
		return { messageKey: 'connection.messages.saveFailed.connectorNotFound' };
	}

	if (code === 'OPERATOR_EXPRESSION_IS_EMPTY') {
		const match = body?.message?.match(OPERATOR_INDEX_RE);
		const index = match?.[1];
		const operatorType = match?.[2];
		return {
			messageKey: 'connection.messages.saveFailed.operatorExpressionEmpty',
			messageParams: operatorType ? { type: operatorType } : undefined,
			nodeId: index ? findNodeIdByIndex(nodes, edges, index) : undefined,
		};
	}

	return null;
};
