import { useGetConnectorsMetaQuery, useGetConnectorsQuery } from '@entities/connector/api/connectorApi';
import { resolveConnectorIcon } from '@entities/connector/model/iconUrl';
import { useGetInvokersQuery } from '@entities/invoker/api/invokerApi';
import type { InvokerOperation } from '@entities/invoker/model/types';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useMemo } from 'react';
import { operatorItems, sidebarItems } from '../sidebar/sidebar.data';
import { matchesSidebarTitle, normalizeSidebarQuery } from '../sidebar/sidebar.helpers';
import type { SecondarySidebarMode } from '../sidebar/sidebarSecondary';

export const getMethodKey = (operation: InvokerOperation, index: number) => `${index}:${operation.name}`;

type Params = {
	activeSecondaryPanel: SecondarySidebarMode | null;
	selectedConnectorKey: string | null;
	mainSearch: string;
	secondarySearch: string;
	methodSearch: string;
};

export function useWorkflowSidebarItems(params: Params) {
	const { t } = useI18n('workflow');
	const hasMainSearch = params.mainSearch.trim().length > 0;
	const skipConnectorFetch = params.activeSecondaryPanel !== 'connector' && !hasMainSearch;
	// Full connector data (needed for invoker.operations — selectedConnector/methodItems
	// and the cross-connector method search) still comes from /connector/all.
	const { data: connectors = [], isFetching: connectorsFetching, isError: connectorsError } =
		useGetConnectorsQuery(
			{ page: 0, limit: 1000 },
			{ skip: skipConnectorFetch },
		);
	// The connector-browsing list itself only needs title/icon/status, so it's served by
	// the cheaper /connector/meta/all snapshot (no credential decryption server-side).
	const { data: connectorsMeta = [], isFetching: connectorsMetaFetching, isError: connectorsMetaError } =
		useGetConnectorsMetaQuery(undefined, { skip: skipConnectorFetch });
	// ConnectorMetaDTO names its invoker but doesn't carry its icon, so the inherited
	// icon has to come from the invoker list (already cached — the workflow page loads it).
	const { data: invokers = [] } = useGetInvokersQuery(undefined, { skip: skipConnectorFetch });
	const invokerIconsByName = useMemo(
		() => new Map(invokers.map((invoker) => [invoker.name.toLowerCase(), invoker.icon])),
		[invokers],
	);
	const mainQuery = normalizeSidebarQuery(params.mainSearch);
	const secondaryQuery = normalizeSidebarQuery(params.secondarySearch);
	const methodQuery = normalizeSidebarQuery(params.methodSearch);
	const hasSecondarySearch = params.secondarySearch.trim().length > 0;
	const hasMethodSearch = params.methodSearch.trim().length > 0;
	const translatedSidebarItems = sidebarItems.map((item) => ({
		key: item.key,
		title: t(item.titleKey),
		text: t(item.textKey),
		artwork: item.icon ? { kind: 'icon' as const, name: item.icon } : undefined,
	}));
	const translatedOperatorItems = operatorItems.map((item) => ({
		key: item.key,
		title: t(item.titleKey),
		text: t(item.textKey),
	}));
	const selectedConnector = connectors.find(
		(item) => String(item.connectorId) === params.selectedConnectorKey,
	);
	const connectorItems = useMemo(
		() => connectorsMeta.map((connector) => {
			const status = connector.status;
			const invokerName = connector.invoker?.name;
			return {
				key: String(connector.connectorId),
				title: connector.title,
				text: t('sidebar.connectorMethodsFallback', { invoker: invokerName ?? connector.title }),
				artwork: { kind: 'connector' as const, icon: resolveConnectorIcon(connector,
					invokerName ? invokerIconsByName.get(invokerName.toLowerCase()) : null) },
				status,
				statusError: status === 'AUTH_FAILED' || status === 'DOWN' ? connector.lastTestError : undefined,
				lastCheckedAt: connector.lastCheckedAt,
			};
		}),
		[connectorsMeta, invokerIconsByName, t],
	);
	const methodOperations = useMemo(() => selectedConnector?.invoker?.operations ?? [], [selectedConnector]);
	const methodItems = useMemo(
		() => methodOperations.map((operation, index) => ({
			key: getMethodKey(operation, index),
			title: operation.name,
			text: t('sidebar.methodItemText'),
		})),
		[methodOperations, t],
	);
	const allMethodItems = useMemo(
		() => connectors.flatMap((connector) => (connector.invoker?.operations ?? []).map((operation, index) => ({
			key: `${connector.connectorId}:${index}:${operation.name}`,
			title: operation.name,
			text: connector.title,
			artwork: { kind: 'connector' as const, icon: resolveConnectorIcon(connector) },
			connectorId: connector.connectorId,
			connectorIcon: resolveConnectorIcon(connector),
			operation,
		}))),
		[connectors],
	);
	const matches = (title: string, query: string, enabled: boolean) => matchesSidebarTitle(title, query, enabled);

	return {
		// Combined: the main-search view mixes connector items (meta fetch) with method
		// items (full fetch), and the connector-browse panel needs the meta fetch alone —
		// either one still in flight/errored should surface as such to both consumers.
		connectorsError: connectorsError || connectorsMetaError,
		connectorsFetching: connectorsFetching || connectorsMetaFetching,
		filteredConnectorItems: connectorItems.filter((item) => matches(item.title, secondaryQuery, hasSecondarySearch)),
		filteredMethodItems: methodItems.filter((item) => matches(item.title, methodQuery, hasMethodSearch)),
		filteredOperatorItems: translatedOperatorItems.filter((item) => matches(item.title, secondaryQuery, hasSecondarySearch)),
		filteredSidebarItems: translatedSidebarItems.filter((item) => matches(item.title, mainQuery, hasMainSearch)),
		hasMainSearch,
		mainSearchConnectorItems: connectorItems.filter((item) => matches(item.title, mainQuery, hasMainSearch)),
		mainSearchMethodItems: allMethodItems.filter((item) => matches(item.title, mainQuery, hasMainSearch)),
		mainSearchOperatorItems: translatedOperatorItems.filter((item) => matches(item.title, mainQuery, hasMainSearch)),
		methodOperations,
		selectedConnector,
	};
}
