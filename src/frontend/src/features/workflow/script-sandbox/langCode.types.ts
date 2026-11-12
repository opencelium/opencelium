export type ScriptValidationError = {
	line: number | null;
	column: number | null;
	message: string;
	codeLine: string | null;
	hint: string;
};

export type ScriptValidationResponse = {
	valid: boolean;
	language: string;
	errors: ScriptValidationError[];
};

export type ScriptResultType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';
export type ScriptErrorType = 'SYNTAX' | 'RUNTIME' | 'TIMEOUT' | 'RESULT';

export type ScriptExecutionError = {
	type: ScriptErrorType;
	name: string | null;
	line: number | null;
	column: number | null;
	message: string;
	codeLine: string | null;
	hint: string;
};

export type ScriptExecutionRequest = {
	language: 'js';
	script: string;
	variables: Record<string, unknown>;
};

export type ScriptExecutionResponse = {
	success: boolean;
	language: string;
	result: unknown;
	resultType: ScriptResultType | null;
	output: string;
	durationMs: number;
	error: ScriptExecutionError | null;
};

/** A request the backend refused (non-2xx): the script never ran. */
export type ScriptRequestFailure = { status: number | null; code: string | null };
