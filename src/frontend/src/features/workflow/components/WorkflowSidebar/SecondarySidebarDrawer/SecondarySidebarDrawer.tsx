import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { SidebarDrawer } from '../../sidebar/SidebarDrawer/SidebarDrawer';
import { SidebarList } from '../../sidebar/SidebarList/SidebarList';
import { SidebarMessage } from '../../sidebar/SidebarMessage/SidebarMessage';
import { SidebarSearch } from '../../sidebar/SidebarSearch/SidebarSearch';
import { TriggerConnectionPanel } from '../../sidebar/TriggerConnectionPanel/TriggerConnectionPanel';
import type { SecondarySidebarDrawerProps } from './SecondarySidebarDrawer.types';

export function SecondarySidebarDrawer(props: SecondarySidebarDrawerProps) {
  const { t } = useI18n('workflow');
  const content = props.mode === 'connector'
    ? props.connectorsFetching ? <div className="sidebarLoading"><Loading /></div>
      : props.connectorsError ? <SidebarMessage title={t('sidebar.connectorsError.title')}
        description={t('sidebar.connectorsError.description')} />
      : props.connectorItems.length ? <SidebarList items={props.connectorItems}
        testIdPrefix="workflow-sidebar-connector" onSelect={props.onSelectConnector} />
      : <SidebarMessage title={t('sidebar.connectorsEmpty.title')}
        description={t('sidebar.connectorsEmpty.description')} />
    : props.mode === 'trigger-connection'
      ? <TriggerConnectionPanel isFetching={props.triggerFetching} isError={props.triggerError}
        items={props.triggerItems} onSelect={props.onSelectTrigger} />
      : <SidebarList items={props.operatorItems} testIdPrefix="workflow-sidebar-operator"
        onSelect={props.onSelectOperator} />;

  return <SidebarDrawer open={Boolean(props.mode)} title={props.title} subtitle={props.subtitle}
    onClose={props.onClose} secondary shifted={props.shifted}>
    <SidebarSearch placeholder={props.placeholder} value={props.search}
      onChange={props.onSearchChange} testId="workflow-sidebar-search-secondary"
      autoFocus={Boolean(props.mode)} />
    {content}
  </SidebarDrawer>;
}
