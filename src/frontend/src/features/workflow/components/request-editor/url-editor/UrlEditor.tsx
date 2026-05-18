import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
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
	removeEndpointArg,
	removeFieldBinding,
} from '../../../store/connection/connectionSlice';

import { UrlParamApiEditorDialog } from './UrlParamApiEditorDialog';
import { UrlEndpointField } from './UrlEndpointField';
import { UrlQueryParamsFilter } from './UrlQueryParamsFilter';
import { UrlQueryParamsTable } from './UrlQueryParamsTable';
import { InlineValueEditor } from './InlineValueEditor';

import {
	ARG_TOKEN_RE,
	buildQueryFromParams,
	buildQueryParamsFromEndpoint,
	createId,
	ensureTemplateRow,
	normalizeReference,
	splitEndpoint,
	stripMockActiveFromEndpoint,
	stripTemplateRows,
	stripMockActiveRows,
	valueForFilter,
} from './urlEditor.utils';

const TOKEN_ID_RE = /#{%\s*([A-Za-z0-9_-]+)\s*%}/g;
const extractTokenIds = (s: string) =>
	Array.from((s || '').matchAll(TOKEN_ID_RE), (m) => m[1]);

const UrlEditor: React.FC<{ readOnly?: boolean }> = ({ readOnly }) => {
	const { method } = useMethodContext();
	const dispatch = useDispatch();
	const connection: Connection | null = useSelector(
		(state: RootState) => state.connection.connection
	);

	const endpointDivRef = useRef<HTMLDivElement | null>(null);
	const lastKnownCaretPosRef = useRef(0);
	const selectedEndpointTokenIndexRef = useRef<number | null>(null);

	const initialEndpoint = stripMockActiveFromEndpoint(method.request.endpoint || '');
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
		const stored = stripMockActiveRows((method.request.queryParams || []).map((p) => ({
			...p,
		})) as QueryParam[]);
		return stored?.length
			? ensureTemplateRow(stored)
			: (buildQueryParamsFromEndpoint(
					method.request.endpoint || ''
			  ) as QueryParam[]);
	});

	const [filter, setFilter] = useState('');
	const [activeParamId, setActiveParamId] = useState<string | null>(null);
	const [isParamDialogOpen, setIsParamDialogOpen] = useState(false);
	const [isParamRefPanelOpen, setIsParamRefPanelOpen] = useState(false);

	const lastDispatchedEndpointRef = useRef<string | null>(null);
	const rebuildEnhancementAfterDelete = useCallback(
		(deletedArgId: string, nextValue: string) => {
			if (readOnly) return;

			const remainingIds = extractTokenIds(nextValue);

			const oldEnhanceId =
				endpointArgsRef.current?.[deletedArgId]?.enhancement?.enhanceId ||
				endpointArgsRef.current?.[remainingIds[0]]?.enhancement?.enhanceId ||
				deletedArgId;

			dispatch(
				removeEndpointArg({
					methodId: method.id,
					argId: deletedArgId,
				} as any)
			);

			const nextEndpointArgs: Record<string, EndpointArg> = {
				...endpointArgsRef.current,
			};
			delete nextEndpointArgs[deletedArgId];

			if (remainingIds.length === 0) {
				dispatch(removeFieldBinding({ enhanceId: oldEnhanceId } as any));
				endpointArgsRef.current = nextEndpointArgs;
				setEndpointArgsState(nextEndpointArgs);
				return;
			}

			const newBaseId = remainingIds[0];
			const newEnhanceId = newBaseId;

			if (oldEnhanceId !== newEnhanceId) {
				dispatch(removeFieldBinding({ enhanceId: oldEnhanceId } as any));
			}

			const sources = remainingIds
				.map((id) => nextEndpointArgs[id]?.source)
				.filter((s): s is string => !!s);

			if (!sources.length) {
				endpointArgsRef.current = nextEndpointArgs;
				setEndpointArgsState(nextEndpointArgs);
				dispatch(removeFieldBinding({ enhanceId: oldEnhanceId } as any));
				return;
			}

			const nextEnhancement: Enhancement = {
				enhanceId: newEnhanceId,
				language: Language.JavaScript,
				script: 'RESULT_VAR = VAR_0',
				args: {
					RESULT_VAR: `${method.color}.(request).endpoint`,
					VAR_0: sources[0],
				} as any,
			};

			for (let i = 1; i < sources.length; i++) {
				(nextEnhancement.args as any)[`VAR_${i}`] = sources[i];
			}

			for (const id of remainingIds) {
				const prev = nextEndpointArgs[id];
				if (!prev) continue;

				const patch = { ...prev, enhancement: nextEnhancement };
				nextEndpointArgs[id] = patch;

				dispatch(
					upsertEndpointArg({
						methodId: method.id,
						argId: id,
						patch,
					} as any)
				);
			}

			endpointArgsRef.current = nextEndpointArgs;
			setEndpointArgsState(nextEndpointArgs);

			dispatch(upsertFieldBinding({ enhancement: nextEnhancement } as any));
		},
		[dispatch, method.color, method.id, readOnly]
	);

	useEffect(() => {
		rawRef.current = endpointRaw;
	}, [endpointRaw]);

	const filteredParams = useMemo(() => {
		const f = filter.trim().toLowerCase();
		if (!f) return queryParams;
		return queryParams.filter((p) => {
			const key = (p.key || '').toLowerCase();
			const val = valueForFilter(
				p.value || '',
				endpointArgsRef.current
			).toLowerCase();
			return key.includes(f) || val.includes(f);
		});
	}, [filter, queryParams]);

	const activeParam = useMemo(
		() =>
			activeParamId
				? queryParams.find((p) => p.id === activeParamId) ?? null
				: null,
		[activeParamId, queryParams]
	);

	const dispatchSaveAll = useCallback(
		(
			nextEndpoint: string,
			nextQueryParams: QueryParam[],
			nextEndpointArgs: Record<string, EndpointArg>
		) => {
			if (readOnly) return;

			dispatch(
				updateEndpoint({
					methodId: method.id,
					endpoint: nextEndpoint,
				} as any)
			);
			dispatch(
				updateQueryParams({
					methodId: method.id,
					queryParams: stripTemplateRows(nextQueryParams),
				} as any)
			);

			for (const argId of Object.keys(nextEndpointArgs || {})) {
				const arg = nextEndpointArgs[argId];
				if (!arg) continue;
				dispatch(
					upsertEndpointArg({
						methodId: method.id,
						argId,
						patch: arg,
					} as any)
				);
			}
		},
		[dispatch, method.id, readOnly]
	);

	const commitParamsToEndpoint = useCallback(
		(
			nextParams: QueryParam[],
			nextEndpointArgs?: Record<string, EndpointArg>
		) => {
			const current = rawRef.current || endpointRaw || '';
			const { base } = splitEndpoint(current);
			const query = buildQueryFromParams(nextParams as any);
			const finalEndpoint = query ? `${base}?${query}` : base;

			rawRef.current = finalEndpoint;
			setEndpointRaw(finalEndpoint);

			if (nextEndpointArgs) {
				endpointArgsRef.current = nextEndpointArgs;
				setEndpointArgsState(nextEndpointArgs);
			}

			lastDispatchedEndpointRef.current = finalEndpoint;
			dispatchSaveAll(finalEndpoint, nextParams, endpointArgsRef.current);
		},
		[dispatchSaveAll, endpointRaw]
	);

	const saveAllNow = useCallback(() => {
		if (readOnly) return;
		dispatchSaveAll(
			rawRef.current || endpointRaw || '',
			queryParams,
			endpointArgsRef.current
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
						} as any)
					);
				}
			};

			const attachEnhancementToIds = (
				ids: string[],
				enhancement: Enhancement
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
						} as any)
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
								nextEndpointArgs[baseTokenId]?.source || ''
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
		[dispatch, method.color, method.id, readOnly]
	);

	useEffect(() => {
		const incomingEndpoint = stripMockActiveFromEndpoint(method.request.endpoint || '');

		const nextArgs = { ...(method.request.endpointArgs || {}) } as any;
		endpointArgsRef.current = nextArgs;
		setEndpointArgsState(nextArgs);

		setEndpointRaw(incomingEndpoint);
		rawRef.current = incomingEndpoint;

		const stored = stripMockActiveRows((method.request.queryParams || []).map((p) => ({
			...p,
		})) as QueryParam[]);
		setQueryParams(
			stored?.length
				? ensureTemplateRow(stored)
				: (buildQueryParamsFromEndpoint(incomingEndpoint) as QueryParam[])
		);

		setActiveParamId(null);
		setIsParamDialogOpen(false);
		setIsParamRefPanelOpen(false);
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
		setQueryParams(
			(prev) => buildQueryParamsFromEndpoint(incoming, prev) as QueryParam[]
		);
	}, [method.request.endpoint]);

	useEffect(() => {
		return () => {
			if (readOnly) return;
			dispatchSaveAll(
				rawRef.current || '',
				queryParams,
				endpointArgsRef.current
			);
		};
	}, [dispatchSaveAll, queryParams, readOnly]);

	const onChangeParam = useCallback(
		(id: string, patch: Partial<QueryParam>) => {
			let next = queryParams.map((p) => (p.id === id ? { ...p, ...patch } : p));

			const idx = next.findIndex((p) => p.id === id);
			if (idx >= 0) {
				const row = next[idx];
				const becameNonEmpty =
					(row.key || '').trim() !== '' || (row.value || '').trim() !== '';
				const prevRow = queryParams[idx];
				const prevWasTemplate =
					prevRow &&
					!prevRow.enabled &&
					(prevRow.key || '').trim() === '' &&
					(prevRow.value || '').trim() === '';

				if (prevWasTemplate && becameNonEmpty)
					next[idx] = { ...row, enabled: true };
			}

			next = ensureTemplateRow(next);
			setQueryParams(next);
			commitParamsToEndpoint(next);
		},
		[commitParamsToEndpoint, queryParams]
	);

	const onToggleEnabled = useCallback(
		(id: string, enabled: boolean) => onChangeParam(id, { enabled }),
		[onChangeParam]
	);

	const removeParamRow = useCallback(
		(id: string) => {
			const row = queryParams.find((p) => p.id === id);
			const next = ensureTemplateRow(queryParams.filter((p) => p.id !== id));

			if (row?.id && row.id === activeParamId) {
				setIsParamDialogOpen(false);
				setIsParamRefPanelOpen(false);
				setActiveParamId(null);
			}

			setQueryParams(next);
			commitParamsToEndpoint(next);
		},
		[activeParamId, commitParamsToEndpoint, queryParams]
	);

	const openParamDialog = useCallback((id: string) => {
		setActiveParamId(id);
		setIsParamDialogOpen(true);
		setIsParamRefPanelOpen(false);
	}, []);

	const closeParamDialog = useCallback(() => {
		setIsParamDialogOpen(false);
		setIsParamRefPanelOpen(false);
	}, []);

	const applyReferenceToActiveParam = useCallback(
		(reference: string) => {
			if (!activeParam) return;

			const currentValue = activeParam.value || '';
			const hasNonTokenText =
				currentValue.replace(ARG_TOKEN_RE, '').trim().length > 0;

			const existingIds = extractTokenIds(currentValue);
			const { token } = createArgTokenForInlineEditors(reference, existingIds);

			const onlyTokens = (currentValue.match(ARG_TOKEN_RE) || []).join('');
			const base = hasNonTokenText ? '' : onlyTokens;

			onChangeParam(activeParam.id, { value: `${base}${token}` });
			setIsParamRefPanelOpen(false);
		},
		[activeParam, createArgTokenForInlineEditors, onChangeParam]
	);

	if (!connection) return null;

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
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
							buildQueryParamsFromEndpoint(nextRaw, prev) as QueryParam[]
					);
				}}
			/>

			<UrlQueryParamsFilter value={filter} onChange={setFilter} />

			<UrlQueryParamsTable
				readOnly={readOnly}
				rows={filteredParams}
				endpointArgs={endpointArgsState}
				onToggleEnabled={onToggleEnabled}
				onChangeParam={onChangeParam}
				onDeleteParamRefArgId={rebuildEnhancementAfterDelete}
				onOpenParamDialog={openParamDialog}
				onRemoveParamRow={removeParamRow}
				createArgToken={(ref: string) =>
					createArgTokenForInlineEditors(ref, [])
				}
			/>

			{activeParam && (
				<UrlParamApiEditorDialog
					open={isParamDialogOpen}
					readOnly={readOnly}
					connection={connection}
					currentMethod={method}
					param={activeParam}
					endpointArgs={endpointArgsState}
					onChangeKey={(nextKey) =>
						onChangeParam(activeParam.id, { key: nextKey })
					}
					onChangeValue={(nextVal) =>
						onChangeParam(activeParam.id, { value: nextVal })
					}
					onClose={closeParamDialog}
					onRequestOpenReferenceGenerator={() => setIsParamRefPanelOpen(true)}
					isReferenceGeneratorOpen={!readOnly && isParamRefPanelOpen}
					onCloseReferenceGenerator={() => setIsParamRefPanelOpen(false)}
					onApplyReference={(refStr: string) =>
						applyReferenceToActiveParam(refStr)
					}
					onDeleteValueRefArgId={(argId, nextValue) =>
						rebuildEnhancementAfterDelete(argId, nextValue)
					}
					valueEditorNode={
						<InlineValueEditor
							value={activeParam.value || ''}
							endpointArgs={endpointArgsState}
							readOnly={readOnly}
							lockWhenHasToken={true}
							onChange={(nextRaw) =>
								onChangeParam(activeParam.id, { value: nextRaw })
							}
							createArgToken={(ref: string) =>
								createArgTokenForInlineEditors(
									ref,
									extractTokenIds(activeParam.value || '')
								)
							}
							minHeight={42}
							autoFocus={true}
						/>
					}
				/>
			)}
		</div>
	);
};

export default UrlEditor;
