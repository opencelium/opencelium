import type { ScriptRequestFailure } from '@features/workflow/script-sandbox/langCode.types';

const knownCodes = [
	'SCRIPT_IS_EMPTY',
	'SCRIPT_TOO_LARGE',
	'UNSUPPORTED_LANGUAGE',
	'INVALID_VARIABLE_NAME',
	'VARIABLES_TOO_LARGE',
	'TOO_MANY_SCRIPT_RUNS',
	'SCRIPT_ENGINE_UNAVAILABLE',
	'SCRIPT_RUN_INTERRUPTED',
];

/** i18n key for a test run the backend refused before running the script. */
export function rejectionKey({ status, code }: ScriptRequestFailure): string {
	if (code && knownCodes.includes(code)) return `sandbox.rejected.${code}`;
	if (status === 429) return 'sandbox.rejected.TOO_MANY_SCRIPT_RUNS';
	if (status === 401) return 'sandbox.rejected.unauthorized';
	if (status === 503) return 'sandbox.rejected.SCRIPT_ENGINE_UNAVAILABLE';
	return 'sandbox.rejected.failed';
}
