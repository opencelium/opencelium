import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LinkOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useMethodContext } from '../../../providers/MethodContext';
import type { RootState } from '../../../store';
import type {
	Connection,
	EndpointArg,
	Enhancement,
	QueryParam,
} from '../../../types/connection';
import { Language } from '../../../types/connection';
import {
	updateEndpoint,
	updateQueryParams,
	upsertEndpointArg,
	upsertFieldBinding,
} from '../../../store/connection/connectionSlice';

import { UrlEndpointField } from './UrlEndpointField';
import ReferenceGenerator from '../reference-generator/ReferenceGenerator';

import {
	buildQueryParamsFromEndpoint,
	computeRawInsertAtFromVisualCaret,
	createId,
	ensureTemplateRow,
	getInlineVisualLength,
	normalizeReference,
	stripMockActiveFromEndpoint,
	stripTemplateRows,
	stripMockActiveRows,
} from './urlEditor.utils';

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

	const [queryParams, setQueryParams] = useState<QueryParam[]>(() => {
		const stored = stripMockActiveRows(
			(method.request.queryParams || []).map((p) => ({
				...p,
			})) as QueryParam[],
		);
		return stored?.length
			? ensureTemplateRow(stored)
			: (buildQueryParamsFromEndpoint(
					method.request.endpoint || '',
				) as QueryParam[]);
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
			nextQueryParams: QueryParam[],
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
					queryParams: stripTemplateRows(nextQueryParams),
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
			queryParams,
			endpointArgsRef.current,
		);
	}, [dispatchSaveAll, endpointRaw, queryParams, readOnly]);

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

			const attachEnhancementToIds = (
				ids: string[],
				enhancement: Enhancement,
			) => {
				for (const id of ids) {
					if (nextEndpointArgs[id])
						nextEndpointArgs[id] = { ...nextEndpointArgs[id], enhancement };
				}
			};

			if (!existingTokenIds?.length) {
				const enhancement: Enhancement = {
					enhanceId: newArgId,
					language: Language.JavaScript,
					script: 'RESULT_VAR = VAR_0',
					args: {
						RESULT_VAR: `${method.color}.(request).endpoint`,
						VAR_0: sourceRef,
					},
				};

				nextEndpointArgs[newArgId] = {
					id: newArgId,
					source: sourceRef,
					enhancement,
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
					dispatch(upsertFieldBinding({ enhancement } as any));
				}

				return {
					token,
					tokenLabel: sourceRef,
					endpointArgsNext: nextEndpointArgs,
				};
			}

			const baseTokenId = existingTokenIds[0];
			const baseEnh = nextEndpointArgs[baseTokenId]?.enhancement;

			const nextIndex = existingTokenIds.length;

			const enhancement: Enhancement = baseEnh
				? {
						...baseEnh,
						enhanceId: baseEnh.enhanceId || baseTokenId,
						language: baseEnh.language || Language.JavaScript,
						script: baseEnh.script || 'RESULT_VAR = VAR_0',
						args: { ...(baseEnh.args || {}), [`VAR_${nextIndex}`]: sourceRef },
					}
				: {
						enhanceId: baseTokenId,
						language: Language.JavaScript,
						script: 'RESULT_VAR = VAR_0',
						args: {
							RESULT_VAR: `${method.color}.(request).endpoint`,
							VAR_0: normalizeReference(
								nextEndpointArgs[baseTokenId]?.source || '',
							),
							[`VAR_${nextIndex}`]: sourceRef,
						},
					};

			attachEnhancementToIds(existingTokenIds, enhancement);
			nextEndpointArgs[newArgId] = {
				id: newArgId,
				source: sourceRef,
				enhancement,
			};

			endpointArgsRef.current = nextEndpointArgs;
			setEndpointArgsState(nextEndpointArgs);

			if (!readOnly) {
				upsertMany([...existingTokenIds, newArgId]);
				dispatch(upsertFieldBinding({ enhancement } as any));
			}

			return {
				token,
				tokenLabel: sourceRef,
				endpointArgsNext: nextEndpointArgs,
			};
		},
		[dispatch, method.color, method.id, readOnly],
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

		const stored = stripMockActiveRows(
			(method.request.queryParams || []).map((p) => ({
				...p,
			})) as QueryParam[],
		);
		setQueryParams(
			stored?.length
				? ensureTemplateRow(stored)
				: (buildQueryParamsFromEndpoint(incomingEndpoint) as QueryParam[]),
		);

		lastKnownCaretPosRef.current = getInlineVisualLength(
			incomingEndpoint,
			nextArgs,
		);
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
		selectedEndpointTokenIndexRef.current = null;
		setQueryParams(
			(prev) => buildQueryParamsFromEndpoint(incoming, prev) as QueryParam[],
		);
	}, [method.request.endpoint]);

	useEffect(() => {
		return () => {
			if (readOnly) return;
			dispatchSaveAll(
				rawRef.current || '',
				queryParams,
				endpointArgsRef.current,
			);
		};
	}, [dispatchSaveAll, queryParams, readOnly]);

	const applyReferenceToEndpoint = useCallback(
		(reference: string) => {
			const currentRaw = rawRef.current || endpointRaw || '';
			const { token, tokenLabel } = createArgTokenForInlineEditors(
				reference,
				extractTokenIds(currentRaw),
			);
			const insertAt = computeRawInsertAtFromVisualCaret(
				currentRaw,
				lastKnownCaretPosRef.current,
				endpointArgsRef.current,
			);
			const nextRaw = `${currentRaw.slice(0, insertAt)}${token}${currentRaw.slice(
				insertAt,
			)}`;
			const nextQueryParams = buildQueryParamsFromEndpoint(
				nextRaw,
				queryParams,
			) as QueryParam[];
			const nextCaret =
				lastKnownCaretPosRef.current + (tokenLabel?.length || 0);

			selectedEndpointTokenIndexRef.current = null;
			lastKnownCaretPosRef.current = nextCaret;
			rawRef.current = nextRaw;
			setEndpointRaw(nextRaw);
			setQueryParams(nextQueryParams);
			lastDispatchedEndpointRef.current = nextRaw;
			dispatchSaveAll(nextRaw, nextQueryParams, endpointArgsRef.current);
			setIsEndpointReferenceGeneratorOpen(false);
		},
		[createArgTokenForInlineEditors, dispatchSaveAll, endpointRaw, queryParams],
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
				selectedTokenIndexRef={selectedEndpointTokenIndexRef}
				onRawChange={(nextRaw) => {
					setEndpointRaw(nextRaw);
					rawRef.current = nextRaw;
					lastDispatchedEndpointRef.current = null;
				}}
				onBlurCommit={saveAllNow}
				onAfterManualEditRebuildParams={(nextRaw) => {
					setQueryParams(
						(prev) =>
							buildQueryParamsFromEndpoint(nextRaw, prev) as QueryParam[],
					);
				}}
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
