import React, { useCallback, useEffect, useRef } from 'react';
import {
	getCaretPositionOfDivEditable,
	setFocusByCaretPositionInDivEditable,
} from './utils/contentEditable';
import type { EndpointArg } from '../../../types/connection';
import {
	PROHIBITED_ENDPOINT_CHARACTERS,
	isSelectionInside,
	getInlineVisualLength,
	buildInlineHtml,
	parseHtmlToRaw,
	sanitizePlainTextPaste,
	removeInlineTokenByIndex,
	sanitizeUrlInputValue,
	shouldBlockUrlKeyInput,
} from './urlEditor.utils';

type Props = {
	readOnly?: boolean;
	value: string;
	afterNode?: React.ReactNode;

	endpointArgs: Record<string, EndpointArg>;
	endpointArgsRef: React.RefObject<Record<string, EndpointArg>>;

	divRef: React.RefObject<HTMLDivElement | null>;
	lastCaretRef: React.RefObject<number>;
	selectedTokenIndexRef: React.RefObject<number | null>;

	onRawChange: (nextRaw: string) => void;
	onAfterManualEditRebuildParams: (nextRaw: string) => void;
	onBlurCommit: () => void;
};

const CLS = 'oc-endpoint-ref';

export const UrlEndpointField: React.FC<Props> = ({
	readOnly,
	value,
	afterNode,
	endpointArgs,
	endpointArgsRef,
	divRef,
	lastCaretRef,
	selectedTokenIndexRef,
	onRawChange,
	onAfterManualEditRebuildParams,
	onBlurCommit,
}) => {
	const lastRendered = useRef('');
	const typing = useRef(false);
	const raf = useRef<number | null>(null);

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

			if (!readOnly && document.activeElement === root) {
				try {
					setFocusByCaretPositionInDivEditable(root, caret);
				} catch {}
			}
		},
		[divRef, endpointArgsRef, lastCaretRef, readOnly]
	);

	const scheduleRebuild = useCallback(
		(nextRaw: string) => {
			if (raf.current) cancelAnimationFrame(raf.current);
			raf.current = requestAnimationFrame(() => {
				raf.current = null;
				typing.current = false;
				onAfterManualEditRebuildParams(nextRaw);
			});
		},
		[onAfterManualEditRebuildParams]
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
		selectedTokenIndexRef.current = null;
		render(value || '', nextCaret);
	}, [
		value,
		render,
		divRef,
		endpointArgsRef,
		lastCaretRef,
		selectedTokenIndexRef,
	]);

	useEffect(() => {
		const onSel = () => {
			const root = divRef.current;
			if (!root || !isSelectionInside(root)) return;
			const caret = getCaretPositionOfDivEditable(root);
			if (caret >= 0) lastCaretRef.current = caret;
		};
		document.addEventListener('selectionchange', onSel);
		return () => document.removeEventListener('selectionchange', onSel);
	}, [divRef, lastCaretRef]);

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
			if (caret >= 0) lastCaretRef.current = caret;
		}

		const next = sanitizeUrlInputValue(parseHtmlToRaw(root.innerHTML, CLS));
		selectedTokenIndexRef.current = null;
		onRawChange(next);
		scheduleRebuild(next);
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

		render(next, lastCaretRef.current);
		onAfterManualEditRebuildParams(next);
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
			typing.current = true;
			onRawChange(next);
			scheduleRebuild(next);
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
			<div
				ref={divRef}
				contentEditable={!readOnly}
				onBeforeInput={handleBeforeInput}
				onInput={updateFromDom}
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
			{afterNode}
		</div>
	);
};
