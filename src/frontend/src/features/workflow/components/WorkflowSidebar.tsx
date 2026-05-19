import { useMemo, useState } from 'react';
import { useGetConnectorsQuery } from '@entities/connector/api/connectorApi';
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
  mapNamesToSidebarItems,
  matchesSidebarTitle,
  normalizeSidebarQuery,
} from './sidebar/sidebar.helpers';
import { getMethodSidebarCopy, getSecondarySidebarCopy, type SecondarySidebarMode } from './sidebar/sidebarSecondary';

const getConnectorKey = (connectorId: number) => String(connectorId);

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

  const filteredSidebarItems = sidebarItems.filter((item) => matchesSidebarTitle(item.title, mainQuery, hasMainSearch));
  const selectedConnector = connectors.find((item) => getConnectorKey(item.connectorId) === selectedConnectorKey);
  const connectorItems = useMemo(
    () => connectors.map((connector) => ({
      key: getConnectorKey(connector.connectorId),
      title: connector.title,
      text: connector.description || `Methods from ${connector.invoker?.name ?? connector.title} invoker.`,
      imageUrl: resolveConnectorIconUrl(connector.icon),
    })),
    [connectors],
  );
  const methodNames = useMemo(
    () => (selectedConnector?.invoker?.operations ?? [])
      .filter((operation) => operation.type !== 'test')
      .map((operation) => operation.name),
    [selectedConnector],
  );
  const methodOperations = useMemo(
    () => (selectedConnector?.invoker?.operations ?? [])
      .filter((operation) => operation.type !== 'test'),
    [selectedConnector],
  );
  const filteredConnectorItems = connectorItems.filter((item) => matchesSidebarTitle(item.title, secondaryQuery, hasSecondarySearch));
  const filteredMethodItems = mapNamesToSidebarItems(methodNames, 'Invoker method')
    .filter((item) => matchesSidebarTitle(item.title, methodQuery, hasMethodSearch));
  const filteredOperatorItems = operatorItems.filter((item) => matchesSidebarTitle(item.title, secondaryQuery, hasSecondarySearch));

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

  const [secondaryTitle, secondarySubtitle, secondaryPlaceholder] = getSecondarySidebarCopy(activeSecondaryPanel ?? 'connector');
  const [methodTitle, methodSubtitle, methodPlaceholder] = getMethodSidebarCopy(selectedConnector?.title);
  const methodOpen = activeSecondaryPanel === 'connector' && !!selectedConnectorKey;

  return (
    <>
      <div className={`drawerOverlay ${action ? 'drawerOverlayOpen' : ''}`} onClick={closeSidebar} />
      <SidebarDrawer
        open={!!action}
        title="Choose your next step"
        subtitle={`From: ${selectedNode?.data.title || selectedNode?.id || ''}`}
        onClose={closeSidebar}
        shifted={!!activeSecondaryPanel}
        shiftedFar={methodOpen}
        secondary
      >
        <SidebarSearch placeholder="search" value={mainSearch} onChange={setMainSearch} />
        <SidebarList items={filteredSidebarItems} onSelect={onSelectMain} />
        <button className="sidebarItem sidebarItemMuted sidebarItemStandalone" type="button">
          <strong>Trigger Connection</strong>
          <span>Runs another connection if this step is successfully finished.</span>
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
        <SidebarSearch placeholder={secondaryPlaceholder} value={secondarySearch} onChange={setSecondarySearch} />
        {activeSecondaryPanel === 'connector' ? (
          connectorsFetching ? (
            <button className="sidebarItem sidebarItemMuted" type="button" disabled>
              <strong>Loading connectors...</strong>
              <span>Please wait while connectors are loaded.</span>
            </button>
          ) : connectorsError ? (
            <button className="sidebarItem sidebarItemMuted" type="button" disabled>
              <strong>Failed to load connectors</strong>
              <span>Check the backend connection and try again.</span>
            </button>
          ) : filteredConnectorItems.length ? (
            <SidebarList
              items={filteredConnectorItems}
              onSelect={(connectorKey) => {
                setSelectedConnectorKey(connectorKey);
                setMethodSearch('');
              }}
            />
          ) : (
            <button className="sidebarItem sidebarItemMuted" type="button" disabled>
              <strong>No connectors found</strong>
              <span>There are no connectors matching this search.</span>
            </button>
          )
        ) : (
          <SidebarList
            items={filteredOperatorItems}
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
        onClose={() => {
          setSelectedConnectorKey(null);
          setMethodSearch('');
        }}
        tertiary
      >
        <SidebarSearch placeholder={methodPlaceholder} value={methodSearch} onChange={setMethodSearch} />
        {filteredMethodItems.length ? (
          <SidebarList
            items={filteredMethodItems}
            onSelect={(methodName) => {
              const methodOperation = methodOperations.find((operation) => operation.name === methodName);
              onSelect(
                'connector',
                methodName,
                selectedConnector
                  ? {
                      connectorId: selectedConnector.connectorId,
                      title: selectedConnector.title,
                      icon: selectedConnector.icon,
                    }
                  : undefined,
                methodOperation,
              );
              resetSidebar();
            }}
          />
        ) : (
          <button className="sidebarItem sidebarItemMuted" type="button" disabled>
            <strong>No methods found</strong>
            <span>There are no methods matching this search.</span>
          </button>
        )}
      </SidebarDrawer>
    </>
  );
}
