import React, {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
} from 'react';
import type { EndpointArg } from '../../../types/connection';
import {
	buildInlineHtml,
	getInlineVisualLength,
	hasAnyTokenInString,
	parseHtmlToRaw,
	PROHIBITED_ENDPOINT_CHARACTERS,
	sanitizePlainTextPaste,
	sanitizeUrlInputValue,
	shouldBlockUrlKeyInput,
} from './urlEditor.utils';
import { setFocusByCaretPositionInDivEditable } from './utils/contentEditable';
import { ReferenceItem } from '../../../core/references/components/enhancemen/ReferenceItem';

export type InlineEditorHandle = {
	insertReference: (sourceRef: string) => void;
	setCaretToEnd: () => void;
	getCaret: () => number;
	setCaret: (pos: number) => void;
};

export type CreateArgTokenResult = {
	token: string;
	tokenLabel: string;
	endpointArgsNext: Record<string, EndpointArg>;
};

export type InlineEditorProps = {
	value: string;
	endpointArgs?: Record<string, EndpointArg>;
	readOnly?: boolean;
	onChange: (nextRaw: string) => void;
	onDeleteToken?: (argId: string, nextRaw: string) => void;
	createArgToken: (sourceRefRaw: string) => CreateArgTokenResult;
	minHeight?: number;
	autoFocus?: boolean;
	lockWhenHasToken?: boolean;
	tokensView?: 'editor' | 'pills';
};

const ARG_ID_RE = /#{%\s*([A-Za-z0-9_-]+)\s*%}/g;

export const InlineValueEditor = forwardRef<
	InlineEditorHandle,
	InlineEditorProps
>(
	(
		{
			value,
			endpointArgs,
			readOnly,
			onChange,
			onDeleteToken,
			createArgToken,
			minHeight = 40,
			autoFocus = false,
			lockWhenHasToken = false,
			tokensView = 'editor',
		},
		ref
	) => {
		const rootRef = useRef<HTMLDivElement | null>(null);
		const caretRef = useRef(0);
		const endpointArgsRef = useRef<Record<string, EndpointArg> | undefined>(
			endpointArgs
		);
		const endpointArgsNextRef = useRef<Record<string, EndpointArg> | null>(
			null
		);

		useEffect(() => {
			endpointArgsRef.current = endpointArgs;
		}, [endpointArgs]);

		const locked = !!lockWhenHasToken && hasAnyTokenInString(value || '');

		const render = (raw: string, caret?: number) => {
			const root = rootRef.current;
			if (!root) return;

			root.innerHTML = buildInlineHtml(raw, endpointArgsRef.current, {
				className: 'oc-endpoint-ref',
				cursorPointer: true,
			});

			const end = getInlineVisualLength(raw || '', endpointArgsRef.current);
			const pos =
				typeof caret === 'number'
					? Math.max(0, Math.min(caret, end))
					: Math.min(caretRef.current, end);
			caretRef.current = pos;

			if (!readOnly && document.activeElement === root) {
				try {
					setFocusByCaretPositionInDivEditable(root, pos);
				} catch {}
			}
		};

		useImperativeHandle(
			ref,
			() => ({
				insertReference: (sourceRefRaw: string) => {
					const root = rootRef.current;
					if (!root) return;

					const { token, endpointArgsNext } = createArgToken(sourceRefRaw);
					endpointArgsNextRef.current = endpointArgsNext;

					const currentRaw =
						parseHtmlToRaw(root.innerHTML, 'oc-endpoint-ref') || value || '';
					const nextRaw = `${currentRaw}${token}`;

					onChange(nextRaw);

					requestAnimationFrame(() => {
						const end = getInlineVisualLength(
							nextRaw || '',
							endpointArgsRef.current
						);
						render(nextRaw, end);
					});
				},
				setCaretToEnd: () => {
					const end = getInlineVisualLength(
						value || '',
						endpointArgsRef.current
					);
					caretRef.current = end;
					const root = rootRef.current;
					if (!root) return;
					try {
						setFocusByCaretPositionInDivEditable(root, end);
					} catch {}
				},
				getCaret: () => caretRef.current,
				setCaret: (pos: number) => {
					caretRef.current = pos;
					const root = rootRef.current;
					if (!root) return;
					try {
						setFocusByCaretPositionInDivEditable(root, pos);
					} catch {}
				},
			}),
			[createArgToken, onChange, value]
		);

		useEffect(() => {
			render(value || '');
		}, [value]);

		useEffect(() => {
			if (!autoFocus) return;
			requestAnimationFrame(() => {
				const end = getInlineVisualLength(value || '', endpointArgsRef.current);
				caretRef.current = end;
				const root = rootRef.current;
				if (!root) return;
				try {
					setFocusByCaretPositionInDivEditable(root, end);
				} catch {}
			});
		}, [autoFocus, value]);

		if (tokensView === 'pills' && hasAnyTokenInString(value || '')) {
			const mergedArgs =
				endpointArgsNextRef.current || endpointArgsRef.current || {};
			const ids: string[] = [];
			ARG_ID_RE.lastIndex = 0;
			let m: RegExpExecArray | null;
			while ((m = ARG_ID_RE.exec(value || ''))) if (m[1]) ids.push(m[1]);

			return (
				<div
					style={{
						width: '100%',
						minHeight,
						boxSizing: 'border-box',
						display: 'flex',
						alignItems: 'center',
						border: '1px solid #d9d9d9',
						borderRadius: 8,
						padding: '0 8px',
						backgroundColor: readOnly ? '#fafafa' : '#fff',
						overflow: 'visible',
					}}
				>
					{ids.map((argId) => {
						const src = mergedArgs?.[argId]?.source;
						if (!src) return null;

						const onDelete = () => {
							if (readOnly) return;
							const nextRaw = (value || '')
								.replace(new RegExp(`#{%\\s*${argId}\\s*%}`, 'g'), '')
								.trim();
							onChange(nextRaw);
							onDeleteToken?.(argId, nextRaw);
						};

						return (
							<ReferenceItem
								key={argId}
								argKey={argId}
								value={src}
								readOnly={readOnly}
								onDelete={onDelete}
							/>
						);
					})}
				</div>
			);
		}

		return (
			<div
				style={{
					width: '100%',
					minHeight,
					boxSizing: 'border-box',
					display: 'flex',
					alignItems: 'center',
					border: '1px solid #d9d9d9',
					borderRadius: 8,
					padding: '0 8px',
					backgroundColor: readOnly ? '#fafafa' : '#fff',
					overflow: 'hidden',
				}}
			>
				<div
					ref={rootRef}
					contentEditable={!readOnly && !locked}
					onInput={() => {
						const root = rootRef.current;
						if (!root) return;
						onChange(
							sanitizeUrlInputValue(
								parseHtmlToRaw(root.innerHTML, 'oc-endpoint-ref')
							)
						);
					}}
					onKeyDown={(e) => {
						if (readOnly || locked) return;
						if (
							PROHIBITED_ENDPOINT_CHARACTERS.includes(e.key) ||
							shouldBlockUrlKeyInput(e.key)
						)
							e.preventDefault();
						if (e.ctrlKey || e.metaKey || e.altKey) return;
					}}
					onBlur={() => render(value || '', caretRef.current)}
					onPaste={(e) => {
						if (readOnly || locked) {
							e.preventDefault();
							return;
						}
						e.preventDefault();
						const pasted = sanitizeUrlInputValue(
							sanitizePlainTextPaste(
								e.clipboardData?.getData('text/plain') || ''
							)
						);
						if (!pasted) return;
						try {
							document.execCommand('insertText', false, pasted);
						} catch {}
					}}
					style={{
						flex: 1,
						outline: 'none',
						cursor: readOnly ? 'default' : locked ? 'default' : 'text',
						fontFamily: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace',
						whiteSpace: 'pre',
						wordBreak: 'break-all',
						overflow: 'hidden',
						padding: '9px 4px',
					}}
				/>
			</div>
		);
	}
);

InlineValueEditor.displayName = 'InlineValueEditor';
