import { Loading } from '@shared/ui/primitives/Loading/Loading';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { SidebarList } from './SidebarList/SidebarList';

type Props = {
  isFetching: boolean;
  isError: boolean;
  items: { key: string; title: string; text: string; disabled?: boolean }[];
  onSelect: (key: string) => void;
};

export function TriggerConnectionPanel({ isFetching, isError, items, onSelect }: Props) {
  const { t } = useI18n('workflow');

  if (isFetching) {
    return (
      <div className="sidebarLoading">
        <Loading />
      </div>
    );
  }

  if (isError) {
    return (
      <button className="sidebarItem sidebarItemMuted" type="button" disabled>
        <strong>{t('sidebar.triggerConnectionStep.loadError.title')}</strong>
        <span>{t('sidebar.triggerConnectionStep.loadError.description')}</span>
      </button>
    );
  }

  if (!items.length) {
    return (
      <button className="sidebarItem sidebarItemMuted" type="button" disabled>
        <strong>{t('sidebar.triggerConnectionStep.empty.title')}</strong>
        <span>{t('sidebar.triggerConnectionStep.empty.description')}</span>
      </button>
    );
  }

  return <SidebarList items={items} testIdPrefix="workflow-sidebar-trigger-connection" onSelect={onSelect} />;
}
