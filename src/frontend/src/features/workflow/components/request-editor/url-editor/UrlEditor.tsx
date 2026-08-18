import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LinkOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useMethodContext } from '../../../providers/MethodContext';
import type { RootState } from '../../../store';
import type {
	Connection,
	EndpointArg,
	QueryParam,
} from '../../../types/connection';
import {
	updateEndpoint,
	updateQueryParams,
	updateRequestMethod,
	upsertEndpointArg,
} from '../../../store/connection/connectionSlice';
import { Select } from '@shared/ui/primitives/Select';
import './urlMethodSelect.css';

import { UrlEndpointField } from './UrlEndpointField';
import { UrlQueryParamsTable } from './UrlQueryParamsTable';
import { LegacyBodyReferenceGenerator } from '../body-editor/LegacyBodyReferenceGenerator/LegacyBodyReferenceGenerator';

import {
	buildQueryFromParams,
	buildQueryParamsFromEndpoint,
	createId,
	decodeEndpointQuery,
	decodeQueryParamValue,
	ensureTemplateRow,
	getInlineVisualLength,
	normalizeReference,
	splitEndpoint,
	stripMockActiveFromEndpoint,
	stripMockActiveRows,
	stripTemplateRows,
} from './urlEditor.utils';
import {
	setFocusByCaretPositionInDivEditable,
} from './utils/contentEditable';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const methodOptions = HTTP_METHODS.map((value) => ({ value, label: value }));

const TOKEN_ID_RE = /#{%\s*([A-Za-z0-9_-]+)\s*%}/g;
const extractTokenIds = (s: string) =>
	Array.from((s || '').matchAll(TOKEN_ID_RE), (m) => m[1]);

const decodeStoredQueryParams = (params: QueryParam[]) =>
	params.map((param) => ({
		...param,
		key: decodeQueryParamValue(param.key || ''),
		value: decodeQueryParamValue(param.value || ''),
		autoEncode: param.autoEncode ?? true,
	}));

type QueryCaretTarget = {
	rowId: string;
	field: 'key' | 'value';
	caret: number;
};

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
	const queryCaretTargetRef = useRef<QueryCaretTarget | null>(null);

	const initialEndpoint = stripMockActiveFromEndpoint(
		method.request.endpoint || '',
	);
	const initialDisplayEndpoint = decodeEndpointQuery(initialEndpoint);
	const [endpointRaw, setEndpointRaw] = useState(initialDisplayEndpoint);
	const rawRef = useRef(initialDisplayEndpoint);

	const [endpointArgsState, setEndpointArgsState] = useState<
		Record<string, EndpointArg>
	>({
		...(method.request.endpointArgs || {}),
	});
	const endpointArgsRef = useRef<Record<string, EndpointArg>>({
		...(method.request.endpointArgs || {}),
	});
	const [queryParams, setQueryParams] = useState<QueryParam[]>(() => {
		const stored = decodeStoredQueryParams(stripMockActiveRows(
			(method.request.queryParams || []).map((param) => ({ ...param })),
		) as QueryParam[]);
		return stored.length
			? ensureTemplateRow(stored)
			: (buildQueryParamsFromEndpoint(initialDisplayEndpoint) as QueryParam[]);
	});
	const queryParamsRef = useRef<QueryParam[]>(queryParams);

	const [
		isEndpointReferenceGeneratorOpen,
		setIsEndpointReferenceGeneratorOpen,
	] = useState(false);

	const lastDispatchedEndpointRef = useRef<string | null>(null);

	useEffect(() => {
		rawRef.current = endpointRaw;
	}, [endpointRaw]);

	useEffect(() => {
		queryParamsRef.current = queryParams;
	}, [queryParams]);

	const dispatchSaveAll = useCallback(
		(
			nextEndpoint: string,
			nextQueryParams: QueryParam[],
			nextEndpointArgs: Record<string, EndpointArg>,
		) => {
			if (readOnly) return;
			const { base } = splitEndpoint(nextEndpoint);
			const query = buildQueryFromParams(nextQueryParams, true);
			const endpointForServer = query ? `${base}?${query}` : base;

			dispatch(
				updateEndpoint({
					methodId: method.id,
					endpoint: endpointForServer,
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

	const commitParamsToEndpoint = useCallback(
		(nextParams: QueryParam[]) => {
			const current = rawRef.current || endpointRaw || '';
			const { base } = splitEndpoint(current);
			const query = buildQueryFromParams(nextParams, true);
			const finalEndpoint = query ? `${base}?${query}` : base;

			rawRef.current = finalEndpoint;
			setEndpointRaw(finalEndpoint);
			lastDispatchedEndpointRef.current = finalEndpoint;
			dispatchSaveAll(finalEndpoint, nextParams, endpointArgsRef.current);
		},
		[dispatchSaveAll, endpointRaw],
	);

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
		const incomingDisplayEndpoint = decodeEndpointQuery(incomingEndpoint);

		const nextArgs = { ...(method.request.endpointArgs || {}) } as any;
		endpointArgsRef.current = nextArgs;
		setEndpointArgsState(nextArgs);

		setEndpointRaw(incomingDisplayEndpoint);
		rawRef.current = incomingDisplayEndpoint;
		const stored = decodeStoredQueryParams(stripMockActiveRows(
			(method.request.queryParams || []).map((param) => ({ ...param })),
		) as QueryParam[]);
		setQueryParams(
			stored.length
				? ensureTemplateRow(stored)
				: (buildQueryParamsFromEndpoint(incomingDisplayEndpoint) as QueryParam[]),
		);

		lastKnownCaretPosRef.current = getInlineVisualLength(
			incomingDisplayEndpoint,
			nextArgs,
		);
		lastKnownRawCaretPosRef.current = incomingDisplayEndpoint.length;
		selectedEndpointTokenIndexRef.current = null;
		setIsEndpointReferenceGeneratorOpen(false);
		lastDispatchedEndpointRef.current = null;
	}, [method.id]);

	useEffect(() => {
		const incoming = decodeEndpointQuery(stripMockActiveFromEndpoint(method.request.endpoint || ''));
		if (incoming === endpointRaw) return;

		if (
			lastDispatchedEndpointRef.current &&
			incoming === decodeEndpointQuery(lastDispatchedEndpointRef.current)
		) {
			setEndpointRaw(incoming);
			rawRef.current = incoming;
			return;
		}

		setEndpointRaw(incoming);
		rawRef.current = incoming;
		setQueryParams(
			(prev) => buildQueryParamsFromEndpoint(incoming, prev) as QueryParam[],
		);
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
				queryParamsRef.current,
				endpointArgsRef.current,
			);
		};
	}, [dispatchSaveAll, readOnly]);

	const applyReferenceToEndpoint = useCallback(
		(reference: string) => {
			const queryTarget = queryCaretTargetRef.current;
			if (queryTarget) {
				const row = queryParams.find((param) => param.id === queryTarget.rowId);
				if (row) {
					const storedValue = String(row[queryTarget.field] ?? '');
					const decodedValue =
						queryTarget.field === 'value'
							? decodeQueryParamValue(storedValue)
							: storedValue;
					const currentValue =
						queryTarget.field === 'value' &&
						extractTokenIds(storedValue).length === 0 &&
						extractTokenIds(decodedValue).length > 0
							? decodedValue
							: storedValue;
					const { token } = createArgTokenForInlineEditors(
						reference,
						extractTokenIds(currentValue),
					);
					const insertAt = Math.max(
						0,
						Math.min(queryTarget.caret, currentValue.length),
					);
					const nextValue = `${currentValue.slice(0, insertAt)}${token}${currentValue.slice(
						insertAt,
					)}`;
					const nextParams = ensureTemplateRow(
						queryParams.map((param) =>
							param.id === queryTarget.rowId
								? { ...param, [queryTarget.field]: nextValue, enabled: true }
								: param,
						),
					);
					const current = rawRef.current || endpointRaw || '';
					const { base } = splitEndpoint(current);
					const query = buildQueryFromParams(nextParams, true);
					const nextRaw = query ? `${base}?${query}` : base;

					queryCaretTargetRef.current = {
						...queryTarget,
						caret: insertAt + token.length,
					};
					rawRef.current = nextRaw;
					setEndpointRaw(nextRaw);
					setQueryParams(nextParams);
					lastDispatchedEndpointRef.current = nextRaw;
					dispatchSaveAll(nextRaw, nextParams, endpointArgsRef.current);
					setIsEndpointReferenceGeneratorOpen(false);
					return;
				}
			}

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
			const nextQueryParams = buildQueryParamsFromEndpoint(
				nextRaw,
				queryParams,
			) as QueryParam[];
			setQueryParams(nextQueryParams);
			lastDispatchedEndpointRef.current = nextRaw;
			dispatchSaveAll(nextRaw, nextQueryParams, endpointArgsRef.current);
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
		[createArgTokenForInlineEditors, dispatchSaveAll, endpointRaw, queryParams],
	);

	const onChangeParam = useCallback(
		(id: string, patch: Partial<QueryParam>) => {
			let next = queryParams.map((param) =>
				param.id === id ? { ...param, ...patch } : param,
			);

			const index = next.findIndex((param) => param.id === id);
			if (index >= 0) {
				const row = next[index];
				const becameNonEmpty =
					(row.key || '').trim() !== '' || (row.value || '').trim() !== '';
				const prevRow = queryParams[index];
				const prevWasTemplate =
					prevRow &&
					!prevRow.enabled &&
					(prevRow.key || '').trim() === '' &&
					(prevRow.value || '').trim() === '';

				if (prevWasTemplate && becameNonEmpty) {
					next[index] = { ...row, enabled: true };
				}
			}

			next = ensureTemplateRow(next);
			setQueryParams(next);
			commitParamsToEndpoint(next);
		},
		[commitParamsToEndpoint, queryParams],
	);

	const onToggleEnabled = useCallback(
		(id: string, enabled: boolean) => onChangeParam(id, { enabled }),
		[onChangeParam],
	);

	const removeParamRow = useCallback(
		(id: string) => {
			const next = ensureTemplateRow(
				queryParams.filter((param) => param.id !== id),
			);
			setQueryParams(next);
			commitParamsToEndpoint(next);
		},
		[commitParamsToEndpoint, queryParams],
	);

	const isSimpleHttpRequest = method.connector == null;
	const selectedMethod = (method.request.method || 'GET').toUpperCase();
	const handleMethodChange = useCallback(
		(value: string) => {
			if (readOnly) return;
			dispatch(updateRequestMethod({ methodId: method.id, method: value } as any));
		},
		[dispatch, method.id, readOnly],
	);

	if (!connection) return null;

	return (
		<div
			data-testid="workflow-url-editor"
			style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}
		>
			<UrlEndpointField
				readOnly={readOnly}
				value={endpointRaw}
				beforeNode={
					isSimpleHttpRequest ? (
						<div className="wfUrlMethodSelect" data-testid="workflow-url-method">
							<Select
								value={selectedMethod}
								onChange={handleMethodChange}
								options={methodOptions}
								sortOptions={false}
								readOnly={readOnly}
								testId="workflow-url-method-select"
							/>
						</div>
					) : (
						<div className="wfUrlMethodReadonly" data-testid="workflow-url-method-readonly">
							{selectedMethod}
						</div>
					)
				}
				endpointArgs={endpointArgsState}
				endpointArgsRef={endpointArgsRef}
				connection={connection}
				currentMethod={method}
				divRef={endpointDivRef}
				lastCaretRef={lastKnownCaretPosRef}
				lastRawCaretRef={lastKnownRawCaretPosRef}
				selectedTokenIndexRef={selectedEndpointTokenIndexRef}
				onRawCaretChange={(rawCaret, visualCaret) => {
					queryCaretTargetRef.current = null;
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
					setQueryParams(
						(prev) => buildQueryParamsFromEndpoint(nextRaw, prev) as QueryParam[],
					);
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
							data-testid="workflow-url-insert-reference"
						>
							Insert Reference
						</Button>
					) : null
				}
			/>

			{!readOnly && isEndpointReferenceGeneratorOpen ? (
				<LegacyBodyReferenceGenerator
					connection={connection}
					currentMethod={method}
					showWebhookOption={false}
					onApply={(reference: string) => applyReferenceToEndpoint(reference)}
				/>
			) : null}

			<UrlQueryParamsTable
				readOnly={readOnly}
				rows={queryParams}
				endpointArgs={endpointArgsState}
				connection={connection}
				currentMethod={method}
				onToggleEnabled={onToggleEnabled}
				onChangeParam={onChangeParam}
				onRemoveParamRow={removeParamRow}
				onCaretChange={(target) => {
					queryCaretTargetRef.current = target;
				}}
			/>
		</div>
	);
};

export default UrlEditor;
