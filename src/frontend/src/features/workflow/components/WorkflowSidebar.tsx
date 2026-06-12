import { useMemo, useState } from 'react';
import { useGetConnectorsQuery } from '@entities/connector/api/connectorApi';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { InvokerOperation } from '@entities/invoker/model/types';
import type { WorkflowAction, WorkflowCreateKind, WorkflowNodeModel } from '../types/workflow.types';
import { SidebarDrawer } from './sidebar/SidebarDrawer';
import { SidebarList } from './sidebar/SidebarList';
import { SidebarSearch } from './sidebar/SidebarSearch';
import {
  operatorItems,
  sidebarItems,
} from './sidebar/sidebar.data';
import {
  matchesSidebarTitle,
  normalizeSidebarQuery,
} from './sidebar/sidebar.helpers';
import { getMethodSidebarCopy, getSecondarySidebarCopy, type SecondarySidebarMode } from './sidebar/sidebarSecondary';

const getConnectorKey = (connectorId: number) => String(connectorId);
const getMethodKey = (operation: InvokerOperation, index: number) => `${index}:${operation.name}`;

const normalizeConnectorIcon = (icon?: string | File | null) =>
  typeof icon === 'string' ? icon : null;

const resolveConnectorIconUrl = (icon?: string | null) => {
  if (!icon?.trim()) return null;
  if (/^(blob:|data:|https?:\/\/)/i.test(icon)) return icon;

  const normalizedIcon = icon.replace(/^\.\//, '');
  if (normalizedIcon.startsWith('storage/')) {
    const baseUrl = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').replace(/\/$/, '');
    return `${baseUrl}/${normalizedIcon}`;
  }

  return icon;
};

type Props = {
  action: WorkflowAction | null;
  selectedNode: WorkflowNodeModel | null;
  onClose: () => void;
  onSelect: (
    kind: WorkflowCreateKind,
    methodName?: string,
    connector?: { connectorId: number; title: string; icon?: string | null },
    methodOperation?: InvokerOperation,
  ) => void;
};

export function WorkflowSidebar({ action, selectedNode, onClose, onSelect }: Props) {
  const { t } = useI18n('workflow');
  const [activeSecondaryPanel, setActiveSecondaryPanel] = useState<SecondarySidebarMode | null>(null);
  const [selectedConnectorKey, setSelectedConnectorKey] = useState<string | null>(null);
  const [mainSearch, setMainSearch] = useState('');
  const [secondarySearch, setSecondarySearch] = useState('');
  const [methodSearch, setMethodSearch] = useState('');
  const {
    data: connectors = [],
    isFetching: connectorsFetching,
    isError: connectorsError,
  } = useGetConnectorsQuery(
    { page: 0, limit: 1000 },
    { skip: activeSecondaryPanel !== 'connector' },
  );

  const mainQuery = normalizeSidebarQuery(mainSearch);
  const secondaryQuery = normalizeSidebarQuery(secondarySearch);
  const methodQuery = normalizeSidebarQuery(methodSearch);
  const hasMainSearch = mainSearch.trim().length > 0;
  const hasSecondarySearch = secondarySearch.trim().length > 0;
  const hasMethodSearch = methodSearch.trim().length > 0;

  const translatedSidebarItems = sidebarItems.map((item) => ({
    key: item.key,
    title: t(item.titleKey),
    text: t(item.textKey),
  }));
  const filteredSidebarItems = translatedSidebarItems.filter((item) => matchesSidebarTitle(item.title, mainQuery, hasMainSearch));
  const selectedConnector = connectors.find((item) => getConnectorKey(item.connectorId) === selectedConnectorKey);
  const connectorItems = useMemo(
    () => connectors.map((connector) => ({
      key: getConnectorKey(connector.connectorId),
      title: connector.title,
      text: connector.description || t('sidebar.connectorMethodsFallback', { invoker: connector.invoker?.name ?? connector.title }),
      imageUrl: resolveConnectorIconUrl(normalizeConnectorIcon(connector.icon)),
    })),
    [connectors, t],
  );
  const methodOperations = useMemo(
    () => selectedConnector?.invoker?.operations ?? [],
    [selectedConnector],
  );
  const methodItems = useMemo(
    () => methodOperations.map((operation, index) => ({
      key: getMethodKey(operation, index),
      title: operation.name,
      text: t('sidebar.methodItemText'),
    })),
    [methodOperations, t],
  );
  const translatedOperatorItems = operatorItems.map((item) => ({
    key: item.key,
    title: t(item.titleKey),
    text: t(item.textKey),
  }));
  const filteredConnectorItems = connectorItems.filter((item) => matchesSidebarTitle(item.title, secondaryQuery, hasSecondarySearch));
  const filteredMethodItems = methodItems.filter((item) => matchesSidebarTitle(item.title, methodQuery, hasMethodSearch));
  const filteredOperatorItems = translatedOperatorItems.filter((item) => matchesSidebarTitle(item.title, secondaryQuery, hasSecondarySearch));

  const resetSidebar = () => {
    setActiveSecondaryPanel(null);
    setSelectedConnectorKey(null);
    setMainSearch('');
    setSecondarySearch('');
    setMethodSearch('');
  };

  const closeSidebar = () => {
    resetSidebar();
    onClose();
  };

  const onSelectMain = (key: string) => {
    setSecondarySearch('');
    setMethodSearch('');
    if (key === 'operator') {
      setSelectedConnectorKey(null);
      return setActiveSecondaryPanel('operator');
    }
    if (key === 'system') {
      resetSidebar();
      return onSelect('system');
    }
    setSelectedConnectorKey(null);
    setActiveSecondaryPanel('connector');
  };

  const [secondaryTitle, secondarySubtitle, secondaryPlaceholder] = getSecondarySidebarCopy(activeSecondaryPanel ?? 'connector', t);
  const [methodTitle, methodSubtitle, methodPlaceholder] = getMethodSidebarCopy(t, selectedConnector?.title);
  const methodOpen = activeSecondaryPanel === 'connector' && !!selectedConnectorKey;
  const selectedConnectorIconUrl = resolveConnectorIconUrl(normalizeConnectorIcon(selectedConnector?.icon));

  return (
    <>
      <div className={`drawerOverlay ${action ? 'drawerOverlayOpen' : ''}`} onClick={closeSidebar} />
      <SidebarDrawer
        open={!!action}
        title={t('sidebar.chooseNextStep')}
        subtitle={t('sidebar.from', { name: selectedNode?.data.title || selectedNode?.id || '' })}
        onClose={closeSidebar}
        shifted={!!activeSecondaryPanel}
        shiftedFar={methodOpen}
        secondary
      >
        <SidebarSearch placeholder={t('sidebar.searchPlaceholder')} value={mainSearch} onChange={setMainSearch} testId="workflow-sidebar-search-main" />
        <SidebarList items={filteredSidebarItems} onSelect={onSelectMain} testIdPrefix="workflow-sidebar-main" />
        <button className="sidebarItem sidebarItemMuted sidebarItemStandalone" type="button">
          <strong>{t('sidebar.triggerConnection.title')}</strong>
          <span>{t('sidebar.triggerConnection.description')}</span>
        </button>
      </SidebarDrawer>

      <SidebarDrawer
        open={!!activeSecondaryPanel}
        title={secondaryTitle}
        subtitle={secondarySubtitle}
        onClose={() => {
          setActiveSecondaryPanel(null);
          setSelectedConnectorKey(null);
          setSecondarySearch('');
          setMethodSearch('');
        }}
        secondary
        shifted={methodOpen}
      >
        <SidebarSearch placeholder={secondaryPlaceholder} value={secondarySearch} onChange={setSecondarySearch} testId="workflow-sidebar-search-secondary" />
        {activeSecondaryPanel === 'connector' ? (
          connectorsFetching ? (
            <button className="sidebarItem sidebarItemMuted" type="button" disabled>
              <strong>{t('sidebar.connectorsLoading.title')}</strong>
              <span>{t('sidebar.connectorsLoading.description')}</span>
            </button>
          ) : connectorsError ? (
            <button className="sidebarItem sidebarItemMuted" type="button" disabled>
              <strong>{t('sidebar.connectorsError.title')}</strong>
              <span>{t('sidebar.connectorsError.description')}</span>
            </button>
          ) : filteredConnectorItems.length ? (
            <SidebarList
              items={filteredConnectorItems}
              testIdPrefix="workflow-sidebar-connector"
              onSelect={(connectorKey) => {
                setSelectedConnectorKey(connectorKey);
                setMethodSearch('');
              }}
            />
          ) : (
            <button className="sidebarItem sidebarItemMuted" type="button" disabled>
              <strong>{t('sidebar.connectorsEmpty.title')}</strong>
              <span>{t('sidebar.connectorsEmpty.description')}</span>
            </button>
          )
        ) : (
          <SidebarList
            items={filteredOperatorItems}
            testIdPrefix="workflow-sidebar-operator"
            onSelect={(key) => {
              onSelect(key as WorkflowCreateKind);
              resetSidebar();
            }}
          />
        )}
      </SidebarDrawer>

      <SidebarDrawer
        open={methodOpen}
        title={methodTitle}
        subtitle={methodSubtitle}
        iconUrl={selectedConnectorIconUrl}
        onClose={() => {
          setSelectedConnectorKey(null);
          setMethodSearch('');
        }}
        tertiary
      >
        <SidebarSearch placeholder={methodPlaceholder} value={methodSearch} onChange={setMethodSearch} testId="workflow-sidebar-search-method" />
        {filteredMethodItems.length ? (
          <SidebarList
            items={filteredMethodItems}
            testIdPrefix="workflow-sidebar-method"
            onSelect={(methodKey) => {
              const methodOperation = methodOperations.find((operation, index) => getMethodKey(operation, index) === methodKey);
              const methodName = methodOperation?.name;
              onSelect(
                'connector',
                methodName,
                selectedConnector
                  ? {
                      connectorId: selectedConnector.connectorId,
                      title: selectedConnector.title,
                      icon: normalizeConnectorIcon(selectedConnector.icon),
                    }
                  : undefined,
                methodOperation,
              );
              resetSidebar();
            }}
          />
        ) : (
          <button className="sidebarItem sidebarItemMuted" type="button" disabled>
            <strong>{t('sidebar.methodsEmpty.title')}</strong>
            <span>{t('sidebar.methodsEmpty.description')}</span>
          </button>
        )}
      </SidebarDrawer>
    </>
  );
}
