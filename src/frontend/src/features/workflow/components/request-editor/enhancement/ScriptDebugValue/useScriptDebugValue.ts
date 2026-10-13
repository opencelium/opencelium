import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import type { Connection, Enhancement, MethodWithId } from '../../../../types/connection';
import { useTestRun } from '../../../../test-run/useTestRun';
import { resolveScriptDebugSnapshot, type ScriptDebugResult } from './scriptDebugValue.utils';

export type ScriptDebugStatus = 'idle' | 'loading' | 'value' | 'error' | 'stale';

// Evaluation is user-triggered (see `evaluate`) — the only automatic resolve is
// for a newly selected reference while the panel is already open — and never re-resolves live: editing the script after a run
// only flips the badge to `stale` (see `markStale`) without touching the
// frozen snapshot, so references/resolved-script/result always agree with
// each other and with whatever script text they were actually resolved from.
export function useScriptDebugValue(enhancement: Enhancement | undefined, connection: Connection | null | undefined, currentMethod: MethodWithId | undefined) {
	const testRun = useTestRun();
	const isAvailable = testRun?.isPaused ?? false;
	const [isOpen, setIsOpen] = useState(false);
	const [status, setStatus] = useState<ScriptDebugStatus>('idle');
	const [snapshot, setSnapshot] = useState<ScriptDebugResult | null>(null);
	const runIdRef = useRef(0);

	const resolveInto = useCallback((target: Enhancement) => {
		const runId = ++runIdRef.current;
		const testRunSnapshot = {
			isPaused: testRun?.isPaused ?? false,
			logTree: testRun?.logTree,
			liveGraphStatus: testRun?.liveGraphStatus,
			loopAncestorsByIndexPath: testRun?.loopAncestorsByIndexPath,
		};
		void resolveScriptDebugSnapshot(target, connection, currentMethod, testRunSnapshot).then((result) => {
			// A newer run superseded this one (re-evaluate clicked again, or another
			// reference selected, before this settled) — its own .then() owns the final state.
			if (runIdRef.current !== runId) return;
			setSnapshot(result);
			setStatus(result.kind === 'error' ? 'error' : 'value');
		});
	}, [connection, currentMethod, testRun]);

	const evaluate = useCallback(() => {
		if (!enhancement) return;
		setIsOpen(true);
		setStatus('loading');
		resolveInto(enhancement);
	}, [enhancement, resolveInto]);

	// The editor reuses this component when the user selects another reference.
	// The old snapshot must go; if the panel was showing data, the user already
	// asked to see it, so the newly selected reference is resolved straight away.
	const enhanceId = enhancement?.enhanceId;
	const [snapshotEnhanceId, setSnapshotEnhanceId] = useState(enhanceId);
	if (snapshotEnhanceId !== enhanceId) {
		setSnapshotEnhanceId(enhanceId);
		setSnapshot(null);
		if (isOpen && isAvailable && enhancement) {
			setStatus('loading');
		} else {
			setIsOpen(false);
			setStatus('idle');
		}
	}
	const onReferenceSwitched = useEffectEvent(() => {
		if (isOpen && status === 'loading' && enhancement) resolveInto(enhancement);
		else runIdRef.current += 1;
	});
	useEffect(() => {
		onReferenceSwitched();
	}, [enhanceId]);

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

	return { isAvailable, isOpen: isAvailable && isOpen, status, snapshot, toggle, markStale };
}
