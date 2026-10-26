import type { AiGatewayErrorBody } from '../model/aiGateway.types';
import type { AiGenerationFailure } from '../model/aiPanelState';

export type AiGenerationError = { failure: AiGenerationFailure; message?: string } | { failure: 'aborted' };

function isGatewayErrorBody(data: unknown): data is AiGatewayErrorBody {
	if (typeof data !== 'object' || data === null || !('error' in data)) return false;
	const { error } = data as { error: unknown };
	return typeof error === 'object' && error !== null && 'type' in error;
}

/** Maps an RTK Query mutation rejection (FetchBaseQueryError or SerializedError) to what the panel shows. */
export function toAiGenerationError(error: unknown): AiGenerationError {
	if (typeof error !== 'object' || error === null) return { failure: 'generation-failed' };
	if ('name' in error && error.name === 'AbortError') return { failure: 'aborted' };
	if (!('status' in error)) return { failure: 'generation-failed' };
	if (error.status === 'FETCH_ERROR' || error.status === 'TIMEOUT_ERROR') return { failure: 'unreachable' };

	const data = 'data' in error ? error.data : undefined;
	if (!isGatewayErrorBody(data)) return { failure: 'generation-failed' };
	if (data.error.type === 'UNKNOWN_INVOKER') return { failure: 'unknown-invoker', message: data.error.message };
	return { failure: 'generation-failed', message: data.error.message };
}
