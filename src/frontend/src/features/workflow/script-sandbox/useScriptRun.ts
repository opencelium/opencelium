import { useCallback, useEffect, useRef, useState } from 'react';
import { executeScript } from './langCodeApi';
import type { ScriptExecutionRequest } from './langCode.types';
import type { ScriptRunResult } from './sandbox.types';

type Outcome = Awaited<ReturnType<typeof executeScript>>;

export function toRunResult(outcome: Outcome): ScriptRunResult {
	if (outcome.kind === 'failure') return { kind: 'rejected', failure: outcome.failure };
	const { response } = outcome;
	if (response.error)
		return { kind: 'error', error: response.error, output: response.output ?? '', durationMs: response.durationMs };
	if (response.success)
		return {
			kind: 'value',
			value: response.result,
			resultType: response.resultType ?? 'null',
			output: response.output ?? '',
			durationMs: response.durationMs,
		};
	return { kind: 'rejected', failure: { status: 200, code: null } };
}

/** Test-runs a script on the backend (/lang-code/execute); a stale answer is dropped. */
export function useScriptRun() {
	const [status, setStatus] = useState<'idle' | 'running' | 'done'>('idle');
	const [result, setResult] = useState<ScriptRunResult | null>(null);
	const [completedAt, setCompletedAt] = useState<number>();
	const latestRun = useRef(0);
	useEffect(
		() => () => {
			latestRun.current++;
		},
		[],
	);
	const run = useCallback(async (request: ScriptExecutionRequest) => {
		const id = ++latestRun.current;
		setStatus('running');
		setResult(null);
		setCompletedAt(undefined);
		const outcome = await executeScript(request);
		if (id !== latestRun.current) return;
		setResult(toRunResult(outcome));
		setCompletedAt(Date.now());
		setStatus('done');
	}, []);
	return { run, status, result, completedAt };
}
