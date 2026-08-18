import { useCallback, useRef, useState } from 'react';
import type { Connection, Enhancement, MethodWithId } from '../../../../types/connection';
import { useTestRun } from '../../../../test-run/useTestRun';
import { resolveScriptDebugSnapshot, type ScriptDebugResult } from './scriptDebugValue.utils';

export type ScriptDebugStatus = 'idle' | 'loading' | 'value' | 'error' | 'stale';

// Evaluation is never automatic — this is exclusively user-triggered (see
// `evaluate`), and never re-resolves live: editing the script after a run
// only flips the badge to `stale` (see `markStale`) without touching the
// frozen snapshot, so references/resolved-script/result always agree with
// each other and with whatever script text they were actually resolved from.
export function useScriptDebugValue(enhancement: Enhancement | undefined, connection: Connection | null | undefined, currentMethod: MethodWithId | undefined) {
	const testRun = useTestRun();
	const [isOpen, setIsOpen] = useState(false);
	const [status, setStatus] = useState<ScriptDebugStatus>('idle');
	const [snapshot, setSnapshot] = useState<ScriptDebugResult | null>(null);
	const runIdRef = useRef(0);

	const evaluate = useCallback(() => {
		if (!enhancement) return;
		setIsOpen(true);
		setStatus('loading');
		const runId = ++runIdRef.current;
		const testRunSnapshot = {
			isPaused: testRun?.isPaused ?? false,
			logTree: testRun?.logTree,
			liveGraphStatus: testRun?.liveGraphStatus,
			loopAncestorsByIndexPath: testRun?.loopAncestorsByIndexPath,
		};
		void resolveScriptDebugSnapshot(enhancement, connection, currentMethod, testRunSnapshot).then((result) => {
			// A newer run superseded this one (re-evaluate clicked again before
			// this settled) — its own .then() owns the final state instead.
			if (runIdRef.current !== runId) return;
			setSnapshot(result);
			setStatus(result.kind === 'error' ? 'error' : 'value');
		});
	}, [enhancement, connection, currentMethod, testRun]);

	const hide = useCallback(() => setIsOpen(false), []);

	// The header has no separate hide button — the same trigger that opens the
	// panel also closes it, so there's exactly one control for the whole
	// language/script/description <-> value swap in Enhancement.tsx.
	const toggle = useCallback(() => {
		if (isOpen) {
			hide();
			return;
		}
		evaluate();
	}, [isOpen, hide, evaluate]);

	// Only a settled run (value/error) — or an already-stale one — has a
	// snapshot worth calling "stale"; idle/loading have nothing to go stale.
	const markStale = useCallback(() => {
		setStatus((current) => (current === 'value' || current === 'error' || current === 'stale' ? 'stale' : current));
	}, []);

	return { isOpen, status, snapshot, toggle, markStale };
}
