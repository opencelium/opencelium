import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LinkOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useMethodContext } from '../../../providers/MethodContext';
import type { RootState } from '../../../store';
import type {
	Connection,
	EndpointArg,
} from '../../../types/connection';
import {
	updateEndpoint,
	updateQueryParams,
	upsertEndpointArg,
} from '../../../store/connection/connectionSlice';

import { UrlEndpointField } from './UrlEndpointField';
import ReferenceGenerator from '../reference-generator/ReferenceGenerator';

import {
	buildQueryParamsFromEndpoint,
	createId,
	getInlineVisualLength,
	normalizeReference,
	stripMockActiveFromEndpoint,
} from './urlEditor.utils';
import {
	setFocusByCaretPositionInDivEditable,
} from './utils/contentEditable';

const TOKEN_ID_RE = /#{%\s*([A-Za-z0-9_-]+)\s*%}/g;
const extractTokenIds = (s: string) =>
	Array.from((s || '').matchAll(TOKEN_ID_RE), (m) => m[1]);

const UrlEditor: React.FC<{ readOnly?: boolean }> = ({ readOnly }) => {
	const { method } = useMethodContext();
	const dispatch = useDispatch();
	const connection: Connection | null = useSelector(
		(state: RootState) => state.connection.connection,
	);

	const endpointDivRef = useRef<HTMLDivElement | null>(null);
	const lastKnownCaretPosRef = useRef(0);
	const lastKnownRawCaretPosRef = useRef(0);
	const selectedEndpointTokenIndexRef = useRef<number | null>(null);

	const initialEndpoint = stripMockActiveFromEndpoint(
		method.request.endpoint || '',
	);
	const [endpointRaw, setEndpointRaw] = useState(initialEndpoint);
	const rawRef = useRef(initialEndpoint);

	const [endpointArgsState, setEndpointArgsState] = useState<
		Record<string, EndpointArg>
	>({
		...(method.request.endpointArgs || {}),
	});
	const endpointArgsRef = useRef<Record<string, EndpointArg>>({
		...(method.request.endpointArgs || {}),
	});

	const [
		isEndpointReferenceGeneratorOpen,
		setIsEndpointReferenceGeneratorOpen,
	] = useState(false);

	const lastDispatchedEndpointRef = useRef<string | null>(null);

	useEffect(() => {
		rawRef.current = endpointRaw;
	}, [endpointRaw]);

	const dispatchSaveAll = useCallback(
		(
			nextEndpoint: string,
			nextEndpointArgs: Record<string, EndpointArg>,
		) => {
			if (readOnly) return;

			dispatch(
				updateEndpoint({
					methodId: method.id,
					endpoint: nextEndpoint,
				} as any),
			);
			dispatch(
				updateQueryParams({
					methodId: method.id,
					queryParams: buildQueryParamsFromEndpoint(nextEndpoint, undefined, false),
				} as any),
			);

			for (const argId of Object.keys(nextEndpointArgs || {})) {
				const arg = nextEndpointArgs[argId];
				if (!arg) continue;
				dispatch(
					upsertEndpointArg({
						methodId: method.id,
						argId,
						patch: arg,
					} as any),
				);
			}
		},
		[dispatch, method.id, readOnly],
	);

	const saveAllNow = useCallback(() => {
		if (readOnly) return;
		dispatchSaveAll(
			rawRef.current || endpointRaw || '',
			endpointArgsRef.current,
		);
	}, [dispatchSaveAll, endpointRaw, readOnly]);

	const createArgTokenForInlineEditors = useCallback(
		(sourceRefRaw: string, existingTokenIds: string[]) => {
			const sourceRef = normalizeReference(sourceRefRaw);
			const newArgId = createId();
			const token = `#{%${newArgId}%}`;

			const nextEndpointArgs: Record<string, EndpointArg> = {
				...endpointArgsRef.current,
			};

			const upsertMany = (ids: string[]) => {
				if (readOnly) return;
				for (const id of ids) {
					const patch = nextEndpointArgs[id];
					if (!patch) continue;
					dispatch(
						upsertEndpointArg({
							methodId: method.id,
							argId: id,
							patch,
						} as any),
					);
				}
			};

			if (!existingTokenIds?.length) {
				nextEndpointArgs[newArgId] = {
					id: newArgId,
					source: sourceRef,
				};

				endpointArgsRef.current = nextEndpointArgs;
				setEndpointArgsState(nextEndpointArgs);

				if (!readOnly) {
					dispatch(
						upsertEndpointArg({
							methodId: method.id,
							argId: newArgId,
							patch: nextEndpointArgs[newArgId],
						} as any),
					);
				}

				return {
					token,
					tokenLabel: sourceRef,
					endpointArgsNext: nextEndpointArgs,
				};
			}

			nextEndpointArgs[newArgId] = {
				id: newArgId,
				source: sourceRef,
			};

			endpointArgsRef.current = nextEndpointArgs;
			setEndpointArgsState(nextEndpointArgs);

			if (!readOnly) {
				upsertMany([...existingTokenIds, newArgId]);
			}

			return {
				token,
				tokenLabel: sourceRef,
				endpointArgsNext: nextEndpointArgs,
			};
		},
		[dispatch, method.id, readOnly],
	);

	useEffect(() => {
		const incomingEndpoint = stripMockActiveFromEndpoint(
			method.request.endpoint || '',
		);

		const nextArgs = { ...(method.request.endpointArgs || {}) } as any;
		endpointArgsRef.current = nextArgs;
		setEndpointArgsState(nextArgs);

		setEndpointRaw(incomingEndpoint);
		rawRef.current = incomingEndpoint;

		lastKnownCaretPosRef.current = getInlineVisualLength(
			incomingEndpoint,
			nextArgs,
		);
		lastKnownRawCaretPosRef.current = incomingEndpoint.length;
		selectedEndpointTokenIndexRef.current = null;
		setIsEndpointReferenceGeneratorOpen(false);
		lastDispatchedEndpointRef.current = null;
	}, [method.id]);

	useEffect(() => {
		const incoming = stripMockActiveFromEndpoint(method.request.endpoint || '');
		if (incoming === endpointRaw) return;

		if (
			lastDispatchedEndpointRef.current &&
			incoming === lastDispatchedEndpointRef.current
		) {
			setEndpointRaw(incoming);
			rawRef.current = incoming;
			return;
		}

		setEndpointRaw(incoming);
		rawRef.current = incoming;
		lastKnownCaretPosRef.current = getInlineVisualLength(
			incoming,
			endpointArgsRef.current,
		);
		lastKnownRawCaretPosRef.current = incoming.length;
		selectedEndpointTokenIndexRef.current = null;
	}, [method.request.endpoint]);

	useEffect(() => {
		return () => {
			if (readOnly) return;
			dispatchSaveAll(
				rawRef.current || '',
				endpointArgsRef.current,
			);
		};
	}, [dispatchSaveAll, readOnly]);

	const applyReferenceToEndpoint = useCallback(
		(reference: string) => {
			const currentRaw = rawRef.current || endpointRaw || '';
			const { token } = createArgTokenForInlineEditors(
				reference,
				extractTokenIds(currentRaw),
			);
			const insertAt = Math.max(
				0,
				Math.min(lastKnownRawCaretPosRef.current, currentRaw.length),
			);
			const nextRaw = `${currentRaw.slice(0, insertAt)}${token}${currentRaw.slice(
				insertAt,
			)}`;
			const nextRawCaret = insertAt + token.length;
			const nextCaret =
				getInlineVisualLength(nextRaw.slice(0, nextRawCaret), endpointArgsRef.current);

			selectedEndpointTokenIndexRef.current = null;
			lastKnownCaretPosRef.current = nextCaret;
			lastKnownRawCaretPosRef.current = nextRawCaret;
			rawRef.current = nextRaw;
			setEndpointRaw(nextRaw);
			lastDispatchedEndpointRef.current = nextRaw;
			dispatchSaveAll(nextRaw, endpointArgsRef.current);
			setIsEndpointReferenceGeneratorOpen(false);
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					setFocusByCaretPositionInDivEditable(
						endpointDivRef.current,
						nextCaret,
					);
				});
			});
		},
		[createArgTokenForInlineEditors, dispatchSaveAll, endpointRaw],
	);

	if (!connection) return null;

	return (
		<div
			style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}
		>
			<UrlEndpointField
				readOnly={readOnly}
				value={endpointRaw}
				endpointArgs={endpointArgsState}
				endpointArgsRef={endpointArgsRef}
				divRef={endpointDivRef}
				lastCaretRef={lastKnownCaretPosRef}
				lastRawCaretRef={lastKnownRawCaretPosRef}
				selectedTokenIndexRef={selectedEndpointTokenIndexRef}
				onRawCaretChange={(rawCaret, visualCaret) => {
					lastKnownRawCaretPosRef.current = rawCaret;
					lastKnownCaretPosRef.current = visualCaret;
				}}
				onRawChange={(nextRaw) => {
					const prevRaw = rawRef.current || '';
					if (nextRaw.length > prevRaw.length && nextRaw.startsWith(prevRaw)) {
						lastKnownRawCaretPosRef.current = nextRaw.length;
						lastKnownCaretPosRef.current = getInlineVisualLength(
							nextRaw,
							endpointArgsRef.current,
						);
					}
					setEndpointRaw(nextRaw);
					rawRef.current = nextRaw;
					lastDispatchedEndpointRef.current = null;
				}}
				onBlurCommit={saveAllNow}
				afterNode={
					!readOnly ? (
						<Button
							icon={<LinkOutlined />}
							onClick={() =>
								setIsEndpointReferenceGeneratorOpen((prev) => !prev)
							}
							style={{ flexShrink: 0 }}
						>
							Insert Reference
						</Button>
					) : null
				}
			/>

			{!readOnly && isEndpointReferenceGeneratorOpen ? (
				<div
					style={{
						border: '1px solid var(--color-border-subtle)',
						borderRadius: 12,
						background: 'var(--color-background-surface)',
						padding: 12,
					}}
				>
					<ReferenceGenerator
						open
						connection={connection}
						currentMethod={method}
						allowResponseTypes={['body', 'header', 'status']}
						onClose={() => setIsEndpointReferenceGeneratorOpen(false)}
						onApply={(reference: string) => applyReferenceToEndpoint(reference)}
					/>
				</div>
			) : null}
		</div>
	);
};

export default UrlEditor;
