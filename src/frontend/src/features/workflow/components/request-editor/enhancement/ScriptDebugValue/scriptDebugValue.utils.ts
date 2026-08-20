import type { Connection, Enhancement, MethodWithId } from '../../../../types/connection';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { parseEnhancementArg } from '../../utils/parseEnhancementArg';
import { resolveLiveReferenceValue, type TestRunLiveSnapshot } from '../../utils/useLiveReferenceValue';

export type WorkflowI18nKey = Parameters<ReturnType<typeof useI18n<'workflow'>>['t']>[0];

export type ScriptDebugReference = {
	name: string;
	hasValue: boolean;
	formatted: string;
};

export type ScriptDebugResult =
	| { kind: 'value'; references: ScriptDebugReference[]; resultType: string; resultFormatted: string }
	| { kind: 'error'; references: ScriptDebugReference[]; message: WorkflowI18nKey };

// There is no backend "run this script" endpoint (confirmed — see the
// enhancement-debug design discussion): the only way to know what a script
// actually produced is to read the ALREADY-COMPUTED value the backend wrote
// into the current method's own request when it executed this test run,
// exactly the way a target method's response is read elsewhere (see
// resolveLiveReferenceValue's `direction: 'request'` case). This never
// executes anything — it's a one-shot, on-demand read of execution logs.
const VAR_KEY_RE = /^VAR_(\d+)$/;

// Literal-style formatting (quoted strings, pretty objects) — distinct from
// formatLiveReferenceValue's plain-text tooltip style, since this panel reads
// as source code (`VAR_0 = "Engineering"`), not a hover label.
function formatDebugLiteral(value: unknown, pretty: boolean): string {
	if (value === undefined) return 'undefined';
	try {
		return pretty ? JSON.stringify(value, null, 2) : JSON.stringify(value);
	} catch {
		return String(value);
	}
}

function describeType(value: unknown): string {
	if (value === undefined) return 'undefined';
	if (value === null) return 'null';
	if (Array.isArray(value)) return 'array';
	return typeof value;
}

export async function resolveScriptDebugSnapshot(
	enhancement: Enhancement,
	connection: Connection | null | undefined,
	currentMethod: MethodWithId | undefined,
	snapshot: TestRunLiveSnapshot,
): Promise<ScriptDebugResult> {
	const varEntries = Object.entries(enhancement.args)
		.filter(([key]) => VAR_KEY_RE.test(key))
		.sort(([a], [b]) => Number(a.match(VAR_KEY_RE)![1]) - Number(b.match(VAR_KEY_RE)![1]));

	const references = await Promise.all(varEntries.map(async ([name, raw]) => {
		const parsed = parseEnhancementArg(raw);
		const resolution = parsed
			? await resolveLiveReferenceValue(parsed, connection, currentMethod, snapshot)
			: { value: undefined, hasValue: false };
		return {
			name,
			hasValue: resolution.hasValue,
			formatted: resolution.hasValue ? formatDebugLiteral(resolution.value, false) : '(not available yet)',
		};
	}));

	const resultParsed = parseEnhancementArg(enhancement.args.RESULT_VAR);
	const resultResolution = resultParsed
		? await resolveLiveReferenceValue(resultParsed, connection, currentMethod, snapshot)
		: { value: undefined, hasValue: false };

	if (!resultResolution.hasValue) {
		const targetStatus = currentMethod ? snapshot.liveGraphStatus?.[currentMethod.index]?.status : undefined;
		const message: WorkflowI18nKey = !snapshot.isPaused
			? 'enhancement.debugValue.errorNotPaused'
			: targetStatus === 'FAIL'
				? 'enhancement.debugValue.errorMethodFailed'
				: targetStatus === 'COMPLETE'
					? 'enhancement.debugValue.errorFieldNotFound'
					: 'enhancement.debugValue.errorNotRun';
		return { kind: 'error', references, message };
	}

	return {
		kind: 'value',
		references,
		resultType: describeType(resultResolution.value),
		resultFormatted: formatDebugLiteral(resultResolution.value, true),
	};
}
