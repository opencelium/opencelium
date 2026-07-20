import { useI18n } from '@shared/i18n/hooks/useI18n';
import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { SidebarList } from '../SidebarList/SidebarList';
import type { TriggerConnectionPanelProps } from './TriggerConnectionPanel.types';

export function TriggerConnectionPanel({ isFetching, isError, items, onSelect }: TriggerConnectionPanelProps) {
	const { t } = useI18n('workflow');

	if (isFetching) {
		return <div className='sidebarLoading'><Loading /></div>;
	}
	if (isError) {
		return (
			<button className='sidebarItem sidebarItemMuted' type='button' disabled>
				<strong>{t('sidebar.triggerConnectionStep.loadError.title')}</strong>
				<span>{t('sidebar.triggerConnectionStep.loadError.description')}</span>
			</button>
		);
	}
	if (!items.length) {
		return (
			<button className='sidebarItem sidebarItemMuted' type='button' disabled>
				<strong>{t('sidebar.triggerConnectionStep.empty.title')}</strong>
				<span>{t('sidebar.triggerConnectionStep.empty.description')}</span>
			</button>
		);
	}

	return <SidebarList items={items} testIdPrefix='workflow-sidebar-trigger-connection' onSelect={onSelect} />;
}
