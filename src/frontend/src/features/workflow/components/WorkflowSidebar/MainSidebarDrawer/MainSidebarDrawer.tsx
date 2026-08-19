import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { SidebarDrawer } from '../../sidebar/SidebarDrawer/SidebarDrawer';
import { SidebarList } from '../../sidebar/SidebarList/SidebarList';
import { SidebarMessage } from '../../sidebar/SidebarMessage/SidebarMessage';
import { SidebarSearch } from '../../sidebar/SidebarSearch/SidebarSearch';
import type { MainSidebarDrawerProps } from './MainSidebarDrawer.types';

export function MainSidebarDrawer(props: MainSidebarDrawerProps) {
  const { t } = useI18n('workflow');
  const hasResults = props.connectorItems.length || props.operatorItems.length || props.methodItems.length;
  return <SidebarDrawer open={props.open} title={t('sidebar.chooseNextStep')}
    subtitle={t('sidebar.willBeAddedAfter', { name: props.sourceNodeLabel })}
    onClose={props.onClose} shifted={props.shifted} shiftedFar={props.shiftedFar} secondary>
    <SidebarSearch placeholder={t('sidebar.searchPlaceholder')} value={props.search}
      onChange={props.onSearchChange} testId="workflow-sidebar-search-main" autoFocus={props.open} />
    {props.hasSearch ? props.isFetching
      ? <div className="sidebarLoading"><Loading /></div>
      : !hasResults ? <SidebarMessage title={t('sidebar.searchEmpty.title')}
        description={t('sidebar.searchEmpty.description')} />
      : <>{props.connectorItems.length > 0 && <SidebarList items={props.connectorItems}
          testIdPrefix="workflow-sidebar-search-connector" onSelect={props.onSelectConnector} />}
        {props.operatorItems.length > 0 && <SidebarList items={props.operatorItems}
          testIdPrefix="workflow-sidebar-search-operator" onSelect={props.onSelectOperator} />}
        {props.methodItems.length > 0 && <SidebarList items={props.methodItems}
          testIdPrefix="workflow-sidebar-search-method" onSelect={props.onSelectMethod} />}</>
      : <SidebarList items={props.defaultItems} onSelect={props.onSelectMain}
          testIdPrefix="workflow-sidebar-main" />}
  </SidebarDrawer>;
}
