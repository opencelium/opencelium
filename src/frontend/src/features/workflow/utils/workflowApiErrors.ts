import { ApiFetchError } from '@shared/api/apiFetch';
import { buildOperatorIndexes } from '../api/connectionPayload';
import type { WorkflowEdgeModel, WorkflowNodeModel } from '../types/workflow.types';

type WorkflowErrorBody = { status?: number; error?: string; message?: string };

// The backend's ExceptionMessages.OPERATOR_EXPRESSION_IS_EMPTY format, whose text
// carries the two things the code alone doesn't: which operator, and of what kind.
// "Operator (index=%s, type=%s) has null or empty expression"
// Unanchored on purpose, so it still matches when the sentence arrives wrapped in an
// exception class name.
const OPERATOR_EXPRESSION_EMPTY_RE =
	/Operator\s*\(index=([^,]+),\s*type=([^)]+)\)\s*has null or empty expression/i;

export type WorkflowApiErrorResolution =
	| {
		/** A backend code this project has its own translated copy for. */
		source: 'translated';
		messageKey: string;
		messageParams?: Record<string, string>;
		/** The operator the message points at, when the error named one. */
		nodeId?: string;
	}
	| {
		/** Anything else the backend bothered to explain. Untranslated, but its
		 * own words beat a generic "could not save" line that says nothing. */
		source: 'backend';
		message: string;
	};

const findOperatorNodeIdByIndex = (nodes: WorkflowNodeModel[], edges: WorkflowEdgeModel[], index: string): string | undefined => {
	for (const [nodeId, operatorIndex] of buildOperatorIndexes(nodes, edges)) {
		if (operatorIndex === index) return nodeId;
	}
	return undefined;
};

/**
 * Turns a failed save / test-start into something worth showing the user.
 * Known backend codes (GeneralServiceException's `{status, error, message}`
 * shape) resolve to project copy — plus, when the error names a specific
 * operator (OPERATOR_EXPRESSION_IS_EMPTY embeds its workflow tree-path index in
 * the message text), the node it points at, so the caller can highlight it.
 * Any other explained failure comes back with the backend's own message.
 *
 * Returns null only when there is nothing to say beyond "it failed" (transport
 * errors, empty bodies), leaving the caller its generic message.
 */
export const resolveWorkflowApiError = (
	error: unknown,
	nodes: WorkflowNodeModel[],
	edges: WorkflowEdgeModel[],
): WorkflowApiErrorResolution | null => {
	const body = error instanceof ApiFetchError ? (error.body as WorkflowErrorBody | undefined) : undefined;

	// Thrown as a plain RuntimeException (ConnectionServiceImp.save/update), so it falls
	// through to the generic 500 handler: `error` stays "INTERNAL_SERVER_ERROR" and the
	// actual code lands in `message` instead of `error`, unlike the GeneralServiceException
	// cases below.
	if (body?.message === 'TITLE_HAS_ALREADY_TAKEN') {
		return { source: 'translated', messageKey: 'connection.messages.saveFailed.titleTaken' };
	}

	if (body?.error === 'CONNECTOR_NOT_FOUND') {
		return { source: 'translated', messageKey: 'connection.messages.saveFailed.connectorNotFound' };
	}

	// Recognized by its message as well as by its code: the same failure also arrives
	// as a plain 500 (like TITLE_HAS_ALREADY_TAKEN above), where `error` is
	// INTERNAL_SERVER_ERROR and the sentence is the only thing identifying it. Without
	// this the operator it names goes un-highlighted.
	const operatorMatch = body?.message?.match(OPERATOR_EXPRESSION_EMPTY_RE);
	if (operatorMatch || body?.error === 'OPERATOR_EXPRESSION_IS_EMPTY') {
		const index = operatorMatch?.[1];
		const operatorType = operatorMatch?.[2];
		return {
			source: 'translated',
			messageKey: 'connection.messages.saveFailed.operatorExpressionEmpty',
			messageParams: operatorType ? { type: operatorType } : undefined,
			nodeId: index ? findOperatorNodeIdByIndex(nodes, edges, index) : undefined,
		};
	}

	// A message the backend put there on purpose: `statusText` fallbacks and
	// transport failures (no body at all) are left to the caller's generic copy.
	return body?.message ? { source: 'backend', message: body.message } : null;
};
