import React, { useCallback, useEffect, useRef } from 'react';
import {
	getCaretPositionOfDivEditable,
	getCaretPositionOfDivEditableByPoint,
	getRawCaretPositionOfDivEditable,
	getRawCaretPositionOfDivEditableByPoint,
	isCaretReportedAtEditableRootStart,
	setFocusByCaretPositionInDivEditable,
} from './utils/contentEditable';
import type { EndpointArg } from '../../../types/connection';
import {
	PROHIBITED_ENDPOINT_CHARACTERS,
	isSelectionInside,
	getInlineVisualLength,
	buildInlineHtml,
	computeRawInsertAtFromVisualCaret,
	parseHtmlToRaw,
	sanitizePlainTextPaste,
	removeInlineTokenByIndex,
	sanitizeUrlInputValue,
	shouldBlockUrlKeyInput,
} from './urlEditor.utils';

type Props = {
	readOnly?: boolean;
	value: string;
	beforeNode?: React.ReactNode;
	afterNode?: React.ReactNode;

	endpointArgs: Record<string, EndpointArg>;
	endpointArgsRef: React.RefObject<Record<string, EndpointArg>>;

	divRef: React.RefObject<HTMLDivElement | null>;
	lastCaretRef: React.RefObject<number>;
	lastRawCaretRef: React.RefObject<number>;
	selectedTokenIndexRef: React.RefObject<number | null>;

	onRawChange: (nextRaw: string) => void;
	onBlurCommit: () => void;
	onRawCaretChange?: (rawCaret: number, visualCaret: number) => void;
};

const CLS = 'oc-endpoint-ref';

const getCaretFromRawChange = (
	prevRaw: string,
	nextRaw: string,
) => {
	let prefix = 0;
	while (
		prefix < prevRaw.length &&
		prefix < nextRaw.length &&
		prevRaw[prefix] === nextRaw[prefix]
	) {
		prefix += 1;
	}

	let suffix = 0;
	while (
		suffix < prevRaw.length - prefix &&
		suffix < nextRaw.length - prefix &&
		prevRaw[prevRaw.length - 1 - suffix] === nextRaw[nextRaw.length - 1 - suffix]
	) {
		suffix += 1;
	}

	return nextRaw.length - suffix;
};

export const UrlEndpointField: React.FC<Props> = ({
	readOnly,
	value,
	beforeNode,
	afterNode,
	endpointArgs,
	endpointArgsRef,
	divRef,
	lastCaretRef,
	lastRawCaretRef,
	selectedTokenIndexRef,
	onRawChange,
	onBlurCommit,
	onRawCaretChange,
}) => {
	const lastRendered = useRef('');
	const typing = useRef(false);

	useEffect(() => {
		endpointArgsRef.current = endpointArgs;
	}, [endpointArgs, endpointArgsRef]);

	const render = useCallback(
		(raw: string, caretOverride?: number) => {
			const root = divRef.current;
			if (!root) return;

			lastRendered.current = raw;
			root.innerHTML = buildInlineHtml(raw, endpointArgsRef.current, {
				className: CLS,
				cursorPointer: true,
			});

			const end = getInlineVisualLength(raw, endpointArgsRef.current);
			const caret =
				typeof caretOverride === 'number' && caretOverride >= 0
					? caretOverride
					: Number.isFinite(lastCaretRef.current)
					? lastCaretRef.current
					: end;

			lastCaretRef.current = caret;
			lastRawCaretRef.current = computeRawInsertAtFromVisualCaret(
				raw,
				caret,
				endpointArgsRef.current,
			);

			if (!readOnly && document.activeElement === root) {
				try {
					setFocusByCaretPositionInDivEditable(root, caret);
				} catch {}
			}
		},
		[divRef, endpointArgsRef, lastCaretRef, readOnly]
	);

	useEffect(() => {
		const root = divRef.current;
		if (!root || typing.current) return;

		const domRaw = parseHtmlToRaw(root.innerHTML, CLS);
		if (value === domRaw || value === lastRendered.current) return;

		const end = getInlineVisualLength(value || '', endpointArgsRef.current);
		const nextCaret = Number.isFinite(lastCaretRef.current)
			? Math.max(0, Math.min(lastCaretRef.current, end))
			: end;
		lastCaretRef.current = nextCaret;
		lastRawCaretRef.current = computeRawInsertAtFromVisualCaret(
			value || '',
			nextCaret,
			endpointArgsRef.current,
		);
		selectedTokenIndexRef.current = null;
		render(value || '', nextCaret);
	}, [
		value,
		render,
		divRef,
		endpointArgsRef,
		lastCaretRef,
		lastRawCaretRef,
		selectedTokenIndexRef,
	]);

	useEffect(() => {
		const onSel = () => {
			const root = divRef.current;
			if (!root || !isSelectionInside(root)) return;
			const caret = getCaretPositionOfDivEditable(root);
			if (caret >= 0) {
				lastCaretRef.current = caret;
				const rawCaret = getRawCaretPositionOfDivEditable(root);
				if (rawCaret > 0 || !(value || '')) {
					lastRawCaretRef.current = rawCaret;
					onRawCaretChange?.(rawCaret, caret);
				}
			}
		};
		document.addEventListener('selectionchange', onSel);
		return () => document.removeEventListener('selectionchange', onSel);
	}, [divRef, endpointArgsRef, lastCaretRef, lastRawCaretRef, onRawCaretChange, value]);

	const readRaw = () => {
		const root = divRef.current;
		return root ? parseHtmlToRaw(root.innerHTML, CLS) : value || '';
	};

	const updateFromDom = () => {
		const root = divRef.current;
		if (!root) return;

		typing.current = true;

		if (isSelectionInside(root)) {
			const caret = getCaretPositionOfDivEditable(root);
			if (caret >= 0) {
				lastCaretRef.current = caret;
			}
		}

		const next = sanitizeUrlInputValue(parseHtmlToRaw(root.innerHTML, CLS));
		if (next !== value) {
			const rawCaret = getCaretFromRawChange(value || '', next);
			lastRawCaretRef.current = rawCaret;
			lastCaretRef.current = getInlineVisualLength(
				next.slice(0, rawCaret),
				endpointArgsRef.current,
			);
			onRawCaretChange?.(rawCaret, lastCaretRef.current);
		} else if (
			lastCaretRef.current === 0 &&
			isCaretReportedAtEditableRootStart(root)
		) {
			lastCaretRef.current = getInlineVisualLength(next, endpointArgsRef.current);
			lastRawCaretRef.current = next.length;
			onRawCaretChange?.(lastRawCaretRef.current, lastCaretRef.current);
		}
		selectedTokenIndexRef.current = null;
		onRawChange(next);
		typing.current = false;
	};

	const captureCaretFromSelection = () => {
		const root = divRef.current;
		if (!root || !isSelectionInside(root)) return;
		const caret = getCaretPositionOfDivEditable(root);
		if (caret >= 0) {
			lastCaretRef.current = caret;
			const rawCaret = getRawCaretPositionOfDivEditable(root);
			if (rawCaret > 0 || !(value || '')) {
				lastRawCaretRef.current = rawCaret;
				onRawCaretChange?.(rawCaret, caret);
			}
		}
	};

	const captureCaretFromMouse = (e: React.MouseEvent<HTMLDivElement>) => {
		const root = divRef.current;
		if (!root) return;

		const rootRect = root.getBoundingClientRect();
		if (e.clientX >= rootRect.right - 2) {
			lastCaretRef.current = getInlineVisualLength(value || '', endpointArgsRef.current);
			lastRawCaretRef.current = (value || '').length;
			onRawCaretChange?.(lastRawCaretRef.current, lastCaretRef.current);
			return;
		}

		const rawCaret = getRawCaretPositionOfDivEditableByPoint(
			root,
			e.clientX,
			e.clientY,
		);
		if (rawCaret >= 0) {
			lastRawCaretRef.current = rawCaret;
			lastCaretRef.current = getInlineVisualLength(
				(value || '').slice(0, rawCaret),
				endpointArgsRef.current,
			);
			onRawCaretChange?.(rawCaret, lastCaretRef.current);
			return;
		}

		const caret = getCaretPositionOfDivEditableByPoint(
			root,
			e.clientX,
			e.clientY,
		);
		if (caret >= 0) {
			lastCaretRef.current = caret;
			return;
		}

		requestAnimationFrame(captureCaretFromSelection);
	};

	const handleTokenDelete = () => {
		const idx = selectedTokenIndexRef.current;
		if (idx == null) return false;

		const next = removeInlineTokenByIndex(readRaw(), idx);
		selectedTokenIndexRef.current = null;
		onRawChange(next);
		typing.current = false;

		const end = getInlineVisualLength(next, endpointArgsRef.current);
		lastCaretRef.current = Math.min(lastCaretRef.current, end);
		lastRawCaretRef.current = Math.min(lastRawCaretRef.current, next.length);
		onRawCaretChange?.(lastRawCaretRef.current, lastCaretRef.current);

		render(next, lastCaretRef.current);
		return true;
	};

	const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
		if (readOnly) return void e.preventDefault();

		const root = divRef.current;
		if (!root) return;

		const pasted = sanitizeUrlInputValue(sanitizePlainTextPaste(
			e.clipboardData?.getData('text/plain') || ''
		));
		if (!pasted) return void e.preventDefault();

		e.preventDefault();
		try {
			document.execCommand('insertText', false, pasted);
		} catch {}

		requestAnimationFrame(() => {
			const next = sanitizeUrlInputValue(parseHtmlToRaw(root.innerHTML, CLS));
			if (next !== value) {
				const rawCaret = getCaretFromRawChange(value || '', next);
				lastRawCaretRef.current = rawCaret;
				lastCaretRef.current = getInlineVisualLength(
					next.slice(0, rawCaret),
					endpointArgsRef.current,
				);
				onRawCaretChange?.(rawCaret, lastCaretRef.current);
			}
			typing.current = true;
			onRawChange(next);
			typing.current = false;
		});
	};

	const handleBeforeInput = (e: React.FormEvent<HTMLDivElement>) => {
		if (readOnly) return;

		const nativeEvent = e.nativeEvent as InputEvent;
		const data = nativeEvent.data ?? '';
		if (!data) return;

		if (data === '. ') {
			e.preventDefault();
			return;
		}

		const sanitized = sanitizeUrlInputValue(data);
		if (sanitized === data) return;

		e.preventDefault();
		if (!sanitized) return;

		try {
			document.execCommand('insertText', false, sanitized);
		} catch {}
	};

	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 8,
				minHeight: 48,
				padding: '11px 14px',
				border: '1px solid var(--color-border-default)',
				borderRadius: 8,
				background: readOnly ? 'var(--color-background-disabled)' : 'var(--color-background-surface)',
			}}
		>
			{beforeNode ? (
				<div style={{ flexShrink: 0 }}>{beforeNode}</div>
			) : null}
			<div
				ref={divRef}
				contentEditable={!readOnly}
				onBeforeInput={handleBeforeInput}
				onInput={updateFromDom}
				onMouseDown={captureCaretFromMouse}
				onClick={captureCaretFromMouse}
				onMouseUp={captureCaretFromMouse}
				onKeyUp={captureCaretFromSelection}
				onKeyDown={(e) => {
					if (readOnly) return;

					if (PROHIBITED_ENDPOINT_CHARACTERS.includes(e.key)) {
						e.preventDefault();
						return;
					}
					if (shouldBlockUrlKeyInput(e.key)) {
						e.preventDefault();
						return;
					}
					if (e.ctrlKey || e.metaKey || e.altKey) return;

					if (
						selectedTokenIndexRef.current != null &&
						(e.key === 'Backspace' || e.key === 'Delete')
					) {
						e.preventDefault();
						handleTokenDelete();
						return;
					}
				}}
				onMouseDownCapture={(e) => {
					const root = divRef.current;
					const target = e.target as HTMLElement | null;
					if (!root || !target) return;

					const pill = target.closest?.(`.${CLS}`) as HTMLElement | null;
					if (!pill || !root.contains(pill)) return;

					const idx = Number(pill.getAttribute('data-ref-index'));
					if (!Number.isFinite(idx)) return;

					selectedTokenIndexRef.current = idx;
				}}
				onBlur={() => {
					typing.current = false;
					onBlurCommit();
					render(value || '', lastCaretRef.current);
				}}
				onPaste={handlePaste}
				style={{
					minHeight: 24,
					fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
					whiteSpace: 'pre-wrap',
					wordBreak: 'break-all',
					outline: 'none',
					cursor: readOnly ? 'default' : 'text',
					flex: 1,
					background: 'transparent',
					boxShadow: 'none',
				}}
			/>
			{afterNode ? (
				<div>{afterNode}</div>
			) : null}
		</div>
	);
};
