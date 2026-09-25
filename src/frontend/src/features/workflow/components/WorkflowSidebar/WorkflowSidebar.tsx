import { useI18n } from '@shared/i18n/hooks/useI18n';
import { TriggerConnectionScheduleDialog } from '../sidebar/TriggerConnectionScheduleDialog/TriggerConnectionScheduleDialog';
import { useTriggerConnectionStep } from '../sidebar/useTriggerConnectionStep';
import { getMethodSidebarCopy, getSecondarySidebarCopy } from '../sidebar/sidebarSecondary';
import { matchesSidebarTitle, normalizeSidebarQuery } from '../sidebar/sidebar.helpers';
import { resolveConnectorIcon } from '@entities/connector/model/iconUrl';
import { useWorkflowSidebarItems } from './useWorkflowSidebarItems';
import { MainSidebarDrawer } from './MainSidebarDrawer/MainSidebarDrawer';
import { SecondarySidebarDrawer } from './SecondarySidebarDrawer/SecondarySidebarDrawer';
import { MethodSidebarDrawer } from './MethodSidebarDrawer/MethodSidebarDrawer';
import { useWorkflowSidebarState } from './useWorkflowSidebarState';
import type { WorkflowSidebarProps } from './WorkflowSidebar.types';
import { useWorkflowSidebarSelection } from './useWorkflowSidebarSelection';
import { useConnectorCreateAction } from './useConnectorCreateAction';
import { useConnectorUpdateAction } from './useConnectorUpdateAction';

export function WorkflowSidebar({ action, selectedNode, connectionId, onClose, onSelect }: WorkflowSidebarProps) {
  const { t } = useI18n('workflow');
  const sidebar = useWorkflowSidebarState({ open: !!action, onClose,
    onSelectSystem: () => onSelect('system') });
  const { activeSecondaryPanel, selectedConnectorKey, mainSearch, secondarySearch, methodSearch, resetSidebar } = sidebar;

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

  const hasSecondarySearch = secondarySearch.trim().length > 0, secondaryQuery = normalizeSidebarQuery(secondarySearch);
  const filteredTriggerConnectionItems = triggerConnectionStep.items.filter((item) => matchesSidebarTitle(item.title, secondaryQuery, hasSecondarySearch));

  const [secondaryTitle, secondarySubtitle, secondaryPlaceholder] = getSecondarySidebarCopy(activeSecondaryPanel ?? 'connector', t);
  const [methodTitle, methodSubtitle, methodPlaceholder] = getMethodSidebarCopy(t, selectedConnector?.title);
  const methodOpen = activeSecondaryPanel === 'connector' && !!selectedConnectorKey;
  const sourceNodeLabel = selectedNode?.data.kind === 'connector'
    ? selectedNode.data.subtitle || selectedNode.data.title
    : selectedNode?.data.title || selectedNode?.id || '';
  const selectedConnectorIcon = selectedConnector ? resolveConnectorIcon(selectedConnector) : null;
  const selection = useWorkflowSidebarSelection({ onSelect, resetSidebar,
    mainSearchMethodItems, methodOperations, selectedConnector });
  const connectorUpdateAction = useConnectorUpdateAction();
  const openConnectorCreate = useConnectorCreateAction();

  return (
    <>
      <div className={`drawerOverlay ${action ? 'drawerOverlayOpen' : ''}`} onClick={sidebar.closeSidebar} />
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
        connectorUpdateAction={connectorUpdateAction}
        operatorItems={mainSearchOperatorItems}
        methodItems={mainSearchMethodItems}
        onSearchChange={sidebar.setMainSearch}
        onClose={sidebar.closeSidebar}
        onSelectMain={sidebar.onSelectMain}
        onSelectConnector={sidebar.openConnector}
        onSelectOperator={selection.selectOperator}
        onSelectMethod={selection.selectSearchMethod}
      />

      <SecondarySidebarDrawer
        mode={activeSecondaryPanel}
        title={secondaryTitle}
        subtitle={secondarySubtitle}
        placeholder={secondaryPlaceholder}
        search={secondarySearch}
        shifted={methodOpen}
        connectorsFetching={connectorsFetching}
        connectorsError={connectorsError}
        connectorItems={filteredConnectorItems}
        connectorUpdateAction={connectorUpdateAction}
        onCreateConnector={openConnectorCreate}
        operatorItems={filteredOperatorItems}
        triggerItems={filteredTriggerConnectionItems}
        triggerFetching={triggerConnectionStep.isFetching}
        triggerError={triggerConnectionStep.isError}
        onSearchChange={sidebar.setSecondarySearch}
        onClose={sidebar.closeSecondary}
        onSelectConnector={sidebar.selectConnector}
        onSelectOperator={selection.selectOperator}
        onSelectTrigger={triggerConnectionStep.onSelectConnection}
      />

      <MethodSidebarDrawer
        open={methodOpen}
        title={methodTitle}
        subtitle={methodSubtitle}
        connectorIcon={selectedConnectorIcon}
        placeholder={methodPlaceholder}
        search={methodSearch}
        items={filteredMethodItems}
        onSearchChange={sidebar.setMethodSearch}
        onClose={sidebar.closeMethod}
        onSelect={selection.selectMethod}
      />

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
