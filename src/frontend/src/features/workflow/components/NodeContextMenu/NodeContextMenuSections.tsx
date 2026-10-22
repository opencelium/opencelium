import { useState } from 'react';
import { hasComponentPermission } from '@/engine/policy';
import { useAuth } from '@features/auth/useAuth';
import { filterMenuSections, menuByType, type NodeMenuActionId } from '../context-menu/contextMenuData';
import type { NodeContextMenuProps } from './NodeContextMenu.types';
import { NodeContextMenuRow } from './NodeContextMenuRow';

type Props = Pick<NodeContextMenuProps, 'menu' | 'node' | 'onClose' | 'onOpenRequestEditor'
  | 'onOpenConditionEditor' | 'onShowResponse' | 'onTryRequest' | 'onOpenAggregatorEditor' | 'onOpenConnectorEditor'> & {
  onEditLabel: () => void;
};

export function NodeContextMenuSections({ menu, node, onClose, onEditLabel,
  onOpenRequestEditor, onOpenConditionEditor, onShowResponse, onTryRequest, onOpenAggregatorEditor, onOpenConnectorEditor }: Props) {
  const { normalizedUser } = useAuth();
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  if (!menu) return null;
  // The image is the connector's, not the step's — editing it needs connector rights.
  const canUpdateConnector = hasComponentPermission(normalizedUser?.permissions ?? [], 'CONNECTOR', 'UPDATE');
  const sections = filterMenuSections(menuByType[menu.kind] || [],
    (id) => id !== 'change-connector-image' || canUpdateConnector);

  const run = (id: NodeMenuActionId) => {
    switch (id) {
      case 'change-label': return onEditLabel();
      case 'open-config':
        if (node?.type === 'if' || node?.type === 'loop') onOpenConditionEditor(menu.nodeId);
        break;
      case 'edit-url': onOpenRequestEditor(menu.nodeId, 'url'); break;
      case 'edit-headers': onOpenRequestEditor(menu.nodeId, 'header'); break;
      case 'edit-body': onOpenRequestEditor(menu.nodeId, 'body'); break;
      case 'show-response': onShowResponse(menu.nodeId); break;
      case 'try-request': onTryRequest(menu.nodeId); break;
      case 'configure-aggregator': onOpenAggregatorEditor(menu.nodeId); break;
      case 'change-connector': onOpenConnectorEditor(menu.nodeId, 'switch'); break;
      case 'change-connector-image': onOpenConnectorEditor(menu.nodeId, 'image'); break;
      default: {
        const _exhaustive: never = id;
        return _exhaustive;
      }
    }
    onClose();
  };

  return <div className="contextMenuSections">{sections.map((section) =>
    <div key={section.id} className="contextMenuSection">
      {section.rows.map((row) => {
        const rowId = row.kind === 'action' ? row.action.id : row.id;
        return <NodeContextMenuRow key={rowId} row={row} isExpanded={expandedRowId === rowId} onRun={run}
          onToggle={() => setExpandedRowId((current) => current === rowId ? null : rowId)} />;
      })}
    </div>)}</div>;
}
