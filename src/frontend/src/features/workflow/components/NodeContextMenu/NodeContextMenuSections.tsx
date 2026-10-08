import { buildTestId } from '@shared/testing/testId';
import { useI18n } from '@shared/i18n/hooks/useI18n';
import { hasComponentPermission } from '@/engine/policy';
import { useAuth } from '@features/auth/useAuth';
import { menuByType } from '../context-menu/contextMenuData';
import { buildContextMenuEntries, filterEntriesForSection } from '../context-menu/contextMenuEntries';
import type { NodeContextMenuProps } from './NodeContextMenu.types';

type Props = Pick<NodeContextMenuProps, 'menu' | 'node' | 'onClose' | 'onOpenRequestEditor'
  | 'onOpenConditionEditor' | 'onShowResponse' | 'onOpenAggregatorEditor' | 'onOpenConnectorEditor'> & {
  onEditLabel: () => void;
};

export function NodeContextMenuSections({ menu, node, onClose, onEditLabel,
  onOpenRequestEditor, onOpenConditionEditor, onShowResponse, onOpenAggregatorEditor, onOpenConnectorEditor }: Props) {
  const { t } = useI18n('workflow');
  const { normalizedUser } = useAuth();
  if (!menu) return null;
  // The image is the connector's, not the step's — editing it needs connector rights.
  const canUpdateConnector = hasComponentPermission(normalizedUser?.permissions ?? [], 'CONNECTOR', 'UPDATE');
  const sections = (menuByType[menu.kind] || []).map((section) => ({ ...section,
    items: section.items.filter((item) => item.id !== 'change-connector-image' || canUpdateConnector) }));
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
    if (id === 'change-connector') onOpenConnectorEditor(menu.nodeId, 'switch');
    if (id === 'change-connector-image') onOpenConnectorEditor(menu.nodeId, 'image');
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
