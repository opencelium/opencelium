import type {
	ScriptExecutionError,
	ScriptRequestFailure,
	ScriptResultType,
} from './langCode.types';

type IssuePosition = { line: number; column: number };

/** Columns are 0-based (Ace), lines 1-based. */
export type CompatibilityIssue =
	| ({ kind: 'syntax'; hint: string; message: string } & IssuePosition)
	| ({ kind: 'unsupportedBuiltin' | 'serverOnly'; name: string } & IssuePosition)
	| ({ kind: 'console' } & IssuePosition);

export type ScriptRunResult =
	| { kind: 'value'; value: unknown; resultType: ScriptResultType; output: string; durationMs: number }
	| { kind: 'error'; error: ScriptExecutionError; output: string; durationMs: number }
	| { kind: 'rejected'; failure: ScriptRequestFailure };

export function assertNever(value: never): never {
	throw new Error(`Unexpected kind: ${String(value)}`);
}
