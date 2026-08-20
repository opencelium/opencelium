import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { SidebarList } from '../SidebarList/SidebarList';
import { SidebarMessage } from '../SidebarMessage/SidebarMessage';
import type { TriggerConnectionPanelProps } from './TriggerConnectionPanel.types';

export function TriggerConnectionPanel({ isFetching, isError, items, onSelect }: TriggerConnectionPanelProps) {
	const { t } = useI18n('workflow');

	if (isFetching) {
		return <div className='sidebarLoading'><Loading /></div>;
	}
	if (isError) {
		return <SidebarMessage title={t('sidebar.triggerConnectionStep.loadError.title')} description={t('sidebar.triggerConnectionStep.loadError.description')} />;
	}
	if (!items.length) {
		return <SidebarMessage title={t('sidebar.triggerConnectionStep.empty.title')} description={t('sidebar.triggerConnectionStep.empty.description')} />;
	}

	return <SidebarList items={items} testIdPrefix='workflow-sidebar-trigger-connection' onSelect={onSelect} />;
}
