import { useEffect, useMemo, type RefObject } from 'react';
import type { Connection, EndpointArg, MethodWithId } from '../../../types/connection';
import { parseEnhancementArg } from '../utils/parseEnhancementArg';
import {
	canInspectLiveReference,
	LIVE_INSPECTABLE_CLASS,
	useTestRunLiveSnapshot,
} from '../utils/useLiveReferenceValue';
import { ARG_TOKEN_RE, ENDPOINT_REF_CLASS } from './urlEditor.utils';

export function extractArgId(token: string): string | null {
	ARG_TOKEN_RE.lastIndex = 0;
	const match = ARG_TOKEN_RE.exec(token);
	ARG_TOKEN_RE.lastIndex = 0;
	return match ? match[2] : null;
}

// Rings the endpoint/query-param pills whose value can be read right now, the
// same affordance the React-rendered chips get from LIVE_INSPECTABLE_CLASS.
//
// These pills are the one reference surface written into the field as raw
// innerHTML and rebuilt from scratch on every keystroke (see
// useUrlEndpointRender / useUrlInlineValueEditor), so there is no React element
// to hang a className on — and no render for an effect to key off, since the
// rebuild is imperative and React never hears about it. Hence a
// MutationObserver: it re-decorates whatever the renderer just wrote. Only
// childList is observed, so toggling the class (an attribute mutation) can't
// feed itself.
export function useEndpointArgInspectHighlight(
	containerRef: RefObject<HTMLElement | null>,
	endpointArgs: Record<string, EndpointArg>,
	connection: Connection | null | undefined,
	currentMethod: MethodWithId | undefined,
) {
	const snapshot = useTestRunLiveSnapshot();
	const { isPaused, logTree, liveGraphStatus, loopAncestorsByIndexPath } = snapshot;

	const inspectableArgIds = useMemo(() => {
		const ids = new Set<string>();
		if (!isPaused) return ids;
		for (const [argId, arg] of Object.entries(endpointArgs)) {
			const parsed = arg.source ? parseEnhancementArg(arg.source) : null;
			if (canInspectLiveReference(parsed, connection, currentMethod, snapshot)) ids.add(argId);
		}
		return ids;
		// eslint-disable-next-line react-hooks/exhaustive-deps -- `snapshot` is rebuilt every render from the same test-run context; its four fields below are the real inputs.
	}, [endpointArgs, connection, currentMethod, isPaused, logTree, liveGraphStatus, loopAncestorsByIndexPath]);

	useEffect(() => {
		const root = containerRef.current;
		if (!root) return;

		const decorate = () => {
			root.querySelectorAll<HTMLElement>(`.${ENDPOINT_REF_CLASS}`).forEach((pill) => {
				const argId = extractArgId(pill.getAttribute('data-main') || '');
				pill.classList.toggle(LIVE_INSPECTABLE_CLASS, !!argId && inspectableArgIds.has(argId));
			});
		};

		decorate();
		const observer = new MutationObserver(decorate);
		observer.observe(root, { childList: true, subtree: true });
		return () => observer.disconnect();
	}, [containerRef, inspectableArgIds]);
}
