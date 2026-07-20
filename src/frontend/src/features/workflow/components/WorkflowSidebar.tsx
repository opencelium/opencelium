import { useEffect, useMemo, useState } from 'react';
import { useGetConnectorsQuery } from '@entities/connector/api/connectorApi';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { InvokerOperation } from '@entities/invoker/model/types';
import type { WorkflowAction, WorkflowCreateKind, WorkflowNodeModel, WorkflowTriggerConnectionRef } from '../types/workflow.types';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { SidebarDrawer } from './sidebar/SidebarDrawer/SidebarDrawer';
import { SidebarList } from './sidebar/SidebarList/SidebarList';
import { SidebarSearch } from './sidebar/SidebarSearch/SidebarSearch';
import { TriggerConnectionPanel } from './sidebar/TriggerConnectionPanel';
import { TriggerConnectionScheduleDialog } from './sidebar/TriggerConnectionScheduleDialog';
import { useTriggerConnectionStep } from './sidebar/useTriggerConnectionStep';
import {
  operatorItems,
  sidebarItems,
} from './sidebar/sidebar.data';
import {
  matchesSidebarTitle,
  normalizeSidebarQuery,
} from './sidebar/sidebar.helpers';
import { getMethodSidebarCopy, getSecondarySidebarCopy, type SecondarySidebarMode } from './sidebar/sidebarSecondary';
import { resolveConnectorIconUrl } from '@entities/connector/model/iconUrl';
import { getConnectorStatus } from '../connector-status/getConnectorStatus';

const getConnectorKey = (connectorId: number) => String(connectorId);
const getMethodKey = (operation: InvokerOperation, index: number) => `${index}:${operation.name}`;

const normalizeConnectorIcon = (icon?: string | File | null) =>
  typeof icon === 'string' ? icon : null;

type Props = {
  action: WorkflowAction | null;
  selectedNode: WorkflowNodeModel | null;
  connectionId?: string;
  onClose: () => void;
  onSelect: (
    kind: WorkflowCreateKind,
    methodName?: string,
    connector?: { connectorId: number; title: string; icon?: string | null },
    methodOperation?: InvokerOperation,
    triggerConnection?: WorkflowTriggerConnectionRef,
  ) => void;
};

export function WorkflowSidebar({ action, selectedNode, connectionId, onClose, onSelect }: Props) {
  const { t } = useI18n('workflow');
  const [activeSecondaryPanel, setActiveSecondaryPanel] = useState<SecondarySidebarMode | null>(null);
  const [selectedConnectorKey, setSelectedConnectorKey] = useState<string | null>(null);
  const [mainSearch, setMainSearch] = useState('');
  const [secondarySearch, setSecondarySearch] = useState('');
  const [methodSearch, setMethodSearch] = useState('');
  useEffect(() => {
    if (action) return;
    setActiveSecondaryPanel(null);
    setSelectedConnectorKey(null);
    setMainSearch('');
    setSecondarySearch('');
    setMethodSearch('');
  }, [action]);

  const hasMainSearch = mainSearch.trim().length > 0;
  const {
    data: connectors = [],
    isFetching: connectorsFetching,
    isError: connectorsError,
  } = useGetConnectorsQuery(
    { page: 0, limit: 1000 },
    { skip: activeSecondaryPanel !== 'connector' && !hasMainSearch },
  );

  const triggerConnectionStep = useTriggerConnectionStep({
    active: activeSecondaryPanel === 'trigger-connection',
    excludeConnectionId: connectionId ? Number(connectionId) : undefined,
    onFinalize: (triggerConnection) => {
      onSelect('trigger-connection', undefined, undefined, undefined, triggerConnection);
      resetSidebar();
    },
  });

  const mainQuery = normalizeSidebarQuery(mainSearch);
  const secondaryQuery = normalizeSidebarQuery(secondarySearch);
  const methodQuery = normalizeSidebarQuery(methodSearch);
  const hasSecondarySearch = secondarySearch.trim().length > 0;
  const hasMethodSearch = methodSearch.trim().length > 0;
  const filteredTriggerConnectionItems = triggerConnectionStep.items.filter((item) => matchesSidebarTitle(item.title, secondaryQuery, hasSecondarySearch));

  const translatedSidebarItems = sidebarItems.map((item) => ({
    key: item.key,
    title: t(item.titleKey),
    text: t(item.textKey),
  }));
  const filteredSidebarItems = translatedSidebarItems.filter((item) => matchesSidebarTitle(item.title, mainQuery, hasMainSearch));
  const selectedConnector = connectors.find((item) => getConnectorKey(item.connectorId) === selectedConnectorKey);
  const connectorItems = useMemo(
    () => connectors.map((connector) => {
      const status = getConnectorStatus(connector.lastTestPassed);
      return {
        key: getConnectorKey(connector.connectorId),
        title: connector.title,
        text: connector.description || t('sidebar.connectorMethodsFallback', { invoker: connector.invoker?.name ?? connector.title }),
        imageUrl: resolveConnectorIconUrl(normalizeConnectorIcon(connector.icon)),
        status,
        statusError: status === 'failed' ? connector.lastTestError : undefined,
      };
    }),
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
  const mainSearchConnectorItems = connectorItems.filter((item) => matchesSidebarTitle(item.title, mainQuery, hasMainSearch));
  const mainSearchOperatorItems = translatedOperatorItems.filter((item) => matchesSidebarTitle(item.title, mainQuery, hasMainSearch));
  const allMethodItems = useMemo(
    () => connectors.flatMap((connector) =>
      (connector.invoker?.operations ?? []).map((operation, index) => ({
        key: `${connector.connectorId}:${index}:${operation.name}`,
        title: operation.name,
        text: connector.title,
        imageUrl: resolveConnectorIconUrl(normalizeConnectorIcon(connector.icon)),
        connectorId: connector.connectorId,
        connectorIcon: normalizeConnectorIcon(connector.icon),
        operation,
      }))
    ),
    [connectors],
  );
  const mainSearchMethodItems = allMethodItems.filter((item) => matchesSidebarTitle(item.title, mainQuery, hasMainSearch));

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
  const sourceNodeLabel =
    selectedNode?.data.kind === 'connector'
      ? selectedNode.data.subtitle || selectedNode.data.title
      : selectedNode?.data.title || selectedNode?.id || '';
  const selectedConnectorIconUrl = resolveConnectorIconUrl(normalizeConnectorIcon(selectedConnector?.icon));

  return (
    <>
      <div className={`drawerOverlay ${action ? 'drawerOverlayOpen' : ''}`} onClick={closeSidebar} />
      <SidebarDrawer
        open={!!action}
        title={t('sidebar.chooseNextStep')}
        subtitle={t('sidebar.willBeAddedAfter', { name: sourceNodeLabel })}
        onClose={closeSidebar}
        shifted={!!activeSecondaryPanel}
        shiftedFar={methodOpen}
        secondary
      >
        <SidebarSearch placeholder={t('sidebar.searchPlaceholder')} value={mainSearch} onChange={setMainSearch} testId="workflow-sidebar-search-main" autoFocus={!!action} />
        {hasMainSearch ? (
          connectorsFetching ? (
            <div className="sidebarLoading">
              <Loading />
            </div>
          ) : mainSearchConnectorItems.length === 0 && mainSearchOperatorItems.length === 0 && mainSearchMethodItems.length === 0 ? (
            <button className="sidebarItem sidebarItemMuted" type="button" disabled>
              <strong>{t('sidebar.searchEmpty.title')}</strong>
              <span>{t('sidebar.searchEmpty.description')}</span>
            </button>
          ) : (
            <>
              {mainSearchConnectorItems.length > 0 && (
                <SidebarList
                  items={mainSearchConnectorItems}
                  testIdPrefix="workflow-sidebar-search-connector"
                  onSelect={(connectorKey) => {
                    setSelectedConnectorKey(connectorKey);
                    setActiveSecondaryPanel('connector');
                    setSecondarySearch('');
                    setMethodSearch('');
                  }}
                />
              )}
              {mainSearchOperatorItems.length > 0 && (
                <SidebarList
                  items={mainSearchOperatorItems}
                  testIdPrefix="workflow-sidebar-search-operator"
                  onSelect={(key) => {
                    onSelect(key as WorkflowCreateKind);
                    resetSidebar();
                  }}
                />
              )}
              {mainSearchMethodItems.length > 0 && (
                <SidebarList
                  items={mainSearchMethodItems}
                  testIdPrefix="workflow-sidebar-search-method"
                  onSelect={(key) => {
                    const found = mainSearchMethodItems.find((item) => item.key === key);
                    if (!found) return;
                    onSelect(
                      'connector',
                      found.operation.name,
                      { connectorId: found.connectorId, title: found.text, icon: found.connectorIcon },
                      found.operation,
                    );
                    resetSidebar();
                  }}
                />
              )}
            </>
          )
        ) : (
          <>
            <SidebarList items={filteredSidebarItems} onSelect={onSelectMain} testIdPrefix="workflow-sidebar-main" />
            <button
              className="sidebarItem sidebarItemStandalone"
              type="button"
              data-testid="workflow-sidebar-main-item-trigger-connection"
              onClick={() => {
                setSelectedConnectorKey(null);
                setActiveSecondaryPanel('trigger-connection');
              }}
            >
              <strong>{t('sidebar.triggerConnection.title')}</strong>
              <span>{t('sidebar.triggerConnection.description')}</span>
            </button>
          </>
        )}
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
        <SidebarSearch placeholder={secondaryPlaceholder} value={secondarySearch} onChange={setSecondarySearch} testId="workflow-sidebar-search-secondary" autoFocus={!!activeSecondaryPanel} />
        {activeSecondaryPanel === 'connector' ? (
          connectorsFetching ? (
            <div className="sidebarLoading">
              <Loading />
            </div>
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
        ) : activeSecondaryPanel === 'trigger-connection' ? (
          <TriggerConnectionPanel
            isFetching={triggerConnectionStep.isFetching}
            isError={triggerConnectionStep.isError}
            items={filteredTriggerConnectionItems}
            onSelect={triggerConnectionStep.onSelectConnection}
          />
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
        <SidebarSearch placeholder={methodPlaceholder} value={methodSearch} onChange={setMethodSearch} testId="workflow-sidebar-search-method" autoFocus={methodOpen} />
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

      <TriggerConnectionScheduleDialog
        key={triggerConnectionStep.scheduleDialogTarget?.connection.id ?? 'closed'}
        open={!!triggerConnectionStep.scheduleDialogTarget}
        connectionTitle={triggerConnectionStep.scheduleDialogTarget?.connection.title ?? ''}
        schedules={triggerConnectionStep.scheduleDialogTarget?.schedules ?? []}
        onCancel={triggerConnectionStep.onCancelScheduleDialog}
        onConfirm={triggerConnectionStep.onConfirmScheduleDialog}
      />
    </>
  );
}
