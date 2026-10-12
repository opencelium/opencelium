import { useCallback, useEffect, useMemo, useReducer, useRef, type Dispatch, type SetStateAction } from 'react';
import type { HistoryVersionItem } from '../types/history.types';
import { mapConnectionToWorkflowState, type WorkflowConnectionState } from '../api/connectionMapper';
import type { Connector } from '@entities/connector/model/types';
import { findDeletedConnectorGroups, repairDeletedConnectors } from '../api/deletedConnectorRepair';
import { loadWorkflowConnectionData } from '../api/connectionService';
import { EMPTY_DESCRIPTION_LABEL, EMPTY_NAME_LABEL, toDisplayDescription } from '../utils/workflowPage.utils';

type ConnectionState = {
	pendingRepair: Awaited<ReturnType<typeof loadWorkflowConnectionData>> | null;
	loadFailed: boolean;
	loadAttempt: number;
	isLoading: boolean;
	createdConnectionId: string | undefined;
	headerState: { title: string; description: string };
	persistedTitle: string;
	fieldBindings: WorkflowConnectionState['fieldBindings'] | undefined;
	historyVersions: HistoryVersionItem[];
	selectedHistoryVersionId: string | null;
	categoryId: number | null;
};
type Update = Partial<ConnectionState> | ((state: ConnectionState) => Partial<ConnectionState>);
const updateConnection = (state: ConnectionState, update: Update): ConnectionState =>
	({ ...state, ...(typeof update === 'function' ? update(state) : update) });

export const useWorkflowConnectionState = (connectionId?: string, connectors?: Connector[], connectorLoadFailed = false, connectorsRefreshing = false) => {
	const [state, dispatch] = useReducer(updateConnection, {
		pendingRepair: null, loadFailed: false, loadAttempt: 0, isLoading: Boolean(connectionId),
		createdConnectionId: undefined,
		headerState: { title: EMPTY_NAME_LABEL, description: EMPTY_DESCRIPTION_LABEL },
		persistedTitle: '', fieldBindings: undefined, historyVersions: [], selectedHistoryVersionId: null, categoryId: null,
	});
	const { pendingRepair, loadAttempt } = state;
	const repairAppliedRef = useRef<(() => void) | null>(null);
	const applyConnectionRef = useRef<((state: WorkflowConnectionState) => void) | null>(null);
	const setters = useMemo(() => {
		const setField = <K extends keyof ConnectionState>(key: K): Dispatch<SetStateAction<ConnectionState[K]>> =>
			(value) => dispatch((previous) => ({
				[key]: typeof value === 'function'
					? (value as (current: ConnectionState[K]) => ConnectionState[K])(previous[key]) : value,
			}) as Partial<ConnectionState>);
		return {
			setCreatedConnectionId: setField('createdConnectionId'), setHeaderState: setField('headerState'),
			setPersistedTitle: setField('persistedTitle'), setFieldBindings: setField('fieldBindings'),
			setHistoryVersions: setField('historyVersions'), setSelectedHistoryVersionId: setField('selectedHistoryVersionId'),
			setCategoryId: setField('categoryId'),
		};
	}, []);
	const retryLoad = () => dispatch((previous) => ({ loadAttempt: previous.loadAttempt + 1 }));
	const applyState = useCallback((loaded: WorkflowConnectionState) => {
		applyConnectionRef.current?.(loaded);
		dispatch((previous) => ({
			pendingRepair: null,
			headerState: { title: loaded.title, description: toDisplayDescription(loaded.description) },
			persistedTitle: loaded.title, fieldBindings: loaded.fieldBindings, categoryId: loaded.categoryId,
			historyVersions: loaded.versions,
			selectedHistoryVersionId: previous.selectedHistoryVersionId
				&& loaded.versions.some((version) => version.id === previous.selectedHistoryVersionId)
				? previous.selectedHistoryVersionId
				: loaded.versions.find((version) => version.current)?.id ?? loaded.versions[0]?.id ?? null,
		}));
	}, []);
	const mappingGroups = useMemo(() => pendingRepair && connectors && !connectorLoadFailed
		? findDeletedConnectorGroups(pendingRepair.payload, connectors) : [], [pendingRepair, connectors, connectorLoadFailed]);
	const confirmRepair = (mapping: Record<number, number>, created: Connector[] = []) => {
		const available = [...(connectors ?? []), ...created];
		if (!pendingRepair || !connectors || connectorLoadFailed || connectorsRefreshing || !mappingGroups.length) return;
		if (!mappingGroups.every((group) => available.some((connector) =>
			connector.connectorId === mapping[group.oldConnectorId]
			&& (!group.invokerName || connector.invoker?.name?.toLowerCase() === group.invokerName.toLowerCase())))) return;
		const payload = repairDeletedConnectors(pendingRepair.payload, mapping, available);
		applyState({ ...mapConnectionToWorkflowState(payload), versions: pendingRepair.versions });
		repairAppliedRef.current?.();
	};

	useEffect(() => {
		dispatch({ pendingRepair: null, loadFailed: false, createdConnectionId: undefined, categoryId: null, isLoading: Boolean(connectionId) });
		if (!connectionId) return;
		let cancelled = false;
		loadWorkflowConnectionData(connectionId).then((data) => {
			if (!cancelled) dispatch({ pendingRepair: data });
		}).catch(() => {
			if (!cancelled) dispatch({ loadFailed: true });
		}).finally(() => {
			if (!cancelled) dispatch({ isLoading: false });
		});
		return () => { cancelled = true; };
	}, [connectionId, loadAttempt]);

	useEffect(() => {
		if (!pendingRepair || !connectors || connectorLoadFailed || connectorsRefreshing || mappingGroups.length) return;
		applyState({ ...mapConnectionToWorkflowState(pendingRepair.payload), versions: pendingRepair.versions });
	}, [pendingRepair, connectors, connectorLoadFailed, connectorsRefreshing, mappingGroups, applyState]);

	const { createdConnectionId, headerState, persistedTitle, fieldBindings, historyVersions, selectedHistoryVersionId, categoryId } = state;
	return { createdConnectionId, headerState, persistedTitle, fieldBindings, historyVersions, selectedHistoryVersionId, categoryId,
		...setters, loadFailed: state.loadFailed || connectorLoadFailed, retryLoad, mappingGroups,
		confirmRepair, repairAppliedRef, applyConnectionRef, isLoading: state.isLoading || !!pendingRepair };
};
