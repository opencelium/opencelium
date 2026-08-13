import { useEffect, useRef, useState } from 'react';
import { fetchMethodDetails, resolveTraceTarget, type DetailedMethodLog } from '@features/logs';
import { useTestRun } from '../../../test-run/useTestRun';
import { buildIteratorIndexResolver, resolveCurrentLoopIndex } from '../../../test-run/liveGraphStatus';
import { findMethodByColor, readLiveValueAtPath } from '../body-editor/requestReferenceOptions';
import type { Connection, MethodWithId } from '../../../types/connection';
import type { ParsedArg } from './parseEnhancementArg';
import type { ParsedReference } from '../body-editor/bodyReference';

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

// The live-debugging counterpart to the static reference display: while a
// test run is paused and the referenced method has already executed this
// run, resolves the actual captured value instead of just the reference's
// structural path — via the exact same resolution chain ResponseDialog uses
// (resolveCurrentLoopIndex -> resolveTraceTarget -> getMethodDetails), so a
// reference nested inside one or more loops reads the value from the
// CORRECT iteration, not always the first one.
//
// `direction: 'request'` references point at the CURRENT method's own
// (static, already-known) request — never resolved live, since there is no
// "response" to have captured yet for the thing you're still configuring.
//
// `currentMethod` is the method the reference is EMBEDDED in (the one being
// edited) — needed because a `[<iterator>]` segment in the path (e.g.
// "[i].role") names a loop that encloses the CURRENT method (the loop whose
// source collection IS the target's response being sliced), not a loop
// ancestor of the TARGET method itself. A top-level target with no loop
// ancestors of its own (the common case: one call whose array response is
// iterated by a *different* method's enclosing loop) would otherwise never
// resolve the iterator at all.
export function useLiveReferenceValue(
	reference: ParsedArg | null,
	connection: Connection | null | undefined,
	currentMethod: MethodWithId | undefined,
): { value: unknown; hasValue: boolean } {
	const testRun = useTestRun();
	const isPaused = testRun?.isPaused ?? false;
	const logTree = testRun?.logTree;
	const liveGraphStatus = testRun?.liveGraphStatus;
	const loopAncestorsByIndexPath = testRun?.loopAncestorsByIndexPath;

	const targetMethod =
		reference?.direction === 'response' && connection
			? findMethodByColor(connection.fromConnector.method, reference.color)
			: undefined;
	const indexPath = targetMethod?.index;
	const currentIndexPath = currentMethod?.index;
	const nodeStatus = indexPath && liveGraphStatus ? liveGraphStatus[indexPath] : undefined;
	const hasRun = nodeStatus?.status === 'COMPLETE' || nodeStatus?.status === 'FAIL';
	const canResolve =
		isPaused && !!reference && reference.direction === 'response' && !!indexPath && hasRun &&
		!!logTree && !!liveGraphStatus && !!loopAncestorsByIndexPath;
	const loopIndex =
		canResolve && indexPath && liveGraphStatus && loopAncestorsByIndexPath
			? resolveCurrentLoopIndex(indexPath, loopAncestorsByIndexPath, liveGraphStatus)
			: '';
	const sessionKey = canResolve ? `${indexPath}:${loopIndex}` : null;

	// Resolves the target's live execution element id (a getElementChildren
	// REST walk once the path enters a loop's non-first iteration — see
	// resolveTraceTarget) and then its full detail, cached per session key
	// exactly like ResponseDialog. Both dispatch against the real app store
	// directly (see fetchMethodDetails) rather than through RTK Query's
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
	const [resolved, setResolved] = useState<{ sessionKey: string | null; data: DetailedMethodLog | null }>({
		sessionKey: null,
		data: null,
	});
	const activeSessionRef = useRef<string | null>(null);

	useEffect(() => {
		if (!sessionKey || !indexPath || !logTree) return;
		if (activeSessionRef.current === sessionKey) return;
		activeSessionRef.current = sessionKey;
		void resolveTraceTarget(logTree, { indexPath, loopIndex }, [{ indexPath, loopIndex }])
			.then((leaf) => (leaf?.type === 'OPERATION' ? fetchMethodDetails(leaf.id) : null))
			.then((data) => {
				if (activeSessionRef.current !== sessionKey) return;
				setResolved({ sessionKey, data });
			});
	}, [sessionKey, indexPath, loopIndex, logTree]);

	const data = resolved.sessionKey === sessionKey ? resolved.data : null;

	if (!reference || !data || !currentIndexPath || !liveGraphStatus || !loopAncestorsByIndexPath) {
		return { value: undefined, hasValue: false };
	}

	if (reference.messageProperty === 'status') {
		const status = data.segment?.response?.status;
		return { value: status, hasValue: status !== undefined && status !== '' };
	}

	const rawString =
		reference.messageProperty === 'header' ? data.segment?.response?.header : data.segment?.response?.payload;
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
