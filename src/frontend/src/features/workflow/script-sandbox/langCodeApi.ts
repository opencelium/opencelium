import { apiExecutor } from '@shared/api/apiExecutor';
import type {
	ScriptExecutionRequest,
	ScriptExecutionResponse,
	ScriptRequestFailure,
	ScriptValidationResponse,
} from './langCode.types';

const options = { ignoreError: true, skipEntityInvalidation: true };

const isRecord = (value: unknown): value is Record<string, unknown> =>
	!!value && typeof value === 'object' && !Array.isArray(value);

const isValidationResponse = (value: unknown): value is ScriptValidationResponse =>
	isRecord(value) && typeof value.valid === 'boolean' && Array.isArray(value.errors);

const isExecutionResponse = (value: unknown): value is ScriptExecutionResponse =>
	isRecord(value) && typeof value.success === 'boolean' && 'result' in value;

const toFailure = (value: unknown): ScriptRequestFailure => {
	const status = isRecord(value) && typeof value.status === 'number' ? value.status : null;
	const data = isRecord(value) && isRecord(value.data) ? value.data : null;
	return { status, code: typeof data?.error === 'string' ? data.error : null };
};

/**
 * Not RTK Query: the enhancement editor renders inside MethodConfigDialog's nested
 * legacy Redux store, which has no `api` slice; apiExecutor dispatches on the app store.
 * Errors are not toasted — a failed check just shows no markers.
 */
export const validateScript = async (script: string): Promise<ScriptValidationResponse | null> => {
	const response: unknown = await apiExecutor({
		url: '/lang-code/validate',
		method: 'POST',
		body: { language: 'js', script },
		options,
	});
	return isValidationResponse(response) ? response : null;
};

export const executeScript = async (
	body: ScriptExecutionRequest,
): Promise<{ kind: 'response'; response: ScriptExecutionResponse } | { kind: 'failure'; failure: ScriptRequestFailure }> => {
	const response: unknown = await apiExecutor({ url: '/lang-code/execute', method: 'POST', body, options });
	return isExecutionResponse(response)
		? { kind: 'response', response }
		: { kind: 'failure', failure: toFailure(response) };
};
