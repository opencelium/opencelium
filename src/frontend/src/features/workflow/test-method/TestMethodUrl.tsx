import { useEffect, useMemo, useRef, type MouseEvent } from 'react';
import { EndpointArgHoverTooltip } from '../components/request-editor/url-editor/EndpointArgHoverTooltip';
import { deserializeBackendReferenceTokens } from '../components/request-editor/url-editor/urlBackendReferences';
import { buildInlineHtml, decodeEndpointQuery, ENDPOINT_REF_CLASS } from '../components/request-editor/url-editor/urlEditor.utils';
import type { Connection, MethodWithId } from '../types/connection';
import type { TestInputHighlight } from './TestMethodJsonView';
import { referenceInputKey } from './testMethodInputValue';

type Props = TestInputHighlight & {
	url: string;
	connection: Connection;
	currentMethod?: MethodWithId;
};

const SELECTED_CLASS = 'testMethodUrlPill--selected';
const MISSING_CLASS = 'testMethodUrlPill--missing';

// The URL as the Edit URL dialog shows it: each reference is a colored pill labelled with its
// source, and hovering one during a paused test run previews its live value. Clicking a pill
// picks the value shown on the left.
export function TestMethodUrl({ url, connection, currentMethod, selectedKey, onSelect, missingKeys }: Props) {
	const ref = useRef<HTMLSpanElement | null>(null);
	const { value, endpointArgs } = useMemo(
		() => deserializeBackendReferenceTokens(decodeEndpointQuery(url)), [url]);
	// buildInlineHtml escapes the URL text and every pill label, so the markup is safe to inject.
	const html = useMemo(() => buildInlineHtml(value, endpointArgs, { className: ENDPOINT_REF_CLASS, cursorPointer: true }),
		[value, endpointArgs]);
	const sourceOf = (pill: Element) => {
		const argId = pill.getAttribute('data-main')?.match(/^#\{%(.+)%}$/)?.[1];
		return argId ? endpointArgs[argId]?.source : undefined;
	};

	useEffect(() => {
		ref.current?.querySelectorAll(`.${ENDPOINT_REF_CLASS}`).forEach((pill) => {
			const source = sourceOf(pill);
			const key = source ? referenceInputKey({ reference: source }) : null;
			pill.classList.toggle(SELECTED_CLASS, !!key && key === selectedKey);
			pill.classList.toggle(MISSING_CLASS, !!key && missingKeys.includes(key));
		});
	});

	const select = (event: MouseEvent<HTMLSpanElement>) => {
		const pill = (event.target as HTMLElement).closest(`.${ENDPOINT_REF_CLASS}`);
		const source = pill && sourceOf(pill);
		if (source) onSelect(referenceInputKey({ reference: source }));
	};

	return (
		<>
			<span ref={ref} className='testMethodUrl' title={url} data-testid='workflow-test-method-url'
				onClick={select} dangerouslySetInnerHTML={{ __html: html }} />
			<EndpointArgHoverTooltip containerRef={ref} endpointArgs={endpointArgs}
				connection={connection} currentMethod={currentMethod} />
		</>
	);
}
