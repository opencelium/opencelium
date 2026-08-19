import { buildTestId } from '@shared/testing/testId';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { menuByType } from '../context-menu/contextMenuData';
import { buildContextMenuEntries, filterEntriesForSection } from '../context-menu/contextMenuEntries';
import type { NodeContextMenuProps } from './NodeContextMenu.types';

type Props = Pick<NodeContextMenuProps, 'menu' | 'node' | 'onClose' | 'onOpenRequestEditor'
  | 'onOpenConditionEditor' | 'onShowResponse' | 'onOpenAggregatorEditor'> & {
  onEditLabel: () => void;
};

export function NodeContextMenuSections({ menu, node, onClose, onEditLabel,
  onOpenRequestEditor, onOpenConditionEditor, onShowResponse, onOpenAggregatorEditor }: Props) {
  const { t } = useI18n('workflow');
  if (!menu) return null;
  const sections = menuByType[menu.kind] || [];
  const entries = buildContextMenuEntries(sections);

  const select = (id: string) => {
    if (id === 'change-label') return onEditLabel();
    if (id === 'open-config' && (node?.type === 'if' || node?.type === 'loop')) {
      onOpenConditionEditor(menu.nodeId);
    }
    if (id === 'edit-url') onOpenRequestEditor(menu.nodeId, 'url');
    if (id === 'edit-headers') onOpenRequestEditor(menu.nodeId, 'header');
    if (id === 'edit-body') onOpenRequestEditor(menu.nodeId, 'body');
    if (id === 'show-response') onShowResponse(menu.nodeId);
    if (id === 'configure-aggregator') onOpenAggregatorEditor(menu.nodeId);
    onClose();
  };

  return <div className="contextMenuSections">{sections.map((section) =>
    <div key={section.id} className="contextMenuSection">
      {filterEntriesForSection(section, entries).map((entry) => entry.type === 'label'
        ? <div key={entry.id} className="contextMenuGroupLabel">{t(entry.labelKey)}</div>
        : <button key={entry.id}
          className={`contextMenuItem ${entry.indented ? 'contextMenuItemIndented' : ''}`}
          type="button" data-testid={buildTestId('workflow-context-menu', entry.item.id)}
          onClick={() => select(entry.item.id)}>{t(entry.item.labelKey)}</button>) }
    </div>)}</div>;
}
