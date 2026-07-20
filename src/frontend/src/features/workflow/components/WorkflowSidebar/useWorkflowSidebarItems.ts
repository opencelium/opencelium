import { useGetConnectorsQuery } from '@entities/connector/api/connectorApi';
import { resolveConnectorIconUrl } from '@entities/connector/model/iconUrl';
import type { InvokerOperation } from '@entities/invoker/model/types';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { useMemo } from 'react';
import { getConnectorStatus } from '../../connector-status/getConnectorStatus';
import { operatorItems, sidebarItems } from '../sidebar/sidebar.data';
import { matchesSidebarTitle, normalizeSidebarQuery } from '../sidebar/sidebar.helpers';
import type { SecondarySidebarMode } from '../sidebar/sidebarSecondary';

export const getMethodKey = (operation: InvokerOperation, index: number) => `${index}:${operation.name}`;

export const normalizeConnectorIcon = (icon?: string | File | null) =>
	typeof icon === 'string' ? icon : null;

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
	const { data: connectors = [], isFetching: connectorsFetching, isError: connectorsError } =
		useGetConnectorsQuery(
			{ page: 0, limit: 1000 },
			{ skip: params.activeSecondaryPanel !== 'connector' && !hasMainSearch },
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
		() => connectors.map((connector) => {
			const status = getConnectorStatus(connector.lastTestPassed);
			return {
				key: String(connector.connectorId),
				title: connector.title,
				text: connector.description || t('sidebar.connectorMethodsFallback', { invoker: connector.invoker?.name ?? connector.title }),
				imageUrl: resolveConnectorIconUrl(normalizeConnectorIcon(connector.icon)),
				status,
				statusError: status === 'failed' ? connector.lastTestError : undefined,
			};
		}),
		[connectors, t],
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
			imageUrl: resolveConnectorIconUrl(normalizeConnectorIcon(connector.icon)),
			connectorId: connector.connectorId,
			connectorIcon: normalizeConnectorIcon(connector.icon),
			operation,
		}))),
		[connectors],
	);
	const matches = (title: string, query: string, enabled: boolean) => matchesSidebarTitle(title, query, enabled);

	return {
		connectorsError,
		connectorsFetching,
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
