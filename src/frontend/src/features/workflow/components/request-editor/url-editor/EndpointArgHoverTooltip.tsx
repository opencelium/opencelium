import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import type { Connection, EndpointArg, MethodWithId } from '../../../types/connection';
import { ENDPOINT_REF_CLASS } from './urlEditor.utils';
import { extractArgId, useEndpointArgInspectHighlight } from './useEndpointArgInspectHighlight';
import { formatParsedArgPath, parseEnhancementArg } from '../utils/parseEnhancementArg';
import { formatLiveReferenceValue, useLiveReferenceValue } from '../utils/useLiveReferenceValue';
import { LiveReferenceValuePreview } from '../utils/LiveReferenceValuePreview';

type HoverTarget = { arg: EndpointArg; rect: DOMRect };

// Grace period between leaving the hovered pill and actually hiding the
// tooltip — long enough to let the mouse travel from the pill down into the
// floating tooltip itself (e.g. to click "more…") without it disappearing
// first. Mirrors what antd's own Tooltip does internally for hover+popup.
const CLOSE_GRACE_MS = 150;

function findPill(target: EventTarget | null, root: HTMLElement): HTMLElement | null {
	if (!(target instanceof HTMLElement)) return null;
	const pill = target.closest(`.${ENDPOINT_REF_CLASS}`) as HTMLElement | null;
	return pill && root.contains(pill) ? pill : null;
}

function useEndpointArgHover(containerRef: RefObject<HTMLElement | null>, endpointArgs: Record<string, EndpointArg>) {
	const [hover, setHover] = useState<HoverTarget | null>(null);
	const closeTimeoutRef = useRef<number | null>(null);

	const cancelClose = useCallback(() => {
		if (closeTimeoutRef.current === null) return;
		window.clearTimeout(closeTimeoutRef.current);
		closeTimeoutRef.current = null;
	}, []);
	const scheduleClose = useCallback(() => {
		cancelClose();
		closeTimeoutRef.current = window.setTimeout(() => setHover(null), CLOSE_GRACE_MS);
	}, [cancelClose]);

	useEffect(() => {
		const root = containerRef.current;
		if (!root) return;

		const onMouseOver = (event: MouseEvent) => {
			const pill = findPill(event.target, root);
			if (!pill) return;
			const argId = extractArgId(pill.getAttribute('data-main') || '');
			const arg = argId ? endpointArgs[argId] : undefined;
			if (!arg?.source) return;
			cancelClose();
			setHover({ arg, rect: pill.getBoundingClientRect() });
		};

		const onMouseOut = (event: MouseEvent) => {
			const pill = findPill(event.target, root);
			if (!pill) return;
			const related = event.relatedTarget;
			if (related instanceof Node && pill.contains(related)) return;
			scheduleClose();
		};

		root.addEventListener('mouseover', onMouseOver);
		root.addEventListener('mouseout', onMouseOut);
		return () => {
			root.removeEventListener('mouseover', onMouseOver);
			root.removeEventListener('mouseout', onMouseOut);
			cancelClose();
		};
	}, [containerRef, endpointArgs, cancelClose, scheduleClose]);

	return { hover, cancelClose, scheduleClose };
}

const TOOLTIP_MAX_WIDTH = 320;
const TOOLTIP_MARGIN = 8;

// Owns both the fetch (via the shared useLiveReferenceValue hook) and the
// floating box itself, so "nothing resolved yet and nothing loading" can
// render nothing at all instead of an empty box — this must live in a single
// component since the decision depends on a hook's result.
function EndpointArgFloatingTooltip({
	rect,
	source,
	connection,
	currentMethod,
	onMouseEnter,
	onMouseLeave,
}: {
	rect: DOMRect;
	source: string;
	connection: Connection | null | undefined;
	currentMethod: MethodWithId | undefined;
	onMouseEnter: () => void;
	onMouseLeave: () => void;
}) {
	const parsed = parseEnhancementArg(source);
	const { value, hasValue, isLoading } = useLiveReferenceValue(parsed, connection, currentMethod, true);
	if (!parsed || (!isLoading && !hasValue)) return null;

	// Anchored to the rectangle's top-center, with the box itself pulled up and
	// centered via transform — avoids needing the tooltip's own (content-driven)
	// height up front to place it above rather than below the rectangle.
	const centerX = rect.left + rect.width / 2;
	const left = Math.min(
		Math.max(TOOLTIP_MARGIN + TOOLTIP_MAX_WIDTH / 2, centerX),
		window.innerWidth - TOOLTIP_MARGIN - TOOLTIP_MAX_WIDTH / 2,
	);

	return createPortal(
		<div
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			style={{
				position: 'fixed',
				left,
				top: rect.top - 6,
				transform: 'translate(-50%, -100%)',
				maxWidth: TOOLTIP_MAX_WIDTH,
				zIndex: 1100,
				padding: '6px 10px',
				borderRadius: 'var(--radius-md)',
				background: 'var(--color-background-surface)',
				color: 'var(--color-text-primary)',
				fontSize: 12,
				boxShadow: 'var(--shadow-lg)',
			}}
		>
			<LiveReferenceValuePreview
				label={formatParsedArgPath(parsed)}
				showLabel={false}
				isLoading={isLoading}
				hasValue={hasValue}
				rawValue={value}
				formattedValue={hasValue ? formatLiveReferenceValue(value) : null}
			/>
		</div>,
		document.body,
	);
}

type Props = {
	containerRef: RefObject<HTMLElement | null>;
	endpointArgs: Record<string, EndpointArg>;
	connection: Connection | null | undefined;
	currentMethod: MethodWithId | undefined;
};

// Endpoint/query-param reference pills are rendered as raw innerHTML (see
// buildInlineHtml) rather than React components, so — unlike BodyPointer/
// RequestReferenceTokens/XmlReferenceTokens — they can't just be wrapped in
// the shared <Tooltip> primitive. This hooks into the same pills via native
// mouseover/mouseout delegation on the editable container and renders the
// same LiveReferenceValuePreview content in a manually-positioned floating
// box instead.
export function EndpointArgHoverTooltip({ containerRef, endpointArgs, connection, currentMethod }: Props) {
	const { hover, cancelClose, scheduleClose } = useEndpointArgHover(containerRef, endpointArgs);
	// Mounted unconditionally (this component renders null until something is
	// hovered), so the pills carry their ring whether or not one is hovered.
	useEndpointArgInspectHighlight(containerRef, endpointArgs, connection, currentMethod);
	if (!hover?.arg.source) return null;

	return (
		<EndpointArgFloatingTooltip
			rect={hover.rect}
			source={hover.arg.source}
			connection={connection}
			currentMethod={currentMethod}
			onMouseEnter={cancelClose}
			onMouseLeave={scheduleClose}
		/>
	);
}
