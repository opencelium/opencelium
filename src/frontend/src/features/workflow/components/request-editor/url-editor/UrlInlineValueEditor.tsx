import React, { useCallback, useEffect, useRef } from 'react';
import type { Connection, EndpointArg, MethodWithId } from '../../../types/connection';
import {
	buildInlineHtml,
	getInlineVisualLength,
	parseHtmlToRaw,
	sanitizePlainTextPaste,
	sanitizeUrlInputValue,
	shouldBlockUrlKeyInput,
	computeRawInsertAtFromVisualCaret,
	ENDPOINT_REF_CLASS,
} from './urlEditor.utils';
import {
	getCaretPositionOfDivEditable,
	setFocusByCaretPositionInDivEditable,
} from './utils/contentEditable';
import { EndpointArgHoverTooltip } from './EndpointArgHoverTooltip';

type Props = {
	value: string;
	endpointArgs: Record<string, EndpointArg>;
	readOnly?: boolean;
	connection?: Connection | null;
	currentMethod?: MethodWithId;
	onChange: (value: string) => void;
	onCaretChange?: (rawCaret: number) => void;
};

const CLS = ENDPOINT_REF_CLASS;

const getContentRightEdge = (root: HTMLElement) => {
	const rects: DOMRect[] = [];

	root.childNodes.forEach((child) => {
		if (child instanceof HTMLElement) {
			rects.push(child.getBoundingClientRect());
			return;
		}

		if (child.nodeType === Node.TEXT_NODE) {
			const range = document.createRange();
			range.selectNodeContents(child);
			rects.push(...Array.from(range.getClientRects()));
			range.detach?.();
		}
	});

	const visibleRects = rects.filter((rect) => rect.width > 0 || rect.height > 0);
	if (!visibleRects.length) return null;

	return Math.max(...visibleRects.map((rect) => rect.right));
};

export const UrlInlineValueEditor: React.FC<Props> = ({
	value,
	endpointArgs,
	readOnly,
	connection,
	currentMethod,
	onChange,
	onCaretChange,
}) => {
	const rootRef = useRef<HTMLDivElement | null>(null);
	const lastRendered = useRef('');
	const lastCaret = useRef(0);
	const typing = useRef(false);

	const render = useCallback(
		(raw: string) => {
			const root = rootRef.current;
			if (!root) return;

			lastRendered.current = raw;
			root.innerHTML = buildInlineHtml(raw, endpointArgs);
			const end = getInlineVisualLength(raw, endpointArgs);
			lastCaret.current = Math.max(0, Math.min(lastCaret.current, end));

			if (!readOnly && document.activeElement === root) {
				try {
					setFocusByCaretPositionInDivEditable(root, lastCaret.current);
				} catch {}
			}
		},
		[endpointArgs, readOnly],
	);

	useEffect(() => {
		const root = rootRef.current;
		if (!root || typing.current) return;

		const domRaw = parseHtmlToRaw(root.innerHTML, CLS);
		if (domRaw === value || lastRendered.current === value) return;
		render(value || '');
	}, [render, value]);

	const updateFromDom = () => {
		const root = rootRef.current;
		if (!root) return;

		typing.current = true;
		const caret = getCaretPositionOfDivEditable(root);
		const next = sanitizeUrlInputValue(parseHtmlToRaw(root.innerHTML, CLS));
		if (caret >= 0) {
			lastCaret.current = caret;
			onCaretChange?.(
				computeRawInsertAtFromVisualCaret(
					next,
					caret,
					endpointArgs,
				),
			);
		}

		onChange(next);
		typing.current = false;
	};

	const updateCaretFromClick = (event: React.MouseEvent<HTMLDivElement>) => {
		const root = rootRef.current;
		if (!root) return;

		const contentRightEdge = getContentRightEdge(root);
		if (contentRightEdge !== null && event.clientX > contentRightEdge) {
			lastCaret.current = getInlineVisualLength(value || '', endpointArgs);
			onCaretChange?.((value || '').length);
			setFocusByCaretPositionInDivEditable(root, lastCaret.current);
			return;
		}

		const caret = getCaretPositionOfDivEditable(root);
		if (caret >= 0) {
			lastCaret.current = caret;
			onCaretChange?.(
				computeRawInsertAtFromVisualCaret(
					value || '',
					caret,
					endpointArgs,
				),
			);
		}
	};

	const focusEditor = () => {
		const root = rootRef.current;
		if (!root || readOnly) return;

		root.focus();
		if (!window.getSelection()?.rangeCount) {
			setFocusByCaretPositionInDivEditable(root, lastCaret.current);
		}
	};

	return (
		<>
		<div
			ref={rootRef}
			contentEditable={!readOnly}
			suppressContentEditableWarning
			tabIndex={readOnly ? undefined : 0}
			onInput={updateFromDom}
			onMouseDown={focusEditor}
			onFocus={() => {
				const root = rootRef.current;
				if (!root || readOnly) return;

				const caret = getCaretPositionOfDivEditable(root);
				if (caret >= 0) return;

				setFocusByCaretPositionInDivEditable(root, lastCaret.current);
			}}
			onClick={updateCaretFromClick}
			onKeyUp={() => {
				const root = rootRef.current;
				if (!root) return;
				const caret = getCaretPositionOfDivEditable(root);
				if (caret >= 0) {
					lastCaret.current = caret;
					onCaretChange?.(
						computeRawInsertAtFromVisualCaret(
							value || '',
							caret,
							endpointArgs,
						),
					);
				}
			}}
			onKeyDown={(event) => {
				if (readOnly) return;
				if (shouldBlockUrlKeyInput(event.key)) event.preventDefault();
			}}
			onPaste={(event) => {
				if (readOnly) return void event.preventDefault();
				const pasted = sanitizeUrlInputValue(
					sanitizePlainTextPaste(
						event.clipboardData?.getData('text/plain') || '',
					),
				);
				if (!pasted) return void event.preventDefault();
				event.preventDefault();
				try {
					document.execCommand('insertText', false, pasted);
				} catch {}
				requestAnimationFrame(updateFromDom);
			}}
			onBlur={() => render(value || '')}
			style={{
				minHeight: 40,
				display: 'flex',
				alignItems: 'center',
				border: '1px solid var(--color-border-default)',
				borderRadius: 8,
				padding: '0 11px',
				background: readOnly
					? 'var(--color-background-disabled)'
					: 'var(--color-background-surface)',
				cursor: readOnly ? 'default' : 'text',
				outline: 'none',
				overflow: 'hidden',
				whiteSpace: 'nowrap',
			}}
		/>
		<EndpointArgHoverTooltip
			containerRef={rootRef}
			endpointArgs={endpointArgs}
			connection={connection}
			currentMethod={currentMethod}
		/>
		</>
	);
};
