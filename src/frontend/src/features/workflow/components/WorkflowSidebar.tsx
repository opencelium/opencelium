import { useEffect, useState } from 'react';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import type { InvokerOperation } from '@entities/invoker/model/types';
import type { WorkflowAction, WorkflowCreateKind, WorkflowNodeModel, WorkflowTriggerConnectionRef } from '../types/workflow.types';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { SidebarDrawer } from './sidebar/SidebarDrawer/SidebarDrawer';
import { SidebarList } from './sidebar/SidebarList/SidebarList';
import { SidebarMessage } from './sidebar/SidebarMessage/SidebarMessage';
import { SidebarSearch } from './sidebar/SidebarSearch/SidebarSearch';
import { TriggerConnectionPanel } from './sidebar/TriggerConnectionPanel/TriggerConnectionPanel';
import { TriggerConnectionScheduleDialog } from './sidebar/TriggerConnectionScheduleDialog/TriggerConnectionScheduleDialog';
import { useTriggerConnectionStep } from './sidebar/useTriggerConnectionStep';
import { getMethodSidebarCopy, getSecondarySidebarCopy, type SecondarySidebarMode } from './sidebar/sidebarSecondary';
import { matchesSidebarTitle, normalizeSidebarQuery } from './sidebar/sidebar.helpers';
import { resolveConnectorIconUrl } from '@entities/connector/model/iconUrl';
import { getMethodKey, normalizeConnectorIcon, useWorkflowSidebarItems } from './WorkflowSidebar/useWorkflowSidebarItems';
import { MainSidebarDrawer } from './WorkflowSidebar/MainSidebarDrawer';

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

  const {
    connectorsError,
    connectorsFetching,
    filteredConnectorItems,
    filteredMethodItems,
    filteredOperatorItems,
    filteredSidebarItems,
    hasMainSearch,
    mainSearchConnectorItems,
    mainSearchMethodItems,
    mainSearchOperatorItems,
    methodOperations,
    selectedConnector,
  } = useWorkflowSidebarItems({ activeSecondaryPanel, selectedConnectorKey, mainSearch, secondarySearch, methodSearch });

  const triggerConnectionStep = useTriggerConnectionStep({
    active: activeSecondaryPanel === 'trigger-connection',
    excludeConnectionId: connectionId ? Number(connectionId) : undefined,
    onFinalize: (triggerConnection) => {
      onSelect('trigger-connection', undefined, undefined, undefined, triggerConnection);
      resetSidebar();
    },
  });

  const hasSecondarySearch = secondarySearch.trim().length > 0;
  const secondaryQuery = normalizeSidebarQuery(secondarySearch);
  const filteredTriggerConnectionItems = triggerConnectionStep.items.filter((item) => matchesSidebarTitle(item.title, secondaryQuery, hasSecondarySearch));

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
      <MainSidebarDrawer
        open={!!action}
        shifted={!!activeSecondaryPanel}
        shiftedFar={methodOpen}
        sourceNodeLabel={sourceNodeLabel}
        search={mainSearch}
        hasSearch={hasMainSearch}
        isFetching={connectorsFetching}
        defaultItems={filteredSidebarItems}
        connectorItems={mainSearchConnectorItems}
        operatorItems={mainSearchOperatorItems}
        methodItems={mainSearchMethodItems}
        onSearchChange={setMainSearch}
        onClose={closeSidebar}
        onSelectMain={onSelectMain}
        onSelectConnector={(connectorKey) => {
          setSelectedConnectorKey(connectorKey);
          setActiveSecondaryPanel('connector');
          setSecondarySearch('');
          setMethodSearch('');
        }}
        onSelectOperator={(key) => {
          onSelect(key as WorkflowCreateKind);
          resetSidebar();
        }}
        onSelectMethod={(key) => {
          const found = mainSearchMethodItems.find((item) => item.key === key);
          if (!found) return;
          onSelect('connector', found.operation.name, { connectorId: found.connectorId, title: found.text, icon: found.connectorIcon }, found.operation);
          resetSidebar();
        }}
        onSelectTriggerConnection={() => {
          setSelectedConnectorKey(null);
          setActiveSecondaryPanel('trigger-connection');
        }}
      />

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
            <SidebarMessage title={t('sidebar.connectorsError.title')} description={t('sidebar.connectorsError.description')} />
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
            <SidebarMessage title={t('sidebar.connectorsEmpty.title')} description={t('sidebar.connectorsEmpty.description')} />
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
          <SidebarMessage title={t('sidebar.methodsEmpty.title')} description={t('sidebar.methodsEmpty.description')} />
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
