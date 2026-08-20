import { useEffect, useRef, useState } from 'react';
import { fetchMethodDetails, resolveTraceTarget, type LiveLogTree } from '@features/logs';
import { useTestRun } from '../../../test-run/useTestRun';
import { buildIteratorIndexResolver, resolveCurrentLoopIndex, type LiveGraphStatus } from '../../../test-run/liveGraphStatus';
import { findMethodByColor, readLiveValueAtPath } from '../body-editor/requestReferenceOptions';
import type { Connection } from '../../../types/connection';
import type { ParsedArg } from './parseEnhancementArg';
import type { ParsedReference } from '../body-editor/bodyReference';

// The only two things any consumer of this resolution chain has ever needed
// from "the method the reference is embedded in" — `.index` for loop-iterator
// scoping, `.color` only to match a `direction: 'request'` self-reference. A
// full `MethodWithId` still satisfies this structurally (no call-site changes
// needed); callers with no real method backing them (e.g. an operator node,
// which only ever resolves `direction: 'response'` references) can pass a
// minimal `{ index }` instead of fabricating a fake `MethodWithId`.
export type LiveReferenceMethodContext = { index: string; color?: string };

// bodyReference.ts's parser pre-joins messageProperty and path into one
// `field` string (e.g. "body.$.items[0].name", or plain "status") — split it
// back into the same {messageProperty, path} shape parseEnhancementArg
// already returns, so both of this codebase's reference parsers can feed the
// same resolution hook below.
export function normalizeParsedReference(reference: ParsedReference): ParsedArg {
	const [messageProperty, ...rest] = reference.field.split('.');
	const path = rest.join('.').replace(/^\$\.?/, '');
	return { color: reference.color, direction: reference.type, messageProperty, path };
}

export type TestRunLiveSnapshot = {
	isPaused: boolean;
	logTree: LiveLogTree | undefined;
	liveGraphStatus: LiveGraphStatus | undefined;
	loopAncestorsByIndexPath: Map<string, string[]> | undefined;
};

// `direction: 'request'` only ever resolves against `currentMethod` itself (an
// Enhancement's RESULT_VAR, written into the current method's own request) —
// there's no captured request for any *other* method's own field. `'response'`
// resolves against whichever method the reference's color names.
function resolveTargetMethod(
	reference: ParsedArg | null | undefined,
	connection: Connection | null | undefined,
	currentMethod: LiveReferenceMethodContext | undefined,
) {
	if (!reference || !currentMethod) return undefined;
	if (reference.direction === 'request') {
		return currentMethod.color && reference.color.toLowerCase() === currentMethod.color.toLowerCase() ? currentMethod : undefined;
	}
	if (reference.direction === 'response' && connection) {
		return findMethodByColor(connection.fromConnector.method, reference.color);
	}
	return undefined;
}

// The live-debugging counterpart to the static reference display: while a
// test run is paused and the target method has already executed this run,
// resolves the actual captured value instead of just the reference's
// structural path — via the exact same resolution chain ResponseDialog uses
// (resolveCurrentLoopIndex -> resolveTraceTarget -> getMethodDetails), so a
// reference nested inside one or more loops reads the value from the
// CORRECT iteration, not always the first one.
//
// `currentMethod` is the method the reference is EMBEDDED in (the one being
// edited) — needed because a `[<iterator>]` segment in the path (e.g.
// "[i].role") names a loop that encloses the CURRENT method (the loop whose
// source collection IS the target's response being sliced), not a loop
// ancestor of the TARGET method itself. A top-level target with no loop
// ancestors of its own (the common case: one call whose array response is
// iterated by a *different* method's enclosing loop) would otherwise never
// resolve the iterator at all.
//
// Exported standalone (not just used internally by the hook below) so
// one-shot, on-demand resolution — e.g. the Enhancement debug panel's
// "evaluate" click, resolving several VAR_N references plus RESULT_VAR at
// once — can reuse the exact same logic without being tied to a hover-driven
// hook's cache-by-sessionKey lifecycle.
export async function resolveLiveReferenceValue(
	reference: ParsedArg | null,
	connection: Connection | null | undefined,
	currentMethod: LiveReferenceMethodContext | undefined,
	snapshot: TestRunLiveSnapshot,
): Promise<{ value: unknown; hasValue: boolean }> {
	const { isPaused, logTree, liveGraphStatus, loopAncestorsByIndexPath } = snapshot;
	if (!reference || !isPaused || !connection || !currentMethod || !logTree || !liveGraphStatus || !loopAncestorsByIndexPath) {
		return { value: undefined, hasValue: false };
	}

	const isOwnRequest = reference.direction === 'request';
	const targetMethod = resolveTargetMethod(reference, connection, currentMethod);
	const indexPath = targetMethod?.index;
	const currentIndexPath = currentMethod.index;
	if (!indexPath || !currentIndexPath) return { value: undefined, hasValue: false };

	const nodeStatus = liveGraphStatus[indexPath];
	const hasRun = nodeStatus?.status === 'COMPLETE' || nodeStatus?.status === 'FAIL';
	if (!hasRun) return { value: undefined, hasValue: false };

	const loopIndex = resolveCurrentLoopIndex(indexPath, loopAncestorsByIndexPath, liveGraphStatus);
	const leaf = await resolveTraceTarget(logTree, { indexPath, loopIndex }, [{ indexPath, loopIndex }]);
	const data = leaf?.type === 'OPERATION' ? await fetchMethodDetails(leaf.id) : null;
	if (!data) return { value: undefined, hasValue: false };

	const segment = isOwnRequest ? data.segment?.request : data.segment?.response;

	if (reference.messageProperty === 'status') {
		if (isOwnRequest) return { value: undefined, hasValue: false };
		const status = (segment as { status?: string } | undefined)?.status;
		return { value: status, hasValue: status !== undefined && status !== '' };
	}

	const rawString = reference.messageProperty === 'header' ? segment?.header : segment?.payload;
	let parsedBody: unknown;
	try {
		parsedBody = rawString ? JSON.parse(rawString) : undefined;
	} catch {
		parsedBody = undefined;
	}
	if (parsedBody === undefined) return { value: undefined, hasValue: false };

	const resolveIteratorIndex = buildIteratorIndexResolver(currentIndexPath, loopAncestorsByIndexPath, liveGraphStatus);
	const value = readLiveValueAtPath(parsedBody, reference.path, resolveIteratorIndex);
	return { value, hasValue: value !== undefined };
}

// Class marking a reference the user can actually inspect right now — the ring
// that answers "how would I know hovering does anything?". Styling lives in
// styles/live-reference.css; it is applied by every reference surface
// (BodyPointer, RequestReferenceTokens, XmlReferenceTokens, the condition
// operands, the endpoint/query-param pills) so they all read as one group.
export const LIVE_INSPECTABLE_CLASS = 'wfLiveInspectable';

// Whether the resolution chain below *could* produce something, decided
// synchronously with no request: the run is paused, the reference names a
// method that already executed this run, and the live trees to read it from
// are present. This is exactly the hook's own `canResolve` precondition, split
// out so a chip can advertise its inspectability without firing the fetch that
// would otherwise be the only way to find out — the whole point of the
// hover-gated `enabled` flag documented below.
//
// It stops one step short of "there is a value at this path": that needs the
// fetched payload. A ringed chip therefore promises a tooltip, not a non-empty
// one — the alternative (resolving every chip up front to be sure) is the cost
// this hook exists to avoid.
export function canInspectLiveReference(
	reference: ParsedArg | null | undefined,
	connection: Connection | null | undefined,
	currentMethod: LiveReferenceMethodContext | undefined,
	snapshot: TestRunLiveSnapshot,
): boolean {
	if (!snapshot.isPaused || !reference) return false;
	if (!snapshot.logTree || !snapshot.liveGraphStatus || !snapshot.loopAncestorsByIndexPath) return false;
	const indexPath = resolveTargetMethod(reference, connection, currentMethod)?.index;
	if (!indexPath) return false;
	const status = snapshot.liveGraphStatus[indexPath]?.status;
	return status === 'COMPLETE' || status === 'FAIL';
}

export function useTestRunLiveSnapshot(): TestRunLiveSnapshot {
	const testRun = useTestRun();
	return {
		isPaused: testRun?.isPaused ?? false,
		logTree: testRun?.logTree,
		liveGraphStatus: testRun?.liveGraphStatus,
		loopAncestorsByIndexPath: testRun?.loopAncestorsByIndexPath,
	};
}

// `enabled` gates the actual fetch: a node opened during pause can carry
// dozens of reference chips, and resolving every one of them up front used
// to fire a getElementChildren/getMethodDetails request per chip whether or
// not anyone ever looked at it. Callers instead pass `enabled: true` only
// once the user hovers the concrete chip (see BodyPointer/RequestReferenceTokens/
// XmlReferenceTokens), so the request fires on demand. The session-key cache
// below means toggling `enabled` off and back on (mouse leave/re-enter)
// never refetches — only a genuinely new sessionKey (different target
// method or loop iteration) does.
export function useLiveReferenceValue(
	reference: ParsedArg | null,
	connection: Connection | null | undefined,
	currentMethod: LiveReferenceMethodContext | undefined,
	enabled: boolean,
): { value: unknown; hasValue: boolean; isLoading: boolean; canInspect: boolean } {
	const snapshot = useTestRunLiveSnapshot();

	const indexPath = resolveTargetMethod(reference, connection, currentMethod)?.index;
	const canResolve = canInspectLiveReference(reference, connection, currentMethod, snapshot);
	const loopIndex =
		canResolve && indexPath && snapshot.liveGraphStatus && snapshot.loopAncestorsByIndexPath
			? resolveCurrentLoopIndex(indexPath, snapshot.loopAncestorsByIndexPath, snapshot.liveGraphStatus)
			: '';
	const sessionKey = canResolve ? `${indexPath}:${loopIndex}` : null;

	// Resolves and caches per session key exactly like ResponseDialog. Both
	// dispatch against the real app store directly (see fetchMethodDetails,
	// inside resolveLiveReferenceValue) rather than through RTK Query's
	// generated hooks: this hook is called from BodyPointer/
	// RequestReferenceTokens/XmlReferenceTokens, all rendered inside
	// MethodConfigDialog's own nested legacy Redux <Provider> — a hook would
	// resolve useSelector/useDispatch against THAT store, which has no `api`
	// reducer/middleware at all.
	//
	// Deliberately no `cancelled` closure flag alongside activeSessionRef:
	// React's dev-mode Strict Mode runs this effect's cleanup once immediately
	// after the first run (simulating an unmount that never really happens),
	// which would flip a separate `cancelled` flag on the still-relevant,
	// still-in-flight request and cause its result to be discarded even
	// though activeSessionRef still correctly matches sessionKey. Whether a
	// result is still wanted is entirely captured by "does the session this
	// promise was started for still match the current one" — activeSessionRef
	// alone answers that; a second, separately-lifecycled flag can only
	// disagree with it, never add information.
	const [resolved, setResolved] = useState<{ sessionKey: string | null; value: unknown; hasValue: boolean }>({
		sessionKey: null,
		value: undefined,
		hasValue: false,
	});
	const activeSessionRef = useRef<string | null>(null);

	useEffect(() => {
		if (!enabled || !sessionKey) return;
		if (activeSessionRef.current === sessionKey) return;
		activeSessionRef.current = sessionKey;
		void resolveLiveReferenceValue(reference, connection, currentMethod, snapshot).then(({ value, hasValue }) => {
			if (activeSessionRef.current !== sessionKey) return;
			setResolved({ sessionKey, value, hasValue });
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps -- snapshot/reference/connection/currentMethod are re-derived every render from the same testRun context; sessionKey already captures every input that should trigger a refetch.
	}, [enabled, sessionKey]);

	const isLoading = enabled && canResolve && resolved.sessionKey !== sessionKey;
	if (resolved.sessionKey !== sessionKey) return { value: undefined, hasValue: false, isLoading, canInspect: canResolve };
	return { value: resolved.value, hasValue: resolved.hasValue, isLoading: false, canInspect: canResolve };
}

// Shared rendering shape for every reference-chip consumer (BodyPointer,
// RequestReferenceTokens, XmlReferenceTokens) — a resolved live value can be
// a primitive, an object, or an array; render objects/arrays as compact JSON
// rather than "[object Object]", and keep it on one line since chips/tooltips
// have no room for pretty-printing.
export function formatLiveReferenceValue(value: unknown): string {
	if (value === null) return 'null';
	if (typeof value === 'string') return value;
	if (typeof value === 'number' || typeof value === 'boolean') return String(value);
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

// A resolved value can be an entire response payload — way too long for a
// hover tooltip. Chips truncate to this length and offer an expand affordance
// (see LiveReferenceValuePreview) that opens the full value in a dialog.
export const LIVE_VALUE_PREVIEW_LIMIT = 100;

export function truncateLiveValueText(text: string): { text: string; isTruncated: boolean } {
	if (text.length <= LIVE_VALUE_PREVIEW_LIMIT) return { text, isTruncated: false };
	return { text: `${text.slice(0, LIVE_VALUE_PREVIEW_LIMIT)}…`, isTruncated: true };
}
