import { useI18n } from '@shared/i18n/hooks/useI18n';
import { SidebarDrawer } from '../../sidebar/SidebarDrawer/SidebarDrawer';
import { SidebarList } from '../../sidebar/SidebarList/SidebarList';
import { SidebarMessage } from '../../sidebar/SidebarMessage/SidebarMessage';
import { SidebarSearch } from '../../sidebar/SidebarSearch/SidebarSearch';
import type { MethodSidebarDrawerProps } from './MethodSidebarDrawer.types';

export function MethodSidebarDrawer(props: MethodSidebarDrawerProps) {
  const { t } = useI18n('workflow');
  return <SidebarDrawer open={props.open} title={props.title} subtitle={props.subtitle}
    connectorIcon={props.connectorIcon} onClose={props.onClose} tertiary>
    <SidebarSearch placeholder={props.placeholder} value={props.search}
      onChange={props.onSearchChange} testId="workflow-sidebar-search-method"
      autoFocus={props.open} />
    {props.items.length
      ? <SidebarList items={props.items} testIdPrefix="workflow-sidebar-method"
        onSelect={props.onSelect} />
      : <SidebarMessage title={t('sidebar.methodsEmpty.title')}
        description={t('sidebar.methodsEmpty.description')} />}
  </SidebarDrawer>;
}
